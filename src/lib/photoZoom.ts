export const PHOTO_ZOOM = { coverMin: 1, containMin: .15, max: 8 } as const

export function zoomFromWheel(zoom: number, deltaY: number) {
  if (deltaY === 0) return zoom
  return zoom * (deltaY > 0 ? .94 : 1.06)
}
