import React from 'react';

/**
 * StudentAvatar.jsx — High-quality illustrative SVG avatars for demo personas.
 * Completely synthetic, DPDP-compliant, and royalty-free.
 */
export default function StudentAvatar({ persona, size = 40, className = '' }) {
  const p = (persona || '').toLowerCase();

  if (p.includes('asha') || p === 'asha') {
    // Asha: Lawful Opt-Out, green/emerald accent, smart glasses
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`rounded-full shadow-xs ${className}`}
      >
        <circle cx="50" cy="50" r="50" fill="#DCFCE7" />
        {/* Hair back */}
        <circle cx="50" cy="42" r="28" fill="#1E293B" />
        {/* Face */}
        <circle cx="50" cy="48" r="20" fill="#FDE68A" />
        {/* Eyes */}
        <circle cx="43" cy="46" r="2.5" fill="#0F172A" />
        <circle cx="57" cy="46" r="2.5" fill="#0F172A" />
        {/* Glasses */}
        <rect x="36" y="41" width="13" height="10" rx="3" fill="none" stroke="#047857" strokeWidth="2" />
        <rect x="51" y="41" width="13" height="10" rx="3" fill="none" stroke="#047857" strokeWidth="2" />
        <line x1="49" y1="46" x2="51" y2="46" stroke="#047857" strokeWidth="2" />
        {/* Smile */}
        <path d="M45 57 Q50 61 55 57" stroke="#92400E" strokeWidth="1.8" strokeLinecap="round" />
        {/* Hair front bangs */}
        <path d="M30 38 Q50 26 70 38 Q50 34 30 38 Z" fill="#1E293B" />
        {/* Body/Shirt */}
        <path d="M22 92 C22 75 35 68 50 68 C65 68 78 75 78 92 Z" fill="#059669" />
        <path d="M43 68 L50 78 L57 68 Z" fill="#FDE68A" />
      </svg>
    );
  }

  if (p.includes('ravi') || p === 'ravi') {
    // Ravi: Dual Seat holder, purple accent, casual collegiate jacket
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`rounded-full shadow-xs ${className}`}
      >
        <circle cx="50" cy="50" r="50" fill="#F3E8FF" />
        {/* Hair back */}
        <path d="M30 45 Q50 20 70 45 Q65 24 50 24 Q35 24 30 45 Z" fill="#312E81" />
        {/* Face */}
        <circle cx="50" cy="48" r="20" fill="#FED7AA" />
        {/* Eyes */}
        <circle cx="43" cy="47" r="2.5" fill="#1E1B4B" />
        <circle cx="57" cy="47" r="2.5" fill="#1E1B4B" />
        {/* Smile */}
        <path d="M44 57 Q50 62 56 57" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" />
        {/* Hair front */}
        <path d="M30 36 C35 25 45 22 55 24 C65 26 70 34 70 36 C64 30 54 28 44 31 C36 33 32 35 30 36 Z" fill="#1E1B4B" />
        {/* Body/Collegiate Jacket */}
        <path d="M22 92 C22 74 35 68 50 68 C65 68 78 74 78 92 Z" fill="#7C3AED" />
        <path d="M42 68 L50 77 L58 68 Z" fill="#FED7AA" />
        <line x1="50" y1="77" x2="50" y2="92" stroke="#FFFFFF" strokeWidth="2" />
      </svg>
    );
  }

  if (p.includes('meera') || p === 'meera') {
    // Meera: Ghost Seat Victim, amber/coral accent, ponytail
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`rounded-full shadow-xs ${className}`}
      >
        <circle cx="50" cy="50" r="50" fill="#FEF3C7" />
        {/* Ponytail */}
        <path d="M35 35 Q18 30 20 50 Q22 65 35 60 Z" fill="#451A03" />
        {/* Hair main */}
        <circle cx="50" cy="44" r="26" fill="#78350F" />
        {/* Face */}
        <circle cx="50" cy="48" r="19" fill="#FDE68A" />
        {/* Eyes */}
        <ellipse cx="44" cy="47" rx="2.5" ry="3" fill="#1C1917" />
        <ellipse cx="56" cy="47" rx="2.5" ry="3" fill="#1C1917" />
        {/* Smile */}
        <path d="M45 56 Q50 61 55 56" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />
        {/* Hair bangs */}
        <path d="M32 36 Q50 28 68 36 Q50 33 32 36 Z" fill="#451A03" />
        {/* Earrings */}
        <circle cx="30" cy="51" r="2" fill="#D97706" />
        <circle cx="70" cy="51" r="2" fill="#D97706" />
        {/* Top/Dress */}
        <path d="M22 92 C22 74 35 67 50 67 C65 67 78 74 78 92 Z" fill="#D97706" />
        <path d="M43 67 L50 76 L57 67 Z" fill="#FDE68A" />
      </svg>
    );
  }

  // Default Student / Verifier avatar
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`rounded-full shadow-xs ${className}`}
    >
      <circle cx="50" cy="50" r="50" fill="#E0E7FF" />
      <circle cx="50" cy="42" r="20" fill="#4F46E5" />
      <circle cx="50" cy="45" r="17" fill="#FEE2E2" />
      <circle cx="44" cy="44" r="2.5" fill="#1E1B4B" />
      <circle cx="56" cy="44" r="2.5" fill="#1E1B4B" />
      <path d="M45 53 Q50 57 55 53" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 92 C24 74 36 67 50 67 C64 67 76 74 76 92 Z" fill="#3730A3" />
    </svg>
  );
}

