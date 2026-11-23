export type PosterPreset = 'a4-portrait' | 'a4-landscape' | 'a3-portrait' | 'a3-landscape' | 'square' | 'feed' | 'story' | 'signage' | 'custom'
export type PosterTab = 'templates' | 'photos' | 'text' | 'stickers' | 'shapes' | 'background' | 'layers' | 'projects'
export type PosterMask = 'rect' | 'round' | 'circle' | 'oval'
export type PosterTemplateKind = 'poster' | 'frame'

export interface PosterElementBase {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  locked: boolean
}

export interface PosterImageElement extends PosterElementBase {
  kind: 'image'
  src: string
  isSlot: boolean
  mask: PosterMask
  zoom: number
  offsetX: number
  offsetY: number
  flipX: boolean
  flipY: boolean
  brightness: number
  contrast: number
  saturation: number
  filter: 'none' | 'grayscale' | 'sepia'
}

export interface PosterTextElement extends PosterElementBase {
  kind: 'text'
  text: string
  fontFamily: string
  fontSize: number
  fontStyle: 'normal' | 'bold' | 'italic' | 'bold italic'
  fill: string
  align: 'left' | 'center' | 'right'
  letterSpacing: number
  lineHeight: number
  stroke: string
  strokeWidth: number
  shadowColor: string
  shadowBlur: number
  background: string
  underline: boolean
}

export interface PosterStickerElement extends PosterElementBase {
  kind: 'sticker'
  stickerType: 'emoji' | 'image'
  value: string
}

export interface PosterShapeElement extends PosterElementBase {
  kind: 'shape'
  shape: 'rect' | 'circle' | 'triangle' | 'line' | 'arrow' | 'bubble' | 'banner'
  fill: string
  stroke: string
  strokeWidth: number
  radius: number
}

export interface PosterQrElement extends PosterElementBase {
  kind: 'qr'
  value: string
  src: string
  foreground: string
  background: string
}

export type PosterElement = PosterImageElement | PosterTextElement | PosterStickerElement | PosterShapeElement | PosterQrElement

export interface PosterBackground {
  type: 'color' | 'gradient' | 'image'
  color: string
  secondary: string
  imageSrc: string
  opacity: number
}

export interface PosterSize {
  preset: PosterPreset
  width: number
  height: number
  outputWidth: number
  outputHeight: number
  unit: 'px' | 'mm'
  dpi: number
}

export interface PosterDocument {
  version: 'poster-v1'
  id: string
  name: string
  templateId: string | null
  createdAt: number
  updatedAt: number
  size: PosterSize
  background: PosterBackground
  elements: PosterElement[]
}

export interface PosterTemplate {
  id: string
  name: string
  category: string
  kind: PosterTemplateKind
  tags: string[]
  recommended?: boolean
  size: PosterSize
  background: PosterBackground
  elements: PosterElement[]
}

export interface PosterCanvasHandle {
  toDataURL: (mimeType: string, pixelRatio: number, quality?: number, outputSize?: { width: number; height: number }) => string
  getPhotoSlotAt: (clientX: number, clientY: number) => string | null
}
