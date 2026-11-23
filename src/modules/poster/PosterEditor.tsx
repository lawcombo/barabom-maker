import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import {
  ArrowDown, ArrowLeft, ArrowUp, BringToFront, Circle, Copy, Download, Eye, EyeOff,
  FileDown, FolderOpen, ImagePlus, Images, Layers3, LayoutTemplate, Lock, Maximize2, Minus, Palette,
  Plus, QrCode, Redo2, RotateCcw, Save, SendToBack, Shapes, Sparkles, Square, Sticker, Trash2, Type,
  Undo2, Unlock, Upload, Wallpaper, ZoomIn, ZoomOut,
} from 'lucide-react'
import { PosterCanvas } from './PosterCanvas'
import { createBlankPoster, documentFromTemplate, posterCategories, posterSizes, posterTemplates } from './templates'
import { clonePosterElement, downloadDataUrl, posterEmojis, posterFonts, readPosterImage } from './utils'
import {
  deletePosterProject, duplicatePosterProject, exportPosterProject, importPosterProject, listPosterProjects,
  loadLastPosterProject, savePosterProject,
} from './storage'
import type { PosterCanvasHandle, PosterDocument, PosterElement, PosterImageElement, PosterPreset, PosterShapeElement, PosterTab, PosterTextElement } from './types'
import './poster.css'

const tabs: Array<{id:PosterTab;label:string;icon:typeof LayoutTemplate}> = [
  {id:'templates',label:'템플릿',icon:LayoutTemplate},{id:'photos',label:'사진',icon:Images},{id:'text',label:'텍스트',icon:Type},
  {id:'stickers',label:'스티커',icon:Sticker},{id:'shapes',label:'도형',icon:Shapes},{id:'background',label:'배경',icon:Palette},
  {id:'layers',label:'레이어',icon:Layers3},{id:'projects',label:'프로젝트',icon:FolderOpen},
]

const nowBase=(kind:PosterElement['kind'],name:string,x:number,y:number,width:number,height:number)=>({id:crypto.randomUUID(),kind,name,x,y,width,height,rotation:0,opacity:1,visible:true,locked:false})

function newText(document:PosterDocument,style:'title'|'subtitle'|'body'|'sale'='title'):PosterTextElement {
  const presets={
    title:{text:'제목을 입력하세요',size:56,font:'Black Han Sans',fill:'#111827',width:520,height:110},
    subtitle:{text:'포스터의 부제목을 입력하세요',size:30,font:'Noto Sans KR',fill:'#334155',width:500,height:80},
    body:{text:'상세한 내용을 입력하세요.\n날짜와 장소, 안내 문구를 자유롭게 수정할 수 있습니다.',size:20,font:'Noto Sans KR',fill:'#475569',width:480,height:130},
    sale:{text:'50% OFF',size:72,font:'Black Han Sans',fill:'#ffffff',width:430,height:120},
  }[style]
  return {...nowBase('text',style==='title'?'제목':style==='subtitle'?'부제목':style==='body'?'본문':'강조 문구',document.size.width/2,document.size.height/2,presets.width,presets.height),text:presets.text,fontFamily:presets.font,fontSize:presets.size,fontStyle:'bold',fill:presets.fill,align:'center',letterSpacing:0,lineHeight:1.2,stroke:'transparent',strokeWidth:0,shadowColor:'#000000',shadowBlur:0,background:style==='sale'?'#ef4444':'transparent',underline:false} as PosterTextElement
}

export function PosterEditor({initialDocument,onExit}:{initialDocument?:PosterDocument;onExit:()=>void}) {
  const [document,setDocument]=useState<PosterDocument>(()=>initialDocument??createBlankPoster())
  const [selectedId,setSelectedId]=useState<string|null>(null)
  const [tab,setTab]=useState<PosterTab>('templates')
  const [templateCategory,setTemplateCategory]=useState('전체')
  const [history,setHistory]=useState<PosterDocument[]>([])
  const [future,setFuture]=useState<PosterDocument[]>([])
  const [projects,setProjects]=useState<PosterDocument[]>([])
  const [status,setStatus]=useState('자동 저장 켜짐')
  const [viewZoom,setViewZoom]=useState(1)
  const [fitScale,setFitScale]=useState(.55)
  const [showSafeArea,setShowSafeArea]=useState(false)
  const [exporting,setExporting]=useState(false)
  const [downloadOpen,setDownloadOpen]=useState(false)
  const [downloadFormat,setDownloadFormat]=useState<'png'|'jpeg'|'pdf'>('png')
  const [previewUrl,setPreviewUrl]=useState('')
  const [qrValue,setQrValue]=useState('https://example.com')
  const [mobilePanel,setMobilePanel]=useState(true)
  const canvasRef=useRef<PosterCanvasHandle>(null)
  const workspaceRef=useRef<HTMLElement>(null)
  const imageInputRef=useRef<HTMLInputElement>(null)
  const backgroundInputRef=useRef<HTMLInputElement>(null)
  const stickerInputRef=useRef<HTMLInputElement>(null)
  const projectInputRef=useRef<HTMLInputElement>(null)
  const templateInputRef=useRef<HTMLInputElement>(null)
  const uploadTarget=useRef<string|null>(null)

  const selected=useMemo(()=>document.elements.find((item)=>item.id===selectedId)??null,[document.elements,selectedId])
  const visibleTemplates=useMemo(()=>templateCategory==='전체'?posterTemplates:posterTemplates.filter((template)=>template.category===templateCategory),[templateCategory])
  const refreshProjects=useCallback(()=>listPosterProjects().then(setProjects),[])
  const commit=useCallback((updater:(current:PosterDocument)=>PosterDocument,record=true)=>{
    setDocument((current)=>{const next={...updater(current),updatedAt:Date.now()};if(record){setHistory((items)=>[...items.slice(-59),current]);setFuture([])}return next})
  },[])
  const undo=useCallback(()=>{setHistory((items)=>{const previous=items.at(-1);if(!previous)return items;setDocument((current)=>{setFuture((next)=>[current,...next].slice(0,60));return previous});return items.slice(0,-1)})},[])
  const redo=useCallback(()=>{setFuture((items)=>{const next=items[0];if(!next)return items;setDocument((current)=>{setHistory((past)=>[...past,current].slice(-60));return next});return items.slice(1)})},[])
  const updateElement=useCallback((id:string,patch:Partial<PosterElement>)=>commit((current)=>({...current,elements:current.elements.map((item)=>item.id===id?({...item,...patch} as PosterElement):item)})),[commit])
  const removeElement=useCallback((id:string)=>{commit((current)=>({...current,elements:current.elements.filter((item)=>item.id!==id)}));setSelectedId(null)},[commit])
  const addElement=useCallback((element:PosterElement)=>{commit((current)=>({...current,elements:[...current.elements,element]}));setSelectedId(element.id)},[commit])

  useEffect(()=>{if(initialDocument)return;void loadLastPosterProject().then((saved)=>{if(saved)setDocument(saved)})},[initialDocument])
  useEffect(()=>{const timer=window.setTimeout(()=>savePosterProject(document).then(()=>{setStatus('자동 저장됨');refreshProjects()}),900);return()=>window.clearTimeout(timer)},[document,refreshProjects])
  useEffect(()=>{refreshProjects()},[refreshProjects])
  useEffect(()=>{
    const workspace=workspaceRef.current;if(!workspace)return
    const update=()=>setFitScale(Math.max(.16,Math.min(1,(workspace.clientWidth-110)/document.size.width,(workspace.clientHeight-110)/document.size.height)))
    const observer=new ResizeObserver(update);observer.observe(workspace);update();return()=>observer.disconnect()
  },[document.size.width,document.size.height])
  useEffect(()=>{
    const handler=(event:KeyboardEvent)=>{
      const target=event.target as HTMLElement
      if(['INPUT','TEXTAREA','SELECT'].includes(target.tagName))return
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();event.shiftKey?redo():undo();return}
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='y'){event.preventDefault();redo();return}
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'){event.preventDefault();void savePosterProject(document).then(()=>setStatus('저장 완료'));return}
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='d'&&selected){event.preventDefault();addElement(clonePosterElement(selected));return}
      if((event.key==='Delete'||event.key==='Backspace')&&selected&&!selected.locked){event.preventDefault();removeElement(selected.id);return}
      if(selected&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)&&!selected.locked){event.preventDefault();const step=event.shiftKey?10:1;updateElement(selected.id,{x:selected.x+(event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0),y:selected.y+(event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0)})}
    }
    window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler)
  },[document,selected,undo,redo,addElement,removeElement,updateElement])

  const requestImage=(id:string|null=null)=>{uploadTarget.current=id;imageInputRef.current?.click()}
  const addImageFile=async(file:File,targetId:string|null=uploadTarget.current)=>{
    const src=await readPosterImage(file)
    if(targetId){updateElement(targetId,{src,zoom:1,offsetX:0,offsetY:0} as Partial<PosterElement>);setSelectedId(targetId)}
    else addElement({...nowBase('image',file.name,document.size.width/2,document.size.height/2,Math.min(420,document.size.width*.58),Math.min(320,document.size.height*.4)),src,isSlot:false,mask:'round',zoom:1,offsetX:0,offsetY:0,flipX:false,flipY:false,brightness:0,contrast:0,saturation:0,filter:'none'} as PosterImageElement)
    uploadTarget.current=null
  }
  const addSlot=()=>addElement({...nowBase('image','이미지 영역',document.size.width/2,document.size.height/2,360,260),src:'',isSlot:true,mask:'round',zoom:1,offsetX:0,offsetY:0,flipX:false,flipY:false,brightness:0,contrast:0,saturation:0,filter:'none'} as PosterImageElement)
  const addSticker=(value:string,type:'emoji'|'image'='emoji')=>addElement({...nowBase('sticker',type==='emoji'?'이모티콘':'사용자 스티커',document.size.width/2,document.size.height/2,100,100),stickerType:type,value} as PosterElement)
  const addShape=(shape:PosterShapeElement['shape'])=>addElement({...nowBase('shape',`도형 · ${shape}`,document.size.width/2,document.size.height/2,shape==='line'||shape==='arrow'?260:220,shape==='line'||shape==='arrow'?30:150),shape,fill:'#7c3aed',stroke:shape==='line'||shape==='arrow'?'#7c3aed':'transparent',strokeWidth:shape==='line'||shape==='arrow'?5:0,radius:22} as PosterShapeElement)
  const addQr=async()=>{try{const src=await QRCode.toDataURL(qrValue,{width:900,margin:2,color:{dark:'#111827',light:'#ffffff'}});addElement({...nowBase('qr','QR 코드',document.size.width/2,document.size.height/2,170,170),value:qrValue,src,foreground:'#111827',background:'#ffffff'} as PosterElement)}catch{setStatus('올바른 URL을 입력해 주세요')}}
  const reorder=(id:string,direction:'up'|'down'|'front'|'back')=>commit((current)=>{const elements=[...current.elements];const index=elements.findIndex((item)=>item.id===id);if(index<0)return current;const [item]=elements.splice(index,1);const target=direction==='front'?elements.length:direction==='back'?0:direction==='up'?Math.min(elements.length,index+1):Math.max(0,index-1);elements.splice(target,0,item);return{...current,elements}})
  const applySize=(preset:PosterPreset)=>{
    const next={...posterSizes[preset]};const sx=next.width/document.size.width,sy=next.height/document.size.height
    commit((current)=>({...current,size:next,elements:current.elements.map((item)=>({...item,x:item.x*sx,y:item.y*sy,width:item.width*sx,height:item.height*sy}))}))
  }
  const changeDpi=(dpi:number)=>commit((current)=>{
    const physical=current.size.preset.startsWith('a4')||current.size.preset.startsWith('a3')
    if(!physical)return {...current,size:{...current.size,dpi}}
    const isA3=current.size.preset.startsWith('a3')
    const landscape=current.size.width>current.size.height
    const widthMm=isA3?(landscape?420:297):(landscape?297:210)
    const heightMm=isA3?(landscape?297:420):(landscape?210:297)
    return {...current,size:{...current.size,dpi,outputWidth:Math.round(widthMm/25.4*dpi),outputHeight:Math.round(heightMm/25.4*dpi)}}
  })
  const applyTemplate=(templateId:string)=>{const template=posterTemplates.find((item)=>item.id===templateId);if(!template)return;const next=documentFromTemplate(template);next.id=document.id;next.name=document.name;commit(()=>next);setSelectedId(null)}
  const uploadTemplate=async(file:File)=>{
    const src=await readPosterImage(file)
    const next=createBlankPoster('a4-portrait')
    next.id=document.id
    next.name=file.name.replace(/\.[^.]+$/,'')
    next.background={type:'image',color:'#ffffff',secondary:'#ffffff',imageSrc:src,opacity:1}
    commit(()=>next);setSelectedId(null);setStatus('업로드한 템플릿을 적용했어요')
  }
  const newProject=()=>{if(window.confirm('현재 작업은 자동 저장됩니다. 새 포스터를 시작할까요?')){setDocument(createBlankPoster());setSelectedId(null);setHistory([]);setFuture([])}}
  const capture=async(format:'png'|'jpeg'='png',pixelRatio?:number)=>{
    await window.document.fonts?.ready;setExporting(true);await new Promise((resolve)=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))
    const ratio=pixelRatio??document.size.outputWidth/document.size.width
    const url=canvasRef.current?.toDataURL(format==='jpeg'?'image/jpeg':'image/png',ratio,.95)||'';setExporting(false);return url
  }
  const exportImage=async(format=downloadFormat)=>{
    const raster=format==='jpeg'?'jpeg':'png';const url=await capture(raster)
    if(!url)return
    if(format==='pdf'){
      const physical=document.size.unit==='mm'
      const width=physical?(document.size.preset.startsWith('a3')?(document.size.width>document.size.height?420:297):(document.size.width>document.size.height?297:210)):document.size.outputWidth
      const height=physical?(document.size.preset.startsWith('a3')?(document.size.width>document.size.height?297:420):(document.size.width>document.size.height?210:297)):document.size.outputHeight
      const pdf=new jsPDF({orientation:width>height?'landscape':'portrait',unit:physical?'mm':'px',format:[width,height],hotfixes:['px_scaling']});pdf.addImage(url,'PNG',0,0,width,height);pdf.save(`${document.name}.pdf`)
    } else downloadDataUrl(url,`${document.name}.${format==='jpeg'?'jpg':'png'}`)
    setDownloadOpen(false);setStatus(`${format.toUpperCase()} 저장 완료`)
  }
  const showPreview=async()=>setPreviewUrl(await capture('png',Math.min(1,900/document.size.width)))
  const printPoster=async()=>{const url=await capture('png');const popup=window.open('','_blank','width=900,height=900');if(!popup){setStatus('인쇄 팝업을 허용해 주세요');return}popup.document.write(`<!doctype html><html><head><title>${document.name}</title><style>@page{margin:0}body{margin:0;display:grid;place-items:center}img{max-width:100%;max-height:100vh}</style></head><body><img src="${url}" onload="setTimeout(()=>print(),300)"></body></html>`);popup.document.close()}

  const renderTab=()=>{
    if(tab==='templates')return <><PanelTitle title="템플릿" text="카테고리를 고르고 디자인을 바로 적용하세요."/><button className="poster-button primary poster-template-upload" onClick={()=>templateInputRef.current?.click()}><Upload size={15}/> 내 템플릿 업로드</button><label className="poster-label">카테고리</label><select className="poster-select" value={templateCategory} onChange={(event)=>setTemplateCategory(event.target.value)}>{posterCategories.map((category)=><option key={category} value={category}>{category}{category==='전체'?` · ${posterTemplates.length}종`:` · ${posterTemplates.filter((template)=>template.category===category).length}종`}</option>)}</select><div className="poster-template-categories">{posterCategories.map((category)=><button key={category} className={templateCategory===category?'active':''} onClick={()=>setTemplateCategory(category)}>{category}</button>)}</div><div className="poster-template-result"><strong>{templateCategory}</strong><span>{visibleTemplates.length}개 디자인</span></div><div className="poster-tab-grid">{visibleTemplates.map((template)=>{const photo=template.elements.find((item)=>item.kind==='image');return <button key={template.id} className="poster-mini-template" style={{background:template.background.color}} onClick={()=>applyTemplate(template.id)}>{photo&&photo.kind==='image'&&photo.src&&<img src={photo.src} alt="" loading="lazy"/>}<span className="poster-mini-shade"/><strong>{template.name}</strong><em>{template.size.width>template.size.height?'가로형':'세로형'}</em></button>})}</div></>
    if(tab==='photos')return <><PanelTitle title="사진과 로고" text="사진을 추가하거나 빈 이미지 영역을 만드세요."/><div className="poster-grid-2"><button className="poster-button" onClick={()=>requestImage()}><ImagePlus size={16}/> 사진 추가</button><button className="poster-button" onClick={addSlot}><Square size={16}/> 영역 추가</button></div><button className="poster-button poster-section" onClick={()=>backgroundInputRef.current?.click()}><Wallpaper size={16}/> 내 포스터를 배경으로</button><label className="poster-label">QR코드</label><input className="poster-input" value={qrValue} onChange={(event)=>setQrValue(event.target.value)} placeholder="https://..."/><button className="poster-button poster-section" onClick={()=>void addQr()}><QrCode size={16}/> 실제 QR코드 삽입</button></>
    if(tab==='text')return <><PanelTitle title="텍스트" text="용도에 맞는 텍스트 상자를 추가하세요."/><div className="poster-grid-2"><button className="poster-button" onClick={()=>addElement(newText(document,'title'))}>제목</button><button className="poster-button" onClick={()=>addElement(newText(document,'subtitle'))}>부제목</button><button className="poster-button" onClick={()=>addElement(newText(document,'body'))}>본문</button><button className="poster-button" onClick={()=>addElement(newText(document,'sale'))}>50% OFF</button></div><label className="poster-label">스타일 문구</label>{['GRAND OPEN','SPECIAL EVENT','NEW MENU','HAPPY BIRTHDAY','모집 안내','특별 할인'].map((value)=><button key={value} className="poster-button poster-section" onClick={()=>{const element=newText(document,'title');element.text=value;addElement(element)}}>{value}</button>)}</>
    if(tab==='stickers')return <><PanelTitle title="스티커" text="이모티콘 또는 투명 PNG를 추가하세요."/><div className="poster-emoji-grid">{posterEmojis.map((emoji)=><button key={emoji} onClick={()=>addSticker(emoji)}>{emoji}</button>)}</div><button className="poster-button poster-section" onClick={()=>stickerInputRef.current?.click()}><Upload size={16}/> 내 스티커 업로드</button></>
    if(tab==='shapes')return <><PanelTitle title="도형" text="정보를 강조하거나 영역을 가릴 때 활용하세요."/><div className="poster-shape-grid">{(['rect','circle','triangle','line','arrow','bubble','banner'] as PosterShapeElement['shape'][]).map((shape)=><button key={shape} onClick={()=>addShape(shape)}>{shape==='rect'?'사각형':shape==='circle'?'원형':shape==='triangle'?'삼각형':shape==='line'?'직선':shape==='arrow'?'화살표':shape==='bubble'?'말풍선':'배너'}</button>)}</div></>
    if(tab==='background')return <><PanelTitle title="배경" text="단색, 그라데이션 또는 이미지를 사용하세요."/><div className="poster-grid-2"><button className="poster-button" onClick={()=>commit((d)=>({...d,background:{...d.background,type:'color'}}))}>단색</button><button className="poster-button" onClick={()=>commit((d)=>({...d,background:{...d.background,type:'gradient'}}))}>그라데이션</button></div><label className="poster-label">기본 색상</label><input className="poster-color" type="color" value={document.background.color} onChange={(event)=>commit((d)=>({...d,background:{...d.background,color:event.target.value}}))}/><label className="poster-label">두 번째 색상</label><input className="poster-color" type="color" value={document.background.secondary} onChange={(event)=>commit((d)=>({...d,background:{...d.background,secondary:event.target.value}}))}/><button className="poster-button poster-section" onClick={()=>backgroundInputRef.current?.click()}><Upload size={16}/> 배경 이미지 업로드</button></>
    if(tab==='layers')return <><PanelTitle title="레이어" text="위에 있는 항목이 캔버스에서도 앞에 표시됩니다."/>{[...document.elements].reverse().map((element)=><div key={element.id} className={`poster-layer ${selectedId===element.id?'active':''}`} onClick={()=>setSelectedId(element.id)}><button onClick={(event)=>{event.stopPropagation();updateElement(element.id,{visible:!element.visible})}}>{element.visible?<Eye size={14}/>:<EyeOff size={14}/>}</button><input value={element.name} onClick={(event)=>event.stopPropagation()} onChange={(event)=>updateElement(element.id,{name:event.target.value})}/><div className="poster-layer-actions"><button onClick={(event)=>{event.stopPropagation();updateElement(element.id,{locked:!element.locked})}}>{element.locked?<Lock size={13}/>:<Unlock size={13}/>}</button><button onClick={(event)=>{event.stopPropagation();reorder(element.id,'up')}}><ArrowUp size={13}/></button><button onClick={(event)=>{event.stopPropagation();reorder(element.id,'down')}}><ArrowDown size={13}/></button></div></div>)}</>
    return <><PanelTitle title="프로젝트" text="포스터 프로젝트는 인생네컷과 별도로 저장됩니다."/><button className="poster-button primary" onClick={()=>savePosterProject(document).then(()=>{setStatus('저장 완료');refreshProjects()})}><Save size={15}/> 현재 프로젝트 저장</button><div className="poster-grid-2 poster-section"><button className="poster-button" onClick={()=>exportPosterProject(document)}><FileDown size={15}/> 내보내기</button><button className="poster-button" onClick={()=>projectInputRef.current?.click()}><Upload size={15}/> 가져오기</button></div><div className="poster-section">{projects.map((project)=><div key={project.id} className="poster-project-card"><strong>{project.name}</strong><span>{new Date(project.updatedAt).toLocaleString('ko-KR')}</span><div className="poster-project-actions"><button onClick={()=>{setDocument(project);setSelectedId(null)}}>열기</button><button onClick={()=>duplicatePosterProject(project).then(refreshProjects)}>복제</button><button onClick={()=>deletePosterProject(project.id).then(refreshProjects)}>삭제</button></div></div>)}</div></>
  }

  const renderInspector=()=>{
    if(!selected)return <><PanelTitle title="포스터 설정" text="요소를 선택하면 상세 설정이 표시됩니다."/><label className="poster-label">규격</label><select className="poster-select" value={document.size.preset} onChange={(event)=>applySize(event.target.value as PosterPreset)}><option value="a4-portrait">A4 세로</option><option value="a4-landscape">A4 가로</option><option value="a3-portrait">A3 세로</option><option value="a3-landscape">A3 가로</option><option value="square">1080×1080 SNS</option><option value="feed">1080×1350 피드</option><option value="story">1080×1920 스토리</option><option value="signage">1920×1080 사이니지</option></select><label className="poster-label">출력 DPI</label><select className="poster-select" value={document.size.dpi} onChange={(event)=>changeDpi(Number(event.target.value))}><option value="150">일반 150DPI</option><option value="240">고화질 240DPI</option><option value="300">인쇄용 300DPI</option></select><label className="poster-label"><input type="checkbox" checked={showSafeArea} onChange={(event)=>setShowSafeArea(event.target.checked)}/> 편집 안전 영역 표시</label><div className="poster-section" style={{padding:'12px',background:'#f1f5f9',borderRadius:10,fontSize:12}}>{document.size.outputWidth} × {document.size.outputHeight}px</div></>
    const common=<><label className="poster-label">레이어 이름</label><input className="poster-input" value={selected.name} onChange={(event)=>updateElement(selected.id,{name:event.target.value})}/><div className="poster-grid-2"><Range label="X" value={selected.x} min={0} max={document.size.width} onChange={(x)=>updateElement(selected.id,{x})}/><Range label="Y" value={selected.y} min={0} max={document.size.height} onChange={(y)=>updateElement(selected.id,{y})}/></div><Range label="회전" value={selected.rotation} min={-180} max={180} suffix="°" onChange={(rotation)=>updateElement(selected.id,{rotation})}/><Range label="투명도" value={selected.opacity} min={.1} max={1} step={.01} onChange={(opacity)=>updateElement(selected.id,{opacity})}/></>
    let specific=null
    if(selected.kind==='image')specific=<><button className="poster-button" onClick={()=>requestImage(selected.id)}><ImagePlus size={15}/> 사진 교체</button><Range label="사진 확대" value={selected.zoom} min={.2} max={6} step={.01} suffix="×" onChange={(zoom)=>updateElement(selected.id,{zoom})}/><Range label="밝기" value={selected.brightness} min={-100} max={100} onChange={(brightness)=>updateElement(selected.id,{brightness})}/><Range label="대비" value={selected.contrast} min={-100} max={100} onChange={(contrast)=>updateElement(selected.id,{contrast})}/><Range label="채도" value={selected.saturation} min={-100} max={100} onChange={(saturation)=>updateElement(selected.id,{saturation})}/><label className="poster-label">마스크</label><select className="poster-select" value={selected.mask} onChange={(event)=>updateElement(selected.id,{mask:event.target.value as PosterImageElement['mask']})}><option value="rect">사각형</option><option value="round">둥근 사각형</option><option value="circle">원형</option><option value="oval">타원형</option></select><div className="poster-grid-2 poster-section"><button className="poster-button" onClick={()=>updateElement(selected.id,{flipX:!selected.flipX})}>좌우 반전</button><button className="poster-button" onClick={()=>updateElement(selected.id,{flipY:!selected.flipY})}>상하 반전</button></div></>
    if(selected.kind==='text')specific=<><label className="poster-label">내용</label><textarea className="poster-textarea" value={selected.text} onChange={(event)=>updateElement(selected.id,{text:event.target.value})}/><label className="poster-label">글꼴</label><select className="poster-select" value={selected.fontFamily} onChange={(event)=>updateElement(selected.id,{fontFamily:event.target.value})}>{posterFonts.map(([family,label])=><option key={family} value={family}>{label}</option>)}</select><Range label="글자 크기" value={selected.fontSize} min={8} max={180} suffix="px" onChange={(fontSize)=>updateElement(selected.id,{fontSize})}/><label className="poster-label">글자색</label><input className="poster-color" type="color" value={selected.fill} onChange={(event)=>updateElement(selected.id,{fill:event.target.value})}/><div className="poster-grid-2 poster-section"><button className="poster-button" onClick={()=>updateElement(selected.id,{fontStyle:selected.fontStyle.includes('bold')?'normal':'bold'})}>굵게</button><button className="poster-button" onClick={()=>updateElement(selected.id,{underline:!selected.underline})}>밑줄</button></div><label className="poster-label">정렬</label><div className="poster-grid-2"><button className="poster-button" onClick={()=>updateElement(selected.id,{align:'left'})}>왼쪽</button><button className="poster-button" onClick={()=>updateElement(selected.id,{align:'center'})}>가운데</button></div></>
    if(selected.kind==='shape')specific=<><label className="poster-label">채우기</label><input className="poster-color" type="color" value={selected.fill} onChange={(event)=>updateElement(selected.id,{fill:event.target.value})}/><label className="poster-label">테두리</label><input className="poster-color" type="color" value={selected.stroke==='transparent'?'#111827':selected.stroke} onChange={(event)=>updateElement(selected.id,{stroke:event.target.value})}/><Range label="테두리 두께" value={selected.strokeWidth} min={0} max={30} onChange={(strokeWidth)=>updateElement(selected.id,{strokeWidth})}/></>
    return <><PanelTitle title={`${selected.name} 편집`} text="캔버스에서 드래그하거나 아래 값을 조정하세요."/>{specific}{common}<div className="poster-grid-2 poster-section"><button className="poster-button" onClick={()=>addElement(clonePosterElement(selected))}><Copy size={14}/> 복제</button><button className="poster-button danger" onClick={()=>removeElement(selected.id)}><Trash2 size={14}/> 삭제</button></div><div className="poster-grid-2 poster-section"><button className="poster-button" onClick={()=>reorder(selected.id,'front')}><BringToFront size={14}/> 맨 앞으로</button><button className="poster-button" onClick={()=>reorder(selected.id,'back')}><SendToBack size={14}/> 맨 뒤로</button></div></>
  }

  const actualScale=fitScale*viewZoom
  return <div className="poster-shell">
    <input ref={imageInputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event)=>{const file=event.target.files?.[0];if(file)void addImageFile(file);event.target.value=''}}/>
    <input ref={backgroundInputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={async(event)=>{const file=event.target.files?.[0];if(file){const src=await readPosterImage(file);commit((d)=>({...d,background:{...d.background,type:'image',imageSrc:src}}))}event.target.value=''}}/>
    <input ref={stickerInputRef} hidden type="file" accept="image/png,image/webp" onChange={async(event)=>{const file=event.target.files?.[0];if(file)addSticker(await readPosterImage(file),'image');event.target.value=''}}/>
    <input ref={projectInputRef} hidden type="file" accept=".json,.barabom-poster.json" onChange={async(event)=>{const file=event.target.files?.[0];if(file){try{setDocument(await importPosterProject(file));setStatus('프로젝트를 가져왔어요')}catch{setStatus('올바른 포스터 파일이 아니에요')}}event.target.value=''}}/>
    <input ref={templateInputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event)=>{const file=event.target.files?.[0];if(file)void uploadTemplate(file);event.target.value=''}}/>
    <header className="poster-header">
      <button className="poster-header-brand" onClick={onExit}><img src={`${import.meta.env.BASE_URL}barabom-mark.svg`} alt=""/><div><strong>너를, 바라봄</strong><span>POSTER STUDIO</span></div></button>
      <div className="poster-header-name"><input aria-label="프로젝트 이름" value={document.name} onChange={(event)=>commit((d)=>({...d,name:event.target.value}),false)}/><span style={{fontSize:11,color:'#94a3b8'}}>{status}</span></div>
      <div className="poster-header-actions"><button className="poster-icon-button" title="메인" onClick={onExit}><ArrowLeft size={17}/></button><button className="poster-icon-button" title="새 프로젝트" onClick={newProject}><Plus size={17}/></button><button className="poster-icon-button" title="저장" onClick={()=>savePosterProject(document).then(()=>setStatus('저장 완료'))}><Save size={17}/></button><button className="poster-icon-button" title="실행 취소" disabled={!history.length} onClick={undo}><Undo2 size={17}/></button><button className="poster-icon-button" title="다시 실행" disabled={!future.length} onClick={redo}><Redo2 size={17}/></button><button className="poster-icon-button" title="미리보기" onClick={()=>void showPreview()}><Eye size={17}/></button><button className="poster-icon-button primary" onClick={()=>setDownloadOpen(true)}><Download size={16}/><span>다운로드</span></button></div>
    </header>
    <div className="poster-editor-body">
      <nav className="poster-tools">{tabs.map((item)=><button key={item.id} className={tab===item.id?'active':''} onClick={()=>{setTab(item.id);setMobilePanel(true)}}><item.icon size={19}/><span>{item.label}</span></button>)}</nav>
      {mobilePanel&&<aside className="poster-panel"><button className="poster-button" style={{display:window.innerWidth<821?'flex':'none',marginBottom:12}} onClick={()=>setMobilePanel(false)}>패널 닫기</button>{renderTab()}</aside>}
      <main ref={workspaceRef} className="poster-workspace" onDragOver={(event)=>{event.preventDefault();event.dataTransfer.dropEffect='copy'}} onDrop={(event)=>{event.preventDefault();const file=[...event.dataTransfer.files].find((item)=>item.type.startsWith('image/'));if(file)void addImageFile(file,selected?.kind==='image'?selected.id:null)}}>
        <PosterCanvas ref={canvasRef} document={document} scale={actualScale} selectedId={selectedId} exporting={exporting} showSafeArea={showSafeArea} onSelect={setSelectedId} onChange={updateElement} onRequestImage={requestImage}/>
        <div className="poster-zoom"><button className="poster-icon-button" onClick={()=>setViewZoom((v)=>Math.max(.4,v-.1))}><ZoomOut size={16}/></button><span>{Math.round(viewZoom*100)}%</span><button className="poster-icon-button" onClick={()=>setViewZoom((v)=>Math.min(2.5,v+.1))}><ZoomIn size={16}/></button><button className="poster-icon-button" onClick={()=>setViewZoom(1)}><Maximize2 size={15}/></button></div>
      </main>
      <aside className="poster-inspector">{renderInspector()}</aside>
    </div>
    <footer className="poster-footer"><span>{document.size.preset.toUpperCase()} · {document.elements.length}개 레이어 · {document.size.dpi}DPI</span><span>{document.size.outputWidth} × {document.size.outputHeight}px</span></footer>
    {downloadOpen&&<div className="poster-modal-backdrop" onMouseDown={()=>setDownloadOpen(false)}><div className="poster-modal" onMouseDown={(event)=>event.stopPropagation()}><div className="poster-modal-head"><PanelTitle title="포스터 다운로드" text="형식과 품질을 선택한 뒤 저장하세요."/><button className="poster-icon-button" onClick={()=>setDownloadOpen(false)}><Minus/></button></div><label className="poster-label">파일 형식</label><div className="poster-format-row">{(['png','jpeg','pdf'] as const).map((format)=><button key={format} className={downloadFormat===format?'active':''} onClick={()=>setDownloadFormat(format)}>{format==='jpeg'?'JPG':format.toUpperCase()}</button>)}</div><label className="poster-label">출력 해상도</label><div style={{padding:13,background:'#f1f5f9',borderRadius:10,fontSize:13,display:'flex',justifyContent:'space-between'}}><span>{document.size.dpi}DPI</span><strong>{document.size.outputWidth} × {document.size.outputHeight}px</strong></div><button className="poster-button primary poster-section" onClick={()=>void exportImage()}><Download size={16}/> {downloadFormat==='jpeg'?'JPG':downloadFormat.toUpperCase()} 다운로드</button><button className="poster-button poster-section" onClick={()=>void printPoster()}><Sparkles size={16}/> 인쇄 미리보기</button></div></div>}
    {previewUrl&&<div className="poster-modal-backdrop" onMouseDown={()=>setPreviewUrl('')}><div className="poster-modal" style={{width:'min(900px,96vw)'}} onMouseDown={(event)=>event.stopPropagation()}><div className="poster-modal-head"><PanelTitle title="포스터 미리보기" text="편집 가이드와 선택 테두리는 출력되지 않습니다."/><button className="poster-icon-button" onClick={()=>setPreviewUrl('')}><Minus/></button></div><img className="poster-preview-image" src={previewUrl} alt="포스터 미리보기"/></div></div>}
  </div>
}

function PanelTitle({title,text}:{title:string;text?:string}){return <><h2>{title}</h2>{text&&<p className="poster-panel-intro">{text}</p>}</>}
function Range({label,value,min,max,step=1,suffix='',onChange}:{label:string;value:number;min:number;max:number;step?:number;suffix?:string;onChange:(value:number)=>void}){return <label className="poster-label">{label} <span style={{float:'right',fontWeight:400}}>{Math.round(value*100)/100}{suffix}</span><input className="poster-range" type="range" value={value} min={min} max={max} step={step} onChange={(event)=>onChange(Number(event.target.value))}/></label>}
