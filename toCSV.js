import { readFileSync, writeFileSync } from "fs";

function lib_to_csv(lib) {
  const albumArr = [];
  for (const artist of Object.keys(lib)) {
    for (const album of Object.keys(lib[artist])) {
      const albumData = {
        Album: album,
        "Album Artist": artist,
        Year: lib[artist][album].year,
        Genre: lib[artist][album].genre[0],
        Label: lib[artist][album].label || "[no label]", // as per my friend's request
        "Disk Total": lib[artist][album].diskTotal,
        "Track Total": lib[artist][album].trackTotal,
        "Tracks Found": lib[artist][album].tracks.length,
        Lossless: lib[artist][album].lossless ? "✔" : "✘",
        Complete: lib[artist][album].incomplete ? "✘" : "✔",
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

// const
const fileContent = readFileSync("lib.js", "utf8");
// remove `const lib_in_lib_js =` and trailing `;`
const jsonPart = fileContent
  .replace(/^.*?=\s*/, "") // remove variable assignment
  .replace(/;?\s*$/, ""); // remove trailing semicolon

const lib = JSON.parse(jsonPart);

const csv = lib_to_csv(lib);
// UTF-8 BOM
const BOM = "\uFEFF";
writeFileSync("lib.csv", BOM + csv, {
  encoding: "utf8",
});
