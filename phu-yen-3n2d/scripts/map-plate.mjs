#!/usr/bin/env node
/**
 * npm run video:map -- --slug da-nang-3n2d [--which flight]
 *
 * Renders the region map the scenes zoom into, from the "map" block in
 * video.json (or, with --which flight, the country map a "flight" scene draws
 * its routes on, from "flightMap"), using MapLibre and the tile style it names. This is the only
 * step that fetches map tiles; the video itself animates over the saved image,
 * so its render stays fast and needs no network.
 *
 * Re-run after changing map.center, map.zoom, map.width, map.height or
 * map.style. Rendered at 2.5x so the 2.4x zoom in the video stays sharp.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "./lib/args.mjs";
import { runRemotion } from "./lib/media.mjs";
import { PUBLIC_ROOT, outputDir, resolveInside } from "./lib/paths.mjs";
import { loadVideoData } from "./lib/video-data.mjs";

const RENDER_SCALE = 2.5;

const { flags } = parseArgs(process.argv.slice(2));

try {
  const slug = requireSlug(flags, "video:map");
  // Not loadValidVideoData: the plate this command creates may not exist yet.
  const { data } = loadVideoData(slug);
  const key = flags.which === "flight" ? "flightMap" : "map";
  const map = data[key];
  if (!map) {
    fail(`video.json has no "${key}" block, so there is no plate to render.`);
  }
  for (const field of ["plate", "style"]) {
    if (typeof map[field] !== "string" || map[field].length === 0) {
      fail(`${key}.${field} is required`);
    }
  }

  const plateFile = resolveInside(PUBLIC_ROOT, map.plate, `${key}.plate`);
  mkdirSync(path.dirname(plateFile), { recursive: true });

  const dir = outputDir(slug);
  mkdirSync(dir, { recursive: true });
  const propsFile = path.join(dir, `${key}-props.json`);
  writeFileSync(
    propsFile,
    JSON.stringify({
      style: map.style,
      center: map.center,
      zoom: map.zoom,
      width: map.width,
      height: map.height,
    }),
  );

  const isPng = /\.png$/i.test(plateFile);
  console.log(
    `Rendering ${map.width}x${map.height} plate at ${RENDER_SCALE}x ` +
      `(center ${map.center.join(", ")}, zoom ${map.zoom}) from ${map.style}`,
  );
  const result = runRemotion(
    [
      "still",
      "src/index.ts",
      "MapPlate",
      plateFile,
      `--props=${propsFile}`,
      "--gl=angle",
      `--scale=${RENDER_SCALE}`,
      `--image-format=${isPng ? "png" : "jpeg"}`,
      ...(isPng ? [] : ["--jpeg-quality=88"]),
      "--log=error",
    ],
    { stdio: "inherit" },
  );
  if (result.error || result.status !== 0) {
    fail(
      "The map did not render. It needs network access to the tile server; " +
        "check your connection and run again.",
    );
  }
  console.log(`✓ public/${map.plate}`);
} catch (error) {
  fail(error.message);
}
