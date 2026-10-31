#!/usr/bin/env node
/**
 * npm run video:vbee-script -- --slug da-nang-3n2d --out path/to/clips [--scenes hook,outro]
 *
 * Writes the Playwright code that makes this video's voice-over in Vbee Studio
 * with the house voice (HN - Ngọc Huyền): <out>/vbee-studio-1.js, -2.js, ...,
 * three scenes each so one run stays within the Playwright tool's time limit.
 * Run each with the Playwright MCP tool browser_run_code_unsafe (its
 * "filename" argument) in a browser signed in to studio.vbee.vn; the clips
 * land in <out> as <scene-id>.mp3, ready for video:import-voice.
 *
 * Prints the characters and Studio points the run will spend first: the house
 * voice costs one point per character.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "./lib/args.mjs";
import { PROJECT_ROOT } from "./lib/paths.mjs";
import { loadValidVideoData } from "./lib/video-data.mjs";

const SCENES_PER_RUN = 3;
const TEMPLATE = path.join(PROJECT_ROOT, "scripts", "vbee-studio", "generate.template.js");

const { flags } = parseArgs(process.argv.slice(2));

try {
  const slug = requireSlug(flags, "video:vbee-script");
  if (typeof flags.out !== "string") {
    fail("--out is required: the folder the clips (and these scripts) go in");
  }
  const out = path.resolve(flags.out);
  const { data } = loadValidVideoData(slug, { requireVoiceFit: false });

  const wanted = typeof flags.scenes === "string" ? flags.scenes.split(",") : null;
  const unknown = (wanted ?? []).filter((id) => !data.scenes.some((scene) => scene.id === id));
  if (unknown.length > 0) fail(`no such scene: ${unknown.join(", ")}`);
  const scenes = data.scenes
    .filter((scene) => !wanted || wanted.includes(scene.id))
    .map((scene) => [scene.id, scene.narration]);

  mkdirSync(out, { recursive: true });
  const template = readFileSync(TEMPLATE, "utf8");
  const files = [];
  for (let i = 0; i < scenes.length; i += SCENES_PER_RUN) {
    const file = path.join(out, `vbee-studio-${files.length + 1}.js`);
    // Function replacers: a narration containing "$&" must not be expanded.
    const code = template
      .replace("const DIR = __DIR__;", () => `const DIR = ${JSON.stringify(out.split(path.sep).join("/"))};`)
      .replace("const SCENES = __SCENES__;", () => `const SCENES = ${JSON.stringify(scenes.slice(i, i + SCENES_PER_RUN))};`);
    writeFileSync(file, code);
    files.push(file);
  }

  const characters = scenes.reduce((sum, [, text]) => sum + text.length, 0);
  console.log(`${scenes.length} scene(s), ${characters} characters ≈ ${characters} Studio points`);
  for (const file of files) console.log(`  ${file}`);
  console.log(
    "\nRun each file with Playwright's browser_run_code_unsafe, then:\n" +
      `  npm run video:import-voice -- --slug ${slug} --dir "${out}"`,
  );
} catch (error) {
  fail(error.message);
}
