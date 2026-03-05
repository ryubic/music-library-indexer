import { readFileSync, writeFileSync } from "fs";

function lib_to_csv(lib) {
  const albumArr = [];
  for (const artist of Object.keys(lib)) {
    for (const album of Object.keys(lib[artist])) {
      const albumData = {
        "Album Artist": artist,
        Album: album,
        Year: lib[artist][album].year,
        Genre: lib[artist][album].genre[0],
        Lossless: lib[artist][album].lossless,
        "Disk Total": lib[artist][album].diskTotal,
        "Track Total": lib[artist][album].trackTotal,
        "Tracks Found": lib[artist][album].tracks.length,
        Incomplete: lib[artist][album].incomplete,
      };
      albumArr.push(albumData);
    }
  }

  const headers = Object.keys(albumArr[0]);

  return [
    headers.join(","),
    ...albumArr.map((album) => headers.map((h) => album[h]).join(",")),
  ].join("\n");
}

const lib = JSON.parse(readFileSync("library.json"));
const csv = lib_to_csv(lib);
// UTF-8 BOM
const BOM = "\uFEFF";

writeFileSync("library.csv", BOM + csv, {
  encoding: "utf8",
});
