import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAccent } from '../theme/AccentContext';
import {
  MAX_LIGHTNESS,
  MIN_LIGHTNESS,
  PRESETS,
  accentFor,
  depthGradient,
  hueGradient,
} from '../theme/accent';

const HINT_KEY = 'accent-hint-seen';

// RO chip (same shape as /public/logo.svg), filled with the live accent colour.
// The letters use --on-accent so they stay readable on deep colours.
const ChipIcon = ({ size = 30 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
    <g className="fill-secondary">
      <rect x="21" y="4" width="4" height="7" rx="1" /><rect x="30" y="4" width="4" height="7" rx="1" /><rect x="39" y="4" width="4" height="7" rx="1" />
      <rect x="21" y="53" width="4" height="7" rx="1" /><rect x="30" y="53" width="4" height="7" rx="1" /><rect x="39" y="53" width="4" height="7" rx="1" />
      <rect x="4" y="21" width="7" height="4" rx="1" /><rect x="4" y="30" width="7" height="4" rx="1" /><rect x="4" y="39" width="7" height="4" rx="1" />
      <rect x="53" y="21" width="7" height="4" rx="1" /><rect x="53" y="30" width="7" height="4" rx="1" /><rect x="53" y="39" width="7" height="4" rx="1" />
      <rect x="12" y="12" width="40" height="40" rx="6" />
    </g>
    <path d="M12 18a6 6 0 0 1 6-6h4l-10 10z" className="fill-on-accent" opacity=".85" />
    <g fill="none" className="stroke-on-accent" strokeWidth="3.6">
      <path d="M19.5 43V22h5.5a5.25 5.25 0 0 1 0 10.5h-5.5" strokeLinejoin="round" />
      <rect x="35.2" y="23.8" width="9.4" height="17.4" rx="4.8" />
    </g>
    <path d="M23.4 32.5h3.9l4 10.5h-3.9z" className="fill-on-accent" />
  </svg>
);

// Horizontal slider: drag, click, or arrow keys. `t` is 0..1.
const Strip = ({ label, valueText, t, onChange, background, step = 0.015 }) => {
  const ref = useRef(null);
  const clamp = (v) => Math.min(1, Math.max(0, v));

  const fromPointer = (clientX) => {
    const rect = ref.current.getBoundingClientRect();
    onChange(clamp((clientX - rect.left) / rect.width));
  };

  const onKeyDown = (e) => {
    const s = e.shiftKey ? step * 6 : step;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(clamp(t + s));
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(clamp(t - s));
    else if (e.key === 'Home') onChange(0);
    else if (e.key === 'End') onChange(1);
    else return;
    e.preventDefault();
  };

  return (
    <div>
      <div className="mb-1.5 font-mono text-[10px] tracking-widest text-dark">{label.toUpperCase()}</div>
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(t * 100)}
        aria-valuetext={valueText}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          fromPointer(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) fromPointer(e.clientX);
        }}
        onKeyDown={onKeyDown}
        className="relative h-6 cursor-pointer touch-none rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-light"
        style={{ background }}
      >
        <span
          className="pointer-events-none absolute top-1/2 h-7 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-light bg-secondary shadow-md ring-1 ring-black"
          style={{ left: `${t * 100}%` }}
        />
      </div>
    </div>
  );
};

const LRANGE = MAX_LIGHTNESS - MIN_LIGHTNESS;

const AccentPicker = () => {
  const { value, hue, lightness, setValue, setHue, setLightness, reset } = useAccent();
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(() => {
    try {
      return !localStorage.getItem(HINT_KEY);
    } catch {
      return false;
    }
  });
  const rootRef = useRef(null);
  const buttonRef = useRef(null);

  const toggle = () => {
    setOpen((o) => !o);
    if (showHint) {
      setShowHint(false);
      try {
        localStorage.setItem(HINT_KEY, '1');
      } catch {
        /* ignore */
      }
    }
  };

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const depthT = Math.min(1, Math.max(0, (lightness - MIN_LIGHTNESS) / LRANGE));
  const isPreset = (p) =>
    p.value === null ? value === null : value !== null && value.h === p.value.h && value.l === p.value.l;

  return (
    <div ref={rootRef} className="relative flex items-center">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label="Change accent colour"
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Change accent colour"
        className="relative rounded-md p-0.5 transition-transform hover:scale-110 hover:rotate-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
      >
        <ChipIcon />
        {showHint && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-secondary" />
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Accent colour"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-3 w-[280px] max-w-[calc(100vw-2rem)] rounded-lg border border-secondary/30 bg-tertiary/95 p-4 shadow-xl backdrop-blur-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-xs tracking-widest text-light">ACCENT</span>
              <button
                type="button"
                onClick={reset}
                disabled={value === null}
                aria-label="Reset to yellow"
                title="Reset to yellow"
                className="rounded p-1 text-dark transition-colors hover:text-secondary disabled:opacity-30 disabled:hover:text-dark"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 3-6.7" />
                  <path d="M3 4v5h5" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <Strip
                label="Hue"
                valueText={`Hue ${Math.round(hue)}`}
                t={hue / 359}
                onChange={(t) => setHue(Math.round(t * 359))}
                background={hueGradient(lightness)}
                step={5 / 359}
              />
              <Strip
                label="Depth"
                valueText={`${Math.round(depthT * 100)}% bright`}
                t={depthT}
                onChange={(t) => setLightness(Math.round((MIN_LIGHTNESS + t * LRANGE) * 1000) / 1000)}
                background={depthGradient(hue)}
                step={0.04}
              />
            </div>

            {/* Presets */}
            <div className="mt-4 flex justify-between">
              {PRESETS.map((p) => {
                const active = isPreset(p);
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setValue(p.value)}
                    aria-label={p.name}
                    aria-pressed={active}
                    title={p.name}
                    className={`h-6 w-6 rounded-full transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-light ${
                      active ? 'ring-2 ring-light ring-offset-2 ring-offset-tertiary' : ''
                    }`}
                    style={{ backgroundColor: `rgb(${accentFor(p.value).rgb.join(' ')})` }}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccentPicker;
