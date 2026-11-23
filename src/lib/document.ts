import type { DesignTemplate, EditorDocument, FrameSettings, SlotPhoto } from '../types'
import { templateById } from '../data/templates'
import { ARTBOARD } from '../data/layouts'

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
    showDate: !template.layout,
    topCaption: template.topCaption,
    bottomCaption: template.bottomCaption,
  }
}

export function applyDesignTemplate(document: EditorDocument, template: DesignTemplate): EditorDocument {
  const next = { ...document, templateId:template.id, frame:frameFromTemplate(template) }
  const layout = template.layout
  if (!layout) return next

  const before = ARTBOARD[document.orientation]
  const after = ARTBOARD[layout.orientation]
  const scaleX = after.width / before.width
  const scaleY = after.height / before.height
  const scale = Math.min(scaleX, scaleY)
  const cutCount = layout.slots.length

  return {
    ...next,
    cutCount,
    orientation:layout.orientation,
    photos:Array.from({length:Math.max(cutCount,document.photos.length)}, (_, index) => document.photos[index] ?? null),
    texts:document.texts.map((text) => ({...text, x:text.x*scaleX, y:text.y*scaleY, width:text.width*scaleX, fontSize:text.fontSize*scale})),
    stickers:document.stickers.map((sticker) => ({...sticker, x:sticker.x*scaleX, y:sticker.y*scaleY, size:sticker.size*scale})),
    output:layout.orientation === 'grid'
      ? {...document.output, preset:'custom', widthMm:80, heightMm:100}
      : {...document.output, preset:'strip50x150', widthMm:50, heightMm:150},
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
