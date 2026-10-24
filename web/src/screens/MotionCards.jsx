/**
 * MotionCards.jsx — title and closing cards used by the demo video (/mg/intro, /mg/outro).
 * They are normal routes, so they can also be opened in a browser to preview the motion graphics.
 */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Seal from '../components/Seal';
import { api } from '../api';

const EASE = [0.22, 1, 0.36, 1];

function Intro() {
  const letters = 'SAKSHI'.split('');
  return (
    <div className="fixed inset-0 bg-[#181A20] text-white overflow-hidden flex flex-col items-center justify-center">
      {[0, 0.25, 0.5].map((d, i) => (
        <motion.span key={i} className="absolute rounded-full border border-[#C0153F]"
          style={{ width: 220, height: 220, left: 'calc(50% - 110px)', top: 'calc(50% - 250px)' }}
          initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: [0.4, 4.2], opacity: [0.7, 0] }}
          transition={{ delay: 0.9 + d, duration: 1.8, ease: 'easeOut' }} />
      ))}
      <motion.div initial={{ scale: 4, opacity: 0, rotate: -40 }} animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 130, damping: 14, delay: 0.5 }} className="rounded-full bg-white p-3">
        <Seal token="SAKSHI-WITNESS" size={170} />
      </motion.div>
      <div className="flex mt-9 font-display" style={{ fontSize: 124, fontWeight: 800, letterSpacing: '0.08em' }}>
        {letters.map((l, i) => (
          <motion.span key={i} initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 1.5 + i * 0.1, duration: 0.7, ease: EASE }}>{l}</motion.span>
        ))}
      </div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.5, duration: 0.8 }}
        className="text-[26px] text-white/80 mt-2">A witness that confirms, never discloses.</motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.4, duration: 0.8 }}
        className="absolute bottom-14 text-[17px] tracking-[0.18em] text-white/50 uppercase">Smart India Hackathon 2026 · SIH26263 · AICTE · Smart Automation</motion.div>
    </div>
  );
}

function Count({ to, delay = 0 }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf; const t0 = performance.now() + delay * 1000;
    const tick = (t) => { const p = Math.max(0, Math.min(1, (t - t0) / 1500)); setN(Math.round(to * (1 - (1 - p) ** 3))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [to, delay]);
  return <>{n.toLocaleString('en-IN')}</>;
}

function Outro() {
  const [d, setD] = useState({});
  useEffect(() => {
    api.demoLogin('officer').then(async (r) => {
      const tk = r.access_token;
      const [ov, proof, audit] = await Promise.all([api.getOverview(2026, tk), api.runPrivacyProof(tk), api.verifyAuditChain(tk)]);
      setD({ seats: ov.total_seats, flags: ov.open_flags, raw: proof.match_count, tables: proof.tables_scanned, audit: audit.entries_checked, valid: audit.valid });
    }).catch(() => {});
  }, []);
  const cards = [
    ['raw student IDs found', d.raw ?? 0, `live scan of ${d.tables ?? '…'} database tables`],
    ['seats counted', d.seats ?? 0, 'across 15 colleges, synthetic data'],
    ['flags, each with a reason in plain words', d.flags ?? 0, 'a person decides, never the system'],
    ['audit entries, chain verified', d.audit ?? 0, d.valid === false ? 'CHAIN BROKEN' : 'any edit would break the chain'],
  ];
  return (
    <div className="fixed inset-0 bg-[#181A20] text-white flex flex-col items-center justify-center px-24">
      <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}
        className="font-display text-center" style={{ fontSize: 76, fontWeight: 800, letterSpacing: '-0.03em' }}>Verify without collecting.</motion.h2>
      <div className="grid grid-cols-4 gap-6 mt-14 w-full max-w-[1500px]">
        {cards.map(([label, val, sub], i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 + i * 0.3, duration: 0.8, ease: EASE }}
            className="rounded-3xl bg-white/[0.07] p-8">
            <div className="font-display tabular-nums" style={{ fontSize: 84, fontWeight: 800, lineHeight: 1 }}><Count to={val} delay={1.0 + i * 0.3} /></div>
            <div className="text-[21px] mt-3">{label}</div>
            <div className="text-[15px] text-white/50 mt-2">{sub}</div>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.2, duration: 1 }} className="mt-16 flex items-center gap-4">
        <div className="rounded-full bg-white p-1.5"><Seal token="SAKSHI-WITNESS" size={60} /></div>
        <div><div className="font-display text-[40px] tracking-[0.08em]" style={{ fontWeight: 800 }}>SAKSHI</div><div className="text-white/60 text-[16px]">Thank you. · SIH26263 · AICTE</div></div>
      </motion.div>
    </div>
  );
}

export default function MotionCards() {
  const { kind } = useParams();
  return kind === 'outro' ? <Outro /> : <Intro />;
}
