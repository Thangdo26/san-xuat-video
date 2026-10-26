/**
 * Shape of data/videos/<slug>/video.json.
 *
 * The composition only knows how to *display* these fields; all content,
 * timing and asset choices live in the video's JSON file. Keep this type and
 * scripts/lib/validate-video.mjs in sync — the script validates the same
 * shape at build time, since TypeScript types are erased at runtime.
 */

export type SceneLayout = "hook" | "point" | "outro";

export type Scene = {
  /** Stable id, also used for voice file names. */
  readonly id: string;
  readonly layout: SceneLayout;
  /** Path relative to public/, e.g. "videos/<slug>/images/01-hook.jpg". */
  readonly asset?: string;
  readonly assetType?: "image" | "video";
  /** Path relative to public/. Written by `npm run video:voice`. */
  readonly voice?: string;
  /** Spoken line. Not rendered on screen; it is the voice-over source. */
  readonly narration: string;
  /** Small label above the caption, e.g. "NGÀY 1". */
  readonly label?: string;
  /** The scene headline. */
  readonly caption: string;
  /** Pill next to the headline. Only used by the "hook" layout. */
  readonly badge?: string;
  /** Bullet lines. Only used by the "point" layout. */
  readonly points?: string[];
  /** Supporting note under the content. */
  readonly tip?: string;
  /** Closing line. Only used by the "outro" layout. */
  readonly cta?: string;
  /** Per-scene accent colour; falls back to theme.accent. */
  readonly accent?: string;
  readonly durationSec: number;
};

export type VideoData = {
  readonly id: string;
  readonly title: string;
  readonly language: string;
  readonly template: string;
  readonly format: {
    readonly width: number;
    readonly height: number;
    readonly fps: number;
  };
  /** Crossfade length between scenes. */
  readonly transitionFrames: number;
  readonly theme: {
    readonly accent: string;
    readonly brand: string;
  };
  readonly music?: {
    /** Path relative to public/. */
    readonly src: string;
    readonly volume: number;
  };
  readonly scenes: Scene[];
};

/**
 * Total length once overlapping transitions are subtracted.
 * Mirrors how <TransitionSeries> shortens the timeline.
 */
export const totalDurationInFrames = (data: VideoData): number => {
  const { fps } = data.format;
  const scenes = data.scenes.reduce(
    (sum, scene) => sum + Math.round(scene.durationSec * fps),
    0,
  );
  const overlaps = Math.max(0, data.scenes.length - 1) * data.transitionFrames;
  return Math.max(1, scenes - overlaps);
};
