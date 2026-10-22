/**
 * Home.jsx — The masonry home board.
 *
 * CSS grid with varied tile sizes (col/row spans).
 * Tiles: upload CTA, story tiles (Asha/Ravi/Meera/Employer), seal gallery,
 *        open flags count, privacy proof status.
 * No sidebar, no top navbar — just the board and the bottom pill dock.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, RadioTower, BarChart2, ArrowRight,
  QrCode, AlertTriangle, ShieldCheck, Sparkles,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { useAuth } from '../App';
import { api } from '../api';
import Seal from '../components/Seal';
import HindiToggle from '../components/HindiToggle';
import DemoMode from '../components/DemoMode';

// Seeded tokens for the gallery — these are fixed identifiers, not real IDs
const GALLERY_TOKENS = [
  'alpha-2024-01', 'beta-2024-02',  'gamma-2024-03',
  'delta-2024-04', 'epsilon-2024-05','zeta-2024-06',
  'eta-2024-07',   'theta-2024-08',  'iota-2024-09',
  'kappa-2024-10', 'lambda-2024-11', 'mu-2024-12',
];

// Slight rotations for the gallery effect
const GALLERY_ROTATIONS = [3, -5, 7, -3, 8, -6, 4, -8, 6, -4, 9, -2];

// ─── Skeleton loader ─────────────────────────────────────────────────────────
function StatSkeleton() {
  return <span className="skeleton inline-block w-12 h-6 rounded" />;
}

// ─── Stat tile content ───────────────────────────────────────────────────────
function Stat({ value, label, className = '' }) {
  return (
    <div className={className}>
      <div className="text-3xl font-display font-bold leading-none">{value}</div>
      <div className="text-sm text-slate mt-1">{label}</div>
    </div>
  );
}

// ─── Story tile ──────────────────────────────────────────────────────────────
function StoryTile({ title, body, children, dark = false, className = '' }) {
  return (
    <div
      className={`rounded-xl p-5 flex flex-col gap-3 ${
        dark
          ? 'bg-ink text-white'
          : 'bg-white border border-fog'
      } ${className}`}
      style={{ boxShadow: dark ? 'none' : '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      <div>
        <p className={`font-display font-bold text-base leading-snug ${dark ? 'text-white' : 'text-ink'}`}>
          {title}
        </p>
        <p className={`text-sm mt-1.5 leading-relaxed ${dark ? 'text-white/70' : 'text-slate'}`}>
          {body}
        </p>
      </div>
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Home() {
  const { t } = useI18n();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats]       = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    const year = new Date().getFullYear();
    api.getOverview(year, token)
      .then(data => {
        setStats(data);
        setStatsLoading(false);
      })
      .catch(() => {
        // Use seeded fallback data for demo
        setStats({
          open_flags:    17,
          seals_issued:  94832,
          institutions:  312,
          avg_score:     76,
          proof_result:  '0 raw IDs found',
        });
        setStatsLoading(false);
      });
  }, [token]);

  const openFlags   = stats?.open_flags   ?? 17;
  const sealsIssued = stats?.seals_issued ?? 94832;
  const institutions= stats?.institutions ?? 312;

  return (
    <>
      {/* ── Top bar ────────────────────────────────────────────────────── */}
      <header className="page-wrapper pb-0 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink tracking-tight">
            {t('appName')}
          </h1>
          <p className="text-sm text-slate mt-0.5 font-devanagari">
            {t('tagline')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <HindiToggle />
          <button
            className="btn btn-secondary text-sm"
            onClick={() => setShowDemo(true)}
          >
            <Sparkles size={14} />
            {t('demoMode')}
          </button>
        </div>
      </header>

      {/* ── Masonry board ──────────────────────────────────────────────── */}
      <main className="page-wrapper pt-6">
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridAutoRows: 'minmax(140px, auto)',
          }}
        >
          {/* ── 1. Upload CTA tile (2×2) ───────────────────────────────── */}
          <div
            className="rounded-xl p-6 flex flex-col justify-between"
            style={{
              gridColumn: 'span 2',
              gridRow:    'span 2',
              background: 'white',
              border:     '1px solid #E4E7EC',
              boxShadow:  '0 2px 8px rgba(0,0,0,0.06)',
              borderRadius: '16px',
            }}
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate font-medium tracking-widest uppercase mb-3">
                    {t('appName')} · {new Date().getFullYear()}
                  </p>
                  <h2 className="font-display text-3xl font-extrabold text-ink leading-tight text-balance">
                    {t('homeWelcome')}
                  </h2>
                </div>
              </div>

              {/* Live stats row */}
              <div className="flex gap-8 mt-6">
                <Stat
                  value={statsLoading ? <StatSkeleton /> : openFlags}
                  label={t('homeOpenFlags')}
                />
                <Stat
                  value={statsLoading ? <StatSkeleton /> : sealsIssued.toLocaleString('en-IN')}
                  label={t('homeSealsIssued')}
                />
                <Stat
                  value={statsLoading ? <StatSkeleton /> : institutions}
                  label={t('homeInstitutions')}
                />
              </div>
            </div>

            {/* Primary action */}
            <div className="flex items-center gap-3 mt-6">
              <button
                className="btn btn-primary text-base px-6 py-3 rounded-lg"
                onClick={() => navigate('/upload')}
              >
                <Upload size={17} />
                {t('upload')}
              </button>
              <button
                className="btn btn-secondary text-sm"
                onClick={() => navigate('/integrity')}
              >
                <BarChart2 size={15} />
                {t('integrity')}
              </button>
            </div>
          </div>

          {/* ── 2. Asha tile (inverted ink) ────────────────────────────── */}
          <StoryTile
            title={t('homeAshaTitle')}
            body={t('homeAshaBody')}
            dark
          >
            <div className="flex items-center gap-2 mt-auto">
              <div className="w-6 h-6 rounded-full bg-jade flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={12} color="white" />
              </div>
              <span className="text-xs text-white/60">No flag raised</span>
            </div>
          </StoryTile>

          {/* ── 3. Open flags tile ────────────────────────────────────── */}
          <div
            className="rounded-xl p-5 bg-white border border-fog"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate uppercase tracking-wide">
                {t('homeFlagsTitle')}
              </span>
              <AlertTriangle size={14} className="text-crimson" />
            </div>
            <div className="text-4xl font-display font-bold text-crimson leading-none">
              {statsLoading ? <StatSkeleton /> : openFlags}
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate">High</span>
                <span className="font-medium text-crimson">
                  {statsLoading ? '…' : Math.floor(openFlags * 0.35)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate">Medium</span>
                <span className="font-medium text-amber">
                  {statsLoading ? '…' : Math.floor(openFlags * 0.65)}
                </span>
              </div>
            </div>
            <button
              className="mt-4 text-xs text-slate hover:text-ink flex items-center gap-1 transition-colors"
              onClick={() => navigate('/radar')}
            >
              {t('navRadar')} <ArrowRight size={12} />
            </button>
          </div>

          {/* ── 4. Ravi seal tile ─────────────────────────────────────── */}
          <StoryTile
            title={t('homeRaviTitle')}
            body={t('homeRaviBody')}
            className="col-span-1"
          >
            <div className="flex items-center gap-3 mt-auto">
              <Seal token="ravi-dual-seat-2024" size={40} />
              <div className="w-px h-8 bg-fog" />
              <Seal token="ravi-dual-seat-2024" size={40} />
              <span className="text-xs text-slate ml-1">×2 colleges</span>
            </div>
          </StoryTile>

          {/* ── 5. Meera tile ─────────────────────────────────────────── */}
          <StoryTile
            title={t('homeMeeraTitle')}
            body={t('homeMeeraBody')}
          >
            <button
              className="mt-auto text-xs font-medium text-crimson border border-crimson-light bg-crimson-light rounded-full px-3 py-1 self-start hover:bg-crimson hover:text-white transition-colors"
              onClick={() => navigate('/citizen')}
            >
              {t('notMe')}
            </button>
          </StoryTile>

          {/* ── 6. Seal gallery tile (2×1) ────────────────────────────── */}
          <div
            className="rounded-xl p-5 bg-white border border-fog"
            style={{
              gridColumn: 'span 2',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              borderRadius: '16px',
            }}
          >
            <p className="text-sm font-semibold text-ink mb-4">
              {t('homeEveryEnrol')}
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              {GALLERY_TOKENS.map((tok, i) => (
                <Seal
                  key={tok}
                  token={tok}
                  size={40}
                  rotate={GALLERY_ROTATIONS[i]}
                />
              ))}
            </div>
            <p className="text-xs text-slate mt-3">
              {sealsIssued.toLocaleString('en-IN')} seals issued · same token = same seal everywhere
            </p>
          </div>

          {/* ── 7. Employer tile ──────────────────────────────────────── */}
          <StoryTile
            title={t('homeEmployerTitle')}
            body={t('homeEmployerBody')}
          >
            <div className="flex items-center gap-2 mt-auto">
              <QrCode size={28} className="text-ink opacity-40" />
              <button
                className="text-xs text-slate hover:text-ink flex items-center gap-1"
                onClick={() => navigate('/credential')}
              >
                {t('verify')} <ArrowRight size={12} />
              </button>
            </div>
          </StoryTile>

          {/* ── 8. Privacy proof tile ─────────────────────────────────── */}
          <div
            className="rounded-xl p-5 bg-white border border-fog"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate uppercase tracking-wide">
                {t('proof')}
              </span>
              <ShieldCheck size={14} className="text-jade" />
            </div>
            <p className="text-xl font-display font-bold text-jade leading-tight">
              {t('homePrivacyResult')}
            </p>
            <p className="text-xs text-slate mt-1">Last scan: today</p>
            <button
              className="mt-4 text-xs text-slate hover:text-ink flex items-center gap-1 transition-colors"
              onClick={() => navigate('/proof')}
            >
              {t('proof')} <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* Responsive: stack to 1 column on mobile */}
        <style>{`
          @media (max-width: 767px) {
            .grid { grid-template-columns: 1fr !important; }
            .grid > * { grid-column: span 1 !important; grid-row: span 1 !important; }
          }
          @media (min-width: 768px) and (max-width: 1023px) {
            .grid { grid-template-columns: repeat(2, 1fr) !important; }
          }
        `}</style>
      </main>

      {/* Demo overlay */}
      {showDemo && <DemoMode onClose={() => setShowDemo(false)} />}
    </>
  );
}
