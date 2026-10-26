#!/usr/bin/env node
/**
 * npm run video:voice -- --slug da-nang-3n2d [--dry-run]
 *
 * Turns each scene's narration into an MP3, then writes
 * data/videos/<slug>/voiceover.json with each clip's path, measured length
 * and word timings (used for subtitles and to time the food photos).
 * Scenes too short for their clip are lengthened in video.json, so voice-over
 * is never cut off.
 *
 * Which engine speaks is set in video.json under "narrator":
 *
 *   "edge"        Microsoft Edge's read-aloud voices. Free, no key, and it
 *                 returns word timings. Unofficial endpoint: fine for drafts;
 *                 see README before publishing commercially.
 *   "elevenlabs"  ElevenLabs. Needs ELEVENLABS_API_KEY (and a voice id in
 *                 narrator.voice or ELEVENLABS_VOICE_ID). No word timings,
 *                 so no subtitles and evenly spaced food photos.
 *
 * Credentials come from the environment and are never printed. A clip is
 * regenerated only when its narration or narrator settings changed.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "./lib/args.mjs";
import { probeDurationSec } from "./lib/media.mjs";
import { PUBLIC_ROOT, videoJsonPath, voiceDirRelative } from "./lib/paths.mjs";
import {
  VOICE_TAIL_SEC,
  clipHash,
  loadValidVideoData,
  resolveNarrator,
  totalDurationInFrames,
  voiceoverPath,
} from "./lib/video-data.mjs";

const { flags } = parseArgs(process.argv.slice(2));

const describeHttpError = (provider, status, body) => {
  const hint =
    status === 401 || status === 403
      ? "Check the API key."
      : status === 404
        ? "Check the voice id; that voice was not found."
        : status === 400 || status === 422
          ? "The request was rejected; check the voice/model settings and the narration text."
          : status === 429
            ? "Rate limited or out of quota. Wait and run again; finished clips are kept."
            : status >= 500
              ? "The service is failing. Run again in a few minutes; finished clips are kept."
              : "See the response above.";
  const snippet = body ? ` ${String(body).slice(0, 300)}` : "";
  return `${provider} returned HTTP ${status}.${snippet}\n  ${hint}`;
};

const lettersOnly = (text) =>
  text.normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

/**
 * Edge reports bare words; the narration has the punctuation. Pair them up so
 * subtitles read "Đà Nẵng?" rather than "Đà Nẵng" (src/Subtitles.tsx also
 * breaks lines on that punctuation).
 */
const toCaptions = (narration, boundaries) => {
  const tokens = narration.trim().split(/\s+/);
  let cursor = 0;
  return boundaries.map((boundary, index) => {
    let text = boundary.text;
    for (let k = cursor; k < Math.min(tokens.length, cursor + 3); k++) {
      if (lettersOnly(tokens[k]) === lettersOnly(boundary.text)) {
        text = tokens[k];
        cursor = k + 1;
        break;
      }
    }
    // Edge offsets are in 100-nanosecond ticks.
    const startMs = Math.round(boundary.offset / 10000);
    const endMs = Math.round((boundary.offset + boundary.duration) / 10000);
    return {
      text: (index === 0 ? "" : " ") + text,
      startMs,
      endMs,
      timestampMs: Math.round((startMs + endMs) / 2),
      confidence: null,
    };
  });
};

const providers = {
  edge: {
    describe: (narrator) => `Edge TTS, ${narrator.voice}, rate ${narrator.rate}`,
    missingCredentials: () => [],
    synthesise: async (text, narrator) => {
      const { EdgeTTS } = await import("@andresaya/edge-tts");
      try {
        const result = await new EdgeTTS().generate(text, narrator.voice, {
          rate: narrator.rate,
        });
        return {
          audio: Buffer.from(result.audio),
          words: toCaptions(text, result.wordBoundaries ?? []),
        };
      } catch (error) {
        throw new Error(
          `Edge TTS failed: ${error.message}\n` +
            "  It is a free online service with no SLA. Check your connection and run again; finished clips are kept.",
        );
      }
    },
  },

  elevenlabs: {
    describe: (narrator) =>
      `ElevenLabs, model ${narrator.model ?? "eleven_multilingual_v2"}`,
    missingCredentials: (narrator) =>
      [
        process.env.ELEVENLABS_API_KEY ? null : "ELEVENLABS_API_KEY",
        narrator.voice || process.env.ELEVENLABS_VOICE_ID
          ? null
          : "ELEVENLABS_VOICE_ID",
      ].filter(Boolean),
    synthesise: async (text, narrator) => {
      const voiceId = narrator.voice || process.env.ELEVENLABS_VOICE_ID;
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": process.env.ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text,
            model_id: narrator.model ?? "eleven_multilingual_v2",
          }),
        },
      );
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(describeHttpError("ElevenLabs", response.status, body));
      }
      return { audio: Buffer.from(await response.arrayBuffer()), words: [] };
    },
  },
};

/** One word per line keeps the file reviewable and its diffs small. */
const formatVoiceover = (voiceover) => {
  const ids = Object.keys(voiceover.clips);
  const lines = ["{", '  "clips": {'];
  ids.forEach((id, index) => {
    const clip = voiceover.clips[id];
    lines.push(`    ${JSON.stringify(id)}: {`);
    lines.push(`      "file": ${JSON.stringify(clip.file)},`);
    lines.push(`      "hash": ${JSON.stringify(clip.hash)},`);
    lines.push(`      "durationSec": ${clip.durationSec},`);
    if (clip.words.length === 0) {
      lines.push('      "words": []');
    } else {
      lines.push('      "words": [');
      clip.words.forEach((word, i) => {
        lines.push(`        ${JSON.stringify(word)}${i < clip.words.length - 1 ? "," : ""}`);
      });
      lines.push("      ]");
    }
    lines.push(`    }${index < ids.length - 1 ? "," : ""}`);
  });
  lines.push("  }", "}", "");
  return lines.join("\n");
};

const roundUpToHalf = (seconds) => Math.ceil(seconds * 2) / 2;

const main = async () => {
  const slug = requireSlug(flags, "video:voice");
  // Scene lengths are what this command fixes, so don't fail on them here.
  const { data, voiceover } = loadValidVideoData(slug, { requireVoiceFit: false });

  const narrator = resolveNarrator(data);
  const provider = providers[narrator.provider];
  const relDir = voiceDirRelative(slug);
  const leadSec = data.transitionFrames / data.format.fps;
  const previous = voiceover.clips ?? {};

  const planned = data.scenes.map((scene, index) => {
    const order = String(index + 1).padStart(2, "0");
    const file = `${relDir}/${order}-${scene.id}.mp3`;
    const absolute = path.join(PUBLIC_ROOT, file);
    const hash = clipHash(scene.narration, narrator);
    const old = previous[scene.id];
    const upToDate =
      existsSync(absolute) && old?.hash === hash && old?.file === file;
    return { scene, file, absolute, hash, upToDate, old };
  });
  const stale = planned.filter((item) => !item.upToDate);

  if (flags["dry-run"]) {
    console.log(`Narrator: ${provider.describe(narrator)}`);
    console.log(
      stale.length === 0
        ? "All clips are up to date."
        : `Would generate ${stale.length} clip(s):\n` +
            stale.map((item) => `  - ${item.file}`).join("\n"),
    );
    return;
  }

  const clips = {};

  if (stale.length > 0) {
    const missing = provider.missingCredentials(narrator);
    if (missing.length > 0) {
      throw new Error(
        `${stale.length} clip(s) need generating with ${narrator.provider}, ` +
          `but ${missing.join(" and ")} ${missing.length > 1 ? "are" : "is"} not set.\n` +
          '  Set them in your shell and run again, or set narrator.provider to "edge" (free, no key).',
      );
    }
    mkdirSync(path.join(PUBLIC_ROOT, relDir), { recursive: true });
    console.log(
      `Generating ${stale.length} of ${planned.length} clip(s): ${provider.describe(narrator)}`,
    );
  } else {
    console.log(`All ${planned.length} clips are up to date.`);
  }

  for (const item of planned) {
    if (item.upToDate) {
      clips[item.scene.id] = item.old;
      continue;
    }
    // Nothing is written until the audio is in hand, so a failure leaves no
    // placeholder behind. Finished clips are saved as we go, so a retry
    // resumes from the clip that failed.
    const { audio, words } = await provider.synthesise(item.scene.narration, narrator);
    if (!audio || audio.length === 0) {
      throw new Error(`Scene "${item.scene.id}": the service returned no audio. Run again.`);
    }
    writeFileSync(item.absolute, audio);
    const durationSec = Math.round(probeDurationSec(item.absolute) * 100) / 100;
    clips[item.scene.id] = { file: item.file, hash: item.hash, durationSec, words };
    writeFileSync(
      voiceoverPath(slug),
      formatVoiceover({ clips: { ...previous, ...clips } }),
    );
    console.log(`  ✓ ${item.file}  ${durationSec.toFixed(2)}s  ${words.length} words`);
  }

  // Drop clips for scenes that no longer exist.
  writeFileSync(voiceoverPath(slug), formatVoiceover({ clips }));

  let lengthened = false;
  console.log("\nFitting scenes to their voice-over:");
  for (const scene of data.scenes) {
    const clip = clips[scene.id];
    const needed = roundUpToHalf(leadSec + clip.durationSec + VOICE_TAIL_SEC);
    const before = scene.durationSec;
    if (scene.durationSec < needed) {
      scene.durationSec = needed;
      lengthened = true;
    }
    const note =
      scene.durationSec !== before
        ? `scene ${before}s → ${scene.durationSec}s`
        : `scene ${scene.durationSec}s ok`;
    console.log(`  ${scene.id.padEnd(14)} voice ${clip.durationSec.toFixed(2)}s   ${note}`);
  }
  if (lengthened) {
    writeFileSync(videoJsonPath(slug), JSON.stringify(data, null, 2) + "\n");
    console.log(`\nLengthened scenes in data/videos/${slug}/video.json`);
  }

  const total = totalDurationInFrames(data) / data.format.fps;
  console.log(`Video length is now ${total.toFixed(1)}s.`);
};

main().catch((error) => fail(error.message));
