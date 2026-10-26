#!/usr/bin/env node
/**
 * npm run video:validate -- --slug da-nang-3n2d
 *
 * Checks video.json against the schema and confirms every referenced local
 * file exists. Makes no network requests.
 */
import { fail, parseArgs, requireSlug } from "./lib/args.mjs";
import {
  loadVideoData,
  totalDurationInFrames,
  validateVideoData,
} from "./lib/video-data.mjs";

const { flags } = parseArgs(process.argv.slice(2));

try {
  const slug = requireSlug(flags, "video:validate");
  const { data, file } = loadVideoData(slug);
  const { errors, warnings } = validateVideoData(data, slug);

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
  const seconds = frames / data.format.fps;
  console.log(
    `  ✓ ${data.scenes.length} scenes, ${frames} frames ` +
      `(${seconds.toFixed(1)}s) at ${data.format.width}x${data.format.height}@${data.format.fps}`,
  );
  const withVoice = data.scenes.filter((scene) => scene.voice).length;
  console.log(
    `  ✓ voice clips referenced: ${withVoice}/${data.scenes.length}` +
      (withVoice === 0 ? " (video will render without voice-over)" : ""),
  );
  if (warnings.length > 0) {
    console.log(`\nValid, with ${warnings.length} warning(s).`);
  } else {
    console.log("\nValid.");
  }
} catch (error) {
  fail(error.message);
}
