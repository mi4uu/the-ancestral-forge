#!/bin/bash
# Generate 5 images for Pamięć pokoleń article using ComfyUI API

BASE_URL="http://127.0.0.1:8188"
OUTPUT_DIR="/Users/mi4u/Documents/comfy/ComfyUI/output"
IMAGES_DIR="/Users/mi4u/Projects/the-ancestral-forge/content/review/2026-05-06-filar-iv-03-pamiec-pokolen-jak-uczyc-dzieci-umiejetnosci,-kto/images"

# Image 1: Main subject/concept illustration
curl -s -X POST "$BASE_URL/prompt" -H "Content-Type: application/json" -d '{
  "prompt": {
    "3": {"class_type": "KSampler", "inputs": {"seed": 123456789, "steps": 30, "cfg": 7.5, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0]}},
    "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
    "5": {"class_type": "EmptyLatentImage", "inputs": {"width": 1024, "height": 768, "batch_size": 1}},
    "6": {"class_type": "CLIPTextEncode", "inputs": {"text": "A parent and child learning a traditional skill together, warm sunlight, intergenerational knowledge transmission, homestead setting, realistic photography style, no text, no letters", "clip": ["4", 1]}},
    "7": {"class_type": "CLIPTextEncode", "inputs": {"text": "blurry, text, watermark, logo, low quality, distorted, ugly, dark, underexposed, letters, words, characters, labels, alphabet, characters, writing, words, sentences, titles, typography, font, signature, logo, brand, text overlay, caption, subtitle, annotation, callout, speech bubble, thought bubble, any text elements, pseudo-text, gryzmol, artefact, glitch, error", "clip": ["4", 1]}},
    "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
    "9": {"class_type": "SaveImage", "inputs": {"images": ["8", 0], "filename_prefix": "pamiec-pokolen-conceptual"}}
  }
}' > /dev/null 2>&1

echo "Submitted image 1: conceptual-illustration"

# Image 2: Infographic/diagram
curl -s -X POST "$BASE_URL/prompt" -H "Content-Type: application/json" -d '{
  "prompt": {
    "3": {"class_type": "KSampler", "inputs": {"seed": 123456790, "steps": 30, "cfg": 7.5, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0]}},
    "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
    "5": {"class_type": "EmptyLatentImage", "inputs": {"width": 1024, "height": 768, "batch_size": 1}},
    "6": {"class_type": "CLIPTextEncode", "inputs": {"text": "Color-coded infographic diagram showing skill transmission flow, arrows connecting generations, circles representing skills, educational style, no text, no labels, no letters", "clip": ["4", 1]}},
    "7": {"class_type": "CLIPTextEncode", "inputs": {"text": "blurry, text, watermark, logo, low quality, distorted, ugly, dark, underexposed, letters, words, characters, labels, alphabet, characters, writing, words, sentences, titles, typography, font, signature, logo, brand, text overlay, caption, subtitle, annotation, callout, speech bubble, thought bubble, any text elements, pseudo-text, gryzmol, artefact, glitch, error", "clip": ["4", 1]}},
    "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
    "9": {"class_type": "SaveImage", "inputs": {"images": ["8", 0], "filename_prefix": "pamiec-pokolen-infographic"}}
  }
}' > /dev/null 2>&1

echo "Submitted image 2: infographic-diagram"

# Image 3: Detail/close-up view
curl -s -X POST "$BASE_URL/prompt" -H "Content-Type: application/json" -d '{
  "prompt": {
    "3": {"class_type": "KSampler", "inputs": {"seed": 123456791, "steps": 30, "cfg": 7.5, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0]}},
    "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
    "5": {"class_type": "EmptyLatentImage", "inputs": {"width": 1024, "height": 768, "batch_size": 1}},
    "6": {"class_type": "CLIPTextEncode", "inputs": {"text": "Close-up of child's hands learning to weave a basket, detailed texture, natural lighting, professional photography, no text, no letters", "clip": ["4", 1]}},
    "7": {"class_type": "CLIPTextEncode", "inputs": {"text": "blurry, text, watermark, logo, low quality, distorted, ugly, dark, underexposed, letters, words, characters, labels, alphabet, characters, writing, words, sentences, titles, typography, font, signature, logo, brand, text overlay, caption, subtitle, annotation, callout, speech bubble, thought bubble, any text elements, pseudo-text, gryzmol, artefact, glitch, error", "clip": ["4", 1]}},
    "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
    "9": {"class_type": "SaveImage", "inputs": {"images": ["8", 0], "filename_prefix": "pamiec-pokolen-detail"}}
  }
}' > /dev/null 2>&1

echo "Submitted image 3: detail-closeup"

# Image 4: Context/environment view
curl -s -X POST "$BASE_URL/prompt" -H "Content-Type: application/json" -d '{
  "prompt": {
    "3": {"class_type": "KSampler", "inputs": {"seed": 123456792, "steps": 30, "cfg": 7.5, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0]}},
    "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
    "5": {"class_type": "EmptyLatentImage", "inputs": {"width": 1024, "height": 768, "batch_size": 1}},
    "6": {"class_type": "CLIPTextEncode", "inputs": {"text": "Rustic workshop environment where skills are taught, tools on wooden table, warm ambient light, cozy atmosphere, realistic photography, no text, no letters", "clip": ["4", 1]}},
    "7": {"class_type": "CLIPTextEncode", "inputs": {"text": "blurry, text, watermark, logo, low quality, distorted, ugly, dark, underexposed, letters, words, characters, labels, alphabet, characters, writing, words, sentences, titles, typography, font, signature, logo, brand, text overlay, caption, subtitle, annotation, callout, speech bubble, thought bubble, any text elements, pseudo-text, gryzmol, artefact, glitch, error", "clip": ["4", 1]}},
    "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
    "9": {"class_type": "SaveImage", "inputs": {"images": ["8", 0], "filename_prefix": "pamiec-pokolen-context"}}
  }
}' > /dev/null 2>&1

echo "Submitted image 4: context-scene"

# Image 5: Abstract/conceptual representation
curl -s -X POST "$BASE_URL/prompt" -H "Content-Type: application/json" -d '{
  "prompt": {
    "3": {"class_type": "KSampler", "inputs": {"seed": 123456793, "steps": 30, "cfg": 7.5, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0]}},
    "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
    "5": {"class_type": "EmptyLatentImage", "inputs": {"width": 1024, "height": 768, "batch_size": 1}},
    "6": {"class_type": "CLIPTextEncode", "inputs": {"text": "Abstract representation of ancestral memory, golden light connecting generations, ethereal, artistic, symbolic, no text, no letters", "clip": ["4", 1]}},
    "7": {"class_type": "CLIPTextEncode", "inputs": {"text": "blurry, text, watermark, logo, low quality, distorted, ugly, dark, underexposed, letters, words, characters, labels, alphabet, characters, writing, words, sentences, titles, typography, font, signature, logo, brand, text overlay, caption, subtitle, annotation, callout, speech bubble, thought bubble, any text elements, pseudo-text, gryzmol, artefact, glitch, error", "clip": ["4", 1]}},
    "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
    "9": {"class_type": "SaveImage", "inputs": {"images": ["8", 0], "filename_prefix": "pamiec-pokolen-abstract"}}
  }
}' > /dev/null 2>&1

echo "Submitted image 5: abstract-concept"

echo ""
echo "All images submitted. Wait for generation to complete..."
sleep 60
echo ""
echo "Checking for generated images..."

# Move the latest generated images to the images directory
# We'll find each prefix and move the most recent one
for prefix in pamiec-pokolen-conceptual pamiec-pokolen-infographic pamiec-pokolen-detail pamiec-pokolen-context pamiec-pokolen-abstract; do
    latest=$(ls -t "$OUTPUT_DIR"/${prefix}_*.png 2>/dev/null | head -1)
    if [ -n "$latest" ]; then
        target=""
        case $prefix in
            pamiec-pokolen-conceptual) target="conceptual-illustration.png";;
            pamiec-pokolen-infographic) target="infographic-diagram.png";;
            pamiec-pokolen-detail) target="detail-closeup.png";;
            pamiec-pokolen-context) target="context-scene.png";;
            pamiec-pokolen-abstract) target="abstract-concept.png";;
        esac
        cp "$latest" "$IMAGES_DIR/$target"
        echo "Copied $(basename $latest) to $target"
    else
        echo "No image found for prefix $prefix"
    fi
done

echo ""
echo "Done."