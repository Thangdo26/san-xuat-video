import {
  Easing,
  Interactive,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontFamily } from "./font";
import { IMAGE_HEIGHT } from "./SceneImage";
import type { Scene } from "./schema";

/**
 * Every layout animates in after ENTRY_DELAY frames, which matches the scene
 * transition length. Without it the incoming text would fly across the
 * outgoing scene while both are visible mid-crossfade.
 */
const ENTRY_DELAY = 15;

const TextBlock: React.FC<{ readonly children: React.ReactNode }> = ({
  children,
}) => (
  <div
    style={{
      position: "absolute",
      top: IMAGE_HEIGHT - 40,
      left: 0,
      right: 0,
      padding: "0 80px",
    }}
  >
    {children}
  </div>
);

const Label: React.FC<{
  readonly text: string;
  readonly accent: string;
}> = ({ text, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 22,
        translate: `${spring({
          frame,
          fps,
          delay: ENTRY_DELAY,
          from: -700,
          to: 0,
          config: { damping: 14, mass: 1, stiffness: 110 },
        })}px 0px`,
      }}
    >
      <div
        style={{
          width: 56,
          height: 5,
          borderRadius: 3,
          backgroundColor: accent,
        }}
      />
      <Interactive.Div
        name="Scene label"
        style={{
          fontFamily,
          fontSize: 40,
          fontWeight: 700,
          letterSpacing: 9,
          color: accent,
        }}
      >
        {text}
      </Interactive.Div>
    </div>
  );
};

const Caption: React.FC<{
  readonly text: string;
  readonly size: number;
  readonly nowrap?: boolean;
}> = ({ text, size, nowrap }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Interactive.Div
      name="Scene caption"
      style={{
        fontFamily,
        fontSize: size,
        fontWeight: 800,
        letterSpacing: -2,
        lineHeight: 1.16,
        color: "#ffffff",
        marginTop: 22,
        // The hook puts the caption beside a badge; without this the flex row
        // squeezes it and "ĐÀ NẴNG" breaks across two lines.
        whiteSpace: nowrap ? "nowrap" : "normal",
        textShadow: "0 24px 60px rgba(2,8,14,0.6)",
        translate: `${spring({
          frame,
          fps,
          delay: ENTRY_DELAY + 5,
          from: -1200,
          to: 0,
          config: { damping: 13, mass: 1.1, stiffness: 110 },
        })}px 0px`,
      }}
    >
      {text}
    </Interactive.Div>
  );
};

const Point: React.FC<{
  readonly text: string;
  readonly accent: string;
  readonly delay: number;
}> = ({ text, accent, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 26,
        marginTop: 34,
        opacity: interpolate(frame, [delay, delay + 12], [0, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: `${spring({
          frame,
          fps,
          delay,
          from: -120,
          to: 0,
          config: { damping: 16, mass: 0.9, stiffness: 120 },
        })}px 0px`,
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          flexShrink: 0,
          backgroundColor: accent,
          boxShadow: `0 0 26px ${accent}`,
        }}
      />
      <div
        style={{
          fontFamily,
          fontSize: 46,
          fontWeight: 600,
          lineHeight: 1.3,
          color: "rgba(255,255,255,0.93)",
        }}
      >
        {text}
      </div>
    </div>
  );
};

const Tip: React.FC<{
  readonly text: string;
  readonly accent: string;
  readonly delay: number;
}> = ({ text, accent, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Interactive.Div
      name="Scene tip"
      style={{
        fontFamily,
        fontSize: 42,
        fontWeight: 500,
        lineHeight: 1.45,
        color: "rgba(255,255,255,0.72)",
        maxWidth: 840,
        marginTop: 36,
        paddingLeft: 28,
        borderLeft: `4px solid ${accent}`,
        opacity: interpolate(frame, [delay, delay + 14], [0, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: `${spring({
          frame,
          fps,
          delay,
          from: -80,
          to: 0,
          config: { damping: 18, mass: 0.9, stiffness: 120 },
        })}px 0px`,
      }}
    >
      {text}
    </Interactive.Div>
  );
};

const Badge: React.FC<{ readonly text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Interactive.Div
      name="Hook badge"
      style={{
        fontFamily,
        fontSize: 68,
        fontWeight: 800,
        letterSpacing: 3,
        lineHeight: 1.1,
        flexShrink: 0,
        color: "#06121d",
        padding: "10px 34px 18px",
        borderRadius: 28,
        background:
          "linear-gradient(135deg, #ffd27a 0%, #ff9d4d 54%, #ff6b4a 100%)",
        boxShadow: "0 24px 60px rgba(255,120,74,0.34)",
        translate: `${spring({
          frame,
          fps,
          delay: ENTRY_DELAY + 13,
          from: 900,
          to: 0,
          config: { damping: 12, mass: 0.9, stiffness: 110 },
        })}px 0px`,
      }}
    >
      {text}
    </Interactive.Div>
  );
};

const Cta: React.FC<{ readonly text: string; readonly delay: number }> = ({
  text,
  delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Interactive.Div
      name="Call to action"
      style={{
        display: "inline-block",
        fontFamily,
        fontSize: 44,
        fontWeight: 700,
        color: "#06121d",
        padding: "18px 40px 24px",
        borderRadius: 999,
        marginTop: 38,
        background:
          "linear-gradient(135deg, #ffd27a 0%, #ff9d4d 54%, #ff6b4a 100%)",
        opacity: interpolate(frame, [delay, delay + 14], [0, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        scale: spring({
          frame,
          fps,
          delay,
          from: 0.82,
          to: 1,
          config: { damping: 12, mass: 0.8, stiffness: 120 },
        }),
      }}
    >
      {text}
    </Interactive.Div>
  );
};

type LayoutProps = {
  readonly scene: Scene;
  readonly accent: string;
};

export const SceneLayout: React.FC<LayoutProps> = ({ scene, accent }) => {
  if (scene.layout === "hook") {
    return (
      <TextBlock>
        {scene.label ? <Label text={scene.label} accent={accent} /> : null}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Caption text={scene.caption} size={124} nowrap />
          {scene.badge ? <Badge text={scene.badge} /> : null}
        </div>
        {scene.tip ? (
          <Tip text={scene.tip} accent={accent} delay={ENTRY_DELAY + 22} />
        ) : null}
      </TextBlock>
    );
  }

  if (scene.layout === "outro") {
    return (
      <TextBlock>
        {scene.label ? <Label text={scene.label} accent={accent} /> : null}
        <Caption text={scene.caption} size={146} />
        {scene.tip ? (
          <Tip text={scene.tip} accent={accent} delay={ENTRY_DELAY + 20} />
        ) : null}
        {scene.cta ? <Cta text={scene.cta} delay={ENTRY_DELAY + 30} /> : null}
      </TextBlock>
    );
  }

  const points = scene.points ?? [];

  return (
    <TextBlock>
      {scene.label ? <Label text={scene.label} accent={accent} /> : null}
      <Caption text={scene.caption} size={88} />
      {points.map((point, index) => (
        <Point
          key={point}
          text={point}
          accent={accent}
          delay={ENTRY_DELAY + 17 + index * 9}
        />
      ))}
      {scene.tip ? (
        <Tip
          text={scene.tip}
          accent={accent}
          delay={ENTRY_DELAY + 19 + points.length * 9}
        />
      ) : null}
    </TextBlock>
  );
};
