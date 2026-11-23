import type { PosterElement } from './types'

export { readImageFile as readPosterImage } from '../../lib/localImage'

export function clonePosterElement(element: PosterElement, dx = 20, dy = 20): PosterElement {
  return { ...element, id:crypto.randomUUID(), name:`${element.name} 복사본`, x:element.x + dx, y:element.y + dy }
}

export function downloadDataUrl(url: string, filename: string) {
  const anchor = window.document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
}

export const posterFonts = [
  ['Noto Sans KR','기본 고딕'], ['Noto Serif KR','정갈한 명조'], ['Black Han Sans','강한 제목'],
  ['Do Hyeon','포스터 고딕'], ['Jua','둥근 고딕'], ['Gaegu','귀여운 손글씨'],
  ['Nanum Pen Script','펜 손글씨'], ['Nanum Brush Script','붓 손글씨'], ['Gowun Batang','감성 바탕'],
] as const

export const posterEmojis = ['✨','🎉','💛','❤️','⭐','🌸','🌿','🎂','☕','🍰','🍕','🎁','🎈','📣','🔥','✅','💎','🎵','📷','✈️','🏷️','💐','🎄','🧸']
