import { existsSync, readFileSync } from "node:fs";
import {
  PUBLIC_ROOT,
  resolveInside,
  videoJsonPath,
  assertSafeSlug,
} from "./paths.mjs";

const LAYOUTS = new Set(["hook", "point", "outro"]);
const ASSET_TYPES = new Set(["image", "video"]);
const HEX = /^#[0-9a-fA-F]{6}$/;
const ID = /^[a-z0-9][a-z0-9-]*$/;

export const loadVideoData = (slug) => {
  const file = videoJsonPath(slug);
  if (!existsSync(file)) {
    throw new Error(`No video data at ${file}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`${file} is not valid JSON: ${error.message}`);
  }
  return { data: parsed, file };
};

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const isPositiveInt = (value) =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

/**
 * Validates the same shape src/schema.ts describes. TypeScript types are gone
 * at runtime, so this is the check that actually guards a render.
 *
 * Returns plain strings so the caller decides how to print them.
 */
export const validateVideoData = (data, slug) => {
  const errors = [];
  const warnings = [];
  const add = (where, message) => errors.push(`${where}: ${message}`);

  if (typeof data !== "object" || data === null) {
    return { errors: ["video.json: expected a JSON object"], warnings };
  }

  if (data.id !== slug) {
    add("id", `expected "${slug}" to match the folder name, got "${data.id}"`);
  }
  for (const field of ["title", "language", "template"]) {
    if (!isNonEmptyString(data[field])) {
      add(field, "required, must be a non-empty string");
    }
  }

  const format = data.format ?? {};
  for (const field of ["width", "height", "fps"]) {
    if (!isPositiveInt(format[field])) {
      add(`format.${field}`, "required, must be a positive integer");
    }
  }

  if (
    typeof data.transitionFrames !== "number" ||
    !Number.isInteger(data.transitionFrames) ||
    data.transitionFrames < 0
  ) {
    add("transitionFrames", "required, must be an integer >= 0");
  }

  const theme = data.theme ?? {};
  if (!HEX.test(theme.accent ?? "")) {
    add("theme.accent", 'required, must be a hex colour like "#ffd27a"');
  }
  if (!isNonEmptyString(theme.brand)) {
    add("theme.brand", "required, must be a non-empty string");
  }

  const checkAsset = (value, where) => {
    let absolute;
    try {
      absolute = resolveInside(PUBLIC_ROOT, value, where);
    } catch (error) {
      add(where, error.message);
      return;
    }
    if (!existsSync(absolute)) {
      add(where, `file not found: public/${value}`);
    }
  };

  if (data.music !== undefined) {
    if (typeof data.music !== "object" || data.music === null) {
      add("music", "must be an object with src and volume");
    } else {
      checkAsset(data.music.src, "music.src");
      if (
        typeof data.music.volume !== "number" ||
        data.music.volume < 0 ||
        data.music.volume > 1
      ) {
        add("music.volume", "must be a number between 0 and 1");
      }
    }
  }

  if (!Array.isArray(data.scenes) || data.scenes.length === 0) {
    add("scenes", "required, must be a non-empty array");
    return { errors, warnings };
  }

  const fps = isPositiveInt(format.fps) ? format.fps : 30;
  const seen = new Set();
  let shortestFrames = Infinity;

  data.scenes.forEach((scene, index) => {
    const where = `scenes[${index}]${scene?.id ? ` (${scene.id})` : ""}`;

    if (typeof scene !== "object" || scene === null) {
      add(where, "must be an object");
      return;
    }
    if (!ID.test(scene.id ?? "")) {
      add(`${where}.id`, "required, lowercase letters, digits and hyphens");
    } else if (seen.has(scene.id)) {
      add(`${where}.id`, `duplicate scene id "${scene.id}"`);
    } else {
      seen.add(scene.id);
    }

    if (!LAYOUTS.has(scene.layout)) {
      add(
        `${where}.layout`,
        `must be one of ${[...LAYOUTS].join(", ")}, got "${scene.layout}"`,
      );
    }
    if (!isNonEmptyString(scene.narration)) {
      add(`${where}.narration`, "required, must be a non-empty string");
    }
    if (!isNonEmptyString(scene.caption)) {
      add(`${where}.caption`, "required, must be a non-empty string");
    }

    if (typeof scene.durationSec !== "number" || scene.durationSec <= 0) {
      add(`${where}.durationSec`, "required, must be a number greater than 0");
    } else {
      const frames = Math.round(scene.durationSec * fps);
      shortestFrames = Math.min(shortestFrames, frames);
      if (scene.durationSec < 2) {
        warnings.push(
          `${where}.durationSec is ${scene.durationSec}s; under 2s is hard to read`,
        );
      }
      if (isNonEmptyString(scene.narration)) {
        // Vietnamese is largely monosyllabic, so whitespace tokens are close
        // to syllables. Narration TTS sits around 3.5-4.5 syllables/second;
        // 4 flags only genuinely tight scenes. This is a sanity check, not a
        // measurement - verify against the real clips after video:voice.
        const words = scene.narration.trim().split(/\s+/).length;
        const needed = words / 4;
        if (needed > scene.durationSec) {
          warnings.push(
            `${where}: narration is ~${words} words (~${needed.toFixed(1)}s) ` +
              `but durationSec is ${scene.durationSec}s; the voice-over may be cut off`,
          );
        }
      }
    }

    if (scene.points !== undefined) {
      if (
        !Array.isArray(scene.points) ||
        !scene.points.every((point) => isNonEmptyString(point))
      ) {
        add(`${where}.points`, "must be an array of non-empty strings");
      }
    }
    if (scene.layout === "point" && (scene.points ?? []).length === 0) {
      warnings.push(`${where}: layout "point" with no points renders empty`);
    }

    for (const field of ["label", "badge", "tip", "cta"]) {
      if (scene[field] !== undefined && !isNonEmptyString(scene[field])) {
        add(`${where}.${field}`, "must be a non-empty string when present");
      }
    }

    if (scene.accent !== undefined && !HEX.test(scene.accent)) {
      add(`${where}.accent`, 'must be a hex colour like "#ffd27a"');
    }

    if (scene.assetType !== undefined && !ASSET_TYPES.has(scene.assetType)) {
      add(
        `${where}.assetType`,
        `must be one of ${[...ASSET_TYPES].join(", ")}`,
      );
    }
    if (scene.asset !== undefined) {
      checkAsset(scene.asset, `${where}.asset`);
    } else {
      warnings.push(`${where}: no asset, the scene renders on a plain background`);
    }
    if (scene.voice !== undefined) {
      checkAsset(scene.voice, `${where}.voice`);
    }
  });

  if (
    Number.isInteger(data.transitionFrames) &&
    shortestFrames !== Infinity &&
    data.transitionFrames >= shortestFrames
  ) {
    add(
      "transitionFrames",
      `${data.transitionFrames} is not shorter than the shortest scene ` +
        `(${shortestFrames} frames); transitions would overlap a whole scene`,
    );
  }

  return { errors, warnings };
};

export const totalDurationInFrames = (data) => {
  const fps = data.format.fps;
  const scenes = data.scenes.reduce(
    (sum, scene) => sum + Math.round(scene.durationSec * fps),
    0,
  );
  const overlaps = Math.max(0, data.scenes.length - 1) * data.transitionFrames;
  return Math.max(1, scenes - overlaps);
};

/** Loads and validates in one step; throws with every problem listed. */
export const loadValidVideoData = (slug) => {
  assertSafeSlug(slug);
  const { data, file } = loadVideoData(slug);
  const { errors, warnings } = validateVideoData(data, slug);
  if (errors.length > 0) {
    throw new Error(
      `${file} is not valid:\n` + errors.map((e) => `  - ${e}`).join("\n"),
    );
  }
  return { data, file, warnings };
};
