import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  PUBLIC_ROOT,
  assertSafeSlug,
  resolveInside,
  videoDir,
  videoJsonPath,
} from "./paths.mjs";

const LAYOUTS = new Set(["hook", "point", "food", "outro"]);
const PROVIDERS = new Set(["edge", "elevenlabs"]);
const HEX = /^#[0-9a-fA-F]{6}$/;
const ID = /^[a-z0-9][a-z0-9-]*$/;

/** Seconds the map intro takes; keep in sync with MAP_INTRO_SEC in src/MapIntro.tsx. */
export const MAP_INTRO_SEC = 2;

/** How many dishes a "point" scene's list fits between headline and subtitles. */
const MAX_POINT_DISHES = 3;

/** Silence kept after a voice clip before its scene ends. */
export const VOICE_TAIL_SEC = 0.6;

/**
 * Measured with Edge TTS vi-VN-HoaiMyNeural at +10%: about 3.2 syllables a
 * second. Only used to warn before any voice-over exists; afterwards the real
 * clip lengths are checked instead.
 */
const SYLLABLES_PER_SECOND = 3.2;

export const voiceoverPath = (slug) => path.join(videoDir(slug), "voiceover.json");

export const loadVideoData = (slug) => {
  const file = videoJsonPath(slug);
  if (!existsSync(file)) {
    throw new Error(`No video data at ${file}`);
  }
  try {
    return { data: JSON.parse(readFileSync(file, "utf8")), file };
  } catch (error) {
    throw new Error(`${file} is not valid JSON: ${error.message}`);
  }
};

export const loadVoiceover = (slug) => {
  const file = voiceoverPath(slug);
  if (!existsSync(file)) {
    return { clips: {} };
  }
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`${file} is not valid JSON: ${error.message}`);
  }
};

/** Identifies what a clip was generated from, to skip unchanged clips. */
export const clipHash = (narration, narrator) =>
  createHash("sha256")
    .update(
      JSON.stringify([
        narration,
        narrator.provider,
        narrator.voice ?? "",
        narrator.rate ?? "",
        narrator.model ?? "",
      ]),
    )
    .digest("hex")
    .slice(0, 16);

export const DEFAULT_NARRATOR = {
  provider: "edge",
  voice: "vi-VN-HoaiMyNeural",
  rate: "+10%",
};

export const resolveNarrator = (data) => ({
  ...DEFAULT_NARRATOR,
  ...(data.narrator ?? {}),
});

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const isPositiveInt = (value) =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

const isFiniteNumber = (value) =>
  typeof value === "number" && Number.isFinite(value);

/** Web Mercator, 512px tiles - same maths as src/map-projection.ts. */
const toPlatePixel = ([lng, lat], plate) => {
  const project = ([x, y]) => {
    const world = 512 * Math.pow(2, plate.zoom);
    const sin = Math.sin((y * Math.PI) / 180);
    return [
      ((x + 180) / 360) * world,
      (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * world,
    ];
  };
  const [cx, cy] = project(plate.center);
  const [px, py] = project([lng, lat]);
  return [px - cx + plate.width / 2, py - cy + plate.height / 2];
};

/**
 * Validates video.json (and voiceover.json, when present) against the shape
 * src/schema.ts describes. TypeScript types are gone at runtime, so this is
 * the check that actually guards a render.
 */
export const validateVideoData = (data, slug, voiceover = { clips: {} }) => {
  const errors = [];
  const warnings = [];
  const add = (where, message) => errors.push(`${where}: ${message}`);
  const warn = (where, message) => warnings.push(`${where}: ${message}`);

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

  if (data.region !== undefined && !isNonEmptyString(data.region)) {
    add("region", "must be a non-empty string when present");
  }

  const format = data.format ?? {};
  for (const field of ["width", "height", "fps"]) {
    if (!isPositiveInt(format[field])) {
      add(`format.${field}`, "required, must be a positive integer");
    }
  }
  const fps = isPositiveInt(format.fps) ? format.fps : 30;

  if (!Number.isInteger(data.transitionFrames) || data.transitionFrames < 0) {
    add("transitionFrames", "required, must be an integer >= 0");
  }
  const leadSec = Number.isInteger(data.transitionFrames)
    ? data.transitionFrames / fps
    : 0;

  const theme = data.theme ?? {};
  if (!HEX.test(theme.accent ?? "")) {
    add("theme.accent", 'required, must be a hex colour like "#ffd27a"');
  }
  if (!isNonEmptyString(theme.brand)) {
    add("theme.brand", "required, must be a non-empty string");
  }

  if (data.narrator !== undefined) {
    if (!PROVIDERS.has(data.narrator?.provider)) {
      add(
        "narrator.provider",
        `must be one of ${[...PROVIDERS].join(", ")}, got "${data.narrator?.provider}"`,
      );
    }
    for (const field of ["voice", "rate", "model"]) {
      const value = data.narrator?.[field];
      if (value !== undefined && !isNonEmptyString(value)) {
        add(`narrator.${field}`, "must be a non-empty string when present");
      }
    }
  }

  if (data.subtitles !== undefined && typeof data.subtitles !== "boolean") {
    add("subtitles", "must be true or false");
  }

  const checkFile = (value, where) => {
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
      checkFile(data.music.src, "music.src");
      if (
        !isFiniteNumber(data.music.volume) ||
        data.music.volume < 0 ||
        data.music.volume > 1
      ) {
        add("music.volume", "must be a number between 0 and 1");
      }
    }
  }

  const plate = data.map;
  let plateValid = false;
  if (plate !== undefined) {
    if (typeof plate !== "object" || plate === null) {
      add("map", "must be an object");
    } else {
      const before = errors.length;
      checkFile(plate.plate, "map.plate");
      if (!isNonEmptyString(plate.style)) add("map.style", "required style URL");
      if (
        !Array.isArray(plate.center) ||
        plate.center.length !== 2 ||
        !plate.center.every(isFiniteNumber)
      ) {
        add("map.center", "must be [longitude, latitude]");
      }
      if (!isFiniteNumber(plate.zoom) || plate.zoom < 0 || plate.zoom > 22) {
        add("map.zoom", "must be a number between 0 and 22");
      }
      if (!isPositiveInt(plate.width)) add("map.width", "must be a positive integer");
      if (!isPositiveInt(plate.height)) add("map.height", "must be a positive integer");
      if (!isNonEmptyString(plate.attribution)) {
        add("map.attribution", "required: the map data licence asks for it");
      }
      plateValid = errors.length === before;
    }
  }

  if (!Array.isArray(data.scenes) || data.scenes.length === 0) {
    add("scenes", "required, must be a non-empty array");
    return { errors, warnings };
  }

  const narrator = resolveNarrator(data);
  const clips = voiceover?.clips ?? {};
  const seen = new Set();
  let shortestFrames = Infinity;

  data.scenes.forEach((scene, index) => {
    const where = `scenes[${index}]${scene?.id ? ` (${scene.id})` : ""}`;

    if (typeof scene !== "object" || scene === null) {
      add(where, "must be an object");
      return;
    }

    // Fields from the first schema version, with where they went.
    if (scene.asset !== undefined || scene.assetType !== undefined) {
      add(`${where}.asset`, 'replaced by "gallery": ["path/to/image.jpg", ...]');
    }
    if (scene.voice !== undefined) {
      add(
        `${where}.voice`,
        "voice clips now live in voiceover.json; remove this field and run video:voice",
      );
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

    const durationOk = isFiniteNumber(scene.durationSec) && scene.durationSec > 0;
    if (!durationOk) {
      add(`${where}.durationSec`, "required, must be a number greater than 0");
    } else {
      shortestFrames = Math.min(shortestFrames, Math.round(scene.durationSec * fps));
    }

    for (const field of ["label", "badge", "tip", "cta"]) {
      if (scene[field] !== undefined && !isNonEmptyString(scene[field])) {
        add(`${where}.${field}`, "must be a non-empty string when present");
      }
    }
    if (scene.accent !== undefined && !HEX.test(scene.accent)) {
      add(`${where}.accent`, 'must be a hex colour like "#ffd27a"');
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
      warn(where, 'layout "point" with no points renders an empty list');
    }

    if (scene.gallery !== undefined) {
      if (!Array.isArray(scene.gallery) || scene.gallery.length === 0) {
        add(`${where}.gallery`, "must be a non-empty array of paths");
      } else {
        scene.gallery.forEach((item, i) => checkFile(item, `${where}.gallery[${i}]`));
      }
    } else if (scene.layout !== "food") {
      warn(where, "no gallery, the photo area stays empty");
    }

    if (scene.map !== undefined) {
      const target = scene.map;
      if (!plate) {
        add(`${where}.map`, 'needs a top-level "map" plate to zoom into');
      }
      if (!isFiniteNumber(target?.lng) || target.lng < -180 || target.lng > 180) {
        add(`${where}.map.lng`, "must be a longitude between -180 and 180");
      }
      if (!isFiniteNumber(target?.lat) || target.lat < -85 || target.lat > 85) {
        add(`${where}.map.lat`, "must be a latitude between -85 and 85");
      }
      if (!isNonEmptyString(target?.name)) {
        add(`${where}.map.name`, "required: the label on the pin");
      }
      if (plateValid && isFiniteNumber(target?.lng) && isFiniteNumber(target?.lat)) {
        const [x, y] = toPlatePixel([target.lng, target.lat], plate);
        // The zoomed view needs margin around the pin, not just the pin itself.
        const margin = 240;
        if (
          x < margin ||
          y < margin ||
          x > plate.width - margin ||
          y > plate.height - margin
        ) {
          add(
            `${where}.map`,
            `${target.name} lands at (${x.toFixed(0)}, ${y.toFixed(0)}) on a ` +
              `${plate.width}x${plate.height} plate, too close to the edge. ` +
              "Move map.center or lower map.zoom and run video:map again.",
          );
        }
      }
      if (durationOk && scene.durationSec < MAP_INTRO_SEC + 3) {
        warn(
          where,
          `${scene.durationSec}s leaves under 3s for photos after the ${MAP_INTRO_SEC}s map intro`,
        );
      }
    }

    if (scene.layout === "food" && (!Array.isArray(scene.dishes) || scene.dishes.length === 0)) {
      add(`${where}.dishes`, 'layout "food" needs at least one dish');
    } else if (scene.dishes !== undefined) {
      if (scene.layout !== "food" && scene.layout !== "point") {
        add(`${where}.dishes`, 'only the "food" and "point" layouts show dishes');
      }
      if (!Array.isArray(scene.dishes) || scene.dishes.length === 0) {
        add(`${where}.dishes`, "must be a non-empty array when present");
      } else {
        if (scene.layout === "point" && scene.dishes.length > MAX_POINT_DISHES) {
          add(
            `${where}.dishes`,
            `a "point" scene fits ${MAX_POINT_DISHES} dishes above the subtitles, got ${scene.dishes.length}`,
          );
        }
        scene.dishes.forEach((dish, i) => {
          const at = `${where}.dishes[${i}]`;
          for (const field of ["name", "place", "address"]) {
            if (!isNonEmptyString(dish?.[field])) {
              add(`${at}.${field}`, "required, must be a non-empty string");
            }
          }
          if (scene.layout === "food" || dish?.image !== undefined) {
            checkFile(dish?.image, `${at}.image`);
          }
          if (dish?.spokenAs !== undefined && !isNonEmptyString(dish.spokenAs)) {
            add(`${at}.spokenAs`, "must be a non-empty string when present");
          }
          if (
            dish?.rating !== undefined &&
            (!isFiniteNumber(dish.rating) || dish.rating < 0 || dish.rating > 5)
          ) {
            add(`${at}.rating`, "must be a number between 0 and 5");
          }
          const spoken = (dish?.spokenAs ?? dish?.name ?? "").toLowerCase();
          if (
            isNonEmptyString(scene.narration) &&
            spoken &&
            !scene.narration.toLowerCase().includes(spoken)
          ) {
            warn(
              at,
              `"${spoken}" is not in the narration, so its photo cannot switch in ` +
                "time with the voice. Set spokenAs to the words the narration uses.",
            );
          }
        });
      }
    }

    // Voice-over: once clips exist, check their real length; before that,
    // estimate from the narration.
    const clip = clips[scene.id];
    if (clip) {
      checkFile(clip.file, `voiceover.json: ${scene.id}.file`);
      if (durationOk && isFiniteNumber(clip.durationSec)) {
        const needed = leadSec + clip.durationSec + 0.2;
        if (scene.durationSec < needed) {
          add(
            `${where}.durationSec`,
            `${scene.durationSec}s is shorter than its voice-over ` +
              `(${clip.durationSec.toFixed(2)}s after a ${leadSec.toFixed(2)}s lead); ` +
              "it would be cut off. Run video:voice to refit scene lengths.",
          );
        }
      }
      if (
        isNonEmptyString(scene.narration) &&
        clip.hash !== clipHash(scene.narration, narrator)
      ) {
        warn(
          where,
          "narration or narrator changed since its voice-over was generated; run video:voice",
        );
      }
    } else if (durationOk && isNonEmptyString(scene.narration)) {
      const syllables = scene.narration.trim().split(/\s+/).length;
      const needed = leadSec + syllables / SYLLABLES_PER_SECOND + VOICE_TAIL_SEC;
      if (needed > scene.durationSec) {
        warn(
          where,
          `narration is ~${syllables} syllables (~${needed.toFixed(1)}s with lead and tail) ` +
            `but durationSec is ${scene.durationSec}s; video:voice will lengthen it`,
        );
      }
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

  for (const id of Object.keys(clips)) {
    if (!seen.has(id)) {
      warn("voiceover.json", `clip for "${id}" has no matching scene and is ignored`);
    }
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
export const loadValidVideoData = (slug, { requireVoiceFit = true } = {}) => {
  assertSafeSlug(slug);
  const { data, file } = loadVideoData(slug);
  const voiceover = loadVoiceover(slug);
  const { errors, warnings } = validateVideoData(
    data,
    slug,
    requireVoiceFit ? voiceover : { clips: {} },
  );
  if (errors.length > 0) {
    throw new Error(
      `${file} is not valid:\n` + errors.map((e) => `  - ${e}`).join("\n"),
    );
  }
  return { data, voiceover, file, warnings };
};
