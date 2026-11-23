import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import {
  ArrowDown, ArrowUp, BringToFront, Circle, Copy, Download, Eye, EyeOff,
  FileDown, FolderOpen, ImagePlus, Images, Layers3, LayoutTemplate, Lock, Maximize2, Minus, Palette,
  QrCode, RotateCcw, SendToBack, Shapes, Sparkles, Square, Sticker, Trash2, Type,
  Unlock, Upload, Wallpaper, ZoomIn, ZoomOut,
} from 'lucide-react'
import { StudioHeaderActions } from '../../components/StudioHeaderActions'
import { StudioInspector, studioPhoneLayout, useCanvasTextEdit } from '../../components/StudioMobileControls'
import { PHOTO_ZOOM } from '../../lib/photoZoom'
import { PosterCanvas } from './PosterCanvas'
import { PosterTemplateCard } from './PosterTemplateCard'
import { createBlankPoster, documentFromTemplate, posterCategories, posterSizes, posterTemplates } from './templates'
import { clonePosterElement, downloadDataUrl, posterEmojis, posterFonts, readPosterImage } from './utils'
import {
  copyPosterProject, deletePosterProject, exportPosterProject, importPosterProject, listPosterProjects,
  loadLastPosterProject, savePosterProject,
} from './storage'
import type { PosterCanvasHandle, PosterDocument, PosterElement, PosterImageElement, PosterPreset, PosterShapeElement, PosterTab, PosterTemplateKind, PosterTextElement } from './types'
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
  const [templateKind,setTemplateKind]=useState<PosterTemplateKind | 'all'>('all')
  const [dropTargetId,setDropTargetId]=useState<string | null>(null)
  const [history,setHistory]=useState<PosterDocument[]>([])
  const [future,setFuture]=useState<PosterDocument[]>([])
  const [projects,setProjects]=useState<PosterDocument[]>([])
  const [status,setStatus]=useState('')
  const [savedDocument,setSavedDocument]=useState<PosterDocument|null>(null)
  const [saving,setSaving]=useState(false)
  const [viewZoom,setViewZoom]=useState(1)
  const [fitScale,setFitScale]=useState(.55)
  const [showSafeArea,setShowSafeArea]=useState(false)
  const [exporting,setExporting]=useState(false)
  const [downloadOpen,setDownloadOpen]=useState(false)
  const [downloadFormat,setDownloadFormat]=useState<'png'|'jpeg'|'pdf'>('png')
  const [previewUrl,setPreviewUrl]=useState('')
  const [qrValue,setQrValue]=useState('https://example.com')
  const [mobilePanel,setMobilePanel]=useState(false)
  const [inspectorOpen,setInspectorOpen]=useState(false)
  const canvasTextEdit = useCanvasTextEdit()
  const canvasRef=useRef<PosterCanvasHandle>(null)
  const workspaceRef=useRef<HTMLElement>(null)
  const imageInputRef=useRef<HTMLInputElement>(null)
  const backgroundInputRef=useRef<HTMLInputElement>(null)
  const stickerInputRef=useRef<HTMLInputElement>(null)
  const projectInputRef=useRef<HTMLInputElement>(null)
  const templateInputRef=useRef<HTMLInputElement>(null)
  const uploadTarget=useRef<string|null>(null)
  const startingDocument=useRef(document)

  const selected=useMemo(()=>document.elements.find((item)=>item.id===selectedId)??null,[document.elements,selectedId])
  const visibleTemplates = useMemo(() => posterTemplates
    .filter((template) => (templateCategory === '전체' || template.category === templateCategory)
      && (templateKind === 'all' || template.kind === templateKind))
    .sort((a, b) => Number(Boolean(b.recommended)) - Number(Boolean(a.recommended))),
  [templateCategory, templateKind])
  const refreshProjects=useCallback(()=>listPosterProjects().then(setProjects),[])
  const commit=useCallback((updater:(current:PosterDocument)=>PosterDocument,record=true)=>{
    setStatus('')
    setDocument((current)=>{const next={...updater(current),updatedAt:Date.now()};if(record){setHistory((items)=>[...items.slice(-59),current]);setFuture([])}return next})
  },[])
  const undo=useCallback(()=>{setHistory((items)=>{const previous=items.at(-1);if(!previous)return items;setDocument((current)=>{setFuture((next)=>[current,...next].slice(0,60));return previous});return items.slice(0,-1)})},[])
  const redo=useCallback(()=>{setFuture((items)=>{const next=items[0];if(!next)return items;setDocument((current)=>{setHistory((past)=>[...past,current].slice(-60));return next});return items.slice(1)})},[])
  const updateElement=useCallback((id:string,patch:Partial<PosterElement>)=>commit((current)=>({...current,elements:current.elements.map((item)=>item.id===id?({...item,...patch} as PosterElement):item)})),[commit])
  const removeElement=useCallback((id:string)=>{commit((current)=>({...current,elements:current.elements.filter((item)=>item.id!==id)}));setSelectedId(null)},[commit])
  const addElement=useCallback((element:PosterElement)=>{
    commit((current)=>({...current,elements:[...current.elements,element]}))
    setSelectedId(element.id)
    setMobilePanel(false)
  },[commit])

  const saveCurrentProject=useCallback(async()=>{
    if(saving)return
    setSaving(true)
    setStatus('')
    try {
      await savePosterProject(document)
      setSavedDocument((current)=>current===savedDocument?document:current)
      await refreshProjects()
    } catch {
      setStatus('저장 실패')
    } finally {
      setSaving(false)
    }
  },[document,refreshProjects,savedDocument,saving])

  useEffect(()=>{
    if(initialDocument)return
    void loadLastPosterProject().then((saved)=>{
      if(!saved)return
      setDocument((current)=>current===startingDocument.current?saved:current)
      setSavedDocument(saved)
    }).catch(()=>setStatus('이전 프로젝트를 불러오지 못했어요'))
  },[initialDocument])
  useEffect(()=>{refreshProjects()},[refreshProjects])
  useEffect(()=>{
    const workspace=workspaceRef.current;if(!workspace)return
    const update=()=>{
      const mobile = window.matchMedia(studioPhoneLayout).matches
      setFitScale(Math.max(mobile ? .08 : .16, Math.min(1, (workspace.clientWidth - (mobile ? 28 : 110)) / document.size.width,
        (workspace.clientHeight - (mobile ? 66 : 110)) / document.size.height)))
    }
    const observer=new ResizeObserver(update);observer.observe(workspace);update();return()=>observer.disconnect()
  },[document.size.width,document.size.height])
  useEffect(()=>{
    const handler=(event:KeyboardEvent)=>{
      const target=event.target as HTMLElement
      if(['INPUT','TEXTAREA','SELECT'].includes(target.tagName))return
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();event.shiftKey?redo():undo();return}
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='y'){event.preventDefault();redo();return}
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'){event.preventDefault();void saveCurrentProject();return}
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='d'&&selected){event.preventDefault();addElement(clonePosterElement(selected));return}
      if((event.key==='Delete'||event.key==='Backspace')&&selected&&!selected.locked){event.preventDefault();removeElement(selected.id);return}
      if(selected&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)&&!selected.locked){event.preventDefault();const step=event.shiftKey?10:1;updateElement(selected.id,{x:selected.x+(event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0),y:selected.y+(event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0)})}
    }
    window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler)
  },[selected,undo,redo,addElement,removeElement,updateElement,saveCurrentProject])

  const requestImage=(id:string|null=null)=>{uploadTarget.current=id;imageInputRef.current?.click()}
  const addImageFile = async (file: File, targetId: string | null = uploadTarget.current) => {
    uploadTarget.current = null
    try {
      const src = await readPosterImage(file)
      if (targetId) {
        updateElement(targetId, {src, zoom:1, offsetX:0, offsetY:0})
        setSelectedId(targetId)
      } else {
        const {width, height} = document.size
        addElement({
          ...nowBase('image',file.name,width/2,height/2,Math.min(420,width*.58),Math.min(320,height*.4)),
          kind:'image',src,isSlot:false,mask:'round',zoom:1,offsetX:0,offsetY:0,
          flipX:false,flipY:false,brightness:0,contrast:0,saturation:0,filter:'none',
        })
      }
    } catch {
      setStatus('사진을 불러오지 못했어요')
    }
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
  const applyTemplate=(templateId:string)=>{
    const template=posterTemplates.find((item)=>item.id===templateId)
    if(!template)return
    const next=documentFromTemplate(template)
    next.id=document.id
    next.name=document.name
    commit(()=>next)
    setSelectedId(null)
    setMobilePanel(false)
  }
  const uploadTemplate=async(file:File)=>{
    const src=await readPosterImage(file)
    const next=createBlankPoster('a4-portrait')
    next.id=document.id
    next.name=file.name.replace(/\.[^.]+$/,'')
    next.background={type:'image',color:'#ffffff',secondary:'#ffffff',imageSrc:src,opacity:1}
    commit(()=>next);setSelectedId(null);setStatus('업로드한 템플릿을 적용했어요')
  }
  const openProject=(next:PosterDocument,saved:boolean)=>{
    setDocument(next)
    setSavedDocument(saved?next:null)
    setSelectedId(null)
    setHistory([])
    setFuture([])
    setMobilePanel(false)
    setInspectorOpen(false)
    setStatus('')
  }
  const newProject=()=>{
    if(window.confirm('새 포스터를 시작할까요? 저장하지 않은 변경 사항은 사라집니다.'))openProject(createBlankPoster(),false)
  }
  const capture=async(format:'png'|'jpeg'='png',pixelRatio?:number)=>{
    await window.document.fonts?.ready;setExporting(true);await new Promise((resolve)=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))
    const {width, outputWidth, outputHeight} = document.size
    const ratio = pixelRatio ?? outputWidth / width
    const output = pixelRatio === undefined ? {width:outputWidth, height:outputHeight} : undefined
    try {
      return canvasRef.current?.toDataURL(format === 'jpeg' ? 'image/jpeg' : 'image/png', ratio, .95, output) || ''
    } finally {
      setExporting(false)
    }
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
    if (tab === 'templates') return <>
      <PanelTitle title="템플릿" />
      <button type="button" className="poster-button poster-template-upload" onClick={() => templateInputRef.current?.click()}>
        <Upload size={15} /> 내 템플릿 이미지 업로드
      </button>
      <div className="poster-template-kinds" role="group" aria-label="템플릿 유형">
        {([
          ['all', '전체'], ['poster', '일반 포스터'], ['frame', '액자·콜라주'],
        ] as const).map(([kind, label]) => (
          <button key={kind} type="button" aria-pressed={templateKind === kind} onClick={() => setTemplateKind(kind)}>{label}</button>
        ))}
      </div>
      <label className="poster-label" htmlFor="poster-template-category">카테고리</label>
      <select id="poster-template-category" className="poster-select" value={templateCategory} onChange={(event) => setTemplateCategory(event.target.value)}>
        {posterCategories.map((category) => <option key={category} value={category}>{category}</option>)}
      </select>
      <div className="poster-design-results">
        {visibleTemplates.length}개 디자인
        {templateKind === 'frame' && <p>사진을 원하는 칸에 끌어 놓거나 클릭해서 선택하세요.</p>}
      </div>
      <div className="poster-tab-grid">
        {visibleTemplates.map((template) => (
          <PosterTemplateCard key={template.id} template={template} active={document.templateId === template.id} onApply={() => applyTemplate(template.id)} />
        ))}
      </div>
    </>
    if(tab==='photos')return <><PanelTitle title="사진과 로고" text="사진을 추가하거나 빈 이미지 영역을 만드세요."/><div className="poster-grid-2"><button className="poster-button" onClick={()=>requestImage()}><ImagePlus size={16}/> 사진 추가</button><button className="poster-button" onClick={addSlot}><Square size={16}/> 영역 추가</button></div><button className="poster-button poster-section" onClick={()=>backgroundInputRef.current?.click()}><Wallpaper size={16}/> 내 포스터를 배경으로</button><label className="poster-label">QR코드</label><input className="poster-input" value={qrValue} onChange={(event)=>setQrValue(event.target.value)} placeholder="https://..."/><button className="poster-button poster-section" onClick={()=>void addQr()}><QrCode size={16}/> 실제 QR코드 삽입</button></>
    if(tab==='text')return <><PanelTitle title="텍스트" text="용도에 맞는 텍스트 상자를 추가하세요."/><div className="poster-grid-2"><button className="poster-button" onClick={()=>addElement(newText(document,'title'))}>제목</button><button className="poster-button" onClick={()=>addElement(newText(document,'subtitle'))}>부제목</button><button className="poster-button" onClick={()=>addElement(newText(document,'body'))}>본문</button><button className="poster-button" onClick={()=>addElement(newText(document,'sale'))}>50% OFF</button></div><label className="poster-label">스타일 문구</label>{['GRAND OPEN','SPECIAL EVENT','NEW MENU','HAPPY BIRTHDAY','모집 안내','특별 할인'].map((value)=><button key={value} className="poster-button poster-section" onClick={()=>{const element=newText(document,'title');element.text=value;addElement(element)}}>{value}</button>)}</>
    if(tab==='stickers')return <><PanelTitle title="스티커" text="이모티콘 또는 투명 PNG를 추가하세요."/><div className="poster-emoji-grid">{posterEmojis.map((emoji)=><button key={emoji} onClick={()=>addSticker(emoji)}>{emoji}</button>)}</div><button className="poster-button poster-section" onClick={()=>stickerInputRef.current?.click()}><Upload size={16}/> 내 스티커 업로드</button></>
    if(tab==='shapes')return <><PanelTitle title="도형" text="정보를 강조하거나 영역을 가릴 때 활용하세요."/><div className="poster-shape-grid">{(['rect','circle','triangle','line','arrow','bubble','banner'] as PosterShapeElement['shape'][]).map((shape)=><button key={shape} onClick={()=>addShape(shape)}>{shape==='rect'?'사각형':shape==='circle'?'원형':shape==='triangle'?'삼각형':shape==='line'?'직선':shape==='arrow'?'화살표':shape==='bubble'?'말풍선':'배너'}</button>)}</div></>
    if(tab==='background')return <><PanelTitle title="배경" text="단색, 그라데이션 또는 이미지를 사용하세요."/><div className="poster-grid-2"><button className="poster-button" onClick={()=>{commit((d)=>({...d,background:{...d.background,type:'color'}}));setMobilePanel(false)}}>단색</button><button className="poster-button" onClick={()=>{commit((d)=>({...d,background:{...d.background,type:'gradient'}}));setMobilePanel(false)}}>그라데이션</button></div><label className="poster-label">기본 색상</label><input className="poster-color" type="color" value={document.background.color} onChange={(event)=>commit((d)=>({...d,background:{...d.background,color:event.target.value}}))}/><label className="poster-label">두 번째 색상</label><input className="poster-color" type="color" value={document.background.secondary} onChange={(event)=>commit((d)=>({...d,background:{...d.background,secondary:event.target.value}}))}/><button className="poster-button poster-section" onClick={()=>backgroundInputRef.current?.click()}><Upload size={16}/> 배경 이미지 업로드</button></>
    if(tab==='layers')return <><PanelTitle title="레이어" text="위에 있는 항목이 캔버스에서도 앞에 표시됩니다."/>{[...document.elements].reverse().map((element)=><div key={element.id} className={`poster-layer ${selectedId===element.id?'active':''}`} onClick={()=>{setSelectedId(element.id);setMobilePanel(false)}}><button onClick={(event)=>{event.stopPropagation();updateElement(element.id,{visible:!element.visible})}}>{element.visible?<Eye size={14}/>:<EyeOff size={14}/>}</button><input value={element.name} onClick={(event)=>event.stopPropagation()} onChange={(event)=>updateElement(element.id,{name:event.target.value})}/><div className="poster-layer-actions"><button onClick={(event)=>{event.stopPropagation();updateElement(element.id,{locked:!element.locked})}}>{element.locked?<Lock size={13}/>:<Unlock size={13}/>}</button><button onClick={(event)=>{event.stopPropagation();reorder(element.id,'up')}}><ArrowUp size={13}/></button><button onClick={(event)=>{event.stopPropagation();reorder(element.id,'down')}}><ArrowDown size={13}/></button></div></div>)}</>
    return <><PanelTitle title="프로젝트" text="헤더의 저장 버튼을 누르면 이 브라우저에 저장돼요."/><div className="poster-grid-2 poster-section"><button className="poster-button" onClick={()=>exportPosterProject(document)}><FileDown size={15}/> 내보내기</button><button className="poster-button" onClick={()=>projectInputRef.current?.click()}><Upload size={15}/> 가져오기</button></div><div className="poster-section">{projects.map((project)=><div key={project.id} className="poster-project-card"><strong>{project.name}</strong><span>{new Date(project.updatedAt).toLocaleString('ko-KR')}</span><div className="poster-project-actions"><button onClick={()=>openProject(project,true)}>열기</button><button onClick={()=>openProject(copyPosterProject(project),false)}>복제</button><button onClick={()=>deletePosterProject(project.id).then(refreshProjects)}>삭제</button></div></div>)}</div></>
  }

  const renderInspector=()=>{
    if(!selected)return <><PanelTitle title="포스터 설정" text="요소를 선택하면 상세 설정이 표시됩니다."/><label className="poster-label">규격</label><select className="poster-select" value={document.size.preset} onChange={(event)=>applySize(event.target.value as PosterPreset)}><option value="a4-portrait">A4 세로</option><option value="a4-landscape">A4 가로</option><option value="a3-portrait">A3 세로</option><option value="a3-landscape">A3 가로</option><option value="square">1080×1080 SNS</option><option value="feed">1080×1350 피드</option><option value="story">1080×1920 스토리</option><option value="signage">1920×1080 사이니지</option></select><label className="poster-label">출력 DPI</label><select className="poster-select" value={document.size.dpi} onChange={(event)=>changeDpi(Number(event.target.value))}><option value="150">일반 150DPI</option><option value="240">고화질 240DPI</option><option value="300">인쇄용 300DPI</option></select><label className="poster-label"><input type="checkbox" checked={showSafeArea} onChange={(event)=>setShowSafeArea(event.target.checked)}/> 편집 안전 영역 표시</label><div className="poster-section" style={{padding:'12px',background:'#f1f5f9',borderRadius:10,fontSize:12}}>{document.size.outputWidth} × {document.size.outputHeight}px</div></>
    const common=<><label className="poster-label">레이어 이름</label><input className="poster-input" value={selected.name} onChange={(event)=>updateElement(selected.id,{name:event.target.value})}/><div className="poster-grid-2"><Range label="X" value={selected.x} min={0} max={document.size.width} onChange={(x)=>updateElement(selected.id,{x})}/><Range label="Y" value={selected.y} min={0} max={document.size.height} onChange={(y)=>updateElement(selected.id,{y})}/></div><Range label="회전" value={selected.rotation} min={-180} max={180} suffix="°" onChange={(rotation)=>updateElement(selected.id,{rotation})}/><Range label="투명도" value={selected.opacity} min={.1} max={1} step={.01} onChange={(opacity)=>updateElement(selected.id,{opacity})}/></>
    let specific=null
    if(selected.kind==='image')specific=<><button className="poster-button" onClick={()=>requestImage(selected.id)}><ImagePlus size={15}/> 사진 교체</button><Range label="사진 확대" value={selected.zoom} min={Math.min(selected.zoom, selected.isSlot ? PHOTO_ZOOM.coverMin : PHOTO_ZOOM.containMin)} max={PHOTO_ZOOM.max} step={.01} suffix="×" onChange={(zoom)=>updateElement(selected.id,{zoom})}/><Range label="밝기" value={selected.brightness} min={-100} max={100} onChange={(brightness)=>updateElement(selected.id,{brightness})}/><Range label="대비" value={selected.contrast} min={-100} max={100} onChange={(contrast)=>updateElement(selected.id,{contrast})}/><Range label="채도" value={selected.saturation} min={-100} max={100} onChange={(saturation)=>updateElement(selected.id,{saturation})}/><label className="poster-label">마스크</label><select className="poster-select" value={selected.mask} onChange={(event)=>updateElement(selected.id,{mask:event.target.value as PosterImageElement['mask']})}><option value="rect">사각형</option><option value="round">둥근 사각형</option><option value="circle">원형</option><option value="oval">타원형</option></select><div className="poster-grid-2 poster-section"><button className="poster-button" onClick={()=>updateElement(selected.id,{flipX:!selected.flipX})}>좌우 반전</button><button className="poster-button" onClick={()=>updateElement(selected.id,{flipY:!selected.flipY})}>상하 반전</button></div></>
    if(selected.kind==='text')specific=<div className="studio-text-properties"><label className="studio-text-content poster-label">내용<textarea className="poster-textarea" value={selected.text} onChange={(event)=>updateElement(selected.id,{text:event.target.value})}/></label><label className="poster-label" htmlFor="poster-font-family">글꼴</label><select id="poster-font-family" className="poster-select" value={selected.fontFamily} onChange={(event)=>updateElement(selected.id,{fontFamily:event.target.value})}>{posterFonts.map(([family,label])=><option key={family} value={family}>{label}</option>)}</select><Range label="글자 크기" value={selected.fontSize} min={8} max={180} suffix="px" onChange={(fontSize)=>updateElement(selected.id,{fontSize})}/><label className="poster-label" htmlFor="poster-font-fill">글자색</label><input id="poster-font-fill" className="poster-color" type="color" value={selected.fill} onChange={(event)=>updateElement(selected.id,{fill:event.target.value})}/><div className="poster-grid-2 poster-section"><button className="poster-button" onClick={()=>updateElement(selected.id,{fontStyle:selected.fontStyle.includes('bold')?'normal':'bold'})}>굵게</button><button className="poster-button" onClick={()=>updateElement(selected.id,{underline:!selected.underline})}>밑줄</button></div><label className="poster-label">정렬</label><div className="poster-grid-2"><button className="poster-button" onClick={()=>updateElement(selected.id,{align:'left'})}>왼쪽</button><button className="poster-button" onClick={()=>updateElement(selected.id,{align:'center'})}>가운데</button></div></div>
    if(selected.kind==='shape')specific=<><label className="poster-label">채우기</label><input className="poster-color" type="color" value={selected.fill} onChange={(event)=>updateElement(selected.id,{fill:event.target.value})}/><label className="poster-label">테두리</label><input className="poster-color" type="color" value={selected.stroke==='transparent'?'#111827':selected.stroke} onChange={(event)=>updateElement(selected.id,{stroke:event.target.value})}/><Range label="테두리 두께" value={selected.strokeWidth} min={0} max={30} onChange={(strokeWidth)=>updateElement(selected.id,{strokeWidth})}/></>
    return <><PanelTitle title={`${selected.name} 편집`} text="캔버스에서 드래그하거나 아래 값을 조정하세요."/>{specific}{common}<div className="poster-grid-2 poster-section"><button className="poster-button" onClick={()=>addElement(clonePosterElement(selected))}><Copy size={14}/> 복제</button><button className="poster-button danger" onClick={()=>removeElement(selected.id)}><Trash2 size={14}/> 삭제</button></div><div className="poster-grid-2 poster-section"><button className="poster-button" onClick={()=>reorder(selected.id,'front')}><BringToFront size={14}/> 맨 앞으로</button><button className="poster-button" onClick={()=>reorder(selected.id,'back')}><SendToBack size={14}/> 맨 뒤로</button></div></>
  }

  const actualScale=fitScale*viewZoom
  const inspectorLabel = selected?.kind === 'text' ? '글자 스타일' : selected?.kind === 'image' ? '사진 조정' : selected ? '요소 설정' : '포스터 설정'
  return <div className="poster-shell studio-editor-shell">
    <input ref={imageInputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event)=>{const file=event.target.files?.[0];if(file){setMobilePanel(false);void addImageFile(file)}event.target.value=''}}/>
    <input ref={backgroundInputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={async(event)=>{const file=event.target.files?.[0];if(file){setMobilePanel(false);const src=await readPosterImage(file);commit((d)=>({...d,background:{...d.background,type:'image',imageSrc:src}}))}event.target.value=''}}/>
    <input ref={stickerInputRef} hidden type="file" accept="image/png,image/webp" onChange={async(event)=>{const file=event.target.files?.[0];if(file)addSticker(await readPosterImage(file),'image');event.target.value=''}}/>
    <input ref={projectInputRef} hidden type="file" accept=".json,.barabom-poster.json" onChange={async(event)=>{const file=event.target.files?.[0];if(file){setMobilePanel(false);try{openProject(await importPosterProject(file),false)}catch{setStatus('올바른 포스터 파일이 아니에요')}}event.target.value=''}}/>
    <input ref={templateInputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event)=>{const file=event.target.files?.[0];if(file){setMobilePanel(false);void uploadTemplate(file)}event.target.value=''}}/>
    <header className="poster-header studio-editor-header">
      <button className="poster-header-brand" onClick={onExit}><img src={`${import.meta.env.BASE_URL}barabom-mark.svg`} alt=""/><div><strong>너를, 바라봄</strong><span>POSTER STUDIO</span></div></button>
      <div className="poster-header-name"><input aria-label="프로젝트 이름" value={document.name} onChange={(event)=>commit((d)=>({...d,name:event.target.value}),false)}/><span className="studio-save-status" role="status">{saving ? '저장 중…' : status || (document === savedDocument ? '저장 완료' : '저장 필요')}</span></div>
      <StudioHeaderActions onBack={onExit} onNew={newProject} onSave={() => void saveCurrentProject()} saving={saving}
        onUndo={undo} onRedo={redo} canUndo={history.length > 0} canRedo={future.length > 0}
        onPreview={() => void showPreview()} onDownload={() => setDownloadOpen(true)} />
    </header>
    <div className="poster-editor-body studio-editor-body">
      <nav className="poster-tools studio-tool-nav" aria-label="포스터 도구">{tabs.map((item)=><button key={item.id} aria-controls="poster-tool-panel" className={tab===item.id?'active':''} onClick={()=>{
        setTab(item.id)
        setInspectorOpen(false)
        setMobilePanel((open) => tab !== item.id || !open)
      }}><item.icon size={19}/><span>{item.label}</span></button>)}</nav>
      <aside id="poster-tool-panel" className={`poster-panel studio-tool-panel ${mobilePanel?'mobile-open':''}`}>
        <button className="poster-button poster-mobile-close" onClick={()=>setMobilePanel(false)}>패널 닫기</button>
        {renderTab()}
      </aside>
      <main ref={workspaceRef} className="poster-workspace studio-workspace"
        onClick={() => { setMobilePanel(false); setInspectorOpen(false) }}
        onDragOver={(event) => {
          if (!event.dataTransfer.types.includes('Files')) return
          event.preventDefault()
          event.dataTransfer.dropEffect = 'copy'
          setDropTargetId(canvasRef.current?.getPhotoSlotAt(event.clientX, event.clientY) ?? null)
        }}
        onDragLeave={(event) => {
          if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setDropTargetId(null)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setDropTargetId(null)
          const file = Array.from(event.dataTransfer.files).find((item) => item.type.startsWith('image/'))
          const targetId = canvasRef.current?.getPhotoSlotAt(event.clientX, event.clientY) ?? null
          if (file) void addImageFile(file, targetId)
        }}
      >
        <PosterCanvas ref={canvasRef} document={document} scale={actualScale} selectedId={selectedId} exporting={exporting}
          dropTargetId={dropTargetId} showSafeArea={showSafeArea} onSelect={setSelectedId}
          onEditText={canvasTextEdit.enabled ? (item, node) => {
            setInspectorOpen(false)
            setMobilePanel(false)
            canvasTextEdit.open(item.text, node, (text) => updateElement(item.id, {text}))
          } : undefined}
          onChange={updateElement} onDelete={removeElement} onRequestImage={requestImage}/>
        <div className="poster-zoom studio-zoom"><button className="poster-icon-button" aria-label="축소" onClick={()=>setViewZoom((v)=>Math.max(.4,v-.1))}><ZoomOut size={16}/></button><span>{Math.round(viewZoom*100)}%</span><button className="poster-icon-button" aria-label="확대" onClick={()=>setViewZoom((v)=>Math.min(2.5,v+.1))}><ZoomIn size={16}/></button><button className="poster-icon-button" aria-label="화면 맞춤" onClick={()=>setViewZoom(1)}><Maximize2 size={15}/></button></div>
      </main>
      <StudioInspector id="poster-inspector" className="poster-inspector" label={inspectorLabel} open={inspectorOpen}
        onToggle={() => { setMobilePanel(false); setInspectorOpen((open) => !open) }}>
        {renderInspector()}
      </StudioInspector>
    </div>
    {canvasTextEdit.editor}
    <footer className="poster-footer"><span>{document.size.preset.toUpperCase()} · {document.elements.length}개 레이어 · {document.size.dpi}DPI</span><span>{document.size.outputWidth} × {document.size.outputHeight}px</span></footer>
    {downloadOpen&&<div className="poster-modal-backdrop" onMouseDown={()=>setDownloadOpen(false)}><div className="poster-modal" onMouseDown={(event)=>event.stopPropagation()}><div className="poster-modal-head"><PanelTitle title="포스터 다운로드" text="형식과 품질을 선택한 뒤 저장하세요."/><button className="poster-icon-button" onClick={()=>setDownloadOpen(false)}><Minus/></button></div><label className="poster-label">파일 형식</label><div className="poster-format-row">{(['png','jpeg','pdf'] as const).map((format)=><button key={format} className={downloadFormat===format?'active':''} onClick={()=>setDownloadFormat(format)}>{format==='jpeg'?'JPG':format.toUpperCase()}</button>)}</div><label className="poster-label">출력 해상도</label><div style={{padding:13,background:'#f1f5f9',borderRadius:10,fontSize:13,display:'flex',justifyContent:'space-between'}}><span>{document.size.dpi}DPI</span><strong>{document.size.outputWidth} × {document.size.outputHeight}px</strong></div><button className="poster-button primary poster-section" onClick={()=>void exportImage()}><Download size={16}/> {downloadFormat==='jpeg'?'JPG':downloadFormat.toUpperCase()} 다운로드</button><button className="poster-button poster-section" onClick={()=>void printPoster()}><Sparkles size={16}/> 인쇄 미리보기</button></div></div>}
    {previewUrl&&<div className="poster-modal-backdrop" onMouseDown={()=>setPreviewUrl('')}><div className="poster-modal" style={{width:'min(900px,96vw)'}} onMouseDown={(event)=>event.stopPropagation()}><div className="poster-modal-head"><PanelTitle title="포스터 미리보기" text="편집 가이드와 선택 테두리는 출력되지 않습니다."/><button className="poster-icon-button" onClick={()=>setPreviewUrl('')}><Minus/></button></div><img className="poster-preview-image" src={previewUrl} alt="포스터 미리보기"/></div></div>}
  </div>
}

function PanelTitle({title,text}:{title:string;text?:string}){return <><h2>{title}</h2>{text&&<p className="poster-panel-intro">{text}</p>}</>}
function Range({label,value,min,max,step=1,suffix='',onChange}:{label:string;value:number;min:number;max:number;step?:number;suffix?:string;onChange:(value:number)=>void}){return <label className="poster-label">{label} <span style={{float:'right',fontWeight:400}}>{Math.round(value*100)/100}{suffix}</span><input className="poster-range" type="range" value={value} min={min} max={max} step={step} onChange={(event)=>onChange(Number(event.target.value))}/></label>}
