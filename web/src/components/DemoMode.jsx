/**
 * DemoMode.jsx — Guided 4-story demo overlay.
 *
 * Stories:
 *   1. Asha opts out of APAAR
 *   2. Ravi holds two seats (Radar)
 *   3. Meera finds a ghost enrolment (Citizen Window)
 *   4. Employer verifies a QR (Credential verify)
 *
 * Overlay: dark translucent background, white story card, skip always visible.
 * Navigation between stories triggers route changes.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, ChevronRight, CheckCircle } from 'lucide-react';
import { useI18n } from '../i18n';
import Seal from './Seal';

const STORIES = [
  {
    id: 1,
    title: 'Asha opts out of APAAR.',
    body: "Asha chose not to link her APAAR ID. Watch what happens — her seat is still counted, no flag raised, no penalty.",
    detail: 'No fraud flag. Her seat counts.',
    route: '/upload',
    token: 'asha-token-opt-out-2024',
    cta: 'Next — Ravi',
  },
  {
    id: 2,
    title: 'Ravi holds seats in two colleges.',
    body: "Ravi enrolled at Ambedkar Engineering and Delhi Polytechnic. The Radar found him by seal — no name used anywhere.",
    detail: "Same seal, two colleges. AICTE asks both — they don't open the data.",
    route: '/radar',
    token: 'ravi-dual-seat-2024',
    cta: 'Next — Meera',
  },
  {
    id: 3,
    title: 'Meera finds a ghost enrolment.',
    body: "Meera sees an enrolment at a college she never attended. She presses 'This is not me'.",
    detail: "The case appears on the regulator's queue.",
    route: '/citizen',
    token: 'meera-ghost-2024',
    cta: 'Next — Employer',
  },
  {
    id: 4,
    title: 'An employer verifies in seconds.',
    body: "An employer scans Ravi's QR code to confirm his degree before hiring.",
    detail: "Enrolled, active, verified — no name lookup, no database of identities.",
    route: '/credential',
    token: 'ravi-dual-seat-2024',
    cta: 'Done',
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
      {/* Dark overlay */}
      <motion.div
        key="demo-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-ink/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Story card — centred, above overlay */}
      <motion.div
        key={`demo-card-${step}`}
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 340, damping: 26 }}
        className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
        role="dialog"
        aria-modal="true"
        aria-label={`Demo story ${step + 1} of ${STORIES.length}`}
      >
        <div className="bg-white rounded-xl shadow-dock overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-fog">
            <motion.div
              className="h-full bg-ink"
              animate={{ width: `${((step + 1) / STORIES.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="p-6">
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-slate font-medium tracking-wide uppercase">
                {t('demoMode')} · {step + 1} / {STORIES.length}
              </span>
              <button
                onClick={onClose}
                className="btn btn-ghost p-1 text-slate hover:text-ink"
                aria-label={t('skip')}
              >
                <X size={16} />
              </button>
            </div>

            {/* Seal visual */}
            <div className="flex justify-center mb-5">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
              >
                <Seal token={story.token} size={72} />
              </motion.div>
            </div>

            {/* Text */}
            <h3 className="font-display text-lg font-bold text-ink mb-2 leading-snug">
              {story.title}
            </h3>
            <p className="text-sm text-slate mb-4 leading-relaxed">
              {story.body}
            </p>

            {/* Callout */}
            <div className="flex items-start gap-2 bg-jade-light rounded-lg px-3 py-2.5 mb-5">
              <CheckCircle size={14} className="text-jade mt-0.5 flex-shrink-0" />
              <p className="text-xs text-jade font-medium leading-snug">
                {story.detail}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="btn btn-secondary flex-1 justify-center text-sm"
              >
                {t('skip')}
              </button>
              <button
                onClick={handleNext}
                className="btn btn-primary flex-1 justify-center text-sm"
              >
                {step < STORIES.length - 1 ? (
                  <>
                    {story.cta}
                    <ChevronRight size={15} />
                  </>
                ) : (
                  t('done')
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
