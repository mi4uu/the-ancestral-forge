#!/usr/bin/env python3
"""Generate short animated clips from existing images using AnimateDiff + SDXL in ComfyUI.

Takes a static image → produces 2-4 second loopable animation (leaves swaying, liquid flowing, etc.)
Uses img2img approach: load image, apply AnimateDiff motion, output short video.

Usage: python3 video/generate-animations.py elderberry-lie
"""

import sys
import os
import json
import time
import shutil
import urllib.request
import glob

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
COMFYUI_URL = "http://127.0.0.1:8188"
COMFYUI_OUTPUT = os.path.expanduser("~/Documents/comfy/ComfyUI/output")
COMFYUI_INPUT = os.path.expanduser("~/Documents/comfy/ComfyUI/input")


def find_checkpoint() -> str:
    ckpt_dir = os.path.expanduser("~/Documents/comfy/ComfyUI/models/checkpoints")
    for name in os.listdir(ckpt_dir):
        if "juggernaut" in name.lower():
            return name
        if "realvis" in name.lower():
            return name
    return "sd_xl_base_1.0.safetensors"


def build_animatediff_workflow(
    image_filename: str,
    prompt: str,
    frames: int = 16,
    denoise: float = 0.4,
    seed: int = 42,
) -> dict:
    """AnimateDiff I2V workflow: image → short animation.

    Low denoise (0.3-0.5) keeps image structure, adds subtle motion.
    16 frames at 8fps = 2 seconds of animation.
    """
    checkpoint = find_checkpoint()

    negative = (
        "ugly, blurry, low quality, deformed, text, watermark, "
        "morphing, distortion, flicker, unstable"
    )

    return {
        "prompt": {
            # Load checkpoint
            "1": {
                "class_type": "CheckpointLoaderSimple",
                "inputs": {"ckpt_name": checkpoint}
            },
            # Load AnimateDiff model
            "2": {
                "class_type": "ADE_LoadAnimateDiffModel",
                "inputs": {"model_name": "mm_sdxl_v10_beta.ckpt"}
            },
            # Apply AnimateDiff to model
            "3": {
                "class_type": "ADE_ApplyAnimateDiffModelSimple",
                "inputs": {
                    "motion_model": ["2", 0],
                    "model": ["1", 0],
                }
            },
            # Load source image
            "4": {
                "class_type": "LoadImage",
                "inputs": {"image": image_filename}
            },
            # Encode image to latent (for img2img)
            "5": {
                "class_type": "VAEEncode",
                "inputs": {
                    "pixels": ["4", 0],
                    "vae": ["1", 2]
                }
            },
            # Positive prompt
            "6": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": prompt,
                    "clip": ["1", 1]
                }
            },
            # Negative prompt
            "7": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": negative,
                    "clip": ["1", 1]
                }
            },
            # Repeat latent for frame count
            "8": {
                "class_type": "RepeatLatentBatch",
                "inputs": {
                    "samples": ["5", 0],
                    "amount": frames
                }
            },
            # KSampler — low denoise for subtle motion
            "9": {
                "class_type": "KSampler",
                "inputs": {
                    "seed": seed,
                    "steps": 20,
                    "cfg": 6.0,
                    "sampler_name": "dpmpp_2m",
                    "scheduler": "karras",
                    "denoise": denoise,
                    "model": ["3", 0],
                    "positive": ["6", 0],
                    "negative": ["7", 0],
                    "latent_image": ["8", 0]
                }
            },
            # Decode
            "10": {
                "class_type": "VAEDecode",
                "inputs": {
                    "samples": ["9", 0],
                    "vae": ["1", 2]
                }
            },
            # Save as video frames
            "11": {
                "class_type": "SaveImage",
                "inputs": {
                    "filename_prefix": "animdiff_out",
                    "images": ["10", 0]
                }
            }
        }
    }


def queue_and_wait(workflow: dict, timeout: int = 600) -> list[str]:
    """Queue workflow and wait for output files."""
    data = json.dumps(workflow).encode()
    req = urllib.request.Request(
        f"{COMFYUI_URL}/prompt", data=data,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            prompt_id = json.loads(resp.read()).get("prompt_id")
    except Exception as e:
        print(f"  Queue error: {e}")
        return []

    for _ in range(timeout // 2):
        time.sleep(2)
        try:
            with urllib.request.urlopen(f"{COMFYUI_URL}/history/{prompt_id}") as resp:
                history = json.loads(resp.read())
            if prompt_id in history:
                files = []
                for node_output in history[prompt_id].get("outputs", {}).values():
                    if "images" in node_output:
                        for img in node_output["images"]:
                            files.append(img["filename"])
                return files
        except Exception:
            pass

    return []


def frames_to_video(frame_files: list[str], output_path: str, fps: int = 8, loop: int = 3):
    """Convert frame images to looped MP4 video."""
    import subprocess

    # Create temp dir with numbered frames
    tmp_dir = output_path + "_frames"
    os.makedirs(tmp_dir, exist_ok=True)

    for i, fname in enumerate(sorted(frame_files)):
        src = os.path.join(COMFYUI_OUTPUT, fname)
        dst = os.path.join(tmp_dir, f"frame_{i:04d}.png")
        if os.path.exists(src):
            shutil.copy2(src, dst)

    # Forward + reverse for smooth loop
    frame_count = len(frame_files)
    for i in range(frame_count - 2, 0, -1):
        src = os.path.join(tmp_dir, f"frame_{i:04d}.png")
        dst = os.path.join(tmp_dir, f"frame_{frame_count + (frame_count - 2 - i):04d}.png")
        if os.path.exists(src):
            shutil.copy2(src, dst)

    # Encode to MP4, loop N times
    cmd = [
        "ffmpeg", "-y",
        "-framerate", str(fps),
        "-i", os.path.join(tmp_dir, "frame_%04d.png"),
        "-stream_loop", str(loop - 1),
        "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,"
               "pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x1B2B1B",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        output_path
    ]
    subprocess.run(cmd, capture_output=True, text=True)

    # Cleanup
    shutil.rmtree(tmp_dir, ignore_errors=True)


# Animations to generate — image + motion prompt
ANIMATIONS = [
    {
        "source": "elder-tree-misty-morning.png",
        "prompt": "elder tree in misty morning, leaves gently swaying in breeze, mist drifting slowly, subtle natural movement, cinematic",
        "output": "anim_elder_tree_sway.mp4",
        "denoise": 0.35,
    },
    {
        "source": "elderberries-boiling-destruction.png",
        "prompt": "elderberries boiling in pot, steam rising, bubbles forming, liquid simmering, hot water movement",
        "output": "anim_boiling_berries.mp4",
        "denoise": 0.4,
    },
    {
        "source": "cold-maceration-mason-jar.png",
        "prompt": "mason jar with elderberries in liquid, subtle swirling of purple tincture, gentle movement of berries floating",
        "output": "anim_tincture_jar.mp4",
        "denoise": 0.3,
    },
    {
        "source": "elderflower-closeup-bees.png",
        "prompt": "elderflower with bee, flower petals moving slightly in wind, bee walking on flower, natural movement",
        "output": "anim_flower_bee.mp4",
        "denoise": 0.35,
    },
    {
        "source": "purple-liquid-swirl.png",
        "prompt": "purple elderberry extract swirling in liquid, fluid dynamics, smooth flowing motion, abstract beauty",
        "output": "anim_purple_swirl.mp4",
        "denoise": 0.45,
    },
]


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 video/generate-animations.py <project-slug>")
        sys.exit(1)

    slug = sys.argv[1]
    project_dir = os.path.join(BASE_DIR, slug)
    images_dir = os.path.join(project_dir, "images")
    clips_dir = os.path.join(project_dir, "clips")
    os.makedirs(clips_dir, exist_ok=True)

    # Check ComfyUI
    try:
        urllib.request.urlopen(f"{COMFYUI_URL}/system_stats")
    except:
        print("ComfyUI not running!")
        sys.exit(1)

    print(f"Generating {len(ANIMATIONS)} animations for {slug}")
    print(f"Model: {find_checkpoint()}")
    print(f"AnimateDiff: mm_sdxl_v10_beta.ckpt\n")

    ok, fail = 0, 0
    for i, anim in enumerate(ANIMATIONS):
        source_path = os.path.join(images_dir, anim["source"])
        output_path = os.path.join(clips_dir, anim["output"])

        if os.path.exists(output_path):
            print(f"[{i+1}/{len(ANIMATIONS)}] SKIP (exists): {anim['output']}")
            ok += 1
            continue

        if not os.path.exists(source_path):
            print(f"[{i+1}/{len(ANIMATIONS)}] SKIP (no source): {anim['source']}")
            fail += 1
            continue

        print(f"[{i+1}/{len(ANIMATIONS)}] {anim['source']} → {anim['output']}")

        # Copy source image to ComfyUI input
        input_name = f"animsrc_{i}.png"
        shutil.copy2(source_path, os.path.join(COMFYUI_INPUT, input_name))

        # Build and queue workflow
        workflow = build_animatediff_workflow(
            input_name, anim["prompt"],
            frames=16, denoise=anim["denoise"],
            seed=42 + i * 137
        )

        print(f"  Queued, waiting for {16} frames...")
        files = queue_and_wait(workflow, timeout=300)

        if files:
            print(f"  Got {len(files)} frames, encoding video...")
            frames_to_video(files, output_path, fps=8, loop=3)
            if os.path.exists(output_path):
                print(f"  OK: {anim['output']}")
                ok += 1
            else:
                print(f"  FAIL: encoding failed")
                fail += 1
        else:
            print(f"  FAIL: no frames generated")
            fail += 1

    print(f"\nDone! {ok} animations, {fail} failed")
    print(f"Clips in: {clips_dir}/")


if __name__ == "__main__":
    main()
