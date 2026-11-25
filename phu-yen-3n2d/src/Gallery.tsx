import { Video } from "@remotion/media";
import {
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";

/**
 * Photos occupy the top of the frame and melt into the background via a
 * scrim, so the text block below stays readable whatever the photo looks
 * like, and portrait and landscape sources share one layout. Kept short
 * enough that the text block ends above the subtitle band.
 */
export const IMAGE_HEIGHT = 950;

/**
 * Top of the subtitle band at the foot of the frame. A three-dish list, the
 * tallest text block, ends about 70px above it.
 */
export const SUBTITLE_TOP = 1620;

/** Overlap while one photo dissolves into the next. */
export const MEDIA_CROSSFADE_FRAMES = 14;

const VIDEO_FILE = /\.(mp4|webm|mov)$/i;

/** Evenly spaced start frames for `count` items between `from` and `to`. */
export const evenSlots = (count: number, from: number, to: number): number[] =>
  Array.from({ length: count }, (_, index) =>
    Math.round(from + ((to - from) * index) / count),
  );

export const ImageFrame: React.FC<{
  readonly children: React.ReactNode;
  /**
   * Layers stacked over another frame (the gallery over the map intro) must
   * stay transparent, or they hide what is underneath before their own first
   * item has appeared.
   */
  readonly transparent?: boolean;
  /** IMAGE_HEIGHT for the split frame, the full frame height for "full". */
  readonly height?: number;
}> = ({ children, transparent, height = IMAGE_HEIGHT }) => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height,
      overflow: "hidden",
      backgroundColor: transparent ? "transparent" : "#04101a",
    }}
  >
    {children}
  </div>
);

/**
 * Split frame: the photo melts into the dark background below it. Full
 * frame: the photo stays visible behind the text, darkened from the middle
 * down so the text block and subtitles still read on any photo.
 */
export const Scrim: React.FC<{ readonly full?: boolean }> = ({ full }) => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: full ? "100%" : IMAGE_HEIGHT,
      background: full
        ? "linear-gradient(180deg, rgba(4,16,26,0.5) 0%, rgba(4,16,26,0) 16%, rgba(4,16,26,0) 36%, rgba(4,16,26,0.7) 50%, rgba(4,16,26,0.88) 66%, rgba(4,16,26,0.94) 100%)"
        : "linear-gradient(180deg, rgba(4,16,26,0.55) 0%, rgba(4,16,26,0.05) 22%, rgba(4,16,26,0.05) 55%, rgba(4,16,26,0.75) 85%, #04101a 100%)",
    }}
  />
);

/**
 * Camera moves, one per photo in turn: push in, pan, pull back, tilt and a
 * diagonal drift. Each starts zoomed in far enough that the pan never shows
 * an edge. Offsets are percentages of the frame, so split and full frames
 * move alike.
 */
const MOVES: ReadonlyArray<{
  readonly scale: [number, number];
  readonly x: [number, number];
  readonly y: [number, number];
}> = [
  { scale: [1.04, 1.2], x: [0, 0], y: [0, -1.5] },
  { scale: [1.18, 1.18], x: [-5, 5], y: [0, 0] },
  { scale: [1.24, 1.05], x: [0, 0], y: [1.5, 0] },
  { scale: [1.18, 1.18], x: [0, 0], y: [4, -4] },
  { scale: [1.12, 1.22], x: [4, -4], y: [2, -2] },
];

type ItemProps = {
  readonly src: string;
  readonly durationInFrames: number;
  readonly fadeIn: boolean;
  /** Picks the camera move, so consecutive photos move differently. */
  readonly index: number;
};

const GalleryItem: React.FC<ItemProps> = ({
  src,
  durationInFrames,
  fadeIn,
  index,
}) => {
  const frame = useCurrentFrame();
  const move = MOVES[index % MOVES.length];
  const camera = (range: [number, number]) =>
    interpolate(frame, [0, durationInFrames], range, {
      easing: Easing.bezier(0.45, 0, 0.55, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const style: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    opacity: fadeIn
      ? interpolate(frame, [0, MEDIA_CROSSFADE_FRAMES], [0, 1], {
          easing: Easing.bezier(0.33, 0, 0.67, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1,
    scale: interpolate(frame, [0, durationInFrames], move.scale, {
      output: "perceptual-scale",
      easing: Easing.bezier(0.45, 0, 0.55, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    translate: `${camera(move.x)}% ${camera(move.y)}%`,
  };

  if (VIDEO_FILE.test(src)) {
    // Footage is muted: voice-over and music are the soundtrack.
    return <Video src={staticFile(src)} muted objectFit="cover" style={style} />;
  }
  return <Img src={staticFile(src)} style={style} />;
};

type Props = {
  readonly items: string[];
  /** Frame each item appears at; one entry per item, ascending. */
  readonly slotStarts: number[];
  /** Scene length; the last item stays until here. */
  readonly endFrame: number;
  /** Whether the first item dissolves in (it covers a map intro). */
  readonly fadeInFirst: boolean;
  readonly height?: number;
  /** Offsets the camera moves, so scenes do not all open on the same one. */
  readonly moveOffset?: number;
};

export const Gallery: React.FC<Props> = ({
  items,
  slotStarts,
  endFrame,
  fadeInFirst,
  height,
  moveOffset = 0,
}) => {
  return (
    <ImageFrame transparent={fadeInFirst} height={height}>
      {items.map((src, index) => {
        const from = slotStarts[index];
        const until =
          index < items.length - 1
            ? slotStarts[index + 1] + MEDIA_CROSSFADE_FRAMES
            : endFrame;
        return (
          <Sequence
            key={`${index}-${src}`}
            from={from}
            durationInFrames={Math.max(1, until - from)}
            layout="none"
          >
            <GalleryItem
              src={src}
              durationInFrames={Math.max(1, until - from)}
              fadeIn={index > 0 || fadeInFirst}
              index={index + moveOffset}
            />
          </Sequence>
        );
      })}
    </ImageFrame>
  );
};
