/**
 * Insert generated images into article markdown files.
 * Adds heroImage to frontmatter + 4 images spread through article body.
 * Run: bun run scripts/insert-images-into-articles.ts
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ARTICLES_DIR = "content/articles";
const IMG_DIR = "public/images";

const articles = readdirSync(ARTICLES_DIR).filter((d) => {
  const f = join(ARTICLES_DIR, d, "index.md");
  return existsSync(f);
});

let updated = 0;

for (const slug of articles) {
  const mdPath = join(ARTICLES_DIR, slug, "index.md");
  let content = readFileSync(mdPath, "utf-8");

  // Skip if already has heroImage
  if (content.includes("heroImage:")) continue;

  // Check if images exist
  const heroImg = join(IMG_DIR, `${slug}-hero.png`);
  if (!existsSync(heroImg)) continue;

  // Add heroImage to frontmatter (after illustration line)
  if (content.includes("illustration:")) {
    content = content.replace(
      /(illustration:.*)\n/,
      `$1\nheroImage: /images/${slug}-hero.png\n`
    );
  } else {
    // Add before free: or featured:
    content = content.replace(
      /(featured:.*)\n/,
      `heroImage: /images/${slug}-hero.png\n$1\n`
    );
  }

  // Find all ## headings in the body (after frontmatter)
  const fmEnd = content.indexOf("---", content.indexOf("---") + 3);
  const body = content.slice(fmEnd + 3);
  const headings: { index: number; title: string }[] = [];
  const headingRe = /^## .+$/gm;
  let match;
  while ((match = headingRe.exec(body)) !== null) {
    headings.push({ index: match.index, title: match[0] });
  }

  if (headings.length < 4) {
    console.log(`  ${slug}: only ${headings.length} headings, skipping body images`);
    writeFileSync(mdPath, content);
    updated++;
    continue;
  }

  // Insert 4 images evenly: at ~20%, ~40%, ~60%, ~80% through the headings
  const imageTypes = [
    { type: "scene", alt: "atmospheric scene" },
    { type: "detail", alt: "close-up detail" },
    { type: "process", alt: "the process in action" },
    { type: "result", alt: "the finished result" },
  ];

  const positions = [
    Math.floor(headings.length * 0.2),
    Math.floor(headings.length * 0.4),
    Math.floor(headings.length * 0.6),
    Math.floor(headings.length * 0.8),
  ];

  // Deduplicate positions
  const uniquePositions = [...new Set(positions)];

  // Build new body with images inserted
  let newBody = body;
  let offset = 0;

  for (let i = 0; i < Math.min(uniquePositions.length, imageTypes.length); i++) {
    const pos = uniquePositions[i];
    if (pos >= headings.length) continue;

    const imgFile = `${slug}-${imageTypes[i].type}.png`;
    if (!existsSync(join(IMG_DIR, imgFile))) continue;

    const heading = headings[pos];
    const insertPoint = heading.index + offset;
    const imgMd = `\n![${imageTypes[i].alt}](/images/${imgFile})\n\n`;
    newBody = newBody.slice(0, insertPoint) + imgMd + newBody.slice(insertPoint);
    offset += imgMd.length;
  }

  content = content.slice(0, fmEnd + 3) + newBody;
  writeFileSync(mdPath, content);
  updated++;
  console.log(`✓ ${slug}: heroImage + ${Math.min(uniquePositions.length, 4)} body images`);
}

console.log(`\nUpdated ${updated} articles.`);
