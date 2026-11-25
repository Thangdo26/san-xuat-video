import {
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontFamily } from "./font";
import { IMAGE_HEIGHT, ImageFrame } from "./Gallery";
import { toPlatePixel } from "./map-projection";
import type { MapPlate, MapTarget } from "./schema";

export const MAP_INTRO_SEC = 2;

/** How far the camera ends up zoomed relative to the region view. */
const ZOOM = 2.4;

type Props = {
  readonly plate: MapPlate;
  readonly target: MapTarget;
  readonly accent: string;
  /** Length of the zoom; the photos dissolve in after it. */
  readonly durationInFrames: number;
};

/**
 * Zooms from the whole region into one place on a pre-rendered map plate and
 * drops a pin there. Pure CSS over a still image: no WebGL or tile requests
 * at render time, so it is fast and identical on every render.
 */
export const MapIntro: React.FC<Props> = ({
  plate,
  target,
  accent,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const progress = interpolate(
    frame,
    [0.15 * fps, durationInFrames - 0.3 * fps],
    [0, 1],
    {
      easing: Easing.bezier(0.65, 0, 0.35, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Interpolating zoom in log space keeps the perceived speed even.
  const scale = Math.pow(ZOOM, progress);
  const [targetX, targetY] = toPlatePixel([target.lng, target.lat], plate);
  const focusX = plate.width / 2 + (targetX - plate.width / 2) * progress;
  const focusY = plate.height / 2 + (targetY - plate.height / 2) * progress;

  const pinX = width / 2 + (targetX - focusX) * scale;
  const pinY = IMAGE_HEIGHT / 2 + (targetY - focusY) * scale;

  const arrive = spring({
    frame,
    fps,
    delay: Math.round(durationInFrames * 0.55),
    config: { damping: 12, mass: 0.7, stiffness: 140 },
  });
  const pulse = ((frame - durationInFrames * 0.7) / (0.9 * fps)) % 1;

  return (
    <ImageFrame>
      <Img
        src={staticFile(plate.plate)}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: plate.width,
          height: plate.height,
          transformOrigin: "0 0",
          translate: `${width / 2 - focusX * scale}px ${IMAGE_HEIGHT / 2 - focusY * scale}px`,
          scale: `${scale}`,
          // The fiord style is low-contrast; lift it so land and sea separate.
          filter: "contrast(1.3) saturate(1.35) brightness(1.12)",
        }}
      />

      {frame > durationInFrames * 0.7 ? (
        <div
          style={{
            position: "absolute",
            left: pinX,
            top: pinY,
            width: 0,
            height: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -70 * pulse,
              top: -70 * pulse,
              width: 140 * pulse,
              height: 140 * pulse,
              borderRadius: "50%",
              border: `4px solid ${accent}`,
              opacity: 1 - pulse,
            }}
          />
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          left: pinX,
          top: pinY,
          width: 0,
          height: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -15,
            top: -15,
            width: 30,
            height: 30,
            borderRadius: "50%",
            backgroundColor: accent,
            border: "5px solid #ffffff",
            boxShadow: `0 0 0 6px rgba(4,16,26,0.35), 0 0 36px ${accent}`,
            scale: interpolate(arrive, [0, 1], [0.55, 1]),
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 34,
            translate: "-50% 0px",
            whiteSpace: "nowrap",
            fontFamily,
            fontSize: 40,
            fontWeight: 700,
            color: "#ffffff",
            padding: "12px 26px 16px",
            borderRadius: 18,
            backgroundColor: "rgba(4,16,26,0.82)",
            borderBottom: `4px solid ${accent}`,
            opacity: arrive,
            scale: interpolate(arrive, [0, 1], [0.7, 1]),
          }}
        >
          {target.name}
        </div>
      </div>
    </ImageFrame>
  );
};

/** Required by the map licence while the map is on screen. */
export const MapAttribution: React.FC<{
  readonly text: string;
  readonly visibleUntil: number;
}> = ({ text, visibleUntil }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: "absolute",
        // Below TikTok's top tabs, clear of the pin label and subtitles.
        top: 140,
        right: 28,
        fontFamily,
        fontSize: 22,
        fontWeight: 500,
        color: "rgba(255,255,255,0.7)",
        textShadow: "0 1px 4px rgba(0,0,0,0.8)",
        opacity: interpolate(
          frame,
          [visibleUntil - 10, visibleUntil],
          [1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        ),
      }}
    >
      {text}
    </div>
  );
};
