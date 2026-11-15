import React from "react";
import { Composition } from "remotion";
import { SHORTS, secToFrames } from "./config/video";
import { calculateSampleMetadata, Sample, sampleSchema } from "./compositions/Sample/Sample";

/**
 * 컴포지션 등록부. 새 편은 src/compositions/<편id>/ 를 만들고 여기에 <Composition> 한 줄을 더한다.
 * id 는 shorts.json 의 편 id 와 같게 쓴다.
 * defaultProps 는 객체 리터럴로 적어야 Studio 가 고친 값을 이 파일에 저장할 수 있다.
 * 실제 규격은 calculateMetadata 가 props 에서 읽는다(아래 width/height/fps/duration 은 초기값일 뿐).
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Sample"
        component={Sample}
        schema={sampleSchema}
        defaultProps={{
          width: 1080,
          height: 1920,
          fps: 30,
          durationInSeconds: 15,
          lang: "ko",
          title: "Remotion 샘플",
          subtitle: "글자 · 도형 · 화면 전환",
          ending: "준비 완료",
          debug: false,
        }}
        calculateMetadata={calculateSampleMetadata}
        width={SHORTS.width}
        height={SHORTS.height}
        fps={SHORTS.fps}
        durationInFrames={secToFrames(SHORTS.durationInSeconds, SHORTS.fps)}
      />
    </>
  );
};
