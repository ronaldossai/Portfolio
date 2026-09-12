import React from 'react';

const PlanetIcon = ({ size = 72, className = '' }) => (
  <svg
    viewBox="0 0 100 100"
    width={size}
    height={size}
    className={`animate-spin-slow ${className}`}
  >
    <ellipse cx="50" cy="50" rx="46" ry="16" fill="none" stroke="#FFD700" strokeWidth="3" opacity="0.6" />
    <circle cx="50" cy="50" r="26" fill="#3B5B73" />
    <path
      d="M 24 50 A 26 26 0 0 0 74 58"
      fill="none"
      stroke="#2a3f4f"
      strokeWidth="6"
      strokeLinecap="round"
      opacity="0.5"
    />
    <circle cx="41" cy="42" r="4" fill="#2a3f4f" opacity="0.5" />
    <circle cx="60" cy="60" r="3" fill="#2a3f4f" opacity="0.4" />
    <ellipse cx="50" cy="50" rx="46" ry="16" fill="none" stroke="#FFD700" strokeWidth="2" opacity="0.9"
      strokeDasharray="60 200" />
  </svg>
);

export default PlanetIcon;
