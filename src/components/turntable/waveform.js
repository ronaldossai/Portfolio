// The waveform strip under the deck: an overview of the whole track, with a playhead that
// follows the tonearm.
//
// Both sources end up as the same thing, an array of loudness values from 0 to 1:
//  - SoundCloud publishes every track's waveform as a small JSON file (open to any site).
//  - Own files are already decoded in the browser, so we measure their peaks directly.

export const BINS = 1800; // same resolution SoundCloud uses

// Peaks of a decoded AudioBuffer. Samples a few hundred points per bin, which is plenty for
// a picture and keeps a long track under a few milliseconds.
export function peaksFromBuffer(audio, bins = BINS) {
  const chans = [];
  for (let c = 0; c < audio.numberOfChannels; c++) chans.push(audio.getChannelData(c));
  const len = chans[0].length;
  const out = new Float32Array(bins);
  const binLen = len / bins;
  const stride = Math.max(1, Math.floor(binLen / 256));
  let max = 0;
  for (let b = 0; b < bins; b++) {
    const from = Math.floor(b * binLen);
    const to = Math.min(len, Math.floor((b + 1) * binLen));
    let peak = 0;
    for (const ch of chans) {
      for (let i = from; i < to; i += stride) {
        const v = Math.abs(ch[i]);
        if (v > peak) peak = v;
      }
    }
    out[b] = peak;
    if (peak > max) max = peak;
  }
  if (max > 0) for (let b = 0; b < bins; b++) out[b] /= max;
  return out;
}

// SoundCloud's waveform for a track, from the URL the player gives us. Resolves null on failure.
export async function soundcloudPeaks(waveformUrl) {
  if (!waveformUrl) return null;
  // Older players hand out the PNG version; the JSON lives next to it on wave.sndcdn.com
  const url = waveformUrl.replace(/^https?:\/\/w1\.sndcdn\.com\//, 'https://wave.sndcdn.com/').replace(/\.png$/, '.json');
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const d = await r.json();
    const samples = d?.samples;
    if (!Array.isArray(samples) || !samples.length) return null;
    // Mastered tracks sit near the top the whole way through. Lift the quiet floor out so the
    // song's sections (intro, drops, breakdowns) read at a glance.
    const sorted = [...samples].sort((a, b) => a - b);
    const max = sorted[sorted.length - 1] || 1;
    const floor = Math.min(sorted[Math.floor(sorted.length * 0.1)] * 0.7, max * 0.6);
    return Float32Array.from(samples, (v) => Math.max(0.04, (v - floor) / (max - floor)));
  } catch {
    return null;
  }
}

const fmt = (s) => {
  const t = Math.max(0, Math.floor(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};

// Draw the strip. Sizes are CSS pixels (the context is already scaled for the screen).
//   peaks     loudness values, or null while loading / if unavailable (draws a flat line)
//   grow      0..1, bars rise in when the waveform first arrives
//   progress  0..1 playhead position, or null when the needle is off the record
//   hover     0..1 pointer position, or null
export function drawWaveform(ctx, w, h, { peaks, grow = 1, progress, hover, duration, accent }) {
  const [r, g, b] = accent;
  const acc = (a) => `rgb(${r} ${g} ${b} / ${a})`;
  ctx.clearRect(0, 0, w, h);

  const BAR = 2;
  const GAP = 1;
  const n = Math.max(1, Math.floor((w + GAP) / (BAR + GAP)));
  const base = Math.round(h * 0.68); // bars above, a fainter reflection below
  const up = base - 4;
  const down = h - base - 2;
  const played = progress == null ? 0 : progress * w;
  const ahead = hover != null && progress != null && hover * w > played ? hover * w : -1;

  for (let i = 0; i < n; i++) {
    let v = 0;
    if (peaks) {
      const from = Math.floor((i / n) * peaks.length);
      const to = Math.max(from + 1, Math.floor(((i + 1) / n) * peaks.length));
      for (let j = from; j < to; j++) if (peaks[j] > v) v = peaks[j];
      v *= grow;
    }
    const x = i * (BAR + GAP);
    const hu = Math.max(1, v * up);
    const hd = Math.max(1, v * down);
    const isPlayed = x + BAR <= played;
    const isPreview = !isPlayed && x < ahead;
    ctx.fillStyle = isPlayed ? acc(1) : isPreview ? acc(0.45) : 'rgb(255 255 255 / 0.22)';
    ctx.fillRect(x, base - hu, BAR, hu);
    ctx.fillStyle = isPlayed ? acc(0.4) : isPreview ? acc(0.2) : 'rgb(255 255 255 / 0.1)';
    ctx.fillRect(x, base + 1, BAR, hd);
    // the bar the playhead is crossing: colour the played part only
    if (!isPlayed && x < played) {
      ctx.fillStyle = acc(1);
      ctx.fillRect(x, base - hu, played - x, hu);
    }
  }

  if (progress != null) {
    ctx.fillStyle = acc(1);
    ctx.fillRect(Math.round(played) - 1, 0, 2, h);
  }

  if (hover != null && duration) {
    const x = hover * w;
    ctx.fillStyle = 'rgb(255 255 255 / 0.55)';
    ctx.fillRect(Math.round(x), 0, 1, h);
    const label = fmt(hover * duration);
    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
    const tw = ctx.measureText(label).width + 8;
    const lx = Math.min(w - tw, Math.max(0, x - tw / 2));
    ctx.fillStyle = 'rgb(17 17 19 / 0.9)';
    ctx.fillRect(lx, 0, tw, 15);
    ctx.fillStyle = 'rgb(255 255 255 / 0.9)';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, lx + 4, 8);
  }
}
