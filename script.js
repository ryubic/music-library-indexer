import fs from "fs";
import path from "path";
import { getMusicMetadata } from "./ffprobe.js";

console.time("Time taken");

const audioExtensions = new Set([
  ".mp3",
  ".wav",
  ".flac",
  ".aac",
  ".m4a",
  ".m4b",
  ".m4p",
  ".ogg",
  ".oga",
  ".opus",
  ".wma",
  ".alac",
  ".aiff",
  ".aif",
  ".aifc",
  ".pcm",
  ".amr",
  ".3gp",
  ".3g2",
  ".mp2",
  ".mp1",
  ".ra",
  ".rm",
  ".caf",
  ".dsd",
  ".dff",
  ".dsf",
]);

const args = process.argv.slice(2);
let targetDir =
  args.indexOf("-d") === -1 ? process.cwd() : args[args.indexOf("-d") + 1];
targetDir = targetDir.replace(/^["']+|["']+$/g, ""); // remove trailing slashes in path
targetDir = path.resolve(targetDir); // get absolute path from relative path

// scan dir to get all audio files recursively
const items = fs.readdirSync(targetDir, {
  withFileTypes: true,
  recursive: true,
});
const files = items
  .filter((item) => !item.isDirectory())
  .map((item) => path.join(item.parentPath, item.name))
  .filter((filePath) =>
    audioExtensions.has(path.extname(filePath).toLowerCase()),
  );

const lib = {};

// process each file
for (const file of files) {
  try {
    const meta = await getMusicMetadata(file);

    if (!lib[meta.albumArtist]) lib[meta.albumArtist] = {};
    if (!lib[meta.albumArtist][meta.album])
      lib[meta.albumArtist][meta.album] = {
        album: meta.album || "Unknown Album",
        albumartist: meta.albumArtist || "Unknown Artist",
        diskTotal: meta.diskTotal ?? null,
        trackTotal: meta.trackTotal ?? null,
        genre: meta.genre || [],
        year: meta.year || null,
        upc: meta.upc || null,
        copyright: meta.copyright || null,
        lossless: true,
        incomplete: true,
        tracks: [],
      };

    const trackMeta = {
      disk: meta.disk ?? 1,
      track: meta.track ?? null,
      title: meta.title || path.basename(file),
      artist: meta.artist || artistName,
      isrc: meta.isrc,
      codec: meta.codec ? meta.codec.toUpperCase() : null,
      bitDepth: meta.bitsPerSample ?? null,
      sampleRate: meta.sampleRate ?? null,
      lossless: meta.lossless ?? null,
      duration: meta.duration != null ? Math.round(meta.duration) : null,
    };

    if (!meta.lossless) lib[meta.albumArtist][meta.album].lossless = false;
    lib[meta.albumArtist][meta.album].tracks.push(trackMeta);
  } catch (err) {
    console.error(`Error processing ${file}:`, err.message);
  }
}

// post-process: mark incomplete albums and sort tracks
for (const artistKey of Object.keys(lib)) {
  for (const albumKey of Object.keys(lib[artistKey])) {
    const album = lib[artistKey][albumKey];
    
    if (album.trackTotal != null) album.incomplete = album.tracks.length < album.trackTotal;

    // sort tracks by disk, then track number
    album.tracks.sort((a, b) => {
      if ((a.disk ?? 0) !== (b.disk ?? 0)) return (a.disk ?? 0) - (b.disk ?? 0);
      if (a.track != null && b.track != null) return a.track - b.track;
      if (a.track != null) return -1;
      if (b.track != null) return 1;
      return 0;
    });
  }
}

fs.writeFileSync("library.json", JSON.stringify(lib, null, 2));
console.timeEnd("Time taken");
console.log(`✓ Processed ${files.length} files → lib.json`);
