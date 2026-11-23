import { describe, expect, it } from 'vitest'
import { documentFromTemplate, posterCategories, posterTemplates } from './templates'

describe('poster templates', () => {
  it('provides exactly three usable templates for each of 18 categories', () => {
    expect(posterCategories).toHaveLength(19)
    expect(posterTemplates).toHaveLength(54)
    for (const category of posterCategories.slice(1)) {
      expect(posterTemplates.filter((template) => template.category === category)).toHaveLength(3)
    }
  })

  it('uses unique ids and editable layer data', () => {
    expect(new Set(posterTemplates.map((template) => template.id)).size).toBe(54)
    for (const template of posterTemplates) {
      expect(template.elements.some((element) => element.kind === 'image')).toBe(true)
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
