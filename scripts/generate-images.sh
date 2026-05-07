#!/bin/bash
# Generate 5 images per article via ComfyUI SDXL API
# Usage: ./scripts/generate-images.sh <slug> "<hero_prompt>" "<scene_prompt>" "<detail_prompt>" "<process_prompt>" "<result_prompt>"

SLUG=$1
HERO_PROMPT=$2
SCENE_PROMPT=$3
DETAIL_PROMPT=$4
PROCESS_PROMPT=$5
RESULT_PROMPT=$6

COMFY_URL="http://127.0.0.1:8188"
OUTPUT_DIR="$HOME/Documents/comfy/ComfyUI/output"
IMG_DIR="public/images"
STYLE_SUFFIX=", vintage apothecary style, warm sepia tones, moody atmospheric lighting, editorial magazine quality, no text, no labels, no watermarks"
NEG="text, watermark, logo, blurry, low quality, deformed, ugly, cartoon, anime"

generate_image() {
  local prefix=$1
  local prompt=$2
  local short=$3
  local seed=$4

  local full_prompt="${prompt}${STYLE_SUFFIX}"

  # Escape quotes for JSON
  full_prompt=$(echo "$full_prompt" | sed 's/"/\\"/g')
  short=$(echo "$short" | sed 's/"/\\"/g')

  local workflow="{
    \"1\":{\"class_type\":\"CheckpointLoaderSimple\",\"inputs\":{\"ckpt_name\":\"sd_xl_base_1.0.safetensors\"}},
    \"4\":{\"class_type\":\"CLIPTextEncodeSDXL\",\"inputs\":{\"clip\":[\"1\",1],\"width\":800,\"height\":600,\"crop_w\":0,\"crop_h\":0,\"target_width\":800,\"target_height\":600,\"text_g\":\"${full_prompt}\",\"text_l\":\"${short}\"}},
    \"5\":{\"class_type\":\"CLIPTextEncodeSDXL\",\"inputs\":{\"clip\":[\"1\",1],\"width\":800,\"height\":600,\"crop_w\":0,\"crop_h\":0,\"target_width\":800,\"target_height\":600,\"text_g\":\"${NEG}\",\"text_l\":\"text watermark blurry ugly\"}},
    \"6\":{\"class_type\":\"EmptyLatentImage\",\"inputs\":{\"width\":800,\"height\":600,\"batch_size\":1}},
    \"7\":{\"class_type\":\"KSampler\",\"inputs\":{\"model\":[\"1\",0],\"seed\":${seed},\"steps\":25,\"cfg\":7.0,\"sampler_name\":\"euler_ancestral\",\"scheduler\":\"normal\",\"positive\":[\"4\",0],\"negative\":[\"5\",0],\"latent_image\":[\"6\",0],\"denoise\":1.0}},
    \"8\":{\"class_type\":\"VAEDecode\",\"inputs\":{\"samples\":[\"7\",0],\"vae\":[\"1\",2]}},
    \"9\":{\"class_type\":\"SaveImage\",\"inputs\":{\"images\":[\"8\",0],\"filename_prefix\":\"${prefix}\"}}
  }"

  local response=$(curl -s -X POST "$COMFY_URL/prompt" -H "Content-Type: application/json" -d "{\"prompt\": $workflow}")
  local pid=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('prompt_id',''))" 2>/dev/null)

  if [ -z "$pid" ]; then
    echo "  FAILED to queue $prefix"
    return 1
  fi

  # Wait for file
  for i in $(seq 1 120); do
    local file=$(ls -t "${OUTPUT_DIR}/${prefix}_"* 2>/dev/null | head -1)
    if [ -n "$file" ]; then
      cp "$file" "${IMG_DIR}/${SLUG}-${1##*_}.png" 2>/dev/null || cp "$file" "${IMG_DIR}/${prefix##*_}.png"
      echo "  OK: $prefix"
      return 0
    fi
    local err=$(curl -s "$COMFY_URL/history/$pid" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('$pid',{}).get('status',{}).get('status_str',''))" 2>/dev/null)
    if [ "$err" = "error" ]; then
      echo "  ERROR: $prefix"
      return 1
    fi
    sleep 3
  done
  echo "  TIMEOUT: $prefix"
  return 1
}

echo "Generating 5 images for: $SLUG"
mkdir -p "$IMG_DIR"

generate_image "${SLUG}_hero" "$HERO_PROMPT" "botanical illustration vintage parchment" 42
generate_image "${SLUG}_scene" "$SCENE_PROMPT" "atmospheric editorial photography" 100
generate_image "${SLUG}_detail" "$DETAIL_PROMPT" "close-up macro detail" 200
generate_image "${SLUG}_process" "$PROCESS_PROMPT" "hands action process" 300
generate_image "${SLUG}_result" "$RESULT_PROMPT" "finished product still life" 400

# Copy with correct names
for type in hero scene detail process result; do
  src=$(ls -t "${OUTPUT_DIR}/${SLUG}_${type}_"* 2>/dev/null | head -1)
  if [ -n "$src" ]; then
    cp "$src" "${IMG_DIR}/${SLUG}-${type}.png"
  fi
done

echo "Done: $SLUG"
