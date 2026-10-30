import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontFamily } from "./font";
import { toPlatePixel } from "./map-projection";
import type { Flight, MapPlate } from "./schema";

/** Seconds before the first plane takes off, and between departures. */
const TAKE_OFF_SEC = 0.6;
const STAGGER_SEC = 0.35;
/** Seconds each flight takes on screen. */
const FLY_SEC = 2.4;

/** A plane pointing right (+x), centred on the origin. */
const PLANE_PATH =
  "M-22 0 L-12 -3 L-4 -3 L6 -17 L11 -17 L6 -3 L15 -3 L20 -9 L24 -9 L21 0 L24 9 L20 9 L15 3 L6 3 L11 17 L6 17 L-4 3 L-12 3 Z";

type Point = readonly [number, number];

/** Quadratic Bézier point and heading (degrees) at t. */
const along = (a: Point, c: Point, b: Point, t: number) => {
  const u = 1 - t;
  const x = u * u * a[0] + 2 * u * t * c[0] + t * t * b[0];
  const y = u * u * a[1] + 2 * u * t * c[1] + t * t * b[1];
  const dx = 2 * u * (c[0] - a[0]) + 2 * t * (b[0] - c[0]);
  const dy = 2 * u * (c[1] - a[1]) + 2 * t * (b[1] - c[1]);
  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
};

/** Bows each route out to sea (east), the way flight maps draw arcs. */
const controlPoint = (a: Point, b: Point): Point => {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  let nx = -(b[1] - a[1]) / length;
  let ny = (b[0] - a[0]) / length;
  if (nx < 0) {
    nx = -nx;
    ny = -ny;
  }
  return [mx + nx * length * 0.28, my + ny * length * 0.28];
};

type Props = {
  readonly plate: MapPlate;
  readonly flight: Flight;
  readonly accent: string;
};

/**
 * Country map with a plane flying in from each departure city. The plate is
 * a still rendered by `video:map --which flight` at the frame's own size, so
 * coordinates land on it with the same projection MapLibre drew it with.
 */
export const FlightMap: React.FC<Props> = ({ plate, flight, accent }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const to = toPlatePixel([flight.to.lng, flight.to.lat], plate);
  const routes = flight.from.map((from, index) => {
    const a = toPlatePixel([from.lng, from.lat], plate);
    const c = controlPoint(a, to);
    const start = Math.round((TAKE_OFF_SEC + index * STAGGER_SEC) * fps);
    const t = interpolate(frame, [start, start + FLY_SEC * fps], [0, 1], {
      easing: Easing.bezier(0.45, 0, 0.25, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return { from, a, c, t, start };
  });
  const landed = routes[0].start + FLY_SEC * fps;

  // A slow push towards the destination keeps the map alive while it holds.
  const push = interpolate(frame, [0, durationInFrames], [1, 1.12], {
    easing: Easing.bezier(0.45, 0, 0.55, 1),
    extrapolateRight: "clamp",
  });
  const arrive = spring({ frame, fps, delay: landed - 4, config: { damping: 11, stiffness: 150 } });
  const pulse = ((frame - landed) / (0.9 * fps)) % 1;

  return (
    <AbsoluteFill
      style={{
        transformOrigin: `${to[0]}px ${to[1]}px`,
        scale: `${push}`,
      }}
    >
      <Img
        src={staticFile(plate.plate)}
        style={{
          position: "absolute",
          inset: 0,
          width: plate.width,
          height: plate.height,
          filter: "contrast(1.3) saturate(1.35) brightness(1.12)",
        }}
      />
      <svg
        width={plate.width}
        height={plate.height}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        {routes.map(({ from, a, c, t }) => {
          const d = `M ${a[0]} ${a[1]} Q ${c[0]} ${c[1]} ${to[0]} ${to[1]}`;
          const plane = along(a, c, to, t);
          const flying = t > 0 && t < 1;
          return (
            <g key={from.name}>
              <path d={d} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={4} strokeDasharray="4 16" strokeLinecap="round" />
              <path d={d} fill="none" stroke={accent} strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={`${t} 1`} style={{ filter: `drop-shadow(0 0 10px ${accent})` }} />
              <circle cx={a[0]} cy={a[1]} r={13} fill="#ffffff" stroke={accent} strokeWidth={6} />
              {flying ? (
                <path
                  d={PLANE_PATH}
                  fill="#ffffff"
                  transform={`translate(${plane.x} ${plane.y}) rotate(${plane.angle}) scale(1.7)`}
                  style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.55))" }}
                />
              ) : null}
            </g>
          );
        })}
        {frame > landed ? (
          <circle cx={to[0]} cy={to[1]} r={18 + 70 * pulse} fill="none" stroke={accent} strokeWidth={5} opacity={1 - pulse} />
        ) : null}
        <circle cx={to[0]} cy={to[1]} r={20 * interpolate(arrive, [0, 1], [0.6, 1])} fill={accent} stroke="#ffffff" strokeWidth={6} />
      </svg>

      {routes.map(({ from, a }) => (
        <Tag key={from.name} x={a[0]} y={a[1]} text={from.name} accent={accent} opacity={interpolate(frame, [6, 18], [0, 1], { extrapolateRight: "clamp" })} />
      ))}
      <Tag x={to[0]} y={to[1]} text={flight.to.name} accent={accent} opacity={arrive} big />
    </AbsoluteFill>
  );
};

const Tag: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly accent: string;
  readonly opacity: number;
  readonly big?: boolean;
}> = ({ x, y, text, accent, opacity, big }) => (
  <div
    style={{
      position: "absolute",
      // The destination sits near the right edge, where TikTok puts its
      // buttons, so its tag goes on the left of the pin.
      left: big ? x - 34 : x + 26,
      top: y,
      translate: big ? "-100% -50%" : "0 -50%",
      whiteSpace: "nowrap",
      fontFamily,
      fontSize: big ? 46 : 36,
      fontWeight: 700,
      color: "#ffffff",
      padding: big ? "12px 26px 16px" : "8px 20px 12px",
      borderRadius: 16,
      backgroundColor: "rgba(4,16,26,0.82)",
      [big ? "borderRight" : "borderLeft"]: `5px solid ${accent}`,
      opacity,
    }}
  >
    {text}
  </div>
);
