/**
 * HindiToggle.jsx — Language switcher: EN / हि
 *
 * Sits in the top-right of the page header.
 * Updates the I18n context which re-renders all labels site-wide.
 */

import React from 'react';
import { useI18n } from '../i18n';

export default function HindiToggle() {
  const { lang, setLang } = useI18n();

  return (
    <button
      className="flex items-center gap-0 rounded-full border border-fog bg-white overflow-hidden text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
      aria-label="Toggle language between English and Hindi"
      onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
    >
      <span
        className={`px-3 py-1.5 transition-colors duration-150 ${
          lang === 'en'
            ? 'bg-ink text-white'
            : 'text-slate hover:text-ink'
        }`}
      >
        EN
      </span>
      <span
        className={`px-3 py-1.5 font-devanagari transition-colors duration-150 ${
          lang === 'hi'
            ? 'bg-ink text-white'
            : 'text-slate hover:text-ink'
        }`}
      >
        हि
      </span>
    </button>
  );
}
