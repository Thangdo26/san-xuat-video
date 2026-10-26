#!/usr/bin/env node
/**
 * npm run video:render -- --slug da-nang-3n2d
 * npm run video:render -- --slug da-nang-3n2d --final
 *
 * Validates the data, then renders H.264 MP4 at the size and length the data
 * declares. Writes output/<slug>/draft.mp4 unless --final is passed, and never
 * overwrites final.mp4 without it.
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "./lib/args.mjs";
import { outputDir, PROJECT_ROOT, videoJsonPath } from "./lib/paths.mjs";
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

  const { data, warnings } = loadValidVideoData(slug);
  for (const warning of warnings) {
    console.warn(`  ! ${warning}`);
  }

  const dir = outputDir(slug);
  mkdirSync(dir, { recursive: true });
  const outFile = path.join(dir, isFinal ? "final.mp4" : "draft.mp4");

  if (!isFinal && path.basename(outFile) === "final.mp4") {
    fail("Refusing to write final.mp4 without --final");
  }
  if (isFinal && existsSync(outFile)) {
    console.log(`Overwriting existing ${path.relative(PROJECT_ROOT, outFile)}`);
  }

  const frames = totalDurationInFrames(data);
  console.log(
    `Rendering ${COMPOSITION_ID}: ${data.scenes.length} scenes, ${frames} frames ` +
      `(${(frames / data.format.fps).toFixed(1)}s) at ` +
      `${data.format.width}x${data.format.height}@${data.format.fps}`,
  );

  // Props are passed as a file path: quoting inline JSON differs between
  // cmd.exe, PowerShell and Git Bash, and a path avoids all of it.
  const args = [
    "render",
    ENTRY_POINT,
    COMPOSITION_ID,
    outFile,
    `--props=${videoJsonPath(slug)}`,
    "--codec=h264",
    // Remotion defaults to CRF 18, which gives ~15 Mbps for photo-heavy
    // frames. 23 is visually equivalent here at roughly a third of the size,
    // and social platforms re-encode anyway. Override with --crf.
    `--crf=${crf}`,
    "--log=info",
  ];

  // Run the CLI's JS entry with this Node binary rather than going through
  // npx: Node refuses to spawn npx.cmd on Windows without a shell, and a
  // shell would reintroduce the quoting problems above. The bin path is read
  // from the package rather than hard-coded.
  const cliPackageJson = createRequire(import.meta.url).resolve(
    "@remotion/cli/package.json",
  );
  const cli = path.join(
    path.dirname(cliPackageJson),
    JSON.parse(readFileSync(cliPackageJson, "utf8")).bin.remotion,
  );
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
  });

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
