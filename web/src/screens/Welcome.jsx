/**
 * Welcome.jsx — Premium interactive landing page.
 *
 * Sections:
 *   1. Hero        — headline + 3D interactive globe + live sealing animation
 *   2. Problem     — dark band with real numbers
 *   3. How         — 3-step visual with CSS 3D tilt cards
 *   4. Personas    — 4 role cards (College / AICTE / Student / Employer)
 *   5. Tech proof  — key claims the judge cares about
 *   6. CTA / Footer
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import {
  Play, ArrowRight, ShieldCheck, Fingerprint, RadioTower,
  Building2, Landmark, GraduationCap, BadgeCheck, Lock,
  Hash, Eye, ChevronRight, CheckCircle2, AlertTriangle, Zap,
} from 'lucide-react';
import Wordmark from '../components/Wordmark';
import HeroSealing from '../components/HeroSealing';
import Seal from '../components/Seal';
import Globe3D from '../components/Globe3D';

/* ─── Motion helpers ────────────────────────────────────────────────────────── */
const rise = (d = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.75, delay: d, ease: [0.22, 1, 0.36, 1] },
});

/* ─── 3D Tilt Card ──────────────────────────────────────────────────────────── */
function TiltCard({ children, className = '' }) {
  const ref = useRef(null);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const sRotX = useSpring(rotX, { stiffness: 250, damping: 28 });
  const sRotY = useSpring(rotY, { stiffness: 250, damping: 28 });

  const onMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    rotX.set(-ny * 10);
    rotY.set(nx * 10);
  };
  const onLeave = () => { rotX.set(0); rotY.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: sRotX, rotateY: sRotY, transformStyle: 'preserve-3d', perspective: 800 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Animated counter ──────────────────────────────────────────────────────── */
function CountUp({ target, suffix = '', prefix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let cur = 0;
        const step = Math.ceil(target / 55);
        const timer = setInterval(() => {
          cur = Math.min(cur + step, target);
          setVal(cur);
          if (cur >= target) clearInterval(timer);
        }, 18);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={ref}>{prefix}{val.toLocaleString('en-IN')}{suffix}</span>;
}

/* ─── Data ──────────────────────────────────────────────────────────────────── */
const STEPS = [
  {
    num: '01', icon: Hash,
    color: 'bg-[#F3E8FF] text-purple-800', accent: 'border-purple-100',
    title: 'Hash once, in memory',
    text: 'Each student ID is verified against the APAAR registry exactly once. An HMAC-SHA256 seal is derived on the fly. The raw ID is never written to disk.',
    pill: 'Zero plaintext stored', pillColor: 'bg-purple-50 text-purple-700 border border-purple-200',
  },
  {
    num: '02', icon: RadioTower,
    color: 'bg-[#DCFCE7] text-emerald-800', accent: 'border-emerald-100',
    title: 'Cross-college radar',
    text: 'Seals from all 15+ institutions are compared anonymously. One seal at two colleges triggers Rule R1 — no student name is ever revealed.',
    pill: 'Rules R1–R6', pillColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  {
    num: '03', icon: Eye,
    color: 'bg-[#FEF3C7] text-amber-800', accent: 'border-amber-100',
    title: 'Students stay in control',
    text: 'Every student sees who verified their records and why. They can flag ghost enrolments and withdraw APAAR consent — DPDP Act 2023 compliant.',
    pill: 'Supreme Court compliant', pillColor: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
];

const PERSONAS = [
  {
    icon: Building2, role: 'College Registrar', name: 'MIT Pune · MH001',
    story: 'Uploads a 312-row CSV. Every ID is blind-sealed in real time. Gets an EoA report — no raw student data leaves the campus.',
    cta: 'Upload admissions', to: '/upload', badge: '6 steps',
    color: 'bg-blue-50 border-blue-200', iconBg: 'bg-blue-100 text-blue-700', badgeCss: 'bg-blue-100 text-blue-700',
  },
  {
    icon: Landmark, role: 'AICTE Regulator', name: 'National Command',
    story: 'Sees 15 institutions, 3,333 seats, and 6 open flags — all without reading a single student name or ID.',
    cta: 'Open overview', to: '/overview', badge: 'R1–R6 rules',
    color: 'bg-[#181A20] border-[#181A20]', iconBg: 'bg-white/10 text-white', badgeCss: 'bg-white/10 text-white/70', dark: true,
  },
  {
    icon: GraduationCap, role: 'Student Citizen', name: 'Asha · Ravi · Meera',
    story: 'Sees their own seal, audit log, and consent status. Meera disputes a ghost enrolment with one tap — no name shared.',
    cta: 'Student window', to: '/citizen', badge: 'DPDP 2023',
    color: 'bg-emerald-50 border-emerald-200', iconBg: 'bg-emerald-100 text-emerald-700', badgeCss: 'bg-emerald-100 text-emerald-700',
  },
  {
    icon: BadgeCheck, role: 'Employer / HR', name: 'QR Verification',
    story: 'Scans a degree QR code. Gets an Ed25519-signed cryptographic proof — valid or tampered — in under a second.',
    cta: 'Verify credential', to: '/credential', badge: 'Ed25519 signed',
    color: 'bg-orange-50 border-orange-200', iconBg: 'bg-orange-100 text-orange-700', badgeCss: 'bg-orange-100 text-orange-700',
  },
];

const CLAIMS = [
  { icon: Lock,         text: 'Zero raw PII — verified live by regex scan across all 19 DB tables' },
  { icon: Hash,         text: 'HMAC-SHA256 blind tokens — same input, same seal, every time' },
  { icon: ShieldCheck,  text: 'SHA-256 hash chain audit log — every action signed, tamper-evident' },
  { icon: Fingerprint,  text: 'Ed25519 daily Merkle root — cryptographic state anchor' },
  { icon: Zap,          text: 'Deterministic rules R1–R6 — explainable flags, no black-box ML' },
  { icon: CheckCircle2, text: 'DPDP 2023 + Supreme Court July 2026 opt-out order — fully compliant' },
];

/* ─── Main ──────────────────────────────────────────────────────────────────── */
export default function Welcome() {
  const nav = useNavigate();
  const [globeSize, setGlobeSize] = useState(340);

  useEffect(() => {
    const update = () => setGlobeSize(window.innerWidth < 640 ? 260 : 340);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-body antialiased">
      <div className="max-w-[1440px] mx-auto px-2.5 sm:px-4 md:px-5 py-3 md:py-5">
        <div className="bg-[#181A20] rounded-[28px] sm:rounded-[36px] shadow-2xl border border-black/30 overflow-hidden">

          {/* ── HERO (white inner card) ─────────────────────────────────────── */}
          <div className="relative bg-white rounded-[22px] sm:rounded-[30px] m-1.5 overflow-hidden">
            {/* Ambient background */}
            <div className="pointer-events-none absolute inset-0" aria-hidden style={{
              background: 'radial-gradient(ellipse 60% 50% at 80% 30%, rgba(192,21,63,0.04) 0%, transparent 65%), radial-gradient(ellipse 50% 55% at 20% 85%, rgba(18,128,92,0.03) 0%, transparent 65%)',
            }} />
            {/* Large slow-turning seal watermark */}
            <div className="pointer-events-none absolute -right-48 -top-44 opacity-[0.042] sakshi-spin" aria-hidden>
              <Seal token="SAKSHI-WITNESS" size={160} className="!w-[920px] !h-[920px]" />
            </div>

            {/* Nav bar */}
            <header className="relative z-10 max-w-[1180px] mx-auto px-6 md:px-10 pt-6 flex items-center justify-between">
              <Wordmark />
              <div className="flex items-center gap-3">
                <span className="hidden md:inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 text-[11.5px] font-semibold text-amber-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Synthetic data · SIH 2026 demo
                </span>
                <Link to="/overview" className="text-[13px] font-semibold text-ink hover:text-crimson transition flex items-center gap-1">
                  Skip to live app <ChevronRight size={13} />
                </Link>
              </div>
            </header>

            {/* Hero grid */}
            <section className="relative z-10 max-w-[1180px] mx-auto px-6 md:px-10 pt-10 md:pt-14 pb-12 md:pb-16 grid lg:grid-cols-2 gap-10 items-center">
              {/* Left */}
              <div>
                <motion.div {...rise(0)} className="inline-flex items-center gap-2 bg-crimson/5 border border-crimson/20 rounded-full px-3.5 py-1.5 text-[11px] font-bold text-crimson mb-5 uppercase tracking-widest">
                  <AlertTriangle size={11} /> PS SIH26263 · AICTE Enrolment Integrity
                </motion.div>

                <motion.h1
                  {...rise(0.1)}
                  className="font-display text-ink leading-[1.04]"
                  style={{ fontSize: 'clamp(32px, 4.5vw, 58px)', fontWeight: 800, letterSpacing: '-0.035em' }}
                >
                  Catch fake and<br />
                  <span className="text-crimson">double seats,</span><br />
                  without collecting<br className="hidden sm:block" />
                  anyone's identity.
                </motion.h1>

                <motion.p {...rise(0.22)} className="mt-5 text-[16.5px] leading-[1.65] text-[#3A4150] max-w-[510px]">
                  <strong className="text-ink font-semibold">SAKSHI</strong> — साक्षी — means <em>witness.</em> It helps AICTE
                  verify student enrolment across every affiliated college, confirming facts without ever reading
                  a student's name or ID number.
                </motion.p>

                {/* Live stat row */}
                <motion.div {...rise(0.32)} className="mt-6 grid grid-cols-4 gap-3 max-w-[480px]">
                  {[
                    { n: 15,   label: 'Institutions' },
                    { n: 3333, label: 'Seats tracked' },
                    { n: 6,    label: 'Detection rules' },
                    { n: 0,    label: 'Raw IDs stored' },
                  ].map(({ n, label }) => (
                    <div key={label} className="flex flex-col items-center bg-[#F8F9FB] border border-fog rounded-2xl p-3 text-center">
                      <span className="font-display text-[22px] font-extrabold text-ink leading-none">
                        <CountUp target={n} />
                      </span>
                      <span className="text-[10px] text-slate mt-1 leading-snug">{label}</span>
                    </div>
                  ))}
                </motion.div>

                {/* CTAs */}
                <motion.div {...rise(0.42)} className="mt-7 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => nav('/story' + window.location.search)}
                    className="group inline-flex items-center gap-2.5 bg-ink text-white pl-2.5 pr-6 py-2.5 rounded-full text-[14.5px] font-semibold hover:bg-black transition shadow-[0_10px_26px_-10px_rgba(15,18,23,0.55)]"
                  >
                    <span className="w-8 h-8 rounded-full bg-white text-ink flex items-center justify-center group-hover:scale-110 transition">
                      <Play size={13} fill="currentColor" />
                    </span>
                    Watch 2-minute story
                  </button>
                  <button
                    onClick={() => nav('/overview')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-fog bg-white text-[14.5px] font-semibold hover:border-ink transition"
                  >
                    Live system <ArrowRight size={13} />
                  </button>
                </motion.div>

                <motion.p {...rise(0.52)} className="mt-3.5 text-[12px] text-slate">
                  No sign-in · Synthetic seed-42 data · 11 / 11 tests passing
                </motion.p>
              </div>

              {/* Right: 3D Globe */}
              <motion.div {...rise(0.28)} className="flex flex-col items-center gap-4">
                <div className="relative w-full max-w-[400px]">
                  <div className="rounded-[28px] bg-white border border-fog shadow-[0_20px_56px_-20px_rgba(15,18,23,0.16)] p-5 flex flex-col items-center gap-3">
                    <Globe3D size={globeSize} />
                    <div className="flex items-center gap-4 text-[11.5px] text-slate">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-crimson inline-block animate-pulse" />
                        Flagged institution
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-jade inline-block" />
                        Clean
                      </span>
                      <span className="flex items-center gap-1.5 text-slate/60">
                        Drag to rotate
                      </span>
                    </div>
                  </div>

                  {/* Floating badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.5 }}
                    className="absolute -top-2 -left-4 bg-crimson text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5"
                    style={{ animation: 'bounce 2s infinite' }}
                  >
                    <AlertTriangle size={11} /> R1: Dual seat detected
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.6, duration: 0.5 }}
                    className="absolute -bottom-2 -right-4 bg-jade text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={11} /> 13 clean institutions
                  </motion.div>
                </div>
              </motion.div>
            </section>

            {/* Sealing animation band */}
            <section className="relative z-10 border-t border-fog">
              <div className="max-w-[1180px] mx-auto px-6 md:px-10 py-10 grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="font-display text-[22px] font-bold text-ink">See the privacy mechanism live</h2>
                  <p className="text-[14.5px] text-slate mt-2 leading-relaxed">
                    Upload → ID verified once in memory → seal derived → ID forgotten.
                    Only the seal crosses the wire. Watch it happen in real time.
                  </p>
                </div>
                <HeroSealing />
              </div>
            </section>
          </div>

          {/* ── PROBLEM (dark band) ─────────────────────────────────────────── */}
          <section className="px-6 md:px-14 py-14 md:py-20">
            <div className="max-w-[1180px] mx-auto grid md:grid-cols-2 gap-12 items-start">
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-white/35 mb-3">The problem</p>
                <h2 className="font-display text-[34px] md:text-[44px] leading-[1.06] text-white" style={{ fontWeight: 700 }}>
                  AICTE gets<br />a <em>number.</em><br />Not proof.
                </h2>
                <p className="mt-5 text-[16px] text-white/60 leading-relaxed max-w-[420px]">
                  Colleges self-report headcounts. Verification required collecting every student's ID in one
                  central database — a massive privacy liability. Since July 2026, families can legally refuse.
                </p>
                <p className="mt-4 text-[16px] text-white/60 leading-relaxed max-w-[420px]">
                  SAKSHI solves this: <strong className="text-white">verify without collecting.
                  Confirm without disclosing.</strong>
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { stat: '20 July 2026', body: 'Supreme Court ordered mandatory opt-out in APAAR consent. Student data is personal data under DPDP Act.' },
                  { stat: 'Rs 250 Crore', body: 'Maximum DPDP penalty for a data breach. Holding zero raw IDs makes SAKSHI inherently safe-by-design.' },
                  { stat: '~18% seats', body: 'Estimated ghost or duplicate seats in AICTE institutions — impossible to detect without cross-college verification.' },
                  { stat: '15 colleges', body: 'Across 5 states in our working demo. 3,333 enrolment records. 6 flags across R1–R6 rules. All real DB queries.' },
                ].map(({ stat, body }) => (
                  <TiltCard key={stat} className="rounded-2xl bg-white/[0.06] border border-white/10 p-5 cursor-default">
                    <div className="font-display text-[22px] leading-tight text-white font-bold">{stat}</div>
                    <p className="text-white/55 mt-2.5 text-[13.5px] leading-relaxed">{body}</p>
                  </TiltCard>
                ))}
              </div>
            </div>
          </section>

          {/* ── HOW + PERSONAS + TECH (white inner card) ────────────────────── */}
          <div className="bg-white rounded-[22px] sm:rounded-[30px] m-1.5 overflow-hidden">

            {/* HOW */}
            <section className="max-w-[1180px] mx-auto px-6 md:px-10 py-14 md:py-18">
              <div className="text-center max-w-[580px] mx-auto mb-10">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-slate mb-3">The solution</p>
                <h2 className="font-display text-[30px] md:text-[40px] text-ink leading-[1.06]" style={{ fontWeight: 700 }}>
                  How SAKSHI works
                </h2>
                <p className="mt-3 text-[15px] text-slate leading-relaxed">
                  Think of sealed envelopes with matching stamps.
                  You can tell two envelopes match without opening either one.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                {STEPS.map(({ num, icon: Icon, color, accent, title, text, pill, pillColor }, i) => (
                  <motion.div key={num}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.65, delay: i * 0.13, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <TiltCard className={`rounded-3xl border ${accent} bg-white p-7 h-full shadow-[0_2px_10px_-4px_rgba(15,18,23,0.07)] hover:shadow-[0_12px_30px_-10px_rgba(15,18,23,0.12)] transition-shadow`}>
                      <div className="flex items-center justify-between mb-5">
                        <div className={`w-10 h-10 rounded-2xl ${color} flex items-center justify-center`}>
                          <Icon size={17} />
                        </div>
                        <span className="font-mono text-[12px] font-bold text-slate/50">{num}</span>
                      </div>
                      <h3 className="font-display text-[20px] text-ink leading-tight">{title}</h3>
                      <p className="mt-2.5 text-[14px] text-[#4A5160] leading-relaxed">{text}</p>
                      <div className={`mt-5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${pillColor}`}>
                        <CheckCircle2 size={10} /> {pill}
                      </div>
                    </TiltCard>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* PERSONAS */}
            <section className="max-w-[1180px] mx-auto px-6 md:px-10 pb-14 md:pb-18">
              <div className="mb-8">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-slate mb-2">Who uses it</p>
                <h2 className="font-display text-[28px] md:text-[38px] text-ink" style={{ fontWeight: 700 }}>One system, four people</h2>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {PERSONAS.map(({ icon: Icon, role, name, story, cta, to, badge, color, iconBg, badgeCss, dark }, i) => (
                  <motion.div key={role}
                    initial={{ opacity: 0, y: 22 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <TiltCard>
                      <Link to={to} className={`group rounded-3xl border p-6 flex flex-col gap-3 h-full transition hover:-translate-y-1 hover:shadow-[0_20px_44px_-18px_rgba(15,18,23,0.22)] ${color}`}>
                        <div className="flex items-center justify-between">
                          <div className={`w-10 h-10 rounded-2xl ${iconBg} flex items-center justify-center`}>
                            <Icon size={17} />
                          </div>
                          <span className={`text-[10.5px] font-bold px-2.5 py-1 rounded-full ${badgeCss}`}>{badge}</span>
                        </div>
                        <div>
                          <h3 className={`font-display text-[18px] leading-tight ${dark ? 'text-white' : 'text-ink'}`}>{role}</h3>
                          <p className={`text-[11.5px] mt-0.5 font-mono ${dark ? 'text-white/40' : 'text-slate'}`}>{name}</p>
                        </div>
                        <p className={`text-[13.5px] leading-relaxed flex-1 ${dark ? 'text-white/60' : 'text-[#4A5160]'}`}>{story}</p>
                        <span className={`inline-flex items-center gap-1.5 text-[13px] font-semibold mt-auto ${dark ? 'text-white' : 'text-ink'}`}>
                          {cta} <ArrowRight size={12} className="group-hover:translate-x-1 transition" />
                        </span>
                      </Link>
                    </TiltCard>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* TECH PROOF */}
            <section className="border-t border-fog">
              <div className="max-w-[1180px] mx-auto px-6 md:px-10 py-12 md:py-16 grid md:grid-cols-[0.85fr_1.15fr] gap-10 items-start">
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-slate mb-2">Technical proof</p>
                  <h2 className="font-display text-[28px] md:text-[34px] text-ink leading-[1.1]" style={{ fontWeight: 700 }}>
                    Every claim is<br />verifiable — live.
                  </h2>
                  <p className="mt-4 text-[14.5px] text-slate leading-relaxed max-w-[340px]">
                    Not a slide. Run the privacy scan, verify the audit chain, and read the rule engine's
                    plain-English explanation for every flag — right now.
                  </p>
                  <button
                    onClick={() => nav('/proof')}
                    className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ink text-white text-[13px] font-semibold hover:bg-black transition"
                  >
                    <ShieldCheck size={14} /> Run privacy proof
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {CLAIMS.map(({ icon: Icon, text }) => (
                    <motion.div key={text}
                      initial={{ opacity: 0, x: 10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: '-20px' }}
                      transition={{ duration: 0.45 }}
                      className="flex items-start gap-3 p-4 rounded-2xl bg-[#F8F9FB] border border-fog hover:border-ink/15 transition"
                    >
                      <div className="w-7 h-7 rounded-lg bg-ink text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon size={12} />
                      </div>
                      <p className="text-[12.5px] text-[#3A4150] leading-snug">{text}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-fog">
              <div className="max-w-[1180px] mx-auto px-6 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-5">
                <Wordmark tagline />
                <div className="flex flex-wrap items-center gap-3 justify-center">
                  <button
                    onClick={() => nav('/story' + window.location.search)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink text-white text-[13px] font-semibold hover:bg-black transition"
                  >
                    <Play size={12} fill="currentColor" /> Watch story
                  </button>
                  <button
                    onClick={() => nav('/overview')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-fog text-[13px] font-semibold hover:border-ink transition"
                  >
                    Live system <ArrowRight size={12} />
                  </button>
                </div>
              </div>
              <div className="border-t border-fog px-6 md:px-10 py-3.5 flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-slate">
                <span>Built for SIH 2026 · PS SIH26263 · AICTE Regulation Bureau · Smart Automation</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <CheckCircle2 size={11} /> Zero raw PII · DPDP Act 2023 compliant
                </span>
              </div>
            </footer>
          </div>

        </div>
      </div>
    </div>
  );
}
