import path from "node:path";
import { fileURLToPath } from "node:url";

export const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

export const DATA_ROOT = path.join(PROJECT_ROOT, "data", "videos");
export const PUBLIC_ROOT = path.join(PROJECT_ROOT, "public");
export const OUTPUT_ROOT = path.join(PROJECT_ROOT, "output");

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

/**
 * Slugs end up in file paths, so anything that is not a plain lowercase
 * identifier is rejected rather than sanitised.
 */
export const assertSafeSlug = (slug) => {
  if (typeof slug !== "string" || !SLUG_PATTERN.test(slug)) {
    throw new Error(
      `Invalid --slug "${slug}". Use lowercase letters, digits and hyphens, e.g. da-nang-3n2d.`,
    );
  }
  return slug;
};

/**
 * Resolves a path that came from a data file against a trusted base and
 * refuses anything that escapes it, so a crafted "../.." in video.json
 * cannot reach outside public/.
 */
export const resolveInside = (base, relative, label) => {
  if (typeof relative !== "string" || relative.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  if (path.isAbsolute(relative)) {
    throw new Error(`${label} must be relative, got "${relative}"`);
  }
  const resolved = path.resolve(base, relative);
  const prefix = base.endsWith(path.sep) ? base : base + path.sep;
  if (resolved !== base && !resolved.startsWith(prefix)) {
    throw new Error(`${label} "${relative}" resolves outside ${base}`);
  }
  return resolved;
};

export const videoDir = (slug) => path.join(DATA_ROOT, assertSafeSlug(slug));
export const videoJsonPath = (slug) => path.join(videoDir(slug), "video.json");
export const voiceLockPath = (slug) => path.join(videoDir(slug), "voice.lock.json");

/** Where generated voice clips live, relative to public/. */
export const voiceDirRelative = (slug) =>
  `videos/${assertSafeSlug(slug)}/voice`;

export const outputDir = (slug) => path.join(OUTPUT_ROOT, assertSafeSlug(slug));

/** Path as it should be written into video.json (always forward slashes). */
export const toPublicRelative = (absolute) =>
  path.relative(PUBLIC_ROOT, absolute).split(path.sep).join("/");
