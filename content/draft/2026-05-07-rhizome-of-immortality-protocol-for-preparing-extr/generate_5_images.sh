#!/bin/bash
# Generate 5 images for Ashitaba article using ComfyUI API

BASE_URL="http://127.0.0.1:8188"

# Image 1: Ashitaba Plant
curl -s -X POST "$BASE_URL/prompt" -H "Content-Type: application/json" -d '{
  "prompt": {
    "3": {"class_type": "KSampler", "inputs": {"seed": 111111111, "steps": 30, "cfg": 7.5, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0]}},
    "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
    "5": {"class_type": "EmptyLatentImage", "inputs": {"width": 1024, "height": 768, "batch_size": 1}},
    "6": {"class_type": "CLIPTextEncode", "inputs": {"text": "Angelica keiskei ashitaba plant in natural garden setting, lush green leaves, delicate yellow flowers, soft sunlight, botanical photography, professional photo, high detail, realistic, no text, no letters", "clip": ["4", 1]}},
    "7": {"class_type": "CLIPTextEncode", "inputs": {"text": "blurry, text, watermark, logo, low quality, distorted, ugly, deformed, bad anatomy, letters, words, characters, caption", "clip": ["4", 1]}},
    "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
    "9": {"class_type": "SaveImage", "inputs": {"images": ["8", 0], "filename_prefix": "ashitaba_plant"}}
  }
}' > /dev/null 2>&1

echo "Submitted image 1: ashitaba_plant"

# Image 2: Ashitaba Roots
curl -s -X POST "$BASE_URL/prompt" -H "Content-Type: application/json" -d '{
  "prompt": {
    "3": {"class_type": "KSampler", "inputs": {"seed": 222222222, "steps": 30, "cfg": 7.5, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0]}},
    "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
    "5": {"class_type": "EmptyLatentImage", "inputs": {"width": 1024, "height": 768, "batch_size": 1}},
    "6": {"class_type": "CLIPTextEncode", "inputs": {"text": "Close-up of fresh Angelica keiskei ashitaba roots and tubers, orange-yellow roots, soil background, natural lighting, macro photography, botanical detail, food photography, realistic, no text", "clip": ["4", 1]}},
    "7": {"class_type": "CLIPTextEncode", "inputs": {"text": "blurry, text, watermark, logo, low quality, distorted, ugly, deformed, bad anatomy, letters, words, characters, caption", "clip": ["4", 1]}},
    "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
    "9": {"class_type": "SaveImage", "inputs": {"images": ["8", 0], "filename_prefix": "ashitaba_roots"}}
  }
}' > /dev/null 2>&1

echo "Submitted image 2: ashitaba_roots"

# Image 3: Extraction Process
curl -s -X POST "$BASE_URL/prompt" -H "Content-Type: application/json" -d '{
  "prompt": {
    "3": {"class_type": "KSampler", "inputs": {"seed": 333333333, "steps": 30, "cfg": 7.5, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0]}},
    "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
    "5": {"class_type": "EmptyLatentImage", "inputs": {"width": 1024, "height": 768, "batch_size": 1}},
    "6": {"class_type": "CLIPTextEncode", "inputs": {"text": "Alcohol extraction tincture making process, glass jars with Angelica keiskei plant material in alcohol, amber liquid, soft lighting, laboratory setting, professional photography, clean composition, no text, no letters", "clip": ["4", 1]}},
    "7": {"class_type": "CLIPTextEncode", "inputs": {"text": "blurry, text, watermark, logo, low quality, distorted, ugly, dark, underexposed, letters, words, characters", "clip": ["4", 1]}},
    "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
    "9": {"class_type": "SaveImage", "inputs": {"images": ["8", 0], "filename_prefix": "ashitaba_extraction"}}
  }
}' > /dev/null 2>&1

echo "Submitted image 3: ashitaba_extraction"

# Image 4: Finished Tincture
curl -s -X POST "$BASE_URL/prompt" -H "Content-Type: application/json" -d '{
  "prompt": {
    "3": {"class_type": "KSampler", "inputs": {"seed": 444444444, "steps": 30, "cfg": 7.5, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0]}},
    "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
    "5": {"class_type": "EmptyLatentImage", "inputs": {"width": 1024, "height": 768, "batch_size": 1}},
    "6": {"class_type": "CLIPTextEncode", "inputs": {"text": "Bottles of amber tincture from Angelica keiskei, dark glass bottles with golden liquid, elegant presentation, soft studio lighting, professional product photography, warm tones, realistic, no text, no labels", "clip": ["4", 1]}},
    "7": {"class_type": "CLIPTextEncode", "inputs": {"text": "blurry, text, watermark, logo, low quality, distorted, ugly, dark, underexposed, cheap, letters, words, characters, labels", "clip": ["4", 1]}},
    "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
    "9": {"class_type": "SaveImage", "inputs": {"images": ["8", 0], "filename_prefix": "ashitaba_tincture"}}
  }
}' > /dev/null 2>&1

echo "Submitted image 4: ashitaba_tincture"

# Image 5: Health Benefits / Longevity Concept
curl -s -X POST "$BASE_URL/prompt" -H "Content-Type: application/json" -d '{
  "prompt": {
    "3": {"class_type": "KSampler", "inputs": {"seed": 555555555, "steps": 35, "cfg": 8.0, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0]}},
    "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
    "5": {"class_type": "EmptyLatentImage", "inputs": {"width": 1024, "height": 768, "batch_size": 1}},
    "6": {"class_type": "CLIPTextEncode", "inputs": {"text": "Concept art representing longevity and vitality, ethereal golden glow, molecular structures, healing energy, sophisticated, artistic, premium quality, abstract representation of anti-aging, no text, no letters", "clip": ["4", 1]}},
    "7": {"class_type": "CLIPTextEncode", "inputs": {"text": "blurry, text, watermark, logo, low quality, distorted, ugly, dark, cluttered, letters, words, characters, labels, caption", "clip": ["4", 1]}},
    "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
    "9": {"class_type": "SaveImage", "inputs": {"images": ["8", 0], "filename_prefix": "ashitaba_longevity"}}
  }
}' > /dev/null 2>&1

echo "Submitted image 5: ashitaba_longevity"
echo ""
echo "All images submitted. Wait for generation to complete..."
sleep 45
echo ""
echo "Checking for generated images..."
ls -la /Users/mi4u/Documents/comfy/ComfyUI/output/ | grep -E "ashitaba" | tail -10