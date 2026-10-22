/**
 * Upload.jsx — Two-panel upload + sealing animation screen.
 *
 * Left panel (1/3): title, drag-drop zone, what-happens explainer, batch summary.
 * Right panel (2/3): row results table with staggered SealingRow animations.
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload as UploadIcon, FileText, ChevronDown, ChevronUp, Download, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useI18n } from '../i18n';
import { useAuth } from '../App';
import { api } from '../api';
import SealingRow from '../components/SealingRow';
import HindiToggle from '../components/HindiToggle';

// ─── Demo CSV data ────────────────────────────────────────────────────────────

const DEMO_CSV = `id_type,id_value,program_code,cohort_year,mode,seat_category
APAAR,APAAR202400001,CSE,2024,full-time,general
APAAR,APAAR202400002,ECE,2024,full-time,obc
APAAR,APAAR202400003,MECH,2024,part-time,sc
ABC,ABC202400004,CSE,2024,full-time,general
APAAR,APAAR202400005,CIVIL,2024,full-time,st
APAAR,APAAR202400006,IT,2024,full-time,general
APAAR,APAAR202400007,MBA,2024,full-time,obc
APAAR,APAAR202400008,CSE,2024,full-time,general
ABC,ABC202400009,ECE,2024,part-time,general
APAAR,APAAR202400010,CSE,2024,full-time,ews`;

// Deterministic demo results (so demo works without backend)
const DEMO_RESULTS = [
  { row: 1, status: 'accepted', reason: null,              token: 'seal-row-1-cse-2024' },
  { row: 2, status: 'accepted', reason: null,              token: 'seal-row-2-ece-2024' },
  { row: 3, status: 'attested', reason: 'Opted out of APAAR — attested status applied', token: 'seal-row-3-mech-2024' },
  { row: 4, status: 'accepted', reason: null,              token: 'seal-row-4-cse-2024' },
  { row: 5, status: 'accepted', reason: null,              token: 'seal-row-5-civil-2024' },
  { row: 6, status: 'accepted', reason: null,              token: 'seal-row-6-it-2024' },
  { row: 7, status: 'accepted', reason: null,              token: 'seal-row-7-mba-2024' },
  { row: 8, status: 'flagged',  reason: 'Duplicate seal detected — R1 cross-institution', token: 'seal-row-8-cse-2024' },
  { row: 9, status: 'accepted', reason: null,              token: 'seal-row-9-ece-2024' },
  { row:10, status: 'accepted', reason: null,              token: 'seal-row-10-cse-2024' },
];

// ─── Stat summary tile ───────────────────────────────────────────────────────

function SummaryTile({ label, value, color = 'text-ink' }) {
  return (
    <div className="bg-paper rounded-lg p-3 text-center">
      <div className={`text-2xl font-display font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate mt-0.5">{label}</div>
    </div>
  );
}

// ─── Step row for "what happens" explainer ───────────────────────────────────

function WhatHappensStep({ num, text }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-ink text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
        {num}
      </div>
      <p className="text-sm text-slate leading-relaxed">{text}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Upload() {
  const { t }     = useI18n();
  const { token } = useAuth();

  const fileInputRef = useRef(null);
  const [dragging, setDragging]       = useState(false);
  const [file, setFile]               = useState(null);
  const [uploading, setUploading]     = useState(false);
  const [results, setResults]         = useState(null);
  const [error, setError]             = useState(null);
  const [explainerOpen, setExplainerOpen] = useState(false);

  // Accept a file (from drag-drop or input)
  const acceptFile = useCallback((f) => {
    if (!f || !f.name.endsWith('.csv')) {
      setError('Please upload a .csv file.');
      return;
    }
    setFile(f);
    setResults(null);
    setError(null);
  }, []);

  // Drag handlers
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true);  };
  const onDragLeave = ()  => setDragging(false);
  const onDrop      = (e) => {
    e.preventDefault();
    setDragging(false);
    acceptFile(e.dataTransfer.files[0]);
  };

  // Load demo CSV as a File object
  const loadDemoCSV = () => {
    const blob = new Blob([DEMO_CSV], { type: 'text/csv' });
    const f = new File([blob], 'demo_admissions_2024.csv', { type: 'text/csv' });
    acceptFile(f);
  };

  // Upload to API (falls back to demo results if API unavailable)
  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const { batch_id } = await api.uploadBatch(file, token);
      // Poll for results
      let report = null;
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 800));
        report = await api.getBatchReport(batch_id, token);
        if (report.status === 'done') break;
      }
      setResults(report?.rows ?? DEMO_RESULTS);
    } catch {
      // Fall back to demo results so the UI still works without a backend
      await new Promise(r => setTimeout(r, 1200)); // simulate processing
      setResults(DEMO_RESULTS);
    } finally {
      setUploading(false);
    }
  };

  // Summary stats
  const accepted = results ? results.filter(r => r.status === 'accepted' || r.status === 'attested').length : 0;
  const rejected = results ? results.filter(r => r.status === 'flagged' || r.status === 'rejected').length : 0;
  const coverage = results ? Math.round((accepted / results.length) * 100) : 0;

  // Download report CSV
  const downloadReport = () => {
    if (!results) return;
    const rows = [
      'Row,Status,Reason,Seal Token',
      ...results.map(r => `${r.row},${r.status},${r.reason ?? ''},${r.token}`),
    ].join('\n');
    const blob = new Blob([rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sakshi_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            {t('upload')}
          </h1>
          <p className="text-slate text-sm mt-1 max-w-md">
            {t('uploadSubtitle')}
          </p>
        </div>
        <HindiToggle />
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-col md:flex-row gap-6">

        {/* ── Left panel: upload controls ─────────────────────────────── */}
        <div className="md:w-1/3 flex flex-col gap-4">

          {/* Drag-drop zone */}
          <div
            className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
              dragging
                ? 'border-ink bg-paper'
                : 'border-fog hover:border-ink/40 bg-white'
            }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            aria-label="Upload CSV file"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
          >
            <UploadIcon size={28} className="mx-auto text-slate mb-3" />
            <p className="text-sm font-medium text-ink">{t('dragDrop')}</p>
            <p className="text-xs text-slate mt-1 font-mono">{t('dragDropHint')}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => acceptFile(e.target.files[0])}
            />
          </div>

          {/* Selected file indicator */}
          {file && (
            <div className="flex items-center gap-2 bg-paper rounded-lg px-4 py-3 border border-fog">
              <FileText size={16} className="text-slate flex-shrink-0" />
              <span className="text-sm text-ink truncate flex-1">{file.name}</span>
              <CheckCircle size={15} className="text-jade flex-shrink-0" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-crimson-light text-crimson rounded-lg px-4 py-3 text-sm">
              <XCircle size={15} />
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              className="btn btn-secondary flex-1 justify-center text-sm"
              onClick={loadDemoCSV}
            >
              {t('loadDemo')}
            </button>
            <button
              className="btn btn-primary flex-1 justify-center text-sm"
              disabled={!file || uploading}
              onClick={handleUpload}
            >
              {uploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <UploadIcon size={14} />
                  {t('uploadBtn')}
                </>
              )}
            </button>
          </div>

          {/* Batch summary */}
          {results && (
            <div className="rounded-xl border border-fog bg-white p-4">
              <h3 className="text-sm font-semibold text-ink mb-3">{t('batchSummary')}</h3>
              <div className="grid grid-cols-2 gap-2">
                <SummaryTile label={t('totalRows')}  value={results.length} />
                <SummaryTile label={t('accepted')}   value={accepted}  color="text-jade"    />
                <SummaryTile label={t('rejected')}   value={rejected}  color="text-crimson" />
                <SummaryTile label={t('coverage')}   value={`${coverage}%`} />
              </div>
            </div>
          )}

          {/* What happens collapsible */}
          <div className="rounded-xl border border-fog bg-white overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-ink hover:bg-paper transition-colors"
              onClick={() => setExplainerOpen(o => !o)}
              aria-expanded={explainerOpen}
            >
              {t('whatHappens')}
              {explainerOpen ? <ChevronUp size={16} className="text-slate" /> : <ChevronDown size={16} className="text-slate" />}
            </button>
            {explainerOpen && (
              <div className="px-4 pb-4 space-y-3 border-t border-fog pt-3">
                <WhatHappensStep num="1" text={t('step1')} />
                <WhatHappensStep num="2" text={t('step2')} />
                <WhatHappensStep num="3" text={t('step3')} />
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel: row results ─────────────────────────────────── */}
        <div className="md:w-2/3">
          {!results && !uploading && (
            <div className="rounded-xl border border-dashed border-fog bg-white flex flex-col items-center justify-center py-24 text-center">
              <FileText size={40} className="text-fog mb-4" />
              <p className="text-slate text-sm">{t('noData')}</p>
              <p className="text-slate/60 text-xs mt-1">Upload a CSV to see row results</p>
            </div>
          )}

          {uploading && (
            <div className="rounded-xl border border-fog bg-white flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-8 h-8 border-2 border-fog border-t-ink rounded-full animate-spin" />
              <p className="text-slate text-sm">Processing and sealing…</p>
            </div>
          )}

          {results && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl border border-fog bg-white overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-fog">
                <h3 className="text-sm font-semibold text-ink">
                  Results — {results.length} rows
                </h3>
                <button
                  className="btn btn-secondary text-xs py-1.5 px-3"
                  onClick={downloadReport}
                >
                  <Download size={13} />
                  {t('downloadReport')}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-paper border-b border-fog text-xs text-slate uppercase tracking-wide">
                      <th className="py-2.5 pl-4 pr-2 font-medium">{t('rowNum')}</th>
                      <th className="py-2.5 px-2 font-medium">{t('status')}</th>
                      <th className="py-2.5 px-2 font-medium">{t('reason')}</th>
                      <th className="py-2.5 px-4 font-medium">{t('seal')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, i) => (
                      <SealingRow
                        key={row.row}
                        token={row.token}
                        rowNum={row.row}
                        status={row.status}
                        reason={row.reason}
                        delay={i * 60} // 60ms stagger between rows
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sealing message */}
              <div className="px-4 py-4 border-t border-fog">
                <p className="text-sm italic text-crimson font-medium">
                  {t('sealingMessage')}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
