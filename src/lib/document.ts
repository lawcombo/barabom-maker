import type { DesignTemplate, EditorDocument, FrameSettings, SlotPhoto } from '../types'
import { templateById } from '../data/templates'

export function frameFromTemplate(template: DesignTemplate): FrameSettings {
  return {
    background: template.background,
    borderColor: template.borderColor,
    borderWidth: template.borderWidth,
    gap: template.gap,
    padding: template.padding,
    radius: template.radius,
    pattern: template.pattern,
    showDecorations: true,
    showDate: true,
    topCaption: template.topCaption,
    bottomCaption: template.bottomCaption,
  }
}

export function createDocument(): EditorDocument {
  const template = templateById('white')
  return {
    version: 1,
    id: crypto.randomUUID(),
    name: '나의 네컷',
    updatedAt: Date.now(),
    cutCount: 4,
    orientation: 'portrait',
    templateId: template.id,
    photos: [null, null, null, null],
    texts: [],
    stickers: [],
    frame: frameFromTemplate(template),
    output: { preset: 'strip50x150', widthMm: 50, heightMm: 150, dpi: 300 },
  }
}

export function createPhoto(src: string, name: string): SlotPhoto {
  return {
    id: crypto.randomUUID(), src, name, zoom: 1, offsetX: 0, offsetY: 0,
    rotation: 0, flipX: false, flipY: false, brightness: 0, contrast: 0,
    saturation: 0, filter: 'none', fit: 'cover',
  }
}

export function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
