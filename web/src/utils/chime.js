/**
 * chime.js — tiny synthesized two-note "done" sound (no audio file needed).
 * Off by default. Turn on with: localStorage.setItem('sakshi_sound', '1')
 * or with the sound toggle in the story player.
 */
export function soundEnabled() {
  try { return localStorage.getItem('sakshi_sound') === '1'; } catch { return false; }
}
export function setSound(on) {
  try { localStorage.setItem('sakshi_sound', on ? '1' : '0'); } catch { /* ignore */ }
}
export function playChime() {
  if (!soundEnabled()) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [[659.25, 0], [987.77, 0.11]].forEach(([f, d]) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, now + d);
      g.gain.exponentialRampToValueAtTime(0.18, now + d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + d + 0.6);
      o.connect(g).connect(ctx.destination); o.start(now + d); o.stop(now + d + 0.65);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch { /* audio blocked — fine */ }
}
