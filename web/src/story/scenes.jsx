/**
 * scenes.jsx — the animated scenes of the SAKSHI story.
 * Every scene gets `beat` (0,1,2…) and draws itself for that beat. Scenes only animate;
 * the player decides when the beat changes.
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Check, ShieldCheck, Mail, Lock, Search } from 'lucide-react';
import Seal from '../components/Seal';
import Wordmark from '../components/Wordmark';
import StudentAvatar from '../components/StudentAvatar';
import CollegeEmblem from '../components/CollegeEmblem';
import SuccessBurst from '../components/SuccessBurst';

const EASE = [0.22, 1, 0.36, 1];
const T = { ASHA: 'STU-ZRQO3SOOJFVMO', RAVI: 'STU-AXECI4H4VCDL6', MEERA: 'STU-7RB5JFZR54FMI' };

/* count-up number */
function useCount(target, run, ms = 1800) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) { setN(0); return undefined; }
    let raf; const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / ms);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, ms]);
  return n;
}

const Stage = ({ children, className = '' }) => (
  <div className={`relative w-full h-full flex items-center justify-center ${className}`}>{children}</div>
);

/* ═════════ 0 · THE PROBLEM ═════════ */
export function SceneProblem({ beat }) {
  const count = useCount(240, true, 2600);
  const dots = Array.from({ length: 240 }, (_, i) => i);
  const unknown = new Set(dots.filter((i) => (i * 37) % 7 < 5));
  return (
    <Stage>
      <AnimatePresence mode="wait">
        {beat < 2 ? (
          <motion.div key="dots" className="flex flex-col items-center" exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.5 }}>
            <div className="font-display text-ink leading-none tabular-nums" style={{ fontSize: 132, fontWeight: 800, letterSpacing: '-0.05em' }}>{count}</div>
            <div className="text-slate text-[17px] mt-2 mb-8">seats reported by one college (example)</div>
            <div className="grid gap-[7px]" style={{ gridTemplateColumns: 'repeat(24, 14px)' }}>
              {dots.map((i) => (
                <motion.span
                  key={i}
                  className="w-[14px] h-[14px] rounded-full flex items-center justify-center text-[9px] font-semibold"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={beat === 0
                    ? { scale: 1, opacity: 1, backgroundColor: '#0F1217', color: '#0F1217' }
                    : { scale: 1, opacity: 1, backgroundColor: unknown.has(i) ? '#E4E7EC' : '#0F1217', color: '#667085' }}
                  transition={beat === 0 ? { delay: i * 0.008, duration: 0.3 } : { delay: (i % 24) * 0.012, duration: 0.5 }}
                >
                  {beat === 1 && unknown.has(i) && i % 5 === 0 ? '?' : ''}
                </motion.span>
              ))}
            </div>
            <div className="h-9 mt-7">
              <AnimatePresence>
                {beat === 1 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.7 }}
                    className="inline-flex items-center gap-2 bg-white border border-fog rounded-full px-4 py-1.5 text-[15px]">
                    <Lock size={15} className="text-crimson" /> Collecting every identity is a risk
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div key="brand" className="flex flex-col items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <motion.div initial={{ scale: 3.2, opacity: 0, rotate: -30 }} animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 160, damping: 15, delay: 0.2 }}>
              <Seal token="SAKSHI-WITNESS" size={160} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.7, ease: EASE }}
              className="font-display mt-6 text-ink" style={{ fontSize: 76, fontWeight: 800, letterSpacing: '0.04em' }}>SAKSHI</motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 0.8 }} className="text-slate text-[19px] mt-1">
              साक्षी · the witness
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Stage>
  );
}

/* ═════════ 1 · HOW IT WORKS ═════════ */
export function SceneHow({ beat }) {
  // x positions of the traveller along the pipeline (0 college, 1 gate, 2 vault)
  const stageX = beat === 0 ? 0 : beat === 1 ? 1 : 2;
  const Box = ({ title, sub, children, highlight }) => (
    <div className={`w-[250px] h-[230px] rounded-3xl border p-5 flex flex-col items-center justify-between transition-colors duration-500 ${highlight ? 'bg-white border-ink shadow-[0_24px_50px_-24px_rgba(15,18,23,0.45)]' : 'bg-white/70 border-fog'}`}>
      <div className="text-center"><div className="font-display text-[20px]">{title}</div><div className="text-slate text-[13.5px] mt-0.5">{sub}</div></div>
      <div className="flex-1 flex items-center justify-center">{children}</div>
    </div>
  );
  return (
    <Stage>
      <div className="flex items-center gap-10 relative">
        <Box title="College" sub="has the real ID" highlight={beat === 0}>
          <div className="space-y-2">
            {['4821 7730 5519', '3092 1184 6670'].map((id, i) => (
              <motion.div key={id} animate={beat >= 1 && i === 0 ? { opacity: 0.25 } : { opacity: 1 }}
                className="font-display tabular-nums text-[19px] bg-paper rounded-xl px-4 py-2">{id}</motion.div>
            ))}
          </div>
        </Box>
        <Arrow active={beat >= 0} />
        <Box title="SAKSHI gateway" sub="checks once, in memory" highlight={beat === 1}>
          <AnimatePresence mode="wait">
            {beat === 0 && <motion.div key="a" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-slate text-[14px] text-center">waiting for the list</motion.div>}
            {beat === 1 && (
              <motion.div key="b" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: 'spring', stiffness: 400, damping: 18 }}
                  className="w-11 h-11 rounded-full bg-jade text-white flex items-center justify-center"><Check size={22} strokeWidth={3} /></motion.div>
                <div className="text-[14px] text-ink">ID is real ✓</div>
                <motion.div initial={{ scale: 2.5, opacity: 0, rotate: -25 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ delay: 1.7, type: 'spring', stiffness: 220, damping: 16 }}>
                  <Seal token={T.RAVI} size={52} />
                </motion.div>
              </motion.div>
            )}
            {beat === 2 && (
              <motion.div key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                <div className="font-display tabular-nums text-[19px] text-slate line-through decoration-crimson decoration-2">4821 7730 5519</div>
                <div className="text-crimson text-[14px] mt-2 font-medium">forgotten</div>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
        <Arrow active={beat >= 1} />
        <Box title="AICTE" sub="keeps only seals" highlight={beat === 2}>
          <div className="grid grid-cols-3 gap-2">
            {['S1', 'S2', 'S3', 'S4', 'S5', T.RAVI].map((tk, i) => (
              <motion.div key={tk} initial={{ opacity: 0.0, scale: 0.4 }}
                animate={i < 5 ? { opacity: 1, scale: 1 } : { opacity: beat >= 1 ? 1 : 0, scale: beat >= 1 ? 1 : 0.4 }}
                transition={{ delay: i < 5 ? 0.1 * i : 0.2, duration: 0.5, ease: EASE }}>
                <Seal token={tk} size={48} />
              </motion.div>
            ))}
          </div>
        </Box>
      </div>
    </Stage>
  );
}
const Arrow = ({ active }) => (
  <svg width="70" height="20" viewBox="0 0 70 20" className="overflow-visible">
    <motion.path d="M2 10 H62 M52 2 L64 10 L52 18" stroke="#0F1217" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round"
      initial={{ pathLength: 0 }} animate={{ pathLength: active ? 1 : 0 }} transition={{ duration: 0.7, ease: 'easeInOut' }} />
  </svg>
);

/* ═════════ 2 · ASHA ═════════ */
export function SceneAsha({ beat }) {
  return (
    <Stage>
      <div className="flex items-center gap-14">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: EASE }} className="flex flex-col items-center">
          <div className="rounded-full p-2 bg-white border border-fog shadow-lg"><StudentAvatar persona="asha" size={170} /></div>
          <div className="font-display text-[30px] mt-5">Asha</div>
          <div className="mt-2 inline-flex items-center gap-2 bg-white border border-fog rounded-full px-3.5 py-1.5 text-[14px]">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Chose not to create an APAAR ID
          </div>
        </motion.div>

        <div className="w-[440px]">
          <div className="rounded-3xl bg-white border border-fog p-6 shadow-[0_24px_50px_-28px_rgba(15,18,23,0.4)]">
            <div className="flex items-center gap-3 pb-4 border-b border-fog">
              <CollegeEmblem name="MIT Pune" size={36} />
              <div><div className="font-display text-[19px]">MIT Pune</div><div className="text-slate text-[13.5px]">B.Tech CSE · 2026</div></div>
            </div>
            <div className="min-h-[128px] pt-4">
              <AnimatePresence>
                {beat >= 1 && (
                  <motion.div key="row" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}
                    className="flex items-center justify-between rounded-2xl bg-paper px-4 py-3.5">
                    <div className="flex items-center gap-3"><Seal token={T.ASHA} size={46} />
                      <div><div className="text-[15px] font-medium">Student seal</div><div className="text-slate text-[13px]">college-attested ID</div></div></div>
                    <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, type: 'spring' }}
                      className="text-[13px] font-medium px-3 py-1 rounded-full bg-[#FEF3C7] text-[#92400E]">Attested</motion.span>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {beat >= 1 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="mt-4 flex gap-3 text-[14px]">
                    <span className="inline-flex items-center gap-1.5 text-jade font-medium"><Check size={16} strokeWidth={3} /> Seat counted</span>
                    <span className="inline-flex items-center gap-1.5 text-jade font-medium"><Check size={16} strokeWidth={3} /> Flags: 0</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {beat === 2 && (
          <motion.div className="absolute inset-0 flex items-center justify-center bg-paper/80 backdrop-blur-[3px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SuccessBurst tone="jade" title="Counted. Not flagged." sub="Opting out is a right, not a red flag." />
          </motion.div>
        )}
      </AnimatePresence>
    </Stage>
  );
}

/* ═════════ 3 · RAVI ═════════ */
export function SceneRavi({ beat }) {
  const College = ({ name, city, delay }) => (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.7, ease: EASE }}
      className={`w-[290px] rounded-3xl bg-white p-6 border transition-all duration-700 ${beat >= 1 ? 'border-crimson shadow-[0_0_0_6px_rgba(192,21,63,0.08)]' : 'border-fog'}`}>
      <div className="flex items-center gap-3"><CollegeEmblem name={name} size={38} />
        <div><div className="font-display text-[19px]">{name}</div><div className="text-slate text-[13.5px]">{city}</div></div></div>
      <div className="mt-5 rounded-2xl bg-paper py-6 flex flex-col items-center gap-2">
        <motion.div animate={beat >= 1 ? { scale: [1, 1.18, 1.08] } : { scale: 1 }} transition={{ duration: 0.8 }}>
          <Seal token={T.RAVI} size={88} />
        </motion.div>
        <div className="text-slate text-[13px]">Student seal · full-time seat</div>
      </div>
      <AnimatePresence>
        {beat === 2 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
            className="mt-4 inline-flex items-center gap-2 text-[13.5px] text-jade font-medium"><Check size={15} strokeWidth={3} /> Question received</motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
  return (
    <Stage>
      <div className="flex items-center gap-0 relative">
        <College name="MIT Pune" city="Maharashtra" delay={0.1} />
        {/* the middle: link + AICTE */}
        <div className="w-[210px] h-[300px] relative flex flex-col items-center justify-center">
          <svg className="absolute inset-0" width="210" height="300" viewBox="0 0 210 300" fill="none">
            <motion.path d="M0 150 H210" stroke="#C0153F" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: beat >= 1 ? 1 : 0 }} transition={{ duration: 1.1, ease: 'easeInOut' }} />
          </svg>
          <AnimatePresence>
            {beat === 1 && (
              <motion.div key="m" initial={{ scale: 0, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ delay: 0.9, type: 'spring', stiffness: 320, damping: 16 }}
                className="relative z-10 bg-crimson text-white rounded-2xl px-4 py-2.5 text-center shadow-xl">
                <div className="font-display text-[19px]">Same seal</div><div className="text-[12.5px] opacity-80">no name shown</div>
              </motion.div>
            )}
            {beat === 2 && (
              <motion.div key="a" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="relative z-10 bg-ink text-white rounded-2xl px-4 py-2.5 text-center shadow-xl">
                <div className="font-display text-[17px]">AICTE</div><div className="text-[12.5px] opacity-70">asks both colleges</div>
              </motion.div>
            )}
          </AnimatePresence>
          {beat === 2 && [-1, 1].map((d) => (
            <motion.div key={d} className="absolute z-20 text-ink" initial={{ x: 0, opacity: 0, scale: 0.6 }}
              animate={{ x: d * 95, opacity: [0, 1, 1, 0], scale: [0.6, 1, 1, 0.7] }} transition={{ delay: 0.7, duration: 1.4, ease: 'easeInOut' }}>
              <Mail size={26} />
            </motion.div>
          ))}
        </div>
        <College name="RV College" city="Karnataka" delay={0.25} />
      </div>
    </Stage>
  );
}

/* ═════════ 4 · MEERA ═════════ */
export function SceneMeera({ beat }) {
  return (
    <Stage>
      <div className="flex items-center gap-16">
        {/* phone */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}
          className="relative w-[300px] h-[430px] rounded-[44px] bg-ink p-[10px] shadow-[0_40px_80px_-30px_rgba(15,18,23,0.6)]">
          <div className="w-full h-full rounded-[36px] bg-paper overflow-hidden relative p-5">
            <div className="flex items-center gap-3 mt-2"><StudentAvatar persona="meera" size={42} /><div><div className="font-display text-[18px]">Your records</div><div className="text-slate text-[12.5px]">Citizen Window · Meera</div></div></div>
            <div className="mt-5 rounded-2xl bg-white border border-fog p-4">
              <div className="flex items-center gap-3"><Seal token={T.MEERA} size={40} />
                <div><div className="text-[14.5px] font-medium leading-tight">SSN College of Engineering</div><div className="text-slate text-[12.5px]">Chennai · B.Tech · Active seat</div></div></div>
              <div className="mt-3 text-[12.5px] text-crimson">Never joined this college?</div>
              <motion.button
                animate={beat === 1 ? { scale: [1, 0.93, 1], backgroundColor: '#C0153F' } : beat >= 2 ? { backgroundColor: '#12805C' } : {}}
                transition={{ delay: beat === 1 ? 1.4 : 0, duration: 0.35 }}
                className="mt-3 w-full rounded-xl bg-ink text-white py-2.5 text-[14px] font-medium relative overflow-hidden">
                {beat >= 2 ? '✓ Dispute sent' : 'This is not me'}
                {beat === 1 && <motion.span className="absolute inset-0 m-auto w-4 h-4 rounded-full bg-white/60"
                  initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 14], opacity: [0.8, 0] }} transition={{ delay: 1.4, duration: 0.7 }} />}
              </motion.button>
            </div>
            {/* finger */}
            {beat === 1 && (
              <motion.div className="absolute z-10 w-9 h-9 rounded-full bg-ink/80 border-2 border-white shadow-lg"
                initial={{ left: 230, top: 380, opacity: 0 }} animate={{ left: 140, top: 262, opacity: 1 }} transition={{ duration: 1.2, ease: 'easeInOut' }} />
            )}
          </div>
        </motion.div>

        {/* flight path + AICTE queue */}
        <div className="w-[120px] relative h-[2px]">
          {beat >= 2 && (
            <motion.div className="absolute -top-3 text-ink" initial={{ left: -30, opacity: 0 }} animate={{ left: 100, opacity: [0, 1, 1, 0] }} transition={{ duration: 1.2, ease: 'easeInOut' }}>
              <Mail size={28} />
            </motion.div>
          )}
          <svg width="120" height="4" className="absolute top-0"><motion.line x1="0" y1="2" x2="120" y2="2" stroke="#0F1217" strokeWidth="2.4" strokeDasharray="2 8" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: beat >= 2 ? 1 : 0 }} transition={{ duration: 0.8 }} /></svg>
        </div>

        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
          className="w-[360px] rounded-3xl bg-white border border-fog p-6 min-h-[250px]">
          <div className="font-display text-[19px]">AICTE review queue</div>
          <div className="text-slate text-[13.5px]">Open disputes</div>
          <div className="mt-5">
            <AnimatePresence mode="wait">
              {beat < 2 ? (
                <motion.div key="empty" exit={{ opacity: 0 }} className="rounded-2xl bg-paper text-slate text-[14px] py-8 text-center">Nothing waiting</motion.div>
              ) : (
                <motion.div key="item" initial={{ opacity: 0, y: -24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 1.0, type: 'spring', stiffness: 260, damping: 20 }}
                  className="rounded-2xl border border-crimson/40 bg-[#FFF5F7] p-4">
                  <div className="flex items-center justify-between"><span className="text-[13px] font-medium text-crimson">Ghost seat claim · High</span><Seal token={T.MEERA} size={30} /></div>
                  <div className="mt-2 text-[15px]">SSN College, Chennai</div>
                  <div className="text-slate text-[13px]">Raised by the student · logged</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
      <AnimatePresence>
        {beat === 2 && (
          <motion.div className="absolute left-[calc(50%-410px)] top-[8%] hidden" />
        )}
      </AnimatePresence>
    </Stage>
  );
}

/* ═════════ 5 · EMPLOYER ═════════ */
export function SceneEmployer({ beat }) {
  const handle = 'MIT-PUNE-2026-RAVI';
  return (
    <Stage>
      <div className="flex items-center gap-16">
        <motion.div initial={{ opacity: 0, rotate: -3, y: 30 }} animate={{ opacity: 1, rotate: -2, y: 0 }} transition={{ duration: 0.8, ease: EASE }}
          className="relative w-[330px] rounded-3xl bg-white border border-fog p-6 shadow-[0_40px_70px_-34px_rgba(15,18,23,0.5)] overflow-hidden">
          <div className="flex items-center gap-3"><CollegeEmblem name="MIT Pune" size={34} /><div><div className="text-[12.5px] text-slate">Enrolment credential</div><div className="font-display text-[18px] leading-tight">B.Tech CSE · 2026</div></div></div>
          <div className="mt-5 mx-auto w-[190px] h-[190px] rounded-2xl bg-paper flex items-center justify-center relative">
            <QRCodeSVG value={`https://sakshi.demo/verify/${handle}`} size={158} fgColor="#0F1217" bgColor="transparent" />
            {beat === 0 && (
              <motion.div className="absolute left-0 right-0 h-[3px] bg-crimson shadow-[0_0_16px_rgba(192,21,63,0.8)]"
                initial={{ top: 4 }} animate={{ top: [4, 182, 4] }} transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }} />
            )}
          </div>
          <div className="mt-4 flex items-center justify-between text-[13px] text-slate"><span>Signed by AICTE</span><Seal token={T.RAVI} size={30} /></div>
        </motion.div>

        <div className="w-[380px] min-h-[300px] flex items-center">
          <AnimatePresence mode="wait">
            {beat === 0 && (
              <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-slate text-[17px]">
                <div className="flex items-center gap-3"><Search size={20} /> Employer’s phone is scanning…</div>
              </motion.div>
            )}
            {beat === 1 && (
              <motion.div key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                {['Reading the QR', 'Checking the AICTE signature', 'Checking it is not revoked'].map((l, i) => (
                  <motion.div key={l} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 1.3 }}
                    className="flex items-center gap-3 py-2.5 text-[17px]">
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.0 + i * 1.3, type: 'spring', stiffness: 420, damping: 18 }}
                      className="w-6 h-6 rounded-full bg-jade text-white flex items-center justify-center"><Check size={14} strokeWidth={3.4} /></motion.span>{l}
                  </motion.div>
                ))}
              </motion.div>
            )}
            {beat === 2 && (
              <motion.div key="v" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col items-center">
                <SuccessBurst tone="jade" size={104} title="Verified" sub="Enrolled · B.Tech CSE · MIT Pune. No name lookup, and only what Ravi chose to share." />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Stage>
  );
}

/* ═════════ 6 · PROOF ═════════ */
const TABLES = ['institutions', 'programs', 'enrolments', 'consents', 'flags', 'cases', 'credentials', 'audit_log', 'disputes', 'verification_events'];
export function SceneProof({ beat, proof }) {
  const names = proof?.tables?.length ? proof.tables : TABLES;
  const total = proof?.tables_scanned ?? 19;
  const found = proof?.raw_ids_found ?? 0;
  const [scanned, setScanned] = useState(0);
  useEffect(() => {
    if (beat < 0) return undefined;
    setScanned(0);
    const id = setInterval(() => setScanned((s) => (s < total ? s + 1 : s)), 230);
    return () => clearInterval(id);
  }, [beat, total]);
  const done = scanned >= total;
  return (
    <Stage>
      <div className="flex items-center gap-16">
        <div className="w-[360px] rounded-3xl bg-white border border-fog p-6">
          <div className="flex items-center gap-2 font-display text-[19px]"><ShieldCheck size={20} className="text-jade" /> Scanning the database</div>
          <div className="mt-4 space-y-2 h-[260px] overflow-hidden">
            {names.slice(0, Math.min(scanned, 7)).map((t) => (
              <motion.div key={t} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between text-[14.5px] bg-paper rounded-xl px-3.5 py-2.5">
                <span className="text-[#3A4150]">{t}</span><span className="text-jade inline-flex items-center gap-1"><Check size={14} strokeWidth={3} /> clean</span>
              </motion.div>
            ))}
          </div>
          <div className="text-slate text-[13.5px] mt-3 tabular-nums">{Math.min(scanned, total)} of {total} tables checked</div>
        </div>
        <div className="w-[380px] flex flex-col items-center">
          {!done ? (
            <div className="text-slate text-[17px]">Looking for any 12-digit student ID…</div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
              <div className="font-display tabular-nums text-ink leading-none" style={{ fontSize: 150, fontWeight: 800 }}>{found}</div>
              <div className="text-[19px] mt-2 text-[#3A4150]">raw student IDs found</div>
              <SuccessBurst tone="jade" size={72} className="-mt-4 scale-75 origin-top" />
            </motion.div>
          )}
        </div>
      </div>
      {beat === 1 && done && (
        <motion.div className="absolute bottom-0 left-0 right-0 flex justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <Wordmark tagline />
        </motion.div>
      )}
    </Stage>
  );
}
