#!/usr/bin/env python3
"""Generate charts, data visualizations, and text graphics for video projects.

Uses Pillow for reliable cross-platform image generation.
Brand: The Ancestral Forge — dark green, cream, gold.
"""

import sys
import os
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Brand colors (RGB)
DARK = (27, 43, 27)
CREAM = (245, 240, 232)
GOLD = (197, 165, 90)
INK = (44, 62, 44)
RED_DARK = (139, 0, 0)
WHITE = (255, 255, 255)
MUTED = (150, 150, 140)

W, H = 1920, 1080


def _font(size: int, bold: bool = False, italic: bool = False) -> ImageFont.FreeTypeFont:
    """Get system font. Falls back gracefully."""
    candidates = []
    if bold and italic:
        candidates = [
            "/System/Library/Fonts/Supplemental/Times New Roman Bold Italic.ttf",
            "/System/Library/Fonts/Supplemental/Georgia Bold Italic.ttf",
        ]
    elif bold:
        candidates = [
            "/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf",
            "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
        ]
    elif italic:
        candidates = [
            "/System/Library/Fonts/Supplemental/Times New Roman Italic.ttf",
            "/System/Library/Fonts/Supplemental/Georgia Italic.ttf",
        ]
    else:
        candidates = [
            "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
            "/System/Library/Fonts/Supplemental/Georgia.ttf",
        ]

    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)

    return ImageFont.load_default()


def _center_x(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, w: int = W) -> int:
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    return (w - tw) // 2


def create_title_card(text: str, subtitle: str, output_path: str):
    """Branded title card — dark background, centered text."""
    img = Image.new("RGB", (W, H), DARK)
    draw = ImageDraw.Draw(img)

    # Decorative line
    draw.line([(W//4, H//2 - 120), (3*W//4, H//2 - 120)], fill=GOLD + (80,), width=1)

    # Title
    font_title = _font(72, bold=True)
    x = _center_x(draw, text, font_title)
    draw.text((x, H//2 - 60), text, fill=CREAM, font=font_title)

    # Subtitle
    font_sub = _font(32, italic=True)
    x = _center_x(draw, subtitle, font_sub)
    draw.text((x, H//2 + 50), subtitle, fill=GOLD, font=font_sub)

    # Decorative line below
    draw.line([(W//4, H//2 + 120), (3*W//4, H//2 + 120)], fill=GOLD + (80,), width=1)

    # Diamond ornament
    cx = W // 2
    cy = H // 2 + 120
    draw.polygon([(cx, cy-6), (cx+6, cy), (cx, cy+6), (cx-6, cy)], fill=GOLD)

    img.save(output_path, quality=95)
    print(f"  Generated: {os.path.basename(output_path)}")


def create_stat_card(number: str, label: str, source: str, output_path: str):
    """Large statistic display."""
    img = Image.new("RGB", (W, H), DARK)
    draw = ImageDraw.Draw(img)

    # Big number
    font_num = _font(160, bold=True)
    x = _center_x(draw, number, font_num)
    draw.text((x, H//2 - 130), number, fill=GOLD, font=font_num)

    # Label
    font_label = _font(36)
    x = _center_x(draw, label, font_label)
    draw.text((x, H//2 + 70), label, fill=CREAM, font=font_label)

    # Source
    font_src = _font(18, italic=True)
    x = _center_x(draw, source, font_src)
    draw.text((x, H - 60), source, fill=MUTED, font=font_src)

    # Accent lines
    draw.line([(W//3, H//2 + 40), (2*W//3, H//2 + 40)], fill=GOLD + (60,), width=1)

    img.save(output_path, quality=95)
    print(f"  Generated: {os.path.basename(output_path)}")


def create_comparison_card(left_label: str, left_value: str,
                           right_label: str, right_value: str,
                           title: str, output_path: str):
    """Side-by-side comparison."""
    img = Image.new("RGB", (W, H), DARK)
    draw = ImageDraw.Draw(img)

    # Title
    font_title = _font(42, bold=True)
    x = _center_x(draw, title, font_title)
    draw.text((x, 100), title, fill=GOLD, font=font_title)

    # Vertical divider
    draw.line([(W//2, 200), (W//2, H-150)], fill=CREAM + (30,), width=1)

    # VS circle
    font_vs = _font(24, bold=True)
    draw.ellipse([(W//2 - 30, H//2 - 30), (W//2 + 30, H//2 + 30)], fill=INK, outline=GOLD)
    vx = _center_x(draw, "VS", font_vs)
    draw.text((vx, H//2 - 14), "VS", fill=GOLD, font=font_vs)

    # Left side
    font_val = _font(96, bold=True)
    lx = _center_x(draw, left_value, font_val, W//2)
    draw.text((lx, H//2 - 100), left_value, fill=RED_DARK, font=font_val)
    font_lbl = _font(26)
    lx = _center_x(draw, left_label, font_lbl, W//2)
    draw.text((lx, H//2 + 40), left_label, fill=CREAM, font=font_lbl)

    # Right side
    rx = W//2 + _center_x(draw, right_value, font_val, W//2)
    draw.text((rx, H//2 - 100), right_value, fill=GOLD, font=font_val)
    rx = W//2 + _center_x(draw, right_label, font_lbl, W//2)
    draw.text((rx, H//2 + 40), right_label, fill=CREAM, font=font_lbl)

    img.save(output_path, quality=95)
    print(f"  Generated: {os.path.basename(output_path)}")


def create_quote_card(quote: str, author: str, output_path: str):
    """Elegant quote display."""
    img = Image.new("RGB", (W, H), DARK)
    draw = ImageDraw.Draw(img)

    # Giant quotation mark
    font_q = _font(200, bold=True)
    draw.text((120, 150), "\u201C", fill=GOLD + (50,), font=font_q)

    # Quote text — wrap manually
    font_quote = _font(42, italic=True)
    lines = _wrap_lines(quote, font_quote, draw, W - 400)
    y = 300
    for line in lines:
        x = _center_x(draw, line, font_quote)
        draw.text((x, y), line, fill=CREAM, font=font_quote)
        y += 60

    # Author
    font_author = _font(26)
    author_text = f"\u2014 {author}"
    x = _center_x(draw, author_text, font_author)
    draw.text((x, y + 40), author_text, fill=GOLD, font=font_author)

    img.save(output_path, quality=95)
    print(f"  Generated: {os.path.basename(output_path)}")


def create_section_card(section_num: str, title: str, output_path: str):
    """Section divider card."""
    img = Image.new("RGB", (W, H), DARK)
    draw = ImageDraw.Draw(img)

    # Section label
    font_label = _font(18)
    label = f"SECTION  {section_num}"
    x = _center_x(draw, label, font_label)
    draw.text((x, H//2 - 80), label, fill=GOLD, font=font_label)

    # Ornament
    ornament = "\u25C6"
    font_orn = _font(14)
    ox = _center_x(draw, f"\u2014\u2014  {ornament}  \u2014\u2014", font_orn)
    draw.text((ox, H//2 - 45), f"\u2014\u2014  {ornament}  \u2014\u2014", fill=GOLD + (120,), font=font_orn)

    # Title
    font_title = _font(56, bold=True)
    # Wrap if needed
    lines = _wrap_lines(title, font_title, draw, W - 300)
    y = H//2
    for line in lines:
        x = _center_x(draw, line, font_title)
        draw.text((x, y), line, fill=CREAM, font=font_title)
        y += 72

    img.save(output_path, quality=95)
    print(f"  Generated: {os.path.basename(output_path)}")


def create_subscribe_card(output_path: str):
    """Subscribe CTA card."""
    img = Image.new("RGB", (W, H), DARK)
    draw = ImageDraw.Draw(img)

    font_brand = _font(22)
    brand = "THE  ANCESTRAL  FORGE"
    x = _center_x(draw, brand, font_brand)
    draw.text((x, H//2 - 130), brand, fill=GOLD, font=font_brand)

    font_cta = _font(80, bold=True)
    x = _center_x(draw, "SUBSCRIBE", font_cta)
    draw.text((x, H//2 - 60), "SUBSCRIBE", fill=CREAM, font=font_cta)

    font_sub = _font(30, italic=True)
    sub = "New deep dives every week"
    x = _center_x(draw, sub, font_sub)
    draw.text((x, H//2 + 70), sub, fill=MUTED, font=font_sub)

    # Decorative lines
    draw.line([(W//3, H//2 - 150), (2*W//3, H//2 - 150)], fill=GOLD + (60,), width=1)
    draw.line([(W//3, H//2 + 130), (2*W//3, H//2 + 130)], fill=GOLD + (60,), width=1)

    img.save(output_path, quality=95)
    print(f"  Generated: {os.path.basename(output_path)}")


def create_bar_chart(data: list[tuple[str, float]], title: str,
                     output_path: str, unit: str = ""):
    """Horizontal bar chart with brand styling."""
    img = Image.new("RGB", (W, H), DARK)
    draw = ImageDraw.Draw(img)

    font_title = _font(42, bold=True)
    x = _center_x(draw, title, font_title)
    draw.text((x, 60), title, fill=GOLD, font=font_title)

    max_val = max(v for _, v in data)
    bar_area_left = 350
    bar_area_right = W - 150
    bar_width = bar_area_right - bar_area_left

    font_label = _font(24)
    font_val = _font(22, bold=True)

    n = len(data)
    bar_h = min(60, (H - 250) // n - 20)
    y_start = 180

    for i, (label, value) in enumerate(data):
        y = y_start + i * (bar_h + 20)
        filled = int((value / max_val) * bar_width) if max_val > 0 else 0

        # Label
        draw.text((bar_area_left - 20, y + bar_h//2 - 14), label,
                  fill=CREAM, font=font_label, anchor="ra")

        # Bar background
        draw.rectangle([(bar_area_left, y), (bar_area_right, y + bar_h)],
                       fill=INK)

        # Bar fill
        color = GOLD if i == n - 1 else CREAM + (180,)
        draw.rectangle([(bar_area_left, y), (bar_area_left + filled, y + bar_h)],
                       fill=color)

        # Value
        val_text = f"{value}{unit}"
        draw.text((bar_area_left + filled + 15, y + bar_h//2 - 12),
                  val_text, fill=CREAM, font=font_val)

    img.save(output_path, quality=95)
    print(f"  Generated: {os.path.basename(output_path)}")


def _wrap_lines(text: str, font, draw, max_w: int) -> list[str]:
    """Wrap text to fit within max_w pixels."""
    words = text.split()
    lines = []
    current = []
    for word in words:
        test = " ".join(current + [word])
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] > max_w and current:
            lines.append(" ".join(current))
            current = [word]
        else:
            current.append(word)
    if current:
        lines.append(" ".join(current))
    return lines


def generate_elderberry_charts(images_dir: str):
    """Generate all charts and graphics for the elderberry video."""
    os.makedirs(images_dir, exist_ok=True)

    create_title_card(
        "The Elderberry Lie",
        "Why Your Syrup Does Nothing",
        os.path.join(images_dir, "intro-title.png")
    )

    sections = [
        ("I", "A Plant Older Than Medicine"),
        ("II", "The Billion-Dollar Berry"),
        ("III", "What the Clinical Trials Used"),
        ("IV", "The Heat Problem"),
        ("V", "What Actually Works"),
        ("VI", "Making the Real Thing"),
    ]
    for num, title in sections:
        fname = title.lower().replace(" ", "-").replace("'", "")[:40]
        create_section_card(num, title, os.path.join(images_dir, f"section-{fname}.png"))

    create_stat_card("$500M", "Global elderberry supplement market (2024)",
                     "Grand View Research, 2024",
                     os.path.join(images_dir, "stat-market-size.png"))

    create_stat_card("70\u00b0C", "Temperature at which anthocyanins degrade",
                     "Elderberry thermal stability studies",
                     os.path.join(images_dir, "stat-temperature.png"))

    create_stat_card("40%", "Patients cured in 2 days with elderberry",
                     "vs 16.7% with placebo \u2014 Zakay-Rones et al., 1995",
                     os.path.join(images_dir, "stat-clinical-trial.png"))

    create_stat_card("2.7 days", "Average illness duration with elderberry",
                     "vs 4 days with placebo",
                     os.path.join(images_dir, "stat-recovery-time.png"))

    create_comparison_card(
        "Commercial Syrup", "~0%",
        "Cold Extract", "100%",
        "Anthocyanin Retention After Processing",
        os.path.join(images_dir, "compare-processing.png")
    )

    create_comparison_card(
        "Boiled 45 min", "$28.99",
        "Cold Macerated", "$3.50",
        "Cost vs Efficacy",
        os.path.join(images_dir, "compare-cost.png")
    )

    create_quote_card(
        "The elder was his medicine chest.",
        "Hippocrates, 4th century BCE",
        os.path.join(images_dir, "quote-hippocrates.png")
    )

    create_quote_card(
        "What the tradition did not include was boiling elderberries for 45 minutes and selling the result for $28.99.",
        "The Ancestral Forge",
        os.path.join(images_dir, "quote-tradition.png")
    )

    create_bar_chart(
        [("Dried berries (raw)", 95),
         ("Fresh juice", 88),
         ("Alcohol tincture", 82),
         ("Vinegar extract", 76),
         ("Simmered 20 min", 45),
         ("Boiled 45 min", 12),
         ("Commercial syrup", 5)],
        "Anthocyanin Retention by Preparation Method",
        os.path.join(images_dir, "chart-retention.png"),
        unit="%"
    )

    create_bar_chart(
        [("Zakay-Rones 1995", 40),
         ("Zakay-Rones 2004", 28),
         ("Kong 2009", 15),
         ("Tiralongo 2016", 50),
         ("Hawkins 2019", 33)],
        "Clinical Trial Response Rates",
        os.path.join(images_dir, "chart-trials.png"),
        unit="%"
    )

    create_subscribe_card(os.path.join(images_dir, "subscribe-cta.png"))

    create_title_card(
        "Stay Curious. Stay Skeptical.",
        "The Ancestral Forge",
        os.path.join(images_dir, "outro.png")
    )


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 video/generate-charts.py <project-slug>")
        sys.exit(1)

    slug = sys.argv[1]
    project_dir = os.path.join(BASE_DIR, slug)
    images_dir = os.path.join(project_dir, "images")

    if not os.path.exists(project_dir):
        print(f"Project not found: {project_dir}")
        sys.exit(1)

    print(f"Generating charts for: {slug}")

    if slug == "elderberry-lie":
        generate_elderberry_charts(images_dir)
    else:
        create_title_card(slug.replace("-", " ").title(), "The Ancestral Forge",
                          os.path.join(images_dir, "intro-title.png"))
        create_subscribe_card(os.path.join(images_dir, "subscribe-cta.png"))
        create_title_card("Stay Curious. Stay Skeptical.", "The Ancestral Forge",
                          os.path.join(images_dir, "outro.png"))

    print(f"\nDone! Charts in {images_dir}/")


if __name__ == "__main__":
    main()
