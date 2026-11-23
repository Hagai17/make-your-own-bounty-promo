// Entry program for make.fun's post-x-promote-make-your-own-bounty-01 bounty
// (Node 22, standard library only, no network).
//
// The entry itself is a post on X:
//   https://x.com/borutoseventeen/status/2124973564474593470
// It quote-posts make.fun's make-your-own-bounty post, carries a photo of
// its own, and its text carries the @makefunai tag, the sponsor link
// https://make.fun/sponsor/new and the play code
// makefun-pocket-shrimp-mallet. Places go by that post's replies, reposts
// and quotes, which the house reads from X itself.
//
// POST.json at the repository root names the post. This program's whole job
// is to copy POST.json into the output directory, where the gate reads it;
// nothing the program writes about the post is scored.
//
// Outside the grader's container, MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR
// stand in for /bot and /output:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
// On success it prints nothing.

import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const botDir = process.env.MAKEFUN_BOT_DIR ?? "/bot";
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

const sourcePath = join(botDir, "POST.json");
const targetPath = join(outputDir, "POST.json");

// The gate reads POST.json as a JSON object whose url is an X post's
// address, https://x.com/<handle>/status/<id> (digits only). Check the
// source before copying, so a malformed file fails loudly here instead of
// reaching the gate as a silent invalid entry.
function readCheckedSource(): Buffer {
  let raw: Buffer;
  try {
    raw = readFileSync(sourcePath);
  } catch (err) {
    console.error(
      `main.ts: could not read POST.json at ${sourcePath}: ${(err as Error).message}`,
    );
    process.exit(1);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.toString("utf8"));
  } catch {
    console.error(`main.ts: POST.json at ${sourcePath} is not valid JSON`);
    process.exit(1);
  }
  const url = (parsed as { url?: unknown } | null)?.url;
  if (
    typeof url !== "string" ||
    !/^https:\/\/(x\.com|twitter\.com)\/[^/]+\/status\/\d+$/.test(url)
  ) {
    console.error(
      `main.ts: POST.json url is not an X post address: ${JSON.stringify(url)}`,
    );
    process.exit(1);
  }
  return raw;
}

const source = readCheckedSource();

mkdirSync(outputDir, { recursive: true });
try {
  copyFileSync(sourcePath, targetPath);
} catch (err) {
  console.error(
    `main.ts: could not copy POST.json from ${sourcePath} to ${targetPath}: ${(err as Error).message}`,
  );
  process.exit(1);
}

// Read the copy back and compare bytes: the gate must see exactly the
// POST.json this repository ships.
if (!readFileSync(targetPath).equals(source)) {
  console.error(
    `main.ts: copied POST.json at ${targetPath} differs from ${sourcePath}`,
  );
  process.exit(1);
}
