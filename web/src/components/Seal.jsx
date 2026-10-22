/**
 * Seal.jsx — Renders a deterministic geometric seal SVG inline.
 *
 * Props:
 *   token  (string)  — The seal token; same token = same visual always.
 *   size   (number)  — One of: 24 | 32 | 48 | 64 | 96 | 160
 *   rotate (number)  — Optional rotation in degrees (for gallery effect)
 *   className (string) — Extra CSS classes
 */

import React, { useMemo } from 'react';
import { generateSealSvg } from '../utils/seal';

export default function Seal({ token, size = 48, rotate = 0, className = '', onClick }) {
  // Generate the SVG string deterministically from the token
  const svgString = useMemo(() => generateSealSvg(token, size), [token, size]);

  const style = {
    width:  size,
    height: size,
    flexShrink: 0,
    transform: rotate ? `rotate(${rotate}deg)` : undefined,
    display: 'inline-block',
    cursor: onClick ? 'pointer' : 'default',
  };

  return (
    <span
      className={className}
      style={style}
      title="Enrolment seal — unique to this student"
      aria-label="Enrolment seal"
      role="img"
      onClick={onClick}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
}
