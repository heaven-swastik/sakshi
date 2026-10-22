/**
 * SealingRow.jsx — One row in the upload results.
 *
 * Animation sequence (respects prefers-reduced-motion):
 *   1. Show masked ID text "[ID •••••••••••]" for 0.3s
 *   2. Text blurs and shrinks (0.25s)
 *   3. Seal grows + fades in (0.4s with spring)
 *
 * Props:
 *   token    (string)  — seal token
 *   rowNum   (number)  — row index (for stagger delay)
 *   status   (string)  — 'accepted' | 'rejected' | 'warning'
 *   reason   (string)  — optional error reason
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Seal from './Seal';
import StatusBadge from './StatusBadge';

// Detect reduced motion preference
function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function SealingRow({ token, rowNum, status, reason, delay = 0 }) {
  const [phase, setPhase] = useState('id'); // 'id' | 'sealing' | 'sealed'
  const reduced = useRef(prefersReducedMotion());

  useEffect(() => {
    if (reduced.current) {
      // Skip animation entirely — just show the seal
      setPhase('sealed');
      return;
    }

    const t1 = setTimeout(() => setPhase('sealing'), delay + 300);
    const t2 = setTimeout(() => setPhase('sealed'),  delay + 700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [delay]);

  return (
    <tr className="border-b border-fog last:border-0">
      {/* Row number */}
      <td className="py-3 pl-4 pr-2 text-slate text-sm tabular-nums w-12">
        {rowNum}
      </td>

      {/* Status badge */}
      <td className="py-3 px-2">
        <StatusBadge status={status} />
      </td>

      {/* Reason */}
      <td className="py-3 px-2 text-sm text-slate max-w-xs">
        {reason ?? '—'}
      </td>

      {/* Seal column — the animated part */}
      <td className="py-3 px-4 w-16">
        <div className="relative w-8 h-8 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {phase === 'id' && (
              <motion.span
                key="id-text"
                initial={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                exit={{
                  opacity: 0,
                  filter: 'blur(4px)',
                  scale: 0.7,
                  transition: { duration: 0.25, ease: 'easeIn' },
                }}
                className="text-[9px] text-slate font-mono leading-none whitespace-nowrap select-none"
                aria-hidden="true"
              >
                ••••••••
              </motion.span>
            )}

            {(phase === 'sealing' || phase === 'sealed') && (
              <motion.div
                key="seal"
                initial={reduced.current ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0, rotate: -20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 320,
                  damping: 18,
                  duration: 0.45,
                }}
              >
                <Seal token={token} size={32} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </td>
    </tr>
  );
}
