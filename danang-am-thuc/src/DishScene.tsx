import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontFamily } from "./font";
import { SAFE_LEFT } from "./layouts";
import type { Dish, Scene, StoryPart, StorySection } from "./schema";

/**
 * A food-explainer scene: the dish's photo pinned like a polaroid, its name
 * as a sticker title, and one card at a time for where it comes from, how it
 * is made, how to eat it and where to try it. Cards switch as the narration
 * reaches each part. The look is warm and playful rather than cinematic:
 * bouncy springs, bobbing emoji, steam and sparkles.
 */

const CARD_X = 150;
const CARD_Y = 170;
const CARD_W = 780;
const CARD_H = 700;
const TITLE_Y = 930;
const INFO_Y = 1150;
/** Info cards stop above the subtitle band at 1620. */
const INFO_MAX_H = 430;

const CREAM = "#fff6ea";
const INK = "#3a2618";

const PART_ICON: Record<StoryPart, string> = {
  origin: "📜",
  made: "👩‍🍳",
  eat: "🥢",
  where: "📍",
};

/** Where stickers sit around the photo card, as [x, y] in frame pixels. */
const STICKER_SLOTS: ReadonlyArray<readonly [number, number]> = [
  [110, 200],
  [930, 250],
  [80, 500],
  [945, 820],
  [540, 130],
  [905, 540],
];

type Props = {
  readonly scene: Scene;
  readonly accent: string;
  /** Frame each section's card appears at, one per section. */
  readonly sectionStarts: number[];
  readonly durationInFrames: number;
  /** Text for the stamp, e.g. "MÓN" or "DISH". */
  readonly numberLabel: string;
};

const pop = (frame: number, fps: number, delay: number, damping = 9) =>
  spring({ frame, fps, delay, config: { damping, mass: 0.6, stiffness: 160 } });

const Background: React.FC<{ readonly accent: string }> = ({ accent }) => {
  const frame = useCurrentFrame();
  // Polka dots drift slowly so the backdrop never looks frozen.
  const shift = frame * 0.6;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(170deg, ${accent} 0%, ${accent}cc 45%, #ff8f6b 100%)`,
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.22) 7px, transparent 8px)",
          backgroundSize: "64px 64px",
          backgroundPosition: `${shift}px ${shift * 0.5}px`,
        }}
      />
    </AbsoluteFill>
  );
};

const Photos: React.FC<{
  readonly items: string[];
  readonly durationInFrames: number;
}> = ({ items, durationInFrames }) => {
  const frame = useCurrentFrame();
  const slot = durationInFrames / items.length;
  return (
    <>
      {items.map((src, index) => {
        const from = Math.round(index * slot);
        const until =
          index === items.length - 1
            ? durationInFrames
            : Math.round((index + 1) * slot) + 12;
        const local = frame - from;
        if (local < 0 || frame > until) return null;
        const opacity =
          index === 0
            ? 1
            : interpolate(local, [0, 12], [0, 1], {
                extrapolateRight: "clamp",
              });
        const scale = interpolate(
          local,
          [0, until - from],
          index % 2 === 0 ? [1.05, 1.18] : [1.18, 1.06],
          {
            extrapolateRight: "clamp",
          },
        );
        return (
          <Img
            key={src}
            src={staticFile(src)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity,
              scale: `${scale}`,
            }}
          />
        );
      })}
    </>
  );
};

/** Drawn in place of a photo when no free one exists: the dish's parts. */
const Illustration: React.FC<{
  readonly emoji: string[];
  readonly accent: string;
}> = ({ emoji, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [hero, ...rest] = emoji;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 45%, #ffffff 0%, ${accent}55 70%, ${accent}88 100%)`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontSize: 300,
          scale: `${pop(frame, fps, 4)}`,
          translate: `0px ${Math.sin(frame / 14) * 10}px`,
        }}
      >
        {hero}
      </div>
      {rest.map((item, index) => {
        const angle = (index / rest.length) * Math.PI * 2 - Math.PI / 2;
        const radius = 270;
        return (
          <div
            key={`${item}-${index}`}
            style={{
              position: "absolute",
              left:
                CARD_W / 2 - 16 + Math.cos(angle + frame / 90) * radius - 55,
              top:
                CARD_H / 2 -
                28 +
                Math.sin(angle + frame / 90) * radius * 0.82 -
                55,
              fontSize: 110,
              scale: `${pop(frame, fps, 10 + index * 4)}`,
            }}
          >
            {item}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Soft wisps rising off the dish. */
const Steam: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <svg
      width={300}
      height={260}
      style={{
        position: "absolute",
        left: 540 - 150,
        top: CARD_Y - 150,
        overflow: "visible",
      }}
    >
      {[0, 1, 2].map((i) => {
        const t = ((frame + i * 22) % 66) / 66;
        const x = 70 + i * 80;
        return (
          <path
            key={i}
            d={`M ${x} 230 C ${x - 30} 180, ${x + 30} 140, ${x} 90 S ${x - 20} 30, ${x + 10} 0`}
            fill="none"
            stroke="white"
            strokeWidth={14}
            strokeLinecap="round"
            opacity={interpolate(t, [0, 0.3, 1], [0, 0.55, 0])}
            transform={`translate(0 ${-t * 60})`}
            style={{ filter: "blur(5px)" }}
          />
        );
      })}
    </svg>
  );
};

const PhotoCard: React.FC<{
  readonly scene: Scene;
  readonly accent: string;
  readonly durationInFrames: number;
  readonly numberLabel: string;
}> = ({ scene, accent, durationInFrames, numberLabel }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = pop(frame, fps, 0, 12);
  const wobble = Math.sin(frame / 28) * 1.2 - 2;
  const story = scene.story;
  const stamp = pop(frame, fps, 10);

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: CARD_X,
          top: CARD_Y,
          width: CARD_W,
          height: CARD_H,
          rotate: `${wobble}deg`,
          scale: `${interpolate(enter, [0, 1], [0.6, 1])}`,
          opacity: enter,
          borderRadius: 44,
          border: "18px solid #ffffff",
          boxShadow: "0 30px 60px rgba(80,30,0,0.35)",
          overflow: "hidden",
          backgroundColor: "#fff",
        }}
      >
        {story?.illustration ? (
          <Illustration emoji={story.illustration} accent={accent} />
        ) : (
          <Photos
            items={scene.gallery ?? []}
            durationInFrames={durationInFrames}
          />
        )}
      </div>
      {/* Two strips of tape hold the photo down. */}
      {[
        [CARD_X + 40, CARD_Y - 26, -18],
        [CARD_X + CARD_W - 190, CARD_Y - 22, 14],
      ].map(([x, y, r], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: 160,
            height: 54,
            rotate: `${r}deg`,
            backgroundColor: "rgba(255,240,200,0.75)",
            boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
            opacity: enter,
          }}
        />
      ))}
      {story ? (
        <div
          style={{
            position: "absolute",
            left: CARD_X - 60,
            top: CARD_Y + CARD_H - 150,
            width: 190,
            height: 190,
            borderRadius: "50%",
            backgroundColor: INK,
            color: CREAM,
            border: `8px dashed ${accent}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily,
            rotate: "-12deg",
            scale: `${stamp}`,
            boxShadow: "0 12px 24px rgba(0,0,0,0.25)",
          }}
        >
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 4 }}>
            {numberLabel}
          </div>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1 }}>
            {story.number}
            <span style={{ fontSize: 34, opacity: 0.7 }}>/{story.total}</span>
          </div>
        </div>
      ) : null}
    </>
  );
};

/** Emoji that pop in one after another, then bob gently. */
export const Stickers: React.FC<{
  readonly emoji: string[];
  readonly delay?: number;
}> = ({ emoji, delay = 14 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      {emoji.slice(0, STICKER_SLOTS.length).map((item, index) => {
        const [x, y] = STICKER_SLOTS[index];
        const s = pop(frame, fps, delay + index * 6, 7);
        return (
          <div
            key={`${item}-${index}`}
            style={{
              position: "absolute",
              left: x - 60,
              top: y - 60,
              fontSize: 104,
              scale: `${s}`,
              rotate: `${Math.sin((frame + index * 17) / 16) * 12}deg`,
              translate: `0px ${Math.sin((frame + index * 11) / 20) * 14}px`,
              filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.25))",
            }}
          >
            {item}
          </div>
        );
      })}
    </>
  );
};

const Title: React.FC<{
  readonly text: string;
  readonly tagline?: string;
  readonly accent: string;
}> = ({ text, tagline, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, 6, 8);
  const t = pop(frame, fps, 14, 14);
  // Long names shrink to stay on one line inside the frame.
  const size = Math.min(96, Math.round(1500 / Math.max(text.length, 1)));
  return (
    <div
      style={{
        position: "absolute",
        top: TITLE_Y,
        width: "100%",
        textAlign: "center",
        fontFamily,
      }}
    >
      <div
        style={{
          display: "inline-block",
          fontSize: Math.max(58, size),
          fontWeight: 800,
          color: "#ffffff",
          whiteSpace: "nowrap",
          WebkitTextStroke: `14px ${INK}`,
          paintOrder: "stroke fill",
          letterSpacing: 1,
          scale: `${interpolate(s, [0, 1], [0.4, 1])}`,
          rotate: `${interpolate(s, [0, 1], [-8, -2])}deg`,
          textShadow: `0 10px 0 ${accent}`,
        }}
      >
        {text}
      </div>
      {tagline ? (
        <div
          style={{
            marginTop: 8,
            fontSize: 38,
            fontWeight: 700,
            color: INK,
            opacity: t,
            translate: `0px ${interpolate(t, [0, 1], [20, 0])}px`,
          }}
        >
          {tagline}
        </div>
      ) : null}
    </div>
  );
};

/** A burst of sparkles, played each time a new card arrives. */
const Sparkles: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, 22], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <>
      {Array.from({ length: 7 }, (_, i) => {
        const angle = (i / 7) * Math.PI * 2;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 120 + Math.cos(angle) * 120 * t,
              top: 30 + Math.sin(angle) * 80 * t,
              fontSize: 44,
              opacity: 1 - t,
              scale: `${0.6 + t}`,
            }}
          >
            ✨
          </div>
        );
      })}
    </>
  );
};

const PlaceRow: React.FC<{
  readonly place: Dish;
  readonly accent: string;
  readonly delay: number;
}> = ({ place, accent, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, delay, 12);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 14,
        marginTop: 16,
        opacity: s,
        translate: `${interpolate(s, [0, 1], [-40, 0])}px 0px`,
      }}
    >
      <span style={{ fontSize: 40, fontWeight: 800, color: INK }}>
        {place.place}
      </span>
      <span
        style={{ fontSize: 30, fontWeight: 600, color: `${INK}99`, flex: 1 }}
      >
        {place.address}
      </span>
      {place.rating ? (
        <span
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: INK,
            backgroundColor: accent,
            borderRadius: 999,
            padding: "2px 16px",
          }}
        >
          ★ {place.rating.toFixed(1)}
        </span>
      ) : null}
    </div>
  );
};

const InfoCard: React.FC<{
  readonly section: StorySection;
  readonly index: number;
  readonly count: number;
  readonly accent: string;
}> = ({ section, index, count, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, 0, 10);
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE_LEFT - 10,
        top: INFO_Y,
        width: 1080 - (SAFE_LEFT - 10) * 2,
        maxHeight: INFO_MAX_H,
        boxSizing: "border-box",
        padding: "28px 40px 34px",
        borderRadius: 40,
        backgroundColor: CREAM,
        boxShadow: "0 18px 40px rgba(80,30,0,0.28)",
        fontFamily,
        scale: `${interpolate(s, [0, 1], [0.85, 1])}`,
        rotate: `${interpolate(s, [0, 1], [3, index % 2 === 0 ? -1 : 1])}deg`,
        opacity: interpolate(s, [0, 0.4], [0, 1], {
          extrapolateRight: "clamp",
        }),
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <span
          style={{
            fontSize: 38,
            fontWeight: 800,
            color: INK,
            backgroundColor: accent,
            borderRadius: 999,
            padding: "6px 26px",
          }}
        >
          {PART_ICON[section.part]} {section.title}
        </span>
        <div style={{ flex: 1 }} />
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            style={{
              width: i === index ? 34 : 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: i === index ? INK : `${INK}33`,
            }}
          />
        ))}
      </div>
      {section.places ? (
        <div style={{ marginTop: 6 }}>
          {section.places.map((place, i) => (
            <PlaceRow
              key={place.place}
              place={place}
              accent={accent}
              delay={6 + i * 7}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            marginTop: 22,
            fontSize: 47,
            fontWeight: 600,
            lineHeight: 1.34,
            color: INK,
          }}
        >
          {section.text}
        </div>
      )}
      <div style={{ position: "absolute", left: 0, top: 0 }}>
        <Sparkles />
      </div>
    </div>
  );
};

export const DishScene: React.FC<Props> = ({
  scene,
  accent,
  sectionStarts,
  durationInFrames,
  numberLabel,
}) => {
  const sections = scene.story?.sections ?? [];
  return (
    <AbsoluteFill>
      <Background accent={accent} />
      <Steam />
      <PhotoCard
        scene={scene}
        accent={accent}
        durationInFrames={durationInFrames}
        numberLabel={numberLabel}
      />
      <Stickers emoji={scene.stickers ?? []} />
      <Title
        text={scene.caption}
        tagline={scene.story?.tagline}
        accent={accent}
      />
      {sections.map((section, index) => {
        const from = sectionStarts[index] ?? 0;
        const until = sectionStarts[index + 1] ?? durationInFrames;
        return (
          <Sequence
            key={section.part}
            from={from}
            durationInFrames={Math.max(1, until - from)}
            layout="none"
          >
            <InfoCard
              section={section}
              index={index}
              count={sections.length}
              accent={accent}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
