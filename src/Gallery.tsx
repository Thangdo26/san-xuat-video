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
export const IMAGE_HEIGHT = 980;

/** Top of the subtitle band at the foot of the frame. */
export const SUBTITLE_TOP = 1600;

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
}> = ({ children, transparent }) => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: IMAGE_HEIGHT,
      overflow: "hidden",
      backgroundColor: transparent ? "transparent" : "#04101a",
    }}
  >
    {children}
  </div>
);

export const Scrim: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: IMAGE_HEIGHT,
      background:
        "linear-gradient(180deg, rgba(4,16,26,0.55) 0%, rgba(4,16,26,0.05) 22%, rgba(4,16,26,0.05) 55%, rgba(4,16,26,0.75) 85%, #04101a 100%)",
    }}
  />
);

type ItemProps = {
  readonly src: string;
  readonly durationInFrames: number;
  readonly fadeIn: boolean;
  /** Alternates the Ken Burns direction so consecutive photos differ. */
  readonly index: number;
};

const GalleryItem: React.FC<ItemProps> = ({
  src,
  durationInFrames,
  fadeIn,
  index,
}) => {
  const frame = useCurrentFrame();
  const zoomIn = index % 2 === 0;

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
    scale: interpolate(
      frame,
      [0, durationInFrames],
      zoomIn ? [1.03, 1.13] : [1.13, 1.03],
      {
        output: "perceptual-scale",
        easing: Easing.bezier(0.33, 0, 0.67, 1),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    ),
    translate: interpolate(
      frame,
      [0, durationInFrames],
      zoomIn ? ["-12px 0px", "12px 0px"] : ["12px 0px", "-12px 0px"],
      {
        easing: Easing.bezier(0.33, 0, 0.67, 1),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    ),
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
};

export const Gallery: React.FC<Props> = ({
  items,
  slotStarts,
  endFrame,
  fadeInFirst,
}) => {
  return (
    <ImageFrame transparent={fadeInFirst}>
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
              index={index}
            />
          </Sequence>
        );
      })}
    </ImageFrame>
  );
};
