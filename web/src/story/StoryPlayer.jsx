/**
 * StoryPlayer.jsx — SAKSHI's cinematic demo mode ("the story").
 * Seven short chapters, each with 2–3 beats. It plays by itself at a calm pace,
 * and a user can pause, step, jump, or leave at any time.
 *
 * Keys: Space = pause/play · ← → = previous/next beat · Esc = leave
 */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, SkipBack, SkipForward, X, ArrowRight, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import Wordmark from '../components/Wordmark';
import { setSound, soundEnabled } from '../utils/chime';
import { api } from '../api';
import {
  SceneProblem, SceneHow, SceneAsha, SceneRavi, SceneMeera, SceneEmployer, SceneProof,
} from './scenes';

export const CHAPTERS = [
  { id: 'problem', label: 'The problem', Scene: SceneProblem, beats: [
    { ms: 7500, line: '240 seats reported.', sub: 'AICTE receives a number from every college.' },
    { ms: 8000, line: 'But who is behind the number?', sub: 'Collecting every identity is risky. Families can now say no.' },
    { ms: 8000, line: 'So we built a witness.', sub: 'SAKSHI confirms. It never discloses.' },
  ] },
  { id: 'how', label: 'How it works', Scene: SceneHow, beats: [
    { ms: 7000, line: 'A college uploads its list.', sub: 'Each ID is checked once, in memory.' },
    { ms: 8000, line: 'The ID becomes a private seal.', sub: 'AICTE keeps the seal, never the ID.' },
    { ms: 6500, line: 'The ID is forgotten.', sub: 'That is the whole idea.' },
  ] },
  { id: 'asha', label: 'Asha', Scene: SceneAsha, beats: [
    { ms: 6500, line: 'Asha chose not to have an APAAR ID.', sub: 'The Supreme Court says that is her right.' },
    { ms: 6500, line: 'Her seat is still counted.', sub: 'She uses a college-attested ID.' },
    { ms: 6000, line: 'No flag. No penalty.', sub: 'Opting out is never treated as fraud.' },
  ] },
  { id: 'ravi', label: 'Ravi', Scene: SceneRavi, beats: [
    { ms: 6500, line: 'Ravi took seats in two colleges.', sub: 'Each college sends only his seal.' },
    { ms: 7500, line: 'The same seal appears twice.', sub: 'AICTE sees a match, not a name.' },
    { ms: 7500, line: 'So AICTE asks the colleges.', sub: 'Nothing is opened. Everything is logged.' },
  ] },
  { id: 'meera', label: 'Meera', Scene: SceneMeera, beats: [
    { ms: 6500, line: 'Meera sees a college she never joined.', sub: 'Her Citizen Window lists every seat in her name.' },
    { ms: 6500, line: 'She taps “This is not me”.', sub: 'One tap. No form. No office visit.' },
    { ms: 7500, line: 'AICTE gets the dispute at once.', sub: 'A ghost seat, caught by the student.' },
  ] },
  { id: 'employer', label: 'Employer', Scene: SceneEmployer, beats: [
    { ms: 6500, line: 'An employer scans Ravi’s QR.', sub: 'The credential is signed by AICTE.' },
    { ms: 7500, line: 'The signature checks out.', sub: 'No call to a central database of names.' },
    { ms: 6500, line: 'Valid.', sub: 'And Ravi shared only what he chose.' },
  ] },
  { id: 'proof', label: 'Proof', Scene: SceneProof, beats: [
    { ms: 8000, line: 'Don’t trust us. Check.', sub: 'One button scans the whole database for raw IDs.' },
    { ms: 0, line: 'Zero found.', sub: 'A witness that confirms, never discloses.' },
  ] },
];

export default function StoryPlayer() {
  const nav = useNavigate();
  const [ci, setCi] = useState(0);
  const [bi, setBi] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [sound, setSoundState] = useState(soundEnabled());
  const [proof, setProof] = useState(null);
  const timer = useRef(null);
  const stageRef = useRef(null);
  const [scale, setScale] = useState(1);
  const params = new URLSearchParams(window.location.search);
  const startSpeed = parseFloat(params.get('speed')) || 1;
  useEffect(() => { setSpeed(startSpeed); }, [startSpeed]);
  useLayoutEffect(() => {
    const el = stageRef.current; if (!el) return undefined;
    const fit = () => setScale(Math.max(0.6, Math.min(1.7, Math.min(el.clientWidth / 1120, el.clientHeight / 470))));
    fit(); const ro = new ResizeObserver(fit); ro.observe(el); return () => ro.disconnect();
  }, []);

  const chapter = CHAPTERS[ci];
  const beat = chapter.beats[bi];
  const isLast = ci === CHAPTERS.length - 1 && bi === chapter.beats.length - 1;

  // real numbers for the final scene (falls back to the seeded values if the API is asleep)
  useEffect(() => {
    api.demoLogin('auditor').then((r) => api.runPrivacyProof(r.access_token)).then((p) => {
      setProof({
        tables_scanned: p.tables_scanned,
        raw_ids_found: p.match_count,
        tables: Object.keys(p.table_detail || {}),
      });
    }).catch(() => {});
  }, []);

  const next = useCallback(() => {
    if (bi < chapter.beats.length - 1) setBi(bi + 1);
    else if (ci < CHAPTERS.length - 1) { setCi(ci + 1); setBi(0); }
  }, [bi, ci, chapter]);
  const prev = useCallback(() => {
    if (bi > 0) setBi(bi - 1);
    else if (ci > 0) { setCi(ci - 1); setBi(CHAPTERS[ci - 1].beats.length - 1); }
  }, [bi, ci]);

  // auto-advance
  useEffect(() => {
    clearTimeout(timer.current);
    if (!playing || !beat.ms) return undefined;
    timer.current = setTimeout(next, beat.ms / speed);
    return () => clearTimeout(timer.current);
  }, [ci, bi, playing, speed, beat, next]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space') { e.preventDefault(); setPlaying((p) => !p); }
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape') nav('/overview');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, nav]);

  const restart = () => { setCi(0); setBi(0); setPlaying(true); };
  const words = useMemo(() => beat.line.split(' '), [beat.line]);
  const Scene = chapter.Scene;

  return (
    <div className="fixed inset-0 bg-[#F1F5F9] p-2 sm:p-4 md:p-6 font-body antialiased" data-story>
    <div className="h-full max-w-[1380px] mx-auto bg-[#181A20] rounded-[32px] p-2.5 shadow-2xl border border-black/30">
    <div className="h-full bg-white rounded-[24px] text-ink flex flex-col select-none overflow-hidden">
      {/* top bar */}
      <div className="px-6 md:px-10 pt-6 flex items-center gap-8">
        <button onClick={() => nav('/')} aria-label="Back to start"><Wordmark /></button>
        <div className="flex-1 flex items-center gap-2" role="tablist" aria-label="Story chapters">
          {CHAPTERS.map((c, i) => {
            const state = i < ci ? 'done' : i === ci ? 'now' : 'todo';
            const frac = state === 'done' ? 1 : state === 'now' ? (bi + 1) / c.beats.length : 0;
            return (
              <button key={c.id} onClick={() => { setCi(i); setBi(0); }} role="tab" aria-selected={state === 'now'}
                className="group flex-1 text-left" title={c.label}>
                <div className="h-[5px] rounded-full bg-fog overflow-hidden">
                  <motion.div className="h-full bg-ink rounded-full" initial={false} animate={{ width: `${frac * 100}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
                </div>
                <div className={`mt-2 text-[12.5px] transition ${state === 'now' ? 'text-ink font-medium' : 'text-slate group-hover:text-ink'}`}>{c.label}</div>
              </button>
            );
          })}
        </div>
        <button onClick={() => nav('/overview')} className="inline-flex items-center gap-2 text-[14px] font-medium hover:underline underline-offset-4">
          Skip to live system <X size={16} />
        </button>
      </div>

      {/* stage */}
      <div ref={stageRef} className="flex-1 min-h-0 px-6 md:px-10 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={ci} className="absolute left-1/2 top-1/2" style={{ width: 1120, height: 470, marginLeft: -560, marginTop: -235, scale }}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.5 }}>
            <Scene beat={bi} proof={proof} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* caption + controls */}
      <div className="px-6 md:px-10 pb-8 pt-2 flex items-end justify-between gap-10">
        <div className="max-w-[860px] min-h-[132px]">
          <AnimatePresence mode="wait">
            <motion.div key={`${ci}-${bi}`} initial="h" animate="s" exit={{ opacity: 0, y: -8, transition: { duration: 0.25 } }}>
              <h2 className="font-display text-[46px] md:text-[54px] leading-[1.04]" style={{ fontWeight: 800, letterSpacing: '-0.03em' }}>
                {words.map((w, i) => (
                  <motion.span key={i} className="inline-block mr-[0.28em]"
                    variants={{ h: { opacity: 0, y: 18, filter: 'blur(6px)' }, s: { opacity: 1, y: 0, filter: 'blur(0px)' } }}
                    transition={{ duration: 0.55, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}>{w}</motion.span>
                ))}
              </h2>
              <motion.p className="mt-3 text-[20px] text-[#4A5160]" variants={{ h: { opacity: 0 }, s: { opacity: 1 } }} transition={{ delay: 0.5 + words.length * 0.07, duration: 0.6 }}>{beat.sub}</motion.p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-col items-end gap-4 pb-1">
          {isLast ? (
            <div className="flex items-center gap-3">
              <button onClick={restart} className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-fog bg-white text-[15px] font-medium hover:border-ink"><RotateCcw size={16} /> Replay</button>
              <button onClick={() => nav('/overview')} data-tour="story-explore" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-ink text-white text-[15px] font-medium hover:bg-black">Explore the live system <ArrowRight size={16} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-white border border-fog rounded-full p-1.5 shadow-sm">
              <button onClick={prev} className="w-10 h-10 rounded-full hover:bg-paper flex items-center justify-center" aria-label="Previous"><SkipBack size={17} /></button>
              <button onClick={() => setPlaying((p) => !p)} className="w-12 h-12 rounded-full bg-ink text-white flex items-center justify-center" aria-label={playing ? 'Pause' : 'Play'}>
                {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              </button>
              <button onClick={next} className="w-10 h-10 rounded-full hover:bg-paper flex items-center justify-center" aria-label="Next"><SkipForward size={17} /></button>
              <button onClick={() => setSpeed((s) => (s === 1 ? 0.75 : s === 0.75 ? 1.5 : 1))} className="px-3 h-10 rounded-full hover:bg-paper text-[13.5px] tabular-nums">{speed}×</button>
              <button onClick={() => { const n = !sound; setSound(n); setSoundState(n); }} className="w-10 h-10 rounded-full hover:bg-paper flex items-center justify-center" aria-label="Sound">
                {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
              </button>
            </div>
          )}
          <div className="text-[12.5px] text-slate">Space pauses · ← → steps · Esc leaves</div>
        </div>
      </div>
    </div>
    </div>
    </div>
  );
}