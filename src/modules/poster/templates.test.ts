import { describe, expect, it } from 'vitest'
import { generalPosterTemplates } from './generalTemplates'
import { documentFromTemplate, posterCategories, posterTemplates } from './templates'

describe('poster templates', () => {
  it('keeps the 18 categories and includes the additional frame designs', () => {
    expect(posterCategories).toHaveLength(19)
    expect(posterTemplates).toHaveLength(87)
    for (const category of posterCategories.slice(1)) {
      expect(posterTemplates.filter((template) => template.category === category).length).toBeGreaterThanOrEqual(3)
      expect(posterTemplates.filter((template) => template.category === category && template.kind === 'poster').length).toBeGreaterThanOrEqual(3)
    }
    expect(posterTemplates.filter((template) => template.kind === 'frame')).toHaveLength(28)
    expect(posterTemplates.filter((template) => template.category === '공지사항' && template.kind === 'poster')).toHaveLength(8)
  })

  it('keeps text editable and only adds empty photo slots to frame designs', () => {
    expect(new Set(posterTemplates.map((template) => template.id)).size).toBe(posterTemplates.length)
    for (const template of posterTemplates) {
      if (template.background.type === 'image') {
        expect(template.background.imageSrc).toMatch(/\.(webp|jpg)$/)
      } else {
        expect(template.background.imageSrc).toBe('')
      }
      const images = template.elements.filter((element) => element.kind === 'image')
      if (template.kind === 'frame') {
        expect(template.background.type).toBe('image')
        expect(images.length).toBeGreaterThan(0)
        expect(images.every((image) => image.isSlot && image.src === '')).toBe(true)
      } else {
        expect(images).toHaveLength(0)
      }
      expect(template.elements.some((element) => element.kind === 'text')).toBe(true)
    }
  })

  it('fits each new general design within its artboard and names the editable layers', () => {
    for (const template of generalPosterTemplates) {
      const { width, height } = template.size
      expect(template.kind).toBe('poster')
      expect(new Set(template.elements.map((element) => element.id)).size).toBe(template.elements.length)
      for (const element of template.elements) {
        expect(element.x - element.width / 2, template.id).toBeGreaterThanOrEqual(0)
        expect(element.y - element.height / 2, template.id).toBeGreaterThanOrEqual(0)
        expect(element.x + element.width / 2, template.id).toBeLessThanOrEqual(width)
        expect(element.y + element.height / 2, template.id).toBeLessThanOrEqual(height)
        if (element.kind === 'text') expect(element.locked, element.name).toBe(false)
      }
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
