#!/usr/bin/env node
/**
 * npm run video:import-voice -- --slug da-nang-3n2d --dir path/to/clips
 *                               [--trim day2-bana=12.95,outro=8.5]
 *
 * Brings in voice-over clips made outside this project (e.g. in Vbee Studio)
 * for a narrator whose provider has no API we use. <dir> holds one file per
 * scene named <scene-id>.mp3 (or .wav), each reading exactly that scene's
 * narration.
 *
 * Each clip is copied to public/ under the name video:voice would give it,
 * its length is measured and its word timings are estimated from the audio
 * (scripts/lib/align.mjs), then voiceover.json is written with the hash of
 * the current narration and narrator, so video:voice and video:validate treat
 * the clips as up to date. Scene lengths are refitted both ways: a new voice
 * can be faster than the old one, and a scene should not sit silent.
 *
 * --trim cuts a clip at the given second. Vbee's free tier sometimes appends
 * a spoken promo after the narration; cut it off here, or its words would be
 * spread over the subtitles and it would play in the video.
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { estimateWordTimings } from "./lib/align.mjs";
import { fail, parseArgs, requireSlug } from "./lib/args.mjs";
import { probeDurationSec, runRemotion } from "./lib/media.mjs";
import { PUBLIC_ROOT, videoJsonPath, voiceDirRelative } from "./lib/paths.mjs";
import {
  clipHash,
  loadValidVideoData,
  resolveNarrator,
  voiceoverPath,
} from "./lib/video-data.mjs";
import { fitScenesToVoice, formatVoiceover, logVideoLength } from "./lib/voiceover.mjs";

const { flags } = parseArgs(process.argv.slice(2));

try {
  const slug = requireSlug(flags, "video:import-voice");
  if (typeof flags.dir !== "string") {
    fail("--dir is required: the folder holding <scene-id>.mp3 for every scene");
  }
  const sourceDir = path.resolve(flags.dir);
  const { data } = loadValidVideoData(slug, { requireVoiceFit: false });
  const narrator = resolveNarrator(data);

  const sources = data.scenes.map((scene) => {
    const found = ["mp3", "wav"]
      .map((ext) => path.join(sourceDir, `${scene.id}.${ext}`))
      .find((file) => existsSync(file));
    return { scene, source: found };
  });
  const missing = sources.filter((item) => !item.source).map((item) => `${item.scene.id}.mp3`);
  if (missing.length > 0) {
    fail(`missing in ${sourceDir}:\n` + missing.map((name) => `  - ${name}`).join("\n"));
  }

  const trims = {};
  if (flags.trim !== undefined) {
    for (const entry of String(flags.trim).split(",")) {
      const [id, seconds] = entry.split("=");
      const at = Number(seconds);
      if (!data.scenes.some((scene) => scene.id === id) || !(at > 0)) {
        fail(`--trim expects <scene-id>=<seconds>[,...], got "${entry}"`);
      }
      trims[id] = at;
    }
  }

  const relDir = voiceDirRelative(slug);
  mkdirSync(path.join(PUBLIC_ROOT, relDir), { recursive: true });
  console.log(`Importing ${sources.length} clip(s) for ${narrator.provider}, ${narrator.voice}`);

  const clips = {};
  sources.forEach(({ scene, source }, index) => {
    const order = String(index + 1).padStart(2, "0");
    const file = `${relDir}/${order}-${scene.id}${path.extname(source)}`;
    const absolute = path.join(PUBLIC_ROOT, file);
    if (trims[scene.id] === undefined) {
      copyFileSync(source, absolute);
    } else {
      const result = runRemotion(
        ["ffmpeg", "-y", "-i", source, "-t", String(trims[scene.id]), "-c:a", "libmp3lame", "-b:a", "128k", absolute],
        { stdio: ["ignore", "ignore", "pipe"] },
      );
      if (result.status !== 0) {
        fail(`ffmpeg could not trim ${source}:\n${(result.stderr ?? "").slice(-400)}`);
      }
    }
    const durationSec = Math.round(probeDurationSec(absolute) * 100) / 100;
    const { words, phrases, clauses } = estimateWordTimings(absolute, scene.narration);
    clips[scene.id] = {
      file,
      hash: clipHash(scene.narration, narrator),
      durationSec,
      words,
    };
    console.log(
      `  ✓ ${file}  ${durationSec.toFixed(2)}s  ${words.length} words, ` +
        `${phrases}/${clauses} phrases matched to pauses`,
    );
  });

  writeFileSync(voiceoverPath(slug), formatVoiceover({ clips }));

  if (fitScenesToVoice(data, clips, { shrink: true })) {
    writeFileSync(videoJsonPath(slug), JSON.stringify(data, null, 2) + "\n");
    console.log(`\nRefitted scene lengths in data/videos/${slug}/video.json`);
  }
  logVideoLength(data);
} catch (error) {
  fail(error.message);
}
