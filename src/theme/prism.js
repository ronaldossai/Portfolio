// Prism optics for the accent picker.
//
// A white beam enters a glass prism, splits into a spectrum, and whatever light lands on a
// fixed slit becomes the accent. The user turns the prism to sweep the spectrum past the slit.
//
// Everything is in 2D world units with y pointing down (canvas convention). Each ray is traced
// with Snell's law at both faces; the glass follows Cauchy's dispersion n = A + B/λ², with far
// more dispersion than real glass so the fan is visible at popover size.
//
// The picker works in terms of `s`, a position across the spectrum:
//   s = 0 red edge (700 nm) .. s = 1 violet edge (400 nm) .. s = 1 + Z end of the purple zone.
// Purples/pinks are not spectral colours, so past violet the detector mixes in red light.

const D2R = Math.PI / 180;
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const unit = (a) => {
  const l = Math.hypot(a[0], a[1]);
  return [a[0] / l, a[1] / l];
};
export const rot = (p, ang) => {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
};
export { add, sub, mul, dot };

// ---------- Scene constants ----------
export const SRC = [0, 0]; // lamp
const DIR = [1, 0]; // beam direction
export const SIDE = 50; // prism side length
// The prism turns about the midpoint of its entry face, which sits on the beam, so the beam
// always lands on the same face (like a spectrometer's prism table).
export const PIVOT = [60, 0];
const H = SIDE / Math.sqrt(3);
const CENTER = [PIVOT[0] + SIDE / 4, PIVOT[1] + H / 4]; // centroid at theta = 0 (apex up)

export const Z = 0.36; // purple zone width, as a fraction of the visible fan
export const S_MAX = 1 + Z;
const N_RED = 1.5;
const N_VIOLET = 1.6;
const nOf = (s) => N_RED + s * (N_VIOLET - N_RED);

// Slit position along the screen. Chosen offline (search over the whole sweep) as the point
// the full range s = 0 .. S_MAX passes with the most prism rotation. Recompute if the glass,
// geometry or Z change.
const SLIT_COORD = -2.5;
const SCREEN_DIST = 92;

// ---------- Ray tracing ----------
export function prismAt(thetaDeg) {
  const base = [
    [0, -H],
    [SIDE / 2, H / 2],
    [-SIDE / 2, H / 2],
  ].map((p) => add(CENTER, p));
  return base.map((p) => add(PIVOT, rot(sub(p, PIVOT), thetaDeg * D2R)));
}

function hitSeg(o, d, a, b) {
  const e = sub(b, a);
  const den = cross(d, e);
  if (Math.abs(den) < 1e-12) return null;
  const ao = sub(a, o);
  const t = cross(ao, e) / den;
  const u = cross(ao, d) / den;
  return t > 1e-7 && u >= 0 && u <= 1 ? t : null;
}

// Vector Snell's law; `nrm` faces against `d`. Null on total internal reflection.
function refract(d, nrm, eta) {
  const cosi = -dot(nrm, d);
  const k = 1 - eta * eta * (1 - cosi * cosi);
  if (k < 0) return null;
  return unit(add(mul(d, eta), mul(nrm, eta * cosi - Math.sqrt(k))));
}

function outwardNormal(a, b, centroid) {
  const e = sub(b, a);
  const n = unit([e[1], -e[0]]);
  return dot(n, sub(a, centroid)) < 0 ? mul(n, -1) : n;
}

function nearestEdge(o, d, verts, skip) {
  let best = null;
  for (let k = 0; k < 3; k++) {
    if (k === skip) continue;
    const t = hitSeg(o, d, verts[k], verts[(k + 1) % 3]);
    if (t !== null && (!best || t < best.t)) best = { t, k };
  }
  return best;
}

// Trace one ray through the prism at angle theta. Returns { entry, exit, dir } or null.
export function traceAt(theta, s) {
  const n = nOf(s);
  const verts = prismAt(theta);
  const c = mul(add(add(verts[0], verts[1]), verts[2]), 1 / 3);
  const inHit = nearestEdge(SRC, DIR, verts, -1);
  if (!inHit) return null;
  const entry = add(SRC, mul(DIR, inHit.t));
  const inside = refract(DIR, outwardNormal(verts[inHit.k], verts[(inHit.k + 1) % 3], c), 1 / n);
  if (!inside) return null;
  const outHit = nearestEdge(entry, inside, verts, inHit.k);
  if (!outHit) return null;
  const exit = add(entry, mul(inside, outHit.t));
  const out = refract(inside, mul(outwardNormal(verts[outHit.k], verts[(outHit.k + 1) % 3], c), -1), n);
  return out ? { entry, exit, dir: out } : null;
}

const deviation = (ray) => Math.atan2(ray.dir[1], ray.dir[0]) / D2R;

// Where a ray crosses the screen (point P, unit tangent T): signed coordinate along T + the point.
export function screenHit(ray, screen) {
  if (!ray) return null;
  const N = [-screen.T[1], screen.T[0]];
  const den = dot(ray.dir, N);
  if (Math.abs(den) < 1e-9) return null;
  const t = dot(sub(screen.P, ray.exit), N) / den;
  if (t <= 0) return null;
  const hit = add(ray.exit, mul(ray.dir, t));
  return { c: dot(sub(hit, screen.P), screen.T), hit };
}

// ---------- Bench (built once, on first use) ----------
let bench = null;

// Everything the picker needs: the screen, the slit, and a cam that maps s -> prism angle.
// The cam makes each pixel of drag move the colour by the same amount, even though the
// spectrum moves unevenly as the prism turns.
export function getBench() {
  if (bench) return bench;

  // Usable angles: the whole range of rays traces without total internal reflection.
  const valid = [];
  for (let th = -40; th <= 62; th += 0.1) {
    if (traceAt(th, -0.15) && traceAt(th, S_MAX + 0.15)) valid.push(th);
  }
  // A prism has a minimum deviation; past it the spectrum stalls, then reverses.
  // Only use the side of the turn where deviation keeps increasing.
  let thMin = valid[0];
  let best = Infinity;
  valid.forEach((th) => {
    const d = Math.abs(deviation(traceAt(th, 1)));
    if (d < best) {
      best = d;
      thMin = th;
    }
  });
  const branch = valid.filter((th) => th - thMin >= 0.3);
  const thMid = branch[Math.floor(branch.length / 2)];

  // Screen perpendicular to the middle ray
  const mid = traceAt(thMid, 0.5 + Z / 2);
  const P = add(mid.exit, mul(mid.dir, SCREEN_DIST));
  let T = [-mid.dir[1], mid.dir[0]];
  if (screenHit(traceAt(thMid, 1), { P, T }).c < screenHit(traceAt(thMid, 0), { P, T }).c) T = mul(T, -1);
  let N = [T[1], -T[0]];
  if (dot(N, mid.dir) < 0) N = mul(N, -1);
  const screen = { P, T, N };

  // s that lands on the slit at a given angle (bisection on s; landing spot is monotonic in s)
  const sAtSlit = (th) => {
    const f = (s) => {
      const h = screenHit(traceAt(th, s), screen);
      return h ? h.c : null;
    };
    let lo = -0.15;
    let hi = S_MAX + 0.15;
    const flo = f(lo);
    const fhi = f(hi);
    if (flo === null || fhi === null || SLIT_COORD < flo || SLIT_COORD > fhi) return null;
    for (let i = 0; i < 32; i++) {
      const m = (lo + hi) / 2;
      if (f(m) < SLIT_COORD) lo = m;
      else hi = m;
    }
    return (lo + hi) / 2;
  };

  // Cam table, sorted by s descending (turning further sends redder light to the slit)
  const table = [];
  branch.forEach((th) => {
    const s = sAtSlit(th);
    if (s !== null && s >= -0.02 && s <= S_MAX + 0.02) table.push({ th, s });
  });
  table.sort((a, b) => b.s - a.s);

  const thetaForS = (s) => {
    if (s >= table[0].s) return table[0].th;
    for (let i = 1; i < table.length; i++) {
      if (table[i].s <= s) {
        const a = table[i - 1];
        const b = table[i];
        return a.th + ((s - a.s) / (b.s - a.s || 1)) * (b.th - a.th);
      }
    }
    return table[table.length - 1].th;
  };

  const coordAt = (th, s) => {
    const h = screenHit(traceAt(th, s), screen);
    return h ? h.c : null;
  };

  bench = { screen, slit: SLIT_COORD, thetaForS, coordAt, onScreen: (c) => add(P, mul(T, c)) };
  return bench;
}

// ---------- Spectrum <-> hue ----------
export const HUE_RED = 25; // OKLCH hue at the red edge
export const HUE_VIOLET = 295; // ...and the violet edge; purples run 295 -> 385 (= 25)
const PURPLE_SPAN = 360 + HUE_RED - HUE_VIOLET;

// n is linear in 1/λ² (Cauchy), and s is linear in n
export const lambdaOf = (s) => 1 / Math.sqrt(1 / 700 ** 2 + Math.max(0, Math.min(1, s)) * (1 / 400 ** 2 - 1 / 700 ** 2));

// Approximate OKLCH hue of spectral colours, nm -> degrees
const SPECTRAL = [
  [700, 25], [650, 30], [620, 38], [600, 52], [590, 65], [580, 85], [575, 100], [570, 110], [560, 125],
  [550, 135], [530, 143], [510, 150], [500, 170], [490, 200], [480, 235], [470, 255], [460, 264],
  [450, 270], [430, 280], [400, 295],
];

function hueOfLambda(lam) {
  for (let i = 1; i < SPECTRAL.length; i++) {
    const [l1, h1] = SPECTRAL[i - 1];
    const [l2, h2] = SPECTRAL[i];
    if (lam >= l2) return h1 + ((l1 - lam) / (l1 - l2)) * (h2 - h1);
  }
  return HUE_VIOLET;
}

// Hue (0..360) for a spectrum position
export function hueOf(s) {
  if (s > 1) return (HUE_VIOLET + ((Math.min(s, S_MAX) - 1) / Z) * PURPLE_SPAN) % 360;
  return hueOfLambda(lambdaOf(s));
}

// Spectrum position for a hue (inverse of hueOf)
export function sOfHue(h) {
  let hh = ((h % 360) + 360) % 360;
  if (hh < HUE_RED) hh += 360;
  if (hh > HUE_VIOLET) return 1 + ((hh - HUE_VIOLET) / PURPLE_SPAN) * Z;
  let lo = 0;
  let hi = 1; // hueOf is increasing on [0, 1]
  for (let i = 0; i < 30; i++) {
    const m = (lo + hi) / 2;
    if (hueOf(m) < hh) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

// How much red is mixed in, 0..1, inside the purple zone
export const redMix = (s) => Math.max(0, Math.min(1, (s - 1) / Z));
