import React from "react";
import { Img, staticFile } from "remotion";

/** 실제 앱 아이콘(public/app-icon.png = _shorts-build/img/app-icon.png 복사본). 도형으로 흉내 내지 않는다. */
export const AppIcon: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => (
  <Img src={staticFile("app-icon.png")} style={{ width: size, height: size, ...style }} />
);
