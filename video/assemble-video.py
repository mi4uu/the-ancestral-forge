#!/usr/bin/env python3
"""Stage 3: Assemble final video from audio + images using FFmpeg.

v3 — fixes:
- Audio: build single continuous audio track FIRST, then overlay images
- Images: better mapping, no repeats, faster image changes
- Dynamics: animated text overlays with fade-in/scale effects
- Ken Burns: faster, more varied motion
"""

import sys
import os
import json
import subprocess
import glob
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Vintage color grading
VINTAGE_GRADE = (
    "curves=r='0/0.02 0.5/0.55 1/0.98'"
    ":g='0/0.01 0.5/0.5 1/0.96'"
    ":b='0/0 0.5/0.46 1/0.92',"
    "eq=saturation=0.85:brightness=0.02:contrast=1.05"
)


def get_media_for_segment(segment: dict, images_dir: str, clips_dir: str) -> tuple[str | None, bool]:
    """Find matching media. Returns (path, is_video)."""
    image_ref = segment.get("image")
    if not image_ref:
        return None, False

    # Video clip reference
    if image_ref.startswith("VIDEO:"):
        video_name = image_ref[6:]
        video_path = os.path.join(clips_dir, video_name)
        if os.path.exists(video_path):
            return video_path, True
        return None, False

    # Image reference
    exact = os.path.join(images_dir, image_ref)
    if os.path.exists(exact):
        return exact, False
    name = os.path.splitext(image_ref)[0]
    for ext in [".png", ".jpg", ".jpeg", ".webp"]:
        candidate = os.path.join(images_dir, name + ext)
        if os.path.exists(candidate):
            return candidate, False
    return None, False


def extract_overlay_text(segment: dict) -> str | None:
    """Extract key terms for on-screen display."""
    text = segment.get("text", "")
    if not text:
        return None
    exclude = {"The Ancestral", "The Forge", "This is", "What the", "In every",
               "Before we", "Walk into", "Stone Age", "The problem", "The results",
               "The study", "The dosage", "The British", "The elder", "Let me",
               "Now we", "Here is", "And here", "Step back", "Three things"}
    sci = re.findall(r'\b([A-Z][a-z]+\s+[a-z]+(?:\s+var\.\s+[a-z]+)?)\b', text)
    sci = [n for n in sci if n not in exclude and len(n) > 8]
    money = re.findall(r'(\$[\d,.]+\s*(?:million|billion)?)', text)
    stats = re.findall(r'(\d+(?:\.\d+)?(?:\s*(?:°[CF]|%|mg|mL|million|billion|percent)))', text)
    if sci:
        return sci[0]
    if money:
        return money[0]
    if stats and len(stats[0]) > 3:
        return stats[0]
    return None


def render_text_card(text: str, output_path: str, w: int, h: int, style: str = "lower_third"):
    """Render text overlay — modern, bold, YouTube style."""
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        return False

    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Modern fonts
    impact = "/System/Library/Fonts/Supplemental/Impact.ttf"
    din_bold = "/System/Library/Fonts/Supplemental/DIN Condensed Bold.ttf"
    arial_bold = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
    fallback = impact if os.path.exists(impact) else arial_bold

    display_text = text.upper()

    if style == "big_center":
        # GIANT centered text — like "SOURSOP" in reference
        font = ImageFont.truetype(fallback, 100)
        bbox = draw.textbbox((0, 0), display_text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        tx, ty = (w - tw) // 2, (h - th) // 2

        # Heavy black shadow/outline for readability
        for dx in range(-4, 5):
            for dy in range(-4, 5):
                if dx*dx + dy*dy <= 20:
                    draw.text((tx + dx, ty + dy), display_text,
                             fill=(0, 0, 0, 200), font=font)
        # White text
        draw.text((tx, ty), display_text, fill=(255, 255, 255, 255), font=font)
    else:
        # Lower third — bold, readable, semi-transparent dark bar
        font = ImageFont.truetype(din_bold if os.path.exists(din_bold) else fallback, 36)
        bar_h = 60
        bar_y = h - bar_h - 20  # slight offset from bottom
        # Dark bar with rounded feel
        draw.rectangle([(w//6, bar_y), (5*w//6, bar_y + bar_h)],
                       fill=(0, 0, 0, 180))
        bbox = draw.textbbox((0, 0), display_text, font=font)
        tw = bbox[2] - bbox[0]
        tx = (w - tw) // 2
        ty = bar_y + (bar_h - (bbox[3] - bbox[1])) // 2
        draw.text((tx, ty), display_text, fill=(255, 255, 255, 245), font=font)

    img.save(output_path)
    return True


def build_continuous_audio(manifest: list, audio_dir: str, output_path: str) -> float:
    """Build one continuous audio file from all segments. Returns total duration."""
    # Create a concat list of all audio files in order
    list_path = output_path + ".list.txt"
    with open(list_path, "w") as f:
        for seg in manifest:
            audio_file = os.path.join(audio_dir, seg["audio"])
            if os.path.exists(audio_file):
                f.write(f"file '{audio_file}'\n")

    cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", list_path,
        "-ar", "48000", "-ac", "1",
        "-c:a", "aac", "-b:a", "192k",
        output_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    os.remove(list_path)

    if result.returncode != 0:
        print(f"Audio concat error: {result.stderr[-200:]}")
        return 0

    # Get duration
    probe = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
         "-of", "csv=p=0", output_path],
        capture_output=True, text=True
    )
    return float(probe.stdout.strip()) if probe.stdout.strip() else 0


def build_image_timeline(manifest: list, images_dir: str, clips_dir: str, available_images: list) -> list:
    """Build timeline: list of (start_time, duration, image_path, overlay_text, is_key_phrase)."""
    timeline = []
    current_time = 0.0
    image_cycle = 0
    last_image = None

    for seg in manifest:
        dur = seg.get("duration", 0)
        if dur <= 0:
            continue

        # Find media for this segment
        media, is_video = get_media_for_segment(seg, images_dir, clips_dir)
        if is_video:
            timeline.append({
                "start": current_time,
                "duration": dur,
                "image": media,
                "is_video": True,
                "overlay": None,
                "is_key": False,
                "type": seg.get("type", "narration"),
            })
            last_image = media
            current_time += dur
            continue

        image = media
        if not image:
            # Cycle through images but avoid immediate repeats
            candidate = available_images[image_cycle % len(available_images)]
            if candidate == last_image and len(available_images) > 1:
                image_cycle += 1
                candidate = available_images[image_cycle % len(available_images)]
            image = candidate
            image_cycle += 1

        # Extract overlay
        overlay = None
        is_key = False
        if seg.get("type") == "narration":
            overlay = extract_overlay_text(seg)
            # Detect "key phrase" segments (short, impactful)
            text = seg.get("text", "")
            if overlay and len(text) < 80:
                is_key = True

        timeline.append({
            "start": current_time,
            "duration": dur,
            "image": image,
            "is_video": False,
            "overlay": overlay,
            "is_key": is_key,
            "type": seg.get("type", "narration"),
        })

        last_image = image
        current_time += dur

    return timeline


def create_video_clip(
    video_path: str,
    output_path: str,
    duration: float,
    resolution: tuple[int, int],
) -> bool:
    """Use an existing video clip, scaled and trimmed to fit."""
    w, h = resolution
    # Scale video to fit resolution, loop if shorter than duration
    cmd = [
        "ffmpeg", "-y",
        "-stream_loop", "-1",
        "-i", video_path,
        "-vf", f"scale={w}:{h}:force_original_aspect_ratio=decrease,"
               f"pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:color=0x1B2B1B,"
               f"{VINTAGE_GRADE}",
        "-t", str(duration),
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-an",
        output_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  Video clip error: {result.stderr[-200:]}")
        return False
    return True


def create_segment_clip(
    entry: dict,
    output_path: str,
    resolution: tuple[int, int],
    fps: int,
    kb_index: int,
    color_grade: bool,
) -> bool:
    """Create a single video clip (no audio) for one timeline entry."""
    w, h = resolution
    dur = entry["duration"]
    image = entry["image"]
    overlay = entry.get("overlay")
    is_key = entry.get("is_key", False)
    total_frames = max(int(dur * fps), 1)

    # Ken Burns — cycle through 7 different motions, FASTER than before
    kb_patterns = [
        # Faster zoom in
        f"zoompan=z='min(zoom+0.0004,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={total_frames}:s={w}x{h}:fps={fps}",
        # Zoom out
        f"zoompan=z='if(eq(on,1),1.12,max(zoom-0.0004,1.0))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={total_frames}:s={w}x{h}:fps={fps}",
        # Pan right
        f"zoompan=z='1.1':x='if(eq(on,1),0,min(x+2,iw-iw/zoom))':y='ih/2-(ih/zoom/2)':d={total_frames}:s={w}x{h}:fps={fps}",
        # Pan left
        f"zoompan=z='1.1':x='if(eq(on,1),iw-iw/zoom,max(x-2,0))':y='ih/2-(ih/zoom/2)':d={total_frames}:s={w}x{h}:fps={fps}",
        # Zoom to top-right
        f"zoompan=z='min(zoom+0.0004,1.15)':x='iw/2-(iw/zoom/3)':y='ih/3-(ih/zoom/3)':d={total_frames}:s={w}x{h}:fps={fps}",
        # Diagonal drift
        f"zoompan=z='1.08':x='if(eq(on,1),0,min(x+1,iw/2-iw/zoom/2))':y='if(eq(on,1),0,min(y+0.6,ih/2-ih/zoom/2))':d={total_frames}:s={w}x{h}:fps={fps}",
        # Zoom to bottom-center
        f"zoompan=z='min(zoom+0.0003,1.1)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/4)':d={total_frames}:s={w}x{h}:fps={fps}",
    ]

    kb = kb_patterns[kb_index % len(kb_patterns)]
    vf = f"scale=8000:-1,{kb}"

    if color_grade:
        vf += f",{VINTAGE_GRADE}"

    # Render overlay if needed
    overlay_path = None
    if overlay:
        overlay_path = output_path + ".ovl.png"
        style = "big_center" if is_key else "lower_third"
        render_text_card(overlay, overlay_path, w, h, style)

    if overlay_path and os.path.exists(overlay_path):
        # Overlay with fade in/out
        fade_in = min(0.5, dur * 0.1)
        fade_out = min(0.5, dur * 0.1)
        show_start = fade_in
        show_end = max(dur - fade_out, show_start + 0.1)

        filter_str = (
            f"[0:v]{vf}[base];"
            f"[1:v]format=rgba,"
            f"fade=t=in:st=0:d={fade_in}:alpha=1,"
            f"fade=t=out:st={show_end - fade_in}:d={fade_out}:alpha=1[ovl];"
            f"[base][ovl]overlay=0:0:shortest=1[v]"
        )
        cmd = [
            "ffmpeg", "-y",
            "-loop", "1", "-i", image,
            "-loop", "1", "-i", overlay_path,
            "-filter_complex", filter_str,
            "-map", "[v]",
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-t", str(dur),
            "-pix_fmt", "yuv420p",
            "-an",
            output_path
        ]
    else:
        cmd = [
            "ffmpeg", "-y",
            "-loop", "1", "-i", image,
            "-vf", vf,
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-t", str(dur),
            "-pix_fmt", "yuv420p",
            "-an",
            output_path
        ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    if overlay_path and os.path.exists(overlay_path):
        os.remove(overlay_path)

    if result.returncode != 0:
        # Retry without overlay
        if overlay_path:
            cmd_simple = [
                "ffmpeg", "-y",
                "-loop", "1", "-i", image,
                "-vf", vf,
                "-c:v", "libx264", "-preset", "fast", "-crf", "23",
                "-t", str(dur),
                "-pix_fmt", "yuv420p",
                "-an",
                output_path
            ]
            result = subprocess.run(cmd_simple, capture_output=True, text=True)
            return result.returncode == 0
        print(f"  FFmpeg error: {result.stderr[-200:]}")
        return False
    return True


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 video/assemble-video.py <project-slug>")
        sys.exit(1)

    slug = sys.argv[1]
    project_dir = os.path.join(BASE_DIR, slug)

    if not os.path.exists(project_dir):
        print(f"Project not found: {project_dir}")
        sys.exit(1)

    with open(os.path.join(project_dir, "config.json")) as f:
        config = json.load(f)

    manifest_path = os.path.join(project_dir, "audio-manifest.json")
    if not os.path.exists(manifest_path):
        print("Audio manifest not found. Run generate-audio.py first.")
        sys.exit(1)

    with open(manifest_path) as f:
        manifest = json.load(f)

    resolution = tuple(config.get("resolution", [1920, 1080]))
    fps = config.get("fps", 30)
    color_grade = config.get("color_grade", True)

    images_dir = os.path.join(project_dir, "images")
    clips_dir = os.path.join(project_dir, "clips")
    audio_dir = os.path.join(project_dir, "audio")
    output_dir = os.path.join(project_dir, "output")
    temp_dir = os.path.join(output_dir, "segments")
    os.makedirs(temp_dir, exist_ok=True)

    available_images = sorted(
        glob.glob(os.path.join(images_dir, "*.png")) +
        glob.glob(os.path.join(images_dir, "*.jpg")) +
        glob.glob(os.path.join(images_dir, "*.jpeg")) +
        glob.glob(os.path.join(images_dir, "*.webp"))
    )

    if not available_images:
        print(f"No images in {images_dir}/")
        sys.exit(1)

    min_duration = config.get("min_segment_duration", 3.0)

    print(f"Images: {len(available_images)}")
    print(f"Audio segments: {len(manifest)}")
    print(f"Min segment duration: {min_duration}s")

    # ── STEP 1: Build continuous audio track ──
    print("\n[1/3] Building continuous audio track...")
    audio_output = os.path.join(output_dir, "audio_full.m4a")
    total_duration = build_continuous_audio(manifest, audio_dir, audio_output)
    if total_duration == 0:
        print("Audio build failed!")
        sys.exit(1)
    print(f"  Audio: {int(total_duration)//60}m {int(total_duration)%60}s")

    # ── STEP 2: Build image timeline and render video clips ──
    print("\n[2/3] Rendering video segments...")
    timeline = build_image_timeline(manifest, images_dir, clips_dir, available_images)

    # Merge short segments — anything < min_duration gets absorbed into previous
    merged = []
    for entry in timeline:
        if merged and entry["duration"] < min_duration and not entry.get("is_video") and not merged[-1].get("is_video"):
            merged[-1]["duration"] += entry["duration"]
        else:
            merged.append(entry)
    print(f"  Timeline: {len(timeline)} → {len(merged)} (merged <{min_duration}s)")
    timeline = merged

    clip_files = []
    for i, entry in enumerate(timeline):
        clip_path = os.path.join(temp_dir, f"clip_{i:04d}.mp4")
        dur = entry["duration"]
        media_name = os.path.basename(entry["image"])
        is_vid = entry.get("is_video", False)
        overlay_info = f" [{entry['overlay']}]" if entry.get("overlay") else ""
        key_info = " *KEY*" if entry.get("is_key") else ""
        vid_tag = " [VIDEO]" if is_vid else ""
        print(f"  [{i:04d}/{len(timeline)}] {dur:.1f}s — {media_name}{vid_tag}{overlay_info}{key_info}")

        if is_vid:
            success = create_video_clip(entry["image"], clip_path, dur, resolution)
        else:
            success = create_segment_clip(entry, clip_path, resolution, fps, i, color_grade)
        if success:
            clip_files.append(clip_path)
        else:
            print(f"  [{i:04d}] FAILED")

    # ── STEP 3: Concat video clips + merge with audio ──
    print(f"\n[3/3] Concatenating {len(clip_files)} clips + merging audio...")

    # Concat video-only clips
    video_only = os.path.join(output_dir, "video_only.mp4")
    list_path = os.path.join(output_dir, "concat.txt")
    with open(list_path, "w") as f:
        for cf in clip_files:
            f.write(f"file '{cf}'\n")

    cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", list_path,
        "-c:v", "copy",
        "-an",
        "-movflags", "+faststart",
        video_only
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    os.remove(list_path)

    if result.returncode != 0:
        print(f"Video concat failed: {result.stderr[-200:]}")
        sys.exit(1)

    # Merge video + audio
    final_output = os.path.join(output_dir, "final.mp4")
    cmd = [
        "ffmpeg", "-y",
        "-i", video_only,
        "-i", audio_output,
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        "-movflags", "+faststart",
        final_output
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"Merge failed: {result.stderr[-200:]}")
        sys.exit(1)

    # Cleanup
    for cf in clip_files:
        if os.path.exists(cf):
            os.remove(cf)
    try:
        os.rmdir(temp_dir)
    except OSError:
        pass
    for tmp in [video_only, audio_output]:
        if os.path.exists(tmp):
            os.remove(tmp)

    # Stats
    probe = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration,size",
         "-of", "csv=p=0", final_output],
        capture_output=True, text=True
    )
    parts = probe.stdout.strip().split(",") if probe.stdout.strip() else ["0", "0"]
    total = float(parts[0]) if parts[0] else 0
    size_mb = int(parts[1]) / 1024 / 1024 if len(parts) > 1 and parts[1] else 0

    print(f"\nDone! {final_output}")
    print(f"Duration: {int(total)//60}m {int(total)%60}s")
    print(f"Size: {size_mb:.0f} MB")
    print(f"Resolution: {resolution[0]}x{resolution[1]}")


if __name__ == "__main__":
    main()
