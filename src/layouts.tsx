import {
  Easing,
  Interactive,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontFamily } from "./font";
import { IMAGE_HEIGHT } from "./Gallery";
import type { Dish, Scene } from "./schema";

/**
 * Every layout animates in after ENTRY_DELAY frames, which matches the scene
 * transition length. Without it the incoming text would fly across the
 * outgoing scene while both are visible mid-crossfade.
 */
const ENTRY_DELAY = 15;

/** Frames the points take to hand over to a point scene's dish list. */
const SWAP_FRAMES = 10;

/**
 * Wider on the right: TikTok, Reels and Shorts stack their like, comment and
 * share buttons down the right edge.
 */
export const SAFE_LEFT = 80;
export const SAFE_RIGHT = 140;

const TextBlock: React.FC<{ readonly children: React.ReactNode }> = ({
  children,
}) => (
  <div
    style={{
      position: "absolute",
      top: IMAGE_HEIGHT - 40,
      left: 0,
      right: 0,
      padding: `0 ${SAFE_RIGHT}px 0 ${SAFE_LEFT}px`,
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
        fontSize: 62,
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

const PinIcon: React.FC<{ readonly color: string }> = ({ color }) => (
  <svg width={36} height={36} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path
      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
      fill={color}
    />
  </svg>
);

/**
 * All dishes stay listed for the whole scene so every address can be read;
 * the one being spoken is highlighted. The narration names the dishes faster
 * than an address can be read, so a one-at-a-time card would flash past.
 */
const DishList: React.FC<{
  readonly dishes: Dish[];
  readonly starts: number[];
  readonly accent: string;
  /** Frame the first row starts to slide in at. */
  readonly appearFrom: number;
}> = ({ dishes, starts, accent, appearFrom }) => {
  const frame = useCurrentFrame();

  return (
    <div style={{ marginTop: 28 }}>
      {dishes.map((dish, index) => {
        const appear = appearFrom + index * 5;
        const entry = interpolate(frame, [appear, appear + 12], [0, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const start = starts[index] ?? 0;
        const end = starts[index + 1];
        const on =
          interpolate(frame, [start - 3, start + 3], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }) *
          (end === undefined
            ? 1
            : interpolate(frame, [end - 3, end + 3], [1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }));

        return (
          <div
            key={dish.name}
            style={{
              display: "flex",
              gap: 22,
              marginTop: index === 0 ? 0 : 22,
              opacity: entry * (0.42 + 0.58 * on),
              translate: `${interpolate(entry, [0, 1], [-80, 0])}px 0px`,
            }}
          >
            <div
              style={{
                width: 6,
                borderRadius: 3,
                flexShrink: 0,
                backgroundColor: accent,
                opacity: on,
              }}
            />
            <div>
              <div
                style={{
                  fontFamily,
                  fontSize: 46,
                  fontWeight: 800,
                  lineHeight: 1.2,
                  color: "#ffffff",
                }}
              >
                {dish.name}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 4,
                  fontFamily,
                  fontSize: 33,
                  fontWeight: 500,
                  lineHeight: 1.35,
                  color: "rgba(255,255,255,0.78)",
                }}
              >
                <PinIcon color={accent} />
                <span>
                  <span style={{ fontWeight: 700, color: "#ffffff" }}>
                    {dish.place}
                  </span>
                  {`  ·  ${dish.address}`}
                  {typeof dish.rating === "number" ? (
                    <span style={{ color: accent, fontWeight: 700 }}>
                      {`  ·  ★ ${dish.rating.toFixed(1)}`}
                    </span>
                  ) : null}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

type LayoutProps = {
  readonly scene: Scene;
  readonly accent: string;
  /** Frame each dish is spoken at; only used by the "food" layout. */
  readonly dishStarts?: number[];
};

export const SceneLayout: React.FC<LayoutProps> = ({
  scene,
  accent,
  dishStarts,
}) => {
  if (scene.layout === "food") {
    return (
      <TextBlock>
        {scene.label ? <Label text={scene.label} accent={accent} /> : null}
        <DishList
          dishes={scene.dishes ?? []}
          starts={dishStarts ?? []}
          accent={accent}
          appearFrom={ENTRY_DELAY + 6}
        />
      </TextBlock>
    );
  }

  if (scene.layout === "hook") {
    return (
      <TextBlock>
        {scene.label ? <Label text={scene.label} accent={accent} /> : null}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Caption text={scene.caption} size={112} nowrap />
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

  return <PointLayout scene={scene} accent={accent} dishStarts={dishStarts} />;
};

/**
 * Headline with points and tip. With dishes, the points and tip fade out as
 * the narration reaches the first dish and the "where to eat" list takes
 * their place, so both fit between the photo and the subtitles.
 */
const PointLayout: React.FC<LayoutProps> = ({ scene, accent, dishStarts }) => {
  const frame = useCurrentFrame();
  const points = scene.points ?? [];
  const dishes = scene.dishes ?? [];
  const swapAt = dishes.length > 0 ? dishStarts?.[0] : undefined;

  const pointsOpacity =
    swapAt === undefined
      ? 1
      : interpolate(frame, [swapAt - SWAP_FRAMES, swapAt], [1, 0], {
          easing: Easing.bezier(0.33, 0, 0.67, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  return (
    <TextBlock>
      {scene.label ? <Label text={scene.label} accent={accent} /> : null}
      <Caption text={scene.caption} size={88} />
      <div style={{ position: "relative" }}>
        <div style={{ opacity: pointsOpacity }}>
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
        </div>
        {swapAt === undefined ? null : (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
            <EatHeading accent={accent} from={swapAt} />
            <DishList
              dishes={dishes}
              starts={dishStarts ?? []}
              accent={accent}
              appearFrom={swapAt + 2}
            />
          </div>
        )}
      </div>
    </TextBlock>
  );
};

const EatHeading: React.FC<{ readonly accent: string; readonly from: number }> = ({
  accent,
  from,
}) => {
  const frame = useCurrentFrame();

  return (
    <Interactive.Div
      name="Where to eat"
      style={{
        marginTop: 30,
        fontFamily,
        fontSize: 30,
        fontWeight: 700,
        letterSpacing: 6,
        color: accent,
        opacity: interpolate(frame, [from - 4, from + 8], [0, 0.9], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >
      ĂN GẦN ĐÂY
    </Interactive.Div>
  );
};
