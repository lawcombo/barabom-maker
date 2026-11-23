import { describe, expect, it } from 'vitest'
import { ARTBOARD, getLayoutRects } from './layouts'

describe('getLayoutRects', () => {
  it.each([1,2,3,4,5,6,7,8,9])('%i컷 레이아웃을 요청 수만큼 만든다', (count) => {
    expect(getLayoutRects(count, 'portrait', 20, 12)).toHaveLength(count)
    expect(getLayoutRects(count, 'landscape', 20, 12)).toHaveLength(count)
    expect(getLayoutRects(count, 'grid', 20, 12)).toHaveLength(count)
  })

  it.each(['portrait','landscape','grid'] as const)('%s 레이아웃이 아트보드를 벗어나지 않는다', (orientation) => {
    const artboard = ARTBOARD[orientation]
    for (const rect of getLayoutRects(9, orientation, 20, 12)) {
      expect(rect.x).toBeGreaterThanOrEqual(0)
      expect(rect.y).toBeGreaterThanOrEqual(0)
      expect(rect.x + rect.width).toBeLessThanOrEqual(artboard.width)
      expect(rect.y + rect.height).toBeLessThanOrEqual(artboard.height)
    }
  })
})
