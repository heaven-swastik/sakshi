/**
 * HeroSealing.jsx — the looping hero animation on the welcome page.
 * Shows, in plain pictures, what SAKSHI does: IDs come in, get checked,
 * turn into seals, and the IDs are forgotten.
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import Seal from './Seal';

const ROWS = [
  { id: '4821 7730 5519', token: 'STU-DEMO-A1' },
  { id: '3092 1184 6670', token: 'STU-DEMO-B2' },
  { id: '7745 0293 8816', token: 'STU-DEMO-C3' },
  { id: '5160 9927 2043', token: 'STU-DEMO-D4' },
];
// phase 0 = IDs shown, 1 = being checked, 2 = sealed, 3 = hold
const PHASE_MS = [1500, 2400, 3400, 700];
const CAPTION = [
  'A college uploads its admissions list.',
  'Each ID is checked once…',
  'Now only a private seal is kept. The ID is gone.',
  'Now only a private seal is kept. The ID is gone.',
];

export default function HeroSealing() {
  const [phase, setPhase] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      if (phase === 3) { setCycle((c) => c + 1); setPhase(0); } else setPhase(phase + 1);
    }, PHASE_MS[phase]);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div className="relative bg-white rounded-[28px] border border-fog p-7 md:p-8 shadow-[0_30px_80px_-30px_rgba(15,18,23,0.25)]">
      <div className="flex items-center justify-between text-[13px] text-slate mb-5">
        <span>College sends</span>
        <span>AICTE keeps</span>
      </div>

      <div className="relative space-y-3.5">
        {ROWS.map((r, i) => {
          const checked = phase >= 1;
          const sealed = phase >= 2;
          return (
            <div key={`${cycle}-${i}`} className="relative flex items-center justify-between h-[64px] rounded-2xl bg-paper px-5">
              {/* the ID */}
              <motion.div
                className="font-display text-[22px] tabular-nums text-ink flex items-center gap-3"
                animate={sealed
                  ? { opacity: 0, filter: 'blur(10px)', letterSpacing: '0.35em', x: 14 }
                  : { opacity: 1, filter: 'blur(0px)', letterSpacing: '0.04em', x: 0 }}
                transition={{ duration: 0.7, delay: sealed ? i * 0.16 : 0, ease: 'easeInOut' }}
              >
                {r.id}
                <AnimatePresence>
                  {checked && !sealed && (
                    <motion.span
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      transition={{ delay: i * 0.22, type: 'spring', stiffness: 500, damping: 22 }}
                      className="w-6 h-6 rounded-full bg-jade text-white flex items-center justify-center"
                    ><Check size={14} strokeWidth={3} /></motion.span>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* the seal */}
              <motion.div
                animate={sealed ? { scale: [0.2, 1.25, 1], opacity: 1, rotate: [-25, 0] } : { scale: 0.2, opacity: 0 }}
                transition={{ duration: 0.55, delay: sealed ? 0.35 + i * 0.16 : 0, ease: [0.22, 1, 0.36, 1] }}
              >
                <Seal token={r.token} size={46} />
              </motion.div>
            </div>
          );
        })}

        {/* scanning line */}
        <AnimatePresence>
          {phase === 1 && (
            <motion.div
              key="scan"
              className="absolute left-0 right-0 h-[3px] rounded-full bg-crimson/80 shadow-[0_0_18px_rgba(192,21,63,0.6)]"
              initial={{ top: 0, opacity: 0 }} animate={{ top: '100%', opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 1.9, ease: 'easeInOut' }}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 h-6 text-[15px] text-ink">
        <AnimatePresence mode="wait">
          <motion.p key={CAPTION[phase]} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            {CAPTION[phase]}
          </motion.p>
        </AnimatePresence>
      </div>
      <p className="text-[12px] text-slate mt-4">Numbers shown are synthetic demo values.</p>
    </div>
  );
}
