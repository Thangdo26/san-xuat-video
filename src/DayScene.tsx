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

type Stop = {
  readonly time: string;
  readonly place: string;
};

type Props = {
  readonly day: string;
  readonly title: string;
  readonly accent: string;
  readonly glow: string;
  readonly stops: Stop[];
};

export const DayScene: React.FC<Props> = ({
  day,
  title,
  accent,
  glow,
  stops,
}) => {
  return (
    <AbsoluteFill>
      <SceneBackground glow={glow} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          padding: "100px 80px",
        }}
      >
        <DayLabel day={day} accent={accent} />
        <DayTitle title={title} />
        <div style={{ marginTop: 72 }}>
          {stops.map((stop, index) => (
            <StopRow
              key={stop.time}
              time={stop.time}
              place={stop.place}
              accent={accent}
              delay={32 + index * 9}
              showConnector={index < stops.length - 1}
            />
          ))}
        </div>
      </AbsoluteFill>
      <Footer />
    </AbsoluteFill>
  );
};

const DayLabel: React.FC<{
  readonly day: string;
  readonly accent: string;
}> = ({ day, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        // Starts after the 15-frame scene transition so the incoming text
        // does not overlap the outgoing scene during the crossfade.
        translate: `${spring({
          frame,
          fps,
          delay: 15,
          from: -700,
          to: 0,
          config: { damping: 14, mass: 1, stiffness: 110 },
        })}px 0px`,
      }}
    >
      <div
        style={{
          width: 64,
          height: 6,
          borderRadius: 3,
          backgroundColor: accent,
        }}
      />
      <Interactive.Div
        name="Day label"
        style={{
          fontFamily,
          fontSize: 46,
          fontWeight: 700,
          letterSpacing: 10,
          color: accent,
        }}
      >
        {day}
      </Interactive.Div>
    </div>
  );
};

const DayTitle: React.FC<{ readonly title: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Interactive.Div
      name="Day title"
      style={{
        fontFamily,
        fontSize: 104,
        fontWeight: 800,
        letterSpacing: -2,
        lineHeight: 1.18,
        color: "#ffffff",
        marginTop: 28,
        textShadow: "0 24px 60px rgba(2,8,14,0.55)",
        translate: `${spring({
          frame,
          fps,
          delay: 20,
          from: -1200,
          to: 0,
          config: { damping: 13, mass: 1.1, stiffness: 110 },
        })}px 0px`,
      }}
    >
      {title}
    </Interactive.Div>
  );
};

const StopRow: React.FC<{
  readonly time: string;
  readonly place: string;
  readonly accent: string;
  readonly delay: number;
  readonly showConnector: boolean;
}> = ({ time, place, accent, delay, showConnector }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 32,
        paddingBottom: 54,
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
      {showConnector ? (
        <div
          style={{
            position: "absolute",
            left: 10,
            top: 30,
            bottom: 12,
            width: 2,
            backgroundColor: "rgba(255,255,255,0.18)",
          }}
        />
      ) : null}
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          flexShrink: 0,
          backgroundColor: accent,
          boxShadow: `0 0 28px ${accent}`,
        }}
      />
      <div
        style={{
          fontFamily,
          fontSize: 40,
          fontWeight: 700,
          color: accent,
          width: 120,
          flexShrink: 0,
        }}
      >
        {time}
      </div>
      <div
        style={{
          fontFamily,
          fontSize: 52,
          fontWeight: 600,
          lineHeight: 1.3,
          color: "rgba(255,255,255,0.92)",
        }}
      >
        {place}
      </div>
    </div>
  );
};

const Footer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Interactive.Div
      name="Footer brand"
      style={{
        position: "absolute",
        bottom: 100,
        width: "100%",
        textAlign: "center",
        fontFamily,
        fontSize: 36,
        fontWeight: 600,
        letterSpacing: 8,
        color: "rgba(255,255,255,0.45)",
        opacity: interpolate(frame, [1.4 * fps, 2 * fps], [0, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >
      ĐÀ NẴNG · 3N2Đ
    </Interactive.Div>
  );
};
