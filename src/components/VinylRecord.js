import React from 'react';

const VinylRecord = ({ size = 96, className = '' }) => (
  <svg
    viewBox="0 0 100 100"
    width={size}
    height={size}
    className={`animate-spin-slow ${className}`}
  >
    <circle cx="50" cy="50" r="49" fill="#111111" />
    <circle cx="50" cy="50" r="40" fill="none" stroke="#2a2a2a" strokeWidth="1" />
    <circle cx="50" cy="50" r="32" fill="none" stroke="#2a2a2a" strokeWidth="1" />
    <circle cx="50" cy="50" r="24" fill="none" stroke="#2a2a2a" strokeWidth="1" />
    <circle cx="50" cy="50" r="16" fill="#FFD700" />
    {/* Single radial marker (center to edge) breaks the symmetry so the spin reads clearly */}
    <line x1="50" y1="50" x2="50" y2="4" stroke="#ffffff" strokeWidth="1.5" opacity="0.35" />
    <circle cx="50" cy="50" r="2.5" fill="#111111" />
  </svg>
);

export default VinylRecord;
