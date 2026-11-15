/**
 * 글자를 나눠 움직일 때 쓰는 분할.
 * 한·중·일은 글자, 아랍어·태국어·힌디어는 단어 단위로 나눠야 모양이 깨지지 않는다.
 * 라틴·키릴 문자도 단어 단위가 안전하다.
 */
const GRAPHEME_LANGS = ["ko", "ja", "zh"];

export const splitText = (text: string, lang: string): string[] => {
  const base = lang.split(/[-_]/)[0];
  const granularity = GRAPHEME_LANGS.includes(base) ? "grapheme" : "word";
  const seg = new Intl.Segmenter(lang, { granularity });
  return Array.from(seg.segment(text), (s) => s.segment);
};

export const isRtl = (lang: string) => ["ar", "he", "fa", "ur"].includes(lang.split(/[-_]/)[0]);
