#!/usr/bin/env python3
"""Generate additional images to fill gaps — every segment needs unique visual."""

import sys
import os
import json
import time
import shutil
import urllib.request
import urllib.error

COMFYUI_URL = "http://127.0.0.1:8188"
COMFYUI_OUTPUT = os.path.expanduser("~/Documents/comfy/ComfyUI/output")
IMAGES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "elderberry-lie", "images")

NEGATIVE = (
    "3D, ai generated, semi realistic, illustrated, drawing, comic, "
    "digital painting, 3D model, blender, video game screenshot, render, "
    "smooth textures, CGI, masterpiece, text, writing, subtitle, watermark, "
    "logo, blurry, low quality, jpeg, artifacts, grainy"
)


def find_checkpoint():
    ckpt_dir = os.path.expanduser("~/Documents/comfy/ComfyUI/models/checkpoints")
    for name in os.listdir(ckpt_dir):
        if "juggernaut" in name.lower():
            return name
        if "realvis" in name.lower():
            return name
    return "sd_xl_base_1.0.safetensors"


def queue_and_wait(prompt_text: str, filename: str, seed: int = 42):
    output_path = os.path.join(IMAGES_DIR, filename)
    if os.path.exists(output_path):
        print(f"  SKIP: {filename}")
        return True

    checkpoint = find_checkpoint()
    style = ", high resolution, skin textures, cinematic lighting, warm earth tones, moody atmospheric, editorial photography quality"
    full_prompt = prompt_text + style

    workflow = {
        "prompt": {
            "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": checkpoint}},
            "2": {"class_type": "CLIPTextEncodeSDXL", "inputs": {
                "text_g": full_prompt, "text_l": full_prompt,
                "width": 1344, "height": 768, "crop_w": 0, "crop_h": 0,
                "target_width": 1344, "target_height": 768, "clip": ["1", 1]}},
            "3": {"class_type": "CLIPTextEncodeSDXL", "inputs": {
                "text_g": NEGATIVE, "text_l": NEGATIVE,
                "width": 1344, "height": 768, "crop_w": 0, "crop_h": 0,
                "target_width": 1344, "target_height": 768, "clip": ["1", 1]}},
            "4": {"class_type": "EmptyLatentImage", "inputs": {"width": 1344, "height": 768, "batch_size": 1}},
            "5": {"class_type": "KSampler", "inputs": {
                "seed": seed, "steps": 30, "cfg": 6.0,
                "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0,
                "model": ["1", 0], "positive": ["2", 0], "negative": ["3", 0], "latent_image": ["4", 0]}},
            "6": {"class_type": "VAEDecode", "inputs": {"samples": ["5", 0], "vae": ["1", 2]}},
            "7": {"class_type": "SaveImage", "inputs": {"filename_prefix": "extra_gen", "images": ["6", 0]}}
        }
    }

    data = json.dumps(workflow).encode()
    req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp:
            prompt_id = json.loads(resp.read()).get("prompt_id")
    except Exception as e:
        print(f"  ERROR: {e}")
        return False

    # Wait for completion
    for _ in range(150):  # 5 min timeout
        time.sleep(2)
        try:
            with urllib.request.urlopen(f"{COMFYUI_URL}/history/{prompt_id}") as resp:
                history = json.loads(resp.read())
            if prompt_id in history:
                outputs = history[prompt_id].get("outputs", {})
                for node_output in outputs.values():
                    if "images" in node_output:
                        src = os.path.join(COMFYUI_OUTPUT, node_output["images"][0]["filename"])
                        if os.path.exists(src):
                            shutil.copy2(src, output_path)
                            print(f"  OK: {filename}")
                            return True
        except Exception:
            pass
    print(f"  TIMEOUT: {filename}")
    return False


# Additional images to fill narrative gaps
EXTRA_IMAGES = [
    # Intro/hook visuals
    ("hook-syrup-pour-brown.png", "Close-up of brown-red elderberry syrup being poured from commercial plastic bottle, dull color, artificial looking, pharmacy shelf blurred in background, critical documentary angle"),
    ("hook-tincture-deep-purple.png", "Close-up of deep opaque purple-black elderberry tincture in amber glass dropper bottle, rich vibrant color, dark wood surface, candlelight, apothecary aesthetic"),
    ("hook-money-pills.png", "Pile of supplement capsules and pills mixed with dollar bills on dark surface, pharmaceutical industry money concept, dramatic studio lighting"),

    # More botanical variety
    ("elderberry-branch-ripe-01.png", "Branch of Sambucus nigra heavy with ripe dark purple elderberry clusters, drooping under weight, green leaves, soft bokeh garden background, golden hour light"),
    ("elderberry-branch-ripe-02.png", "Close-up of single elderberry cluster, individual berries glistening with morning dew, deep purple almost black, macro photography, shallow depth of field"),
    ("elderberry-dried-bowl.png", "Wooden bowl filled with dried elderberries, small wrinkled dark purple berries, rustic kitchen surface, burlap cloth underneath, warm side lighting"),
    ("elderberry-fresh-vs-dried.png", "Side by side comparison on white marble: fresh glistening elderberry cluster on left, dried shriveled elderberries on right, clear visual comparison, overhead photography"),

    # Historical variety
    ("old-herbal-book-open.png", "Antique leather-bound herbal medicine book open to pages about elderberry, aged yellowed pages, candlelight illumination, wooden reading desk, scholarly atmosphere"),
    ("apothecary-jars-shelf.png", "Row of labeled glass apothecary jars on dark wooden shelf, some containing dried herbs and berries, amber and clear glass, old pharmacy aesthetic, warm dim lighting"),
    ("grandmother-kitchen-herbs.png", "Vintage photograph style image of elderly woman's hands preparing herbal tincture in farmhouse kitchen, dried herbs hanging from ceiling beams, warm nostalgic mood"),

    # Science/lab variety
    ("lab-purple-vials-rack.png", "Test tube rack with vials of elderberry extract in varying concentrations, deep purple to light pink gradient left to right, clean white lab background, scientific precision"),
    ("microscope-cell-culture.png", "Scientist looking through microscope at cell culture, purple-tinted petri dish visible, modern research laboratory, blue and white lighting"),
    ("chemical-structure-board.png", "Whiteboard or glass board with hand-drawn molecular structure diagrams of anthocyanins, markers and equations, university lab setting, soft focus background"),
    ("virus-3d-render.png", "Dramatic 3D visualization of influenza virus particle, spike proteins visible on surface, dark background with blue-purple lighting, medical illustration quality"),

    # Heat/destruction variety
    ("thermometer-boiling-pot.png", "Kitchen thermometer showing 100 degrees Celsius clipped to pot of boiling elderberry liquid, steam rising, bubbles visible, dramatic angle"),
    ("steam-rising-pot.png", "Dense steam rising from large pot on stove, dark elderberry liquid barely visible below, dramatic backlighting, moody kitchen atmosphere"),
    ("factory-conveyor-bottles.png", "Industrial bottling line conveyor belt with elderberry syrup bottles being filled, sterile factory environment, fluorescent lighting, mass production feel"),
    ("syrup-label-ingredients.png", "Extreme close-up of commercial elderberry syrup ingredient list on label, sugar or honey listed first, blurred bottle in background, critical consumer perspective"),

    # Process/preparation variety
    ("vodka-pour-into-jar.png", "Clear vodka being poured from bottle into mason jar already containing dried elderberries, liquid splashing over dark berries, kitchen counter, warm afternoon light"),
    ("tincture-aging-shelf.png", "Three mason jars of elderberry tincture at different stages: day 1 light purple, day 14 medium purple, day 42 deep opaque black-purple, labeled with dates, dark pantry shelf"),
    ("amber-bottles-labeled.png", "Collection of filled amber glass tincture bottles with handwritten labels reading Elderberry Tincture with dates, cork stoppers, dark wood display, professional herbalist setup"),
    ("cheesecloth-straining-closeup.png", "Extreme close-up of deep purple elderberry tincture being strained through white cheesecloth layers, rich color contrast, droplets forming"),
    ("honey-dipper-golden.png", "Golden raw honey dripping from wooden honey dipper into glass jar, warm amber tones, macro photography, blurred honeycomb in background"),

    # Nature variety
    ("elder-tree-misty-morning.png", "Large elder tree in misty morning field, soft diffused golden light, dewdrops on leaves, atmospheric European countryside, landscape photography"),
    ("elder-bark-texture.png", "Close-up of elder tree bark texture, deeply furrowed grey-brown cork-like surface, moss growing in crevices, macro photography, natural textures"),
    ("elderflower-umbel-detail.png", "Single perfect elderflower umbel in full bloom, hundreds of tiny cream-white flowers, soft green bokeh background, natural light, botanical detail"),
    ("foraging-hand-picking.png", "Person's hand carefully picking ripe elderberry cluster from wild tree, rural landscape background, autumn afternoon light, sustainable foraging moment"),
    ("elder-tree-winter-frost.png", "Bare elder tree branches covered in frost crystals against pale blue winter sky, minimalist composition, cold morning light"),

    # Comparison/contrast visuals
    ("pharmacy-aisle-supplements.png", "Long pharmacy supplement aisle with rows of bottles, fluorescent overhead lighting, commercial retail environment, slightly desaturated documentary look"),
    ("tamiflu-box-pills.png", "Tamiflu prescription box with blister pack of capsules partially removed, pharmacy counter background, clinical sterile lighting"),
    ("cost-comparison-table.png", "Flat lay comparison: small commercial syrup bottle with $30 price tag on left, large bag of dried elderberries with vodka bottle and $3.50 total on right, dark slate surface"),

    # Mood/atmosphere
    ("candlelight-apothecary.png", "Atmospheric apothecary scene by candlelight, amber glass bottles casting warm shadows, dried herbs and berries on wooden workbench, medieval herbalist mood"),
    ("sunrise-elder-grove.png", "Grove of elder trees at sunrise, golden light streaming through branches, wildflower meadow below, mist rising from ground, ethereal European landscape"),
    ("dark-forest-elder-ancient.png", "Ancient gnarled elder tree in dark primeval forest, moss-covered roots spread wide, single beam of golden light illuminating trunk, mystical fairy-tale atmosphere"),
    ("storm-clouds-field.png", "Dramatic storm clouds over open field with single elder tree standing resilient, contrast of dark sky and golden grass, power of nature, cinematic landscape"),

    # Abstract/conceptual
    ("purple-liquid-swirl.png", "Deep purple elderberry extract swirling in clear liquid, abstract macro photography, rich violet and black tones mixing with amber, artistic fluid dynamics"),
    ("broken-glass-syrup.png", "Shattered commercial elderberry syrup bottle on dark surface, brown-red liquid spreading, metaphor for broken promises, dramatic still life, single spotlight"),
    ("roots-underground.png", "Cross-section illustration of elder tree root system underground, intricate network of roots reaching deep into dark earth, connection to mycorrhizal network, educational cut-away"),
]

def main():
    os.makedirs(IMAGES_DIR, exist_ok=True)

    try:
        urllib.request.urlopen(f"{COMFYUI_URL}/system_stats")
    except:
        print("ComfyUI not running!")
        sys.exit(1)

    print(f"Generating {len(EXTRA_IMAGES)} additional images...")
    print(f"Model: {find_checkpoint()}")
    print(f"Output: {IMAGES_DIR}/\n")

    ok, fail = 0, 0
    for i, (filename, prompt) in enumerate(EXTRA_IMAGES):
        print(f"[{i+1}/{len(EXTRA_IMAGES)}] {filename}")
        if queue_and_wait(prompt, filename, seed=1000 + i * 97):
            ok += 1
        else:
            fail += 1

    print(f"\nDone! {ok} generated, {fail} failed")
    total = len([f for f in os.listdir(IMAGES_DIR) if f.endswith(('.png', '.jpg'))])
    print(f"Total images in project: {total}")


if __name__ == "__main__":
    main()
