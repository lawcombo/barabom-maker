import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import Konva from 'konva'
import { Circle, Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text } from 'react-konva'
import useImage from 'use-image'
import { ARTBOARD, getLayoutRects } from '../data/layouts'
import { templateById } from '../data/templates'
import type { EditorDocument, LayoutRect, SelectedElement, SlotPhoto, StickerElement, TextElement } from '../types'

export interface CanvasHandle {
  toDataURL: (mimeType: 'image/png' | 'image/jpeg', pixelRatio: number, quality?: number) => string
  size: () => { width: number; height: number }
}

interface Props {
  document: EditorDocument
  viewScale: number
  selected: SelectedElement
  showSafeArea: boolean
  onSelect: (selection: SelectedElement) => void
  onPhotoChange: (index: number, photo: SlotPhoto) => void
  onTextChange: (id: string, patch: Partial<TextElement>) => void
  onStickerChange: (id: string, patch: Partial<StickerElement>) => void
  onRequestUpload: (index: number) => void
  onFilesDropped: (files: File[], index: number) => void
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

function roundedPath(ctx: Konva.Context, rect: LayoutRect, radius: number) {
  const r = Math.max(0, Math.min(radius, rect.width / 2, rect.height / 2))
  ctx.beginPath()
  ctx.moveTo(rect.x + r, rect.y)
  ctx.lineTo(rect.x + rect.width - r, rect.y)
  ctx.quadraticCurveTo(rect.x + rect.width, rect.y, rect.x + rect.width, rect.y + r)
  ctx.lineTo(rect.x + rect.width, rect.y + rect.height - r)
  ctx.quadraticCurveTo(rect.x + rect.width, rect.y + rect.height, rect.x + rect.width - r, rect.y + rect.height)
  ctx.lineTo(rect.x + r, rect.y + rect.height)
  ctx.quadraticCurveTo(rect.x, rect.y + rect.height, rect.x, rect.y + rect.height - r)
  ctx.lineTo(rect.x, rect.y + r)
  ctx.quadraticCurveTo(rect.x, rect.y, rect.x + r, rect.y)
  ctx.closePath()
}

function PhotoNode({ photo, rect, radius, selected, onSelect, onChange }: {
  photo: SlotPhoto
  rect: LayoutRect
  radius: number
  selected: boolean
  onSelect: () => void
  onChange: (photo: SlotPhoto) => void
}) {
  const [image] = useImage(photo.src)
  const imageRef = useRef<Konva.Image>(null)
  const quarterTurn = Math.abs(Math.round(photo.rotation / 90)) % 2 === 1
  const sourceW = quarterTurn ? (image?.height || 1) : (image?.width || 1)
  const sourceH = quarterTurn ? (image?.width || 1) : (image?.height || 1)
  const baseScale = photo.fit === 'cover'
    ? Math.max(rect.width / sourceW, rect.height / sourceH)
    : Math.min(rect.width / sourceW, rect.height / sourceH)
  const scale = baseScale * photo.zoom

  useEffect(() => {
    if (!imageRef.current || !image) return
    imageRef.current.cache({ pixelRatio: 1 })
  }, [image, photo.brightness, photo.contrast, photo.saturation, photo.filter])

  const filters = useMemo(() => {
    const result = [Konva.Filters.Brighten, Konva.Filters.Contrast, Konva.Filters.HSL]
    if (photo.filter === 'grayscale') result.push(Konva.Filters.Grayscale)
    if (photo.filter === 'sepia') result.push(Konva.Filters.Sepia)
    return result
  }, [photo.filter])

  const clampPosition = (x: number, y: number) => {
    if (!image || photo.fit === 'contain') return { x, y }
    const visualW = sourceW * scale
    const visualH = sourceH * scale
    const halfW = visualW / 2
    const halfH = visualH / 2
    return {
      x: visualW <= rect.width ? rect.x + rect.width / 2 : clamp(x, rect.x + rect.width - halfW, rect.x + halfW),
      y: visualH <= rect.height ? rect.y + rect.height / 2 : clamp(y, rect.y + rect.height - halfH, rect.y + halfH),
    }
  }

  return (
    <Group clipFunc={(ctx) => roundedPath(ctx, rect, radius)}>
      <KonvaImage
        ref={imageRef}
        name="photo-node"
        image={image}
        x={rect.x + rect.width / 2 + photo.offsetX}
        y={rect.y + rect.height / 2 + photo.offsetY}
        offsetX={(image?.width || 0) / 2}
        offsetY={(image?.height || 0) / 2}
        scaleX={scale * (photo.flipX ? -1 : 1)}
        scaleY={scale * (photo.flipY ? -1 : 1)}
        rotation={photo.rotation}
        draggable
        filters={filters}
        brightness={photo.brightness / 100}
        contrast={photo.contrast}
        saturation={photo.saturation / 100}
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={onSelect}
        onDragMove={(event) => {
          const point = clampPosition(event.target.x(), event.target.y())
          event.target.position(point)
        }}
        onDragEnd={(event) => {
          const point = clampPosition(event.target.x(), event.target.y())
          event.target.position(point)
          onChange({
            ...photo,
            offsetX: point.x - (rect.x + rect.width / 2),
            offsetY: point.y - (rect.y + rect.height / 2),
          })
        }}
      />
      {selected && <Rect {...rect} stroke="#7c3aed" strokeWidth={4} dash={[10, 6]} listening={false} />}
    </Group>
  )
}

function Pattern({ document }: { document: EditorDocument }) {
  const { width, height } = ARTBOARD[document.orientation]
  const pattern = document.frame.pattern
  const template = templateById(document.templateId)
  const accent = template.colors[1]
  const secondary = template.colors[2]
  if (pattern === 'none') return null
  if (pattern === 'dots' || pattern === 'stars' || pattern === 'confetti') {
    return <Group opacity={0.18} listening={false}>{Array.from({ length: 45 }, (_, i) => {
      const x = (i * 83) % width
      const y = (i * 137) % height
      if (pattern === 'stars') return <Text key={i} x={x} y={y} text="✦" fontSize={14 + i % 10} fill={accent} />
      if (pattern === 'confetti') return <Line key={i} points={[x, y, x + (i % 2 ? 8 : -6), y + 12]} stroke={accent} strokeWidth={3} />
      return <Circle key={i} x={x} y={y} radius={2 + i % 3} fill={accent} />
    })}</Group>
  }
  if (pattern === 'grid') return <Group opacity={0.10} listening={false}>{[
    ...Array.from({ length: Math.ceil(width / 36) }, (_, i) => <Line key={`v${i}`} points={[i * 36, 0, i * 36, height]} stroke={accent} />),
    ...Array.from({ length: Math.ceil(height / 36) }, (_, i) => <Line key={`h${i}`} points={[0, i * 36, width, i * 36]} stroke={accent} />),
  ]}</Group>
  if (pattern === 'stripes') return <Group opacity={0.12} listening={false}>{Array.from({ length: Math.ceil((width + height) / 42) }, (_, i) => <Line key={i} points={[i * 42 - height, height, i * 42, 0]} stroke={accent} strokeWidth={16} />)}</Group>
  if (pattern === 'film') return <Group opacity={0.75} listening={false}>{Array.from({ length: Math.ceil(height / 34) }, (_, i) => <><Rect key={`l${i}`} x={8} y={i * 34 + 7} width={12} height={18} fill={accent}/><Rect key={`r${i}`} x={width-20} y={i * 34 + 7} width={12} height={18} fill={accent}/></>)}</Group>
  if (pattern === 'hearts' || pattern === 'flowers') return <Group opacity={0.16} listening={false}>{Array.from({ length: 32 }, (_, i) => <Text key={i} x={(i * 97) % width} y={(i * 151) % height} text={pattern === 'hearts' ? (i % 3 ? '♥' : '♡') : (i % 2 ? '✿' : '❀')} fontSize={15 + i % 12} rotation={(i * 17) % 30 - 15} fill={i % 4 ? accent : secondary}/>)}</Group>
  if (pattern === 'checker') {
    const size = 34
    return <Group opacity={0.13} listening={false}>{Array.from({ length: Math.ceil(width / size) * Math.ceil(height / size) }, (_, i) => {
      const columns = Math.ceil(width / size)
      const x = (i % columns) * size
      const y = Math.floor(i / columns) * size
      return <Rect key={i} x={x} y={y} width={size} height={size} fill={(Math.floor(x / size) + Math.floor(y / size)) % 2 ? accent : secondary}/>
    })}</Group>
  }
  if (pattern === 'terrazzo') return <Group opacity={0.18} listening={false}>{Array.from({ length: 42 }, (_, i) => {
    const x = (i * 89) % width
    const y = (i * 143) % height
    return i % 3 === 0
      ? <Circle key={i} x={x} y={y} radius={3 + i % 7} fill={i % 2 ? accent : secondary}/>
      : <Line key={i} points={[x, y, x + 7 + i % 9, y + (i % 2 ? 12 : -10)]} stroke={i % 2 ? accent : secondary} strokeWidth={3 + i % 4} lineCap="round"/>
  })}</Group>
  if (pattern === 'sunburst') return <Group opacity={0.10} listening={false}>{Array.from({ length: 36 }, (_, i) => {
    const angle = i / 36 * Math.PI * 2
    const radius = Math.max(width, height)
    return <Line key={i} points={[width / 2, height / 2, width / 2 + Math.cos(angle) * radius, height / 2 + Math.sin(angle) * radius]} stroke={i % 2 ? accent : secondary} strokeWidth={12}/>
  })}</Group>
  if (pattern === 'lace') return <Group opacity={0.30} listening={false}>{Array.from({ length: Math.ceil(width / 24) }, (_, i) => <Group key={i}><Circle x={i * 24 + 12} y={8} radius={10} stroke={accent} strokeWidth={2}/><Circle x={i * 24 + 12} y={height - 8} radius={10} stroke={accent} strokeWidth={2}/></Group>)}</Group>
  if (pattern === 'neon') return <Group opacity={0.20} listening={false}><Circle x={width * .18} y={height * .18} radius={42} stroke={accent} strokeWidth={8}/><Circle x={width * .82} y={height * .74} radius={64} stroke={secondary} strokeWidth={10}/>{Array.from({ length: 12 }, (_, i) => <Line key={i} points={[0, i * 52, width, i * 52 - 110]} stroke={i % 2 ? accent : secondary} strokeWidth={2}/>)}</Group>
  if (pattern === 'newspaper') return <Group opacity={0.13} listening={false}>{Array.from({ length: 12 }, (_, i) => <Group key={i}><Text x={12} y={i * 64 + 6} text={i % 2 ? 'PHOTO  NEWS  •  SPECIAL EDITION' : 'THE DAILY MOMENT'} fontFamily="Georgia" fontStyle="bold" fontSize={13} fill={accent}/><Line points={[12, i * 64 + 27, width - 12, i * 64 + 27]} stroke={accent} strokeWidth={2}/><Line points={[12, i * 64 + 36, width * .45, i * 64 + 36]} stroke={accent}/><Line points={[width * .55, i * 64 + 36, width - 12, i * 64 + 36]} stroke={accent}/></Group>)}</Group>
  if (pattern === 'comic') return <Group opacity={0.17} listening={false}>{Array.from({ length: 52 }, (_, i) => <Circle key={i} x={(i * 61) % width} y={(i * 103) % height} radius={2 + i % 3} fill={accent}/>)}<Text x={width * .08} y={height * .18} text="WOW!" fontStyle="bold" fontSize={44} rotation={-12} fill={accent}/><Text x={width * .62} y={height * .72} text="POP!" fontStyle="bold" fontSize={38} rotation={9} fill={secondary}/></Group>
  if (pattern === 'ornament') return <Group opacity={0.18} listening={false}>{Array.from({ length: Math.ceil(height / 48) }, (_, i) => <Group key={i}><Text x={7} y={i * 48} text="◆◇◆" fontSize={15} fill={accent}/><Text x={width - 55} y={i * 48} text="◆◇◆" fontSize={15} fill={accent}/></Group>)}</Group>
  return <Group opacity={0.13} listening={false}>{Array.from({ length: Math.ceil(height / 55) }, (_, i) => <Line key={i} points={[0, i * 55 + 15, width * .25, i * 55, width * .5, i * 55 + 15, width * .75, i * 55 + 30, width, i * 55 + 15]} stroke={accent} strokeWidth={4} tension={0.35}/>)}</Group>
}

function StickerNode({ sticker, selected, onSelect, onChange }: {
  sticker: StickerElement
  selected: boolean
  onSelect: () => void
  onChange: (patch: Partial<StickerElement>) => void
}) {
  const [image] = useImage(sticker.kind === 'image' ? sticker.value : '')
  const common = {
    x: sticker.x, y: sticker.y, rotation: sticker.rotation, opacity: sticker.opacity,
    draggable: true, onClick: onSelect, onTap: onSelect,
    onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => onChange({ x: event.target.x(), y: event.target.y() }),
  }
  return <Group>{sticker.kind === 'image'
    ? <KonvaImage {...common} image={image} width={sticker.size} height={sticker.size} offsetX={sticker.size / 2} offsetY={sticker.size / 2}/>
    : <Text {...common} text={sticker.value} fontSize={sticker.size} offsetX={sticker.size / 2} offsetY={sticker.size / 2}/>
  }{selected && <Circle x={sticker.x} y={sticker.y} radius={sticker.size * .62} stroke="#7c3aed" dash={[6, 5]} listening={false}/>}</Group>
}

export const CanvasStage = forwardRef<CanvasHandle, Props>(function CanvasStage({
  document, viewScale, selected, showSafeArea, onSelect, onPhotoChange, onTextChange,
  onStickerChange, onRequestUpload, onFilesDropped,
}, ref) {
  const stageRef = useRef<Konva.Stage>(null)
  const hoverIndex = useRef<number | null>(null)
  const pinch = useRef<{ distance: number; index: number } | null>(null)
  const artboard = ARTBOARD[document.orientation]
  const rects = useMemo(() => getLayoutRects(document.cutCount, document.orientation, document.frame.padding, document.frame.gap), [document.cutCount, document.orientation, document.frame.padding, document.frame.gap])
  const template = templateById(document.templateId)

  useImperativeHandle(ref, () => ({
    toDataURL: (mimeType, pixelRatio, quality = .95) => stageRef.current?.toDataURL({ mimeType, pixelRatio, quality }) || '',
    size: () => ({ width: artboard.width, height: artboard.height }),
  }), [artboard])

  const zoomPhoto = (index: number, nextZoom: number, pointer?: { x: number; y: number }) => {
    const photo = document.photos[index]
    const rect = rects[index]
    if (!photo || !rect) return
    const zoom = clamp(nextZoom, photo.fit === 'cover' ? 1 : .15, 8)
    let offsetX = photo.offsetX
    let offsetY = photo.offsetY
    if (pointer) {
      const centerX = rect.x + rect.width / 2 + photo.offsetX
      const centerY = rect.y + rect.height / 2 + photo.offsetY
      const ratio = zoom / photo.zoom
      offsetX = pointer.x - (pointer.x - centerX) * ratio - (rect.x + rect.width / 2)
      offsetY = pointer.y - (pointer.y - centerY) * ratio - (rect.y + rect.height / 2)
    }
    onPhotoChange(index, { ...photo, zoom, offsetX, offsetY })
  }

  return (
    <div
      className="relative touch-none overflow-hidden rounded-md shadow-[0_24px_60px_rgba(15,23,42,.18)]"
      style={{ width: artboard.width * viewScale, height: artboard.height * viewScale }}
      onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy' }}
      onDrop={(event) => {
        event.preventDefault()
        const bounds = event.currentTarget.getBoundingClientRect()
        const x = (event.clientX - bounds.left) / viewScale
        const y = (event.clientY - bounds.top) / viewScale
        const index = rects.findIndex((rect) => x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height)
        if (index >= 0) onFilesDropped(Array.from(event.dataTransfer.files), index)
      }}
    >
      <Stage
        ref={stageRef}
        width={artboard.width * viewScale}
        height={artboard.height * viewScale}
        onMouseDown={(event) => { if (event.target === event.target.getStage()) onSelect(null) }}
        onWheel={(event) => {
          const index = hoverIndex.current
          if (index === null || !document.photos[index]) return
          event.evt.preventDefault()
          const point = stageRef.current?.getPointerPosition()
          const current = document.photos[index]!
          zoomPhoto(index, current.zoom * (event.evt.deltaY > 0 ? .94 : 1.06), point ? { x: point.x / viewScale, y: point.y / viewScale } : undefined)
        }}
        onTouchStart={(event) => {
          if (event.evt.touches.length !== 2 || hoverIndex.current === null) return
          const [a, b] = Array.from(event.evt.touches)
          pinch.current = { distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), index: hoverIndex.current }
        }}
        onTouchMove={(event) => {
          if (!pinch.current || event.evt.touches.length !== 2) return
          event.evt.preventDefault()
          const [a, b] = Array.from(event.evt.touches)
          const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
          const photo = document.photos[pinch.current.index]
          if (photo) zoomPhoto(pinch.current.index, photo.zoom * (distance / pinch.current.distance))
          pinch.current.distance = distance
        }}
        onTouchEnd={() => { pinch.current = null }}
      >
        <Layer scaleX={viewScale} scaleY={viewScale}>
          <Rect width={artboard.width} height={artboard.height} fill={document.frame.background} listening={false}/>
          <Pattern document={document}/>
          <Text text={document.frame.topCaption} x={20} y={18} width={artboard.width - 40} align="center" fontFamily="Noto Sans KR" fontStyle="bold" fontSize={document.orientation === 'landscape' ? 18 : 15} letterSpacing={3} fill={template.colors[1]} listening={false}/>
          {document.frame.showDecorations && <><Text text={template.decoration} x={20} y={18} fontSize={22} fill={template.colors[1]} listening={false}/><Text text={template.decoration} x={artboard.width - 42} y={18} fontSize={22} fill={template.colors[1]} listening={false}/></>}
          {rects.map((rect, index) => {
            const photo = document.photos[index]
            return <Group key={rect.id} onMouseEnter={() => { hoverIndex.current = index }} onMouseLeave={() => { if (hoverIndex.current === index) hoverIndex.current = null }} onTouchStart={() => { hoverIndex.current = index }}>
              <Rect {...rect} fill="#e5e7eb" cornerRadius={document.frame.radius} shadowColor="#111827" shadowOpacity={.10} shadowBlur={8}/>
              {photo ? <PhotoNode photo={photo} rect={rect} radius={document.frame.radius} selected={selected?.type === 'slot' && selected.id === String(index)} onSelect={() => onSelect({ type: 'slot', id: String(index) })} onChange={(next) => onPhotoChange(index, next)}/>
                : <Group onClick={() => onRequestUpload(index)} onTap={() => onRequestUpload(index)}><Rect {...rect} fill="#f8fafc" cornerRadius={document.frame.radius} stroke={document.frame.borderColor} strokeWidth={1} dash={[8, 8]}/><Text x={rect.x} y={rect.y + rect.height / 2 - 28} width={rect.width} text="＋" align="center" fontSize={28} fill="#94a3b8"/><Text x={rect.x} y={rect.y + rect.height / 2 + 8} width={rect.width} text="사진 넣기" align="center" fontSize={13} fill="#64748b"/></Group>}
              <Rect {...rect} cornerRadius={document.frame.radius} stroke={document.frame.borderColor} strokeWidth={document.frame.borderWidth} listening={false}/>
            </Group>
          })}
          <Text text={document.frame.bottomCaption} x={24} y={artboard.height - 48} width={artboard.width - 48} align="center" fontFamily="Gaegu" fontSize={18} fill={template.colors[1]} listening={false}/>
          {document.frame.showDate && <Text text={new Intl.DateTimeFormat('ko-KR', { year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date())} x={24} y={artboard.height - 27} width={artboard.width - 48} align="center" fontFamily="Noto Sans KR" fontSize={9} letterSpacing={1} fill={template.colors[1]} opacity={.75} listening={false}/>} 
          {document.texts.map((item) => <Group
            key={item.id}
            x={item.x}
            y={item.y}
            rotation={item.rotation}
            draggable
            onClick={() => onSelect({ type:'text', id:item.id })}
            onTap={() => onSelect({ type:'text', id:item.id })}
            onDragStart={() => onSelect({ type:'text', id:item.id })}
            onDragEnd={(event) => onTextChange(item.id, { x:event.target.x(), y:event.target.y() })}
          >
            {item.background !== 'transparent' && <Rect x={-6} y={-4} width={item.width + 12} height={item.fontSize * item.lineHeight + 8} fill={item.background} cornerRadius={4}/>}
            <Text
              text={item.text} x={0} y={0} width={item.width} fontFamily={item.fontFamily} fontSize={item.fontSize}
              fontStyle={item.fontStyle} fill={item.fill} align={item.align} letterSpacing={item.letterSpacing} lineHeight={item.lineHeight}
              opacity={item.opacity} stroke={item.stroke} strokeWidth={item.strokeWidth}
              shadowColor={item.shadowColor} shadowBlur={item.shadowBlur}
            />
            {selected?.type === 'text' && selected.id === item.id && <Rect x={-6} y={-5} width={item.width + 12} height={item.fontSize * item.lineHeight + 10} stroke="#7c3aed" dash={[7,5]} listening={false}/>}
          </Group>)}
          {document.stickers.map((sticker) => <StickerNode key={sticker.id} sticker={sticker} selected={selected?.type === 'sticker' && selected.id === sticker.id} onSelect={() => onSelect({ type:'sticker', id:sticker.id })} onChange={(patch) => onStickerChange(sticker.id, patch)}/>)}
          {showSafeArea && <Rect x={18} y={18} width={artboard.width - 36} height={artboard.height - 36} stroke="#ef4444" strokeWidth={1} dash={[8,6]} opacity={.75} listening={false}/>} 
        </Layer>
      </Stage>
    </div>
  )
})
