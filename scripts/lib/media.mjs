import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { PROJECT_ROOT } from "./paths.mjs";

/**
 * Path to Remotion's CLI entry. Spawned with this Node binary rather than via
 * npx: Node refuses to spawn npx.cmd on Windows without a shell, and a shell
 * brings back argument-quoting differences between cmd, PowerShell and bash.
 */
export const remotionCli = () => {
  const packageJson = createRequire(import.meta.url).resolve(
    "@remotion/cli/package.json",
  );
  return path.join(
    path.dirname(packageJson),
    JSON.parse(readFileSync(packageJson, "utf8")).bin.remotion,
  );
};

export const runRemotion = (args, options = {}) =>
  spawnSync(process.execPath, [remotionCli(), ...args], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    ...options,
  });

/**
 * Media duration in seconds, read with the ffprobe Remotion ships.
 * The bundled ffmpeg has no analysis filters, so ffprobe's header line is the
 * dependable source.
 */
export const probeDurationSec = (file) => {
  const result = runRemotion(["ffprobe", file], {
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
