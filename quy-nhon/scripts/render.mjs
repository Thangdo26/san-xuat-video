#!/usr/bin/env node
/**
 * npm run video:render -- --slug da-nang-3n2d [--final] [--crf 23]
 *
 * Validates the data, then renders H.264 MP4 at the size and length the data
 * declares. Writes output/<slug>/draft.mp4 unless --final is passed, and never
 * overwrites final.mp4 without it.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "./lib/args.mjs";
import { runRemotion } from "./lib/media.mjs";
import { outputDir, PROJECT_ROOT } from "./lib/paths.mjs";
import { loadValidVideoData, totalDurationInFrames } from "./lib/video-data.mjs";

const COMPOSITION_ID = "TravelShort";
const ENTRY_POINT = "src/index.ts";

const { flags } = parseArgs(process.argv.slice(2));

try {
  const slug = requireSlug(flags, "video:render");
  const isFinal = flags.final === true || flags.final === "true";

  const crf = flags.crf === undefined ? 23 : Number(flags.crf);
  if (!Number.isInteger(crf) || crf < 0 || crf > 51) {
    fail(`--crf must be an integer between 0 and 51, got "${flags.crf}"`);
  }

  const { data, voiceover, warnings } = loadValidVideoData(slug);
  for (const warning of warnings) {
    console.warn(`  ! ${warning}`);
  }

  const dir = outputDir(slug);
  mkdirSync(dir, { recursive: true });
  const outFile = path.join(dir, isFinal ? "final.mp4" : "draft.mp4");
  if (isFinal && existsSync(outFile)) {
    console.log(`Overwriting existing ${path.relative(PROJECT_ROOT, outFile)}`);
  }

  // The composition takes the video and its generated voice-over as one
  // props object. Passed as a file: quoting inline JSON differs between
  // cmd.exe, PowerShell and Git Bash, and a path avoids all of it.
  const propsFile = path.join(dir, "props.json");
  writeFileSync(propsFile, JSON.stringify({ ...data, voiceover }));

  const frames = totalDurationInFrames(data);
  const voiced = Object.keys(voiceover.clips ?? {}).length;
  console.log(
    `Rendering ${COMPOSITION_ID}: ${data.scenes.length} scenes, ${frames} frames ` +
      `(${(frames / data.format.fps).toFixed(1)}s) at ` +
      `${data.format.width}x${data.format.height}@${data.format.fps}, ` +
      `voice-over ${voiced}/${data.scenes.length}, music ${data.music ? "on" : "off"}`,
  );

  const result = runRemotion(
    [
      "render",
      ENTRY_POINT,
      COMPOSITION_ID,
      outFile,
      `--props=${propsFile}`,
      "--codec=h264",
      // Remotion defaults to CRF 18, ~15 Mbps on photo-heavy frames. 23 looks
      // the same here at about a third of the size, and social platforms
      // re-encode anyway.
      `--crf=${crf}`,
      "--log=info",
    ],
    { stdio: "inherit" },
  );

  if (result.error) {
    fail(`Could not start Remotion: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`Remotion exited with code ${result.status}`);
  }

  console.log(`\n✓ ${outFile}`);
  if (!isFinal) {
    console.log("  Review it, then re-run with --final to write final.mp4.");
  }
} catch (error) {
  fail(error.message);
}
