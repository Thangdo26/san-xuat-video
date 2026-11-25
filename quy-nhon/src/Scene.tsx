import type { Caption } from "@remotion/captions";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontFamily } from "./font";
import { FlightMap } from "./FlightMap";
import { evenSlots, Gallery, MEDIA_CROSSFADE_FRAMES, Scrim } from "./Gallery";
import { SceneLayout } from "./layouts";
import { MAP_INTRO_SEC, MapAttribution, MapIntro } from "./MapIntro";
import { ROUTE_SEC, RouteMap } from "./RouteMap";
import type { Dish, MapPlate, Scene as SceneData, VideoData, VoiceClip } from "./schema";
import { SceneBackground } from "./SceneBackground";
import { Subtitles } from "./Subtitles";

type Props = {
  readonly scene: SceneData;
  readonly theme: VideoData["theme"];
  readonly language: string;
  readonly plate?: MapPlate;
  readonly flightPlate?: MapPlate;
  /** Position in the video; varies the camera moves from scene to scene. */
  readonly index: number;
  readonly voice?: VoiceClip;
  /** Frame within the scene the voice clip starts at. */
  readonly voiceOffsetFrames: number;
  readonly subtitles: boolean;
  readonly durationInFrames: number;
};

const normalise = (text: string) =>
  text
    .normalize("NFC")
    .toLowerCase()
    .replace(/[.,!?;:"'()…-]/g, "")
    .trim();

/** Frame (within the clip) at which `phrase` starts being spoken, if found. */
const spokenAtFrame = (
  words: Caption[],
  phrase: string,
  fps: number,
): number | null => {
  const wanted = phrase.split(/\s+/).map(normalise).filter(Boolean);
  const spoken = words.map((word) => normalise(word.text));
  for (let i = 0; i + wanted.length <= spoken.length; i++) {
    if (wanted.every((token, k) => spoken[i + k] === token)) {
      return Math.round((words[i].startMs / 1000) * fps);
    }
  }
  return null;
};

/**
 * Switch to each dish just before its name is spoken. A "food" scene opens on
 * its first dish; a "point" scene reaches its dishes partway through, so the
 * first one is timed as well. Falls back to even spacing from `from` when
 * there is no word timing (e.g. no voice-over yet, or a provider without
 * timestamps) or a dish is not found in the narration.
 */
const dishStartFrames = (
  dishes: Dish[],
  voice: VoiceClip | undefined,
  voiceOffsetFrames: number,
  fps: number,
  from: number,
  durationInFrames: number,
  syncFirst: boolean,
): number[] => {
  const fallback = evenSlots(dishes.length, from, durationInFrames);
  if (!voice || voice.words.length === 0) {
    return fallback;
  }
  const lead = Math.round(0.15 * fps);
  const synced = dishes.map((dish, index) => {
    if (index === 0 && !syncFirst) {
      return 0;
    }
    const at = spokenAtFrame(voice.words, dish.spokenAs ?? dish.name, fps);
    return at === null ? null : voiceOffsetFrames + at - lead;
  });
  const ascending = synced.every(
    (frame, index) =>
      frame !== null && (index === 0 || frame > (synced[index - 1] ?? 0)),
  );
  return ascending ? (synced as number[]) : fallback;
};

export const Scene: React.FC<Props> = ({
  scene,
  theme,
  language,
  plate,
  flightPlate,
  index,
  voice,
  voiceOffsetFrames,
  subtitles,
  durationInFrames,
}) => {
  const { fps, height } = useVideoConfig();
  const full = scene.frame === "full";
  const isFlight = scene.layout === "flight";
  const accent = scene.accent ?? theme.accent;

  // A route replaces the single-pin zoom; with no photos it holds the scene.
  const hasRoute = Boolean(scene.route && scene.route.length > 0 && plate) && !isFlight;
  const routeOnly = hasRoute && (scene.gallery ?? []).length === 0;
  const hasMap = Boolean(scene.map && plate) && !isFlight && !hasRoute;
  const mapFrames = hasRoute
    ? routeOnly
      ? durationInFrames
      : Math.round(ROUTE_SEC * fps)
    : hasMap
      ? Math.round(MAP_INTRO_SEC * fps)
      : 0;

  const isFood = scene.layout === "food";
  const dishes = scene.dishes ?? [];
  const dishStarts =
    dishes.length > 0
      ? dishStartFrames(
          dishes,
          voice,
          voiceOffsetFrames,
          fps,
          isFood ? 0 : Math.round(durationInFrames / 2),
          durationInFrames,
          !isFood,
        )
      : undefined;

  // The scene's photos share the time until the first dish photo; each dish
  // photo then appears as its dish is spoken.
  const dishPhotos = dishes.flatMap((dish, index) =>
    dish.image ? [{ src: dish.image, from: dishStarts?.[index] ?? 0 }] : [],
  );
  const photos = isFood || isFlight ? [] : (scene.gallery ?? []);
  const photosEnd = dishPhotos[0]?.from ?? durationInFrames;
  const items = [...photos, ...dishPhotos.map((photo) => photo.src)];
  const slotStarts = [
    ...evenSlots(photos.length, mapFrames, photosEnd),
    ...dishPhotos.map((photo) => photo.from),
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#04101a" }}>
      <SceneBackground glow={`${accent}42`} />

      {isFlight && scene.flight && flightPlate ? (
        <>
          <FlightMap plate={flightPlate} flight={scene.flight} accent={accent} />
          <MapAttribution text={flightPlate.attribution} visibleUntil={durationInFrames} />
        </>
      ) : null}

      {hasRoute && scene.route && plate ? (
        <Sequence
          durationInFrames={Math.min(durationInFrames, mapFrames + MEDIA_CROSSFADE_FRAMES)}
          layout="none"
        >
          <RouteMap
            plate={plate}
            stops={scene.route}
            accent={accent}
            durationInFrames={mapFrames}
          />
        </Sequence>
      ) : null}

      {hasMap && scene.map && plate ? (
        <Sequence
          durationInFrames={mapFrames + MEDIA_CROSSFADE_FRAMES}
          layout="none"
        >
          <MapIntro
            plate={plate}
            target={scene.map}
            accent={accent}
            durationInFrames={mapFrames}
          />
        </Sequence>
      ) : null}

      {items.length > 0 ? (
        <Gallery
          items={items}
          slotStarts={slotStarts}
          endFrame={durationInFrames}
          fadeInFirst={hasMap || hasRoute}
          height={full ? height : undefined}
          moveOffset={index * 2}
        />
      ) : null}
      {isFlight ? null : <Scrim full={full} />}

      {(hasMap || hasRoute) && plate ? (
        <Sequence
          durationInFrames={Math.min(durationInFrames, mapFrames + MEDIA_CROSSFADE_FRAMES)}
          layout="none"
        >
          <MapAttribution
            text={plate.attribution}
            visibleUntil={routeOnly ? durationInFrames + 30 : mapFrames + MEDIA_CROSSFADE_FRAMES}
          />
        </Sequence>
      ) : null}

      {subtitles && voice && voice.words.length > 0 ? (
        <Subtitles
          words={voice.words}
          offsetFrames={voiceOffsetFrames}
          accent={accent}
        />
      ) : null}

      <SceneLayout
        scene={scene}
        accent={accent}
        language={language}
        dishStarts={dishStarts}
      />
      {scene.layout === "point" || isFood ? <Brand text={theme.brand} /> : null}
      {scene.layout === "point" ? (
        <ViewfinderSnap
          target={scene.route?.[0] ?? scene.map}
          label={scene.label ?? ""}
          accent={accent}
          from={routeOnly ? 12 : mapFrames}
          seed={index}
        />
      ) : null}

      {voice ? (
        <Sequence from={voiceOffsetFrames} layout="none">
          <Audio src={staticFile(voice.file)} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

const SHUTTER_FRAMES = 8;

/** "13.7868°N · 109.2111°E", typed out a few characters per frame. */
const gps = (lat: number, lng: number) =>
  `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? "N" : "S"} · ${Math.abs(lng).toFixed(4)}°${lng >= 0 ? "E" : "W"}`;

/**
 * The map hands over to the photos like a camera taking a shot: shutter
 * blades snap shut and open with a white flash, then viewfinder corners,
 * a blinking REC dot and the stop's GPS position type in at the top.
 */
const ViewfinderSnap: React.FC<{
  readonly target?: { readonly name: string; readonly lat: number; readonly lng: number };
  readonly label: string;
  readonly accent: string;
  readonly from: number;
  readonly seed: number;
}> = ({ target, label, accent, from, seed }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = frame - from;
  if (t < 0) return null;

  // Blades close over 4 frames, then open; the flash peaks as they open.
  const blade = interpolate(t, [0, SHUTTER_FRAMES / 2, SHUTTER_FRAMES], [0, 1, 0], {
    easing: Easing.inOut(Easing.quad),
    extrapolateRight: "clamp",
  });
  const flash = interpolate(t, [SHUTTER_FRAMES / 2, SHUTTER_FRAMES / 2 + 2, 22], [0, 0.85, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const corners = interpolate(t, [SHUTTER_FRAMES, SHUTTER_FRAMES + 10], [1.08, 1], {
    easing: Easing.out(Easing.back(2)),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hud = interpolate(t, [SHUTTER_FRAMES, SHUTTER_FRAMES + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const coords = target ? gps(target.lat, target.lng) : "";
  const typed = coords.slice(0, Math.max(0, Math.floor((t - SHUTTER_FRAMES - 4) * 1.5)));
  const rec = Math.floor(t / 15) % 2 === 0;
  const inset = 44;
  const arm = 86;
  const tilt = seed % 2 === 0 ? -1 : 1;
  const corner = (pos: React.CSSProperties, borders: React.CSSProperties) => (
    <div style={{ position: "absolute", width: arm, height: arm, ...pos, ...borders }} />
  );
  const line = `5px solid ${accent}`;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: (height / 2) * blade, background: "#05080c" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: (height / 2) * blade, background: "#05080c" }} />
      <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />
      <AbsoluteFill style={{ transform: `scale(${corners})`, opacity: hud * 0.9 }}>
        {corner({ left: inset, top: inset }, { borderLeft: line, borderTop: line })}
        {corner({ right: inset, top: inset }, { borderRight: line, borderTop: line })}
        {corner({ left: inset, bottom: inset }, { borderLeft: line, borderBottom: line })}
        {corner({ right: inset, bottom: inset }, { borderRight: line, borderBottom: line })}
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 150,
          right: 80,
          maxWidth: width * 0.5,
          padding: "14px 22px",
          borderRadius: 14,
          background: "rgba(4, 12, 20, 0.55)",
          border: `2px solid ${accent}88`,
          fontFamily,
          color: "#ffffff",
          textAlign: "right",
          opacity: hud,
          transform: `translateY(${(1 - hud) * -16}px) rotate(${tilt * 1.5}deg)`,
          textShadow: "0 2px 6px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 3 }}>
          <span style={{ color: "#ff4d4d", opacity: rec ? 1 : 0.25 }}>●</span> REC · {label}
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, fontVariantNumeric: "tabular-nums", minHeight: 32 }}>
          📍 {typed}
          <span style={{ opacity: typed.length < coords.length ? 1 : 0 }}>▌</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Brand: React.FC<{ readonly text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        position: "absolute",
        // At the top, so nothing but the subtitles sits below the text block.
        top: 64,
        width: "100%",
        textAlign: "center",
        fontFamily,
        fontSize: 32,
        fontWeight: 600,
        letterSpacing: 8,
        color: "rgba(255,255,255,0.42)",
        opacity: interpolate(frame, [1.4 * fps, 2 * fps], [0, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >
      {text}
    </div>
  );
};
