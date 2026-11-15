import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { safeArea } from "../config/layout";

/**
 * 안전 영역 안에 내용을 가운데 정렬로 놓는 틀.
 * debug 를 켜면 가운데선·여백선을 그린다(Studio 에서 배치 확인용, 렌더 전에 끈다).
 */
export const SafeFrame: React.FC<{
  children: React.ReactNode;
  debug?: boolean;
  justify?: React.CSSProperties["justifyContent"];
}> = ({ children, debug = false, justify = "center" }) => {
  const { width, height } = useVideoConfig();
  const s = safeArea(width, height);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: s.left,
          top: s.top,
          width: s.width,
          height: s.height,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: justify,
        }}
      >
        {children}
      </div>
      {debug ? (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <div style={{ position: "absolute", left: s.centerX - 1, top: 0, width: 2, height, background: "#ff0" }} />
          <div style={{ position: "absolute", left: s.left, top: s.top, width: s.width, height: s.height, outline: "2px dashed #0ff" }} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
