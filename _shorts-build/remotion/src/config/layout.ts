/**
 * 화면 안전 영역 — _shorts-build/README.md 「규칙」의 값을 1080 폭 기준으로 옮긴 것.
 * (기존 HTML 편은 540×960 CSS px 라 가운데 270·여백 65px. 여기서는 2배.)
 *
 * - 내용의 가운데는 화면 정가운데(가로 50%)
 * - 좌우 12% 안쪽: 네이버 클립이 왼쪽을 자르고, 틱톡·릴스 UI 가 오른쪽을 덮는다
 * - 위 8%·아래 20%: 플랫폼 UI 가 덮는다
 * 비율로 정의하므로 해상도를 바꿔도 그대로 맞는다.
 */
export const SAFE = {
  sideRatio: 0.12,
  topRatio: 0.08,
  bottomRatio: 0.2,
};

export const safeArea = (width: number, height: number) => {
  const side = Math.round(width * SAFE.sideRatio);
  const top = Math.round(height * SAFE.topRatio);
  const bottom = Math.round(height * SAFE.bottomRatio);
  return {
    left: side,
    right: width - side,
    top,
    bottom: height - bottom,
    width: width - side * 2,
    height: height - top - bottom,
    centerX: width / 2,
  };
};
