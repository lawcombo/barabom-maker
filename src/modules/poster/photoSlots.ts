import type { PosterElement, PosterImageElement } from './types'

export function clampSlotPhotoOffset(
  slot: Pick<PosterImageElement, 'width' | 'height' | 'mask'>,
  drawWidth: number,
  drawHeight: number,
  offsetX: number,
  offsetY: number,
) {
  const diameter = Math.min(slot.width, slot.height)
  const width = slot.mask === 'circle' ? diameter : slot.width
  const height = slot.mask === 'circle' ? diameter : slot.height
  const limitX = Math.max(0, (drawWidth - width) / 2)
  const limitY = Math.max(0, (drawHeight - height) / 2)
  return {
    offsetX: Math.max(-limitX, Math.min(limitX, offsetX)),
    offsetY: Math.max(-limitY, Math.min(limitY, offsetY)),
  }
}

export function findPhotoSlotAt(
  elements: readonly PosterElement[],
  x: number,
  y: number,
): string | null {
  for (let index = elements.length - 1; index >= 0; index--) {
    const element = elements[index]
    if (element.kind !== 'image' || !element.isSlot || !element.visible || element.locked) continue

    const angle = -element.rotation * Math.PI / 180
    const dx = x - element.x
    const dy = y - element.y
    const localX = dx * Math.cos(angle) - dy * Math.sin(angle)
    const localY = dx * Math.sin(angle) + dy * Math.cos(angle)
    const halfWidth = element.width / 2
    const halfHeight = element.height / 2
    if (Math.abs(localX) > halfWidth || Math.abs(localY) > halfHeight) continue

    if (element.mask === 'circle' && Math.hypot(localX, localY) > Math.min(halfWidth, halfHeight)) continue
    if (element.mask === 'oval' && Math.hypot(localX / halfWidth, localY / halfHeight) > 1) continue
    if (element.mask === 'round') {
      const radius = Math.min(28, element.width * .08, element.height * .08)
      const cornerX = Math.max(0, Math.abs(localX) - halfWidth + radius)
      const cornerY = Math.max(0, Math.abs(localY) - halfHeight + radius)
      if (Math.hypot(cornerX, cornerY) > radius) continue
    }
    return element.id
  }
  return null
}
