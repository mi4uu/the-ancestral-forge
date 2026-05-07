# Generate Article Images

Generate images for articles using ComfyUI (SDXL) and insert them into article markdown.

## Arguments
- $ARTICLE_SLUG: The article slug (directory name in content/articles/). If "all", generate for all articles missing images.

## Prerequisites
- ComfyUI must be running at http://127.0.0.1:8188/
- SDXL checkpoint: sd_xl_base_1.0.safetensors
- If ComfyUI is not running, start it: `cd ~/Documents/comfy/ComfyUI && nohup python3 main.py --listen 127.0.0.1 --port 8188 > /tmp/comfyui.log 2>&1 &`

## Image Specifications
- Resolution: 800x600
- Model: SDXL base 1.0 (CheckpointLoaderSimple)
- Sampler: euler_ancestral, 25 steps, cfg 7.0, normal scheduler
- Negative prompt: "text, watermark, logo, blurry, low quality, deformed, ugly, cartoon, anime"
- Style suffix for ALL prompts: "vintage apothecary style, warm sepia tones, moody atmospheric lighting, editorial magazine quality, no text, no labels, no watermarks"
- Output: public/images/{slug}-{type}.png

## Per Article: 5 Images
1. **hero** — botanical/scientific illustration style on parchment background, the main subject of the article
2. **scene** — atmospheric photograph-style, establishing the setting or context
3. **detail** — close-up of a key element (ingredient, tool, plant part, mechanism)
4. **process** — action shot showing the preparation/building/doing step
5. **result** — the finished product, harvest, or outcome

## Workflow Template (ComfyUI API)

For each image, send this to `POST http://127.0.0.1:8188/prompt`:

```json
{
  "prompt": {
    "1": {"class_type":"CheckpointLoaderSimple","inputs":{"ckpt_name":"sd_xl_base_1.0.safetensors"}},
    "4": {"class_type":"CLIPTextEncodeSDXL","inputs":{"clip":["1",1],"width":800,"height":600,"crop_w":0,"crop_h":0,"target_width":800,"target_height":600,"text_g":"{{PROMPT}}","text_l":"{{SHORT_PROMPT}}"}},
    "5": {"class_type":"CLIPTextEncodeSDXL","inputs":{"clip":["1",1],"width":800,"height":600,"crop_w":0,"crop_h":0,"target_width":800,"target_height":600,"text_g":"text, watermark, logo, blurry, low quality, deformed, ugly, cartoon, anime","text_l":"text watermark blurry ugly"}},
    "6": {"class_type":"EmptyLatentImage","inputs":{"width":800,"height":600,"batch_size":1}},
    "7": {"class_type":"KSampler","inputs":{"model":["1",0],"seed":{{SEED}},"steps":25,"cfg":7.0,"sampler_name":"euler_ancestral","scheduler":"normal","positive":["4",0],"negative":["5",0],"latent_image":["6",0],"denoise":1.0}},
    "8": {"class_type":"VAEDecode","inputs":{"samples":["7",0],"vae":["1",2]}},
    "9": {"class_type":"SaveImage","inputs":{"images":["8",0],"filename_prefix":"{{PREFIX}}"}}
  }
}
```

Replace `{{PROMPT}}`, `{{SHORT_PROMPT}}`, `{{SEED}}`, and `{{PREFIX}}` for each image.

## Process

1. **Read the article** at `content/articles/$ARTICLE_SLUG/index.md` to understand the topic
2. **Check existing images** — skip if `public/images/{slug}-hero.png` already exists (unless user asks to regenerate)
3. **Write 5 prompts** tailored to the article content, each following the style guide above
4. **Queue all 5** to ComfyUI API sequentially (each takes ~20-30s on SDXL)
5. **Wait for completion** — poll `~/Documents/comfy/ComfyUI/output/{prefix}_*` until file appears
6. **Copy to project** — `cp ~/Documents/comfy/ComfyUI/output/{prefix}_00001_.png public/images/{slug}-{type}.png`
7. **Insert into article markdown**:
   - Add `heroImage: /images/{slug}-hero.png` to frontmatter
   - Insert `![alt text](/images/{slug}-{type}.png)` before relevant `## Section` headings (spread evenly, ~4 images in body)
8. **Deploy** — run `bun run deploy`

## Prompt Writing Guide

Read the article title and sections. For each image type:

- **hero**: "A detailed botanical/scientific illustration of [main subject], vintage apothecary style, hand-drawn on aged parchment paper, warm sepia tones, cross-hatching technique, botanical accuracy, dark forest green and [article accent color] palette, editorial magazine quality"
- **scene**: "[atmospheric description of the setting], warm earth tones, natural lighting, [season] atmosphere, editorial photography"
- **detail**: "close-up of [specific element], macro photography style, shallow depth of field, warm tones, rustic wooden surface, moody lighting"
- **process**: "[hands doing the action], natural daylight, [setting], editorial photography, warm earth tones"
- **result**: "[finished product/outcome], beautifully arranged, warm light, rustic setting, still life photography, editorial quality"

## Example (elderberry article)

```
hero:    "botanical illustration of elderberry Sambucus nigra, dark purple berry clusters with green leaves, vintage apothecary style, parchment, cross-hatching"
scene:   "wild elderberry bush in a forest clearing, clusters of dark purple berries, dappled sunlight, misty morning"
detail:  "close-up of dark elderberry syrup being poured from glass bottle into wooden spoon, amber liquid, vintage apothecary setting, candlelight"
process: "hands carefully picking dark elderberries from a bush into a woven basket, natural daylight, rural setting"
result:  "glass bottles of elderberry tincture on a rustic wooden shelf, dried elderflowers nearby, vintage apothecary jars, warm amber light"
```

## Batch Mode ($ARTICLE_SLUG = "all")

When generating for all articles:
1. List all articles in `content/articles/*/index.md`
2. Skip any that already have `heroImage:` in frontmatter
3. Process remaining articles one at a time
4. After each article, copy images and update markdown
5. Deploy once at the end
