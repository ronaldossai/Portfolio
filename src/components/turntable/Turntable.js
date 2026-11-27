import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAccent } from '../../theme/AccentContext';
import { createFileEngine, fileAudioSupported } from './fileEngine';
import { createSoundcloudEngine, soundcloudEmbedUrl } from './soundcloudEngine';
import { loadImage, readTags, soundcloudArt } from './artwork';

// ---------------------------------------------------------------------------------------------
// A basic turntable with real rotational physics.
//
//  - The platter has inertia: the motor spins it up to 33⅓ or 45 rpm, and the brake winds it
//    down in under two seconds. Grab the record to hold, push or scratch it; let go mid-flick
//    and it carries on with that speed until the motor takes over again.
//  - The tonearm is the seek bar. The needle moves inward as a record plays, so where it sits
//    is the position in the track. Drag it onto the record to play from there, off to pause.
//  - Own files (MP3/WAV) play at the platter's speed, so pitch follows the record. SoundCloud
//    tracks can only be played/paused/seeked, so they play at normal speed.
// ---------------------------------------------------------------------------------------------

// Logical drawing size; the canvas scales to its container.
const W = 560;
const H = 400;
const TAU = Math.PI * 2;

// Platter and record
const C = [205, 200];
const PLATTER_R = 182;
const RECORD_R = 170;
const LABEL_R = 56;
const GROOVE_OUT = 164; // lead-in: where a track starts
const GROOVE_IN = 76; // run-out: where it ends

// Tonearm: pivot top right, rests on a post beside the platter
const PIVOT = [478, 74];
const ARM_LEN = 272;
const REST_ANGLE = (96 * Math.PI) / 180;
const TOWARD_SPINDLE = Math.atan2(C[1] - PIVOT[1], C[0] - PIVOT[0]); // arm pointing at the spindle
const HEADSHELL_OFFSET = (24 * Math.PI) / 180;
const TUBE_LEN = ARM_LEN - 30; // pivot to headshell
const TIP = 27; // headshell joint to the stylus tip, along the angled headshell

// Motion
const RPS_33 = 100 / 3 / 60; // 33⅓ rpm in revolutions per second
const RPS_45 = 45 / 60;
const SPIN_UP_TAU = 0.28; // s, motor time constant
const BRAKE = 0.32; // rev/s², so 33⅓ stops in ~1.7 s
const ARM_SPRING = 70;
const ARM_DAMPING = 14;
const KEY_SEEK = 5; // s per arrow press

// Stylus tip: down the tube, then along the offset headshell
const stylusAt = (beta) => [
  PIVOT[0] + TUBE_LEN * Math.cos(beta) + TIP * Math.cos(beta + HEADSHELL_OFFSET),
  PIVOT[1] + TUBE_LEN * Math.sin(beta) + TIP * Math.sin(beta + HEADSHELL_OFFSET),
];
const radiusAt = (beta) => {
  const s = stylusAt(beta);
  return Math.hypot(s[0] - C[0], s[1] - C[1]);
};
// Arm angle that puts the stylus at radius r (radius shrinks monotonically from rest towards the spindle)
function angleForRadius(r) {
  let lo = REST_ANGLE;
  let hi = TOWARD_SPINDLE;
  for (let i = 0; i < 30; i++) {
    const m = (lo + hi) / 2;
    if (radiusAt(m) > r) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}
const LEAD_IN_ANGLE = angleForRadius(GROOVE_OUT);
const MAX_ANGLE = angleForRadius(GROOVE_IN - 6);
const radiusForProgress = (p) => GROOVE_OUT - (GROOVE_OUT - GROOVE_IN) * Math.min(1, Math.max(0, p));

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const fmt = (s) => {
  if (!Number.isFinite(s)) return '0:00';
  const t = Math.max(0, Math.floor(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};
function distToSegment(p, a, b) {
  const ab = [b[0] - a[0], b[1] - a[1]];
  const t = clamp(((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / (ab[0] ** 2 + ab[1] ** 2), 0, 1);
  return Math.hypot(p[0] - (a[0] + ab[0] * t), p[1] - (a[1] + ab[1] * t));
}

const Turntable = ({ tracks, soundcloudProfile }) => {
  const { rgb, hex } = useAccent();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const scFrameRef = useRef(null);

  // UI state (re-renders); the physics lives in `sim` and never triggers renders
  const [record, setRecord] = useState(null); // { kind: 'file'|'soundcloud', title, url? }
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [message, setMessage] = useState('');
  const [motor, setMotor] = useState(false);
  const [speed45, setSpeed45] = useState(false);
  const [clock, setClock] = useState({ pos: 0, dur: 0 });
  const [dragOver, setDragOver] = useState(false);
  const [armDown, setArmDown] = useState(false);
  const [arts, setArts] = useState({}); // SoundCloud url -> { small, large }

  const sim = useRef({
    omega: 0, // platter speed, rev/s (positive = clockwise, as records turn)
    angle: 0, // platter angle, rad
    motor: false,
    target: RPS_33,
    hand: null, // { angle, lastAngle, omega } while the record is held
    arm: { mode: 'rest', beta: REST_ANGLE, vel: 0, lift: 1, grabOffset: 0, target: REST_ANGLE },
    engine: null,
    visible: true,
    accent: rgb,
    title: '',
    art: null, // cover image printed on the label
    artUrl: null, // object URL to revoke for local covers
  });
  const loadToken = useRef(0);

  sim.current.accent = rgb;

  // ----- engine / record lifecycle -----
  const dropNeedle = useCallback((progress) => {
    const s = sim.current;
    const eng = s.engine;
    s.arm.mode = 'down';
    setArmDown(true);
    if (eng) {
      eng.seek(clamp(progress, 0, 0.999) * eng.duration);
      eng.setNeedle(true);
    }
  }, []);

  const liftNeedle = useCallback((mode = 'returning') => {
    const s = sim.current;
    s.arm.mode = mode;
    s.arm.target = REST_ANGLE;
    setArmDown(false);
    if (s.engine) s.engine.setNeedle(false);
  }, []);

  const setMotorOn = useCallback((on) => {
    sim.current.motor = on;
    setMotor(on);
  }, []);

  const unload = useCallback(() => {
    const s = sim.current;
    if (s.engine) s.engine.destroy();
    s.engine = null;
    s.art = null;
    if (s.artUrl) URL.revokeObjectURL(s.artUrl);
    s.artUrl = null;
    liftNeedle('returning');
    setMotorOn(false);
  }, [liftNeedle, setMotorOn]);

  const onEnded = useCallback(() => {
    // Like an automatic deck: at the run-out the arm returns and the motor stops
    liftNeedle('returning');
    setMotorOn(false);
  }, [liftNeedle, setMotorOn]);

  const loadFile = useCallback(
    async (file) => {
      if (!file) return;
      if (!fileAudioSupported()) {
        setMessage("This browser can't play local files on the deck. Try a recent Chrome, Firefox or Safari.");
        return;
      }
      if (!/^audio\//.test(file.type) && !/\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name)) {
        setMessage(`"${file.name}" isn't an audio file. Drop an MP3 or WAV.`);
        return;
      }
      const token = ++loadToken.current;
      unload();
      const title = file.name.replace(/\.[^.]+$/, '');
      setRecord({ kind: 'file', title });
      sim.current.title = title;
      setStatus('loading');
      setMessage('');
      // Cover art and tags, if the file has them (doesn't block playback)
      readTags(file)
        .then(async (tags) => {
          if (token !== loadToken.current) return;
          if (tags.title) {
            sim.current.title = tags.title;
            setRecord((r) => (r && r.kind === 'file' ? { ...r, title: tags.title, artist: tags.artist } : r));
          }
          if (tags.cover) {
            const url = URL.createObjectURL(tags.cover);
            const img = await loadImage(url);
            if (token !== loadToken.current || !img) return URL.revokeObjectURL(url);
            sim.current.art = img;
            sim.current.artUrl = url;
          }
        })
        .catch(() => {});
      try {
        const eng = await createFileEngine(file, { onEnded });
        if (token !== loadToken.current) return eng.destroy();
        sim.current.engine = eng;
        setStatus('ready');
        setClock({ pos: 0, dur: eng.duration });
      } catch {
        if (token !== loadToken.current) return undefined;
        setStatus('error');
        setMessage(`Couldn't read "${file.name}". Try an MP3 or WAV.`);
      }
      return undefined;
    },
    [unload, onEnded]
  );

  const loadSoundcloud = useCallback(
    (track) => {
      loadToken.current += 1;
      unload();
      // Colour is fixed at load: changing the embed URL later would reload the player
      setRecord({ kind: 'soundcloud', title: track.title, url: track.url, color: hex });
      sim.current.title = track.title;
      setStatus('loading');
      setMessage('');
      const token = loadToken.current;
      soundcloudArt(track.url)
        .then((art) => art && loadImage(art.large))
        .then((img) => {
          if (img && token === loadToken.current) sim.current.art = img;
        });
      // The engine attaches once the iframe below has loaded (see onScLoad)
    },
    [unload, hex]
  );

  const onScLoad = useCallback(async () => {
    const token = loadToken.current;
    try {
      const eng = await createSoundcloudEngine(scFrameRef.current, {
        onEnded,
        onExternalPlay: () => {
          // Play pressed on the embed itself: start the deck and drop the needle where it is
          const s = sim.current;
          setMotorOn(true);
          if (s.arm.mode !== 'down' && s.engine) dropNeedle(s.engine.position() / s.engine.duration);
        },
        onExternalPause: () => setMotorOn(false),
      });
      if (token !== loadToken.current) return eng.destroy();
      sim.current.engine = eng;
      setStatus('ready');
      setClock({ pos: 0, dur: eng.duration });
    } catch {
      if (token !== loadToken.current) return undefined;
      setStatus('error');
      setMessage("SoundCloud didn't load. Check your connection, or drop your own file instead.");
    }
    return undefined;
  }, [onEnded, setMotorOn, dropNeedle]);

  useEffect(() => () => sim.current.engine?.destroy(), []);

  // Sleeve artwork for the record list
  useEffect(() => {
    let alive = true;
    tracks.forEach((t) =>
      soundcloudArt(t.url).then((art) => {
        if (alive && art) setArts((a) => ({ ...a, [t.url]: art }));
      })
    );
    return () => {
      alive = false;
    };
  }, [tracks]);

  // ----- controls -----
  const startStop = () => {
    const s = sim.current;
    const on = !s.motor;
    setMotorOn(on);
    // Start with the arm at rest cues it onto the lead-in, like an automatic deck
    if (on && s.engine && (s.arm.mode === 'rest' || s.arm.mode === 'returning')) {
      s.arm.mode = 'cueing';
      s.arm.target = LEAD_IN_ANGLE;
    }
  };
  const toggleSpeed = (is45) => {
    setSpeed45(is45);
    sim.current.target = is45 ? RPS_45 : RPS_33;
  };

  // ----- pointer: grab the arm or the record -----
  const toLogical = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  };
  const onPointerDown = (e) => {
    const p = toLogical(e);
    const s = sim.current;
    const stylus = stylusAt(s.arm.beta);
    const onArm = distToSegment(p, PIVOT, stylus) < 18 || Math.hypot(p[0] - stylus[0], p[1] - stylus[1]) < 24;
    const onRecord = Math.hypot(p[0] - C[0], p[1] - C[1]) < PLATTER_R;
    if (!onArm && !onRecord) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
    if (onArm) {
      if (s.arm.mode === 'down' && s.engine) s.engine.setNeedle(false);
      setArmDown(false);
      s.arm.mode = 'held';
      s.arm.vel = 0;
      s.arm.grabOffset = s.arm.beta - Math.atan2(p[1] - PIVOT[1], p[0] - PIVOT[0]);
      s.drag = 'arm';
    } else {
      const a = Math.atan2(p[1] - C[1], p[0] - C[0]);
      s.hand = { angle: a, lastAngle: a, omega: s.omega };
      s.drag = 'record';
    }
  };
  const onPointerMove = (e) => {
    const s = sim.current;
    if (!s.drag || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const p = toLogical(e);
    if (s.drag === 'arm') {
      s.arm.beta = clamp(Math.atan2(p[1] - PIVOT[1], p[0] - PIVOT[0]) + s.arm.grabOffset, REST_ANGLE - 0.05, MAX_ANGLE);
    } else if (s.hand) {
      // accumulate the unwrapped angle so a full turn of the hand is a full turn of the record
      const a = Math.atan2(p[1] - C[1], p[0] - C[0]);
      s.hand.angle += wrap(a - (s.hand.angle % TAU));
    }
  };
  const onPointerUp = () => {
    const s = sim.current;
    if (s.drag === 'arm') {
      const r = radiusAt(s.arm.beta);
      if (s.engine && r <= GROOVE_OUT + 6) {
        dropNeedle((GROOVE_OUT - clamp(r, GROOVE_IN, GROOVE_OUT)) / (GROOVE_OUT - GROOVE_IN));
      } else {
        liftNeedle('returning');
      }
    } else if (s.drag === 'record' && s.hand) {
      s.omega = s.hand.omega; // keep the flick
      s.hand = null;
    }
    s.drag = null;
  };

  const onKeyDown = (e) => {
    const s = sim.current;
    const eng = s.engine;
    if (!eng) return;
    const dir = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (dir) {
      const pos = s.arm.mode === 'down' ? eng.position() : 0;
      const next = clamp(pos + dir * KEY_SEEK * (e.shiftKey ? 4 : 1), 0, eng.duration - 0.5);
      dropNeedle(next / eng.duration);
    } else if (e.key === 'Home') dropNeedle(0);
    else if (e.key === 'Escape') liftNeedle('returning');
    else return;
    e.preventDefault();
  };

  // ----- file drop -----
  const dropHandlers = {
    onDragOver: (e) => {
      if (![...e.dataTransfer.types].includes('Files')) return;
      e.preventDefault();
      setDragOver(true);
    },
    onDragLeave: (e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false);
    },
    onDrop: (e) => {
      e.preventDefault();
      setDragOver(false);
      loadFile(e.dataTransfer.files?.[0]);
    },
  };

  // ----- simulation + drawing loop -----
  useEffect(() => {
    const cv = canvasRef.current;
    const ctx = cv.getContext('2d');
    let raf = 0;
    let last = performance.now();
    let lastClock = 0;

    const fit = () => {
      const r = cv.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      cv.width = Math.round(r.width * dpr);
      cv.height = Math.round(r.height * dpr);
      ctx.setTransform((r.width / W) * dpr, 0, 0, (r.height / H) * dpr, 0, 0);
    };
    const ro = new ResizeObserver(fit);
    ro.observe(cv);
    const io = new IntersectionObserver(([en]) => {
      sim.current.visible = en.isIntersecting;
    });
    io.observe(cv);

    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = sim.current;
      const eng = s.engine;

      // Platter
      if (s.hand) {
        const d = s.hand.angle - s.hand.lastAngle;
        s.hand.lastAngle = s.hand.angle;
        const inst = dt > 0 ? d / TAU / dt : 0;
        s.hand.omega += (inst - s.hand.omega) * 0.45;
        s.angle += d;
        s.omega = s.hand.omega;
      } else {
        if (s.motor) s.omega += (s.target - s.omega) * (1 - Math.exp(-dt / SPIN_UP_TAU));
        else s.omega = Math.sign(s.omega) * Math.max(0, Math.abs(s.omega) - BRAKE * dt);
        s.angle += s.omega * TAU * dt;
      }
      const rate = s.omega / RPS_33;

      // Arm
      const arm = s.arm;
      if (arm.mode === 'returning' || arm.mode === 'cueing') {
        const acc = ARM_SPRING * (arm.target - arm.beta) - ARM_DAMPING * arm.vel;
        arm.vel += acc * dt;
        arm.beta += arm.vel * dt;
        if (Math.abs(arm.target - arm.beta) < 0.002 && Math.abs(arm.vel) < 0.02) {
          arm.beta = arm.target;
          arm.vel = 0;
          if (arm.mode === 'cueing') dropNeedle(0);
          else arm.mode = 'rest';
        }
      } else if (arm.mode === 'down' && eng) {
        arm.beta = angleForRadius(radiusForProgress(eng.position() / eng.duration));
      }
      const liftTarget = arm.mode === 'down' ? 0 : 1;
      arm.lift += (liftTarget - arm.lift) * (1 - Math.exp(-dt / 0.08));

      if (eng) {
        eng.update(rate, !!s.hand, dt);
        if (now - lastClock > 250) {
          lastClock = now;
          setClock({ pos: eng.position(), dur: eng.duration });
        }
      }

      if (s.visible) draw(ctx, s, rate);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [dropNeedle]);

  // ----- render -----
  const isFile = record?.kind === 'file';
  const hint = (() => {
    if (message) return message;
    if (!record) return 'Pick a record, or drop your own MP3 or WAV onto the deck.';
    if (status === 'loading') return isFile ? 'Pressing your record…' : 'Fetching from SoundCloud…';
    if (status !== 'ready') return '';
    if (!armDown) return 'Press start, or drag the tonearm onto the record.';
    if (!isFile) return 'SoundCloud plays at normal speed. Drop your own file to bend the pitch with your hand.';
    return 'Grab the record to slow it, push it or scratch. Stop the motor to hear it wind down.';
  })();

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px]" {...dropHandlers}>
      <div className="min-w-0">
        <div className="relative">
          <canvas
            ref={canvasRef}
            role="slider"
            tabIndex={0}
            aria-label={record ? `Tonearm: position in ${record.title}` : 'Turntable'}
            aria-valuemin={0}
            aria-valuemax={Math.round(clock.dur) || 0}
            aria-valuenow={Math.round(clock.pos)}
            aria-valuetext={armDown ? `${fmt(clock.pos)} of ${fmt(clock.dur)}` : 'Needle up'}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
            className="block w-full touch-none select-none rounded-[18px] focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            style={{ aspectRatio: `${W} / ${H}` }}
          />
          {/* Hardware buttons, placed on the plinth's bottom-left corner */}
          <div className="absolute bottom-[4%] left-[3%] flex items-end gap-2">
            <button
              type="button"
              onClick={startStop}
              aria-pressed={motor}
              className={`rounded-md border px-3 py-2 font-mono text-[10px] tracking-widest shadow-md transition-colors sm:px-4 sm:text-xs ${
                motor ? 'border-secondary bg-secondary text-on-accent' : 'border-white/15 bg-[#232325] text-light hover:border-secondary/60'
              }`}
            >
              {motor ? 'STOP' : 'START'}
            </button>
            {[false, true].map((is45) => (
              <button
                key={String(is45)}
                type="button"
                onClick={() => toggleSpeed(is45)}
                aria-pressed={speed45 === is45}
                aria-label={is45 ? '45 rpm' : '33 rpm'}
                className={`rounded border px-2 py-1 font-mono text-[10px] transition-colors ${
                  speed45 === is45 ? 'border-secondary text-secondary' : 'border-white/10 text-dark hover:text-light'
                }`}
              >
                {is45 ? '45' : '33'}
              </button>
            ))}
          </div>
          {dragOver && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-[18px] border-2 border-dashed border-secondary bg-black/60 font-mono text-sm text-secondary">
              Drop to put it on the deck
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="min-w-0 truncate font-semibold text-light">
            {record ? record.title : 'No record on the deck'}
            {record?.artist && <span className="font-normal text-dark"> · {record.artist}</span>}
          </p>
          <p className="font-mono text-xs tabular-nums text-dark">
            {record && status === 'ready' ? `${fmt(clock.pos)} / ${fmt(clock.dur)}` : ''}
          </p>
        </div>
        <p className="mt-1 text-sm text-dark" role="status">{hint}</p>

        {record?.kind === 'soundcloud' && (
          <iframe
            key={record.url}
            ref={scFrameRef}
            onLoad={onScLoad}
            title={`${record.title} on SoundCloud`}
            className="mt-4 w-full rounded"
            height="20"
            scrolling="no"
            frameBorder="no"
            allow="autoplay"
            src={soundcloudEmbedUrl(record.url, record.color)}
          />
        )}
      </div>

      <aside className="space-y-6">
        <div>
          <h4 className="mb-3 font-mono text-xs tracking-widest text-dark">RECORDS</h4>
          <ul className="space-y-2">
            {tracks.map((t) => {
              const active = record?.kind === 'soundcloud' && record.url === t.url;
              return (
                <li key={t.url}>
                  <button
                    type="button"
                    onClick={() => loadSoundcloud(t)}
                    aria-pressed={active}
                    className={`group flex w-full items-center gap-3 rounded-md border p-2 text-left transition-colors ${
                      active ? 'border-secondary/60 bg-secondary/10' : 'border-white/5 hover:border-secondary/40'
                    }`}
                  >
                    {/* Sleeve with the record peeking out */}
                    <span className="relative h-12 w-14 shrink-0">
                      <span className="absolute inset-y-1 left-3 w-10 rounded-full bg-[#111] ring-1 ring-white/10 transition-transform group-hover:translate-x-1.5">
                        <span className="absolute inset-[30%] rounded-full bg-secondary" />
                      </span>
                      {arts[t.url] ? (
                        <img
                          src={arts[t.url].small}
                          alt=""
                          loading="lazy"
                          className="absolute inset-y-0 left-0 h-12 w-12 rounded-sm object-cover shadow-md"
                        />
                      ) : (
                        <span className="absolute inset-y-0 left-0 w-12 rounded-sm bg-secondary/80" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-light">{t.title}</span>
                      <span className="block font-mono text-[10px] tracking-widest text-dark">SOUNDCLOUD</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div
          className={`rounded-lg border border-dashed p-4 transition-colors ${
            dragOver ? 'border-secondary bg-secondary/10' : 'border-white/15'
          }`}
        >
          <p className="font-semibold text-light">Play your own track</p>
          <p className="mt-1 text-sm text-dark">
            Drop an MP3 or WAV here or on the deck. It plays in your browser and is never uploaded.
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 rounded-md border border-secondary/60 px-3 py-1.5 text-sm font-semibold text-secondary transition-colors hover:bg-secondary hover:text-on-accent"
          >
            Choose a file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav"
            className="hidden"
            onChange={(e) => {
              loadFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>

        {soundcloudProfile && (
          <a
            href={soundcloudProfile}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-mono text-xs tracking-widest text-secondary underline decoration-dashed underline-offset-4 hover:text-light"
          >
            MORE ON SOUNDCLOUD ↗
          </a>
        )}
      </aside>
    </div>
  );
};

// ---------------------------------------------------------------------------------------------
// Drawing (logical 560 x 400 units)
// ---------------------------------------------------------------------------------------------
function draw(ctx, s, rate) {
  const [r, g, b] = s.accent;
  const accent = (a = 1) => `rgb(${r} ${g} ${b} / ${a})`;
  ctx.clearRect(0, 0, W, H);

  // Plinth
  const pl = ctx.createLinearGradient(0, 0, 0, H);
  pl.addColorStop(0, '#1c1c1e');
  pl.addColorStop(1, '#111112');
  ctx.fillStyle = pl;
  roundRect(ctx, 0, 0, W, H, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  roundRect(ctx, 0.5, 0.5, W - 1, H - 1, 18);
  ctx.stroke();

  // Platter with strobe dots on the rim (they turn with it)
  circle(ctx, C, PLATTER_R + 4, '#0b0b0c');
  circle(ctx, C, PLATTER_R, '#2a2a2c');
  ctx.save();
  ctx.translate(C[0], C[1]);
  ctx.rotate(s.angle);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * TAU;
    ctx.fillRect(Math.cos(a) * (PLATTER_R - 4) - 0.8, Math.sin(a) * (PLATTER_R - 4) - 0.8, 1.6, 1.6);
  }
  ctx.restore();

  if (s.title) {
    // Vinyl
    circle(ctx, C, RECORD_R, '#0c0c0d');
    for (let rr = GROOVE_IN; rr <= GROOVE_OUT; rr += 2.2) {
      ctx.strokeStyle = rr % 4.4 < 2.2 ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.018)';
      ctx.beginPath();
      ctx.arc(C[0], C[1], rr, 0, TAU);
      ctx.stroke();
    }
    // Light reflecting off the grooves: fixed, so the record visibly turns under it
    if (ctx.createConicGradient) {
      const cg = ctx.createConicGradient(-Math.PI / 4, C[0], C[1]);
      cg.addColorStop(0, 'rgba(255,255,255,0)');
      cg.addColorStop(0.06, 'rgba(255,255,255,0.09)');
      cg.addColorStop(0.12, 'rgba(255,255,255,0)');
      cg.addColorStop(0.5, 'rgba(255,255,255,0)');
      cg.addColorStop(0.56, 'rgba(255,255,255,0.07)');
      cg.addColorStop(0.62, 'rgba(255,255,255,0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(C[0], C[1], RECORD_R - 2, 0, TAU);
      ctx.arc(C[0], C[1], LABEL_R + 4, 0, TAU, true);
      ctx.fill();
    }
    // Label, turning with the record
    ctx.save();
    ctx.translate(C[0], C[1]);
    ctx.rotate(s.angle);
    if (s.art) {
      // Cover art printed on the label, cropped to a circle, with a thin accent ring
      const img = s.art;
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, LABEL_R, 0, TAU);
      ctx.clip();
      ctx.drawImage(
        img,
        (img.naturalWidth - side) / 2,
        (img.naturalHeight - side) / 2,
        side,
        side,
        -LABEL_R,
        -LABEL_R,
        LABEL_R * 2,
        LABEL_R * 2
      );
      ctx.restore();
      ctx.strokeStyle = accent(0.9);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, LABEL_R - 1, 0, TAU);
      ctx.stroke();
      ctx.restore();
    } else {
      circle(ctx, [0, 0], LABEL_R, accent());
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, LABEL_R - 6, 0, TAU);
      ctx.stroke();
      const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      ctx.fillStyle = luminance > 0.5 ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)';
      ctx.textAlign = 'center';
      ctx.font = '600 11px "Space Grotesk", sans-serif';
      ctx.fillText(ellipsize(ctx, s.title, LABEL_R * 1.5), 0, -18);
      ctx.font = '500 8px ui-monospace, Menlo, monospace';
      ctx.fillText(s.target === RPS_45 ? '45 RPM' : '33⅓ RPM', 0, 28);
      ctx.restore();
    }
  } else {
    // Bare slipmat
    circle(ctx, C, RECORD_R, '#1f1f21');
    ctx.save();
    ctx.translate(C[0], C[1]);
    ctx.rotate(s.angle);
    ctx.fillStyle = accent(0.5);
    ctx.textAlign = 'center';
    ctx.font = '600 13px ui-monospace, Menlo, monospace';
    ctx.fillText('DROP A TRACK', 0, -70);
    ctx.restore();
  }
  // Spindle
  circle(ctx, C, 5, '#d9d9dc');
  circle(ctx, C, 2, '#9a9a9e');

  // Target light: glows when the motor is on
  ctx.save();
  if (s.motor) {
    ctx.shadowColor = accent();
    ctx.shadowBlur = 12;
  }
  circle(ctx, [36, 36], 6, s.motor ? accent() : '#2a2a2c');
  ctx.restore();

  // Pitch readout, upper right of the plinth
  ctx.fillStyle = 'rgba(245,245,245,0.35)';
  ctx.font = '500 10px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'right';
  const raw = (rate / (s.target / RPS_33) - 1) * 100;
  const pct = Math.abs(raw) < 0.05 ? 0 : raw; // no "-0.0%"
  ctx.fillText(Math.abs(rate) < 0.01 ? '—' : `${(rate * RPS_33 * 60).toFixed(1)} RPM`, W - 22, H - 46);
  ctx.fillText(Math.abs(rate) < 0.01 ? '' : `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, W - 22, H - 32);

  // Arm rest post
  const rest = stylusAt(REST_ANGLE);
  circle(ctx, rest, 7, '#2b2b2d');

  // Tonearm: shadow (further away when lifted), then the arm
  const arm = s.arm;
  const lift = arm.lift;
  drawArm(ctx, arm.beta, 4 + lift * 8, 'rgba(0,0,0,0.45)', true);
  drawArm(ctx, arm.beta, 0, null, false);

  // Pivot base on top
  circle(ctx, PIVOT, 22, '#2b2b2d');
  circle(ctx, PIVOT, 12, '#3a3a3d');
  circle(ctx, PIVOT, 4, '#8d8d92');
}

function drawArm(ctx, beta, offset, shadow, isShadow) {
  const dir = [Math.cos(beta), Math.sin(beta)];
  const tubeEnd = [PIVOT[0] + dir[0] * TUBE_LEN, PIVOT[1] + dir[1] * TUBE_LEN];
  const back = [PIVOT[0] - dir[0] * 44, PIVOT[1] - dir[1] * 44];
  ctx.save();
  ctx.translate(offset, offset);
  ctx.lineCap = 'round';
  // counterweight
  ctx.strokeStyle = isShadow ? shadow : '#4a4a4f';
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(back[0] + dir[0] * 6, back[1] + dir[1] * 6);
  ctx.lineTo(back[0] - dir[0] * 6, back[1] - dir[1] * 6);
  ctx.stroke();
  // tube
  ctx.strokeStyle = isShadow ? shadow : '#c9c9ce';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(back[0], back[1]);
  ctx.lineTo(tubeEnd[0], tubeEnd[1]);
  ctx.stroke();
  // headshell, angled like a real offset headshell
  ctx.translate(tubeEnd[0], tubeEnd[1]);
  ctx.rotate(beta + HEADSHELL_OFFSET);
  ctx.fillStyle = isShadow ? shadow : '#d8d8dc';
  roundRect(ctx, -2, -7, 34, 14, 3);
  ctx.fill();
  if (!isShadow) {
    ctx.fillStyle = '#1a1a1c';
    ctx.fillRect(TIP - 5, -4, 9, 8); // cartridge, its stylus at (TIP, 0)
    // finger lift
    ctx.strokeStyle = '#d8d8dc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, 7);
    ctx.lineTo(12, 16);
    ctx.stroke();
  }
  ctx.restore();
}

function circle(ctx, [x, y], rad, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, rad, 0, TAU);
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipsize(ctx, text, max) {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t}…`;
}

export default Turntable;
