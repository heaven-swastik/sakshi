/**
 * DemoMode.jsx — Guided 4-Story Interactive Demo Walkthrough.
 *
 * Synchronized with live database personas & ground truth:
 *   1. Asha (STU-ZRQO3SOOJFVMO): Opts out of APAAR. Admitted at MIT Pune under offline attested tier.
 *   2. Ravi (STU-AXECI4H4VCDL6): Dual enrolment at MIT Pune and RV College Bengaluru caught by Radar.
 *   3. Meera (STU-7RB5JFZR54FMI): Ghost enrolment at SSN Chennai; asserts "This is not me".
 *   4. Employer (6BRQOTU4L7UB): Verifies Ravi's signed credential QR statelessly in < 1 second.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, ChevronRight, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useI18n } from '../i18n';
import Seal from './Seal';

const STORIES = [
  {
    id: 1,
    persona: 'Asha',
    title: 'Asha opts out of APAAR.',
    subtitle: 'Lawful Opt-Out Protected (DPDP Act 2023)',
    body: "Asha exercised her Supreme Court right to opt out of centralized APAAR tracking. Her seat at MIT Pune is counted in the approved intake under Lock 3 offline attestation with zero fraud flags.",
    detail: 'Counted in intake. Zero penalty. Zero fraud flag.',
    route: '/citizen',
    token: 'STU-ZRQO3SOOJFVMO',
    tagColor: 'bg-[#DCFCE7] text-emerald-800 border-[#BBF7D0]',
    cta: 'Next — Ravi (Duplicate)',
  },
  {
    id: 2,
    persona: 'Ravi',
    title: 'Ravi holds seats in two colleges.',
    subtitle: 'Blind Duplicate Radar Detection (Rule R1)',
    body: "Ravi enrolled concurrently in B.Tech CSE at MIT Pune and RV College Bengaluru. The Blind Duplicate Radar caught his identical seal with zero personal identity exposed.",
    detail: 'Same seal in 2 colleges. AICTE asks both without opening personal data.',
    route: '/radar',
    token: 'STU-AXECI4H4VCDL6',
    tagColor: 'bg-[#F3E8FF] text-purple-800 border-[#E9D5FF]',
    cta: 'Next — Meera (Ghost Seat)',
  },
  {
    id: 3,
    persona: 'Meera',
    title: 'Meera finds a ghost enrolment.',
    subtitle: 'Citizen Window & Dispute Filing',
    body: "In her Citizen Window, Meera saw that SSN Chennai claimed an active enrolment under her token. She clicks 'This is not me' to instantly alert AICTE Regulation Bureau.",
    detail: 'Audit trail alert dispatched directly to AICTE regulator queue.',
    route: '/citizen',
    token: 'STU-7RB5JFZR54FMI',
    tagColor: 'bg-[#FFF1F2] text-rose-800 border-[#FFE4E6]',
    cta: 'Next — Employer Verification',
  },
  {
    id: 4,
    persona: 'Employer',
    title: 'Employer verifies in seconds.',
    subtitle: 'Stateless Ed25519 Credential Verification',
    body: "An employer scans Ravi's Enrolment Credential QR code (handle 6BRQOTU4L7UB). The cryptographic signature verifies authentic enrolment without accessing any personal database.",
    detail: 'Valid · B.Tech CSE · Ed25519 signature verified in < 1 second.',
    route: '/credential',
    token: '6BRQOTU4L7UB',
    tagColor: 'bg-[#F0F6FF] text-blue-800 border-[#DBEAFE]',
    cta: 'Complete Walkthrough',
  },
];

export default function DemoMode({ onClose }) {
  const [step, setStep] = useState(0);
  const { t } = useI18n();
  const navigate = useNavigate();
  const story = STORIES[step];

  // Navigate to the relevant screen when the step changes
  useEffect(() => {
    navigate(story.route);
  }, [step, story.route, navigate]);

  const handleNext = useCallback(() => {
    if (step < STORIES.length - 1) {
      setStep(s => s + 1);
    } else {
      onClose();
    }
  }, [step, onClose]);

  return (
    <AnimatePresence>
      {/* Dark overlay with gentle backdrop blur */}
      <motion.div
        key="demo-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Story card — centred at bottom */}
      <motion.div
        key={`demo-card-${step}`}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-gray-100">
            <motion.div
              className="h-full bg-[#181A20]"
              animate={{ width: `${((step + 1) / STORIES.length) * 100}%` }}
              transition={{ duration: 0.25 }}
            />
          </div>

          <div className="p-5">
            {/* Step indicator header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Story {step + 1} of {STORIES.length}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${story.tagColor}`}>
                  {story.subtitle}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-900 transition"
                aria-label={t('skip')}
              >
                <X size={15} />
              </button>
            </div>

            {/* Seal & Persona banner */}
            <div className="flex items-center gap-3 mb-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <Seal token={story.token} size={42} className="flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">
                  {story.title}
                </h4>
                <p className="font-mono text-[11px] text-gray-500 truncate max-w-xs">
                  {story.token}
                </p>
              </div>
            </div>

            {/* Story text */}
            <p className="text-xs text-gray-600 mb-3.5 leading-relaxed">
              {story.body}
            </p>

            {/* Key takeaway pill */}
            <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200/60 rounded-xl p-2.5 mb-4">
              <CheckCircle2 size={14} className="text-emerald-700 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-emerald-900 font-medium leading-snug">
                {story.detail}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={onClose}
                className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-900 rounded-xl transition"
              >
                {t('skip')}
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-2 px-3 bg-[#181A20] text-white text-xs font-semibold rounded-xl hover:bg-black transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>{step < STORIES.length - 1 ? story.cta : t('done')}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
