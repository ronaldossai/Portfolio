import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_HUE, DEFAULT_LIGHTNESS, STORAGE_KEY, accentFor, applyAccent, rgbToHex } from './accent';

const AccentContext = createContext(null);

function readSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (typeof saved?.h === 'number' && typeof saved?.l === 'number') return { h: saved.h, l: saved.l };
  } catch {
    /* fall through */
  }
  return null;
}

export function AccentProvider({ children }) {
  // null = the original yellow; otherwise { h, l } in OKLCH
  const [value, setValue] = useState(readSaved);

  const accent = useMemo(() => accentFor(value), [value]);

  useEffect(() => {
    applyAccent(accent);
    try {
      if (!value) localStorage.removeItem(STORAGE_KEY);
      // rgb/dark/on are stored so the inline script in index.html can apply them before React loads
      else localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...value, rgb: accent.rgb, dark: accent.dark, on: accent.on }));
    } catch {
      /* storage unavailable: the choice just won't persist */
    }
  }, [value, accent]);

  const setHue = useCallback((h) => setValue((v) => ({ h, l: v ? v.l : DEFAULT_LIGHTNESS })), []);
  const setLightness = useCallback((l) => setValue((v) => ({ h: v ? v.h : DEFAULT_HUE, l })), []);
  const reset = useCallback(() => setValue(null), []);

  const ctx = useMemo(
    () => ({
      value,
      hue: value ? value.h : DEFAULT_HUE,
      lightness: value ? value.l : DEFAULT_LIGHTNESS,
      setValue,
      setHue,
      setLightness,
      reset,
      rgb: accent.rgb,
      hex: rgbToHex(accent.rgb),
    }),
    [value, setHue, setLightness, reset, accent]
  );

  return <AccentContext.Provider value={ctx}>{children}</AccentContext.Provider>;
}

export function useAccent() {
  const ctx = useContext(AccentContext);
  if (!ctx) throw new Error('useAccent must be used inside <AccentProvider>');
  return ctx;
}
