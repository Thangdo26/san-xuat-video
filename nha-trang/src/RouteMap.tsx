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

/** How long a route holds the frame before the scene's photos take over. */
export const ROUTE_SEC = 4.5;

/** Seconds spent zooming from the region to the day's stops. */
const ZOOM_SEC = 1.1;
/** Plates are rendered at 2.5x; past this the map turns soft. */
const MAX_SCALE = 3.2;

const PIN_RADIUS = 22;
/** Gap between a pin's edge and its label. */
const LABEL_GAP = 12;
/** Labels keep this far from the frame edge. */
const EDGE = 20;
/** The brand line and map credit sit across the top of the frame. */
const TOP_EDGE = 175;
/** Stops centre below the top band, so the top pins have room for labels. */
// The bottom of the frame fades into the caption panel, so stay above it.
const ROUTE_MID_Y = 520;
const LABEL_FONT = 36;
const LABEL_HEIGHT = 68;

type Box = { x0: number; y0: number; x1: number; y1: number };

const overlap = (a: Box, b: Box) =>
  Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) *
  Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));

/** Bold label text runs about 0.56em per character. */
const labelWidth = (name: string) =>
  Math.round(name.length * LABEL_FONT * 0.56) + 40;

type Side = "above" | "below" | "right" | "left";

/**
 * Picks where each label sits around its pin: the side that covers the
 * fewest other pins and labels, slid inward so it never leaves the frame.
 * Returns the label centre as an offset from its pin.
 */
const layoutLabels = (
  screen: readonly (readonly [number, number])[],
  names: readonly string[],
  width: number,
): { dx: number; dy: number; side: Side }[] => {
  const pins: Box[] = screen.map(([x, y]) => ({
    x0: x - PIN_RADIUS - 6,
    y0: y - PIN_RADIUS - 6,
    x1: x + PIN_RADIUS + 6,
    y1: y + PIN_RADIUS + 6,
  }));
  const placed: Box[] = [];
  return screen.map(([x, y], index) => {
    const w = labelWidth(names[index]);
    const h = LABEL_HEIGHT;
    const vertical = PIN_RADIUS + LABEL_GAP + h / 2;
    const horizontal = PIN_RADIUS + LABEL_GAP + w / 2;
    // Alternating above/below reads best along a road; the sides are fallbacks.
    const order: Side[] =
      index % 2 === 0
        ? ["above", "below", "right", "left"]
        : ["below", "above", "right", "left"];
    let best: {
      dx: number;
      dy: number;
      side: Side;
      box: Box;
      cost: number;
    } | null = null;
    order.forEach((side, rank) => {
      let cx =
        x + (side === "right" ? horizontal : side === "left" ? -horizontal : 0);
      let cy =
        y + (side === "below" ? vertical : side === "above" ? -vertical : 0);
      cx = Math.min(Math.max(cx, EDGE + w / 2), width - EDGE - w / 2);
      cy = Math.min(
        Math.max(cy, TOP_EDGE + h / 2),
        IMAGE_HEIGHT - EDGE - h / 2,
      );
      const box = {
        x0: cx - w / 2,
        y0: cy - h / 2,
        x1: cx + w / 2,
        y1: cy + h / 2,
      };
      const cost =
        [...pins, ...placed].reduce(
          (sum, other) => sum + overlap(box, other),
          0,
        ) + rank;
      if (!best || cost < best.cost) {
        best = { dx: cx - x, dy: cy - y, side, box, cost };
      }
    });
    const chosen = best!;
    placed.push(chosen.box);
    return { dx: chosen.dx, dy: chosen.dy, side: chosen.side };
  });
};

type Props = {
  readonly plate: MapPlate;
  readonly stops: MapTarget[];
  readonly accent: string;
  readonly durationInFrames: number;
};

/**
 * A day's stops on the region map: the camera zooms to fit them, then each
 * pin drops in turn and a line is drawn to it from the one before, so the
 * viewer sees the order of the day. Labels go wherever they cover the
 * fewest other pins and labels, and stay inside the frame.
 */
export const RouteMap: React.FC<Props> = ({
  plate,
  stops,
  accent,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const points = stops.map((stop) => toPlatePixel([stop.lng, stop.lat], plate));
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const spanX = Math.max(...xs) - Math.min(...xs);
  const spanY = Math.max(...ys) - Math.min(...ys);
  const fit = Math.min(
    MAX_SCALE,
    (width * 0.62) / Math.max(spanX, 1),
    (IMAGE_HEIGHT * 0.42) / Math.max(spanY, 1),
  );
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;

  const zoom = interpolate(frame, [0.1 * fps, ZOOM_SEC * fps], [0, 1], {
    easing: Easing.bezier(0.65, 0, 0.35, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // A slow drift after the zoom keeps the map from freezing while pins land.
  const drift = interpolate(
    frame,
    [ZOOM_SEC * fps, durationInFrames],
    [1, 1.06],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const scale = Math.pow(Math.max(fit, 1), zoom) * drift;
  const focusX = plate.width / 2 + (centerX - plate.width / 2) * zoom;
  const focusY = plate.height / 2 + (centerY - plate.height / 2) * zoom;
  const midY = IMAGE_HEIGHT / 2 + (ROUTE_MID_Y - IMAGE_HEIGHT / 2) * zoom;
  const toScreen = ([x, y]: readonly [number, number]) =>
    [width / 2 + (x - focusX) * scale, midY + (y - focusY) * scale] as const;

  // Pins land evenly through the time left after the zoom.
  const first = ZOOM_SEC * fps;
  const step = Math.max(
    0.45 * fps,
    (Math.min(durationInFrames, ROUTE_SEC * fps) - first - 0.6 * fps) /
      Math.max(stops.length - 1, 1),
  );
  const landAt = stops.map((_, index) => Math.round(first + index * step));

  const screen = points.map(toScreen);
  // Laid out once at the settled zoom, so labels don't hop while it moves.
  const settled = points.map(
    ([x, y]) =>
      [
        width / 2 + (x - centerX) * Math.max(fit, 1),
        ROUTE_MID_Y + (y - centerY) * Math.max(fit, 1),
      ] as const,
  );
  const labels = layoutLabels(
    settled,
    stops.map((stop) => stop.name),
    width,
  );

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
          translate: `${width / 2 - focusX * scale}px ${midY - focusY * scale}px`,
          scale: `${scale}`,
          filter: "contrast(1.3) saturate(1.35) brightness(1.12)",
        }}
      />
      <svg
        width={width}
        height={IMAGE_HEIGHT}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        {screen.slice(1).map(([x, y], index) => {
          const [px, py] = screen[index];
          const t = interpolate(
            frame,
            [landAt[index], landAt[index + 1]],
            [0, 1],
            {
              easing: Easing.bezier(0.45, 0, 0.25, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );
          return (
            <line
              key={stops[index + 1].name}
              x1={px}
              y1={py}
              x2={px + (x - px) * t}
              y2={py + (y - py) * t}
              stroke={accent}
              strokeWidth={7}
              strokeLinecap="round"
              strokeDasharray="2 16"
              style={{ filter: `drop-shadow(0 0 8px ${accent})` }}
            />
          );
        })}
      </svg>

      {stops.map((stop, index) => {
        const [x, y] = screen[index];
        const arrive = spring({
          frame,
          fps,
          delay: landAt[index],
          config: { damping: 11, mass: 0.7, stiffness: 150 },
        });
        const { dx, dy, side } = labels[index];
        return (
          <div
            key={stop.name}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 0,
              height: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: -22,
                top: -22,
                width: 44,
                height: 44,
                borderRadius: "50%",
                backgroundColor: accent,
                border: "5px solid #ffffff",
                boxShadow: `0 0 0 6px rgba(4,16,26,0.35), 0 0 30px ${accent}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily,
                fontSize: 24,
                fontWeight: 800,
                color: "#04101a",
                scale: interpolate(arrive, [0, 1], [0, 1]),
              }}
            >
              {index + 1}
            </div>
            <div
              style={{
                position: "absolute",
                left: dx,
                top: dy,
                translate: "-50% -50%",
                whiteSpace: "nowrap",
                fontFamily,
                fontSize: LABEL_FONT,
                fontWeight: 700,
                color: "#ffffff",
                padding: "8px 20px 12px",
                borderRadius: 16,
                backgroundColor: "rgba(4,16,26,0.84)",
                [side === "below" ? "borderTop" : "borderBottom"]:
                  `4px solid ${accent}`,
                opacity: arrive,
                scale: interpolate(arrive, [0, 1], [0.7, 1]),
              }}
            >
              {stop.name}
            </div>
          </div>
        );
      })}
    </ImageFrame>
  );
};
