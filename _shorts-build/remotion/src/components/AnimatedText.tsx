import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { mix, pop, stagger } from "../lib/animation";
import { isRtl, splitText } from "../lib/text";

type Props = {
  text: string;
  lang?: string;
  /** 이 컴포넌트가 놓인 Sequence 안에서의 시작 프레임 */
  delay?: number;
  /** 조각 사이 간격(프레임) */
  gap?: number;
  fontSize: number;
  color?: string;
  fontWeight?: number;
  fontFamily?: string;
  style?: React.CSSProperties;
};

/** 글자(또는 단어)가 순서대로 튀어 오르는 텍스트. 언어별 분할은 lib/text.ts */
export const AnimatedText: React.FC<Props> = ({
  text,
  lang = "ko",
  delay = 0,
  gap = 2,
  fontSize,
  color = "#ffffff",
  fontWeight = 800,
  fontFamily,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const parts = splitText(text, lang);

  return (
    <div
      dir={isRtl(lang) ? "rtl" : "ltr"}
      style={{
        fontSize,
        color,
        fontWeight,
        fontFamily,
        lineHeight: 1.25,
        textAlign: "center",
        textWrap: "balance",
        wordBreak: "keep-all",
        ...style,
      }}
    >
      {parts.map((p, i) => {
        const t = pop(frame, fps, stagger(i, gap, delay));
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              opacity: Math.min(1, t * 1.5),
              transform: `translateY(${mix(t, fontSize * 0.6, 0)}px) scale(${mix(t, 0.6, 1)})`,
            }}
          >
            {p}
          </span>
        );
      })}
    </div>
  );
};
