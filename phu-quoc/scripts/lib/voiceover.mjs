import { totalDurationInFrames, VOICE_TAIL_SEC } from "./video-data.mjs";

/** One word per line keeps the file reviewable and its diffs small. */
export const formatVoiceover = (voiceover) => {
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

/** How much longer than its voice-over a scene may stay when shrinking. */
const SHRINK_SLACK_SEC = 1;

/**
 * Makes every scene long enough for its clip, after the crossfade lead and
 * with a short tail. With `shrink`, scenes more than a second longer than
 * that are cut down too - for a new voice, whose clips can be shorter than
 * the ones the scene lengths were fitted to. Edits `data` in place and logs
 * one line per scene; returns whether any length changed.
 */
export const fitScenesToVoice = (data, clips, { shrink = false } = {}) => {
  const leadSec = data.transitionFrames / data.format.fps;
  let changed = false;
  console.log("\nFitting scenes to their voice-over:");
  for (const scene of data.scenes) {
    const clip = clips[scene.id];
    const needed = roundUpToHalf(leadSec + clip.durationSec + VOICE_TAIL_SEC);
    const before = scene.durationSec;
    if (
      scene.durationSec < needed ||
      (shrink && scene.durationSec > needed + SHRINK_SLACK_SEC)
    ) {
      scene.durationSec = needed;
      changed = true;
    }
    const note =
      scene.durationSec !== before
        ? `scene ${before}s → ${scene.durationSec}s`
        : `scene ${scene.durationSec}s ok`;
    console.log(`  ${scene.id.padEnd(14)} voice ${clip.durationSec.toFixed(2)}s   ${note}`);
  }
  return changed;
};

export const logVideoLength = (data) => {
  const total = totalDurationInFrames(data) / data.format.fps;
  console.log(`Video length is now ${total.toFixed(1)}s.`);
};
