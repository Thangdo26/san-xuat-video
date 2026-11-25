import { spawnSync } from "node:child_process";
import { PROJECT_ROOT } from "./paths.mjs";

/**
 * Runs ffmpeg or ffprobe from PATH (HyperFrames needs both installed anyway).
 * The first argument names the tool, so call sites read like the command line.
 */
export const runMedia = ([tool, ...args], options = {}) =>
  spawnSync(tool, args, {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    ...options,
  });

/**
 * Media duration in seconds, read from ffprobe's header line.
 */
export const probeDurationSec = (file) => {
  const result = runMedia(["ffprobe", file], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  const text = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const match = text.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) {
    throw new Error(`Could not read the duration of ${file}`);
  }
  const [, hours, minutes, seconds] = match;
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
};
