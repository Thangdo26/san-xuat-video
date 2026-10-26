import { Audio } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AbsoluteFill, staticFile, useVideoConfig } from "remotion";
import { Scene } from "./Scene";
import {
  sceneDurationInFrames,
  sceneStartFrames,
  type VideoProps,
} from "./schema";

/** Music level while someone is speaking, relative to its normal level. */
const DUCK_LEVEL = 0.5;
const DUCK_RAMP_FRAMES = 8;

/**
 * One template that renders any video.json following src/schema.ts. It owns
 * layout and motion only; every piece of content comes from props, so a new
 * video means a new JSON file, not a new component.
 */
export const TravelShort: React.FC<VideoProps> = (data) => {
  const { fps, durationInFrames } = useVideoConfig();
  const clips = data.voiceover?.clips ?? {};
  const starts = sceneStartFrames(data);

  // Voice starts once the incoming crossfade has finished, so it never talks
  // over the previous scene. scripts/voice.mjs sizes scenes with this lead.
  const voiceOffset = data.transitionFrames;

  const speaking = data.scenes.flatMap((scene, index) => {
    const clip = clips[scene.id];
    if (!clip) return [];
    const from = starts[index] + voiceOffset;
    return [[from, from + Math.round(clip.durationSec * fps)] as const];
  });

  const musicVolume = (frame: number) => {
    const base = data.music?.volume ?? 0;
    const fadeIn = Math.min(1, frame / fps);
    const fadeOut = Math.min(1, (durationInFrames - frame) / (2 * fps));
    // 1 while speaking, easing to 0 within DUCK_RAMP_FRAMES either side.
    const closeness = speaking.reduce((most, [from, to]) => {
      const distance = frame < from ? from - frame : frame > to ? frame - to : 0;
      return Math.max(most, 1 - Math.min(1, distance / DUCK_RAMP_FRAMES));
    }, 0);
    const duck = 1 - (1 - DUCK_LEVEL) * closeness;
    return Math.max(0, base * fadeIn * fadeOut * duck);
  };

  // TransitionSeries expects Sequence and Transition elements as direct
  // children, so the list is built flat rather than with fragments.
  const children: React.ReactNode[] = [];

  data.scenes.forEach((scene, index) => {
    if (index > 0) {
      children.push(
        <TransitionSeries.Transition
          key={`transition-${scene.id}`}
          presentation={fade()}
          timing={linearTiming({ durationInFrames: data.transitionFrames })}
        />,
      );
    }

    const sceneFrames = sceneDurationInFrames(scene, fps);

    children.push(
      <TransitionSeries.Sequence
        key={scene.id}
        name={scene.id}
        durationInFrames={sceneFrames}
      >
        <Scene
          scene={scene}
          theme={data.theme}
          plate={data.map}
          voice={clips[scene.id]}
          voiceOffsetFrames={voiceOffset}
          subtitles={data.subtitles ?? true}
          durationInFrames={sceneFrames}
        />
      </TransitionSeries.Sequence>,
    );
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#04101a" }}>
      <TransitionSeries>{children}</TransitionSeries>
      {data.music ? (
        <Audio src={staticFile(data.music.src)} volume={musicVolume} loop />
      ) : null}
    </AbsoluteFill>
  );
};
