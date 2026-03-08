# Music Library Indexer

A small Node.js toolkit to scan a local music collection with ffprobe, extract metadata, build a JSON library (`lib.js`), export summary CSV (`lib.csv`) and view the index in a local webpage (`index.html`).

**Contents**
- `index.html` — View the index of your local music library in a organized way with search filters.
- `script.js` — Recursively scans a directory, runs `ffprobe` on audio files, builds `lib.js`.
- `ffprobe.js` — Helper that runs `ffprobe` and normalizes tags/technical metadata.
- `toCSV.js` — Converts `lib.js` into a compact `lib.csv` summary.
- `lib.js` — Generated library object (not intended for manual editing).
- `lib.csv` — Generated CSV summary produced by `toCSV.js`.

## Requirements
- Node.js 18 or later (for ES modules and top-level await).
- ffprobe (part of FFmpeg) available on `PATH`.

Install ffmpeg on Windows (chocolatey/scoop) or download from https://ffmpeg.org and ensure `ffprobe` is runnable from a terminal.

## Quick Start

1. Open a terminal and change to the repository directory.

2. Run the scanner against your music folder (use `-d` to specify directory):

```bash
node script.js -d "C:/path/to/your/music"
```

This will scan audio files under the target directory, extract metadata with `ffprobe`, and write `lib.js` in the repository root.

3. Export the summary CSV:

```bash
node toCSV.js
```

This reads `lib.js` and writes `lib.csv` (UTF-8 with BOM) suitable for opening in Excel or other spreadsheet tools.

## Details & Notes
- `script.js` uses `ffprobe.js`'s `getMusicMetadata()` to normalize tags (artist, album, track, year, genre, isrc, upc, label, codec, sample rate, lossless detection, duration, etc.).
- `lib.js` is created as a JS file containing a single `const lib_in_lib_js = {...};` assignment. `toCSV.js` strips the assignment and parses the contained JSON.
- The CSV columns include: Album, Album Artist, Year, Genre, Label, Advisory, Disk Total, Track Total, Tracks Found, Lossless, Complete.
- The scanner supports many common audio extensions (mp3, flac, m4a, opus, alac, aac, wav, aiff, etc.).
- The scripts log progress and errors; non-fatal errors for individual files are printed to console and scanning continues.

## Troubleshooting
- If `ffprobe` is not found: ensure FFmpeg is installed and the folder containing `ffprobe.exe` is added to your `PATH`.
- If Node complains about ES modules: use Node 18+ or add a `package.json` with `{"type":"module"}`.

## Contributing
Feel free to open issues or submit PRs.
