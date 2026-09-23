import React from 'react';

const PlanetIcon = ({ size = 72, className = '' }) => (
  <svg
    viewBox="0 0 100 100"
    width={size}
    height={size}
    className={`animate-spin-slow ${className}`}
  >
    {/* Back half of ring - shares endpoints with the front half so the loop is topologically continuous */}
    <path
      d="M 4 50 A 46 16 0 0 1 96 50"
      fill="none"
      stroke="#FFD700"
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.5"
    />
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
    {/* Front half of ring - drawn on top of the planet, same endpoints as the back half above */}
    <path
      d="M 96 50 A 46 16 0 0 1 4 50"
      fill="none"
      stroke="#FFD700"
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.95"
    />
  </svg>
);

export default PlanetIcon;
