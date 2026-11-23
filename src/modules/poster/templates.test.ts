import { describe, expect, it } from 'vitest'
import { documentFromTemplate, posterCategories, posterTemplates } from './templates'

describe('poster templates', () => {
  it('keeps the 18 categories and includes the additional frame designs', () => {
    expect(posterCategories).toHaveLength(19)
    expect(posterTemplates).toHaveLength(64)
    for (const category of posterCategories.slice(1)) {
      expect(posterTemplates.filter((template) => template.category === category).length).toBeGreaterThanOrEqual(3)
    }
    expect(posterTemplates.filter((template) => template.kind === 'frame')).toHaveLength(28)
  })

  it('uses full-size background artwork and only adds empty slots to frame designs', () => {
    expect(new Set(posterTemplates.map((template) => template.id)).size).toBe(posterTemplates.length)
    for (const template of posterTemplates) {
      expect(template.background.type).toBe('image')
      expect(template.background.imageSrc).toMatch(/\.(webp|jpg)$/)
      const images = template.elements.filter((element) => element.kind === 'image')
      if (template.kind === 'frame') {
        expect(images.length).toBeGreaterThan(0)
        expect(images.every((image) => image.isSlot && image.src === '')).toBe(true)
      } else {
        expect(images).toHaveLength(0)
      }
      expect(template.elements.some((element) => element.kind === 'text')).toBe(true)
    }
  })

  it('creates isolated poster documents without mutating template data', () => {
    const template = posterTemplates[0]
    const first = documentFromTemplate(template)
    const second = documentFromTemplate(template)
    expect(first.version).toBe('poster-v1')
    expect(first.id).not.toBe(second.id)
    expect(first.elements[0].id).not.toBe(second.elements[0].id)
    expect(first.elements).not.toBe(template.elements)
  })
})
