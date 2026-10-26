import { CalculateMetadataFunction, Composition } from "remotion";
import daNang3n2d from "../data/videos/da-nang-3n2d/video.json";
import { totalDurationInFrames, VideoData } from "./schema";
import { TravelShort } from "./TravelShort";

/**
 * JSON imports widen to `string` where the schema wants unions such as
 * SceneLayout, so the data is asserted once here. The real runtime check is
 * `npm run video:validate`, which every render runs first.
 */
const daNangData = daNang3n2d as VideoData;

/**
 * Format and length belong to the video data, not the registration, so a
 * different video.json passed via --props renders at its own size and
 * duration without touching this file.
 */
const calculateMetadata: CalculateMetadataFunction<VideoData> = ({ props }) => {
  return {
    width: props.format.width,
    height: props.format.height,
    fps: props.format.fps,
    durationInFrames: totalDurationInFrames(props),
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="TravelShort"
      component={TravelShort}
      calculateMetadata={calculateMetadata}
      defaultProps={daNangData}
      durationInFrames={1710}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
