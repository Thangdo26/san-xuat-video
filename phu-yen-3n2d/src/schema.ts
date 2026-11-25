import type { Caption } from "@remotion/captions";

/**
 * Shape of data/videos/<slug>/video.json (written by hand) plus
 * voiceover.json (written by `npm run video:voice`).
 *
 * The composition only decides how these fields look; all content, timing and
 * asset choices live in the data. Keep this file and
 * scripts/lib/video-data.mjs in sync - the script checks the same shape at
 * runtime, since TypeScript types are erased.
 */

export type SceneLayout = "hook" | "point" | "food" | "outro" | "flight";

/**
 * "split" (default): photos in the top half, text below on the dark
 * background. "full": photos fill the whole frame and the text sits on them.
 */
export type SceneFrame = "split" | "full";

/** How the scene enters, replacing the previous one. Defaults to "fade". */
export type SceneTransition = "fade" | "slide" | "wipe" | "iris";

/** Routes a "flight" scene draws on the country map. */
export type Flight = {
  readonly to: MapTarget;
  readonly from: MapTarget[];
};

/** Where the map intro zooms to before the scene's photos appear. */
export type MapTarget = {
  readonly lng: number;
  readonly lat: number;
  /** Label on the pin. */
  readonly name: string;
};

export type Dish = {
  readonly name: string;
  /**
   * Path relative to public/. Required by the "food" layout; on a "point"
   * scene the photo replaces the scene's own when the dish is spoken.
   */
  readonly image?: string;
  /** Suggested place to eat it. */
  readonly place: string;
  /** Street address as shown on screen. */
  readonly address: string;
  /**
   * The words the narration uses for this dish, if they differ from `name`.
   * Used to switch to the dish's photo exactly when it is spoken.
   */
  readonly spokenAs?: string;
  /** Google Maps rating. Only shown when set - fill it in after checking. */
  readonly rating?: number;
};

export type Scene = {
  /** Stable id, also used for voice file names. */
  readonly id: string;
  readonly layout: SceneLayout;
  /** Spoken line; the source for voice-over and subtitles. */
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
  /** Photos or clips (.mp4/.webm) shown in turn, relative to public/. */
  readonly gallery?: string[];
  /** Zoom into this point on the region map before the photos. */
  readonly map?: MapTarget;
  /**
   * "food" layout: the whole scene. "point" layout: where to eat nearby, up
   * to three; it replaces the points once the narration reaches the first.
   */
  readonly dishes?: Dish[];
  /**
   * "point" layout: more places to eat nearby, beyond the three on screen.
   * Only listed in the post description.
   */
  readonly moreDishes?: Dish[];
  /** "flight" layout: planes fly from each departure to the destination. */
  readonly flight?: Flight;
  /**
   * "point" layout: the day's stops in order, drawn as a route on the region
   * map in place of the single-pin zoom. With no gallery it fills the scene,
   * for days with no free photos.
   */
  readonly route?: MapTarget[];
  readonly frame?: SceneFrame;
  readonly transition?: SceneTransition;
  readonly durationSec: number;
};

export type MapPlate = {
  /** The pre-rendered region image, relative to public/. */
  readonly plate: string;
  /** MapLibre style the plate was rendered from. */
  readonly style: string;
  readonly center: [number, number];
  readonly zoom: number;
  /** Plate size in CSS pixels, before the render scale. */
  readonly width: number;
  readonly height: number;
  /** Required by the map data licence; shown while the map is visible. */
  readonly attribution: string;
};

export type Narrator = {
  readonly provider: "edge" | "elevenlabs" | "vbee" | "omnivoice";
  readonly voice?: string;
  readonly rate?: string;
  readonly model?: string;
};

export type VideoData = {
  readonly id: string;
  readonly title: string;
  readonly language: string;
  /** Appended to Google Maps searches in the post description. */
  readonly region?: string;
  readonly template: string;
  readonly format: {
    readonly width: number;
    readonly height: number;
    readonly fps: number;
  };
  /** Crossfade length between scenes. Voice starts after it. */
  readonly transitionFrames: number;
  readonly theme: {
    readonly accent: string;
    readonly brand: string;
  };
  readonly narrator?: Narrator;
  /** Burn the narration in as subtitles. Defaults to true. */
  readonly subtitles?: boolean;
  readonly music?: {
    /** Path relative to public/. */
    readonly src: string;
    readonly volume: number;
  };
  readonly map?: MapPlate;
  /** Country-wide plate for "flight" scenes (video:map --which flight). */
  readonly flightMap?: MapPlate;
  readonly scenes: Scene[];
};

/** One scene's generated clip. Word times are relative to the clip start. */
export type VoiceClip = {
  readonly file: string;
  readonly hash: string;
  readonly durationSec: number;
  readonly words: Caption[];
};

export type Voiceover = {
  readonly clips: Record<string, VoiceClip>;
};

/** What the composition receives: the video plus its generated voice-over. */
export type VideoProps = VideoData & {
  readonly voiceover?: Voiceover;
};

export const sceneDurationInFrames = (scene: Scene, fps: number): number =>
  Math.round(scene.durationSec * fps);

/**
 * Total length once overlapping transitions are subtracted.
 * Mirrors how <TransitionSeries> shortens the timeline.
 */
export const totalDurationInFrames = (data: VideoData): number => {
  const { fps } = data.format;
  const scenes = data.scenes.reduce(
    (sum, scene) => sum + sceneDurationInFrames(scene, fps),
    0,
  );
  const overlaps = Math.max(0, data.scenes.length - 1) * data.transitionFrames;
  return Math.max(1, scenes - overlaps);
};

/** Frame each scene starts at in the full video. */
export const sceneStartFrames = (data: VideoData): number[] => {
  const starts: number[] = [];
  let cursor = 0;
  for (const scene of data.scenes) {
    starts.push(cursor);
    cursor += sceneDurationInFrames(scene, data.format.fps) - data.transitionFrames;
  }
  return starts;
};
