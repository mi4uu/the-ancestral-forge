/**
 * Generate 5 images per article via ComfyUI SDXL API.
 * Run: bun run scripts/generate-all-images.ts
 */

import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const COMFY_URL = "http://127.0.0.1:8188";
const COMFY_OUTPUT = join(process.env.HOME!, "Documents/comfy/ComfyUI/output");
const IMG_DIR = "public/images";
const STYLE = ", vintage apothecary style, warm sepia tones, moody atmospheric lighting, editorial magazine quality, no text, no labels, no watermarks";
const NEG = "text, watermark, logo, blurry, low quality, deformed, ugly, cartoon, anime";

interface ArticleImages {
  slug: string;
  hero: string;
  scene: string;
  detail: string;
  process: string;
  result: string;
}

const ARTICLES: ArticleImages[] = [
  {
    slug: "40-dollar-clay-oven",
    hero: "botanical illustration of a clay cob oven cross-section showing dome layers, sand form, thermal mass and insulation, vintage architectural drawing on parchment, engineering diagram style",
    scene: "outdoor clay cob oven in a garden setting, wood fire glowing inside the dome opening, warm evening light, rustic homestead, smoke rising gently",
    detail: "close-up of hands mixing clay and straw cob mixture, earthy brown texture, water droplets, natural materials, warm sunlight",
    process: "person building a clay dome oven, applying wet cob mixture to a sand form, outdoor workshop, natural daylight",
    result: "artisan bread loaves cooling on a wooden board in front of a finished clay cob oven, golden crust, steam rising, warm evening light",
  },
  {
    slug: "4am-sourdough",
    hero: "botanical illustration of wheat grain cross-section and sourdough starter bubbles under magnification, vintage scientific drawing on parchment, microbiology diagram",
    scene: "rustic kitchen at dawn, sourdough starter bubbling in a glass jar on a wooden counter, soft morning light through a window, flour dusted surface",
    detail: "close-up of active sourdough starter with large bubbles in a glass jar, creamy texture, natural light from side",
    process: "hands kneading sourdough bread dough on a floured wooden surface, strong arms, natural daylight, rustic kitchen",
    result: "freshly baked sourdough bread loaf with perfect ear and open crumb, sliced on a wooden cutting board, warm golden light",
  },
  {
    slug: "adaptogenic-herbs",
    hero: "botanical illustration of ashwagandha root and rhodiola rosea plant, side by side scientific drawing on aged parchment, detailed root systems and flowers",
    scene: "medicinal herb garden with labeled wooden stakes, rows of ashwagandha and holy basil plants, morning dew, soft golden light",
    detail: "close-up of dried ashwagandha root pieces and rhodiola rosea root slices on a wooden surface, warm amber tones",
    process: "hands harvesting rhodiola rosea root from soil, garden gloves, natural daylight, rich dark earth",
    result: "glass jars of adaptogenic herb tinctures lined up on a wooden shelf, amber liquid, dried herb bundles hanging above, apothecary setting",
  },
  {
    slug: "ashitaba-protocol",
    hero: "botanical illustration of Angelica keiskei (ashitaba) plant showing compound leaves, yellow sap dripping from cut stem, detailed scientific drawing on parchment",
    scene: "ashitaba plants growing on a misty volcanic hillside, lush green tropical vegetation, morning fog, Hachijo-jima island atmosphere",
    detail: "close-up of golden yellow ashitaba sap oozing from a freshly cut stem, vibrant color against green leaf background",
    process: "hands harvesting young ashitaba shoots with a small knife, garden basket nearby, dappled sunlight",
    result: "cup of golden ashitaba tea next to fresh and dried ashitaba leaves on a wooden table, warm afternoon light, Japanese ceramic cup",
  },
  {
    slug: "backyard-protein",
    hero: "botanical illustration showing a closed-loop system diagram with quail, black soldier fly larvae, compost bin and garden vegetables, vintage scientific drawing on parchment",
    scene: "small backyard with quail hutch, compost bin, and raised garden beds working together, morning light, productive homestead",
    detail: "close-up of black soldier fly larvae in compost, white grubs among decomposing organic matter, macro photography style",
    process: "hands collecting quail eggs from a small wooden hutch, speckled eggs, straw bedding, natural daylight",
    result: "bowl of fresh quail eggs next to harvested vegetables and dried insect protein on a rustic wooden table, abundant harvest still life",
  },
  {
    slug: "cellar-root-cellar",
    hero: "architectural cross-section illustration of an underground root cellar showing earth layers, ventilation pipes, shelving with stored vegetables, vintage engineering drawing on parchment",
    scene: "entrance to a hillside root cellar with a heavy wooden door, stone walls, autumn leaves around, cool misty atmosphere",
    detail: "close-up of root cellar shelves packed with mason jars of preserved vegetables, potatoes and carrots in wooden crates, dim warm light",
    process: "person carrying a wooden crate of freshly harvested root vegetables into a stone-walled cellar, cool blue-toned lighting",
    result: "interior of a well-organized root cellar with barrels, hanging herbs, shelves of preserves, and baskets of vegetables, warm lantern light",
  },
  {
    slug: "field-journal",
    hero: "botanical illustration of an open field journal with pressed flowers, hand-drawn plant sketches, weather notations, and phenology charts on aged paper",
    scene: "leather-bound field journal open on a tree stump in a forest clearing, pencil beside it, dappled sunlight, autumn colors",
    detail: "close-up of hand-written journal pages with botanical sketches, weather observations, and dated entries, fountain pen ink on cream paper",
    process: "person sitting on a hillside writing in a field journal, overlooking a valley with farmland, golden hour light",
    result: "shelf of well-worn field journals spanning many years, leather spines with dates, dried pressed flowers peeking out, warm study light",
  },
  {
    slug: "field-medic-kit",
    hero: "botanical illustration of yarrow and plantain plants with labeled parts, flower heads, leaves and roots, vintage medicinal plant drawing on parchment",
    scene: "wild yarrow and plantain growing together in a meadow, white yarrow flower clusters and broad plantain leaves, soft morning light",
    detail: "close-up of yarrow flower head being crushed between fingers, releasing aromatic oils, green and white, natural light",
    process: "hands preparing a poultice from fresh plantain leaves, mortar and pestle, dried herbs nearby, rustic wooden table",
    result: "handmade herbal first aid kit in a canvas roll with tin salve containers, dried herb bundles, small tincture bottles, laid out on weathered wood",
  },
  {
    slug: "forgotten-seeds",
    hero: "botanical illustration of diverse heirloom seed varieties spread on parchment, beans, peas, corn kernels, squash seeds, each labeled in vintage handwriting",
    scene: "old wooden seed cabinet with many small drawers pulled open showing different seed varieties, warm afternoon light, seed library atmosphere",
    detail: "close-up of diverse heirloom tomato seeds and bean varieties in small paper packets with handwritten labels, macro detail",
    process: "hands saving seeds from a ripe heirloom tomato, squeezing seeds into a bowl, kitchen table with various seed-saving supplies",
    result: "glass jars filled with saved seeds of different colors and sizes, neatly labeled, arranged on wooden shelves, warm golden light",
  },
  {
    slug: "gravity-battery",
    hero: "engineering illustration of a gravity-fed water system showing ram pump, penstock, and elevated cistern, vintage technical drawing on parchment with measurements",
    scene: "mountain stream flowing through rocks with a small dam and intake pipe visible, forested hillside, misty morning atmosphere",
    detail: "close-up of a working hydraulic ram pump made from brass and iron fittings, water splashing from waste valve, mechanical detail",
    process: "person installing a penstock pipe along a hillside, tools spread around, gravity-fed water system under construction",
    result: "elevated water cistern on a hillside with pipes leading to a homestead below, panoramic view, clear sky, self-sufficient water system",
  },
  {
    slug: "home-metalworking",
    hero: "illustration of blacksmithing tools arranged on parchment, anvil, hammer, tongs, forge, with heat-color temperature chart, vintage technical drawing",
    scene: "small backyard forge setup with glowing coals, anvil on a stump, tools hanging on a rack, warm orange light from fire, evening atmosphere",
    detail: "close-up of red-hot steel being held with tongs on an anvil, sparks flying, intense orange glow, dramatic lighting",
    process: "blacksmith hammering glowing metal on an anvil, sparks flying, concentrated expression, forge fire in background",
    result: "hand-forged tools laid out on a leather apron, knife, chisel, hooks, tongs, dark patina on steel, warm workshop light",
  },
  {
    slug: "how-to-read-landscape",
    hero: "vintage topographic illustration of a landscape showing water flow patterns, indicator plants, slope analysis, and building site markers on parchment",
    scene: "rolling farmland landscape at golden hour, visible contours, a stream in the valley, trees on ridgeline, expansive vista",
    detail: "close-up of hands holding dark rich soil with visible earthworms, soil structure layers visible, natural daylight",
    process: "person kneeling on a hillside examining soil and plants, notebook in hand, surveying the landscape, afternoon light",
    result: "aerial view of a well-designed homestead showing thoughtful placement of house, garden, orchard, and water features following landscape contours",
  },
  {
    slug: "ice-house-hack",
    hero: "architectural cross-section illustration of a traditional ice house showing underground pit, straw insulation layers, thatch roof at 18 degrees, vintage engineering drawing on parchment",
    scene: "winter scene of men harvesting ice blocks from a frozen pond with horse-drawn saws, New England landscape, crisp blue light",
    detail: "close-up of stacked ice blocks insulated with thick straw layers inside a dark underground chamber, cold blue tones",
    process: "workers lowering ice blocks into a deep pit lined with straw, using ropes and pulleys, winter daylight",
    result: "summer scene with butter and dairy products sitting on an ice block in a cool underground chamber, contrasting warm and cold tones",
  },
  {
    slug: "lemna-minor",
    hero: "botanical illustration of Lemna minor (duckweed) at multiple magnifications, showing fronds, roots, and cellular structure, scientific drawing on parchment",
    scene: "pond surface covered with green duckweed, lily pads nearby, reflected sky, peaceful water garden atmosphere",
    detail: "macro close-up of duckweed fronds floating on water surface, tiny green circles with hair-like roots hanging below, water droplets",
    process: "hands scooping duckweed from a cultivation container with a fine mesh strainer, green harvest, natural daylight",
    result: "dried duckweed powder in a wooden bowl next to fresh floating duckweed in a glass container, protein-rich superfood display",
  },
  {
    slug: "lie-of-standardization",
    hero: "botanical illustration comparing fresh vibrant herb with dried powdered version, showing molecular degradation, vintage scientific drawing on parchment with chemical diagrams",
    scene: "contrast scene with fresh herbs growing in garden on one side and commercial supplement bottles on pharmacy shelf on other, split composition",
    detail: "close-up comparison of fresh green St Johns Wort flowers versus dried brown powder in a capsule, dramatic difference in color and vitality",
    process: "hands preparing a fresh herb tincture, chopping vibrant green herbs into a glass jar with clear alcohol, kitchen setting",
    result: "row of freshly made amber tincture bottles next to bundles of fresh herbs on a rustic wooden shelf, apothecary aesthetic",
  },
  {
    slug: "memory-of-generations",
    hero: "vintage illustration of a family tree intertwined with tools and skills, knife, compass, seeds, cooking pot, medical herbs, on aged parchment",
    scene: "grandparent teaching a child to identify wild plants in a forest, kneeling together, basket of foraged items, warm dappled light",
    detail: "close-up of weathered skilled hands showing a child's small hands how to tie a knot in natural rope, generational knowledge transfer",
    process: "family working together in a garden, three generations, planting seeds, passing tools, afternoon golden light",
    result: "child proudly holding up a self-made wooden tool or woven basket, accomplished expression, workshop background with hanging tools",
  },
  {
    slug: "night-milk-experiment",
    hero: "scientific illustration of the tryptophan-to-melatonin biochemical pathway alongside a drawing of a dairy goat, vintage diagram on parchment",
    scene: "small barn at night with warm lantern light, Nigerian Dwarf goats inside, stars visible through the open door, peaceful nocturnal atmosphere",
    detail: "close-up of fresh white milk being poured into a glass jar, creamy texture, warm dim light suggesting nighttime milking",
    process: "person milking a goat by dim red lantern light at 2am, quiet barn setting, intimate atmosphere, warm tones",
    result: "glass of kefir made from night milk next to a sleep tracking journal showing improved metrics, bedside table, moonlight through window",
  },
  {
    slug: "one-acre-zero-bills",
    hero: "aerial view illustration of a one-acre permaculture homestead layout showing zones, food forest, garden beds, chicken coop, vintage map style on parchment",
    scene: "lush productive one-acre garden with fruit trees, raised beds, berry bushes, and chickens roaming, abundant harvest, golden hour",
    detail: "close-up of diverse harvest in wooden crates, tomatoes, beans, squash, herbs, eggs, honey jar, abundance display",
    process: "person working in an intensive biointensive garden bed, closely spaced plants, rich dark soil, productive small space",
    result: "kitchen table overflowing with homegrown produce from one acre, preserves, fresh vegetables, eggs, herbs, warm domestic light",
  },
  {
    slug: "organ-protocol",
    hero: "anatomical illustration of beef liver cross-section with nutritional data annotations, vintage medical drawing on parchment, showing cellular structure",
    scene: "traditional butcher shop with whole animal hanging, organ meats displayed separately, warm amber light, old-world craftsmanship",
    detail: "close-up of fresh beef liver on a wooden cutting board with a sharp knife, rich dark red-brown color, glistening surface",
    process: "hands slicing liver thinly for dehydrating, food dehydrator trays visible in background, kitchen preparation",
    result: "finished desiccated liver capsules in a glass jar next to fresh liver on a cutting board, homemade supplement display, warm light",
  },
  {
    slug: "psychology-of-sovereignty",
    hero: "vintage illustration of a human brain with neural pathways highlighted, prefrontal cortex emphasized, surrounded by symbols of self-reliance, tools and plants, on parchment",
    scene: "person standing alone on a hilltop overlooking their homestead at sunrise, silhouette against golden sky, sense of independence and accomplishment",
    detail: "close-up of calloused capable hands holding freshly harvested vegetables, worn leather gloves nearby, embodiment of competence",
    process: "person confidently building a structure from natural materials, focused expression, self-taught craftsmanship, natural light",
    result: "cozy self-built cabin interior with handmade furniture, preserved food on shelves, tools on walls, warm firelight, complete sovereignty",
  },
  {
    slug: "rocket-stoves",
    hero: "engineering cross-section illustration of a J-tube rocket stove showing combustion chamber, insulated riser, and heat flow arrows, vintage technical drawing on parchment",
    scene: "outdoor cooking setup with a rocket stove burning cleanly, barely visible exhaust, pot of water boiling on top, minimal fuel pile of twigs beside it",
    detail: "close-up of rocket stove combustion chamber with intense clean flame, glowing insulated riser, view into the J-tube opening",
    process: "hands feeding small twigs into a rocket stove feed tube, efficient controlled burn, outdoor camp kitchen setting",
    result: "complete outdoor kitchen with rocket stove, haybox cooker, and finished meal on a rustic table, off-grid cooking system",
  },
  {
    slug: "smoke-salt-silence",
    hero: "vintage illustration of three preservation methods side by side: biltong drying rack, duck confit in fat crock, and pemmican in leather pouch, on parchment",
    scene: "rustic smokehouse interior with meat hanging from hooks, thin wisps of smoke, warm amber light filtering through wooden slats",
    detail: "close-up of salt-crusted biltong strips hanging and air-drying, dark cured meat texture, dramatic side lighting",
    process: "hands rubbing coarse salt and spices into strips of beef for biltong, wooden cutting board, coriander seeds scattered",
    result: "sliced biltong, confit in a stoneware crock, and pemmican bars arranged on a wooden board, three ancient preservation methods displayed together",
  },
  {
    slug: "unlimited-supplements",
    hero: "scientific illustration of lacto-fermentation process showing bacterial colonies, fermentation vessel cross-section, and vitamin synthesis pathways, on parchment",
    scene: "cellar shelf with rows of fermentation crocks and glass jars bubbling with active cultures, dim warm light, traditional storage",
    detail: "close-up of actively bubbling sauerkraut in a glass jar, visible fermentation activity, cabbage submerged in brine, natural light",
    process: "hands packing shredded cabbage into a large fermentation crock, salt being sprinkled, wooden tamper nearby, kitchen scene",
    result: "finished fermented vegetables in glass jars showing different colors and stages, sauerkraut, kimchi, fermented beets, arranged on wooden shelf",
  },
  {
    slug: "water-battery",
    hero: "engineering illustration of a complete gravity-fed water system from spring capture through ram pump to elevated cistern to house, vintage technical drawing on parchment",
    scene: "mountain spring emerging from a mossy hillside into a stone spring box, crystal clear water, ferns and moss, misty forest atmosphere",
    detail: "close-up of a brass hydraulic ram pump in action, water droplets spraying from the waste valve, mechanical precision, outdoor setting",
    process: "person installing PVC pipe along a hillside for a gravity-fed water system, trench dug, tools laid out, rural landscape",
    result: "water flowing from a tap inside a off-grid cabin kitchen, gravity-fed from an elevated cistern visible through the window, self-sufficient water supply",
  },
  {
    slug: "wormwood-at-dawn",
    hero: "botanical illustration of Artemisia absinthium showing silver-green leaves, small yellow flowers, and root system, vintage medicinal plant drawing on parchment",
    scene: "wild wormwood growing along a stone wall at dawn, silvery leaves catching first light, misty European countryside, dew drops",
    detail: "close-up of wormwood leaves with fine silvery hairs, characteristic deeply lobed shape, macro botanical photography",
    process: "hands preparing a bitter tonic tea from dried wormwood in a ceramic cup, morning light through a window, traditional morning ritual",
    result: "amber bottle of wormwood bitters next to a small cup of bitter tea, dried herb bundle, and fresh wormwood sprig, apothecary still life",
  },
];

async function queueImage(prefix: string, prompt: string, shortPrompt: string, seed: number): Promise<string> {
  const fullPrompt = (prompt + STYLE).replace(/"/g, '\\"');
  const shortClean = shortPrompt.replace(/"/g, '\\"');

  const workflow = {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" } },
    "4": { class_type: "CLIPTextEncodeSDXL", inputs: { clip: ["1", 1], width: 800, height: 600, crop_w: 0, crop_h: 0, target_width: 800, target_height: 600, text_g: prompt + STYLE, text_l: shortPrompt } },
    "5": { class_type: "CLIPTextEncodeSDXL", inputs: { clip: ["1", 1], width: 800, height: 600, crop_w: 0, crop_h: 0, target_width: 800, target_height: 600, text_g: NEG, text_l: "text watermark blurry ugly" } },
    "6": { class_type: "EmptyLatentImage", inputs: { width: 800, height: 600, batch_size: 1 } },
    "7": { class_type: "KSampler", inputs: { model: ["1", 0], seed, steps: 25, cfg: 7.0, sampler_name: "euler_ancestral", scheduler: "normal", positive: ["4", 0], negative: ["5", 0], latent_image: ["6", 0], denoise: 1.0 } },
    "8": { class_type: "VAEDecode", inputs: { samples: ["7", 0], vae: ["1", 2] } },
    "9": { class_type: "SaveImage", inputs: { images: ["8", 0], filename_prefix: prefix } },
  };

  const res = await fetch(`${COMFY_URL}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow }),
  });
  const data = await res.json() as any;
  return data.prompt_id || "";
}

async function waitForFile(prefix: string, timeoutMs = 120000): Promise<string | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const files = new Bun.Glob(`${prefix}_*.png`).scanSync(COMFY_OUTPUT);
    for (const f of files) {
      return join(COMFY_OUTPUT, f);
    }
    await Bun.sleep(2000);
  }
  return null;
}

async function generateForArticle(art: ArticleImages): Promise<boolean> {
  // Check if already done
  if (existsSync(join(IMG_DIR, `${art.slug}-hero.png`))) {
    console.log(`  SKIP ${art.slug} (already has images)`);
    return true;
  }

  console.log(`\n▶ ${art.slug}`);

  const types = [
    { type: "hero", prompt: art.hero, seed: 42 },
    { type: "scene", prompt: art.scene, seed: 100 },
    { type: "detail", prompt: art.detail, seed: 200 },
    { type: "process", prompt: art.process, seed: 300 },
    { type: "result", prompt: art.result, seed: 400 },
  ];

  for (const t of types) {
    const prefix = `${art.slug}_${t.type}`;
    process.stdout.write(`  ${t.type}...`);

    await queueImage(prefix, t.prompt, `${t.type} ${art.slug}`, t.seed);

    const file = await waitForFile(prefix);
    if (file) {
      copyFileSync(file, join(IMG_DIR, `${art.slug}-${t.type}.png`));
      console.log(" OK");
    } else {
      console.log(" FAILED");
    }
  }

  return true;
}

// Main
mkdirSync(IMG_DIR, { recursive: true });

console.log(`Generating images for ${ARTICLES.length} articles (${ARTICLES.length * 5} images total)`);
console.log(`ComfyUI: ${COMFY_URL}`);
console.log(`Output: ${IMG_DIR}/\n`);

for (const art of ARTICLES) {
  await generateForArticle(art);
}

console.log("\n✓ All done!");
