/**
 * 글꼴 — 기존 HTML 쇼츠와 같은 시스템 글꼴 묶음(이 Mac 의 Chrome 이 렌더한다).
 * 20개 언어 글리프가 전부 로컬에 있어 네트워크 없이 렌더된다.
 * 웹 글꼴이 필요하면 @remotion/google-fonts 를 설치해 loadFont() 로 불러온다
 * (한국어 Noto Sans KR 은 무게 3개에 요청이 360개를 넘어 느리다 — 무게·서브셋을 줄일 것).
 */
export const UI_FONT =
  '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Pretendard", "Noto Sans KR", "Hiragino Sans", "PingFang SC", "Geeza Pro", "Thonburi", "Kohinoor Devanagari", "Helvetica Neue", Arial, sans-serif';
