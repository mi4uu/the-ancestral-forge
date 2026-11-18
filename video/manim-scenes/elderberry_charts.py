"""Animated charts for Elderberry Lie — v2 redesign.

Style: Light backgrounds, modern sans-serif, bold colors, clean readable charts.
Inspired by "Lost Nature Archives" YT channel aesthetic.

Run: manim -qh elderberry_charts.py AnthocyaninRetention
"""

from manim import *

# NEW color scheme — light, modern, punchy
BG_LIGHT = "#F0F0EC"  # warm light gray
BG_DARK = "#1A1A2E"   # dark navy (for contrast scenes)
TEXT_DARK = "#1A1A1A"  # near black
ACCENT_CYAN = "#00D4AA"  # bright teal/cyan
ACCENT_ORANGE = "#FF6B35"  # warm orange
ACCENT_RED = "#E63946"  # alert red
ACCENT_GOLD = "#C5A55A"  # brand gold
MUTED = "#6B7280"
WHITE = "#FFFFFF"

# Font
HEADING_FONT = "Impact"
BODY_FONT = "DIN Condensed Bold"
LABEL_FONT = "Arial"


class ModernScene(Scene):
    """Base scene with light modern styling."""
    def construct(self):
        self.camera.background_color = BG_LIGHT


class DarkScene(Scene):
    """Dark background variant."""
    def construct(self):
        self.camera.background_color = BG_DARK


class AnthocyaninRetention(ModernScene):
    """Animated bar chart — modern, light, readable."""
    def construct(self):
        super().construct()

        title = Text("ANTHOCYANIN RETENTION", font=HEADING_FONT,
                      font_size=56, color=TEXT_DARK)
        subtitle = Text("BY PREPARATION METHOD", font=BODY_FONT,
                         font_size=28, color=MUTED)
        VGroup(title, subtitle).arrange(DOWN, buff=0.15).to_edge(UP, buff=0.4)

        self.play(FadeIn(title, shift=DOWN*0.3), run_time=0.6)
        self.play(FadeIn(subtitle), run_time=0.3)

        data = [
            ("Dried berries (raw)", 95, ACCENT_CYAN),
            ("Fresh juice", 88, ACCENT_CYAN),
            ("Alcohol tincture", 82, ACCENT_CYAN),
            ("Vinegar extract", 76, ACCENT_CYAN),
            ("Simmered 20 min", 45, ACCENT_ORANGE),
            ("Boiled 45 min", 12, ACCENT_RED),
            ("Commercial syrup", 5, ACCENT_RED),
        ]

        max_width = 7.5
        bar_height = 0.4
        start_y = 1.6

        for i, (label, value, color) in enumerate(data):
            y = start_y - i * (bar_height + 0.25)
            bar_width = (value / 100) * max_width

            lbl = Text(label, font=LABEL_FONT, font_size=18, color=TEXT_DARK)
            lbl.move_to([-4.8, y, 0], aligned_edge=LEFT)

            # Background bar (full width, light gray)
            bg_bar = Rectangle(width=max_width, height=bar_height,
                              fill_color="#E5E7EB", fill_opacity=0.5,
                              stroke_width=0)
            bg_bar.move_to([-1.0 + max_width/2, y, 0], aligned_edge=LEFT)

            # Colored bar
            bar = Rectangle(width=bar_width, height=bar_height,
                           fill_color=color, fill_opacity=0.9,
                           stroke_width=0, )
            bar.move_to([-1.0 + bar_width/2, y, 0], aligned_edge=LEFT)

            val = Text(f"{value}%", font=BODY_FONT, font_size=24,
                       color=TEXT_DARK, weight=BOLD)
            val.next_to(bar, RIGHT, buff=0.15)

            self.add(bg_bar)
            self.play(
                FadeIn(lbl),
                GrowFromEdge(bar, LEFT),
                FadeIn(val),
                run_time=0.5
            )

        # Red highlight on commercial syrup
        warning = Text("5%  —  EFFECTIVELY ZERO", font=HEADING_FONT,
                        font_size=40, color=ACCENT_RED)
        warning.to_edge(DOWN, buff=0.5)
        self.play(FadeIn(warning, scale=1.3), run_time=0.5)
        self.wait(2)


class TemperatureDegradation(DarkScene):
    """Temperature vs half-life — dramatic dark theme."""
    def construct(self):
        super().construct()

        title = Text("ANTHOCYANIN HALF-LIFE", font=HEADING_FONT,
                      font_size=52, color=WHITE)
        subtitle = Text("TIME UNTIL 50% DESTROYED", font=BODY_FONT,
                         font_size=24, color=MUTED)
        VGroup(title, subtitle).arrange(DOWN, buff=0.1).to_edge(UP, buff=0.5)
        self.play(FadeIn(title), FadeIn(subtitle), run_time=0.8)

        temps = [
            ("60°C", "19.7 HOURS", ACCENT_CYAN, 4.5),
            ("80°C", "7.76 HOURS", ACCENT_CYAN, 3.0),
            ("90°C", "2.79 MINUTES", ACCENT_ORANGE, 1.2),
            ("100°C", "< 1 MINUTE", ACCENT_RED, 0.4),
        ]

        for i, (temp, halflife, color, bar_w) in enumerate(temps):
            y = 1.2 - i * 1.1

            temp_text = Text(temp, font=HEADING_FONT, font_size=44, color=color)
            temp_text.move_to([-4.5, y, 0])

            bar = Rectangle(width=bar_w, height=0.35,
                           fill_color=color, fill_opacity=0.8,
                           stroke_width=0, )
            bar.move_to([-2 + bar_w/2, y, 0], aligned_edge=LEFT)

            hl_text = Text(halflife, font=BODY_FONT, font_size=28, color=WHITE)
            hl_text.next_to(bar, RIGHT, buff=0.2)

            self.play(
                FadeIn(temp_text, shift=LEFT*0.3),
                GrowFromEdge(bar, LEFT),
                FadeIn(hl_text),
                run_time=0.6
            )

            if i == 2:  # 90°C dramatic
                flash = Text("2.79 MINUTES!", font=HEADING_FONT,
                            font_size=72, color=ACCENT_ORANGE)
                flash.move_to([1.5, -1, 0])
                self.play(FadeIn(flash, scale=2), run_time=0.4)
                self.wait(0.8)
                self.play(FadeOut(flash), run_time=0.2)

        msg = Text("YOUR SYRUP: BOILED AT 100°C FOR 45 MINUTES",
                    font=HEADING_FONT, font_size=32, color=ACCENT_RED)
        msg.to_edge(DOWN, buff=0.6)
        self.play(Write(msg), run_time=0.8)
        self.wait(2)


class ClinicalTrials(ModernScene):
    """Trial results timeline — clean modern."""
    def construct(self):
        super().construct()

        title = Text("CLINICAL TRIAL RESULTS", font=HEADING_FONT,
                      font_size=48, color=TEXT_DARK)
        title.to_edge(UP, buff=0.5)
        self.play(FadeIn(title, shift=DOWN*0.2), run_time=0.6)

        line = Line([-5.5, 0, 0], [5.5, 0, 0], color=MUTED, stroke_width=2)
        self.play(Create(line), run_time=0.4)

        trials = [
            (-4.5, "1995", "40% CURED\nIN 2 DAYS", ACCENT_CYAN),
            (-2, "2004", "4 DAYS\nEARLIER", ACCENT_CYAN),
            (0.5, "2009", "28% CURED\nIN 48H", ACCENT_CYAN),
            (3, "2016", "312 PATIENTS\nHALF SYMPTOMS", ACCENT_GOLD),
            (5, "2019", "META-ANALYSIS\nLARGE EFFECT", ACCENT_GOLD),
        ]

        for x, year, result, color in trials:
            dot = Dot([x, 0, 0], color=color, radius=0.12)
            year_t = Text(year, font=HEADING_FONT, font_size=24, color=TEXT_DARK)
            year_t.next_to(dot, DOWN, buff=0.25)
            result_t = Text(result, font=BODY_FONT, font_size=16,
                           color=TEXT_DARK, line_spacing=1.2)
            result_t.next_to(dot, UP, buff=0.3)

            self.play(
                GrowFromCenter(dot),
                FadeIn(year_t), FadeIn(result_t),
                run_time=0.5
            )
            self.wait(0.2)

        verdict = Text("5 OF 6 TRIALS FAVOR ELDERBERRY",
                        font=HEADING_FONT, font_size=36, color=ACCENT_CYAN)
        verdict.to_edge(DOWN, buff=0.6)
        self.play(FadeIn(verdict, scale=1.2), run_time=0.6)
        self.wait(2)


class CostComparison(DarkScene):
    """Cost comparison — dramatic reveal."""
    def construct(self):
        super().construct()

        # Left: syrup
        syrup_price = Text("$28.99", font=HEADING_FONT, font_size=80,
                           color=ACCENT_RED)
        syrup_sub = Text("COMMERCIAL SYRUP\n120ML  •  5% ACTIVE",
                          font=BODY_FONT, font_size=20, color=MUTED)
        syrup = VGroup(syrup_price, syrup_sub).arrange(DOWN, buff=0.3)
        syrup.move_to([-3, 0, 0])

        vs = Text("VS", font=HEADING_FONT, font_size=40, color=MUTED)

        # Right: tincture
        tinc_price = Text("$3.50", font=HEADING_FONT, font_size=80,
                          color=ACCENT_CYAN)
        tinc_sub = Text("COLD MACERATION TINCTURE\nFULL SEASON  •  100% ACTIVE",
                         font=BODY_FONT, font_size=20, color=WHITE)
        tinc = VGroup(tinc_price, tinc_sub).arrange(DOWN, buff=0.3)
        tinc.move_to([3, 0, 0])

        self.play(FadeIn(syrup_price, shift=LEFT), run_time=0.6)
        self.play(FadeIn(syrup_sub), run_time=0.3)
        self.play(FadeIn(vs, scale=2), run_time=0.3)
        self.play(FadeIn(tinc_price, shift=RIGHT), run_time=0.6)
        self.play(FadeIn(tinc_sub), run_time=0.3)

        # Winner glow
        glow = SurroundingRectangle(tinc, color=ACCENT_CYAN, buff=0.3,
                                     stroke_width=3, )
        self.play(Create(glow), run_time=0.4)

        result = Text("8X CHEAPER  •  20X MORE EFFECTIVE",
                       font=HEADING_FONT, font_size=32, color=ACCENT_CYAN)
        result.to_edge(DOWN, buff=0.6)
        self.play(FadeIn(result, scale=1.2), run_time=0.5)
        self.wait(2)


class MarketSize(DarkScene):
    """$500M counter — dramatic."""
    def construct(self):
        super().construct()

        label = Text("GLOBAL ELDERBERRY SUPPLEMENT MARKET",
                      font=BODY_FONT, font_size=28, color=MUTED)
        label.to_edge(UP, buff=1.5)
        self.play(FadeIn(label), run_time=0.4)

        values = [50, 100, 200, 300, 400, 500]
        prev = None
        for val in values:
            t = Text(f"${val}M", font=HEADING_FONT, font_size=130,
                     color=ACCENT_CYAN)
            if prev:
                self.play(FadeOut(prev, scale=0.8),
                         FadeIn(t, scale=1.3), run_time=0.35)
            else:
                self.play(FadeIn(t, scale=2), run_time=0.5)
            prev = t

        sub = Text("PER YEAR — SELLING YOU SUGAR WATER",
                     font=HEADING_FONT, font_size=28, color=ACCENT_RED)
        sub.next_to(prev, DOWN, buff=0.5)
        self.play(FadeIn(sub), run_time=0.4)
        self.wait(2)
