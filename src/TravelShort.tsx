import { Audio } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AbsoluteFill, staticFile } from "remotion";
import { Scene } from "./Scene";
import type { VideoData } from "./schema";

/**
 * One template that renders any video.json following the schema in schema.ts.
 * It owns layout and motion only; every piece of content comes from props, so
 * a new video means a new JSON file, not a new component.
 */
export const TravelShort: React.FC<VideoData> = (data) => {
  const { fps } = data.format;

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

    const durationInFrames = Math.round(scene.durationSec * fps);

    children.push(
      <TransitionSeries.Sequence
        key={scene.id}
        name={scene.id}
        durationInFrames={durationInFrames}
      >
        <Scene
          scene={scene}
          theme={data.theme}
          durationInFrames={durationInFrames}
        />
      </TransitionSeries.Sequence>,
    );
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#04101a" }}>
      <TransitionSeries>{children}</TransitionSeries>
      {data.music ? (
        <Audio
          src={staticFile(data.music.src)}
          volume={data.music.volume}
          loop
        />
      ) : null}
    </AbsoluteFill>
  );
};
