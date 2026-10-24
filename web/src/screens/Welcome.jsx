/**
 * Welcome.jsx — the first thing a judge sees.
 * Goal: in 10 seconds they know the NAME (SAKSHI), the PROBLEM, the IDEA, and what to click.
 */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, ArrowRight, ShieldCheck, Fingerprint, RadioTower, Building2, Landmark, GraduationCap, BadgeCheck } from 'lucide-react';
import Wordmark from '../components/Wordmark';
import HeroSealing from '../components/HeroSealing';
import Seal from '../components/Seal';

const rise = (d = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay: d, ease: [0.22, 1, 0.36, 1] },
});

const STEPS = [
  { icon: ShieldCheck, title: 'Check once', text: 'Each student ID is checked against the registry one time, in memory.' },
  { icon: Fingerprint, title: 'Keep only a seal', text: 'The ID becomes a private seal. The ID itself is never saved.' },
  { icon: RadioTower, title: 'Spot the same seal twice', text: 'If one seal shows up in two colleges, AICTE asks the colleges. Nobody’s name is opened.' },
];

const PEOPLE = [
  { icon: Building2, who: 'College', line: 'Upload admissions, get a clear report.', to: '/upload', cta: 'Open upload' },
  { icon: Landmark, who: 'AICTE officer', line: 'See flags with plain reasons.', to: '/overview', cta: 'Open overview' },
  { icon: GraduationCap, who: 'Student', line: 'See who checked you. Say “This is not me”.', to: '/citizen', cta: 'Open student window' },
  { icon: BadgeCheck, who: 'Employer', line: 'Scan a QR. Know it is real in a second.', to: '/verify', cta: 'Open verifier' },
];

export default function Welcome() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-[#F1F5F9] p-2 sm:p-4 md:p-6 font-body antialiased">
    <div className="max-w-[1380px] mx-auto bg-[#181A20] rounded-[32px] p-2.5 shadow-2xl border border-black/30">
    <div className="relative overflow-hidden bg-white rounded-[24px] text-ink">
      {/* huge slow-turning seal watermark */}
      <div className="pointer-events-none absolute -right-48 -top-40 opacity-[0.07] sakshi-spin" aria-hidden="true">
        <Seal token="SAKSHI-WITNESS" size={160} className="!w-[900px] !h-[900px]" />
      </div>

      {/* top bar */}
      <header className="relative z-10 max-w-[1240px] mx-auto px-6 md:px-10 pt-7 flex items-center justify-between">
        <Wordmark />
        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex items-center gap-2 text-[12.5px] text-slate bg-white border border-fog rounded-full px-3.5 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F2B632]" /> Prototype · synthetic data · mock APAAR registry
          </span>
          <Link to="/overview" className="text-[14px] font-medium text-ink hover:underline underline-offset-4">Skip to live system</Link>
        </div>
      </header>

      {/* hero */}
      <section className="relative z-10 max-w-[1240px] mx-auto px-6 md:px-10 pt-14 md:pt-20 pb-20 grid lg:grid-cols-[1.08fr_0.92fr] gap-14 items-center">
        <div>
          <motion.p {...rise(0.05)} className="text-[15px] text-slate mb-5">
            Smart India Hackathon 2026 · AICTE · SIH26263
          </motion.p>
          <motion.h1 {...rise(0.15)} className="font-display text-[44px] md:text-[64px] leading-[1.02] text-ink" style={{ fontWeight: 800, letterSpacing: '-0.035em' }}>
            Catch fake and double seats, without collecting anyone’s identity.
          </motion.h1>
          <motion.p {...rise(0.3)} className="mt-7 text-[19px] leading-[1.55] text-[#3A4150] max-w-[560px]">
            <strong className="text-ink">SAKSHI</strong> means <em>witness</em>. It helps AICTE check student enrolment across colleges.
            It confirms the facts and never discloses the student.
          </motion.p>
          <motion.div {...rise(0.45)} className="mt-9 flex flex-wrap items-center gap-4">
            <button
              onClick={() => nav('/story' + window.location.search)}
              data-tour="start-story"
              className="group inline-flex items-center gap-3 bg-ink text-white pl-3 pr-7 py-3 rounded-full text-[16px] font-medium hover:bg-black transition shadow-[0_14px_30px_-12px_rgba(15,18,23,0.6)]"
            >
              <span className="w-10 h-10 rounded-full bg-white text-ink flex items-center justify-center group-hover:scale-110 transition"><Play size={16} fill="currentColor" /></span>
              Watch the 2-minute story
            </button>
            <button
              onClick={() => nav('/overview')}
              data-tour="open-live"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-fog bg-white text-[16px] font-medium hover:border-ink transition"
            >
              Explore the live system <ArrowRight size={16} />
            </button>
          </motion.div>
          <motion.p {...rise(0.6)} className="mt-6 text-[13.5px] text-slate">
            No sign-in needed. Everything you will see runs on synthetic data.
          </motion.p>
        </div>

        <motion.div {...rise(0.35)}>
          <HeroSealing />
        </motion.div>
      </section>

      {/* why now */}
      <section className="relative z-10 bg-ink text-white">
        <div className="max-w-[1240px] mx-auto px-6 md:px-10 py-16 grid md:grid-cols-[0.9fr_1.1fr] gap-12 items-start">
          <div>
            <h2 className="font-display text-[38px] leading-[1.08]" style={{ fontWeight: 700 }}>
              AICTE gets a number. Not proof.
            </h2>
            <p className="mt-5 text-[17px] text-white/70 leading-relaxed max-w-[460px]">
              Colleges report how many students they admitted. To check, the old way is to collect every student’s identity in one place.
              That is risky, and since July 2026 families can refuse.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="rounded-2xl bg-white/[0.06] p-6">
              <div className="font-display text-[24px] leading-tight">20 July 2026</div>
              <p className="text-white/70 mt-2 text-[15px]">The Supreme Court ordered an opt-out in the APAAR consent form and said student data falls under the DPDP Act.</p>
            </div>
            <div className="rounded-2xl bg-white/[0.06] p-6">
              <div className="font-display text-[24px] leading-tight">Up to Rs 250 crore</div>
              <p className="text-white/70 mt-2 text-[15px]">The maximum DPDP penalty for failing to protect personal data. Holding less data is the safest design.</p>
            </div>
          </div>
        </div>
      </section>

      {/* how */}
      <section className="relative z-10 max-w-[1240px] mx-auto px-6 md:px-10 py-20">
        <h2 className="font-display text-[36px]" style={{ fontWeight: 700 }}>How SAKSHI works</h2>
        <p className="mt-3 text-[17px] text-slate max-w-[560px]">Think of sealed envelopes with matching stamps. You can tell two envelopes match without opening either one.</p>
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <motion.div key={title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, delay: i * 0.12 }}
              className="rounded-3xl bg-white border border-fog p-7">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-ink text-white flex items-center justify-center text-[15px] font-display">{i + 1}</span>
                <Icon size={22} className="text-crimson" />
              </div>
              <h3 className="mt-5 font-display text-[22px]">{title}</h3>
              <p className="mt-2 text-[15.5px] text-[#4A5160] leading-relaxed">{text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* people */}
      <section className="relative z-10 max-w-[1240px] mx-auto px-6 md:px-10 pb-24">
        <h2 className="font-display text-[36px]" style={{ fontWeight: 700 }}>One system, four people</h2>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PEOPLE.map(({ icon: Icon, who, line, to, cta }, i) => (
            <Link key={who} to={to}
              className={`group rounded-3xl p-6 border transition hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(15,18,23,0.3)] ${i === 1 ? 'bg-ink text-white border-ink' : 'bg-white border-fog'}`}>
              <Icon size={26} className={i === 1 ? 'text-white' : 'text-crimson'} />
              <h3 className="mt-6 font-display text-[22px]">{who}</h3>
              <p className={`mt-2 text-[15px] leading-relaxed ${i === 1 ? 'text-white/70' : 'text-[#4A5160]'}`}>{line}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-[14px] font-medium">{cta} <ArrowRight size={15} className="group-hover:translate-x-1 transition" /></span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-fog">
        <div className="max-w-[1240px] mx-auto px-6 md:px-10 py-7 flex flex-wrap items-center justify-between gap-3 text-[13.5px] text-slate">
          <Wordmark />
          <span>Built for SIH 2026 · PS SIH26263 · AICTE Regulation Bureau · Smart Automation</span>
        </div>
      </footer>
    </div>
    </div>
    </div>
  );
}
