#!/usr/bin/env node
/**
 * npm run video:fetch-image -- --slug da-nang-3n2d --slot 02c-son-tra \
 *   --title "File:Lady Buddha Statue at Linh Ung Pagoda.jpg" [--dir images]
 *
 * Downloads one image from Wikimedia Commons at 1600px wide into
 * public/videos/<slug>/<dir>/<slot>.jpg and records its author, licence and
 * source in data/videos/<slug>/credits.json, replacing any earlier entry for
 * the same slot.
 *
 * Only freely licensed files are accepted (CC0, public domain, CC BY,
 * CC BY-SA). Always look at the downloaded image before using it: a file's
 * title is not proof of what it shows.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "./lib/args.mjs";
import { PUBLIC_ROOT, assertSafeSlug, videoDir } from "./lib/paths.mjs";

const API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT = "danang-3n2d-video/1.0 (local render project)";
const FREE_LICENCE = /^(CC0|CC BY(-SA)? \d|Public domain)/i;
const SLOT = /^[a-z0-9][a-z0-9-]*$/;
const DIR = /^[a-z0-9][a-z0-9-]*$/;

const strip = (value) =>
  (value ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Commons answers rate-limited requests with plain text, not JSON. */
const fetchJson = async (url) => {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      if (attempt === 3) {
        throw new Error(
          `Commons did not return JSON (HTTP ${response.status}): ${text.slice(0, 120)}\n` +
            "  Usually rate limiting. Wait a minute and run again.",
        );
      }
      await sleep(4000 * attempt);
    }
  }
  throw new Error("unreachable");
};

const { flags } = parseArgs(process.argv.slice(2));

try {
  const slug = assertSafeSlug(requireSlug(flags, "video:fetch-image"));
  const slot = flags.slot;
  const title = flags.title;
  const dir = typeof flags.dir === "string" ? flags.dir : "images";

  if (typeof slot !== "string" || !SLOT.test(slot)) {
    fail("--slot is required: lowercase letters, digits and hyphens, e.g. 02c-son-tra");
  }
  if (typeof title !== "string" || !title.startsWith("File:")) {
    fail('--title is required and must start with "File:", e.g. "File:Example.jpg"');
  }
  if (!DIR.test(dir)) {
    fail("--dir must be lowercase letters, digits and hyphens");
  }

  const query =
    `${API}?action=query&format=json&titles=${encodeURIComponent(title)}` +
    "&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1600";
  const json = await fetchJson(query);
  const page = Object.values(json?.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  if (!info) {
    fail(`Commons has no file called "${title}". Check the exact title on the file page.`);
  }

  const meta = info.extmetadata ?? {};
  const licence = strip(meta.LicenseShortName?.value);
  if (!FREE_LICENCE.test(licence)) {
    fail(`"${title}" is licensed "${licence}", which is not accepted here.`);
  }

  const response = await fetch(info.thumburl ?? info.url, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!response.ok) {
    fail(`Download failed with HTTP ${response.status}. Run again in a minute.`);
  }
  const image = Buffer.from(await response.arrayBuffer());

  const relative = `videos/${slug}/${dir}/${slot}.jpg`;
  const absolute = path.join(PUBLIC_ROOT, relative);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, image);

  const creditsFile = path.join(videoDir(slug), "credits.json");
  const credits = existsSync(creditsFile)
    ? JSON.parse(readFileSync(creditsFile, "utf8"))
    : [];
  const entry = {
    slot,
    file: relative,
    title: page.title,
    author: strip(meta.Artist?.value),
    license: licence,
    licenseUrl: strip(meta.LicenseUrl?.value),
    source: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
  };
  const existing = credits.findIndex((credit) => credit.slot === slot);
  if (existing >= 0) {
    credits[existing] = entry;
  } else {
    credits.push(entry);
  }
  credits.sort((a, b) => a.slot.localeCompare(b.slot));
  writeFileSync(creditsFile, JSON.stringify(credits, null, 2) + "\n");

  console.log(
    `✓ public/${relative}  ${(image.length / 1024).toFixed(0)} KB  ${licence}  ${entry.author.slice(0, 40)}`,
  );
  // Commons' Artist field is free text; some uploaders put whole usage notes
  // there, which would end up verbatim in the published credits.
  if (entry.author.length > 60 || entry.author.length === 0) {
    console.warn(
      `  ! The author field is ${entry.author.length === 0 ? "empty" : `${entry.author.length} characters`}. ` +
        `Edit "author" for slot ${slot} in credits.json to the photographer's name.`,
    );
  }
} catch (error) {
  fail(error.message);
}
