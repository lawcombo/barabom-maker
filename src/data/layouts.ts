import type { DesignTemplate, EditorDocument, LayoutRect, Orientation } from '../types'

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

export function getDesignedLayout(document: Pick<EditorDocument, 'cutCount' | 'orientation'>, template: DesignTemplate) {
  const layout = template.layout
  return layout?.orientation === document.orientation && layout.slots.length === document.cutCount ? layout : undefined
}

const scallopRadius = (angle: number) => {
  const rounded = .5 / Math.pow(Math.abs(Math.cos(angle)) ** 2.7 + Math.abs(Math.sin(angle)) ** 2.7, 1 / 2.7)
  return rounded - .021 + .021 * Math.cos(14 * angle)
}

export const scallopOutline = Array.from({length:144}, (_, index) => {
  const angle = index * Math.PI * 2 / 144
  const distance = scallopRadius(angle)
  return [.5 + Math.cos(angle) * distance, .5 + Math.sin(angle) * distance] as const
})

export function pointInPhotoSlot(rect: LayoutRect, x: number, y: number) {
  const px = (x - rect.x) / rect.width - .5
  const py = (y - rect.y) / rect.height - .5
  if (!rect.mask) return Math.abs(px) <= .5 && Math.abs(py) <= .5

  const radius = rect.mask === 'scallop' ? scallopRadius(Math.atan2(py, px)) : .5
  return Math.hypot(px, py) <= radius
}
