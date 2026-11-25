#!/usr/bin/env node
/**
 * npm run video:validate -- --slug da-nang-3n2d
 *
 * Checks video.json (and voiceover.json, when present) against the schema and
 * confirms every referenced local file exists. Makes no network requests.
 */
import { fail, parseArgs, requireSlug } from "./lib/args.mjs";
import {
  loadVideoData,
  loadVoiceover,
  totalDurationInFrames,
  validateVideoData,
} from "./lib/video-data.mjs";

const { flags } = parseArgs(process.argv.slice(2));

try {
  const slug = requireSlug(flags, "video:validate");
  const { data, file } = loadVideoData(slug);
  const voiceover = loadVoiceover(slug);
  const { errors, warnings } = validateVideoData(data, slug, voiceover);

  console.log(`Validating ${file}`);

  for (const warning of warnings) {
    console.warn(`  ! ${warning}`);
  }

  if (errors.length > 0) {
    console.error(`\n${errors.length} problem(s) found:`);
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    fail("Validation failed. Fix the fields above and run again.");
  }

  const frames = totalDurationInFrames(data);
  console.log(
    `  ✓ ${data.scenes.length} scenes, ${frames} frames ` +
      `(${(frames / data.format.fps).toFixed(1)}s) at ` +
      `${data.format.width}x${data.format.height}@${data.format.fps}`,
  );
  const voiced = data.scenes.filter((scene) => voiceover.clips?.[scene.id]).length;
  console.log(
    `  ✓ voice-over: ${voiced}/${data.scenes.length} scenes` +
      (voiced === 0 ? " (run video:voice to generate it)" : ""),
  );
  console.log(warnings.length > 0 ? `\nValid, with ${warnings.length} warning(s).` : "\nValid.");
} catch (error) {
  fail(error.message);
}
