import React from "react";
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
import type {
  Dish,
  DishBackground,
  Scene,
  StoryPart,
  StorySection,
} from "./schema";

/**
 * A food-explainer scene: the dish's photo pinned like a polaroid, its name
 * as a sticker title, and one card at a time for where it comes from, how it
 * is made, how to eat it and where to try it. Cards switch as the narration
 * reaches each part. The look is warm and playful rather than cinematic:
 * bouncy springs, bobbing emoji, steam and sparkles.
 */

const CARD_X = 70;
const CARD_Y = 170;
const CARD_W = 940;
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
  /** Label of the button the cursor clicks to move on, e.g. "MÓN TIẾP". */
  readonly nextLabel: string;
};

/** Frames the cursor takes to glide to its next target. */
const GLIDE = 14;
/** The cursor presses "next" this long before the scene ends, ahead of the transition. */
const NEXT_CLICK_BEFORE_END = 20;
const NEXT_BUTTON = { right: 56, top: 96, width: 300, height: 76 };

type Waypoint = {
  readonly frame: number;
  readonly x: number;
  readonly y: number;
  readonly click: boolean;
};

const pop = (frame: number, fps: number, delay: number, damping = 9) =>
  spring({ frame, fps, delay, config: { damping, mass: 0.6, stiffness: 160 } });

const svgUrl = (svg: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/** Repeating overlays, each drifting slowly so the backdrop never freezes. */
const PATTERNS: Record<
  DishBackground,
  { image: string; size: number; drift: readonly [number, number] }
> = {
  dots: {
    image: "radial-gradient(rgba(255,255,255,0.22) 7px, transparent 8px)",
    size: 64,
    drift: [0.6, 0.3],
  },
  // Picnic tablecloth: two translucent stripe sets crossing.
  gingham: {
    image:
      "linear-gradient(90deg, rgba(255,255,255,0.2) 50%, transparent 50%), linear-gradient(rgba(255,255,255,0.2) 50%, transparent 50%)",
    size: 90,
    drift: [0.4, 0.4],
  },
  waves: {
    image: svgUrl(
      '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60"><path d="M0 30 Q30 8 60 30 T120 30" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="7" stroke-linecap="round"/></svg>',
    ),
    size: 120,
    drift: [1.2, 0],
  },
  stripes: {
    image:
      "repeating-linear-gradient(135deg, rgba(255,255,255,0.18) 0 26px, transparent 26px 60px)",
    size: 85,
    drift: [0.5, 0.5],
  },
  stars: {
    image: svgUrl(
      '<svg xmlns="http://www.w3.org/2000/svg" width="110" height="110"><path d="M30 12 L34 26 L48 30 L34 34 L30 48 L26 34 L12 30 L26 26 Z" fill="rgba(255,255,255,0.3)"/><circle cx="82" cy="80" r="6" fill="rgba(255,255,255,0.25)"/></svg>',
    ),
    size: 110,
    drift: [0.3, 0.7],
  },
  hearts: {
    image: svgUrl(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><path d="M30 44 C10 30 14 14 26 16 C30 17 30 20 30 22 C30 20 30 17 34 16 C46 14 50 30 30 44 Z" fill="rgba(255,255,255,0.26)"/><circle cx="76" cy="74" r="5" fill="rgba(255,255,255,0.22)"/></svg>',
    ),
    size: 100,
    drift: [-0.4, 0.5],
  },
};

const Background: React.FC<{
  readonly accent: string;
  readonly kind: DishBackground;
  readonly to: string;
}> = ({ accent, kind, to }) => {
  const frame = useCurrentFrame();
  const pattern = PATTERNS[kind];
  const [dx, dy] = pattern.drift;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(170deg, ${accent} 0%, ${accent}cc 45%, ${to} 100%)`,
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage: pattern.image,
          backgroundSize: `${pattern.size}px ${pattern.size}px`,
          backgroundPosition: `${frame * dx}px ${frame * dy}px`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Frames each photo stays up before the next one fades in. */
const PHOTO_SLOT = 100;

/**
 * Cycles the dish photos every PHOTO_SLOT frames (wrapping round), each with
 * its own push-in or pull-out, so even a one-photo dish keeps moving.
 */
const Photos: React.FC<{
  readonly items: string[];
  readonly durationInFrames: number;
}> = ({ items, durationInFrames }) => {
  const frame = useCurrentFrame();
  const slots = Math.max(1, Math.round(durationInFrames / PHOTO_SLOT));
  const slot = durationInFrames / slots;
  const origins = ["50% 50%", "30% 40%", "70% 60%", "40% 70%"];
  return (
    <>
      {Array.from({ length: slots }, (_, index) => {
        const src = items[index % items.length];
        const from = Math.round(index * slot);
        const until = index === slots - 1 ? durationInFrames : Math.round((index + 1) * slot) + 12;
        const local = frame - from;
        if (local < 0 || frame > until) return null;
        const opacity =
          index === 0 ? 1 : interpolate(local, [0, 6], [0, 1], { extrapolateRight: "clamp" });
        const flash =
          index === 0 ? 0 : interpolate(local, [0, 2, 10], [0, 0.8, 0], { extrapolateRight: "clamp" });
        const scale = interpolate(
          local,
          [0, until - from],
          index % 2 === 0 ? [1.04, 1.2] : [1.2, 1.05],
          { extrapolateRight: "clamp" },
        );
        return (
          <React.Fragment key={`${src}-${index}`}>
          <Img
            src={staticFile(src)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity,
              scale: `${scale}`,
              transformOrigin: origins[index % origins.length],
            }}
          />
          {flash > 0 ? <AbsoluteFill style={{ backgroundColor: "#fff", opacity: flash }} /> : null}
          </React.Fragment>
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

/** The Nha Trang video's cursor and NEXT button; off for Phú Quốc. */
const SHOW_CURSOR = false;
const FLIP_START = 6;
const FLIP_END = 24;
/**
 * How the card reveals its dish: "flip" turns a face-down menu ticket over
 * (Phú Quốc); "develop" shakes an instant photo while it develops from a dark,
 * blurred sepia print into full colour (Quy Nhơn).
 */
const REVEAL = "develop" as "flip" | "develop";
const DEVELOP_START = 4;
const DEVELOP_END = 36;

/** The face-down side of the card: a kraft-paper menu ticket. */
const CardBack: React.FC<{
  readonly accent: string;
  readonly number?: number;
  readonly label: string;
}> = ({ accent, number, label }) => (
  <AbsoluteFill
    style={{
      background: `repeating-linear-gradient(45deg, #d9b98c 0 18px, #d2b083 18px 36px)`,
      alignItems: "center",
      justifyContent: "center",
      fontFamily,
      color: INK,
    }}
  >
    <div
      style={{
        width: CARD_W - 120,
        height: CARD_H - 120,
        border: `6px dashed ${INK}55`,
        borderRadius: 30,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: `${accent}33`,
      }}
    >
      <div style={{ fontSize: 54, fontWeight: 800, letterSpacing: 10 }}>{label}</div>
      <div style={{ fontSize: 260, fontWeight: 800, lineHeight: 1 }}>{number ?? "?"}</div>
      <div style={{ fontSize: 120 }}>❓</div>
    </div>
  </AbsoluteFill>
);

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
  const stamp = pop(frame, fps, (REVEAL === "flip" ? FLIP_END : DEVELOP_END) - 4);
  // The card lands face down, then flips over to reveal the dish.
  const flip = interpolate(frame, [FLIP_START, FLIP_END], [180, 0], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const flipping = REVEAL === "flip" && Boolean(story);
  const faceDown = flipping && flip > 90;
  const develop = REVEAL === "develop" && story
    ? interpolate(frame, [DEVELOP_START, DEVELOP_END], [0, 1], {
        easing: Easing.out(Easing.quad),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;
  const shake = Math.sin(frame * 1.3) * (1 - develop) * 16;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: CARD_X,
          top: CARD_Y,
          width: CARD_W,
          height: CARD_H,
          transform: `translateX(${shake}px) perspective(2400px) rotateY(${flipping ? (faceDown ? flip - 180 : flip) : 0}deg) rotate(${wobble + shake * 0.15}deg) scale(${interpolate(enter, [0, 1], [0.6, 1])})`,
          opacity: enter,
          borderRadius: 44,
          border: "18px solid #ffffff",
          boxShadow: "0 30px 60px rgba(80,30,0,0.35)",
          overflow: "hidden",
          backgroundColor: "#fff",
        }}
      >
        {faceDown ? (
          <CardBack accent={accent} number={story?.number} label={numberLabel} />
        ) : story?.illustration ? (
          <Illustration emoji={story.illustration} accent={accent} />
        ) : (
          <>
            <AbsoluteFill
              style={{
                filter: develop < 1
                  ? `brightness(${0.25 + develop * 0.75}) sepia(${1 - develop}) blur(${(1 - develop) * 14}px)`
                  : undefined,
              }}
            >
              <Photos
                items={scene.gallery ?? []}
                durationInFrames={durationInFrames}
              />
            </AbsoluteFill>
            {develop < 1 ? (
              <AbsoluteFill style={{ backgroundColor: "#1d2b2a", opacity: (1 - develop) * 0.85 }} />
            ) : null}
          </>
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

/** Centre of progress dot `index` on the info card while that card is shown. */
const dotCenter = (index: number, count: number): [number, number] => {
  let right = 1080 - (SAFE_LEFT - 10) - 40;
  let center = right;
  for (let i = count - 1; i >= 0; i--) {
    const width = i === index ? 34 : 14;
    if (i === index) center = right - width / 2;
    right -= width + 18;
  }
  return [center, INFO_Y + 28 + 31];
};

/** Where the cursor waits between clicks, clear of the card text. */
const CURSOR_REST: [number, number] = [1000, 1110];

/**
 * The cursor's path through a scene: it clicks each card's progress dot as the
 * card arrives, rests at the edge in between, and finally clicks "next" just
 * before the transition, so the edit reads like someone tapping through.
 */
const cursorPath = (
  sectionStarts: number[],
  durationInFrames: number,
): Waypoint[] => {
  const points: Waypoint[] = [{ frame: 0, x: 980, y: 1700, click: false }];
  const push = (point: Waypoint) => {
    const last = points[points.length - 1];
    if (point.frame >= last.frame + GLIDE + 4) points.push(point);
  };
  sectionStarts.forEach((start, index) => {
    const [x, y] = dotCenter(index, sectionStarts.length);
    push({ frame: start, x, y, click: true });
    push({ frame: start + 26, x: CURSOR_REST[0], y: CURSOR_REST[1], click: false });
  });
  push({
    frame: durationInFrames - NEXT_CLICK_BEFORE_END,
    x: 1080 - NEXT_BUTTON.right - NEXT_BUTTON.width / 2 + 40,
    y: NEXT_BUTTON.top + NEXT_BUTTON.height / 2 + 6,
    click: true,
  });
  return points;
};

const Cursor: React.FC<{ readonly path: Waypoint[] }> = ({ path }) => {
  const frame = useCurrentFrame();
  let [x, y] = [path[0].x, path[0].y];
  for (let i = 1; i < path.length; i++) {
    const from = path[i - 1];
    const to = path[i];
    const start = Math.max(to.frame - GLIDE, from.frame);
    if (frame < start) break;
    const t = interpolate(frame, [start, to.frame], [0, 1], {
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    });
    x = from.x + (to.x - from.x) * t;
    // A slight arc makes the glide look hand-moved.
    y = from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * 40;
  }
  let press = 1;
  const ripples: { at: number; d: number }[] = [];
  for (const point of path) {
    if (!point.click) continue;
    const d = frame - point.frame;
    if (d >= -3 && d <= 6) {
      press = Math.min(press, interpolate(d, [-3, 0, 6], [1, 0.78, 1]));
    }
    if (d >= 0 && d <= 20) ripples.push({ at: point.frame, d });
  }
  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <>
      {ripples.map(({ at, d }) => (
        <div
          key={at}
          style={{
            position: "absolute",
            left: x - 60,
            top: y - 60,
            width: 120,
            height: 120,
            borderRadius: "50%",
            border: "8px solid #ffffff",
            boxSizing: "border-box",
            scale: `${interpolate(d, [0, 20], [0.2, 1.3])}`,
            opacity: interpolate(d, [0, 20], [0.9, 0]),
          }}
        />
      ))}
      <svg
        width={78}
        height={96}
        viewBox="0 0 26 32"
        style={{
          position: "absolute",
          // The arrow's tip is the hotspot.
          left: x - 3,
          top: y - 2,
          opacity,
          scale: `${press}`,
          transformOrigin: "3px 2px",
          filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.35))",
        }}
      >
        <path
          d="M1 1 L1 25 L7.5 19 L12 29.5 L16.5 27.5 L12 17.5 L21 17.5 Z"
          fill="#ffffff"
          stroke={INK}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
};

/** A pill the cursor taps right before the scene changes. */
const NextButton: React.FC<{
  readonly label: string;
  readonly accent: string;
  readonly durationInFrames: number;
}> = ({ label, accent, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const clickAt = durationInFrames - NEXT_CLICK_BEFORE_END;
  const s = pop(frame, fps, clickAt - 34, 10);
  const pressed = frame >= clickAt;
  const press = interpolate(frame - clickAt, [-1, 2, 7], [1, 0.88, 1.04], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (frame < clickAt - 34) return null;
  return (
    <div
      style={{
        position: "absolute",
        right: NEXT_BUTTON.right,
        top: NEXT_BUTTON.top,
        width: NEXT_BUTTON.width,
        height: NEXT_BUTTON.height,
        borderRadius: 999,
        backgroundColor: pressed ? accent : CREAM,
        border: `5px solid ${INK}`,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
        fontSize: 36,
        fontWeight: 800,
        letterSpacing: 2,
        color: INK,
        boxShadow: pressed ? `0 2px 0 ${INK}` : `0 9px 0 ${INK}`,
        translate: `0px ${pressed ? 7 : 0}px`,
        scale: `${s * press}`,
      }}
    >
      {label} ➜
    </div>
  );
};

export const DishScene: React.FC<Props> = ({
  scene,
  accent,
  sectionStarts,
  durationInFrames,
  numberLabel,
  nextLabel,
}) => {
  const sections = scene.story?.sections ?? [];
  const path = cursorPath(sectionStarts.slice(0, sections.length), durationInFrames);
  return (
    <AbsoluteFill>
      <Background
        accent={accent}
        kind={scene.story?.background ?? "dots"}
        to={scene.story?.backgroundTo ?? "#ff8f6b"}
      />
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
      {SHOW_CURSOR ? (
        <>
          <NextButton label={nextLabel} accent={accent} durationInFrames={durationInFrames} />
          <Cursor path={path} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};
