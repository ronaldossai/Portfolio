import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { MAX_LIGHTNESS, MIN_LIGHTNESS, toRgb } from '../theme/accent';
import {
  HUE_RED,
  PIVOT,
  S_MAX,
  SIDE,
  SRC,
  add,
  getBench,
  hueOf,
  lambdaOf,
  mul,
  prismAt,
  redMix,
  rot,
  sOfHue,
  screenHit,
  traceAt,
} from '../theme/prism';

const HEIGHT = 168;
const RAYS = 64;
const PURPLE_STEPS = 14;
const SCREEN_HALF = 22; // drawn screen length either side of the slit (world units)
const KEY_STEP = 0.012; // s per arrow press (Shift x5)

const clampS = (s) => Math.min(S_MAX, Math.max(0, s));
const css = (rgb, a = 1) => `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]} / ${a})`;
const sameHue = (a, b) => Math.abs((((a - b) % 360) + 540) % 360 - 180) < 0.05;

// Optical bench: a lamp, a prism the user turns, and a fixed slit. The light that reaches the
// slit is the accent. Drag sideways (or arrow keys) to turn the prism.
const PrismBench = ({ hue, lightness, onHue }) => {
  const canvasRef = useRef(null);
  const view = useRef({ W: 0, H: HEIGHT, k: 1, ox: 0, oy: 0, tilt: 0 });
  const drag = useRef(null);
  const bench = useMemo(() => getBench(), []);

  // Keep our own spectrum position while it agrees with the hue. The two ends of the spectrum
  // share a colour (red), so recomputing it from the hue alone would make the prism jump.
  const sRef = useRef(sOfHue(hue));
  if (!sameHue(hueOf(sRef.current), hue)) sRef.current = sOfHue(hue);
  const s = sRef.current;

  const brightness = Math.min(1, Math.max(0, (lightness - MIN_LIGHTNESS) / (MAX_LIGHTNESS - MIN_LIGHTNESS)));

  const setS = useCallback(
    (next) => {
      const c = clampS(next);
      sRef.current = c;
      onHue(Math.round(hueOf(c) * 100) / 100);
    },
    [onHue]
  );

  // ----- drawing -----
  const draw = useCallback(() => {
    const cv = canvasRef.current;
    const { W, H, k, ox, oy, tilt } = view.current;
    if (!cv || !W) return;
    const ctx = cv.getContext('2d');
    const P = (p) => {
      const q = rot(p, tilt);
      return [ox + q[0] * k, oy + q[1] * k];
    };
    const line = (a, b, color, width, alpha = 1) => {
      const A = P(a);
      const B = P(b);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(A[0], A[1]);
      ctx.lineTo(B[0], B[1]);
      ctx.stroke();
      ctx.globalAlpha = 1;
    };
    const { screen, slit, onScreen, coordAt } = bench;
    const th = bench.thetaForS(s);
    const glow = 0.35 + 0.65 * brightness;
    const accent = toRgb(hue, lightness);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#060607';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(245,245,245,0.035)';
    ctx.lineWidth = 1;
    for (let x = 0.5; x < W; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    // Lamp and white beam
    const first = traceAt(th, 0.5);
    const lp = P(SRC);
    ctx.fillStyle = '#2a2a2d';
    ctx.fillRect(lp[0] - 9, lp[1] - 7, 10, 14);
    ctx.fillStyle = `rgba(255,250,235,${0.4 + 0.6 * brightness})`;
    ctx.fillRect(lp[0] - 1, lp[1] - 4, 2.5, 8);
    ctx.save();
    ctx.shadowColor = 'rgba(255,255,255,0.9)';
    ctx.shadowBlur = 6 * glow;
    line(SRC, first.entry, '#fffdf5', 1.8, glow);
    ctx.restore();

    // Spectrum rays, added together like light
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const hits = [];
    for (let i = 0; i <= RAYS; i++) {
      const si = i / RAYS;
      const ray = traceAt(th, si);
      const h = screenHit(ray, screen);
      if (h) {
        const col = css(toRgb(hueOf(si), 0.75));
        line(ray.entry, ray.exit, col, 1.1, 0.1 * glow);
        line(ray.exit, h.hit, col, 1.1, 0.22 * glow);
        hits.push({ c: h.c, col });
      }
    }
    ctx.restore();

    // Screen, with the spectrum painted on it
    line(onScreen(slit - SCREEN_HALF), onScreen(slit + SCREEN_HALF), 'rgba(245,245,245,0.22)', 3);
    for (let i = 1; i < hits.length; i++) {
      line(onScreen(hits[i - 1].c), onScreen(hits[i].c), hits[i].col, 3.2, 0.55 + 0.45 * brightness);
    }
    // Purple zone past violet: not real spectral light, so drawn hatched and dimmer
    let prev = coordAt(th, 1);
    for (let i = 1; i <= PURPLE_STEPS; i++) {
      const si = 1 + (i / PURPLE_STEPS) * (S_MAX - 1);
      const c = coordAt(th, si);
      if (c !== null && prev !== null) line(onScreen(prev), onScreen(c), css(toRgb(hueOf(si), 0.7)), 3.2, i % 2 ? 0.45 : 0.18);
      prev = c;
    }

    // Slit, light passing through it, and the detector
    const Q = onScreen(slit);
    const D = add(Q, mul(screen.N, 13));
    ctx.save();
    ctx.shadowColor = css(accent);
    ctx.shadowBlur = 10 * glow;
    line(Q, D, css(accent), 2.2);
    ctx.restore();
    const jaw = 4.5 / k;
    const gap = 1.6 / k;
    [1, -1].forEach((sg) =>
      line(add(Q, mul(screen.T, sg * gap)), add(Q, mul(screen.T, sg * (gap + jaw))), '#e8e8ea', 2.6)
    );
    if (s > 1) {
      // Pinks need red from the far end of the spectrum mixed with violet
      const red = onScreen(coordAt(th, 0) ?? slit);
      const a = P(red);
      const d = P(D);
      const m = P(add(mul(add(red, D), 0.5), mul(screen.N, 14)));
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.globalAlpha = 0.85 * Math.min(1, redMix(s) / 0.3);
      ctx.strokeStyle = css(toRgb(HUE_RED, 0.62));
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.quadraticCurveTo(m[0], m[1], d[0], d[1]);
      ctx.stroke();
      ctx.restore();
    }
    const dp = P(D);
    ctx.save();
    ctx.shadowColor = css(accent);
    ctx.shadowBlur = 14 * glow;
    ctx.fillStyle = css(accent);
    ctx.beginPath();
    ctx.arc(dp[0], dp[1], 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(245,245,245,0.8)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(dp[0], dp[1], 5.5, 0, Math.PI * 2);
    ctx.stroke();

    // Prism on top, with its pivot and a hint that it turns
    const verts = prismAt(th);
    const pv = verts.map(P);
    ctx.beginPath();
    pv.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath();
    const g = ctx.createLinearGradient(pv[0][0], pv[0][1], pv[1][0], pv[1][1]);
    g.addColorStop(0, 'rgba(255,255,255,0.10)');
    g.addColorStop(1, 'rgba(255,255,255,0.03)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(235,240,255,0.65)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    const pp = P(PIVOT);
    ctx.fillStyle = '#e8e8ea';
    ctx.beginPath();
    ctx.arc(pp[0], pp[1], 2, 0, Math.PI * 2);
    ctx.fill();
    const c = P(mul(add(add(verts[0], verts[1]), verts[2]), 1 / 3));
    const r = SIDE * 0.78 * k;
    ctx.strokeStyle = 'rgba(245,245,245,0.28)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.arc(c[0], c[1], r, -Math.PI * 0.85, -Math.PI * 0.35);
    ctx.stroke();
    ctx.setLineDash([]);
    const e = [c[0] + r * Math.cos(-Math.PI * 0.35), c[1] + r * Math.sin(-Math.PI * 0.35)];
    ctx.beginPath();
    ctx.moveTo(e[0] - 4, e[1] - 3);
    ctx.lineTo(e[0], e[1]);
    ctx.lineTo(e[0] - 5, e[1] + 2);
    ctx.stroke();
  }, [bench, s, hue, lightness, brightness]);

  // ----- sizing: fit the whole sweep into the canvas -----
  useLayoutEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return undefined;
    const fit = () => {
      const W = cv.getBoundingClientRect().width;
      const dpr = window.devicePixelRatio || 1;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(HEIGHT * dpr);
      cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
      // Tilt so light enters rising and leaves falling; the scene sits flatter and draws bigger.
      const midRay = traceAt(bench.thetaForS(0.6), 0.6);
      const tilt = -Math.atan2(midRay.dir[1], midRay.dir[0]) / 2;
      const pts = [
        [-10, -6],
        [-10, 6],
      ];
      [0, 0.5, S_MAX].forEach((sv) => prismAt(bench.thetaForS(sv)).forEach((p) => pts.push(p)));
      [bench.slit - SCREEN_HALF, bench.slit + SCREEN_HALF].forEach((cc) => {
        const p = bench.onScreen(cc);
        pts.push(p, add(p, mul(bench.screen.N, 16)));
      });
      const tp = pts.map((p) => rot(p, tilt));
      const xs = tp.map((p) => p[0]);
      const ys = tp.map((p) => p[1]);
      const pad = 12;
      const x0 = Math.min(...xs);
      const y0 = Math.min(...ys);
      const bw = Math.max(...xs) - x0;
      const bh = Math.max(...ys) - y0;
      const k = Math.min((W - 2 * pad) / bw, (HEIGHT - 2 * pad) / bh);
      view.current = { W, H: HEIGHT, k, ox: (W - bw * k) / 2 - x0 * k, oy: (HEIGHT - bh * k) / 2 - y0 * k, tilt };
      draw();
    };
    const ro = new ResizeObserver(fit);
    ro.observe(cv);
    return () => ro.disconnect();
    // Fitting depends only on the bench; redraws on colour change happen in the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bench]);

  useEffect(() => {
    draw();
  }, [draw]);

  // ----- input -----
  // Drag right turns the prism clockwise, sending redder light to the slit.
  // The cam keeps each pixel of drag worth the same amount of colour.
  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, s };
  };
  const onPointerMove = (e) => {
    if (!drag.current || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const dx = e.clientX - drag.current.x;
    setS(drag.current.s - (dx / (view.current.W * 0.95)) * S_MAX);
  };
  const onPointerUp = () => {
    drag.current = null;
  };
  const onKeyDown = (e) => {
    const step = e.shiftKey ? KEY_STEP * 5 : KEY_STEP;
    // Up/Right move towards violet and the pinks, matching the old hue slider's direction
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setS(s + step);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setS(s - step);
    else if (e.key === 'Home') setS(0);
    else if (e.key === 'End') setS(S_MAX);
    else return;
    e.preventDefault();
  };

  const spectral = s <= 1;
  const valueText = spectral
    ? `${Math.round(lambdaOf(s))} nanometres`
    : `Purple mix, ${Math.round(redMix(s) * 100)}% red`;

  return (
    <div>
      <div className="mb-1.5 flex justify-between font-mono text-[10px] tracking-widest text-dark">
        <span>PRISM</span>
        <span aria-hidden="true" className="tabular-nums">
          {spectral ? `λ ${Math.round(lambdaOf(s))} nm` : `RED ${Math.round(redMix(s) * 100)}% + VIOLET`}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        role="slider"
        tabIndex={0}
        aria-label="Prism angle: turn to choose a colour"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round((s / S_MAX) * 100)}
        aria-valuetext={valueText}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className="block w-full cursor-grab touch-none rounded-md bg-[#060607] active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-light"
        style={{ height: HEIGHT }}
      />
      <p className="mt-1.5 text-center font-mono text-[10px] text-dark">drag sideways to turn the prism</p>
    </div>
  );
};

export default PrismBench;
