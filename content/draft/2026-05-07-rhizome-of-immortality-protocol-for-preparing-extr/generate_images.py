#!/usr/bin/env python3
"""
Generate 5 images for Ashitaba article using ComfyUI API
"""

import json
import requests
import random
import time
from pathlib import Path

# ComfyUI API endpoint
COMFYUI_URL = "http://127.0.0.1:8188"
COMFUL_URL = COMFYUI_URL  # Alias for typo compatibility
OUTPUT_DIR = Path("/Users/mi4u/Projects/the-ancestral-forge/content/ideas/filar-i-02-klacze-niesmiertelnosci-protokol-przygotowania-ek/images")

# Prompts for 5 different images about Ashitaba
PROMPTS = [
    {
        "name": "01_ashitaba_plant",
        "positive": "beautiful Angelica keiskei ashitaba plant in natural garden setting, lush green leaves, delicate yellow flowers, soft natural sunlight, botanical photography, shallow depth of field, professional photo, high detail, 8k",
        "negative": "blurry, text, watermark, logo, low quality, distorted, ugly, deformed, bad anatomy"
    },
    {
        "name": "02_ashitaba_roots",
        "positive": "close-up of Angelica keiskei ashitaba roots, orange-yellow tuberous roots, fresh harvested, soil background, natural lighting, macro photography, botanical detail, food photography style, high detail",
        "negative": "blurry, text, watermark, logo, low quality, distorted, ugly, deformed, bad anatomy, overexposed"
    },
    {
        "name": "03_extraction_process",
        "positive": "alcohol extraction tincture making process, glass jars with Angelica keiskei plant material in alcohol, amber liquid, laboratory equipment, soft lighting, professional photography, clean composition",
        "negative": "blurry, text, watermark, logo, low quality, distorted, ugly, dark, underexposed"
    },
    {
        "name": "04_finished_tincture",
        "positive": "bottles of amber tincture from Angelica keiskei ashita, dark glass bottles with golden liquid, labels, elegant presentation, soft studio lighting, professional product photography, warm tones",
        "negative": "blurry, text, watermark, logo, low quality, distorted, ugly, dark, underexposed, cheap"
    },
    {
        "name": "05_health_benefits",
        "positive": "concept art representing longevity and vitality, ethereal glow, molecular structures, healing energy, golden light, abstract representation of anti-aging, sophisticated, artistic, premium quality",
        "negative": "blurry, text, watermark, logo, low quality, distorted, ugly, dark, cluttered"
    }
]

def queue_prompt(prompt):
    """Send prompt to ComfyUI API and return the prompt_id"""
    p = {"prompt": prompt}
    data = json.dumps(p).encode('utf-8')
    headers = {'Content-Type': 'application/json'}
    
    try:
        response = requests.post(f"{COMFUL_URL}/prompt", headers=headers, data=data)
        response.raise_for_status()
        return response.json()['prompt_id']
    except Exception as e:
        print(f"Error queuing prompt: {e}")
        return None

def get_history(prompt_id):
    """Get generation history for a prompt_id"""
    try:
        response = requests.get(f"{COMFYUI_URL}/history/{prompt_id}")
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error getting history: {e}")
        return None

def get_image_filename(prompt_id, output_dir):
    """Get the generated image filename from history"""
    history = get_history(prompt_id)
    if history and prompt_id in history:
        for node_id, node_output in history[prompt_id]['outputs'].items():
            if 'images' in node_output:
                for image in node_output['images']:
                    return image['filename']
    return None

def create_workflow(prompt, output_name):
    """Create a ComfyUI workflow for a specific prompt"""
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
                "widgets_values": ["v1-5-pruned-emaonly.ckpt"]
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
                "widgets_values": [prompt["positive"]]
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
                "widgets_values": [prompt["negative"]]
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
                "widgets_values": [512, 512, 1]
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
                "widgets_values": [1, 20, 8.0, random.randint(1, 999999999), "fixed", 1, 1]
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
                "widgets_values": [output_name]
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
    
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    for i, prompt_data in enumerate(PROMPTS, 1):
        print(f"\n[{i}/{len(PROMPTS)}] Generating: {prompt_data['name']}")
        
        workflow = create_workflow(prompt_data, prompt_data['name'])
        
        try:
            response = requests.post(
                f"{COMFYUI_URL}/prompt",
                json={"prompt": workflow},
                headers={'Content-Type': 'application/json'}
            )
            response.raise_for_status()
            result = response.json()
            prompt_id = result['prompt_id']
            print(f"  Prompt ID: {prompt_id}")
            
            # Wait for generation to complete
            time.sleep(10)  # Give it time to process
            
            # Try to get the result
            history_response = requests.get(f"{COMFYUI_URL}/history/{prompt_id}")
            if history_response.status_code == 200:
                history = history_response.json()
                if prompt_id in history:
                    outputs = history[prompt_id]['outputs']
                    for node_id, node_output in outputs.items():
                        if 'images' in node_output:
                            for image in node_output['images']:
                                print(f"  Generated: {image['filename']}")
            
            time.sleep(5)  # Small delay between generations
            
        except Exception as e:
            print(f"  Error generating image: {e}")
            continue
    
    print("\nImage generation complete!")
    print(f"Check {OUTPUT_DIR} for generated images")

if __name__ == "__main__":
    generate_images()
