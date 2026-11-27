// Cover art for the records.
//
// SoundCloud: the public oEmbed endpoint returns each track's artwork URL (it allows requests
// from any site). Artwork URLs end in a size token, so we can ask for a small thumbnail for
// the sleeves and a large one for the label.
//
// Own files: MP3s usually carry their cover (and title/artist) in an ID3v2 tag at the start
// of the file. We read just that tag; WAVs and untagged files fall back to a plain label.

const artCache = new Map();

// Resolves to { small, large } image URLs, or null if the track has no artwork / the request fails.
export function soundcloudArt(trackUrl) {
  if (!artCache.has(trackUrl)) {
    const p = fetch(`https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(trackUrl)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const url = d?.thumbnail_url;
        if (!url) return null;
        return { small: url.replace(/-t500x500(\.\w+)$/, '-t300x300$1'), large: url };
      })
      .catch(() => null);
    artCache.set(trackUrl, p);
  }
  return artCache.get(trackUrl);
}

// ---------- ID3v2 ----------
const syncsafe = (b, i) => (b[i] << 21) | (b[i + 1] << 14) | (b[i + 2] << 7) | b[i + 3];
const uint32 = (b, i) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
const ENCODINGS = ['iso-8859-1', 'utf-16', 'utf-16be', 'utf-8'];

function decodeText(bytes, enc) {
  try {
    return new TextDecoder(ENCODINGS[enc] || 'utf-8').decode(bytes).replace(/\0+$/g, '').split('\0')[0].trim();
  } catch {
    return '';
  }
}

// Index just past a null terminator (two zero bytes on a 2-byte boundary for UTF-16)
function skipString(b, i, enc) {
  if (enc === 1 || enc === 2) {
    while (i + 1 < b.length && !(b[i] === 0 && b[i + 1] === 0)) i += 2;
    return i + 2;
  }
  while (i < b.length && b[i] !== 0) i++;
  return i + 1;
}

// Returns { title, artist, cover: Blob | null } — any field may be missing.
export async function readTags(file) {
  const head = new Uint8Array(await file.slice(0, 10).arrayBuffer());
  if (head[0] !== 0x49 || head[1] !== 0x44 || head[2] !== 0x33) return {}; // "ID3"
  const version = head[3];
  const flags = head[5];
  const size = syncsafe(head, 6);
  if (flags & 0x80) return {}; // unsynchronised tags are rare; skip rather than misread
  const b = new Uint8Array(await file.slice(10, 10 + size).arrayBuffer());

  let i = 0;
  if (flags & 0x40) i = version === 4 ? syncsafe(b, 0) : uint32(b, 0) + 4; // extended header
  const v22 = version === 2;
  const idLen = v22 ? 3 : 4;
  const hdrLen = v22 ? 6 : 10;
  const out = {};
  const covers = [];

  while (i + hdrLen <= b.length) {
    const id = String.fromCharCode(...b.subarray(i, i + idLen));
    if (!/^[A-Z0-9]+$/.test(id)) break; // padding
    let len;
    if (v22) len = (b[i + 3] << 16) | (b[i + 4] << 8) | b[i + 5];
    else len = version === 4 ? syncsafe(b, i + 4) : uint32(b, i + 4);
    const start = i + hdrLen;
    const body = b.subarray(start, start + len);
    i = start + len;
    if (!len || start + len > b.length) continue;

    if (id === 'TIT2' || id === 'TT2') out.title = decodeText(body.subarray(1), body[0]);
    else if (id === 'TPE1' || id === 'TP1') out.artist = decodeText(body.subarray(1), body[0]);
    else if (id === 'APIC' || id === 'PIC') {
      const enc = body[0];
      let j = 1;
      let mime;
      if (v22) {
        const fmt = String.fromCharCode(...body.subarray(1, 4)).toLowerCase();
        mime = fmt === 'png' ? 'image/png' : 'image/jpeg';
        j = 4;
      } else {
        const end = body.indexOf(0, 1);
        mime = decodeText(body.subarray(1, end), 0) || 'image/jpeg';
        if (!mime.includes('/')) mime = `image/${mime.toLowerCase() === 'png' ? 'png' : 'jpeg'}`;
        j = end + 1;
      }
      const type = body[j];
      j = skipString(body, j + 1, enc); // description
      covers.push({ type, blob: new Blob([body.slice(j)], { type: mime }) });
    }
  }
  // Prefer the front cover (picture type 3)
  out.cover = (covers.find((c) => c.type === 3) || covers[0])?.blob || null;
  return out;
}

// Load an image for drawing on the canvas. Resolves null on failure.
export function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
