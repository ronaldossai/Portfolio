// Accent colour maths.
// Colours are picked in OKLCH: hue (0-359) + depth (lightness). Equal lightness
// looks equally bright across hues, so the depth control behaves the same for
// every colour. Text placed on the accent switches black/white automatically.

export const DEFAULT_RGB = [255, 215, 0]; // #FFD700
export const DEFAULT_DARK_RGB = [212, 175, 55]; // #D4AF37 (hover shade)
export const DEFAULT_HUE = 95; // OKLCH hue of #FFD700
export const DEFAULT_LIGHTNESS = 0.887; // OKLCH lightness of #FFD700

export const STORAGE_KEY = 'accent';

export const MIN_LIGHTNESS = 0.5; // deepest (e.g. deep red #bc001d)
export const MAX_LIGHTNESS = 0.9; // brightest
const HOVER_DROP = 0.12; // hover shade is this much darker
const MAX_CHROMA = 0.3;

// `null` = the original yellow. Otherwise { h, l }.
export const PRESETS = [
  { name: 'Yellow', value: null },
  { name: 'Orange', value: { h: 55, l: 0.78 } },
  { name: 'Deep red', value: { h: 25, l: 0.52 } },
  { name: 'Pink', value: { h: 355, l: 0.72 } },
  { name: 'Violet', value: { h: 300, l: 0.6 } },
  { name: 'Blue', value: { h: 262, l: 0.6 } },
  { name: 'Cyan', value: { h: 205, l: 0.84 } },
  { name: 'Green', value: { h: 145, l: 0.78 } },
];

function oklchToLinearSrgb(L, C, h) {
  const rad = (h * Math.PI) / 180;
  const a = C * Math.cos(rad);
  const b = C * Math.sin(rad);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const inGamut = (rgb) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

const toByte = (v) => {
  const c = Math.min(1, Math.max(0, v));
  const g = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.round(g * 255);
};

// Most saturated version of (L, h) that still fits in sRGB.
function fitToGamut(L, h) {
  if (inGamut(oklchToLinearSrgb(L, MAX_CHROMA, h))) return oklchToLinearSrgb(L, MAX_CHROMA, h);
  let lo = 0;
  let hi = MAX_CHROMA;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklchToLinearSrgb(L, mid, h))) lo = mid;
    else hi = mid;
  }
  return oklchToLinearSrgb(L, lo, h);
}

export const toRgb = (h, l) => fitToGamut(l, h).map(toByte);

const luminance = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Black or white, whichever reads better on top of `rgb`.
export function textOn(rgb) {
  const Y = luminance(rgb);
  const blackContrast = (Y + 0.05) / 0.05;
  const whiteContrast = 1.05 / (Y + 0.05);
  return blackContrast >= whiteContrast ? [0, 0, 0] : [255, 255, 255];
}

export function accentFor(value) {
  if (!value) {
    return { rgb: DEFAULT_RGB, dark: DEFAULT_DARK_RGB, on: [0, 0, 0] };
  }
  const rgb = toRgb(value.h, value.l);
  return {
    rgb,
    dark: toRgb(value.h, Math.max(0.3, value.l - HOVER_DROP)),
    on: textOn(rgb),
  };
}

export const rgbToHex = ([r, g, b]) =>
  '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');

export function applyAccent({ rgb, dark, on }) {
  const root = document.documentElement.style;
  root.setProperty('--accent', rgb.join(' '));
  root.setProperty('--accent-dark', dark.join(' '));
  root.setProperty('--on-accent', on.join(' '));
}

const stops = (n, fn) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return `rgb(${fn(t).join(' ')}) ${(t * 100).toFixed(1)}%`;
  }).join(', ');

// Hue strip at a given depth, built from the same maths so it matches what you get.
export const hueGradient = (l) => `linear-gradient(to right, ${stops(24, (t) => toRgb(t * 359, l))})`;

// Depth strip for a given hue: deep on the left, bright on the right.
export const depthGradient = (h) =>
  `linear-gradient(to right, ${stops(8, (t) => toRgb(h, MIN_LIGHTNESS + t * (MAX_LIGHTNESS - MIN_LIGHTNESS)))})`;
