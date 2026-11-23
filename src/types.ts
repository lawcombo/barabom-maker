export type Orientation = 'portrait' | 'landscape' | 'grid'
export type ToolTab = 'layout' | 'templates' | 'photos' | 'text' | 'stickers' | 'background' | 'projects'
export type CaptionField = 'topCaption' | 'bottomCaption'
export type CaptionStyle = { fontFamily?: string; fontSize?: number; fill?: string }
export type SelectedElement = { type: 'slot' | 'text' | 'sticker'; id: string } | { type: 'caption'; id: CaptionField } | null

export interface SlotPhoto {
  id: string
  src: string
  name: string
  zoom: number
  offsetX: number
  offsetY: number
  rotation: number
  flipX: boolean
  flipY: boolean
  brightness: number
  contrast: number
  saturation: number
  filter: 'none' | 'grayscale' | 'sepia'
  fit: 'cover' | 'contain'
}

export interface TextElement {
  id: string
  text: string
  x: number
  y: number
  width: number
  fontFamily: string
  fontSize: number
  fontStyle: 'normal' | 'bold'
  fill: string
  align: 'left' | 'center' | 'right'
  letterSpacing: number
  lineHeight: number
  rotation: number
  opacity: number
  stroke: string
  strokeWidth: number
  shadowColor: string
  shadowBlur: number
  background: string
}

export interface StickerElement {
  id: string
  kind: 'emoji' | 'image'
  value: string
  x: number
  y: number
  size: number
  rotation: number
  opacity: number
}

export interface FrameSettings {
  background: string
  borderColor: string
  borderWidth: number
  gap: number
  padding: number
  radius: number
  pattern: string
  showDecorations: boolean
  showDate: boolean
  topCaption: string
  bottomCaption: string
  captionStyles?: Partial<Record<CaptionField, CaptionStyle>>
}

export interface EditorDocument {
  version: 1
  id: string
  name: string
  updatedAt: number
  cutCount: number
  orientation: Orientation
  templateId: string
  photos: Array<SlotPhoto | null>
  texts: TextElement[]
  stickers: StickerElement[]
  frame: FrameSettings
  output: {
    preset: 'strip50x150' | '2x6' | '4x6' | 'custom'
    widthMm: number
    heightMm: number
    dpi: number
  }
}

export interface LayoutRect {
  id: string
  x: number
  y: number
  width: number
  height: number
  mask?: 'oval' | 'scallop'
}

export interface FrameCaption {
  x: number
  y: number
  width: number
  fontSize: number
  fontFamily?: string
  align?: 'left' | 'center'
}

export interface DesignedFrameLayout {
  orientation: Orientation
  label: string
  slots: LayoutRect[]
  illustration?: string
  title: FrameCaption
  footer: FrameCaption
}

export interface DesignTemplate {
  id: string
  name: string
  category: string
  colors: [string, string, string]
  background: string
  borderColor: string
  borderWidth: number
  gap: number
  padding: number
  radius: number
  pattern: 'none' | 'dots' | 'grid' | 'stripes' | 'confetti' | 'stars' | 'waves' | 'film' | 'hearts' | 'flowers' | 'checker' | 'terrazzo' | 'sunburst' | 'lace' | 'neon' | 'newspaper' | 'comic' | 'ornament'
  topCaption: string
  bottomCaption: string
  decoration: string
  layout?: DesignedFrameLayout
}
