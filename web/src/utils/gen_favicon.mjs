import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));

function seedFromToken(t) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h || 1;
}
function makeRng(s) {
  let state = s;
  return () => { state ^= state << 13; state ^= state >> 17; state ^= state << 5; state = state >>> 0; return state / 0xffffffff; };
}
function p2c(cx, cy, r, a) {
  const rad = (a - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function petal(cx, cy, ang, len, w) {
  const tip = p2c(cx, cy, len, ang), lB = p2c(cx, cy, w * 0.4, ang - 90), rB = p2c(cx, cy, w * 0.4, ang + 90);
  const c1 = p2c(cx, cy, len * 0.55, ang - 30), c2 = p2c(cx, cy, len * 0.55, ang + 30);
  const f = n => n.toFixed(2);
  return `M ${f(lB.x)} ${f(lB.y)} C ${f(c1.x)} ${f(c1.y)}, ${f(tip.x)} ${f(tip.y)}, ${f(tip.x)} ${f(tip.y)} C ${f(tip.x)} ${f(tip.y)}, ${f(c2.x)} ${f(c2.y)}, ${f(rB.x)} ${f(rB.y)} Z`;
}
function innerRing(cx, cy, r, n) {
  const ps = [];
  for (let i = 0; i < n; i++) {
    const a = (360 / n) * i, s = p2c(cx, cy, r, a), e = p2c(cx, cy, r, a + 360 / n);
    ps.push(`M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`);
  }
  return ps.join(' ');
}

const tok = 'SAKSHI-WITNESS', sz = 64;
const rng = makeRng(seedFromToken(tok));
const cx = sz / 2, cy = sz / 2, pad = sz * 0.06, outerR = cx - pad;
const pCounts = [6, 7, 7, 8, 8, 8, 9];
const N = pCounts[Math.floor(rng() * pCounts.length)];
const pLen = outerR * (0.72 + rng() * 0.16), pW = sz * (0.07 + rng() * 0.06);
const rot = Math.floor(rng() * 360 / N);
const irR = outerR * (0.35 + rng() * 0.15), dotR = sz * (0.05 + rng() * 0.03);
const hasSec = rng() > 0.45, secN = N % 2 === 0 ? N / 2 : N;
const pp = [], sp = [];
for (let i = 0; i < N; i++) pp.push(petal(cx, cy, rot + (360 / N) * i, pLen, pW));
if (hasSec) {
  const sL = pLen * (0.55 + rng() * 0.1), sW = pW * 0.65;
  for (let i = 0; i < secN; i++) sp.push(petal(cx, cy, rot + (360 / N) * i + (360 / N / 2), sL, sW));
}
const irP = innerRing(cx, cy, irR, N);
const bR1 = outerR + pad * 0.3, bR2 = outerR + pad * 0.8;
const sw = Math.max(0.8, sz * 0.015), tsw = sw * 0.65;
const cc = '#C0153F';
const f = n => Number(n).toFixed(2);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sz} ${sz}" width="${sz}" height="${sz}">
  <rect width="${sz}" height="${sz}" rx="14" fill="#FFF9EA"/>
  <circle cx="${cx}" cy="${cy}" r="${f(bR2)}" fill="none" stroke="${cc}" stroke-width="${f(tsw)}"/>
  <circle cx="${cx}" cy="${cy}" r="${f(bR1)}" fill="none" stroke="${cc}" stroke-width="${f(tsw * 0.7)}" stroke-dasharray="${(sz * 0.04).toFixed(1)} ${(sz * 0.02).toFixed(1)}"/>
  ${pp.map(d => `<path d="${d}" fill="none" stroke="${cc}" stroke-width="${f(sw)}" stroke-linejoin="round"/>`).join('\n  ')}
  ${hasSec && sp.length ? sp.map(d => `<path d="${d}" fill="none" stroke="${cc}" stroke-width="${f(sw * 0.75)}" stroke-linejoin="round" opacity="0.7"/>`).join('\n  ') : ''}
  <path d="${irP}" fill="none" stroke="${cc}" stroke-width="${f(tsw * 0.9)}" opacity="0.5"/>
  <circle cx="${cx}" cy="${cy}" r="${f(dotR)}" fill="${cc}" opacity="0.9"/>
  <circle cx="${cx}" cy="${cy}" r="${f(dotR * 0.45)}" fill="none" stroke="${cc}" stroke-width="${f(tsw * 0.6)}"/>
</svg>`;

const outPath = join(__dir, '../../../web/public/favicon.svg');
writeFileSync(outPath, svg);
console.log('Wrote favicon.svg —', N, 'petals, secondLayer:', hasSec);
