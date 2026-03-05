import { spawn } from "child_process";
import path from "path";

// 1. ffprobe runner
function ffprobe(filePath) {
  return new Promise((resolve, reject) => {
    const normalized = path.normalize(filePath);

    const args = [
      "-v",
      "error",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      normalized,
    ];

    const ff = spawn("ffprobe", args);

    let stdout = "";
    let stderr = "";

    ff.stdout.on("data", (d) => (stdout += d));
    ff.stderr.on("data", (d) => (stderr += d));

    ff.on("close", (code) => {
      if (code !== 0)
        reject(new Error(stderr || `ffprobe exited with ${code}`));
      else resolve(JSON.parse(stdout));
    });
  });
}

// 2. Tag map (fully expanded)
const TAG_MAP = {
  title: ["title", "TITLE", "©nam"],

  artist: ["artist", "ARTIST", "©ART"],
  album: ["album", "ALBUM", "©alb"],
  albumArtist: [
    "album_artist",
    "albumartist",
    "ALBUMARTIST",
    "aART",
    "ALBUM_ARTIST",
  ],

  track: ["track", "TRACK", "tracknumber", "TRACKNUMBER", "trkn"],
  trackTotal: [
    "tracktotal",
    "TRACKTOTAL",
    "totaltracks",
    "TOTALTRACKS",
    "trkn",
  ],

  disk: ["disc", "DISC", "discnumber", "DISCNUMBER"],
  diskTotal: ["disctotal", "DISCTOTAL", "totaldiscs", "TOTALDISCS"],

  genre: ["genre", "GENRE", "©gen"],

  date: ["date", "DATE", "©day"],
  year: ["year", "YEAR"],

  copyright: ["copyright", "COPYRIGHT", "cprt"],
  label: ["label", "LABEL", "publisher", "Publisher", "PUBLISHER"],

  isrc: ["isrc", "ISRC"],
  upc: ["upc", "UPC", "barcode", "BARCODE"],

  rating: ["rating", "RATING"],
  advisory: ["itunesadvisory", "ITUNESADVISORY"],
  explicit: ["explicit", "EXPLICIT"],
  bpm: ["bpm", "TBPM", "BPM"],
  comment: ["comment", "COMMENT", "©cmt", "COMM"],
};

// 3. Tag normalization
function normalizeTags(raw = {}) {
  const lower = {};
  for (const k in raw) lower[k.toLowerCase()] = raw[k];

  const out = {};

  for (const key in TAG_MAP) {
    out[key] = null;
    for (const variant of TAG_MAP[key]) {
      const v = variant.toLowerCase();
      if (lower[v] != null) {
        out[key] = lower[v];
        break;
      }
    }
  }

  // Track number parsing
  if (out.track) {
    const [n, total] = String(out.track).split("/");
    if (!Number.isNaN(Number(n))) out.track = Number(n);
    if (total && !Number.isNaN(Number(total))) out.trackTotal = Number(total);
  }

  if (out.trackTotal && !Number.isNaN(Number(out.trackTotal)))
    out.trackTotal = Number(out.trackTotal);

  // Disk parsing
  if (out.disk) {
    const [n, total] = String(out.disk).split("/");
    if (!Number.isNaN(Number(n))) out.disk = Number(n);
    if (total && !Number.isNaN(Number(total))) out.diskTotal = Number(total);
  }

  if (out.diskTotal && !Number.isNaN(Number(out.diskTotal)))
    out.diskTotal = Number(out.diskTotal);

  // Genre always array
  if (out.genre) {
    if (Array.isArray(out.genre)) {
      out.genre = out.genre;
    } else {
      out.genre = String(out.genre)
        .split(/[;,]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  } else {
    out.genre = [];
  }

  // Year fallback: extract from date "YYYY-MM-DD"
  if (!out.year && out.date) {
    const match = String(out.date).match(/^\d{4}/);
    if (match) out.year = match[0];
  }

  return out;
}

// 4. Metadata extraction
function extractMetadata(raw) {
  const audio = raw.streams.find((s) => s.codec_type === "audio") || {};
  // const cover = raw.streams.find((s) => s.codec_type === "video") || null;

  const mergedTags = {
    ...(raw.format.tags || {}),
    ...(audio.tags || {}),
  };

  const tags = normalizeTags(mergedTags);

  // Lossless codec detection
  const LOSSLESS = new Set([
    "flac",
    "alac",
    "pcm_s16le",
    "pcm_s24le",
    "pcm_s32le",
    "pcm_f32le",
    "pcm_f64le",
    "wav",
    "aiff",
  ]);

  const codec = audio.codec_name || null;

  return {
    // ---------------- TAGS ----------------
    title: tags.title,
    artist: tags.artist,
    album: tags.album,
    albumArtist: tags.albumArtist,

    track: tags.track,
    trackTotal: tags.trackTotal,

    disk: tags.disk,
    diskTotal: tags.diskTotal,

    genre: tags.genre, // always array
    date: tags.date,
    year: tags.year,

    bpm: tags.bpm,
    comment: tags.comment,
    copyright: tags.copyright,
    label: tags.label,
    isrc: tags.isrc,
    upc: tags.upc,
    rating: tags.rating,
    advisory: tags.advisory,
    explicit: tags.explicit,

    // ---------------- TECHNICAL ----------------
    duration: raw.format.duration ? parseFloat(raw.format.duration) : null,
    codec,
    lossless: LOSSLESS.has(codec.toLowerCase()),
    sampleRate: audio.sample_rate ? parseInt(audio.sample_rate) : null,
    channels: audio.channels || null,
    bitsPerSample:
      audio.bits_per_sample || parseInt(audio.bits_per_raw_sample) || null,
    bitrate: raw.format.bit_rate ? parseInt(raw.format.bit_rate) : null,
    container: raw.format.format_name || null,

    // ---------------- COVER ART ----------------
    // cover: cover
    //   ? {
    //       hasCover: true,
    //       codec: cover.codec_name,
    //       width: cover.width,
    //       height: cover.height,
    //     }
    //   : { hasCover: false },
  };
}

// 5. Public API
export async function getMusicMetadata(filePath) {
  const raw = await ffprobe(filePath);
  return extractMetadata(raw);
}
