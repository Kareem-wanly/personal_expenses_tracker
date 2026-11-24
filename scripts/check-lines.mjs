// Fails when a source file is longer than 200 lines (rule in AGENTS.md).
// Files that were already longer are listed with their size and may only shrink.
//   node scripts/check-lines.mjs            check
//   node scripts/check-lines.mjs --update   rewrite the list after shrinking files
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const MAX = 200;
const LIST = "scripts/long-files.json";
const allowed = existsSync(LIST) ? JSON.parse(readFileSync(LIST, "utf8")) : {};

const files = execSync("git ls-files -co --exclude-standard", { encoding: "utf8" })
  .split("\n")
  .filter((f) => /\.(tsx?|mjs|css)$/.test(f) && existsSync(f));

const long = {};
for (const file of files) {
  const lines = readFileSync(file, "utf8").trimEnd().split("\n").length;
  if (lines > MAX) long[file] = lines;
}

if (process.argv.includes("--update")) {
  writeFileSync(LIST, JSON.stringify(long, null, 2) + "\n");
} else {
  const bad = Object.entries(long).filter(([file, lines]) => lines > (allowed[file] ?? MAX));
  for (const [file, lines] of bad) console.error(`${file}: ${lines} lines (max ${allowed[file] ?? MAX})`);
  if (bad.length) process.exit(1);
  console.log(`Line limit OK (${Object.keys(long).length} older files still above ${MAX}).`);
}
