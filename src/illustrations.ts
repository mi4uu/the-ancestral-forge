// SVG illustrations — vintage apothecary line-art
// Each returns raw SVG string

const inkDefs = `
  <defs>
    <filter id="rough" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/>
      <feDisplacementMap in="SourceGraphic" scale="0.6"/>
    </filter>
    <pattern id="parchmentNoise" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
      <rect width="120" height="120" fill="transparent"/>
      <circle cx="20" cy="40" r="0.4" fill="rgba(26,47,36,0.18)"/>
      <circle cx="80" cy="20" r="0.3" fill="rgba(26,47,36,0.12)"/>
      <circle cx="60" cy="90" r="0.5" fill="rgba(26,47,36,0.16)"/>
      <circle cx="100" cy="70" r="0.3" fill="rgba(26,47,36,0.1)"/>
    </pattern>
  </defs>`;

const parchmentBg = (w: number, h: number) =>
  `<rect width="${w}" height="${h}" fill="#EFE7D5"/><rect width="${w}" height="${h}" fill="url(#parchmentNoise)"/>`;

const cardBg = (w: number, h: number) =>
  `<rect width="${w}" height="${h}" fill="#E8DEC4"/><rect width="${w}" height="${h}" fill="url(#parchmentNoise)"/>`;

function sunRays(): string {
  const lines: string[] = [];
  for (let i = 0; i < 36; i++) {
    const a = (i * 10) * Math.PI / 180;
    lines.push(`<line x1="${400 + Math.cos(a) * 60}" y1="${320 + Math.sin(a) * 60}" x2="${400 + Math.cos(a) * 280}" y2="${320 + Math.sin(a) * 280}"/>`);
  }
  return lines.join("");
}

function serratedTicks(): string {
  const ticks: string[] = [];
  for (let i = 0; i < 8; i++) {
    ticks.push(`<path d="M ${-50 + i * 12} ${-95 - Math.sin(i) * 8} l 0 -4" stroke-width="0.8"/>`);
  }
  return ticks.join("");
}

export const illustrations: Record<string, string> = {
  ashitaba: `<svg viewBox="0 0 800 600" class="block w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    ${inkDefs}${parchmentBg(800, 600)}
    <g stroke="#1A2F24" stroke-width="0.6" opacity="0.35">${sunRays()}</g>
    <circle cx="400" cy="320" r="55" fill="none" stroke="#1A2F24" stroke-width="1.4"/>
    <circle cx="400" cy="320" r="48" fill="none" stroke="#B8860B" stroke-width="0.8" stroke-dasharray="2 3"/>
    <g fill="none" stroke="#1A2F24" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 400 460 Q 400 380 400 320"/>
      <g transform="translate(400 280)">
        <path d="M 0 -10 C -55 -20 -75 -70 -45 -110 C -10 -140 30 -130 50 -100 C 70 -65 50 -25 0 -10 Z"/>
        <path d="M 0 -10 L -20 -90"/><path d="M -10 -30 L -30 -55"/><path d="M -10 -50 L -32 -75"/>
        <path d="M -8 -70 L -30 -95"/><path d="M 5 -25 L 25 -50"/><path d="M 8 -45 L 32 -65"/>
        <path d="M 10 -65 L 30 -85"/>
        ${serratedTicks()}
      </g>
      <g transform="translate(330 360) rotate(-35)">
        <path d="M 0 0 C -45 -8 -65 -55 -38 -90 C -8 -115 28 -105 45 -80 C 60 -50 42 -15 0 0 Z"/>
        <path d="M 0 0 L -18 -75"/><path d="M -8 -25 L -25 -45"/><path d="M -8 -45 L -28 -65"/>
      </g>
      <g transform="translate(470 360) rotate(35)">
        <path d="M 0 0 C 45 -8 65 -55 38 -90 C 8 -115 -28 -105 -45 -80 C -60 -50 -42 -15 0 0 Z"/>
        <path d="M 0 0 L 18 -75"/><path d="M 8 -25 L 25 -45"/><path d="M 8 -45 L 28 -65"/>
      </g>
    </g>
    <g transform="translate(400 510)" text-anchor="middle">
      <line x1="-200" y1="-20" x2="-80" y2="-20" stroke="#1A2F24" stroke-width="0.6"/>
      <line x1="80" y1="-20" x2="200" y2="-20" stroke="#1A2F24" stroke-width="0.6"/>
      <text y="-15" font-family="serif" font-style="italic" font-size="14" fill="#1A2F24" letter-spacing="2">Angelica keiskei</text>
      <text y="10" font-family="serif" font-size="9" fill="#1A2F24" letter-spacing="6" opacity="0.7">— THE TOMORROW LEAF —</text>
    </g>
    <g stroke="#1A2F24" stroke-width="1" fill="none">
      <path d="M 30 30 L 30 60 M 30 30 L 60 30"/><path d="M 770 30 L 770 60 M 770 30 L 740 30"/>
      <path d="M 30 570 L 30 540 M 30 570 L 60 570"/><path d="M 770 570 L 770 540 M 770 570 L 740 570"/>
    </g>
    <text x="400" y="50" text-anchor="middle" font-family="serif" font-size="10" letter-spacing="4" fill="#1A2F24" opacity="0.6">PLATE  IV  ·  FOLIO  XII</text>
  </svg>`,

  "ferment-jar": `<svg viewBox="0 0 400 300" class="block w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    ${inkDefs}${cardBg(400, 300)}
    <g fill="none" stroke="#1A2F24" stroke-width="1.4" stroke-linecap="round">
      <path d="M 140 90 L 140 80 Q 140 70 150 70 L 250 70 Q 260 70 260 80 L 260 90"/>
      <path d="M 130 90 L 270 90 L 270 240 Q 270 255 255 255 L 145 255 Q 130 255 130 240 Z"/>
      <path d="M 135 150 Q 200 145 265 150" stroke-dasharray="3 2"/>
      <circle cx="170" cy="180" r="6"/><circle cx="195" cy="200" r="4"/>
      <circle cx="220" cy="170" r="8"/><circle cx="240" cy="210" r="3"/>
      <circle cx="155" cy="220" r="5"/><circle cx="210" cy="230" r="4"/>
      <path d="M 165 130 Q 180 125 195 132 Q 200 140 190 142 Q 175 145 165 138 Z"/>
      <path d="M 220 138 Q 235 134 245 142 Q 240 148 228 146 Q 218 144 220 138 Z"/>
    </g>
    <g stroke="#B8860B" stroke-width="0.8" fill="none">
      <path d="M 290 120 L 320 100"/><path d="M 320 100 l -6 1 l 3 -5"/>
    </g>
    <text x="325" y="95" font-family="serif" font-style="italic" font-size="11" fill="#1A2F24">Lacto-bacillus</text>
    <text x="200" y="285" text-anchor="middle" font-family="serif" font-size="9" letter-spacing="3" fill="#1A2F24" opacity="0.6">FIG. 7 — LIVING FERMENT</text>
  </svg>`,

  "perennial-roots": `<svg viewBox="0 0 400 300" class="block w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    ${inkDefs}${cardBg(400, 300)}
    <line x1="0" y1="140" x2="400" y2="140" stroke="#1A2F24" stroke-width="1.2"/>
    <line x1="0" y1="143" x2="400" y2="143" stroke="#1A2F24" stroke-width="0.4" stroke-dasharray="1 3"/>
    <g fill="none" stroke="#1A2F24" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 90 140 Q 88 100 92 60"/><path d="M 88 75 q -4 -3 -8 -2"/>
      <path d="M 92 65 q 4 -3 9 -2"/><path d="M 89 90 q -5 -3 -9 -1"/><path d="M 93 100 q 5 -3 10 -1"/>
      <path d="M 130 140 Q 128 90 134 40"/><path d="M 130 60 q -5 -3 -10 -1"/>
      <path d="M 133 50 q 5 -3 11 -1"/><path d="M 130 80 q -5 -3 -10 -1"/>
      <path d="M 175 140 Q 172 110 178 80"/>
      <path d="M 290 140 L 290 70"/><circle cx="290" cy="55" r="35"/>
      <circle cx="275" cy="50" r="3" fill="#B8860B" stroke="none"/>
      <circle cx="300" cy="45" r="3" fill="#B8860B" stroke="none"/>
      <circle cx="295" cy="65" r="3" fill="#B8860B" stroke="none"/>
      <circle cx="280" cy="68" r="3" fill="#B8860B" stroke="none"/>
      <path d="M 90 140 Q 80 170 70 200 Q 65 220 55 240"/>
      <path d="M 75 195 q -10 5 -18 15"/><path d="M 70 215 q 10 8 22 18"/>
      <path d="M 130 140 Q 125 175 120 210 Q 122 240 130 270"/>
      <path d="M 122 200 q 12 6 22 12"/><path d="M 125 230 q -15 4 -28 12"/>
      <path d="M 175 140 Q 180 180 188 220"/>
      <path d="M 290 140 Q 280 180 270 220 Q 260 250 245 275"/>
      <path d="M 290 140 Q 305 180 318 220 Q 328 250 335 275"/>
      <path d="M 285 175 q -15 8 -28 18"/><path d="M 295 175 q 15 8 28 18"/>
      <path d="M 280 215 q -18 10 -32 22"/><path d="M 300 215 q 18 10 32 22"/>
    </g>
    <text x="200" y="285" text-anchor="middle" font-family="serif" font-size="9" letter-spacing="3" fill="#1A2F24" opacity="0.6">FIG. 12 — PLANT ONCE · HARVEST FOREVER</text>
  </svg>`,

  "ice-house": (() => {
    const thatchLines: string[] = [];
    for (let i = 0; i < 8; i++) {
      thatchLines.push(`<line x1="${120 + i * 10}" y1="${180 - i * 9}" x2="${130 + i * 10}" y2="${180 - i * 9 - 4}" stroke-width="0.6"/>`);
    }
    const strawLines: string[] = [];
    for (let i = 0; i < 30; i++) {
      strawLines.push(`<line x1="${115 + i * 5.5}" y1="190" x2="${117 + i * 5.5}" y2="205"/>`);
    }
    return `<svg viewBox="0 0 400 300" class="block w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    ${inkDefs}${cardBg(400, 300)}
    <line x1="0" y1="180" x2="400" y2="180" stroke="#1A2F24" stroke-width="1.2"/>
    <g fill="none" stroke="#1A2F24" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 100 180 L 200 90 L 300 180"/><path d="M 110 180 L 200 100 L 290 180"/>
      ${thatchLines.join("")}
      <path d="M 110 180 L 110 260 Q 110 275 125 275 L 275 275 Q 290 275 290 260 L 290 180" stroke-dasharray="4 3"/>
      <rect x="135" y="210" width="40" height="25"/><rect x="180" y="210" width="40" height="25"/>
      <rect x="225" y="210" width="40" height="25"/><rect x="155" y="240" width="40" height="25"/>
      <rect x="200" y="240" width="40" height="25"/>
      <g stroke-width="0.6">
        <line x1="115" y1="195" x2="285" y2="195"/><line x1="118" y1="200" x2="282" y2="200"/>
        ${strawLines.join("")}
      </g>
      <path d="M 190 180 L 190 145 L 215 145 L 215 180"/>
      <path d="M 320 180 L 320 275" stroke-width="0.6"/>
      <path d="M 317 183 l 3 -5 l 3 5"/><path d="M 317 272 l 3 5 l 3 -5"/>
    </g>
    <text x="335" y="232" font-family="serif" font-style="italic" font-size="10" fill="#1A2F24">8'</text>
    <text x="200" y="125" text-anchor="middle" font-family="serif" font-size="8" letter-spacing="2" fill="#1A2F24" opacity="0.7">ROOF · 18° pitch</text>
    <text x="200" y="290" text-anchor="middle" font-family="serif" font-size="9" letter-spacing="3" fill="#1A2F24" opacity="0.6">FIG. 23 — SUBTERRANEAN ICE VAULT</text>
  </svg>`;
  })(),

  "herb-bundle": (() => {
    const stems: string[] = [];
    for (const dx of [-30, -10, 10, 30]) {
      const leaves: string[] = [];
      for (const y of [20, 45, 70, 95, 120]) {
        const tx = dx * 0.12 * y / 100;
        leaves.push(`<g transform="translate(${tx} ${y})"><path d="M 0 0 q -8 -4 -12 -10 q 4 -2 12 0 z"/><path d="M 0 0 q 8 -4 12 -10 q -4 -2 -12 0 z"/></g>`);
      }
      stems.push(`<g transform="translate(${200 + dx} 138)"><path d="M 0 0 Q ${dx * 0.1} 60 ${dx * 0.15} 130"/>${leaves.join("")}<circle cx="${dx * 0.15}" cy="130" r="2" fill="#B8860B" stroke="none"/></g>`);
    }
    return `<svg viewBox="0 0 400 300" class="block w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    ${inkDefs}${cardBg(400, 300)}
    <g fill="none" stroke="#1A2F24" stroke-width="1.3" stroke-linecap="round">
      <path d="M 195 130 Q 200 138 205 130"/><path d="M 192 135 Q 200 142 208 135"/>
      ${stems.join("")}
      <path d="M 200 130 L 200 90 Q 200 75 215 75"/>
      <line x1="100" y1="75" x2="300" y2="75" stroke-width="2"/>
    </g>
    <text x="200" y="285" text-anchor="middle" font-family="serif" font-size="9" letter-spacing="3" fill="#1A2F24" opacity="0.6">FIG. 31 — DRIED MEDICINAL HERBS</text>
  </svg>`;
  })(),

  mortar: `<svg viewBox="0 0 400 300" class="block w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    ${inkDefs}${cardBg(400, 300)}
    <g fill="none" stroke="#1A2F24" stroke-width="1.4" stroke-linecap="round">
      <path d="M 130 160 Q 130 240 200 245 Q 270 240 270 160"/>
      <ellipse cx="200" cy="160" rx="70" ry="14"/>
      <ellipse cx="200" cy="160" rx="60" ry="10" stroke-width="0.6" opacity="0.5"/>
      <circle cx="185" cy="195" r="3"/><circle cx="200" cy="200" r="2.5"/>
      <circle cx="215" cy="192" r="3"/><circle cx="195" cy="210" r="2"/>
      <circle cx="210" cy="215" r="2.5"/>
      <path d="M 240 90 L 280 50"/>
      <ellipse cx="245" cy="90" rx="10" ry="6" transform="rotate(-45 245 90)"/>
      <circle cx="282" cy="48" r="6"/>
    </g>
    <text x="200" y="285" text-anchor="middle" font-family="serif" font-size="9" letter-spacing="3" fill="#1A2F24" opacity="0.6">FIG. 02 — APOTHECARY MORTAR</text>
  </svg>`,
};

export function getIllustration(name: string): string {
  return illustrations[name] || illustrations.ashitaba;
}
