import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAccent } from '../theme/AccentContext';
import PrismBench from './PrismBench';
import {
  MAX_LIGHTNESS,
  MIN_LIGHTNESS,
  PRESETS,
  accentFor,
  depthGradient,
  hueGradient,
} from '../theme/accent';

const HINT_KEY = 'accent-hint-seen'; // pulsing dot: until the picker is first opened
const TIP_KEY = 'accent-tip-seen'; // intro tooltip: shown once per browser

const TIP_DELAY_MS = 3500; // let the hero settle first
const DEMO_MS = 1600; // chip colour sweep
const TIP_MS = 9000; // callout auto-hides this long after the sweep ends
const SCROLL_DISMISS_PX = 150; // small scroll nudges don't dismiss it

// Colours the chip sweeps through in the intro demo, ending back on yellow.
const DEMO_COLOURS = [
  ...[150, 205, 262, 300, 355, 25].map((h) => `rgb(${accentFor({ h, l: 0.8 }).rgb.join(' ')})`),
  'rgb(255 215 0)',
];

const readFlag = (key) => {
  try {
    return !!localStorage.getItem(key);
  } catch {
    return true; // storage blocked: don't nag
  }
};
const setFlag = (key) => {
  try {
    localStorage.setItem(key, '1');
  } catch {
    /* ignore */
  }
};

// RO chip (same shape as /public/logo.svg), filled with the live accent colour.
// The letters use --on-accent so they stay readable on deep colours.
// `demo` sweeps the body through a few colours without touching the site's accent.
const ChipIcon = ({ size = 30, demo = false }) => {
  // The demo group is keyed so it remounts as a plain <g> afterwards, dropping the inline fill.
  const Body = demo ? motion.g : 'g';
  const demoProps = demo
    ? { animate: { fill: DEMO_COLOURS }, transition: { duration: DEMO_MS / 1000, ease: 'easeInOut' } }
    : {};
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <Body key={demo ? 'demo' : 'static'} className="fill-secondary" {...demoProps}>
        <rect x="21" y="4" width="4" height="7" rx="1" /><rect x="30" y="4" width="4" height="7" rx="1" /><rect x="39" y="4" width="4" height="7" rx="1" />
        <rect x="21" y="53" width="4" height="7" rx="1" /><rect x="30" y="53" width="4" height="7" rx="1" /><rect x="39" y="53" width="4" height="7" rx="1" />
        <rect x="4" y="21" width="7" height="4" rx="1" /><rect x="4" y="30" width="7" height="4" rx="1" /><rect x="4" y="39" width="7" height="4" rx="1" />
        <rect x="53" y="21" width="7" height="4" rx="1" /><rect x="53" y="30" width="7" height="4" rx="1" /><rect x="53" y="39" width="7" height="4" rx="1" />
        <rect x="12" y="12" width="40" height="40" rx="6" />
      </Body>
      <path d="M12 18a6 6 0 0 1 6-6h4l-10 10z" className="fill-on-accent" opacity=".85" />
      <g fill="none" className="stroke-on-accent" strokeWidth="3.6">
        <path d="M19.5 43V22h5.5a5.25 5.25 0 0 1 0 10.5h-5.5" strokeLinejoin="round" />
        <rect x="35.2" y="23.8" width="9.4" height="17.4" rx="4.8" />
      </g>
      <path d="M23.4 32.5h3.9l4 10.5h-3.9z" className="fill-on-accent" />
    </svg>
  );
};

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

const AccentPicker = ({ menuOpen = false }) => {
  const { value, hue, lightness, setValue, setHue, setLightness, reset } = useAccent();
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(() => !readFlag(HINT_KEY));
  // Intro: 'wait' -> 'demo' (chip colour sweep) -> 'tip' (tooltip) -> 'done'
  const [intro, setIntro] = useState(() => (readFlag(TIP_KEY) || readFlag(HINT_KEY) ? 'done' : 'wait'));
  const introVisible = intro === 'demo' || intro === 'tip';

  // The dashed arrow + label only shows at the top of the page, so it never clutters reading.
  const [atTop, setAtTop] = useState(() => window.scrollY < 50);
  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY < 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);

  // Intro timeline
  useEffect(() => {
    if (intro === 'done') return undefined;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let t;
    if (intro === 'wait') {
      t = setTimeout(() => {
        setFlag(TIP_KEY); // counts as seen once it starts
        setIntro(reducedMotion ? 'tip' : 'demo');
      }, TIP_DELAY_MS);
    } else if (intro === 'demo') {
      t = setTimeout(() => setIntro('tip'), DEMO_MS);
    } else if (intro === 'tip') {
      t = setTimeout(() => setIntro('done'), TIP_MS);
    }
    return () => clearTimeout(t);
  }, [intro]);

  // Any interaction during the demo/tooltip dismisses it (except clicks on the chip/tooltip,
  // which open the picker instead)
  useEffect(() => {
    if (intro !== 'demo' && intro !== 'tip') return undefined;
    const end = () => setIntro('done');
    const startY = window.scrollY;
    const onScroll = () => {
      if (Math.abs(window.scrollY - startY) > SCROLL_DISMISS_PX) end();
    };
    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) end();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', end);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', end);
    };
  }, [intro]);

  const toggle = () => {
    setOpen((o) => !o);
    setIntro('done');
    setFlag(TIP_KEY);
    if (showHint) {
      setShowHint(false);
      setFlag(HINT_KEY);
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
        className="relative rounded-md p-0.5 before:absolute before:-inset-[5px] before:content-[''] transition-transform hover:scale-110 hover:rotate-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
      >
        <motion.span
          className="block"
          animate={intro === 'demo' ? { scale: [1, 1.18, 1.18, 1], rotate: [0, -8, 8, 0] } : { scale: 1, rotate: 0 }}
          transition={{ duration: DEMO_MS / 1000, ease: 'easeInOut' }}
        >
          <ChipIcon demo={intro === 'demo'} />
        </motion.span>
        {/* Glowing halo while the intro callout is up */}
        {introVisible && !open && (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-1 rounded-lg border-2 border-secondary"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        {/* Permanent cue: slowly rotating dashed ring around the chip */}
        <svg
          aria-hidden="true"
          viewBox="0 0 48 48"
          className="pointer-events-none absolute -inset-[7px] h-[calc(100%+14px)] w-[calc(100%+14px)] animate-[spin_12s_linear_infinite] motion-reduce:animate-none"
        >
          <circle cx="24" cy="24" r="22.5" fill="none" className="stroke-secondary" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.75" />
        </svg>
      </button>

      {/* Permanent cue at the top of the page: dashed arrow + label pointing at the chip */}
      <AnimatePresence>
        {atTop && !open && !introVisible && !menuOpen && (
          <motion.button
            type="button"
            onClick={toggle}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="group absolute left-[18px] top-full mt-1 flex items-start"
          >
            <motion.svg
              aria-hidden="true"
              viewBox="0 0 44 36"
              className="h-6 w-[30px] shrink-0 overflow-visible md:h-9 md:w-11"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path d="M40 30 C 18 31, 6 22, 5 5" fill="none" className="stroke-secondary" strokeWidth="1.75" strokeDasharray="4 3.5" strokeLinecap="round" />
              <path d="M0.5 10 L5 3.5 L10 9.5" fill="none" className="stroke-secondary" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
            <span className="mt-[13px] ml-1 whitespace-nowrap md:mt-[22px] font-mono text-xs text-secondary underline decoration-dashed decoration-secondary/50 underline-offset-4 transition-colors group-hover:text-light">
              pick a colour
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* One-time intro callout: appears with the chip's colour sweep */}
      <AnimatePresence>
        {introVisible && !open && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: -10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
            style={{ transformOrigin: '17px 0px' }}
            className="absolute left-0 top-full z-10 mt-4"
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-[270px] max-w-[calc(100vw-2rem)]"
            >
              {/* arrow pointing at the chip */}
              <span className="absolute -top-[7px] left-[11px] h-3.5 w-3.5 rotate-45 border-l-2 border-t-2 border-secondary bg-black" />
              <div className="relative rounded-xl border-2 border-secondary bg-black p-4 shadow-[0_0_32px_rgb(var(--accent)/0.4)]">
                <button
                  type="button"
                  onClick={() => setIntro('done')}
                  aria-label="Dismiss"
                  className="absolute right-2 top-2 rounded p-1 text-dark transition-colors hover:text-light"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
                <p className="font-heading text-lg font-bold text-light">Make it yours</p>
                <p className="mt-1 pr-4 text-sm leading-snug text-light/70">
                  Pick any accent colour for this site. Hit the chip any time to change it.
                </p>
                <div className="mt-3 h-2 rounded-full" style={{ background: hueGradient(0.8) }} aria-hidden="true" />
                <button
                  type="button"
                  onClick={toggle}
                  className="mt-4 w-full rounded-md bg-secondary py-2 text-sm font-semibold text-on-accent transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Try it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <PrismBench hue={hue} lightness={lightness} onHue={setHue} />
              <Strip
                label="Lamp"
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
