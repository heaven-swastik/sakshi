import React from 'react';
import Seal from './Seal';

/** SAKSHI logo: a real generated seal + the wordmark. Always visible so judges never wonder what this is. */
export default function Wordmark({ size = 'md', tagline = false, className = '' }) {
  const big = size === 'lg';
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Seal token="SAKSHI-WITNESS" size={big ? 48 : 34} />
      <div className="leading-none">
        <div className={`font-display tracking-[0.04em] text-ink ${big ? 'text-[34px]' : 'text-[22px]'}`} style={{ fontWeight: 800 }}>
          SAKSHI
        </div>
        {tagline && <div className="text-slate text-[13px] mt-1.5">A witness that confirms, never discloses.</div>}
      </div>
    </div>
  );
}
