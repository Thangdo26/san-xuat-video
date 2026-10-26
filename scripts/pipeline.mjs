#!/usr/bin/env node
/**
 * npm run video:pipeline -- --slug da-nang-3n2d
 *
 * Runs the stages in order and stops at the first failure:
 *   1. voice    only when a clip is missing or --voice was passed
 *   2. validate always
 *   3. render   draft.mp4, or final.mp4 with --final
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
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
  });
  if (result.error) {
    fail(`${name} could not start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`${name} failed; stopping before the next stage.`);
  }
};

try {
  const slug = requireSlug(flags, "video:pipeline");
  const isFinal = flags.final === true || flags.final === "true";
  const forceVoice = flags.voice === true || flags.voice === "true";

  const script = (name) => path.join(PROJECT_ROOT, "scripts", name);

  // Reuse whatever is already on disk: only generate voice when something
  // actually references a clip that is missing, or the user asked for it.
  const { data } = loadVideoData(slug);
  const missingVoice = (data.scenes ?? []).filter(
    (scene) =>
      typeof scene.voice === "string" &&
      !existsSync(path.join(PUBLIC_ROOT, scene.voice)),
  );
  const hasAnyVoice = (data.scenes ?? []).some((scene) => scene.voice);

  if (forceVoice || missingVoice.length > 0) {
    runStage("voice", script("voice.mjs"), ["--slug", slug]);
  } else if (!hasAnyVoice) {
    console.log(
      "\n=== voice ===\nNo scene references a voice clip; skipping.\n" +
        "  Run with --voice (and ELEVENLABS_API_KEY set) to generate voice-over.",
    );
  } else {
    console.log("\n=== voice ===\nAll referenced voice clips exist; skipping.");
  }

  runStage("validate", script("validate.mjs"), ["--slug", slug]);
  runStage(
    "render",
    script("render.mjs"),
    isFinal ? ["--slug", slug, "--final"] : ["--slug", slug],
  );

  console.log("\nPipeline finished. Review the file before publishing.");
} catch (error) {
  fail(error.message);
}
