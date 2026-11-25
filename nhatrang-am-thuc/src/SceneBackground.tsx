import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Props = {
  readonly glow: string;
};

/**
 * Flat dark base plus a soft glow behind the text block.
 *
 * The base colour must stay the same colour the photo scrim in SceneImage
 * fades out to, otherwise the bottom edge of the photo shows as a hard
 * horizontal line across the frame.
 */
export const SceneBackground: React.FC<Props> = ({ glow }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#04101a" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(72% 26% at 50% 76%, ${glow} 0%, rgba(0,0,0,0) 72%)`,
          opacity: interpolate(frame, [0, 1.2 * fps], [0, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
    </AbsoluteFill>
  );
};
