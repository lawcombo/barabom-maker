import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import Konva from 'konva'
import { Arrow, Circle, Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text, Transformer } from 'react-konva'
import useImage from 'use-image'
import type { PosterCanvasHandle, PosterDocument, PosterElement, PosterImageElement } from './types'

interface Props {
  document: PosterDocument
  scale: number
  selectedId: string | null
  exporting: boolean
  showSafeArea: boolean
  onSelect: (id: string | null) => void
  onChange: (id: string, patch: Partial<PosterElement>) => void
  onRequestImage: (id: string) => void
}

function Background({ document }: { document: PosterDocument }) {
  const [image] = useImage(document.background.type === 'image' ? document.background.imageSrc : '')
  const { width, height } = document.size
  if (document.background.type === 'image' && image) {
    const cover = Math.max(width / image.width, height / image.height)
    const drawWidth = image.width * cover
    const drawHeight = image.height * cover
    return <KonvaImage image={image} x={(width-drawWidth)/2} y={(height-drawHeight)/2} width={drawWidth} height={drawHeight} opacity={document.background.opacity}/>
  }
  if (document.background.type === 'gradient') {
    return <Rect width={width} height={height} fillLinearGradientStartPoint={{x:0,y:0}} fillLinearGradientEndPoint={{x:width,y:height}} fillLinearGradientColorStops={[0,document.background.color,1,document.background.secondary]} opacity={document.background.opacity}/>
  }
  return <Rect width={width} height={height} fill={document.background.color} opacity={document.background.opacity}/>
}

function ImageContent({ element, selected, onChange }: { element: PosterImageElement; selected: boolean; onChange:(patch:Partial<PosterElement>)=>void }) {
  const [image] = useImage(element.src)
  const imageRef = useRef<Konva.Image>(null)
  const clip = (ctx: Konva.Context) => {
    const w=element.width, h=element.height
    ctx.beginPath()
    if (element.mask === 'circle') ctx.arc(0,0,Math.min(w,h)/2,0,Math.PI*2)
    else if (element.mask === 'oval') ctx.ellipse(0,0,w/2,h/2,0,0,Math.PI*2)
    else if (element.mask === 'round') ctx.roundRect(-w/2,-h/2,w,h,Math.min(28,w*.08,h*.08))
    else ctx.rect(-w/2,-h/2,w,h)
    ctx.closePath()
  }
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
  if (!image) return <>
    <Rect x={-element.width/2} y={-element.height/2} width={element.width} height={element.height} fill="#eef2f7" stroke="#94a3b8" strokeWidth={2} dash={[9,7]} cornerRadius={element.mask==='round'?24:0}/>
    <Text x={-element.width/2} y={-20} width={element.width} text="+ 사진 넣기" align="center" fontSize={18} fontStyle="bold" fill="#64748b" listening={false}/>
  </>
  const cover=Math.max(element.width/image.width, element.height/image.height)
  const drawWidth=image.width*cover*element.zoom
  const drawHeight=image.height*cover*element.zoom
  const baseX=-drawWidth/2+element.offsetX
  const baseY=-drawHeight/2+element.offsetY
  return <Group clipFunc={clip}>
    <KonvaImage
      ref={imageRef}
      image={image}
      x={baseX}
      y={baseY}
      width={drawWidth}
      height={drawHeight}
      scaleX={element.flipX?-1:1}
      scaleY={element.flipY?-1:1}
      offsetX={element.flipX?drawWidth:0}
      offsetY={element.flipY?drawHeight:0}
      draggable={selected}
      onDragStart={(event)=>{event.cancelBubble=true}}
      onDragEnd={(event)=>{event.cancelBubble=true;onChange({offsetX:event.target.x()-(-drawWidth/2),offsetY:event.target.y()-(-drawHeight/2)})}}
    />
  </Group>
}

function ElementNode({ element, selected, onSelect, onChange, onRequestImage }: {
  element:PosterElement
  selected:boolean
  onSelect:()=>void
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
  return <>
    <Group
      ref={nodeRef}
      x={element.x}
      y={element.y}
      rotation={element.rotation}
      opacity={element.opacity}
      draggable={!element.locked && !(selected && element.kind==='image' && Boolean(element.src))}
      onClick={(event)=>{event.cancelBubble=true;onSelect();if(element.kind==='image'&&!element.src)onRequestImage()}}
      onTap={(event)=>{event.cancelBubble=true;onSelect();if(element.kind==='image'&&!element.src)onRequestImage()}}
      onDragStart={onSelect}
      onDragEnd={(event)=>onChange({x:event.currentTarget.x(),y:event.currentTarget.y()})}
      onTransformEnd={finishTransform}
    >
      {element.kind==='image'&&<ImageContent element={element} selected={selected} onChange={onChange}/>} 
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

export const PosterCanvas=forwardRef<PosterCanvasHandle,Props>(function PosterCanvas({document,scale,selectedId,exporting,showSafeArea,onSelect,onChange,onRequestImage},ref){
  const stageRef=useRef<Konva.Stage>(null)
  useImperativeHandle(ref,()=>({toDataURL:(mimeType,pixelRatio,quality=.95)=>stageRef.current?.toDataURL({mimeType,pixelRatio,quality})||''}),[])
  const selected=document.elements.find((element)=>element.id===selectedId)
  return <div className="poster-stage-wrap" style={{width:document.size.width*scale,height:document.size.height*scale}}>
    <Stage
      ref={stageRef}
      width={document.size.width}
      height={document.size.height}
      style={{transform:`scale(${scale})`,transformOrigin:'top left'}}
      onMouseDown={(event)=>{if(event.target===event.target.getStage())onSelect(null)}}
      onTouchStart={(event)=>{if(event.target===event.target.getStage())onSelect(null)}}
      onWheel={(event)=>{
        if(!selected||selected.kind!=='image'||!selected.src)return
        event.evt.preventDefault()
        const zoom=Math.min(6,Math.max(.2,selected.zoom*(event.evt.deltaY>0?.94:1.06)))
        onChange(selected.id,{zoom})
      }}
    >
      <Layer>
        <Background document={document}/>
        {document.elements.map((element)=><ElementNode key={element.id} element={element} selected={!exporting&&selectedId===element.id} onSelect={()=>onSelect(element.id)} onChange={(patch)=>onChange(element.id,patch)} onRequestImage={()=>onRequestImage(element.id)}/>) }
        {showSafeArea&&!exporting&&<Rect x={28} y={28} width={document.size.width-56} height={document.size.height-56} stroke="#ef4444" strokeWidth={1.5} dash={[10,7]} opacity={.65} listening={false}/>} 
      </Layer>
    </Stage>
  </div>
})
