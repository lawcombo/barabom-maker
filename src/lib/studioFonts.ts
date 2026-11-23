export const studioFonts = [
  { family: 'Noto Sans KR', label: '노토 고딕' },
  { family: 'IBM Plex Sans KR', label: 'IBM 플렉스 산스 KR' },
  { family: 'Gowun Dodum', label: '고운 돋움' },
  { family: 'Noto Serif KR', label: '노토 명조' },
  { family: 'Gowun Batang', label: '고운 바탕' },
  { family: 'Song Myung', label: '송명' },
  { family: 'Black Han Sans', label: '검은 고딕' },
  { family: 'Do Hyeon', label: '도현체' },
  { family: 'Jua', label: '주아체' },
  { family: 'Sunflower', label: '해바라기' },
  { family: 'Gaegu', label: '개구체' },
  { family: 'Hi Melody', label: '하이 멜로디' },
  { family: 'Gamja Flower', label: '감자꽃' },
  { family: 'Poor Story', label: '푸어스토리' },
  { family: 'Nanum Pen Script', label: '나눔 펜' },
  { family: 'Nanum Brush Script', label: '나눔 붓글씨' },
  { family: 'Arial', label: 'Arial', sample: 'Barabom Aa' },
  { family: 'Georgia', label: 'Georgia', sample: 'Barabom Aa' },
]

export function studioFontStack(family: string) {
  if (family === 'Georgia') return 'Georgia, "Noto Serif KR", serif'
  return family === 'Noto Sans KR' ? '"Noto Sans KR", sans-serif' : `${JSON.stringify(family)}, "Noto Sans KR", sans-serif`
}
