#!/usr/bin/env node
/**
 * npm run video:description -- --slug da-nang-3n2d
 *
 * Writes output/<slug>/description.md: a post caption with the itinerary and
 * Google Maps links for every place and restaurant, plus the attribution the
 * photo and map licences require. Everything comes from video.json and
 * credits.json; nothing is looked up online.
 *
 * Maps links are searches (place + address + region), not saved place IDs,
 * so they still resolve if a listing moves or is renamed.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "./lib/args.mjs";
import { outputDir, videoDir } from "./lib/paths.mjs";
import { loadVideoData, resolveNarrator } from "./lib/video-data.mjs";

const PROVIDER_NAMES = {
  edge: "Microsoft Edge TTS",
  elevenlabs: "ElevenLabs",
  vbee: "Vbee AIVoice",
};

// What gets posted follows video.json `language`; the notes around it in
// description.md are for the person posting and stay in Vietnamese.
const TEXT = {
  vi: {
    itinerary: "📍 Lịch trình",
    map: "Bản đồ",
    eatNearby: "🍜 Ăn gần đây:",
    checkPlaces:
      "Địa chỉ quán tổng hợp từ nhiều trang du lịch. Kiểm tra lại địa chỉ, giờ mở cửa và đánh giá trên Google Maps trước khi đi.",
    photos: "Nguồn ảnh (Wikimedia Commons):",
    music: "Nhạc nền: tự tổng hợp cho video này bằng scripts/music.mjs.",
    voice: "Giọng đọc",
  },
  en: {
    itinerary: "📍 Itinerary",
    map: "Map",
    eatNearby: "🍜 Where to eat:",
    checkPlaces:
      "Places collected from several travel sites. Check addresses, opening hours and reviews on Google Maps before you go.",
    photos: "Photos (Wikimedia Commons):",
    music: "Music: generated for this video with scripts/music.mjs.",
    voice: "Voice",
  },
};

const mapsSearch = (query) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

const { flags } = parseArgs(process.argv.slice(2));

try {
  const slug = requireSlug(flags, "video:description");
  const { data } = loadVideoData(slug);
  const region = data.region ?? "";
  const withRegion = (text) => (region ? `${text}, ${region}` : text);
  const text = TEXT[data.language.split("-")[0]] ?? TEXT.en;

  const caption = [`${data.title}`, ""];

  const dishLines = (dish, indent) => {
    const rating = typeof dish.rating === "number" ? ` · ★ ${dish.rating.toFixed(1)}` : "";
    return [
      `${indent}${dish.name}: ${dish.place}, ${dish.address}${rating}`,
      `${indent}  ${mapsSearch(withRegion(`${dish.place}, ${dish.address}`))}`,
    ];
  };

  const stops = data.scenes.filter((scene) => scene.layout === "point");
  if (stops.length > 0) {
    caption.push(text.itinerary);
    for (const scene of stops) {
      const heading = scene.label ? `${scene.label}: ${scene.caption}` : scene.caption;
      caption.push(`• ${heading}`);
      for (const point of scene.points ?? []) {
        caption.push(`   – ${point}`);
      }
      if (scene.map) {
        caption.push(`   ${text.map}: ${mapsSearch(`${scene.map.lat},${scene.map.lng}`)}`);
      }
      if ((scene.dishes ?? []).length > 0) {
        caption.push(`   ${text.eatNearby}`);
        for (const dish of scene.dishes) {
          caption.push(...dishLines(dish, "   – "));
        }
      }
    }
    caption.push("");
  }

  const foodScenes = data.scenes.filter((scene) => scene.layout === "food");
  for (const scene of foodScenes) {
    caption.push(`🍜 ${scene.caption}`);
    for (const dish of scene.dishes ?? []) {
      caption.push(...dishLines(dish, "• "));
    }
    caption.push("");
  }

  const dishes = data.scenes.flatMap((scene) => scene.dishes ?? []);
  if (dishes.length > 0) {
    caption.push(text.checkPlaces, "");
  }

  // Only credit what the video actually shows.
  const used = new Set([
    ...data.scenes.flatMap((scene) => scene.gallery ?? []),
    ...dishes.flatMap((dish) => (dish.image ? [dish.image] : [])),
  ]);
  const creditsFile = path.join(videoDir(slug), "credits.json");
  const credits = existsSync(creditsFile)
    ? JSON.parse(readFileSync(creditsFile, "utf8")).filter((credit) =>
        used.has(credit.file),
      )
    : [];
  const uncredited = [...used].filter(
    (file) => !credits.some((credit) => credit.file === file),
  );

  const attribution = [text.photos];
  for (const credit of credits) {
    attribution.push(`• ${credit.author} — ${credit.license} — ${credit.source}`);
  }
  if (data.map) {
    attribution.push(
      "",
      `${text.map}: ${data.map.attribution} contributors — openstreetmap.org/copyright`,
    );
  }
  if (data.music) {
    attribution.push(text.music);
  }
  const narrator = resolveNarrator(data);
  attribution.push(
    `${text.voice}: ${PROVIDER_NAMES[narrator.provider] ?? narrator.provider}` +
      (narrator.voice ? ` (${narrator.voice})` : ""),
  );

  const captionText = caption.join("\n").trimEnd();
  const attributionText = attribution.join("\n");
  const markdown = [
    `# ${data.title}`,
    "",
    "## 1. Caption bài đăng",
    "",
    "```",
    captionText,
    "```",
    "",
    "## 2. Ghi nguồn",
    "",
    "Bắt buộc với ảnh CC BY / CC BY-SA và dữ liệu bản đồ. Dán vào cuối caption,",
    "hoặc vào bình luận ghim nếu caption vượt giới hạn của nền tảng.",
    "",
    "```",
    attributionText,
    "```",
    "",
  ].join("\n");

  const dir = outputDir(slug);
  mkdirSync(dir, { recursive: true });
  const outFile = path.join(dir, "description.md");
  writeFileSync(outFile, markdown);

  console.log(`✓ ${outFile}`);
  console.log(
    `  caption ${captionText.length} chars, attribution ${attributionText.length} chars ` +
      `(${credits.length} photo credits)`,
  );
  if (uncredited.length > 0) {
    console.warn(
      `  ! ${uncredited.length} image(s) have no entry in credits.json:\n` +
        uncredited.map((file) => `    - ${file}`).join("\n"),
    );
  }
} catch (error) {
  fail(error.message);
}
