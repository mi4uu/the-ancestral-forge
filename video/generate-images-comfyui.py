#!/usr/bin/env python3
"""Generate video images via ComfyUI API using SDXL or Flux models.

Sends prompts to ComfyUI running at localhost:8188, polls for completion,
and saves results to the project images/ directory.

Usage:
    # Start ComfyUI first, then:
    python3 video/generate-images-comfyui.py elderberry-lie
"""

import sys
import os
import json
import time
import shutil
import urllib.request
import urllib.error

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
COMFYUI_URL = "http://127.0.0.1:8188"
COMFYUI_OUTPUT = os.path.expanduser("~/Documents/comfy/ComfyUI/output")

# Style suffix — Juggernaut XL optimized
STYLE_SUFFIX = (
    ", high resolution, skin textures, cinematic lighting, "
    "warm earth tones, moody atmospheric, editorial photography quality"
)

# Juggernaut XL optimized negative prompt
NEGATIVE = (
    "3D, ai generated, semi realistic, illustrated, drawing, comic, "
    "digital painting, 3D model, blender, video game screenshot, render, "
    "smooth textures, CGI, masterpiece, text, writing, subtitle, watermark, "
    "logo, blurry, low quality, jpeg, artifacts, grainy"
)

# Model priority — try Juggernaut first, then RealVis, then SDXL base
CHECKPOINT_PRIORITY = [
    "juggernautXL_ragnarokBy.safetensors",
    "realvisxlV50_v50LightningBakedvae.safetensors",
    "sd_xl_base_1.0.safetensors",
]


def find_model() -> tuple[str, str]:
    """Find best available model. Returns (filename, location).

    location: 'checkpoints' or 'diffusion_models'
    """
    for loc in ["diffusion_models", "checkpoints"]:
        model_dir = os.path.expanduser(f"~/Documents/comfy/ComfyUI/models/{loc}")
        if not os.path.exists(model_dir):
            continue
        available = set(os.listdir(model_dir))
        for name in CHECKPOINT_PRIORITY:
            if name in available:
                return name, loc
        # Fuzzy match
        for name in CHECKPOINT_PRIORITY:
            prefix = name.split("_")[0].lower()
            for f in available:
                if prefix in f.lower() and f.endswith(".safetensors"):
                    return f, loc

    return "sd_xl_base_1.0.safetensors", "checkpoints"


def build_sdxl_workflow(
    prompt: str,
    negative: str = NEGATIVE,
    width: int = 1344,
    height: int = 768,
    seed: int = 42,
    steps: int = 30,
    cfg: float = 6.0,
    checkpoint: str = None,
) -> dict:
    """Build SDXL workflow for ComfyUI API.

    Optimized for Juggernaut XL / RealVisXL:
    - DPM++ 2M Karras sampler
    - 30 steps, CFG 6
    - 1344x768 (16:9 SDXL-optimal)
    """
    if checkpoint is None:
        checkpoint, location = find_model()
    else:
        location = "checkpoints"

    if location == "checkpoints":
        # Standard checkpoint — includes model + clip + vae
        return {
            "prompt": {
                "1": {
                    "class_type": "CheckpointLoaderSimple",
                    "inputs": {"ckpt_name": checkpoint}
                },
                "2": {
                    "class_type": "CLIPTextEncodeSDXL",
                    "inputs": {
                        "text_g": prompt, "text_l": prompt,
                        "width": width, "height": height,
                        "crop_w": 0, "crop_h": 0,
                        "target_width": width, "target_height": height,
                        "clip": ["1", 1]
                    }
                },
                "3": {
                    "class_type": "CLIPTextEncodeSDXL",
                    "inputs": {
                        "text_g": negative, "text_l": negative,
                        "width": width, "height": height,
                        "crop_w": 0, "crop_h": 0,
                        "target_width": width, "target_height": height,
                        "clip": ["1", 1]
                    }
                },
                "4": {
                    "class_type": "EmptyLatentImage",
                    "inputs": {"width": width, "height": height, "batch_size": 1}
                },
                "5": {
                    "class_type": "KSampler",
                    "inputs": {
                        "seed": seed, "steps": steps, "cfg": cfg,
                        "sampler_name": "dpmpp_2m", "scheduler": "karras",
                        "denoise": 1.0,
                        "model": ["1", 0], "positive": ["2", 0],
                        "negative": ["3", 0], "latent_image": ["4", 0]
                    }
                },
                "6": {
                    "class_type": "VAEDecode",
                    "inputs": {"samples": ["5", 0], "vae": ["1", 2]}
                },
                "7": {
                    "class_type": "SaveImage",
                    "inputs": {"filename_prefix": "video_gen", "images": ["6", 0]}
                }
            }
        }
    else:
        # diffusion_models — need separate UNET + CLIP + VAE loaders
        # CLIP from SDXL base checkpoint, VAE from ae.safetensors
        return {
            "prompt": {
                "1": {
                    "class_type": "UNETLoader",
                    "inputs": {
                        "unet_name": checkpoint,
                        "weight_dtype": "default"
                    }
                },
                "1b": {
                    "class_type": "CheckpointLoaderSimple",
                    "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}
                },
                "2": {
                    "class_type": "CLIPTextEncodeSDXL",
                    "inputs": {
                        "text_g": prompt, "text_l": prompt,
                        "width": width, "height": height,
                        "crop_w": 0, "crop_h": 0,
                        "target_width": width, "target_height": height,
                        "clip": ["1b", 1]
                    }
                },
                "3": {
                    "class_type": "CLIPTextEncodeSDXL",
                    "inputs": {
                        "text_g": negative, "text_l": negative,
                        "width": width, "height": height,
                        "crop_w": 0, "crop_h": 0,
                        "target_width": width, "target_height": height,
                        "clip": ["1b", 1]
                    }
                },
                "4": {
                    "class_type": "EmptyLatentImage",
                    "inputs": {"width": width, "height": height, "batch_size": 1}
                },
                "5": {
                    "class_type": "KSampler",
                    "inputs": {
                        "seed": seed, "steps": steps, "cfg": cfg,
                        "sampler_name": "dpmpp_2m", "scheduler": "karras",
                        "denoise": 1.0,
                        "model": ["1", 0], "positive": ["2", 0],
                        "negative": ["3", 0], "latent_image": ["4", 0]
                    }
                },
                "6": {
                    "class_type": "VAEDecode",
                    "inputs": {"samples": ["5", 0], "vae": ["1b", 2]}
                },
                "7": {
                    "class_type": "SaveImage",
                    "inputs": {"filename_prefix": "video_gen", "images": ["6", 0]}
                }
            }
        }


def queue_prompt(workflow: dict) -> str | None:
    """Send workflow to ComfyUI and return prompt_id."""
    data = json.dumps(workflow).encode("utf-8")
    req = urllib.request.Request(
        f"{COMFYUI_URL}/prompt",
        data=data,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
            return result.get("prompt_id")
    except urllib.error.URLError as e:
        print(f"  Error connecting to ComfyUI: {e}")
        return None


def wait_for_completion(prompt_id: str, timeout: int = 300) -> list[str]:
    """Poll ComfyUI history until prompt completes. Returns output filenames."""
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(f"{COMFYUI_URL}/history/{prompt_id}") as resp:
                history = json.loads(resp.read())

            if prompt_id in history:
                outputs = history[prompt_id].get("outputs", {})
                files = []
                for node_id, node_output in outputs.items():
                    if "images" in node_output:
                        for img in node_output["images"]:
                            files.append(img["filename"])
                return files
        except (urllib.error.URLError, json.JSONDecodeError):
            pass

        time.sleep(2)

    print(f"  Timeout waiting for prompt {prompt_id}")
    return []


def generate_image(prompt_text: str, output_name: str, images_dir: str,
                   seed: int = 42) -> bool:
    """Generate a single image and save to images_dir."""
    output_path = os.path.join(images_dir, output_name)
    if os.path.exists(output_path):
        print(f"  SKIP (exists): {output_name}")
        return True

    full_prompt = prompt_text + STYLE_SUFFIX
    workflow = build_sdxl_workflow(full_prompt, seed=seed, width=1344, height=768)

    prompt_id = queue_prompt(workflow)
    if not prompt_id:
        return False

    print(f"  Queued: {output_name} (seed={seed})...")
    files = wait_for_completion(prompt_id)

    if not files:
        print(f"  FAILED: {output_name}")
        return False

    # Copy first output file to target
    src = os.path.join(COMFYUI_OUTPUT, files[0])
    if os.path.exists(src):
        shutil.copy2(src, output_path)
        print(f"  Done: {output_name}")
        return True
    else:
        print(f"  Output not found: {src}")
        return False


# ─── ELDERBERRY IMAGE DEFINITIONS ───────────────────────────────────────────

ELDERBERRY_IMAGES = [
    # Botanical illustrations
    ("elderberry-flower-cluster.png",
     "Detailed botanical illustration of Sambucus nigra flower cluster, creamy white umbel-shaped inflorescence, five-petaled flowers with yellow stamens, compound pinnate leaves, scientific botanical plate style, cream parchment background, fine ink line work with watercolor washes"),
    ("elderberry-ripe-berries-closeup.png",
     "Botanical illustration of ripe Sambucus nigra elderberry cluster, deep purple-black glossy drupes hanging in drooping cyme, individual berries visible, dark stems contrasting with fruit, scientific accuracy, watercolor botanical plate on cream paper"),
    ("elderberry-leaf-detail.png",
     "Botanical study of Sambucus nigra compound pinnate leaf, five to seven serrated ovate leaflets, detailed venation visible, botanical illustration style, fine pen and watercolor, clean white background, herbarium specimen aesthetic"),
    ("elderberry-full-plant-lifecycle.png",
     "Botanical plate showing Sambucus nigra life stages: bare winter branches, spring leaf buds, summer cream flower umbels, autumn ripe purple-black berry clusters, composite scientific illustration, vintage natural history style"),

    # Historical / vintage
    ("pharmacopoeia-elderberry-page.png",
     "Aged yellowed page from 17th century herbal pharmacopoeia, ornate woodcut illustration of Sambucus nigra plant, Latin annotations in margins, foxing stains on paper, candlelight warmth, museum photograph of antique book"),
    ("victorian-herbalist-workshop.png",
     "Victorian era herbalist workshop interior, wooden shelves with labeled glass apothecary jars, bundles of dried herbs hanging from ceiling beams, copper mortar and pestle on oak workbench, elder flowers drying on linen cloth, amber afternoon light through leaded window, oil painting style"),
    ("hippocrates-medicine-scene.png",
     "Ancient Greek physician in white robes examining plants at a wooden table, terracotta vessels and scrolls around him, Mediterranean sunlight through stone archway, elder branches with berries on table, classical painting style, warm earth tones"),
    ("norse-elder-mother-spirit.png",
     "The Elder Mother spirit from Norse mythology, a translucent female figure within the trunk of a gnarled elder tree in a misty Nordic forest, ethereal green and silver light, moss-covered roots, mystical, Pre-Raphaelite painting style"),
    ("medieval-elder-manuscript.png",
     "Medieval illuminated manuscript illustration of elder tree, gold leaf border decorations, robed figure gathering berries, gothic text below in Latin, aged parchment texture, Book of Hours style"),

    # Scientific / lab
    ("cyanidin-molecule-visualization.png",
     "3D molecular structure of cyanidin-3-O-glucoside as ball-and-stick model, carbon atoms dark grey oxygen red hydrogen white, glucose moiety attached to flavylium core, purple glow around molecule, dark background with subtle grid, scientific visualization"),
    ("viral-replication-blocking.png",
     "Medical illustration showing influenza virus lifecycle being blocked: anthocyanin binding to hemagglutinin at cell membrane, neuraminidase inhibition, cell cross-section in soft blue, virus particles in red-orange, blocking indicated by red X marks, clean infographic style"),
    ("lab-hplc-analysis.png",
     "Modern analytical chemistry laboratory, HPLC instrument with glowing screen displaying chromatogram peaks, vials of deep purple elderberry extract in autosampler tray, scientist in lab coat examining results, clean white lab environment"),
    ("petri-dish-virus-inhibition.png",
     "Laboratory petri dishes side by side, left showing viral cytopathic effect in cell culture, right showing protected cells treated with elderberry extract with purple tint, labeled comparison, sterile lab bench"),

    # Process shots
    ("cold-maceration-mason-jar.png",
     "Large glass mason jar filled with dried elderberries submerged in clear vodka spirit, deep purple-black liquid developing color, sealed metal lid, rustic wooden shelf in dark pantry, amber side lighting, moody still life photography"),
    ("tincture-straining-cheesecloth.png",
     "Hands squeezing deep purple-black elderberry tincture through white cheesecloth over glass bowl, rich dark liquid streaming through fabric, spent berries visible, rustic wooden kitchen counter, warm natural light"),
    ("amber-dropper-bottles.png",
     "Row of amber glass dropper bottles being filled with deep purple elderberry tincture, rich opaque color of liquid, cork and glass droppers nearby, dark wood surface, apothecary aesthetic, warm lighting"),
    ("preparation-ingredients-flatlay.png",
     "Overhead flat lay of elderberry preparation ingredients: dried elderberries in wooden bowl, vodka bottle, mason jar, amber dropper bottles, cheesecloth, measuring spoons, dark slate surface, warm golden lighting, artisan apothecary aesthetic"),
    ("color-comparison-test.png",
     "White ceramic plate with two drops: left drop intense opaque purple-black elderberry tincture, right drop dull brownish-red commercial elderberry syrup, dramatic color difference, overhead view, demonstrative comparison photograph"),

    # Modern contrast
    ("health-store-elderberry-shelf.png",
     "Health food store shelf stocked with rows of commercial elderberry syrup bottles, various brands with colorful labels, plastic and glass bottles mixed, bright fluorescent store lighting, supplement aisle, documentary photography angle"),
    ("factory-syrup-production.png",
     "Industrial food processing facility, large stainless steel vats with elderberry liquid being heated, steam rising from open vessels, pasteurization equipment, conveyor belt with bottles, harsh industrial lighting, documentary style"),

    # Nature / landscape
    ("elder-tree-hedgerow-summer.png",
     "Mature Sambucus nigra elder tree in English countryside hedgerow, cream-white flower umbels covering canopy, wildflowers in meadow below, rolling green hills background, golden afternoon sunlight, landscape photography, pastoral British countryside"),
    ("elder-tree-autumn-berries.png",
     "Elder tree in early autumn loaded with drooping clusters of ripe purple-black elderberries, leaves beginning to yellow, soft overcast sky, European countryside, muted autumnal color palette, nature photography"),
    ("foraging-basket-elderberries.png",
     "Woven wicker basket filled with freshly picked elderberry clusters, deep purple berries with leaves and stems, mossy forest floor beside elder tree trunk, dappled woodland light, foraging aesthetic, nostalgic pastoral mood"),
    ("elderflower-closeup-bees.png",
     "Macro photography of Sambucus nigra flower umbel with honeybee visiting, individual tiny cream-white flowers visible with yellow anthers, pollen visible, soft green bokeh background, natural daylight"),
    ("elder-tree-cottage-doorway.png",
     "Old European stone cottage with mature elder tree growing beside doorway, traditional folk belief, thatched roof, climbing roses on wall, summer afternoon light, nostalgic rural scene"),

    # Key scenes
    ("elderberries-boiling-destruction.png",
     "Elderberries being boiled violently in pot of water, steam billowing, purple color of liquid visibly fading to brown-red, thermometer showing 100C, dramatic top-down view, visual destruction of color representing anthocyanin loss"),
    ("ancient-elder-tree-misty.png",
     "Ancient gnarled elder tree trunk with moss and lichen, roots gripping stone ruins, misty forest background, golden side light breaking through canopy, mythic atmosphere, cinematic wide shot"),
    ("nature-vs-industry.png",
     "Wide shot of ancient elder tree standing alone in field, modern pharmaceutical factory visible small and distant on horizon, contrast between nature and industry, golden hour light on tree while factory in grey shadow"),
]


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 video/generate-images-comfyui.py <project-slug>")
        print("\nMake sure ComfyUI is running at http://127.0.0.1:8188")
        sys.exit(1)

    slug = sys.argv[1]
    project_dir = os.path.join(BASE_DIR, slug)
    images_dir = os.path.join(project_dir, "images")

    if not os.path.exists(project_dir):
        print(f"Project not found: {project_dir}")
        sys.exit(1)

    os.makedirs(images_dir, exist_ok=True)

    # Check ComfyUI is running
    try:
        urllib.request.urlopen(f"{COMFYUI_URL}/system_stats")
    except urllib.error.URLError:
        print(f"ComfyUI not running at {COMFYUI_URL}")
        print("Start ComfyUI first: cd ~/Documents/comfy && python ComfyUI/main.py")
        sys.exit(1)

    # Select image set
    if slug == "elderberry-lie":
        images = ELDERBERRY_IMAGES
    else:
        print(f"No image definitions for '{slug}'. Add them to this script.")
        sys.exit(1)

    model_name, model_loc = find_model()
    print(f"Generating {len(images)} images for: {slug}")
    print(f"Model: {model_name} (from {model_loc}/)")
    print(f"Output: {images_dir}/")
    print(f"Settings: DPM++ 2M Karras, 30 steps, CFG 6, 1344x768")
    print()

    success = 0
    failed = 0

    for i, (filename, prompt) in enumerate(images):
        print(f"[{i+1}/{len(images)}] {filename}")
        seed = 42 + i * 137  # Deterministic but varied seeds
        if generate_image(prompt, filename, images_dir, seed=seed):
            success += 1
        else:
            failed += 1

    print(f"\nDone! {success} generated, {failed} failed")
    print(f"Total images in {images_dir}/: {len(os.listdir(images_dir))}")


if __name__ == "__main__":
    main()
