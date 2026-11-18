#!/usr/bin/env python3
"""Stage 2: Generate TTS audio from narration script using edge-tts."""

import sys
import os
import json
import re
import asyncio
import edge_tts

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def parse_script(script_path: str) -> list[dict]:
    """Parse narration script into segments.

    Returns list of:
      {"type": "narration", "text": "...", "image": "..."}
      {"type": "pause", "duration": 2.0}
      {"type": "subscribe", "text": "..."}
    """
    segments = []
    current_image = None
    current_text_lines = []

    def flush():
        nonlocal current_text_lines
        text = " ".join(current_text_lines).strip()
        if text:
            segments.append({
                "type": "narration",
                "text": text,
                "image": current_image
            })
        current_text_lines = []

    with open(script_path, "r") as f:
        for line in f:
            line = line.rstrip()

            # Skip comments and title lines
            if line.startswith("#") and not line.startswith("##"):
                continue

            # Skip empty lines (paragraph break)
            if not line.strip():
                flush()
                continue

            # Image cue
            match = re.match(r'\[IMAGE:\s*(.+?)\]', line)
            if match:
                flush()
                current_image = match.group(1).strip()
                continue

            # Video cue (treated same as image for manifest, handled in assembly)
            match = re.match(r'\[VIDEO:\s*(.+?)\]', line)
            if match:
                flush()
                current_image = "VIDEO:" + match.group(1).strip()
                continue

            # Pause cue
            match = re.match(r'\[PAUSE:\s*(\d+(?:\.\d+)?)\]', line)
            if match:
                flush()
                segments.append({
                    "type": "pause",
                    "duration": float(match.group(1))
                })
                continue

            # Subscribe cue
            if line.strip() == "[SUBSCRIBE]":
                flush()
                # Next text block is subscribe CTA
                continue

            # Section heading (keep as part of narration flow)
            if line.startswith("## "):
                flush()
                # Add a pause before new section
                segments.append({"type": "pause", "duration": 1.5})
                continue

            # Regular narration text
            current_text_lines.append(line.strip())

    flush()
    return [s for s in segments if s.get("text", "").strip() or s["type"] == "pause"]


def split_long_text(text: str, max_chars: int = 2000) -> list[str]:
    """Split long text into chunks at sentence boundaries."""
    if len(text) <= max_chars:
        return [text]

    chunks = []
    sentences = re.split(r'(?<=[.!?])\s+', text)
    current = []
    current_len = 0

    for sentence in sentences:
        if current_len + len(sentence) > max_chars and current:
            chunks.append(" ".join(current))
            current = [sentence]
            current_len = len(sentence)
        else:
            current.append(sentence)
            current_len += len(sentence) + 1

    if current:
        chunks.append(" ".join(current))

    return chunks


async def generate_segment_audio(
    text: str,
    output_path: str,
    voice: str,
    rate: str = "+0%",
    pitch: str = "+0Hz"
):
    """Generate audio for a single text segment."""
    communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    await communicate.save(output_path)


async def generate_silence(output_path: str, duration: float):
    """Generate silence audio file using ffmpeg."""
    cmd = [
        "ffmpeg", "-y", "-f", "lavfi",
        "-i", f"anullsrc=r=24000:cl=mono",
        "-t", str(duration),
        "-c:a", "libmp3lame", "-q:a", "9",
        output_path
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.DEVNULL,
        stderr=asyncio.subprocess.DEVNULL
    )
    await proc.wait()


async def main():
    if len(sys.argv) < 2:
        print("Usage: python3 video/generate-audio.py <project-slug>")
        sys.exit(1)

    slug = sys.argv[1]
    project_dir = os.path.join(BASE_DIR, slug)

    if not os.path.exists(project_dir):
        print(f"Project not found: {project_dir}")
        print(f"Run: python3 video/create-project.py {slug}")
        sys.exit(1)

    # Load config
    config_path = os.path.join(project_dir, "config.json")
    with open(config_path) as f:
        config = json.load(f)

    voice = config.get("voice", "en-US-GuyNeural")
    rate = config.get("voice_rate", "+0%")
    pitch = config.get("voice_pitch", "+0Hz")

    # Parse script
    script_path = os.path.join(project_dir, "script.md")
    segments = parse_script(script_path)
    print(f"Parsed {len(segments)} segments from script")

    audio_dir = os.path.join(project_dir, "audio")
    os.makedirs(audio_dir, exist_ok=True)

    # Generate audio for each segment
    manifest = []
    seg_index = 0

    for i, segment in enumerate(segments):
        if segment["type"] == "pause":
            audio_file = os.path.join(audio_dir, f"{seg_index:04d}_pause.mp3")
            print(f"  [{seg_index:04d}] Pause {segment['duration']}s")
            await generate_silence(audio_file, segment["duration"])
            manifest.append({
                "index": seg_index,
                "type": "pause",
                "duration": segment["duration"],
                "audio": f"{seg_index:04d}_pause.mp3",
                "image": None
            })
            seg_index += 1

        elif segment["type"] in ("narration", "subscribe"):
            text = segment["text"]
            image = segment.get("image")
            chunks = split_long_text(text)

            for ci, chunk in enumerate(chunks):
                suffix = f"_{ci}" if len(chunks) > 1 else ""
                audio_file = os.path.join(audio_dir, f"{seg_index:04d}_narration{suffix}.mp3")
                preview = chunk[:60].replace('\n', ' ')
                print(f"  [{seg_index:04d}] {preview}...")

                await generate_segment_audio(chunk, audio_file, voice, rate, pitch)

                # Get duration
                probe_cmd = [
                    "ffprobe", "-v", "quiet",
                    "-show_entries", "format=duration",
                    "-of", "csv=p=0",
                    audio_file
                ]
                proc = await asyncio.create_subprocess_exec(
                    *probe_cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.DEVNULL
                )
                stdout, _ = await proc.communicate()
                duration_str = stdout.decode().strip()
                duration = float(duration_str) if duration_str else 0

                manifest.append({
                    "index": seg_index,
                    "type": segment["type"],
                    "text": chunk,
                    "duration": duration,
                    "audio": f"{seg_index:04d}_narration{suffix}.mp3",
                    "image": image
                })
                seg_index += 1

    # Save manifest
    manifest_path = os.path.join(project_dir, "audio-manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    total_duration = sum(s["duration"] for s in manifest)
    minutes = int(total_duration) // 60
    seconds = int(total_duration) % 60

    print(f"\nGenerated {seg_index} audio segments")
    print(f"Total duration: {minutes}m {seconds}s")
    print(f"Manifest: {manifest_path}")
    print(f"\nNext: python3 video/assemble-video.py {slug}")


if __name__ == "__main__":
    asyncio.run(main())
