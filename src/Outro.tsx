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

export const Outro: React.FC = () => {
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
        <Kicker />
        <Wordmark />
        <Divider />
        <CallToAction />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Kicker: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Interactive.Div
      name="Outro kicker"
      style={{
        fontFamily,
        fontSize: 48,
        fontWeight: 700,
        letterSpacing: 12,
        color: "#ffd089",
        marginBottom: 72,
        // Delayed past the 15-frame transition so the outgoing scene has
        // faded out before this appears.
        opacity: interpolate(frame, [0.5 * fps, 1 * fps], [0, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: interpolate(
          frame,
          [0.5 * fps, 1.2 * fps],
          ["0px 36px", "0px 0px"],
          {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        ),
      }}
    >
      HẸN GẶP BẠN Ở
    </Interactive.Div>
  );
};

const Wordmark: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Interactive.Div
      name="Outro wordmark"
      style={{
        fontFamily,
        fontSize: 170,
        fontWeight: 800,
        letterSpacing: -3,
        lineHeight: 1.12,
        color: "#ffffff",
        textShadow: "0 28px 70px rgba(2,8,14,0.55)",
        scale: spring({
          frame,
          fps,
          delay: 0.65 * fps,
          from: 0.55,
          to: 1,
          config: { damping: 12, mass: 0.9, stiffness: 110 },
        }),
        opacity: interpolate(frame, [0.65 * fps, 0.9 * fps], [0, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >
      ĐÀ NẴNG
    </Interactive.Div>
  );
};

const Divider: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Interactive.Div
      name="Outro divider"
      style={{
        height: 6,
        borderRadius: 3,
        marginTop: 56,
        background:
          "linear-gradient(90deg, rgba(255,210,122,0) 0%, #ffd27a 50%, rgba(255,210,122,0) 100%)",
        width: interpolate(frame, [1.2 * fps, 1.9 * fps], [0, 420], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    />
  );
};

const CallToAction: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Interactive.Div
      name="Call to action"
      style={{
        fontFamily,
        fontSize: 52,
        fontWeight: 500,
        letterSpacing: 1,
        textAlign: "center",
        color: "rgba(255,255,255,0.82)",
        marginTop: 44,
        opacity: interpolate(frame, [1.5 * fps, 2.1 * fps], [0, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: interpolate(
          frame,
          [1.5 * fps, 2.3 * fps],
          ["0px 32px", "0px 0px"],
          {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        ),
      }}
    >
      Lưu lại lịch trình 3N2Đ nhé!
    </Interactive.Div>
  );
};
