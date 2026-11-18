#!/usr/bin/env python3
"""Deterministic steps of the daily article pipeline.

Both workflow engines (Lobster, nika) call the same subcommands, so the only
thing that differs between them is the orchestration. Each step reads and
writes files in a run directory and prints one JSON object on stdout.

    forge.py init --engine lobster [--force]
    forge.py pick|research|outline|draft|review1|revise|review2|image|publish|notify --run DIR
    forge.py fail --run DIR --reason TEXT
"""
import fcntl, argparse, datetime, difflib, json, os, random, re, subprocess, sys, time, urllib.request, urllib.error
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[2]
AUTO = ROOT / "automation"
WORK = AUTO / "work"
LOGS = AUTO / "logs"
PROMPTS = AUTO / "prompts"
CLAIMS = ROOT / "content" / "ideas" / "claims"
QUEUE = ROOT / "content" / "ideas" / "queue.md"
ARTICLES = ROOT / "content" / "articles"
SITE = "https://ancestralforge.org"
TG_TARGET = "1689167409"
OPENCLAW = os.environ.get("OPENCLAW_BIN", "openclaw")
SSH_IMG = ["ssh", "-F", "/dev/null", "-i", os.path.expanduser("~/.ssh/forge_img"), "-o", "IdentitiesOnly=yes", "-o", "BatchMode=yes",
           "-o", "ConnectTimeout=15", "mi4u@192.168.1.137"]
REVIEW_MODEL = os.environ.get("FORGE_REVIEW_MODEL", "claude-cli/claude-sonnet-5-5")
REVISE_MODEL = os.environ.get("FORGE_REVISE_MODEL", "openai-codex/gpt-5.5")

ILLUSTRATION = {"the-apothecary": "herb-bundle", "the-living-pantry": "ferment-jar", "the-forge": "ice-house", "field-notes": "herb-bundle"}
PERSONAS = AUTO / "personas"
PERSONA_OF_ENGINE = {"lobster": "silas-whitford", "nika": "r-halloway", "local": "e-whittier"}
LOCAL_URL = os.environ.get("FORGE_LOCAL_URL", "http://salonpc.tail4ce15.ts.net:8095")
LOCAL_MODEL = os.environ.get("FORGE_LOCAL_MODEL", "ornith")
FALLBACK_HERO = {
    "the-apothecary": "/images/field-medic-kit-hero.png",
    "the-living-pantry": "/images/4am-sourdough-hero.png",
    "the-forge": "/images/rocket-stoves-hero.png",
    "field-notes": "/images/how-to-read-landscape-hero.png",
}
BANNED = ["genuinely", "extraordinary", "significantly", "straightforward", "crucial", "streamline",
          "empower", "elevate", "facilitate", "underscore", "nuanced", "multifaceted", "moreover",
          "furthermore", "in conclusion", "to summarise", "to summarize", "it's worth noting", "it is worth noting",
          "it's important to note", "delve", "paradigm", "synergy", "pivotal",
          "groundbreaking", "cutting-edge", "seamless", "utilise", "utilize", "tapestry", "game-changer"]
SOFT_BANNED = ["foster", "realm", "leverage", "unlock", "holistic", "landscape", "robust", "harness", "navigate"]
EM = chr(0x2014)
MED_BOX = "**Not medical advice.**"


def now():
    return datetime.datetime.now(ZoneInfo("Europe/Warsaw"))


def sh(cmd, cwd=ROOT, check=True, timeout=300, input=None):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout, input=input)
    if check and r.returncode != 0:
        raise RuntimeError(f"{' '.join(map(str, cmd[:3]))} failed: {(r.stderr or r.stdout).strip()[:400]}")
    return r


def load(run):
    return json.loads((Path(run) / "state.json").read_text())


def save(run, st):
    (Path(run) / "state.json").write_text(json.dumps(st, indent=2, ensure_ascii=False))


def out(obj):
    print(json.dumps(obj, ensure_ascii=False))


def telegram(text):
    try:
        sh([OPENCLAW, "message", "send", "--channel", "telegram", "--target", TG_TARGET, "--message", text], timeout=90)
    except Exception as e:
        sys.stderr.write(f"telegram failed: {e}\n")


def fail(run, reason, release=True):
    st = load(run)
    st["status"] = "failed"
    st["reason"] = reason
    save(run, st)
    if not (WORK / ".quiet").exists():
        telegram(f"The Ancestral Forge [{st['engine']}]: no article today. Reason: {reason[:400]}")
    if release and st.get("slug"):
        try:
            claim = CLAIMS / f"{st['slug']}.json"
            if claim.exists():
                c = json.loads(claim.read_text())
                if c.get("status") == "published":
                    raise RuntimeError("claim already published, left alone")
                c["status"] = "failed"
                c["reason"] = reason[:200]
                claim.write_text(json.dumps(c, indent=2))
                paths = [claim]
                lock = CLAIMS / f"day-{st['date']}.json"
                if lock.exists() and json.loads(lock.read_text()).get("slug") == st["slug"]:
                    lock.unlink()
                    paths.append(lock)
                git_sync_push(f"claim: {st['slug']} failed ({st['engine']})", paths, tries=2)
        except Exception as e:
            sys.stderr.write(f"claim release failed: {e}\n")
    log_run(st)
    sys.stderr.write(f"FAILED: {reason}\n")
    out({"ok": False, "reason": reason})
    sys.exit(1)


def log_run(st):
    LOGS.mkdir(exist_ok=True)
    with open(LOGS / "runs.jsonl", "a") as f:
        f.write(json.dumps({k: st.get(k) for k in ("run_id", "engine", "slug", "author", "free", "status", "reason", "image", "steps", "date")}) + "\n")


# ---------------------------------------------------------------- git

def git_reset_to_origin():
    sh(["git", "fetch", "-q", "origin", "main"], timeout=120)
    sh(["git", "reset", "-q", "--hard", "origin/main"])


def git_sync_push(message, paths, tries=4):
    """Commit paths and push. On a lost race, drop the unpushed commit, re-apply the files and retry."""
    snapshot = {}
    for p in paths:
        p = Path(p)
        files = [q for q in p.rglob("*") if q.is_file()] if p.is_dir() else [p]
        for q in files:
            snapshot[str(q)] = q.read_bytes() if q.exists() else None
    for attempt in range(tries):
        sh(["git", "add", "-A", "--"] + [str(p) for p in paths])
        sh(["git", "commit", "-q", "-m", message])
        r = sh(["git", "push", "-q", "origin", "main"], check=False, timeout=180)
        if r.returncode == 0:
            return True
        git_reset_to_origin()
        for p, data in snapshot.items():
            if data is not None:
                Path(p).parent.mkdir(parents=True, exist_ok=True)
                Path(p).write_bytes(data)
        time.sleep(2 + random.random() * 3)
    return False


# ---------------------------------------------------------------- queue / claims

def parse_queue():
    items, cur = [], None
    for line in QUEUE.read_text().splitlines():
        m = re.match(r"^- slug:\s*(\S+)", line)
        if m:
            cur = {"slug": m.group(1)}
            items.append(cur)
            continue
        m = re.match(r"^\s+(category|safety|title|angle):\s*(.+)$", line)
        if m and cur is not None:
            cur[m.group(1)] = m.group(2).strip()
    return [i for i in items if {"category", "title", "angle"} <= i.keys()]


def existing_articles():
    res = []
    for d in sorted(ARTICLES.iterdir()):
        f = d / "index.md"
        if f.exists():
            t = re.search(r'^title:\s*"?(.+?)"?\s*$', f.read_text(), re.M)
            res.append((d.name, (t.group(1) if t else d.name).lower()))
    return res


def words(s):
    stop = {"the", "a", "an", "and", "of", "to", "in", "for", "how", "your", "with", "what", "why", "is", "at"}
    return {w for w in re.findall(r"[a-z]+", s.lower()) if w not in stop and len(w) > 2}


def duplicate_of(topic, arts):
    tw = words(topic["slug"].replace("-", " ") + " " + topic["title"])
    for slug, title in arts:
        aw = words(slug.replace("-", " ") + " " + title)
        jac = len(tw & aw) / max(1, len(tw | aw))
        ratio = difflib.SequenceMatcher(None, topic["title"].lower(), title).ratio()
        if topic["slug"] == slug or jac >= 0.5 or ratio >= 0.8:
            return slug
    return None


def cmd_init(a):
    d = now()
    run_id = f"{d:%Y%m%d-%H%M%S}-{a.engine}"
    run = WORK / run_id
    run.mkdir(parents=True, exist_ok=True)
    st = {"run_id": run_id, "engine": a.engine, "date": f"{d:%Y-%m-%d}", "force": bool(a.force or os.environ.get("FORGE_FORCE") == "1"), "status": "running", "steps": {}}
    save(run, st)
    out({"run": str(run), "engine": a.engine})


def timed(run, name, fn):
    t = time.time()
    try:
        res = fn()
    except SystemExit:
        raise
    except Exception as e:
        fail(run, f"step {name}: {e}")
    st = load(run)
    st["steps"].setdefault(name, {})["seconds"] = round(time.time() - t, 1)
    save(run, st)
    return res


def locked(fn):
    def wrapper(*args, **kw):
        with open(WORK / ".git-lock", "w") as lf:
            fcntl.flock(lf, fcntl.LOCK_EX)
            return fn(*args, **kw)
    return wrapper


def cmd_pick(a):
    @locked
    def go():
        st = load(a.run)
        if st["engine"] == "local":
            try:
                local_call("/v1/models", timeout=20)
            except Exception as e:
                fail(a.run, f"local engine: salonpc llama-swap is not reachable ({str(e)[:80]}); no cloud fallback by design", release=False)
        for attempt in range(6):
            git_reset_to_origin()
            CLAIMS.mkdir(parents=True, exist_ok=True)
            claimed, attempts = set(), {}
            for p in CLAIMS.glob("*.json"):
                if p.stem.startswith("day-"):
                    continue
                cj = json.loads(p.read_text())
                attempts[p.stem] = cj.get("attempts", 1)
                if not (cj.get("status") == "failed" and cj.get("attempts", 1) < 2):
                    claimed.add(p.stem)
            day_lock = CLAIMS / f"day-{st['date']}.json"
            if not st["force"] and day_lock.exists():
                st["status"] = "skipped"
                st["reason"] = "an article was already claimed today"
                save(a.run, st)
                log_run(st)
                out({"skipped": True, "reason": st["reason"]})
                sys.exit(0)
            arts = existing_articles()
            chosen = None
            queue = parse_queue()
            retry = [t for t in queue if t["slug"] in attempts and t["slug"] not in claimed and attempts[t["slug"]] < 2]
            for t in retry + [t for t in queue if t not in retry]:
                if t["slug"] in claimed:
                    continue
                dup = duplicate_of(t, arts)
                if dup:
                    st.setdefault("skipped_duplicates", []).append(f"{t['slug']}~{dup}")
                    continue
                chosen = t
                break
            if not chosen:
                raise RuntimeError("topic queue is empty or every topic is claimed or a duplicate")
            claim = {"slug": chosen["slug"], "engine": st["engine"], "date": st["date"], "status": "claimed",
                     "claimedAt": now().isoformat(timespec="seconds"), "run": st["run_id"],
                     "attempts": attempts.get(chosen["slug"], 0) + 1}
            paths = []
            c = CLAIMS / f"{chosen['slug']}.json"
            c.write_text(json.dumps(claim, indent=2))
            paths.append(c)
            if not st["force"]:
                day_lock.write_text(json.dumps({"date": st["date"], "slug": chosen["slug"], "engine": st["engine"]}, indent=2))
                paths.append(day_lock)
            sh(["git", "add", "-A", "--"] + [str(p) for p in paths])
            sh(["git", "commit", "-q", "-m", f"claim: {chosen['slug']} ({st['engine']})"])
            r = sh(["git", "push", "-q", "origin", "main"], check=False, timeout=180)
            if r.returncode == 0:
                break
            time.sleep(1 + random.random() * 3)
        else:
            raise RuntimeError("could not claim a topic after 6 attempts (push races)")
        pn, pr, _ = load_persona(st["engine"])
        st.update(slug=chosen["slug"], title=chosen["title"], category=chosen["category"], angle=chosen["angle"],
                  safety=chosen.get("safety", "none"), author=pn, author_role=pr, illustration=ILLUSTRATION[chosen["category"]])
        save(a.run, st)
        return {"slug": st["slug"], "title": st["title"], "category": st["category"], "engine": st["engine"]}

    out(timed(a.run, "pick", go))


# ---------------------------------------------------------------- agents

def load_persona(engine):
    txt = (PERSONAS / f"{PERSONA_OF_ENGINE[engine]}.md").read_text()
    meta = dict(re.findall(r"^(name|role):\s*(.+)$", txt, re.M))
    return meta["name"], meta["role"], txt


def local_key():
    for line in (Path.home() / ".openclaw" / ".env").read_text().splitlines():
        if line.startswith("LLAMA_SWAP_KEY="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise RuntimeError("LLAMA_SWAP_KEY not found")


def local_call(path, payload=None, timeout=60, method=None):
    req = urllib.request.Request(LOCAL_URL + path, data=json.dumps(payload).encode() if payload is not None else None,
                                 method=method, headers={"Authorization": "Bearer " + local_key(), "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode() or "{}")


def local_chat(run, step, message, timeout=900):
    system = (AUTO / "agents" / "redaktor-AGENTS.md").read_text()
    (Path(run) / f"{step}.prompt.txt").write_text(message)
    j = local_call("/v1/chat/completions", {"model": LOCAL_MODEL, "temperature": 0.7, "max_tokens": 12000,
                   "messages": [{"role": "system", "content": system}, {"role": "user", "content": message}]}, timeout=timeout)
    text = re.sub(r"<think>[\s\S]*?</think>", "", j["choices"][0]["message"].get("content") or "").strip()
    if not text:
        raise RuntimeError("local model returned no text")
    st = load(run)
    stp = st["steps"].setdefault(step, {})
    stp["tokens"] = (j.get("usage") or {}).get("total_tokens")
    stp["model"] = "local/" + LOCAL_MODEL
    save(run, st)
    (Path(run) / f"{step}.out.txt").write_text(text)
    return text


def fill(template, st, **extra):
    vals = {"TITLE": st.get("title", ""), "ANGLE": st.get("angle", ""), "CATEGORY": st.get("category", ""),
            "SAFETY": st.get("safety", "none"), "AUTHOR": st.get("author", ""), "AUTHOR_ROLE": st.get("author_role", ""),
            "ILLUSTRATION": st.get("illustration", ""), "DATE": st.get("date", ""), "SLUG": st.get("slug", ""),
            "PERSONA": load_persona(st["engine"])[2] if st.get("engine") in PERSONA_OF_ENGINE else ""}
    vals.update(extra)
    for k, v in vals.items():
        template = template.replace("{{" + k + "}}", str(v))
    return template


def agent(run, step, agent_id, message, timeout=900, model=None, thinking=None):
    st = load(run)
    if st["engine"] == "local" and agent_id == "redaktor":
        return local_chat(run, step, message, timeout)
    mf = Path(run) / f"{step}.prompt.txt"
    mf.write_text(message)
    cmd = [OPENCLAW, "agent", "--agent", agent_id, "--session-key", f"forge:{st['run_id']}:{step}",
           "--message-file", str(mf), "--timeout", str(timeout), "--json"]
    if model:
        cmd += ["--model", model]
    if thinking:
        cmd += ["--thinking", thinking]
    r = sh(cmd, timeout=timeout + 120, check=False)
    if '"result"' not in r.stdout:
        if model and "--model" in cmd:
            i = cmd.index("--model")
            del cmd[i:i + 2]
        r = sh(cmd, timeout=timeout + 120, check=False)
    try:
        j = json.loads(r.stdout[r.stdout.index("{"):])
        text = "\n".join(p.get("text") or "" for p in j["result"]["payloads"]).strip()
        usage = j["result"]["meta"]["agentMeta"].get("usage", {})
        used_model = j["result"]["meta"]["agentMeta"].get("model")
    except Exception:
        raise RuntimeError(f"agent {agent_id} bad output: {(r.stderr or r.stdout)[:300]}")
    if not text:
        raise RuntimeError(f"agent {agent_id} returned no text")
    st = load(run)
    s = st["steps"].setdefault(step, {})
    s["tokens"] = usage.get("total")
    s["model"] = used_model
    save(run, st)
    (Path(run) / f"{step}.out.txt").write_text(text)
    return text


def strip_fences(t):
    t = t.strip()
    m = re.match(r"^```\w*\n([\s\S]*?)\n```$", t)
    return m.group(1).strip() if m else t


def urls_in(text):
    return sorted({u.rstrip(".,)") for u in re.findall(r"https?://[^\s)>\]\"']+", text)})


def cmd_research(a):
    def go():
        st = load(a.run)
        prompt = fill((PROMPTS / "research.md").read_text(), st)
        text = agent(a.run, "research", "researcher", prompt, timeout=900)
        if len(urls_in(text)) < 3:
            text = agent(a.run, "research2", "researcher", prompt + "\n\nYour previous answer had fewer than 3 real source URLs. Search again and return at least 4 sources with full URLs.", timeout=900)
        if len(urls_in(text)) < 3:
            raise RuntimeError("research found fewer than 3 sources")
        (Path(a.run) / "research.md").write_text(text)
        return {"sources": len(urls_in(text))}
    out(timed(a.run, "research", go))


def cmd_outline(a):
    def go():
        st = load(a.run)
        dossier = (Path(a.run) / "research.md").read_text()
        text = agent(a.run, "outline", "redaktor", fill((PROMPTS / "outline.md").read_text(), st, DOSSIER=dossier), timeout=600)
        (Path(a.run) / "outline.md").write_text(text)
        return {"chars": len(text)}
    out(timed(a.run, "outline", go))


def split_article(text):
    m = re.match(r"^---\n([\s\S]*?)\n---\n([\s\S]*)$", text.strip() + "\n")
    if not m:
        m = re.match(r"^---\n((?:[^\n]+\n)+)\n([\s\S]*)$", text.strip() + "\n")
        if m:
            return m.group(1).strip(), m.group(2).strip()
        raise RuntimeError("draft has no frontmatter")
    return m.group(1), m.group(2).strip()


def fm_get(fm, key):
    m = re.search(rf"^{key}:\s*(.+)$", fm, re.M)
    return m.group(1).strip().strip('"').strip("'") if m else ""


def normalise(run, text):
    """Rebuild the frontmatter from script-owned fields so the site never gets a malformed header."""
    st = load(run)
    fm, body = split_article(strip_fences(text))
    body = re.sub(r"^# .+\n+", "", body)
    wc = len(re.findall(r"\b[\w'’-]+\b", re.sub(r"\(https?://[^)]+\)|https?://\S+", "", body.split("\n## Sources")[0])))
    tags = fm_get(fm, "tags").strip("[]")
    title = fm_get(fm, "title") or st["title"]
    excerpt = fm_get(fm, "excerpt").replace('"', "'")
    srcs = urls_in(body.split("## Sources")[-1]) if "## Sources" in body else []
    hero = f"/images/{st['slug']}-hero.webp" if st.get("image") != "fallback" else FALLBACK_HERO[st["category"]]
    lines = ["---", f'title: "{title.replace(chr(34), chr(39))}"', f"category: {st['category']}", f"tags: {tags}",
             f"author: {st['author']}", f"authorRole: {st['author_role']}", f"date: {st['date']}",
             f"readTime: {max(3, round(wc / 200))}", f'excerpt: "{excerpt}"', f"illustration: {st['illustration']}",
             f"heroImage: {hero}", "featured: false", f"free: {str(st.get('free', True)).lower()}", "sources:"]
    lines += [f"  - {u}" for u in srcs]
    lines.append("---")
    return "\n".join(lines) + "\n\n" + body + "\n", wc, srcs


def lint(st, text):
    """Returns (hard, hints). Hard issues force a revision; hints go to the reviewer, who decides."""
    fm, body = split_article(text)
    hard, hints = [], []
    if EM in text:
        hard.append("em dash found")
    if " -- " in text:
        hard.append("double hyphen used as dash")
    low = body.lower()
    n = len(body.split("\n## Sources")[0].split())
    if n < 700 or n > 2600:
        hard.append(f"body is {n} words; aim for 1,200 to 2,000 (add or cut concrete material to get there)")
    elif n < 1150 or n > 2100:
        hints.append(f"body is {n} words; the target is 1,200 to 2,000, a soft target (mention it, never reject for it)")
    for u in dead_urls(urls_in(body.split("## Sources")[-1]) if "## Sources" in body else []):
        hard.append(f"dead source link (returns 404 or does not resolve): {u}; replace it with a live page that says the same thing, or drop that source and every claim only it supports")
    leak = re.search(r"(the sources (here|cited|in this|for this)|cited (guidance|sources)|this article's sources|the dossier|do(es)? not verify|don't give (a )?(guidance|recipe|schedule)|sources? (do|does)(n't| not) (give|say|cover|establish))", low)
    if leak:
        hard.append(f"internal research talk leaked into the copy ('{leak.group(0)}'): delete it, or state the practice plainly without mentioning sources")
    for w in BANNED:
        if re.search(rf"\b{re.escape(w)}\b", low):
            hard.append(f"banned word: {w}")
    if st["safety"] in ("herbal", "toxic") and MED_BOX not in body:
        hard.append("missing the Not medical advice box")
    if st["safety"] in ("toxic", "food") and not re.search(r"^## .*safety", body, re.I | re.M):
        hard.append("missing a Safety section")
    for w in SOFT_BANNED:
        if re.search(rf"\b{re.escape(w)}\b", low):
            hints.append(f"check use of '{w}' (banned when used as filler or metaphor)")
    if re.search(r"\b\d+(\.\d+)?\s?(mg|mcg|µg|ml|drops?)\b", low) and st["safety"] in ("herbal", "toxic"):
        hints.append("a number with mg/ml/drops appears: check it is not a medicinal dose")
    if re.search(r"\b(twice|three times|once) (a|per) day\b|\bdaily dose\b|\btake \d", low):
        hints.append("possible dosing language: check it")
    if re.search(r"\b(cures?|cured by|heals? (your|the|any)|prevents? (cancer|diabetes|disease)|reverses?)\b", low):
        hints.append("cure/prevent wording appears: check it is not a disease claim (food curing is fine)")
    if len(re.findall(r"\bit is\b", low)) > 6:
        hints.append("many uncontracted 'it is'")
    return hard, hints


def fetch_ok(u):
    try:
        req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 (compatible; AncestralForgeBot/1.0)"})
        urllib.request.urlopen(req, timeout=25).close()
        return True
    except Exception:
        return False


def dead_urls(urls):
    """404 or 410, an unresolvable host, or a soft 404 (a 200 page titled 'not found')."""
    dead = []
    if urls and not fetch_ok("https://en.wikipedia.org/wiki/Main_Page"):
        sys.stderr.write("link check skipped: canary fetch failed\n")
        return []
    for u in urls:
        ok = False
        try:
            req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 (compatible; AncestralForgeBot/1.0)"})
            with urllib.request.urlopen(req, timeout=25) as r:
                head = r.read(60000).decode("utf-8", "ignore")
            title = re.search(r"<title[^>]*>([\s\S]*?)</title>", head, re.I)
            ok = not (title and re.search(r"not found|404|page unavailable", title.group(1), re.I))
        except urllib.error.HTTPError as e:
            ok = e.code in (401, 403, 405, 429, 999)
        except Exception as e:
            ok = "Tunnel connection failed" in str(e)
        if not ok:
            dead.append(u)
    return dead


def cmd_draft(a):
    def go():
        st = load(a.run)
        d = Path(a.run)
        prompt = fill((PROMPTS / "draft.md").read_text(), st, OUTLINE=(d / "outline.md").read_text(), DOSSIER=(d / "research.md").read_text())
        text = agent(a.run, "draft", "redaktor", prompt, timeout=900)
        article, wc, srcs = normalise(a.run, text)
        if wc < 1250 or wc > 2050:
            direction = "too short: expand it to about 1,600 words by adding concrete detail from the dossier" if wc < 1250 else "too long: cut it to about 1,700 words"
            retry = (f"Your draft is {wc} words, {direction}. Keep everything else. Reply with the complete index.md only.\n\n"
                     f"## Current draft\n{article}\n\n## Dossier\n{(d / 'research.md').read_text()}")
            text = agent(a.run, "draft2", "redaktor", retry, timeout=900)
            article, wc, srcs = normalise(a.run, text)
        if wc < 700 or wc > 2800:
            raise RuntimeError(f"draft length {wc} words is outside 700-2800")
        if len(srcs) < 3:
            raise RuntimeError("draft lists fewer than 3 sources")
        (d / "draft.md").write_text(article)
        return {"words": wc, "sources": len(srcs)}
    out(timed(a.run, "draft", go))


def parse_verdict(text):
    s = text[text.index("{"): text.rindex("}") + 1]
    j = json.loads(s)
    if j.get("verdict") not in ("pass", "revise", "reject"):
        raise ValueError("bad verdict")
    j["issues"] = [str(i) for i in j.get("issues", [])]
    return j


def do_review(run, round_):
    st = load(run)
    d = Path(run)
    draft = (d / "draft.md").read_text()
    lint_issues, lint_hints = lint(st, draft)
    note = ("Round 1: list every issue you find, most important first." if round_ == 1 else
            "Round 2, the final round after one revision. Return \"pass\" unless a safety breach, an unsupported or wrongly attributed factual claim, "
            "a missing required element (Sources, Safety section, Not medical advice box) or a hard style violation (em dash, banned word) remains. "
            "Remaining style nits, repetition, length or taste are NOT grounds to reject or revise: mention them in issues but still pass. "
            "Only \"reject\" for a real safety or fact problem.")
    prompt = fill((PROMPTS / "review.md").read_text(), st, DOSSIER=(d / "research.md").read_text(), DRAFT=draft, ROUND_NOTE=note)
    if lint_issues:
        prompt += "\n\nAutomated lint found these hard problems (confirm and include them): " + "; ".join(lint_issues)
    if lint_hints:
        prompt += "\n\nLint hints (judge them yourself, they are often false alarms): " + "; ".join(lint_hints)
    text = agent(run, f"review{round_}", "reviewer", prompt, timeout=900, model=REVIEW_MODEL)
    try:
        v = parse_verdict(text)
    except Exception:
        text = agent(run, f"review{round_}b", "reviewer", prompt + "\n\nReply with the JSON object only.", timeout=900, model=REVIEW_MODEL)
        v = parse_verdict(text)
    for i in lint_issues:
        if i not in v["issues"]:
            v["issues"].append(i)
    if v["verdict"] == "pass" and lint_issues:
        v["verdict"] = "revise"
    (d / f"review{round_}.json").write_text(json.dumps(v, indent=2, ensure_ascii=False))
    st = load(run)
    st[f"verdict{round_}"] = v["verdict"]
    save(run, st)
    return v


def cmd_review1(a):
    def go():
        v = do_review(a.run, 1)
        if v["verdict"] == "reject":
            fail(a.run, "reviewer rejected the draft: " + v.get("reason", ""))
        return {"verdict": v["verdict"], "issues": len(v["issues"])}
    out(timed(a.run, "review1", go))


def cmd_revise(a):
    def go():
        st = load(a.run)
        if st.get("verdict1") != "revise":
            return {"revised": False}
        d = Path(a.run)
        v = json.loads((d / "review1.json").read_text())
        prompt = fill((PROMPTS / "revise.md").read_text(), st, ISSUES="\n".join(f"- {i}" for i in v["issues"]),
                      DOSSIER=(d / "research.md").read_text(), DRAFT=(d / "draft.md").read_text())
        try:
            text = agent(a.run, "revise", "redaktor", prompt, timeout=900, model=REVISE_MODEL, thinking="medium")
        except RuntimeError:
            text = agent(a.run, "revise", "redaktor", prompt, timeout=900)
        article, wc, srcs = normalise(a.run, text)
        (d / "draft.md").write_text(article)
        st = load(a.run)
        st["revised"] = True
        save(a.run, st)
        return {"revised": True, "words": wc}
    out(timed(a.run, "revise", go))


def cmd_review2(a):
    def go():
        st = load(a.run)
        if not st.get("revised"):
            return {"verdict": st.get("verdict1"), "skipped": True}
        v = do_review(a.run, 2)
        if v["verdict"] == "revise":
            v["verdict"] = "reject" if v["issues"] and lint(st, (Path(a.run) / "draft.md").read_text())[0] else "pass"
        if v["verdict"] != "pass":
            fail(a.run, f"still {v['verdict']} after one revision: " + "; ".join(v["issues"][:3]))
        return {"verdict": "pass"}
    out(timed(a.run, "review2", go))


# ---------------------------------------------------------------- image

def to_webp(png_bytes, dest, max_width=1600, quality=80):
    import io
    from PIL import Image
    im = Image.open(io.BytesIO(png_bytes)).convert("RGB")
    if im.width > max_width:
        im = im.resize((max_width, round(im.height * max_width / im.width)), Image.LANCZOS)
    im.save(dest, "WEBP", quality=quality, method=6)


def cmd_image(a):
    def go():
        st = load(a.run)
        d = Path(a.run)
        text = (d / "draft.md").read_text()
        fm, body = split_article(text)
        why = ""
        try:
            prompt = agent(a.run, "imageprompt", "redaktor",
                           fill((PROMPTS / "image.md").read_text(), st, EXCERPT=fm_get(fm, "excerpt")), timeout=300)
            prompt = strip_fences(prompt)[:900]
            if st["engine"] == "local":
                try:
                    local_call("/unload", timeout=60, method="GET")
                    time.sleep(8)
                except Exception:
                    pass
            r = subprocess.run(SSH_IMG, input=prompt.encode(), capture_output=True, timeout=900)
            if r.returncode == 0 and r.stdout[:4] == b"\x89PNG":
                to_webp(r.stdout, d / "hero.webp")
                st = load(a.run)
                st["image"] = "generated"
                st["image_prompt"] = prompt
                save(a.run, st)
            else:
                why = f"ssh exit {r.returncode}: {r.stderr.decode()[:150]}"
        except Exception as e:
            why = str(e)[:200]
        st = load(a.run)
        if why or "image" not in st:
            st["image"] = "fallback"
            st["image_note"] = why or "no image produced"
        save(a.run, st)
        return {"image": st["image"], "note": why}
    out(timed(a.run, "image", go))


# ---------------------------------------------------------------- publish

def cmd_publish(a):
    @locked
    def go():
        st = load(a.run)
        d = Path(a.run)
        st["free"] = random.random() < 0.5
        save(a.run, st)
        article, wc, srcs = normalise(a.run, (d / "draft.md").read_text())
        gone = dead_urls(srcs)
        if gone:
            kept = [l for l in article.split("\n") if not any(u in l for u in gone)]
            article = "\n".join(kept)
            srcs = [u for u in srcs if u not in gone]
            st = load(a.run)
            st["dropped_dead_sources"] = gone
            save(a.run, st)
        assert EM not in article, "em dash in final article"
        assert len(srcs) >= 3
        git_reset_to_origin()
        target = ARTICLES / st["slug"]
        if target.exists():
            raise RuntimeError("article slug already exists on main")
        target.mkdir(parents=True)
        (target / "index.md").write_text(article)
        paths = [target]
        if st.get("image") == "generated":
            img = ROOT / "public" / "images" / f"{st['slug']}-hero.webp"
            img.write_bytes((d / "hero.webp").read_bytes())
            paths.append(img)
        claim = CLAIMS / f"{st['slug']}.json"
        c = json.loads(claim.read_text()) if claim.exists() else {"slug": st["slug"], "engine": st["engine"], "date": st["date"]}
        c.pop("reason", None)
        c.update(status="published", publishedAt=now().isoformat(timespec="seconds"), url=f"{SITE}/articles/{st['slug']}")
        claim.write_text(json.dumps(c, indent=2))
        paths.append(claim)
        if not git_sync_push(f"article: {st['slug']} ({st['engine']})", paths):
            raise RuntimeError("push failed after retries")
        st = load(a.run)
        st["title"] = fm_get(split_article(article)[0], "title") or st["title"]
        st["url"] = f"{SITE}/articles/{st['slug']}"
        st["words"] = wc
        save(a.run, st)
        return {"url": st["url"], "words": wc}
    out(timed(a.run, "publish", go))


def cmd_notify(a):
    st = load(a.run)
    live = False
    if not a.no_wait:
        for _ in range(40):
            try:
                req = urllib.request.Request(st["url"], headers={"User-Agent": "Mozilla/5.0 (compatible; AncestralForgeBot/1.0)"})
                if urllib.request.urlopen(req, timeout=15).status == 200:
                    live = True
                    break
            except Exception:
                pass
            time.sleep(30)
    st["status"] = "published"
    toks = sum((s.get("tokens") or 0) for s in st["steps"].values())
    secs = round(sum((s.get("seconds") or 0) for s in st["steps"].values()))
    st["total_tokens"], st["total_seconds"] = toks, secs
    save(a.run, st)
    log_run(st)
    note = "" if st.get("image") == "generated" else f"\nImage: FALLBACK used ({st.get('image_note', '')[:100]})"
    rev = " (1 revision)" if st.get("revised") else ""
    telegram(f"The Ancestral Forge [{st['engine']}, {st.get('author', '')}]: published{rev}, {'free' if st.get('free') else 'members only'}\n{st['title']}\n{st['url']}\n"
             f"{'Live now.' if live else 'Goes live within 15 min (server pulls from git).'}"
             f"\n{st.get('words')} words, {secs // 60} min, {toks} tokens{note}")
    out({"ok": True, "url": st["url"], "live": live, "seconds": secs, "tokens": toks})


def cmd_finalize(a):
    """Called by the trigger wrappers after the engine returns: catches aborts the pipeline itself could not report."""
    runs = sorted(p for p in WORK.glob(f"*-{a.engine}") if p.name >= a.since)
    if not runs:
        if not (WORK / ".quiet").exists():
            telegram(f"The Ancestral Forge [{a.engine}]: no article today. Reason: the engine failed before the first step ({a.note[:200]})")
        out({"finalized": "failed"})
        return
    run = runs[-1]
    st = load(run)
    if st["status"] == "running":
        if st.get("url"):
            a.run = str(run)
            a.no_wait = False
            cmd_notify(a)
        else:
            fail(str(run), f"the {a.engine} engine stopped before the pipeline finished (last step: {list(st['steps'])[-1] if st['steps'] else 'none'})")
    out({"finalized": json.loads((run / "state.json").read_text())["status"]})


def cmd_fail(a):
    fail(a.run, a.reason)


def main():
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)
    i = sub.add_parser("init")
    i.add_argument("--engine", required=True)
    i.add_argument("--force", action="store_true")
    f = sub.add_parser("finalize")
    f.add_argument("--engine", required=True)
    f.add_argument("--since", required=True)
    f.add_argument("--note", default="")
    for name in ("pick", "research", "outline", "draft", "review1", "revise", "review2", "image", "publish", "notify", "fail"):
        s = sub.add_parser(name)
        s.add_argument("--run", default=os.environ.get("RUN"), required=False)
        if name == "fail":
            s.add_argument("--reason", required=True)
        if name == "notify":
            s.add_argument("--no-wait", action="store_true")
    a = p.parse_args()
    if a.cmd not in ("init", "finalize") and not a.run:
        p.error("--run or $RUN required")
    if a.cmd not in ("init", "pick", "fail", "finalize") and load(a.run).get("status") == "skipped":
        out({"skipped": True})
        return
    globals()["cmd_" + a.cmd](a)


if __name__ == "__main__":
    main()
