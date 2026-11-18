#!/usr/bin/env python3
"""Stage 1: Create video project from article."""

import sys
import os
import json
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONTENT_DIR = os.path.join(os.path.dirname(BASE_DIR), "content", "articles")


def parse_frontmatter(text: str) -> tuple[dict, str]:
    """Parse YAML frontmatter from markdown."""
    if not text.startswith("---"):
        return {}, text
    end = text.index("---", 3)
    fm_text = text[3:end].strip()
    body = text[end + 3:].strip()
    meta = {}
    for line in fm_text.split("\n"):
        if ":" in line:
            key, val = line.split(":", 1)
            val = val.strip().strip('"').strip("'")
            meta[key.strip()] = val
    return meta, body


def extract_sections(body: str) -> list[dict]:
    """Extract markdown sections with their content."""
    sections = []
    current_heading = "Introduction"
    current_text = []

    for line in body.split("\n"):
        if line.startswith("## "):
            if current_text:
                sections.append({
                    "heading": current_heading,
                    "text": "\n".join(current_text).strip()
                })
            current_heading = line.lstrip("#").strip()
            current_text = []
        elif line.startswith("### "):
            # Keep subheadings inline
            current_text.append(f"\n**{line.lstrip('#').strip()}**\n")
        elif line.startswith("!["):
            # Extract image references
            match = re.match(r'!\[([^\]]*)\]\(([^)]+)\)', line)
            if match:
                current_text.append(f"[IMAGE: {match.group(2)}]")
        else:
            current_text.append(line)

    if current_text:
        sections.append({
            "heading": current_heading,
            "text": "\n".join(current_text).strip()
        })

    return sections


def article_to_script_template(slug: str) -> str:
    """Convert article to narration script template."""
    article_path = os.path.join(CONTENT_DIR, slug, "index.md")
    if not os.path.exists(article_path):
        print(f"Article not found: {article_path}")
        sys.exit(1)

    with open(article_path, "r") as f:
        content = f.read()

    meta, body = parse_frontmatter(content)
    sections = extract_sections(body)

    lines = []
    lines.append(f"# {meta.get('title', slug)}")
    lines.append(f"# Target: 30-40 minutes narration")
    lines.append(f"# Voice: en-US-GuyNeural")
    lines.append("")

    # Intro
    lines.append("[IMAGE: intro-title.png]")
    lines.append(f"Welcome back to The Ancestral Forge. Today, we're diving deep into something that affects millions of people — and almost nobody is talking about it honestly.")
    lines.append("")
    lines.append(f"[IMAGE: hook.png]")
    lines.append(f"# REWRITE: Hook from article excerpt:")
    lines.append(f"# {meta.get('excerpt', '')}")
    lines.append("")

    # Body sections
    for section in sections:
        lines.append(f"[IMAGE: {slugify(section['heading'])}.png]")
        lines.append(f"## {section['heading']}")
        lines.append("")
        # Include original text as reference, commented
        for para in section["text"].split("\n\n"):
            para = para.strip()
            if not para:
                continue
            if para.startswith("[IMAGE:"):
                lines.append(para)
            elif para.startswith("[") or para.startswith("|"):
                # Skip tables, references
                lines.append(f"# TABLE/REF: {para[:80]}...")
            else:
                # Clean up markdown formatting for narration
                clean = re.sub(r'\[(\d+)\]', '', para)  # Remove citation refs
                clean = re.sub(r'\*+([^*]+)\*+', r'\1', clean)  # Remove bold/italic markers
                clean = re.sub(r'\s+', ' ', clean).strip()
                if len(clean) > 40:
                    lines.append(clean)
                    lines.append("")

    # Outro
    lines.append("")
    lines.append("[SUBSCRIBE]")
    lines.append("If you found this valuable — if this changed how you think about even one thing you put in your body or build with your hands — hit that subscribe button. We release deep dives like this every week, and every single one is researched to the same standard you just heard.")
    lines.append("")
    lines.append("[IMAGE: outro.png]")
    lines.append("Until next time — stay curious, stay skeptical, and keep building. This is The Ancestral Forge.")
    lines.append("")

    return "\n".join(lines)


def slugify(text: str) -> str:
    """Simple slugify for filenames."""
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')[:40]


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 video/create-project.py <article-slug>")
        print(f"\nAvailable articles:")
        for d in sorted(os.listdir(CONTENT_DIR)):
            if os.path.isdir(os.path.join(CONTENT_DIR, d)):
                print(f"  {d}")
        sys.exit(1)

    slug = sys.argv[1]
    project_dir = os.path.join(BASE_DIR, slug)

    if os.path.exists(project_dir):
        print(f"Project already exists: {project_dir}")
        print("Delete it first if you want to start over.")
        sys.exit(1)

    # Create directory structure
    os.makedirs(os.path.join(project_dir, "images"), exist_ok=True)
    os.makedirs(os.path.join(project_dir, "audio"), exist_ok=True)
    os.makedirs(os.path.join(project_dir, "output"), exist_ok=True)

    # Generate script template
    script = article_to_script_template(slug)
    script_path = os.path.join(project_dir, "script.md")
    with open(script_path, "w") as f:
        f.write(script)

    # Create config
    config = {
        "slug": slug,
        "voice": "en-US-GuyNeural",
        "voice_rate": "+0%",
        "voice_pitch": "-5Hz",
        "resolution": [1920, 1080],
        "fps": 30,
        "transition_duration": 1.0,
        "ken_burns_zoom": 0.05,
        "pause_after_period": 0.3,
        "background_music": None,
        "background_music_volume": 0.08
    }
    with open(os.path.join(project_dir, "config.json"), "w") as f:
        json.dump(config, f, indent=2)

    print(f"Project created: {project_dir}/")
    print(f"  script.md  — narration script (edit this!)")
    print(f"  config.json — voice/video settings")
    print(f"  images/    — place images here")
    print(f"  audio/     — generated audio (auto)")
    print(f"  output/    — final video (auto)")
    print()
    print(f"Next steps:")
    print(f"  1. Edit {script_path} — rewrite for engaging video narration")
    print(f"  2. Add images to {project_dir}/images/")
    print(f"  3. Run: python3 video/generate-audio.py {slug}")


if __name__ == "__main__":
    main()
