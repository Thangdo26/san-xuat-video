#!/usr/bin/env node
/**
 * npm run video:pipeline -- --slug da-nang-3n2d [--final]
 *
 * Runs the stages in order and stops at the first failure. Each stage reuses
 * what is already on disk:
 *
 *   1. music        only if the track video.json names is missing
 *   2. map          only if the map plate is missing
 *   3. voice        regenerates only clips whose narration changed
 *   4. validate     always
 *   5. render       draft.mp4, or final.mp4 with --final
 *   6. description  post caption, Maps links and credits
 *
 * Nothing is uploaded or published; reviewing and posting stay manual.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "./lib/args.mjs";
import { PROJECT_ROOT, PUBLIC_ROOT } from "./lib/paths.mjs";
import { loadVideoData } from "./lib/video-data.mjs";

const { flags } = parseArgs(process.argv.slice(2));

const runStage = (name, script, args) => {
  console.log(`\n=== ${name} ===`);
  const result = spawnSync(
    process.execPath,
    [path.join(PROJECT_ROOT, "scripts", script), ...args],
    { cwd: PROJECT_ROOT, stdio: "inherit" },
  );
  if (result.error) {
    fail(`${name} could not start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`${name} failed; stopping before the next stage.`);
  }
};

const skip = (name, reason) => console.log(`\n=== ${name} ===\n${reason}; skipping.`);

try {
  const slug = requireSlug(flags, "video:pipeline");
  const isFinal = flags.final === true || flags.final === "true";
  const { data } = loadVideoData(slug);

  if (!data.music) {
    skip("music", "video.json has no music");
  } else if (existsSync(path.join(PUBLIC_ROOT, data.music.src))) {
    skip("music", `public/${data.music.src} exists`);
  } else if (/\.mp3$/i.test(data.music.src)) {
    runStage("music", "music.mjs", ["--out", data.music.src.replace(/\.mp3$/i, "")]);
  } else {
    fail(`music.src "${data.music.src}" is missing and is not an .mp3 the music stage can make.`);
  }

  if (!data.map) {
    skip("map", "video.json has no map");
  } else if (existsSync(path.join(PUBLIC_ROOT, data.map.plate))) {
    skip("map", `public/${data.map.plate} exists`);
  } else {
    runStage("map", "map-plate.mjs", ["--slug", slug]);
  }
  if (data.flightMap && !existsSync(path.join(PUBLIC_ROOT, data.flightMap.plate))) {
    runStage("flight map", "map-plate.mjs", ["--slug", slug, "--which", "flight"]);
  }

  runStage("voice", "voice.mjs", ["--slug", slug]);
  runStage("validate", "validate.mjs", ["--slug", slug]);
  runStage("render", "render.mjs", isFinal ? ["--slug", slug, "--final"] : ["--slug", slug]);
  runStage("description", "description.mjs", ["--slug", slug]);

  console.log("\nPipeline finished. Review the video and description before publishing.");
} catch (error) {
  fail(error.message);
}
