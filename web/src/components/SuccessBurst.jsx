/**
 * SuccessBurst.jsx — the "payment done" moment, SAKSHI style.
 *
 * Sequence (about 1.3 s): disc springs in → soft ripples spread → ring draws
 * itself → tick draws itself → sparks fly out → label rises in.
 *
 * Props
 *   tone   'jade' | 'crimson'   colour family (jade = verified, crimson = sealed / alert)
 *   title  big label under the tick
 *   sub    one calm line under it
 *   size   disc diameter in px (default 112)
 *   icon   'tick' | 'seal'      what to draw inside the disc
 *   token  (optional) seal token used when icon === 'seal'
 */
import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Seal from './Seal';
import { playChime } from '../utils/chime';

const TONES = {
  jade:    { main: '#12805C', soft: '#E6F4EF', spark: ['#12805C', '#34B38A', '#F2B632'] },
  crimson: { main: '#C0153F', soft: '#FAE8EC', spark: ['#C0153F', '#E2587A', '#F2B632'] },
};

export default function SuccessBurst({
  tone = 'jade', title, sub, size = 112, icon = 'tick', token, onDone, className = '',
}) {
  const c = TONES[tone] || TONES.jade;
  const R = size / 2;
  const sparks = useMemo(
    () => Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * Math.PI * 2 + (i % 2 ? 0.12 : 0);
      const near = R + 10 + (i % 3) * 6;
      const far = R + 34 + (i % 4) * 8;
      return {
        i, x1: Math.cos(a) * near, y1: Math.sin(a) * near,
        x2: Math.cos(a) * far, y2: Math.sin(a) * far,
        color: c.spark[i % c.spark.length], dot: i % 3 === 0,
      };
    }), [R, c]);

  useEffect(() => {
    playChime();
    if (!onDone) return undefined;
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className={`flex flex-col items-center ${className}`} role="status" aria-live="polite">
      <div className="relative" style={{ width: size + 120, height: size + 120 }}>
        {/* ripples */}
        {[0, 0.18, 0.36].map((d, i) => (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{ width: size, height: size, marginLeft: -R, marginTop: -R, border: `2px solid ${c.main}` }}
            initial={{ scale: 1, opacity: 0.35 }}
            animate={{ scale: 1.9 + i * 0.25, opacity: 0 }}
            transition={{ duration: 1.1, delay: 0.15 + d, ease: 'easeOut' }}
          />
        ))}
        {/* disc */}
        <motion.span
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{ width: size, height: size, marginLeft: -R, marginTop: -R, background: c.soft }}
          initial={{ scale: 0 }} animate={{ scale: [0, 1.14, 1] }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        />
        <svg className="absolute inset-0" viewBox={`${-(size + 120) / 2} ${-(size + 120) / 2} ${size + 120} ${size + 120}`} fill="none">
          {/* ring */}
          <motion.circle
            r={R - 3} stroke={c.main} strokeWidth="4" strokeLinecap="round"
            style={{ rotate: -90 }}
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 0.55, delay: 0.25, ease: 'easeInOut' }}
          />
          {/* tick */}
          {icon === 'tick' && (
            <motion.path
              d={`M ${-R * 0.34} ${R * 0.02} L ${-R * 0.06} ${R * 0.3} L ${R * 0.4} ${-R * 0.26}`}
              stroke={c.main} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: 0.7, ease: 'easeOut' }}
            />
          )}
          {/* sparks */}
          {sparks.map((s) => (s.dot ? (
            <motion.circle key={s.i} r="3" fill={s.color}
              initial={{ cx: s.x1, cy: s.y1, opacity: 0 }}
              animate={{ cx: s.x2, cy: s.y2, opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, delay: 0.95, ease: 'easeOut' }} />
          ) : (
            <motion.line key={s.i} stroke={s.color} strokeWidth="3" strokeLinecap="round"
              initial={{ x1: s.x1, y1: s.y1, x2: s.x1, y2: s.y1, opacity: 0 }}
              animate={{ x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2, opacity: [0, 1, 0] }}
              transition={{ duration: 0.7, delay: 0.95, ease: 'easeOut' }} />
          )))}
        </svg>
        {icon === 'seal' && token && (
          <motion.div
            className="absolute left-1/2 top-1/2"
            style={{ marginLeft: -(size * 0.34), marginTop: -(size * 0.34) }}
            initial={{ scale: 2.4, opacity: 0, rotate: -18 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 18, delay: 0.55 }}
          >
            <Seal token={token} size={Math.round(size * 0.68)} />
          </motion.div>
        )}
      </div>
      {title && (
        <motion.h3
          className="font-display text-[26px] text-ink -mt-4"
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 1.0, ease: 'easeOut' }}
        >{title}</motion.h3>
      )}
      {sub && (
        <motion.p
          className="text-slate text-[15px] mt-1 text-center max-w-[360px]"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 1.15, ease: 'easeOut' }}
        >{sub}</motion.p>
      )}
    </div>
  );
}

/** Full-screen version: dims the page, shows the burst, closes itself. */
export function SuccessOverlay({ onClose, ...rest }) {
  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-white/80 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <SuccessBurst {...rest} onDone={onClose} />
    </motion.div>
  );
}
