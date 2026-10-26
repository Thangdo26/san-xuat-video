import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { DayScene } from "./DayScene";
import { Intro } from "./Intro";
import { Outro } from "./Outro";

export const Video: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence name="Intro" durationInFrames={180}>
        <Intro />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 15 })}
      />
      <TransitionSeries.Sequence name="Ngày 1" durationInFrames={150}>
        <DayScene
          day="NGÀY 01"
          title="Biển & Cầu Rồng"
          accent="#ffd27a"
          glow="rgba(255,190,105,0.42)"
          stops={[
            { time: "10:00", place: "Biển Mỹ Khê" },
            { time: "16:00", place: "Sơn Trà · Chùa Linh Ứng" },
            { time: "21:00", place: "Cầu Rồng phun lửa" },
          ]}
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 15 })}
      />
      <TransitionSeries.Sequence name="Ngày 2" durationInFrames={150}>
        <DayScene
          day="NGÀY 02"
          title="Săn mây Bà Nà"
          accent="#7fe3d4"
          glow="rgba(110,225,210,0.34)"
          stops={[
            { time: "07:30", place: "Cáp treo Bà Nà Hills" },
            { time: "10:00", place: "Cầu Vàng · Làng Pháp" },
            { time: "19:00", place: "Chợ đêm · Hải sản" },
          ]}
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 15 })}
      />
      <TransitionSeries.Sequence name="Ngày 3" durationInFrames={150}>
        <DayScene
          day="NGÀY 03"
          title="Hội An cổ kính"
          accent="#ff9d7a"
          glow="rgba(255,140,100,0.38)"
          stops={[
            { time: "08:00", place: "Ngũ Hành Sơn" },
            { time: "15:00", place: "Phố cổ Hội An" },
            { time: "19:00", place: "Đèn hoa đăng sông Hoài" },
          ]}
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 15 })}
      />
      <TransitionSeries.Sequence name="Outro" durationInFrames={120}>
        <Outro />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
