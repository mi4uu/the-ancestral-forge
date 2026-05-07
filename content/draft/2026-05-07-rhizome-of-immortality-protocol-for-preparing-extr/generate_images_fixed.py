#!/usr/bin/env python3
"""
Generate 5 images for Ashitaba article using ComfyUI API
Uses the correct workflow format based on successful ComfyUI history
"""

import json
import requests
import time
from pathlib import Path

# ComfyUI API endpoint
COMFYUI_URL = "http://127.0.0.1:8188"
OUTPUT_DIR = Path("/Users/mi4u/Projects/the-ancestral-forge/content/review/2026-05-06-filar-i-02-klacze-niesmiertelnosci-protokol-przygotowania-ek/images")

# Prompts for 5 different images about Ashitaba
PROMPTS = [
    {
        "name": "ashitaba_plant",
        "positive": "Angelica keiskei ashitaba plant in natural garden setting, lush green leaves, delicate yellow flowers, soft sunlight, botanical photography, professional photo, high detail, realistic, no text, no letters",
        "negative": "blurry, text, watermark, logo, low quality, distorted, ugly, deformed, bad anatomy, letters, words, characters, caption",
        "filename": "ashitaba_plant"
    },
    {
        "name": "ashitaba_roots",
        "positive": "Close-up of fresh Angelica keiskei ashitaba roots and tubers, orange-yellow roots, soil background, natural lighting, macro photography, botanical detail, food photography, realistic, no text",
        "negative": "blurry, text, watermark, logo, low quality, distorted, ugly, deformed, bad anatomy, letters, words, characters, caption",
        "filename": "ashitaba_roots"
    },
    {
        "name": "extraction_process",
        "positive": "Alcohol extraction tincture making process, glass jars with Angelica keiskei plant material in alcohol, amber liquid, soft lighting, laboratory setting, professional photography, clean composition, no text, no letters",
        "negative": "blurry, text, watermark, logo, low quality, distorted, ugly, dark, underexposed, letters, words, characters",
        "filename": "ashitaba_extraction"
    },
    {
        "name": "finished_tincture",
        "positive": "Bottles of amber tincture from Angelica keiskei, dark glass bottles with golden liquid, elegant presentation, soft studio lighting, professional product photography, warm tones, realistic, no text, no labels",
        "negative": "blurry, text, watermark, logo, low quality, distorted, ugly, dark, underexposed, cheap, letters, words, characters, labels",
        "filename": "ashitaba_tincture"
    },
    {
        "name": "health_benefits",
        "positive": "Concept art representing longevity and vitality, ethereal golden glow, molecular structures, healing energy, sophisticated, artistic, premium quality, abstract representation of anti-aging, no text, no letters",
        "negative": "blurry, text, watermark, logo, low quality, distorted, ugly, dark, cluttered, letters, words, characters, labels, caption",
        "filename": "ashitaba_longevity"
    }
]

def create_workflow(prompt_data):
    """Create a ComfyUI workflow using the correct dictionary format"""
    workflow = {
        "3": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}
        },
        "4": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": prompt_data["positive"], "clip": ["3", 1]}
        },
        "5": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": prompt_data["negative"], "clip": ["3", 1]}
        },
        "6": {
            "class_type": "EmptyLatentImage",
            "inputs": {"width": 1024, "height": 768, "batch_size": 1}
        },
        "7": {
            "class_type": "KSampler",
            "inputs": {
                "model": ["3", 0],
                "seed": 123456789,
                "steps": 30,
                "cfg": 7.5,
                "sampler_name": "dpmpp_2m",
                "scheduler": "karras",
                "positive": ["4", 0],
                "negative": ["5", 0],
                "latent_image": ["6", 0],
                "denoise": 1.0
            }
        },
        "8": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["7", 0], "vae": ["3", 2]}
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {"images": ["8", 0], "filename_prefix": prompt_data["filename"]}
        }
    }
    return workflow

def queue_prompt(prompt):
    """Send prompt to ComfyUI API and return the prompt_id"""
    try:
        response = requests.post(
            f"{COMFYUI_URL}/prompt",
            json={"prompt": prompt},
            headers={'Content-Type': 'application/json'},
            timeout=120
        )
        response.raise_for_status()
        result = response.json()
        return result.get('prompt_id')
    except Exception as e:
        print(f"Error queuing prompt: {e}")
        return None

def wait_for_generation(prompt_id, timeout=120):
    """Wait for generation to complete and return result"""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            response = requests.get(f"{COMFYUI_URL}/history/{prompt_id}")
            if response.status_code == 200:
                history = response.json()
                if prompt_id in history:
                    return history[prompt_id]
            time.sleep(2)
        except Exception as e:
            print(f"Error checking history: {e}")
            time.sleep(2)
    return None

def generate_images():
    """Generate all 5 images"""
    print(f"Starting image generation for Ashitaba article...")
    print(f"Output directory: {OUTPUT_DIR}")
    
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    for i, prompt_data in enumerate(PROMPTS, 1):
        print(f"\n[{i}/{len(PROMPTS)}] Generating: {prompt_data['name']}")
        
        workflow = create_workflow(prompt_data)
        
        prompt_id = queue_prompt(workflow)
        if not prompt_id:
            print(f"  Failed to queue prompt")
            continue
        
        print(f"  Prompt ID: {prompt_id}")
        print(f"  Waiting for generation...")
        
        result = wait_for_generation(prompt_id)
        if result and prompt_id in result:
            outputs = result[prompt_id]['outputs']
            for node_id, node_output in outputs.items():
                if 'images' in node_output:
                    for image in node_output['images']:
                        print(f"  Generated: {image['filename']}")
        
        time.sleep(3)  # Small delay between generations
    
    print("\nImage generation complete!")
    print(f"Check {OUTPUT_DIR} for generated images")

if __name__ == "__main__":
    generate_images()
