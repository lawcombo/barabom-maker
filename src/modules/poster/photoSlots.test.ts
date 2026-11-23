import { describe, expect, it } from 'vitest'
import { clampSlotPhotoOffset, findPhotoSlotAt } from './photoSlots'
import { posterTemplates, templateById } from './templates'
import type { PosterImageElement } from './types'

const scrapbook = posterTemplates.find((template) => template.name === '사진 일기 · 4컷')!
const photos = scrapbook.elements.filter((element) => element.kind === 'image')
const [first, second] = photos

describe('poster photo slots', () => {
  it('picks the frame under the pointer in a multi-photo template', () => {
    expect(photos).toHaveLength(4)
    expect(findPhotoSlotAt(scrapbook.elements, first.x, first.y)).toBe(first.id)
    expect(findPhotoSlotAt(scrapbook.elements, second.x, second.y)).toBe(second.id)
    expect(findPhotoSlotAt(scrapbook.elements, 0, 0)).toBeNull()
  })

  it('uses rotated slot bounds and skips hidden, locked and standalone images', () => {
    const rotated: PosterImageElement = { ...first, x:100, y:100, width:100, height:30, rotation:90 }
    expect(findPhotoSlotAt([rotated], 100, 140)).toBe(rotated.id)
    expect(findPhotoSlotAt([rotated], 140, 100)).toBeNull()
    expect(findPhotoSlotAt([rotated, { ...rotated, id:'hidden', visible:false }], 100, 100)).toBe(rotated.id)
    expect(findPhotoSlotAt([{ ...rotated, locked:true }, { ...rotated, isSlot:false }], 100, 100)).toBeNull()
  })

  it('targets each photo independently in the new gallery pair and family collage', () => {
    for (const [id, count] of [['leaning-duo', 2], ['family-blooms', 5]] as const) {
      const template = templateById(id)!
      const slots = template.elements.filter((element) => element.kind === 'image' && element.isSlot)
      expect(slots).toHaveLength(count)
      for (const slot of slots) {
        expect(findPhotoSlotAt(template.elements, slot.x, slot.y)).toBe(slot.id)
      }
    }
  })

  it('limits the crop to photo coverage, including after zooming back out', () => {
    const slot = { width: 150, height: 100, mask: 'round' } as const
    expect(clampSlotPhotoOffset(slot, 300, 150, 130, -60)).toEqual({ offsetX: 75, offsetY: -25 })
    expect(clampSlotPhotoOffset(slot, 200, 100, -75, 25)).toEqual({ offsetX: -25, offsetY: 0 })
    expect(clampSlotPhotoOffset(slot, 300, 150, -20, 14)).toEqual({ offsetX: -20, offsetY: 14 })
  })

  it('uses the visible diameter to limit panning in circular slots', () => {
    const slot = { width: 150, height: 100, mask: 'circle' } as const
    expect(clampSlotPhotoOffset(slot, 200, 100, 100, 20)).toEqual({ offsetX: 50, offsetY: 0 })
  })
})
