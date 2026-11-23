import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import Konva from 'konva'
import { Arrow, Circle, Group, Image as KonvaImage, Layer, Line, Rect, Shape, Stage, Text, Transformer } from 'react-konva'
import useImage from 'use-image'
import { PHOTO_ZOOM, zoomFromWheel } from '../../lib/photoZoom'
import type { PosterCanvasHandle, PosterDocument, PosterElement, PosterImageElement, PosterTextElement } from './types'
import { clampSlotPhotoOffset, findPhotoSlotAt } from './photoSlots'
import './poster-canvas.css'

const emptyPhotoSlotName = 'empty-photo-slot'

function photoSlotPath(ctx: Konva.Context, { width, height, mask }: PosterImageElement) {
  ctx.beginPath()
  if (mask === 'circle') ctx.arc(0, 0, Math.min(width, height) / 2, 0, Math.PI * 2)
  else if (mask === 'oval') ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2)
  else if (mask === 'round') ctx.roundRect(-width / 2, -height / 2, width, height, Math.min(28, width * .08, height * .08))
  else ctx.rect(-width / 2, -height / 2, width, height)
  ctx.closePath()
}

interface Props {
  document: PosterDocument
  scale: number
  selectedId: string | null
  exporting: boolean
  dropTargetId: string | null
  showSafeArea: boolean
  onSelect: (id: string | null) => void
  onEditText?: (element: PosterTextElement, node: Konva.Node) => void
  tapToReplacePhoto: boolean
  onChange: (id: string, patch: Partial<PosterElement>) => void
  onDelete: (id: string) => void
  onRequestImage: (id: string) => void
}

function Background({ document }: { document: PosterDocument }) {
  const [image] = useImage(document.background.type === 'image' ? document.background.imageSrc : '')
  const { width, height } = document.size
  if (document.background.type === 'image' && image) {
    const cover = Math.max(width / image.width, height / image.height)
    const drawWidth = image.width * cover
    const drawHeight = image.height * cover
    return <KonvaImage image={image} x={(width-drawWidth)/2} y={(height-drawHeight)/2} width={drawWidth} height={drawHeight} opacity={document.background.opacity} listening={false}/>
  }
  if (document.background.type === 'gradient') {
    return <Rect width={width} height={height} fillLinearGradientStartPoint={{x:0,y:0}} fillLinearGradientEndPoint={{x:width,y:height}} fillLinearGradientColorStops={[0,document.background.color,1,document.background.secondary]} opacity={document.background.opacity} listening={false}/>
  }
  return <Rect width={width} height={height} fill={document.background.color} opacity={document.background.opacity} listening={false}/>
}

function ImageContent({ element, selected, exporting, onSelect, onChange }: {
  element: PosterImageElement
  selected: boolean
  exporting: boolean
  onSelect: () => void
  onChange: (patch: Partial<PosterElement>) => void
}) {
  const [image] = useImage(element.src)
  const imageRef = useRef<Konva.Image>(null)
  const clip = (ctx: Konva.Context) => photoSlotPath(ctx, element)
  useEffect(() => {
    const node=imageRef.current
    if (!node || !image) return
    const filters = [Konva.Filters.Brighten, Konva.Filters.Contrast, Konva.Filters.HSL]
    if (element.filter === 'grayscale') filters.push(Konva.Filters.Grayscale)
    if (element.filter === 'sepia') filters.push(Konva.Filters.Sepia)
    node.cache({pixelRatio:1})
    node.filters(filters)
    node.brightness(element.brightness/100)
    node.contrast(element.contrast)
    node.saturation(element.saturation/100)
    node.getLayer()?.batchDraw()
    return () => { node.clearCache() }
  }, [image, element.brightness, element.contrast, element.saturation, element.filter, element.width, element.height, element.zoom])
  if (!image) {
    if (exporting) return null
    return <>
      <Group clipFunc={clip}>
        <Rect id={element.id} name={emptyPhotoSlotName} x={-element.width/2} y={-element.height/2} width={element.width} height={element.height} fill="#e2e8f0" opacity={.62}/>
      </Group>
      <Text x={-element.width/2} y={-24} width={element.width} height={48} text="사진 놓기 또는 클릭" align="center" verticalAlign="middle" fontSize={Math.min(18, element.width / 8)} fontStyle="bold" fill="#334155" listening={false}/>
    </>
  }
  const cover=Math.max(element.width/image.width, element.height/image.height)
  const zoom = element.isSlot ? Math.max(PHOTO_ZOOM.coverMin, element.zoom) : element.zoom
  const drawWidth = image.width * cover * zoom
  const drawHeight = image.height * cover * zoom
  const constrainOffset = (x: number, y: number, width = drawWidth, height = drawHeight) => (
    element.isSlot ? clampSlotPhotoOffset(element, width, height, x, y) : { offsetX: x, offsetY: y }
  )
  const { offsetX, offsetY } = constrainOffset(element.offsetX, element.offsetY)
  const positionWithinSlot = (node: Konva.Node) => {
    const offset = constrainOffset(node.x() + drawWidth / 2, node.y() + drawHeight / 2)
    node.position({ x: offset.offsetX - drawWidth / 2, y: offset.offsetY - drawHeight / 2 })
    return offset
  }
  return <Group clipFunc={clip} onWheel={(event) => {
    const wheel = event.evt
    if (exporting || element.locked || wheel.deltaY === 0) return
    const point = event.currentTarget.getRelativePointerPosition()
    if (!point) return
    wheel.preventDefault()

    const minZoom = element.isSlot ? PHOTO_ZOOM.coverMin : Math.min(zoom, PHOTO_ZOOM.containMin)
    const nextZoom = Math.min(PHOTO_ZOOM.max, Math.max(minZoom, zoomFromWheel(zoom, wheel.deltaY)))
    if (nextZoom === zoom) return

    const ratio = nextZoom / zoom
    onChange({
      zoom: nextZoom,
      ...constrainOffset(point.x + (offsetX - point.x) * ratio, point.y + (offsetY - point.y) * ratio,
        drawWidth * ratio, drawHeight * ratio),
    })
  }}>
    <Rect x={-element.width/2} y={-element.height/2} width={element.width} height={element.height} fill="transparent" />
    <KonvaImage
      ref={imageRef}
      image={image}
      x={offsetX - drawWidth / 2}
      y={offsetY - drawHeight / 2}
      width={drawWidth}
      height={drawHeight}
      scaleX={element.flipX?-1:1}
      scaleY={element.flipY?-1:1}
      offsetX={element.flipX?drawWidth:0}
      offsetY={element.flipY?drawHeight:0}
      draggable={!exporting && !element.locked && (selected || element.isSlot)}
      onDragStart={(event) => { event.cancelBubble = true; onSelect() }}
      onDragMove={(event) => {
        event.cancelBubble = true
        if (element.isSlot) positionWithinSlot(event.currentTarget)
      }}
      onDragEnd={(event) => {
        event.cancelBubble = true
        onChange(positionWithinSlot(event.currentTarget))
      }}
    />
  </Group>
}

function ElementNode({ element, selected, exporting, onSelect, onEditText, tapToReplacePhoto, onChange, onRequestImage }: {
  element:PosterElement
  selected:boolean
  exporting:boolean
  onSelect:()=>void
  onEditText?: Props['onEditText']
  tapToReplacePhoto: boolean
  onChange:(patch:Partial<PosterElement>)=>void
  onRequestImage:()=>void
}) {
  const nodeRef=useRef<Konva.Group>(null)
  const transformerRef=useRef<Konva.Transformer>(null)
  useEffect(()=>{
    if (selected && nodeRef.current && transformerRef.current) {
      transformerRef.current.nodes([nodeRef.current])
      transformerRef.current.getLayer()?.batchDraw()
    }
  },[selected])
  if (!element.visible) return null
  const finishTransform=()=>{
    const node=nodeRef.current
    if (!node) return
    const scaleX=node.scaleX(), scaleY=node.scaleY()
    node.scaleX(1);node.scaleY(1)
    onChange({x:node.x(),y:node.y(),rotation:node.rotation(),width:Math.max(24,element.width*scaleX),height:Math.max(24,element.height*scaleY)})
  }
  const selectElement = (event: Konva.KonvaEventObject<Event>, tapped: boolean) => {
    event.cancelBubble = true
    onSelect()
    if (!exporting && !element.locked && element.kind === 'image' &&
      (!element.src || (tapped && tapToReplacePhoto && element.isSlot))) onRequestImage()
    if (!exporting && !element.locked && element.kind === 'text' && onEditText) {
      const textNode = nodeRef.current?.findOne('Text')
      if (textNode) onEditText(element, textNode)
    }
  }
  return <>
    <Group
      ref={nodeRef}
      id={`poster-element-${element.id}`}
      x={element.x}
      y={element.y}
      rotation={element.rotation}
      opacity={element.opacity}
      draggable={!element.locked && !(element.kind === 'image' && element.src && (element.isSlot || selected))}
      onClick={(event) => selectElement(event, false)}
      onTap={(event) => selectElement(event, true)}
      onDragStart={onSelect}
      onDragEnd={(event)=>onChange({x:event.currentTarget.x(),y:event.currentTarget.y()})}
      onTransformEnd={finishTransform}
    >
      {element.kind==='image'&&<ImageContent element={element} selected={selected} exporting={exporting} onSelect={onSelect} onChange={onChange}/>}
      {element.kind==='text'&&<>
        {element.background!=='transparent'&&<Rect x={-element.width/2} y={-element.height/2} width={element.width} height={element.height} fill={element.background} cornerRadius={8}/>} 
        <Text x={-element.width/2} y={-element.height/2} width={element.width} height={element.height} text={element.text} fontFamily={element.fontFamily} fontSize={element.fontSize} fontStyle={element.fontStyle} fill={element.fill} align={element.align} verticalAlign="middle" letterSpacing={element.letterSpacing} lineHeight={element.lineHeight} stroke={element.stroke} strokeWidth={element.strokeWidth} shadowColor={element.shadowColor} shadowBlur={element.shadowBlur} textDecoration={element.underline?'underline':''}/>
      </>}
      {element.kind==='sticker'&&(element.stickerType==='emoji'
        ? <Text ref={(node)=>{if(node){node.offsetX(node.width()/2);node.offsetY(node.height()/2)}}} text={element.value} fontSize={Math.min(element.width,element.height)} />
        : <StickerImage value={element.value} width={element.width} height={element.height}/>)}
      {element.kind==='qr'&&<StickerImage value={element.src} width={element.width} height={element.height}/>} 
      {element.kind==='shape'&&<ShapeContent element={element}/>} 
    </Group>
    {selected&&!element.locked&&<Transformer ref={transformerRef} rotateEnabled enabledAnchors={['top-left','top-right','bottom-left','bottom-right','middle-left','middle-right','top-center','bottom-center']} boundBoxFunc={(oldBox,newBox)=>newBox.width<24||newBox.height<24?oldBox:newBox} borderStroke="#7c3aed" anchorFill="#ffffff" anchorStroke="#7c3aed" anchorSize={10}/>} 
  </>
}

function StickerImage({value,width,height}:{value:string;width:number;height:number}) {
  const [image]=useImage(value)
  return image?<KonvaImage image={image} x={-width/2} y={-height/2} width={width} height={height}/>:null
}

function ShapeContent({element}:{element:Extract<PosterElement,{kind:'shape'}>}) {
  const {width:w,height:h}=element
  if(element.shape==='circle') return <Circle radius={Math.min(w,h)/2} fill={element.fill} stroke={element.stroke} strokeWidth={element.strokeWidth}/>
  if(element.shape==='triangle') return <Line points={[0,-h/2,w/2,h/2,-w/2,h/2]} closed fill={element.fill} stroke={element.stroke} strokeWidth={element.strokeWidth}/>
  if(element.shape==='line') return <Line points={[-w/2,0,w/2,0]} stroke={element.stroke==='transparent'?element.fill:element.stroke} strokeWidth={Math.max(2,element.strokeWidth)} lineCap="round"/>
  if(element.shape==='arrow') return <Arrow points={[-w/2,0,w/2,0]} stroke={element.stroke==='transparent'?element.fill:element.stroke} fill={element.fill} strokeWidth={Math.max(3,element.strokeWidth)} pointerLength={18} pointerWidth={18}/>
  if(element.shape==='bubble') return <><Rect x={-w/2} y={-h/2} width={w} height={h*.8} fill={element.fill} stroke={element.stroke} strokeWidth={element.strokeWidth} cornerRadius={element.radius||22}/><Line points={[-w*.12,h*.3,-w*.22,h*.5,w*.02,h*.3]} closed fill={element.fill}/></>
  if(element.shape==='banner') return <Line points={[-w/2,-h/2,w/2,-h/2,w*.42,0,w/2,h/2,-w/2,h/2,-w*.42,0]} closed fill={element.fill} stroke={element.stroke} strokeWidth={element.strokeWidth}/>
  return <Rect x={-w/2} y={-h/2} width={w} height={h} fill={element.fill} stroke={element.stroke} strokeWidth={element.strokeWidth} cornerRadius={element.radius}/>
}

export const PosterCanvas=forwardRef<PosterCanvasHandle,Props>(function PosterCanvas({document,scale,selectedId,exporting,dropTargetId,showSafeArea,onSelect,onEditText,tapToReplacePhoto,onChange,onDelete,onRequestImage},ref){
  const stageRef=useRef<Konva.Stage>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null)
  const {width, height} = document.size
  useImperativeHandle(ref, () => ({
    toDataURL: (mimeType, pixelRatio, quality=.95, outputSize) => {
      const stage = stageRef.current
      if (!stage) return ''
      if (!outputSize) return stage.toDataURL({mimeType,pixelRatio,quality})

      const canvas = stage.toCanvas({pixelRatio})
      if (canvas.width === outputSize.width && canvas.height === outputSize.height) return canvas.toDataURL(mimeType, quality)

      const resized = window.document.createElement('canvas')
      resized.width = outputSize.width
      resized.height = outputSize.height
      const context = resized.getContext('2d')
      if (!context) return ''
      context.drawImage(canvas, 0, 0, resized.width, resized.height)
      return resized.toDataURL(mimeType, quality)
    },
    getPhotoSlotAt: (clientX, clientY) => {
      const bounds = wrapperRef.current?.getBoundingClientRect()
      if (!bounds?.width || !bounds.height) return null
      const x = (clientX - bounds.left) * width / bounds.width
      const y = (clientY - bounds.top) * height / bounds.height
      if (x < 0 || x > width || y < 0 || y > height) return null
      return findPhotoSlotAt(document.elements, x, y)
    },
  }), [document.elements, width, height])
  const selected=document.elements.find((element)=>element.id===selectedId)
  const deleteTarget = !exporting && selected?.visible && !selected.locked &&
    (selected.kind === 'text' || selected.kind === 'sticker' || selected.kind === 'shape') ? selected : null
  useLayoutEffect(() => {
    const button = deleteButtonRef.current
    if (!button || !deleteTarget) return
    const node = stageRef.current?.findOne((item: Konva.Node) => item.id() === `poster-element-${deleteTarget.id}`)
    if (!node) return

    const positionButton = () => {
      const bounds = node.getClientRect({skipTransform:true, skipShadow:true})
      const corner = node.getAbsoluteTransform().point({x:bounds.x + bounds.width, y:bounds.y})
      const edge = 12
      button.style.left = `${Math.max(edge, Math.min(width * scale - edge, corner.x * scale + 12))}px`
      button.style.top = `${Math.max(edge, Math.min(height * scale - edge, corner.y * scale - 10))}px`
      button.style.visibility = 'visible'
    }
    positionButton()
    node.on('dragmove.deleteButton dragend.deleteButton transform.deleteButton transformend.deleteButton', positionButton)
    return () => { node.off('.deleteButton') }
  }, [deleteTarget, width, height, scale])

  const dropTarget = document.elements.find((element) => element.id === dropTargetId)
  const showSlotCursor = !exporting && hoveredSlotId !== null && document.elements.some(
    (element) => element.id === hoveredSlotId && element.kind === 'image' && element.visible && !element.src,
  )
  return <div ref={wrapperRef} className="poster-stage-wrap" style={{width:width*scale,height:height*scale}}>
    <Stage
      ref={stageRef}
      width={document.size.width}
      height={document.size.height}
      style={{transform:`scale(${scale})`,transformOrigin:'top left',cursor:showSlotCursor?'pointer':undefined}}
      onMouseMove={({target}) => setHoveredSlotId(target.hasName(emptyPhotoSlotName) ? target.id() : null)}
      onMouseLeave={() => setHoveredSlotId(null)}
      onMouseDown={(event)=>{if(event.target===event.target.getStage())onSelect(null)}}
      onTouchStart={(event)=>{if(event.target===event.target.getStage())onSelect(null)}}
    >
      <Layer>
        <Background document={document}/>
        {document.elements.map((element)=><ElementNode key={element.id} element={element} selected={!exporting&&selectedId===element.id}
          exporting={exporting} onSelect={()=>onSelect(element.id)} onEditText={onEditText} tapToReplacePhoto={tapToReplacePhoto}
          onChange={(patch)=>onChange(element.id,patch)} onRequestImage={()=>onRequestImage(element.id)}/>) }
        {dropTarget?.kind === 'image' && !exporting && <Shape
          x={dropTarget.x} y={dropTarget.y} rotation={dropTarget.rotation}
          fill="#ede9fe55" stroke="#7c3aed" strokeWidth={4} listening={false}
          sceneFunc={(ctx, guide) => { photoSlotPath(ctx, dropTarget); ctx.fillStrokeShape(guide) }}
        />}
        {showSafeArea&&!exporting&&<Rect x={28} y={28} width={document.size.width-56} height={document.size.height-56} stroke="#ef4444" strokeWidth={1.5} dash={[10,7]} opacity={.65} listening={false}/>} 
      </Layer>
    </Stage>
    {deleteTarget && <button
      type="button" ref={deleteButtonRef} className="poster-element-delete"
      title={`${deleteTarget.name} 삭제`} aria-label={`${deleteTarget.name} 삭제`}
      onClick={() => onDelete(deleteTarget.id)}
    ><X size={13} aria-hidden="true" /></button>}
  </div>
})
