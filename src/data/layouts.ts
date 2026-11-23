import type { LayoutRect, Orientation } from '../types'

export const ARTBOARD = {
  portrait: { width: 400, height: 1200 },
  landscape: { width: 1200, height: 400 },
  grid: { width: 720, height: 900 },
} as const

export function getLayoutRects(
  count: number,
  orientation: Orientation,
  padding: number,
  gap: number,
): LayoutRect[] {
  const { width, height } = ARTBOARD[orientation]
  const headerSpace = Math.max(54, padding)
  const footerSpace = Math.max(72, padding)
  const availableX = padding
  const availableY = headerSpace
  const availableW = width - padding * 2
  const availableH = height - headerSpace - footerSpace

  let columns = 1
  let rows = count
  if (orientation === 'landscape') {
    columns = count
    rows = 1
  } else if (orientation === 'grid') {
    columns = Math.ceil(Math.sqrt(count))
    rows = Math.ceil(count / columns)
  }

  const cellW = (availableW - gap * (columns - 1)) / columns
  const cellH = (availableH - gap * (rows - 1)) / rows
  const lastRowCount = count - columns * (rows - 1)

  return Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / columns)
    const col = index % columns
    const isLastRow = row === rows - 1
    const itemsInRow = isLastRow ? lastRowCount : columns
    const rowOffset = orientation === 'grid' && itemsInRow < columns
      ? ((columns - itemsInRow) * (cellW + gap)) / 2
      : 0
    return {
      id: `slot-${index}`,
      x: availableX + col * (cellW + gap) + rowOffset,
      y: availableY + row * (cellH + gap),
      width: cellW,
      height: cellH,
    }
  })
}

export function layoutLabel(count: number, orientation: Orientation) {
  if (orientation === 'portrait') return `세로 ${count}컷`
  if (orientation === 'landscape') return `가로 ${count}컷`
  const cols = Math.ceil(Math.sqrt(count))
  return `${cols}열 그리드`
}
