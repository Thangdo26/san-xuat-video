#!/usr/bin/env node
/**
 * npm run video:voice -- --slug da-nang-3n2d
 *
 * Turns each scene's narration into an MP3 with ElevenLabs and writes the
 * resulting path back into video.json.
 *
 * Credentials come from the environment and are never printed:
 *   ELEVENLABS_API_KEY    required, only when a clip actually needs generating
 *   ELEVENLABS_VOICE_ID   required, the voice to speak with
 *   ELEVENLABS_MODEL_ID   optional, defaults to eleven_multilingual_v2
 *
 * A clip is regenerated only when its narration, voice or model changed, so
 * editing one line does not re-bill the whole video.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "./lib/args.mjs";
import {
  PUBLIC_ROOT,
  voiceDirRelative,
  voiceLockPath,
  videoJsonPath,
} from "./lib/paths.mjs";
import { loadValidVideoData } from "./lib/video-data.mjs";

const DEFAULT_MODEL = "eleven_multilingual_v2";
const API = "https://api.elevenlabs.io/v1/text-to-speech";

const { flags } = parseArgs(process.argv.slice(2));

const clipHash = (narration, voiceId, modelId) =>
  createHash("sha256")
    .update(`${narration}\u0000${voiceId}\u0000${modelId}`)
    .digest("hex")
    .slice(0, 16);

const readLock = (slug) => {
  const file = voiceLockPath(slug);
  if (!existsSync(file)) return {};
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return {};
  }
};

const describeApiError = (status, body) => {
  const hint =
    status === 401
      ? "Check ELEVENLABS_API_KEY."
      : status === 404
        ? "Check ELEVENLABS_VOICE_ID; that voice was not found."
        : status === 422
          ? "The request was rejected; check ELEVENLABS_MODEL_ID and the narration text."
          : status === 429
            ? "Rate limited or out of quota. Wait and run the command again; finished clips are kept."
            : status >= 500
              ? "ElevenLabs is failing. Run the command again in a few minutes; finished clips are kept."
              : "See the response above.";
  const snippet = body ? ` ${String(body).slice(0, 300)}` : "";
  return `ElevenLabs returned HTTP ${status}.${snippet}\n  ${hint}`;
};

const main = async () => {
  const slug = requireSlug(flags, "video:voice");
  const { data } = loadValidVideoData(slug);

  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? "";
  const modelId = process.env.ELEVENLABS_MODEL_ID ?? DEFAULT_MODEL;
  const apiKey = process.env.ELEVENLABS_API_KEY ?? "";

  const relDir = voiceDirRelative(slug);
  const absDir = path.join(PUBLIC_ROOT, relDir);
  const lock = readLock(slug);

  const planned = data.scenes.map((scene, index) => {
    const order = String(index + 1).padStart(2, "0");
    const relative = `${relDir}/${order}-${scene.id}.mp3`;
    const absolute = path.join(PUBLIC_ROOT, relative);
    const hash = voiceId ? clipHash(scene.narration, voiceId, modelId) : null;
    const upToDate =
      existsSync(absolute) && hash !== null && lock[scene.id] === hash;
    return { scene, relative, absolute, hash, upToDate };
  });

  const stale = planned.filter((item) => !item.upToDate);

  if (stale.length === 0 && planned.every((item) => existsSync(item.absolute))) {
    console.log(
      `All ${planned.length} voice clips are up to date; nothing to generate.`,
    );
    writeVoicePaths(slug, data, planned);
    return;
  }

  if (flags["dry-run"]) {
    console.log(`Would generate ${stale.length} clip(s):`);
    for (const item of stale) {
      console.log(`  - ${item.relative}`);
    }
    return;
  }

  if (!apiKey || !voiceId) {
    const missing = [
      !apiKey ? "ELEVENLABS_API_KEY" : null,
      !voiceId ? "ELEVENLABS_VOICE_ID" : null,
    ].filter(Boolean);
    throw new Error(
      `${stale.length} voice clip(s) need generating but ${missing.join(" and ")} ` +
        `${missing.length > 1 ? "are" : "is"} not set.\n` +
        `  Set them in your shell, then run the command again:\n` +
        `    export ELEVENLABS_API_KEY=...\n` +
        `    export ELEVENLABS_VOICE_ID=...\n` +
        `  Or run with --dry-run to see what would be generated.`,
    );
  }

  mkdirSync(absDir, { recursive: true });
  console.log(
    `Generating ${stale.length} of ${planned.length} clip(s) with model ${modelId}`,
  );

  for (const item of stale) {
    const response = await fetch(`${API}/${encodeURIComponent(voiceId)}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: item.scene.narration,
        model_id: modelId,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      // No placeholder file is written, so a retry picks up exactly here.
      throw new Error(
        `Scene "${item.scene.id}": ${describeApiError(response.status, body)}`,
      );
    }

    const audio = Buffer.from(await response.arrayBuffer());
    if (audio.length === 0) {
      throw new Error(
        `Scene "${item.scene.id}": ElevenLabs returned an empty body. Run the command again.`,
      );
    }
    writeFileSync(item.absolute, audio);
    lock[item.scene.id] = item.hash;
    writeFileSync(voiceLockPath(slug), JSON.stringify(lock, null, 2) + "\n");
    console.log(`  ✓ ${item.relative} (${(audio.length / 1024).toFixed(0)} KB)`);
  }

  writeVoicePaths(slug, data, planned);
  console.log("\nDone.");
};

/** Points video.json at the clips so the composition can play them. */
const writeVoicePaths = (slug, data, planned) => {
  let changed = false;
  for (const item of planned) {
    if (!existsSync(item.absolute)) continue;
    const scene = data.scenes.find((candidate) => candidate.id === item.scene.id);
    if (scene && scene.voice !== item.relative) {
      scene.voice = item.relative;
      changed = true;
    }
  }
  if (changed) {
    writeFileSync(videoJsonPath(slug), JSON.stringify(data, null, 2) + "\n");
    console.log(`Updated voice paths in data/videos/${slug}/video.json`);
  }
};

main().catch((error) => fail(error.message));
