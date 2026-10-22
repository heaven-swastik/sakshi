/**
 * seal.js — Deterministic geometric seal generator
 *
 * The same token string always produces the same SVG seal.
 * Seals look like wax stamps / mandalas — radially symmetric, beautiful.
 *
 * Algorithm:
 *   1. Seed a xorshift PRNG from the token's char codes (no Math.random())
 *   2. Draw N petals (6–9) arranged radially like a mandala
 *   3. Add a double-ring border and a central dot
 *   4. Always stroke: crimson (#C0153F), fill: none
 */

// ─── Deterministic PRNG (xorshift32) ────────────────────────────────────────

function seedFromToken(token) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h || 1;
}

function makeRng(seed) {
  let state = seed;
  return function () {
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    state = state >>> 0;
    return state / 0xffffffff;
  };
}

// ─── Geometric construction helpers ─────────────────────────────────────────

function polarToCart(cx, cy, r, angleDeg) {
  const a = (angleDeg - 90) * (Math.PI / 180);
  return {
    x: cx + r * Math.cos(a),
    y: cy + r * Math.sin(a),
  };
}

/**
 * Build one petal as an SVG cubic bézier "leaf" shape.
 * The petal is centered at (cx,cy), pointing outward at `angleDeg`.
 */
function buildPetal(cx, cy, angleDeg, petalLen, petalWidth, rng) {
  const tip = polarToCart(cx, cy, petalLen, angleDeg);
  const leftBase = polarToCart(cx, cy, petalWidth * 0.4, angleDeg - 90);
  const rightBase = polarToCart(cx, cy, petalWidth * 0.4, angleDeg + 90);

  // Control points: pulled toward the tip's direction for a teardrop/mandala petal
  const cp1L = polarToCart(cx, cy, petalLen * 0.55, angleDeg - 30);
  const cp1R = polarToCart(cx, cy, petalLen * 0.55, angleDeg + 30);

  const d = [
    `M ${leftBase.x.toFixed(2)} ${leftBase.y.toFixed(2)}`,
    `C ${cp1L.x.toFixed(2)} ${cp1L.y.toFixed(2)}, ${tip.x.toFixed(2)} ${tip.y.toFixed(2)}, ${tip.x.toFixed(2)} ${tip.y.toFixed(2)}`,
    `C ${tip.x.toFixed(2)} ${tip.y.toFixed(2)}, ${cp1R.x.toFixed(2)} ${cp1R.y.toFixed(2)}, ${rightBase.x.toFixed(2)} ${rightBase.y.toFixed(2)}`,
    `Z`,
  ].join(' ');

  return d;
}

/**
 * Build an inner decorative pattern: alternating arcs between petals.
 */
function buildInnerRing(cx, cy, r, n) {
  const paths = [];
  for (let i = 0; i < n; i++) {
    const angle = (360 / n) * i;
    const start = polarToCart(cx, cy, r, angle);
    const end   = polarToCart(cx, cy, r, angle + 360 / n);
    // Small arc between petal bases
    paths.push(
      `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`
    );
  }
  return paths.join(' ');
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * generateSealSvg(token, size)
 * Returns a full SVG string. The seal is always 1:1 aspect ratio.
 *
 * @param {string} token  - The student's seal token (deterministic input)
 * @param {number} size   - Output size in px (24 | 32 | 48 | 64 | 96 | 160)
 * @returns {string}      - SVG markup string
 */
export function generateSealSvg(token, size = 48) {
  const rng = makeRng(seedFromToken(token));

  const cx = size / 2;
  const cy = size / 2;
  const padding = size * 0.06;
  const outerR  = cx - padding;

  // Number of petals: 6, 7, 8, or 9 (biased toward 7/8)
  const petalCounts = [6, 7, 7, 8, 8, 8, 9];
  const N = petalCounts[Math.floor(rng() * petalCounts.length)];

  // Petal dimensions
  const petalLen   = outerR * (0.72 + rng() * 0.16);   // 72–88% of outer radius
  const petalWidth = size   * (0.07 + rng() * 0.06);   // varied thickness

  // Rotation offset so seals don't all "point up"
  const rotOffset = Math.floor(rng() * 360 / N);

  // Inner ring radius (decorative)
  const innerRingR = outerR * (0.35 + rng() * 0.15);

  // Central circle radius
  const dotR = size * (0.05 + rng() * 0.03);

  // Second ring of smaller elements?
  const hasSecondLayer = rng() > 0.45;
  const secondN = N % 2 === 0 ? N / 2 : N;

  // ── Build SVG paths ──────────────────────────────────────────────

  // Primary petals
  const petalPaths = [];
  for (let i = 0; i < N; i++) {
    const angle = rotOffset + (360 / N) * i;
    petalPaths.push(buildPetal(cx, cy, angle, petalLen, petalWidth, rng));
  }

  // Optional second layer (shorter petals between primary ones)
  const secondPetalPaths = [];
  if (hasSecondLayer) {
    const secondLen   = petalLen   * (0.55 + rng() * 0.1);
    const secondWidth = petalWidth * 0.65;
    for (let i = 0; i < secondN; i++) {
      const angle = rotOffset + (360 / N) * i + (360 / N / 2);
      secondPetalPaths.push(buildPetal(cx, cy, angle, secondLen, secondWidth, rng));
    }
  }

  // Inner ring decorative arcs
  const innerRingPath = buildInnerRing(cx, cy, innerRingR, N);

  // Outer border ring (double lines)
  const borderR1 = outerR + padding * 0.3;
  const borderR2 = outerR + padding * 0.8;

  const strokeW  = Math.max(0.8, size * 0.015);
  const thinStrokeW = strokeW * 0.65;

  const svg = `<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 ${size} ${size}"
  width="${size}"
  height="${size}"
  aria-hidden="true"
  role="img"
>
  <!-- Outer double-ring border -->
  <circle cx="${cx}" cy="${cy}" r="${borderR2.toFixed(2)}" fill="none" stroke="#C0153F" stroke-width="${thinStrokeW.toFixed(2)}" />
  <circle cx="${cx}" cy="${cy}" r="${borderR1.toFixed(2)}" fill="none" stroke="#C0153F" stroke-width="${(thinStrokeW * 0.7).toFixed(2)}" stroke-dasharray="${(size * 0.04).toFixed(1)} ${(size * 0.02).toFixed(1)}" />

  <!-- Primary petals -->
  ${petalPaths.map(d => `<path d="${d}" fill="none" stroke="#C0153F" stroke-width="${strokeW.toFixed(2)}" stroke-linejoin="round" />`).join('\n  ')}

  ${hasSecondLayer && secondPetalPaths.length > 0 ? `<!-- Secondary petal layer -->
  ${secondPetalPaths.map(d => `<path d="${d}" fill="none" stroke="#C0153F" stroke-width="${(strokeW * 0.75).toFixed(2)}" stroke-linejoin="round" opacity="0.7" />`).join('\n  ')}` : ''}

  <!-- Inner ring -->
  <path d="${innerRingPath}" fill="none" stroke="#C0153F" stroke-width="${(thinStrokeW * 0.9).toFixed(2)}" opacity="0.5" />

  <!-- Central dot -->
  <circle cx="${cx}" cy="${cy}" r="${dotR.toFixed(2)}" fill="#C0153F" opacity="0.9" />
  <circle cx="${cx}" cy="${cy}" r="${(dotR * 0.45).toFixed(2)}" fill="none" stroke="#C0153F" stroke-width="${(thinStrokeW * 0.6).toFixed(2)}" />
</svg>`;

  return svg;
}

/**
 * Encode the seal SVG as a data URI for use in <img> src.
 */
export function sealDataUri(token, size = 48) {
  const svg = generateSealSvg(token, size);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
