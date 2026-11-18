#!/usr/bin/env python3
"""
Generate 5 images for Ashitaba article using ComfyUI API
"""

import json
import requests
import time
import os

COMFYUI_URL = "http://127.0.0.1:8188"
OUTPUT_DIR = "/Users/mi4u/Projects/the-ancestral-forge/content/review/2026-05-06-filar-i-02-klacze-niesmiertelnosci-protokol-przygotowania-ek/images"

# Define the 5 prompts for Ashitaba images
PROMPTS = [
    {
        "name": "ashitaba_plant",
        "prompt": "Angelica keiskei ashitaba plant in natural garden, lush green leaves, delicate yellow flowers, soft sunlight, botanical photography, professional photo, high detail, realistic",
        "negative": "blurry, text, watermark, logo, low quality, distorted, ugly, deformed, bad anatomy, drawing, illustration, cartoon"
    },
    {
        "name": "ashitaba_roots",
        "prompt": "Close-up of fresh Angelica keiskei ashitaba roots and tubers, orange-yellow roots, soil background, natural lighting, macro photography, botanical detail, food photography, realistic",
        "negative": "blurry, text, watermark, logo, low quality, distorted, ugly, deformed, bad anatomy, drawing, illustration, cartoon"
    },
    {
        "name": "extraction_process",
        "prompt": "Alcohol extraction tincture making process, glass jars with Angelica keiskei plant material in alcohol, amber liquid, soft lighting, laboratory setting, professional photography, clean composition",
        "negative": "blurry, text, watermark, logo, low quality, distorted, ugly, dark, underexposed, drawing, illustration"
    },
    {
        "name": "finished_tincture",
        "prompt": "Bottles of amber tincture from Angelica keiskei, dark glass bottles with golden liquid, elegant presentation, soft studio lighting, professional product photography, warm tones, realistic",
        "negative": "blurry, text, watermark, logo, low quality, distorted, ugly, dark, underexposed, cheap, drawing, illustration"
    },
    {
        "name": "health_benefits",
        "prompt": "Concept art representing longevity and vitality with Ashitaba, ethereal golden glow, molecular structures, healing energy, sophisticated, artistic, premium quality, abstract representation of anti-aging",
        "negative": "blurry, text, watermark, logo, low quality, distorted, ugly, dark, cluttered, drawing, illustration, cartoon"
    }
]

def create_workflow(prompt_data):
    """Create a ComfyUI workflow for generating an image"""
    workflow = {
        "last_node_id": 10,
        "last_link_id": 10,
        "nodes": [
            {
                "id": 1,
                "type": "CheckpointLoaderSimple",
                "pos": [200, 200],
                "size": [250, 100],
                "flags": {},
                "order": 0,
                "mode": 0,
                "inputs": [],
                "outputs": [
                    {"name": "MODEL", "type": "MODEL", "links": [1], "slot_index": 0},
                    {"name": "CLIP", "type": "CLIP", "links": [2], "slot_index": 1},
                    {"name": "VAE", "type": "VAE", "links": [3], "slot_index": 2}
                ],
                "properties": {"Node name for S&R": "CheckpointLoaderSimple"},
                "widgets_values": ["sd_xl_base_1.0.safetensors"]
            },
            {
                "id": 2,
                "type": "CLIPTextEncode",
                "pos": [500, 100],
                "size": [250, 80],
                "flags": {},
                "order": 1,
                "mode": 0,
                "inputs": [{"name": "clip", "type": "CLIP", "link": 2}],
                "outputs": [{"name": "CONDITIONING", "type": "CONDITIONING", "links": [4], "slot_index": 0}],
                "properties": {"Node name for S&R": "CLIPTextEncode"},
                "widgets_values": [prompt_data["prompt"]]
            },
            {
                "id": 3,
                "type": "CLIPTextEncode",
                "pos": [500, 300],
                "size": [250, 80],
                "flags": {},
                "order": 2,
                "mode": 0,
                "inputs": [{"name": "clip", "type": "CLIP", "link": 2}],
                "outputs": [{"name": "CONDITIONING", "type": "CONDITIONING", "links": [5], "slot_index": 0}],
                "properties": {"Node name for S&R": "CLIPTextEncode"},
                "widgets_values": [prompt_data["negative"]]
            },
            {
                "id": 4,
                "type": "EmptyLatentImage",
                "pos": [200, 400],
                "size": [250, 100],
                "flags": {},
                "order": 3,
                "mode": 0,
                "inputs": [],
                "outputs": [{"name": "LATENT", "type": "LATENT", "links": [6], "slot_index": 0}],
                "properties": {"Node name for S&R": "EmptyLatentImage"},
                "widgets_values": [1024, 768, 1]
            },
            {
                "id": 5,
                "type": "KSampler",
                "pos": [800, 200],
                "size": [250, 150],
                "flags": {},
                "order": 4,
                "mode": 0,
                "inputs": [
                    {"name": "model", "type": "MODEL", "link": 1},
                    {"name": "positive", "type": "CONDITIONING", "link": 4},
                    {"name": "negative", "type": "CONDITIONING", "link": 5},
                    {"name": "latent_image", "type": "LATENT", "link": 6}
                ],
                "outputs": [{"name": "LATENT", "type": "LATENT", "links": [7], "slot_index": 0}],
                "properties": {"Node name for S&R": "KSampler"},
                "widgets_values": [1, 35, 7.5, hash(prompt_data["name"]) % 1000000000, "fixed", 1, 1]
            },
            {
                "id": 6,
                "type": "VAEDecode",
                "pos": [1100, 200],
                "size": [200, 80],
                "flags": {},
                "order": 5,
                "mode": 0,
                "inputs": [
                    {"name": "samples", "type": "LATENT", "link": 7},
                    {"name": "vae", "type": "VAE", "link": 3}
                ],
                "outputs": [{"name": "IMAGE", "type": "IMAGE", "links": [8], "slot_index": 0}],
                "properties": {"Node name for S&R": "VAEDecode"}
            },
            {
                "id": 7,
                "type": "SaveImage",
                "pos": [1400, 200],
                "size": [200, 80],
                "flags": {},
                "order": 6,
                "mode": 0,
                "inputs": [{"name": "images", "type": "IMAGE", "link": 8}],
                "outputs": [],
                "properties": {"Node name for S&R": "SaveImage"},
                "widgets_values": [f"ashitaba_{prompt_data['name']}"]
            }
        ],
        "links": [
            [1, 1, 0, 2, 0, "MODEL"],
            [2, 1, 1, 2, 0, "CLIP"],
            [3, 1, 2, 3, 0, "VAE"],
            [4, 2, 0, 5, 1, "CONDITIONING"],
            [5, 3, 0, 5, 2, "CONDITIONING"],
            [6, 4, 0, 5, 3, "LATENT"],
            [7, 5, 0, 6, 0, "LATENT"],
            [8, 6, 0, 7, 0, "IMAGE"]
        ],
        "groups": [],
        "config": {},
        "extra": {},
        "version": 0.4
    }
    return workflow

def generate_images():
    """Generate all 5 images"""
    print(f"Starting image generation for Ashitaba article...")
    print(f"Output directory: {OUTPUT_DIR}")
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    for i, prompt_data in enumerate(PROMPTS, 1):
        print(f"\n[{i}/{len(PROMPTS)}] Generating: {prompt_data['name']}")
        
        workflow = create_workflow(prompt_data)
        
        try:
            response = requests.post(
                f"{COMFYUI_URL}/prompt",
                json={"prompt": workflow},
                headers={'Content-Type': 'application/json'},
                timeout=120
            )
            response.raise_for_status()
            result = response.json()
            prompt_id = result['prompt_id']
            print(f"  Prompt ID: {prompt_id}")
            
            # Wait for generation to complete
            print(f"  Waiting for generation...")
            time.sleep(25)
            
            # Check history
            history_response = requests.get(f"{COMFYUI_URL}/history/{prompt_id}")
            if history_response.status_code == 200:
                history = history_response.json()
                if prompt_id in history:
                    outputs = history[prompt_id]['outputs']
                    for node_id, node_output in outputs.items():
                        if 'images' in node_output:
                            for image in node_output['images']:
                                print(f"  Generated: {image['filename']}")
            
            time.sleep(3)  # Small delay between generations
            
        except Exception as e:
            print(f"  Error generating image: {e}")
            continue
    
    print("\nImage generation complete!")
    print(f"Check {OUTPUT_DIR} for generated images")

if __name__ == "__main__":
    generate_images()
