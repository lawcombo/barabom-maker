import { describe, expect, it } from 'vitest'
import { ARTBOARD, getDesignedLayout, pointInPhotoSlot } from './layouts'
import { illustratedTemplates } from './illustratedTemplates'
import { templateById } from './templates'
import { applyDesignTemplate, createDocument, createPhoto } from '../lib/document'

describe('illustrated photo templates', () => {
  it('adds seven distinct designs with usable photo openings inside the print bounds', () => {
    expect(illustratedTemplates).toHaveLength(7)
    expect(new Set(illustratedTemplates.map((template) => template.id)).size).toBe(7)
    for (const template of illustratedTemplates) {
      const layout = template.layout!
      const artboard = ARTBOARD[layout.orientation]
      expect(layout.slots.length).toBeGreaterThanOrEqual(3)
      for (const slot of layout.slots) {
        expect(slot.x).toBeGreaterThanOrEqual(0)
        expect(slot.y).toBeGreaterThanOrEqual(0)
        expect(slot.x + slot.width).toBeLessThanOrEqual(artboard.width)
        expect(slot.y + slot.height).toBeLessThanOrEqual(artboard.height)
        expect(pointInPhotoSlot(slot, slot.x + slot.width/2, slot.y + slot.height/2)).toBe(true)
        if (slot.mask) expect(pointInPhotoSlot(slot, slot.x, slot.y)).toBe(false)
      }
    }
  })

  it('preserves the fourth photo when applying a three-cut frame and restoring a four-cut design', () => {
    const source = createDocument()
    source.photos[3] = createPhoto('data:image/png;base64,example', 'fourth.png')
    const cloud = templateById('frame-pet-clouds')
    const wedding = templateById('frame-wedding-vows')
    const three = applyDesignTemplate(source, cloud)
    expect(three.cutCount).toBe(3)
    expect(getDesignedLayout(three, cloud)?.slots).toHaveLength(3)
    const restored = applyDesignTemplate(three, wedding)
    expect(restored.cutCount).toBe(4)
    expect(restored.photos[3]).toBe(source.photos[3])
    expect(restored.output.widthMm / restored.output.heightMm).toBe(.8)
  })
})
