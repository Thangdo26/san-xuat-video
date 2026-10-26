import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontFamily } from "./font";
import { SceneBackground } from "./SceneBackground";

export const Intro: React.FC = () => {
  return (
    <AbsoluteFill>
      <SceneBackground glow="rgba(255,190,105,0.42)" />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "100px 80px",
        }}
      >
        <Eyebrow />
        <Headline />
        <Badge />
        <Divider />
        <Subline />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Eyebrow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Interactive.Div
      name="Eyebrow"
      style={{
        fontFamily,
        fontSize: 44,
        fontWeight: 700,
        letterSpacing: 12,
        color: "#ffd089",
        marginBottom: 76,
        opacity: interpolate(frame, [0.1 * fps, 0.6 * fps], [0, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: interpolate(
          frame,
          [0.1 * fps, 0.8 * fps],
          ["0px 40px", "0px 0px"],
          {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        ),
      }}
    >
      MIỀN TRUNG · VIỆT NAM
    </Interactive.Div>
  );
};

const Headline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Interactive.Div
      name="Headline"
      style={{
        fontFamily,
        fontSize: 170,
        fontWeight: 800,
        letterSpacing: -3,
        lineHeight: 1.12,
        color: "#ffffff",
        textShadow: "0 28px 70px rgba(2,8,14,0.55)",
        translate: `${spring({
          frame,
          fps,
          delay: 0.2 * fps,
          from: -1200,
          to: 0,
          config: { damping: 13, mass: 1.1, stiffness: 110 },
        })}px 0px`,
        rotate: `${spring({
          frame,
          fps,
          delay: 0.2 * fps,
          from: -8,
          to: 0,
          config: { damping: 15, mass: 1.2, stiffness: 90 },
        })}deg`,
      }}
    >
      ĐÀ NẴNG
    </Interactive.Div>
  );
};

const Badge: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Interactive.Div
      name="Trip badge"
      style={{
        fontFamily,
        fontSize: 116,
        fontWeight: 800,
        letterSpacing: 4,
        lineHeight: 1.1,
        color: "#06121d",
        padding: "16px 54px 28px",
        borderRadius: 40,
        marginTop: 26,
        background:
          "linear-gradient(135deg, #ffd27a 0%, #ff9d4d 54%, #ff6b4a 100%)",
        boxShadow: "0 30px 80px rgba(255,120,74,0.34)",
        translate: `${spring({
          frame,
          fps,
          delay: 0.45 * fps,
          from: 1200,
          to: 0,
          config: { damping: 12, mass: 0.9, stiffness: 110 },
        })}px 0px`,
        scale: spring({
          frame,
          fps,
          delay: 0.45 * fps,
          from: 0.82,
          to: 1,
          config: { damping: 11, mass: 0.8, stiffness: 120 },
        }),
      }}
    >
      3N2Đ
    </Interactive.Div>
  );
};

const Divider: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Interactive.Div
      name="Divider"
      style={{
        height: 6,
        borderRadius: 3,
        marginTop: 56,
        background:
          "linear-gradient(90deg, rgba(255,210,122,0) 0%, #ffd27a 50%, rgba(255,210,122,0) 100%)",
        width: interpolate(frame, [1 * fps, 1.7 * fps], [0, 420], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    />
  );
};

const Subline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Interactive.Div
      name="Subline"
      style={{
        fontFamily,
        fontSize: 52,
        fontWeight: 500,
        letterSpacing: 2,
        color: "rgba(255,255,255,0.82)",
        marginTop: 44,
        opacity: interpolate(frame, [1.3 * fps, 1.9 * fps], [0, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: interpolate(
          frame,
          [1.3 * fps, 2.1 * fps],
          ["0px 36px", "0px 0px"],
          {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        ),
      }}
    >
      Cẩm nang du lịch
    </Interactive.Div>
  );
};
