import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontFamily } from "./font";
import { SceneLayout } from "./layouts";
import type { Scene as SceneData, VideoData } from "./schema";
import { SceneBackground } from "./SceneBackground";
import { SceneImage } from "./SceneImage";

type Props = {
  readonly scene: SceneData;
  readonly theme: VideoData["theme"];
  readonly durationInFrames: number;
};

export const Scene: React.FC<Props> = ({ scene, theme, durationInFrames }) => {
  const accent = scene.accent ?? theme.accent;

  return (
    <AbsoluteFill style={{ backgroundColor: "#04101a" }}>
      <SceneBackground glow="rgba(255,190,105,0.26)" />
      {scene.asset ? (
        <SceneImage src={scene.asset} durationInFrames={durationInFrames} />
      ) : null}
      <SceneLayout scene={scene} accent={accent} />
      {scene.layout === "point" ? <Brand text={theme.brand} /> : null}
      {scene.voice ? <Audio src={staticFile(scene.voice)} /> : null}
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
        bottom: 96,
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
