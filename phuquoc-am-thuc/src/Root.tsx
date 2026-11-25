import {
  CalculateMetadataFunction,
  Composition,
  Folder,
  Still,
} from "remotion";
import foodVideo from "../data/videos/phuquoc-am-thuc/video.json";
import foodVoiceover from "../data/videos/phuquoc-am-thuc/voiceover.json";
import { MapPlate, MapPlateProps } from "./MapPlate";
import {
  totalDurationInFrames,
  VideoData,
  VideoProps,
  Voiceover,
} from "./schema";
import { TravelShort } from "./TravelShort";

/**
 * JSON imports widen to `string` where the schema wants unions such as
 * SceneLayout, so the data is asserted once here. The real runtime check is
 * `npm run video:validate`, which every render runs first.
 *
 * Studio previews the video with its generated voice-over; renders get the
 * same merge from scripts/render.mjs.
 */
const foodProps: VideoProps = {
  ...(foodVideo as VideoData),
  voiceover: foodVoiceover as Voiceover,
};

/**
 * Format and length belong to the video data, not the registration, so a
 * different video.json passed via --props renders at its own size and
 * duration without touching this file.
 */
const calculateMetadata: CalculateMetadataFunction<VideoProps> = ({ props }) => {
  return {
    width: props.format.width,
    height: props.format.height,
    fps: props.format.fps,
    durationInFrames: totalDurationInFrames(props),
  };
};

const calculatePlateMetadata: CalculateMetadataFunction<MapPlateProps> = ({
  props,
}) => {
  return { width: props.width, height: props.height };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TravelShort"
        component={TravelShort}
        calculateMetadata={calculateMetadata}
        defaultProps={foodProps}
        durationInFrames={1710}
        fps={30}
        width={1080}
        height={1920}
      />
      <Folder name="Build-assets">
        <Still
          id="MapPlate"
          component={MapPlate}
          calculateMetadata={calculatePlateMetadata}
          defaultProps={{
            style: "https://tiles.openfreemap.org/styles/fiord",
            center: [109.36, 13.125],
            zoom: 10.3,
            width: 1600,
            height: 1600,
          }}
          width={1600}
          height={1600}
        />
      </Folder>
    </>
  );
};
