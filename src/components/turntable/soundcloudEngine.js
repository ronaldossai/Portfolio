// Drives a SoundCloud embed from the turntable.
//
// The embed is a cross-origin iframe, so the page can play, pause and seek it but can't change
// its speed or touch the sound. It plays at normal speed while the needle is down and the
// platter is turning at a steady speed, and pauses otherwise (record held, motor stopped).

const API_SRC = 'https://w.soundcloud.com/player/api.js';
let apiPromise = null;

function loadApi() {
  if (window.SC?.Widget) return Promise.resolve(window.SC);
  if (!apiPromise) {
    apiPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = API_SRC;
      s.async = true;
      s.onload = () => resolve(window.SC);
      s.onerror = () => {
        apiPromise = null;
        reject(new Error('SoundCloud player failed to load'));
      };
      document.head.appendChild(s);
    });
  }
  return apiPromise;
}

export const soundcloudEmbedUrl = (trackUrl, accentHex) =>
  `https://w.soundcloud.com/player/?url=${encodeURIComponent(trackUrl)}` +
  `&color=${encodeURIComponent(accentHex)}&auto_play=false&hide_related=true&show_comments=false` +
  `&show_user=true&show_reposts=false&show_teaser=false&visual=false`;

// Rate band (relative to 33⅓) in which the embed plays. Below it the platter is still spinning
// up, slowing down or being held. 45 rpm plays at normal speed too: the embed can't go faster.
const MIN_RATE = 0.9;

// `iframe` must already have its src set. Resolves once the player is ready.
export async function createSoundcloudEngine(iframe, { onEnded, onExternalPlay, onExternalPause } = {}) {
  const SC = await loadApi();
  const widget = SC.Widget(iframe);
  const E = SC.Widget.Events;

  await new Promise((resolve) => widget.bind(E.READY, resolve));
  const duration = await new Promise((resolve) => widget.getDuration((ms) => resolve(ms / 1000)));

  let pos = 0;
  let playing = false; // what we asked for
  let needleDown = false;
  let destroyed = false;

  widget.bind(E.PLAY_PROGRESS, (e) => {
    pos = e.currentPosition / 1000;
  });
  widget.bind(E.FINISH, () => {
    playing = false;
    if (onEnded) onEnded();
  });
  // Someone pressed play/pause on the embed itself: let the deck follow
  widget.bind(E.PLAY, () => {
    if (!playing && !destroyed && onExternalPlay) onExternalPlay();
  });
  widget.bind(E.PAUSE, () => {
    if (playing && !destroyed && onExternalPause) onExternalPause();
  });

  const setPlaying = (on) => {
    if (on === playing) return;
    playing = on;
    if (on) {
      widget.seekTo(pos * 1000);
      widget.play();
    } else widget.pause();
  };

  return {
    kind: 'soundcloud',
    canBend: false,
    duration,
    position: () => pos,
    seek(seconds) {
      pos = seconds;
      widget.seekTo(seconds * 1000);
    },
    setNeedle(down) {
      needleDown = down;
      if (!down) setPlaying(false);
    },
    // Track the platter: advance our own estimate while paused so the arm keeps moving smoothly
    update(rate, held, dt) {
      const audible = needleDown && !held && rate >= MIN_RATE;
      if (!audible && needleDown && rate > 0) pos = Math.min(duration, pos + rate * dt);
      setPlaying(audible);
    },
    destroy() {
      destroyed = true;
      try {
        widget.pause();
        Object.values(E).forEach((ev) => widget.unbind(ev));
      } catch {
        /* iframe already gone */
      }
    },
  };
}
