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

export const posterEmojis = ['✨','🎉','💛','❤️','⭐','🌸','🌿','🎂','☕','🍰','🍕','🎁','🎈','📣','🔥','✅','💎','🎵','📷','✈️','🏷️','💐','🎄','🧸']
