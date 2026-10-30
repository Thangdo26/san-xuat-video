// Builds the Phú Quốc food video in Vietnamese and English from one list of
// dishes (data/dishes.mjs), so facts, places and ratings stay identical.
// Run: node data/gen-videos.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { DISHES } from "./dishes.mjs";

const img = (name) => `videos/phuquoc-am-thuc/images/${name}.jpg`;

const TEXT = {
  vi: {
    title: "Ẩm thực Phú Quốc: 5 món phải thử",
    brand: "ẨM THỰC PHÚ QUỐC",
    hook: "Ra Phú Quốc ăn gì? Đây là năm món phải thử, kèm nguồn gốc, cách làm, cách ăn, và quán ngon đã kiểm tra trên Google Maps. Lật từng thẻ nhé!",
    hookLabel: "ẨM THỰC VÙNG MIỀN",
    hookCaption: "PHÚ QUỐC",
    hookBadge: "5 MÓN",
    hookTip: "Nguồn gốc · Cách làm · Cách ăn · Quán ngon",
    outro: "Năm món này đủ cho một chuyến ăn sập đảo ngọc. Địa chỉ quán mình để ở phần mô tả. Bạn thích món nào nhất? Lưu lại nhé!",
    outroLabel: "ĂN SẬP PHÚ QUỐC",
    outroTip: "Bạn thích món nào nhất?",
    outroCta: "Lưu lại cho chuyến đi nhé!",
    titles: { origin: "Nguồn gốc", made: "Cách làm", eat: "Cách ăn", where: "Quán ngon" },
    narrator: { provider: "omnivoice", voice: "vi-nu-tre-03" },
  },
  en: {
    title: "Phu Quoc food: 5 dishes to try",
    brand: "PHU QUOC FOOD",
    hook: "What to eat in Phu Quoc? Here are five dishes you have to try, with where they come from, how they are made, how to eat them, and places checked on Google Maps. Flip each card with me!",
    hookLabel: "REGIONAL FOOD",
    hookCaption: "PHU QUOC",
    hookBadge: "5 DISHES",
    hookTip: "Origin · How it's made · How to eat · Where",
    outro: "These five dishes are a full food tour of the pearl island. All the addresses are in the description. Which one would you try first? Save this for your trip!",
    outroLabel: "EAT LIKE A LOCAL",
    outroTip: "Which one would you try first?",
    outroCta: "Save it for your trip!",
    titles: { origin: "Origin", made: "How it's made", eat: "How to eat", where: "Where to eat" },
    narrator: { provider: "edge", voice: "en-US-AvaMultilingualNeural", rate: "+5%" },
  },
};

const build = (lang) => {
  const t = TEXT[lang];
  const scenes = [
    {
      id: "hook",
      layout: "hook",
      gallery: [img("00-hook")],
      narration: t.hook,
      label: t.hookLabel,
      caption: t.hookCaption,
      badge: t.hookBadge,
      tip: t.hookTip,
      stickers: ["🦀", "🥢", "🐟", "🍜", "😋", "✨"],
      frame: "full",
      durationSec: 8,
    },
    ...DISHES.map((dish, index) => {
      const d = dish[lang];
      const section = (part, [cue, text]) => ({ part, title: t.titles[part], text, cue });
      return {
        id: dish.id,
        layout: "dish",
        ...(dish.gallery ? { gallery: dish.gallery } : {}),
        narration: d.narration,
        caption: d.name,
        accent: dish.accent,
        stickers: dish.stickers,
        story: {
          number: index + 1,
          total: DISHES.length,
          tagline: d.tagline,
          ...(dish.illustration ? { illustration: dish.illustration } : {}),
          background: dish.background,
          backgroundTo: dish.backgroundTo,
          sections: [
            section("origin", d.origin),
            section("made", d.made),
            section("eat", d.eat),
            { part: "where", title: (dish.whereTitle ?? {})[lang] ?? t.titles.where, cue: d.where, places: dish.places.map((p) => ({ name: d.name, ...p })) },
          ],
        },
        transition: index % 2 === 0 ? "slide" : "wipe",
        durationSec: 22,
      };
    }),
    {
      id: "outro",
      layout: "outro",
      gallery: [img("09-outro")],
      narration: t.outro,
      label: t.outroLabel,
      caption: lang === "en" ? "PHU QUOC" : "PHÚ QUỐC",
      tip: t.outroTip,
      cta: t.outroCta,
      stickers: ["😋", "🏝️", "💛", "🦀"],
      frame: "full",
      transition: "iris",
      durationSec: 9,
    },
  ];
  const slug = lang === "en" ? "phuquoc-am-thuc-en" : "phuquoc-am-thuc";
  const data = {
    id: slug,
    title: t.title,
    language: lang,
    region: "Đặc khu Phú Quốc, An Giang, Việt Nam",
    template: "food-explainer",
    format: { width: 1080, height: 1920, fps: 30 },
    transitionFrames: 15,
    theme: { accent: "#5fd3c6", brand: t.brand },
    narrator: t.narrator,
    subtitles: true,
    music: { src: "shared/music/travel-upbeat.mp3", volume: 0.8 },
    scenes,
  };
  mkdirSync(`data/videos/${slug}`, { recursive: true });
  writeFileSync(`data/videos/${slug}/video.json`, JSON.stringify(data, null, 2) + "\n");
  console.log(slug, scenes.length, "scenes");
};

for (const lang of ["vi", "en"]) build(lang);

// Both videos credit the same photos.
const credits = readFileSync("data/videos/phuquoc-am-thuc/credits.json", "utf8");
writeFileSync("data/videos/phuquoc-am-thuc-en/credits.json", credits);
