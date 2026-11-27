// Plays a local audio file at whatever speed the platter is turning, backwards included.
//
// The audio runs in an AudioWorklet that reads the decoded samples directly, so speed and
// direction can change every frame (scratching, slowing the record with a finger, the motor
// winding down). Rate 1 = normal speed. Nothing is uploaded: the file is decoded in the browser.

const PROCESSOR = `
class TurntableProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ch = null; this.len = 0; this.pos = 0;
    this.rate = 0; this.targetRate = 0;
    this.gain = 0; this.targetGain = 0;
    this.blocks = 0; this.ended = false;
    this.port.onmessage = (e) => {
      const d = e.data;
      if (d.channels) { this.ch = d.channels; this.len = d.channels[0].length; this.pos = 0; this.ended = false; }
      if (d.rate !== undefined) this.targetRate = d.rate;
      if (d.gain !== undefined) this.targetGain = d.gain;
      if (d.seek !== undefined) { this.pos = Math.max(0, Math.min(this.len - 2, d.seek * sampleRate)); this.ended = false; }
    };
  }
  process(_inputs, outputs) {
    const out = outputs[0];
    const n = out[0].length;
    if (!this.ch) return true;
    // One-pole smoothing so rate and volume changes never click (about 4 ms and 15 ms)
    const kr = 1 - Math.exp(-1 / (0.004 * sampleRate));
    const kg = 1 - Math.exp(-1 / (0.015 * sampleRate));
    const last = this.len - 2;
    for (let i = 0; i < n; i++) {
      this.rate += (this.targetRate - this.rate) * kr;
      this.gain += (this.targetGain - this.gain) * kg;
      const i0 = Math.floor(this.pos);
      const f = this.pos - i0;
      for (let c = 0; c < out.length; c++) {
        const src = this.ch[Math.min(c, this.ch.length - 1)];
        out[c][i] = (src[i0] * (1 - f) + src[i0 + 1] * f) * this.gain;
      }
      this.pos += this.rate;
      if (this.pos < 0) this.pos = 0;
      if (this.pos > last) { this.pos = last; if (!this.ended) { this.ended = true; this.port.postMessage({ ended: true }); } }
    }
    if (++this.blocks % 6 === 0) this.port.postMessage({ pos: this.pos / sampleRate });
    return true;
  }
}
registerProcessor('turntable-processor', TurntableProcessor);
`;

let ctxPromise = null;

// One AudioContext for the page, created on the first user gesture.
function getContext() {
  if (!ctxPromise) {
    ctxPromise = (async () => {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const url = URL.createObjectURL(new Blob([PROCESSOR], { type: 'application/javascript' }));
      await ctx.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);
      return ctx;
    })();
  }
  return ctxPromise;
}

export const fileAudioSupported = () =>
  typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext) && 'AudioWorkletNode' in window;

// Decode `file` and return an engine. Throws if the browser can't decode it.
export async function createFileEngine(file, { onEnded } = {}) {
  const ctx = await getContext();
  if (ctx.state === 'suspended') await ctx.resume();
  const audio = await ctx.decodeAudioData(await file.arrayBuffer());

  const node = new AudioWorkletNode(ctx, 'turntable-processor', {
    numberOfInputs: 0,
    outputChannelCount: [2],
  });
  const master = ctx.createGain();
  master.gain.value = 0.9;
  node.connect(master).connect(ctx.destination);

  const channels = [];
  for (let c = 0; c < audio.numberOfChannels; c++) channels.push(audio.getChannelData(c));
  node.port.postMessage({ channels });

  let pos = 0;
  let needleDown = false;
  node.port.onmessage = (e) => {
    if (e.data.pos !== undefined) pos = e.data.pos;
    if (e.data.ended && onEnded) onEnded();
  };

  return {
    kind: 'file',
    canBend: true, // speed and pitch follow the platter
    duration: audio.duration,
    position: () => pos,
    seek(seconds) {
      pos = seconds;
      node.port.postMessage({ seek: seconds });
    },
    setNeedle(down) {
      needleDown = down;
      node.port.postMessage({ gain: down ? 1 : 0 });
    },
    // `rate` is platter speed relative to 33⅓ rpm; `held` is ignored, a held record just turns slowly
    update(rate) {
      if (ctx.state === 'suspended') ctx.resume();
      node.port.postMessage({ rate: needleDown ? rate : 0 });
    },
    destroy() {
      node.port.postMessage({ gain: 0, rate: 0 });
      setTimeout(() => {
        node.disconnect();
        master.disconnect();
      }, 60);
    },
  };
}
