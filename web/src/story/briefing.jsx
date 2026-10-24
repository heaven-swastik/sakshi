/**
 * briefing.jsx — the three "briefing" chapters shown before the story:
 *   1. the problem we are solving   2. the workflow (architecture)   3. the core innovation
 * Same engine as the story (StoryPlayer), opened at /briefing.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Ghost, Users, BarChart3, KeyRound, Lock, Mail, QrCode, UserCheck, ScrollText, ShieldCheck, Fingerprint, Check, X, Landmark, EyeOff, Scale } from 'lucide-react';
import Seal from '../components/Seal';
import CollegeEmblem from '../components/CollegeEmblem';
import StudentAvatar from '../components/StudentAvatar';

const EASE = [0.22, 1, 0.36, 1];
const Stage = ({ children }) => <div className="relative w-full h-full">{children}</div>;
const Box = ({ x, y, w, h, on = true, dark = false, children, className = '' }) => (
  <motion.div className={`absolute rounded-2xl border ${dark ? 'bg-ink text-white border-ink' : 'bg-white border-fog'} ${className}`}
    style={{ left: x, top: y, width: w, height: h }} initial={false}
    animate={{ opacity: on ? 1 : (dark ? 0 : 0.16), scale: on ? 1 : 0.985 }} transition={{ duration: 0.7, ease: EASE }}>{children}</motion.div>
);
const Line = ({ d, on, color = '#0F1217', dash }) => (
  <motion.path d={d} stroke={color} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash}
    initial={false} animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }} transition={{ duration: 0.9, ease: 'easeInOut' }} />
);

/* ───────────── 1 · THE PROBLEM ───────────── */
const COLLEGES = ['MIT Pune', 'RV College', 'SSN College', 'VJTI Mumbai', 'CBIT Hyderabad', 'COEP Pune'];
export function SceneBriefProblem({ beat }) {
  return (
    <Stage>
      <AnimatePresence mode="wait">
        {beat === 0 && (
          <motion.div key="b0" className="absolute inset-0" exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <svg className="absolute inset-0" width="1120" height="470" viewBox="0 0 1120 470" fill="none">
              {COLLEGES.map((_, i) => {
                const y = 40 + i * 78;
                return <Line key={i} d={`M 250 ${y + 26} C 480 ${y + 26}, 560 235, 790 235`} on color="#98A2B3" dash="3 9" />;
              })}
            </svg>
            <div className="absolute left-0 top-0 w-[250px] space-y-[14px] pt-[14px]">
              {COLLEGES.map((c, i) => (
                <motion.div key={c} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.12, duration: 0.6, ease: EASE }}
                  className="h-[64px] rounded-2xl bg-white border border-fog flex items-center gap-3 px-3.5">
                  <CollegeEmblem name={c} size={34} /><div className="font-display text-[17px] leading-tight">{c}</div>
                  <div className="ml-auto text-[13px] text-slate">a total</div>
                </motion.div>
              ))}
            </div>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.0, type: 'spring', stiffness: 200, damping: 18 }}
              className="absolute right-0 top-[130px] w-[300px] h-[210px] rounded-3xl bg-ink text-white flex flex-col items-center justify-center">
              <Landmark size={40} /><div className="font-display text-[30px] mt-3">AICTE</div><div className="text-white/60 text-[14px]">receives numbers</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2.2, type: 'spring', stiffness: 300, damping: 14 }}
              className="absolute left-[520px] top-[160px] w-[88px] h-[88px] rounded-full bg-crimson text-white font-display flex items-center justify-center text-[52px] shadow-xl">?</motion.div>
          </motion.div>
        )}
        {beat === 1 && (
          <motion.div key="b1" className="absolute inset-0 flex items-center justify-center gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {[
              [Users, 'Double seats', 'One student holds seats in two colleges.', 'seal'],
              [Ghost, 'Ghost seats', 'Seats filled by students who never joined.', 'ghost'],
              [BarChart3, 'Over the limit', 'More students than approved seats.', 'bar'],
            ].map(([Icon, t, s, kind], i) => (
              <motion.div key={t} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.9, duration: 0.8, ease: EASE }}
                className="w-[330px] h-[330px] rounded-3xl bg-white border border-fog p-7 flex flex-col">
                <div className="h-[130px] flex items-center justify-center">
                  {kind === 'seal' && (<div className="flex items-center gap-3"><Seal token="STU-AXECI4H4VCDL6" size={78} /><span className="font-display text-[34px] text-crimson">=</span><Seal token="STU-AXECI4H4VCDL6" size={78} /></div>)}
                  {kind === 'ghost' && (<motion.div animate={{ opacity: [1, 0.25, 1] }} transition={{ duration: 2.4, repeat: Infinity }}><StudentAvatar persona="meera" size={96} /></motion.div>)}
                  {kind === 'bar' && (
                    <svg width="190" height="110" viewBox="0 0 190 110"><line x1="0" y1="45" x2="190" y2="45" stroke="#C0153F" strokeWidth="2.4" strokeDasharray="6 6" />
                      {[0, 1, 2].map((k) => <motion.rect key={k} x={14 + k * 62} width="42" rx="6" fill={k === 2 ? '#C0153F' : '#0F1217'} initial={{ y: 108, height: 0 }}
                        animate={{ y: 108 - (k === 2 ? 98 : 62), height: k === 2 ? 98 : 62 }} transition={{ delay: 0.8 + i * 0.9 + k * 0.15, duration: 0.8 }} />)}
                    </svg>)}
                </div>
                <div className="flex items-center gap-2 mt-auto"><Icon size={20} className="text-crimson" /><h3 className="font-display text-[26px]">{t}</h3></div>
                <p className="mt-2 text-[16.5px] text-[#4A5160] leading-snug">{s}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
        {beat === 2 && (
          <motion.div key="b2" className="absolute inset-0 flex items-center justify-center gap-14" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="relative w-[330px] h-[330px] rounded-3xl bg-white border-2 border-crimson/40 p-6 overflow-hidden">
              <div className="flex items-center gap-2 text-crimson font-medium"><Database size={22} /> One central database</div>
              <div className="mt-5 space-y-2.5">
                {['Asha K. · 9876 •••• 3001', 'Ravi M. · 4821 •••• 5519', 'Meera P. · 7745 •••• 8816', 'Imran S. · 3092 •••• 6670', 'Divya R. · 5160 •••• 2043'].map((r, i) => (
                  <motion.div key={r} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.15 }}
                    className="rounded-xl bg-paper px-3.5 py-2.5 text-[15px] text-[#3A4150]">{r}</motion.div>
                ))}
              </div>
              <motion.div className="absolute left-0 right-0 h-[3px] bg-crimson shadow-[0_0_18px_rgba(192,21,63,0.8)]" initial={{ top: 40 }} animate={{ top: [40, 320, 40] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }} />
              <div className="absolute bottom-3 left-6 text-[12.5px] text-slate">illustration, not real data</div>
            </div>
            <div className="w-[470px] space-y-5">
              {[[Scale, '20 July 2026', 'The Supreme Court ordered an opt-out in the APAAR consent form.'],
                [Lock, 'Up to Rs 250 crore', 'Maximum DPDP Act penalty for failing to protect personal data.']].map(([Icon, h, t], i) => (
                <motion.div key={h} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 + i * 1.2, duration: 0.8, ease: EASE }}
                  className="rounded-3xl bg-ink text-white p-6 flex gap-4"><Icon size={28} className="shrink-0 mt-1" />
                  <div><div className="font-display text-[26px]">{h}</div><div className="text-white/70 text-[16px] mt-1">{t}</div></div></motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Stage>
  );
}

/* ───────────── 2 · THE WORKFLOW (architecture) ───────────── */
export function SceneBriefArch({ beat }) {
  const ARROW = '#0F1217';
  const Tag = ({ children }) => <span className="inline-block rounded-full bg-paper px-2.5 py-1 text-[13px] text-[#3A4150] border border-fog">{children}</span>;
  return (
    <Stage>
      <svg className="absolute inset-0 pointer-events-none" width="1120" height="470" viewBox="0 0 1120 470" fill="none">
        <Line d="M 150 140 H 215" on={beat >= 0} color={ARROW} />
        <Line d="M 505 140 H 585" on={beat >= 1} color={ARROW} />
        <Line d="M 775 140 H 835" on={beat >= 2} color={ARROW} />
        <Line d="M 680 210 V 300" on={beat >= 3} color={ARROW} />
        <Line d="M 980 210 V 300" on={beat >= 3} color={ARROW} />
        {/* privacy boundary */}
        <motion.line x1="540" y1="12" x2="540" y2="262" stroke="#C0153F" strokeWidth="2.6" strokeDasharray="7 7" initial={false} animate={{ opacity: beat >= 1 ? 1 : 0 }} transition={{ duration: 0.8 }} />
      </svg>
      <motion.div className="absolute text-crimson text-[13.5px] font-medium bg-white px-2.5 py-1 rounded-full border border-crimson/30" style={{ left: 396, top: 270 }}
        initial={false} animate={{ opacity: beat >= 1 ? 1 : 0, y: beat >= 1 ? 0 : 8 }} transition={{ duration: 0.7, delay: 0.3 }}>
        No names. No IDs cross this line.
      </motion.div>

      <Box x={0} y={90} w={150} h={100} on className="flex flex-col items-center justify-center">
        <CollegeEmblem name="MIT Pune" size={34} /><div className="font-display text-[19px] mt-1.5">College</div><div className="text-[12.5px] text-slate">holds the real IDs</div>
      </Box>

      <Box x={215} y={10} w={290} h={250} on={beat >= 0} className="p-5">
        <div className="font-display text-[21px] flex items-center gap-2"><ShieldCheck size={20} className="text-crimson" /> SAKSHI gateway</div>
        <div className="mt-4 space-y-2.5">
          {[[Fingerprint, 'Check the ID once', 'mock APAAR registry'], [KeyRound, 'Make a seal', 'keyed hash, one-way'], [EyeOff, 'Forget the ID', 'never stored, never logged']].map(([Icon, t, s], i) => (
            <motion.div key={t} initial={false} animate={{ opacity: beat >= 0 ? 1 : 0, x: beat >= 0 ? 0 : -10 }} transition={{ delay: 0.5 + i * 0.5, duration: 0.6 }}
              className="flex items-center gap-3 rounded-xl bg-paper px-3 py-2.5">
              <span className="w-8 h-8 rounded-full bg-white border border-fog flex items-center justify-center"><Icon size={16} /></span>
              <span><span className="block text-[14.5px] font-medium leading-tight">{t}</span><span className="block text-[12px] text-slate">{s}</span></span>
            </motion.div>
          ))}
        </div>
      </Box>

      <Box x={585} y={60} w={190} h={150} on={beat >= 1} dark className="p-5 flex flex-col">
        <div className="font-display text-[20px]">AICTE seal ledger</div>
        <div className="text-white/65 text-[13.5px] mt-1">seals and seat details only</div>
        <div className="mt-auto flex gap-1.5">{['S1', 'S2', 'S3', 'S4'].map((t) => <Seal key={t} token={t} size={34} />)}</div>
      </Box>

      <Box x={835} y={40} w={285} h={170} on={beat >= 2} className="p-5">
        <div className="font-display text-[20px]">Six rules</div>
        <div className="text-[13px] text-slate">deterministic, every flag explained</div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['R1 double seat', 'R2 same college', 'R3 over intake', 'R4 upload burst', 'R5 low verified', 'R6 identical rows'].map((r, i) => (
            <motion.span key={r} initial={false} animate={{ opacity: beat >= 2 ? 1 : 0, scale: beat >= 2 ? 1 : 0.6 }} transition={{ delay: 0.4 + i * 0.2, type: 'spring', stiffness: 300, damping: 18 }}>
              <Tag>{r}</Tag></motion.span>
          ))}
        </div>
      </Box>

      {[[Landmark, 'Officer dashboard', 'flags, scores, replay'], [Mail, 'Ask the owner', 'inquiry to both colleges'], [UserCheck, 'Student window', '“This is not me”'], [QrCode, 'Credential QR', 'employer verifies']].map(([Icon, t, s], i) => (
        <Box key={t} x={215 + i * 227} y={300} w={212} h={88} on={beat >= 3} className="px-4 flex items-center gap-3">
          <Icon size={22} className="text-crimson shrink-0" /><div><div className="font-display text-[17px] leading-tight">{t}</div><div className="text-[12.5px] text-slate">{s}</div></div>
        </Box>
      ))}

      <Box x={0} y={415} w={1120} h={52} on={beat >= 3} dark className="flex items-center justify-center gap-3 overflow-hidden">
        <ScrollText size={19} /><span className="font-display text-[17px]">Tamper-evident audit chain: every upload, inquiry and credential is logged, and any edit would break the chain</span>
        {beat >= 3 && <motion.span className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/25 to-transparent" initial={{ left: '-10%' }} animate={{ left: '110%' }} transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }} />}
      </Box>
      <Box x={0} y={215} w={150} h={46} on={beat >= 0} className="flex items-center justify-center text-[12.5px] text-slate text-center leading-tight px-2">prototype uses a<br />mock registry</Box>
    </Stage>
  );
}

/* ───────────── 3 · THE CORE INNOVATION ───────────── */
export function SceneBriefInnov({ beat }) {
  return (
    <Stage>
      <AnimatePresence mode="wait">
        {beat === 0 && (
          <motion.div key="i0" className="absolute inset-0 flex items-center justify-center gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="rounded-2xl bg-white border border-fog px-6 py-5 font-display text-[28px] tabular-nums">4821 7730 5519</div>
            <motion.svg width="90" height="20" viewBox="0 0 90 20"><Line d="M 2 10 H 80 M 70 2 L 82 10 L 70 18" on color="#0F1217" /></motion.svg>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, type: 'spring' }} className="w-[120px] h-[120px] rounded-3xl bg-ink text-white flex flex-col items-center justify-center">
              <KeyRound size={34} /><div className="text-[13px] mt-1.5">secret key</div></motion.div>
            <motion.svg width="90" height="20" viewBox="0 0 90 20"><Line d="M 2 10 H 80 M 70 2 L 82 10 L 70 18" on color="#0F1217" /></motion.svg>
            <div className="flex flex-col gap-4">
              {['College A', 'College B'].map((c, i) => (
                <motion.div key={c} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.6 + i * 0.5 }}
                  className="rounded-2xl bg-white border border-crimson/40 px-4 py-3 flex items-center gap-3"><Seal token="STU-AXECI4H4VCDL6" size={54} /><div><div className="font-display text-[18px]">{c}</div><div className="text-slate text-[13px]">same seal</div></div></motion.div>
              ))}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.4 }} className="flex items-center gap-2 text-[15px] text-crimson font-medium">
                <span className="w-6 h-6 rounded-full bg-crimson text-white flex items-center justify-center"><X size={14} strokeWidth={3} /></span> cannot be turned back into the ID</motion.div>
            </div>
          </motion.div>
        )}
        {beat === 1 && (
          <motion.div key="i1" className="absolute inset-0 flex items-center justify-center gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {[['Verified at source', 'APAAR ID checked', '#12805C', false], ['Attested by college', 'Opted out of APAAR', '#92400E', true], ['Pending', 'Awaiting confirmation', '#667085', false]].map(([t, s, c, hl], i) => (
              <motion.div key={t} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.4, duration: 0.7, ease: EASE }}
                className={`w-[300px] rounded-3xl bg-white p-7 border ${hl ? 'border-2' : 'border-fog'}`} style={hl ? { borderColor: c } : {}}>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: c }} /><h3 className="font-display text-[24px]">{t}</h3></div>
                <p className="mt-2 text-[15.5px] text-slate">{s}</p>
                <div className="mt-6 flex items-center gap-2 text-[15px] text-jade font-medium"><Check size={17} strokeWidth={3} /> Counted</div>
                <div className="mt-2 flex items-center gap-2 text-[15px] text-jade font-medium"><Check size={17} strokeWidth={3} /> Never treated as fraud</div>
                {hl && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="mt-5 flex items-center gap-3"><StudentAvatar persona="asha" size={44} /><span className="text-[14px] text-[#3A4150]">Asha lives here</span></motion.div>}
              </motion.div>
            ))}
          </motion.div>
        )}
        {beat === 2 && (
          <motion.div key="i2" className="absolute inset-0 flex flex-col items-center justify-center gap-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center gap-8">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-2xl bg-ink text-white px-6 py-4 font-display text-[22px]">AICTE</motion.div>
              {[0, 1].map((k) => (
                <motion.div key={k} className="text-ink" initial={{ x: 0, opacity: 0 }} animate={{ x: [0, 90], opacity: [0, 1, 1, 0] }} transition={{ delay: 0.5 + k * 0.4, duration: 1.8, repeat: Infinity, repeatDelay: 1.4 }}><Mail size={28} /></motion.div>
              ))}
              <div className="flex gap-4">{['College A', 'College B'].map((c) => <div key={c} className="rounded-2xl bg-white border border-fog px-5 py-4 font-display text-[19px]">{c}</div>)}</div>
            </div>
            <div className="flex gap-5">
              {[[Fingerprint, 'Blind seals'], [UserCheck, 'Opt-out safe'], [Mail, 'Ask the owner'], [QrCode, 'Signed QR credentials'], [ScrollText, 'Tamper-evident log']].map(([Icon, t], i) => (
                <motion.div key={t} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 + i * 0.35, duration: 0.7, ease: EASE }}
                  className="w-[190px] rounded-2xl bg-white border border-fog p-4 text-center"><Icon size={26} className="mx-auto text-crimson" /><div className="font-display text-[18px] mt-2 leading-tight">{t}</div></motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Stage>
  );
}

export const BRIEFING = [
  { id: 'problem', label: 'The problem', Scene: SceneBriefProblem, beats: [
    { ms: 10000, line: 'AICTE gets totals, not proof.', sub: 'Colleges report how many students they admitted. Nobody can see who is behind the number.' },
    { ms: 11000, line: 'Three things slip through.', sub: 'Double seats. Ghost seats. More students than approved seats.' },
    { ms: 10500, line: 'The usual fix is risky.', sub: 'One database of every student’s identity. Families can now refuse, and leaks carry heavy penalties.' },
  ] },
  { id: 'workflow', label: 'The workflow', Scene: SceneBriefArch, beats: [
    { ms: 9500, line: 'A college uploads its list.', sub: 'Each ID is checked once, turned into a seal, and forgotten.' },
    { ms: 9500, line: 'AICTE stores only seals.', sub: 'No names. No IDs. Just seals and seat details.' },
    { ms: 9500, line: 'Six rules look for problems.', sub: 'Every flag comes with a reason in plain words.' },
    { ms: 10000, line: 'People decide. Everything is logged.', sub: 'Officers, students and employers each get a simple view.' },
  ] },
  { id: 'innovation', label: 'The innovation', Scene: SceneBriefInnov, beats: [
    { ms: 9000, line: 'Blind seals.', sub: 'The same student gets the same seal in every college. The seal cannot be turned back into the ID.' },
    { ms: 8000, line: 'Opt-out safe.', sub: 'Students without an APAAR ID are counted, and never flagged.' },
    { ms: 8500, line: 'Ask the owner.', sub: 'AICTE asks the colleges that hold the data, instead of opening a central database.' },
  ] },
];
