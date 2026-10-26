import {
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

/**
 * The photo occupies the top of the frame and melts into the background via a
 * scrim, so the text block below stays readable whatever the photo looks like.
 * This also lets portrait and landscape source images share one layout.
 */
export const IMAGE_HEIGHT = 1100;

type Props = {
  readonly src: string;
  readonly durationInFrames: number;
};

export const SceneImage: React.FC<Props> = ({ src, durationInFrames }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: IMAGE_HEIGHT,
        overflow: "hidden",
        backgroundColor: "#04101a",
      }}
    >
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          scale: interpolate(frame, [0, durationInFrames], [1.02, 1.12], {
            output: "perceptual-scale",
            easing: Easing.bezier(0.33, 0, 0.67, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(4,16,26,0.55) 0%, rgba(4,16,26,0.05) 22%, rgba(4,16,26,0.05) 55%, rgba(4,16,26,0.75) 85%, #04101a 100%)",
        }}
      />
    </div>
  );
};
