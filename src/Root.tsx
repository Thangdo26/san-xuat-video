import { Composition, Folder } from "remotion";
import { DayScene } from "./DayScene";
import { Intro } from "./Intro";
import { Outro } from "./Outro";
import { Video } from "./Video";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 180 + 150 + 150 + 150 + 120 - 4 transitions of 15 frames = 690 */}
      <Composition
        id="DaNang3N2D"
        component={Video}
        durationInFrames={690}
        fps={30}
        width={1080}
        height={1920}
      />
      <Folder name="Scenes">
        <Composition
          id="Intro"
          component={Intro}
          durationInFrames={180}
          fps={30}
          width={1080}
          height={1920}
        />
        <Composition
          id="DayScene"
          component={DayScene}
          durationInFrames={150}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            day: "NGÀY 01",
            title: "Biển & Cầu Rồng",
            accent: "#ffd27a",
            glow: "rgba(255,190,105,0.42)",
            stops: [
              { time: "10:00", place: "Biển Mỹ Khê" },
              { time: "16:00", place: "Sơn Trà · Chùa Linh Ứng" },
              { time: "21:00", place: "Cầu Rồng phun lửa" },
            ],
          }}
        />
        <Composition
          id="Outro"
          component={Outro}
          durationInFrames={120}
          fps={30}
          width={1080}
          height={1920}
        />
      </Folder>
    </>
  );
};
