import React from 'react';

/**
 * CollegeEmblem.jsx — Procedural SVG institutional crests for AICTE colleges.
 * Provides distinct collegiate seals without violating trademarks.
 */
export default function CollegeEmblem({ name = '', size = 32, className = '' }) {
  const n = (name || '').toLowerCase();

  // MIT Pune: Maroon/Crimson shield with open book and torch
  if (n.includes('mit') || n.includes('pune')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`flex-shrink-0 ${className}`}
      >
        <path d="M32 4 L56 14 V34 C56 48 32 60 32 60 C32 60 8 48 8 34 V14 Z" fill="#881337" />
        <path d="M32 8 L52 16 V33 C52 45 32 55 32 55 C32 55 12 45 12 33 V16 Z" stroke="#FDE68A" strokeWidth="1.5" />
        {/* Book */}
        <path d="M22 28 C26 26 30 27 32 29 C34 27 38 26 42 28 V40 C38 38 34 39 32 41 C30 39 26 38 22 40 Z" fill="#FEF3C7" />
        <line x1="32" y1="29" x2="32" y2="41" stroke="#881337" strokeWidth="1.2" />
        {/* Star */}
        <circle cx="32" cy="18" r="3" fill="#FDE68A" />
      </svg>
    );
  }

  // RV College Bengaluru: Royal Navy blue shield with temple gear
  if (n.includes('rv') || n.includes('bengaluru') || n.includes('bangalore')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`flex-shrink-0 ${className}`}
      >
        <path d="M32 4 L56 14 V34 C56 48 32 60 32 60 C32 60 8 48 8 34 V14 Z" fill="#1E3A8A" />
        <path d="M32 8 L52 16 V33 C52 45 32 55 32 55 C32 55 12 45 12 33 V16 Z" stroke="#93C5FD" strokeWidth="1.5" />
        {/* Gear / Wheel */}
        <circle cx="32" cy="34" r="9" stroke="#FBBF24" strokeWidth="2.5" strokeDasharray="3 2" />
        <circle cx="32" cy="34" r="4" fill="#FBBF24" />
        {/* Top Flame */}
        <path d="M32 18 Q36 24 32 27 Q28 24 32 18 Z" fill="#F59E0B" />
      </svg>
    );
  }

  // SSN Chennai: Forest green shield with science atom & quill
  if (n.includes('ssn') || n.includes('chennai')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`flex-shrink-0 ${className}`}
      >
        <path d="M32 4 L56 14 V34 C56 48 32 60 32 60 C32 60 8 48 8 34 V14 Z" fill="#065F46" />
        <path d="M32 8 L52 16 V33 C52 45 32 55 32 55 C32 55 12 45 12 33 V16 Z" stroke="#A7F3D0" strokeWidth="1.5" />
        {/* Atom ring */}
        <ellipse cx="32" cy="34" rx="11" ry="4" stroke="#6EE7B7" strokeWidth="1.5" transform="rotate(30 32 34)" />
        <ellipse cx="32" cy="34" rx="11" ry="4" stroke="#6EE7B7" strokeWidth="1.5" transform="rotate(-30 32 34)" />
        <circle cx="32" cy="34" r="3" fill="#FDE68A" />
      </svg>
    );
  }

  // Default AICTE Institution: Academic Slate shield with lamp of knowledge
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className}`}
    >
      <path d="M32 4 L56 14 V34 C56 48 32 60 32 60 C32 60 8 48 8 34 V14 Z" fill="#1F2937" />
      <path d="M32 8 L52 16 V33 C52 45 32 55 32 55 C32 55 12 45 12 33 V16 Z" stroke="#E5E7EB" strokeWidth="1.5" />
      {/* Pillar / Arch */}
      <path d="M24 24 H40 M26 24 V42 M38 24 V42 M22 42 H42" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

