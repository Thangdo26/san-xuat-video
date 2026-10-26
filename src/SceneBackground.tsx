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

export const SceneBackground: React.FC<Props> = ({ glow }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#04101a" }}>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, #04101a 0%, #0a3545 52%, #10596b 100%)",
          scale: interpolate(frame, [0, 6 * fps], [1, 1.1], {
            output: "perceptual-scale",
            easing: Easing.bezier(0.33, 0, 0.67, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(58% 34% at 50% 44%, ${glow} 0%, rgba(255,120,74,0.14) 46%, rgba(0,0,0,0) 72%)`,
          opacity: interpolate(frame, [0, 1.2 * fps], [0, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          scale: interpolate(frame, [0, 6 * fps], [0.86, 1.08], {
            output: "perceptual-scale",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(70% 50% at 50% 50%, rgba(0,0,0,0) 40%, rgba(2,8,14,0.72) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
