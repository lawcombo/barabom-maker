import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { jsPDF } from 'jspdf'
import {
  AlignCenter, ArrowDownToLine, ChevronDown, Copy, Download, FlipHorizontal2, FlipVertical2,
  FolderOpen, Frame, ImagePlus, Images, Layers3, LayoutGrid, Maximize2, Minus, Palette,
  Plus, Redo2, RotateCcw, RotateCw, Save, Sparkles, Sticker, Trash2, Type,
  Undo2, Upload, ZoomIn, ZoomOut,
} from 'lucide-react'
import { CanvasStage, type CanvasHandle } from './CanvasStage'
import { ARTBOARD, layoutLabel } from '../data/layouts'
import { templateById, templates } from '../data/templates'
import { createDocument, createPhoto, frameFromTemplate, readImageFile } from '../lib/document'
import { deleteProject, exportProjectFile, importProjectFile, listProjects, loadLastProject, loadProject, saveProject } from '../lib/projects'
import type { EditorDocument, Orientation, SelectedElement, SlotPhoto, StickerElement, TextElement, ToolTab } from '../types'

const tabs: Array<{ id: ToolTab; label: string; icon: typeof LayoutGrid }> = [
  { id:'layout', label:'레이아웃', icon:LayoutGrid }, { id:'templates', label:'템플릿', icon:Sparkles },
  { id:'photos', label:'사진', icon:Images }, { id:'text', label:'텍스트', icon:Type },
  { id:'stickers', label:'스티커', icon:Sticker }, { id:'background', label:'배경', icon:Palette },
  { id:'projects', label:'프로젝트', icon:FolderOpen },
]

const fonts = [
  { family:'Noto Sans KR', label:'노토 고딕', sample:'깔끔한 오늘' },
  { family:'Noto Serif KR', label:'노토 명조', sample:'감성적인 순간' },
  { family:'Gowun Batang', label:'고운 바탕', sample:'차분한 기억' },
  { family:'Black Han Sans', label:'검은 고딕', sample:'강렬한 제목' },
  { family:'Do Hyeon', label:'도현체', sample:'또렷한 하루' },
  { family:'Jua', label:'주아체', sample:'귀여운 추억' },
  { family:'Gaegu', label:'개구체', sample:'우리들의 사진' },
  { family:'Hi Melody', label:'하이 멜로디', sample:'말랑한 마음' },
  { family:'Nanum Pen Script', label:'나눔 펜', sample:'손으로 쓴 편지' },
  { family:'Nanum Brush Script', label:'나눔 붓글씨', sample:'멋진 한마디' },
  { family:'Arial', label:'Arial', sample:'SIMPLE DAY' },
  { family:'Georgia', label:'Georgia', sample:'Classic Moment' },
]
const stickerCategories = [
  { id:'hearts', label:'하트', items:['♥','♡','❤','🩷','🧡','💛','💚','🩵','💙','💜','🤍','🖤','💖','💕','💞','💘'] },
  { id:'sparkles', label:'별·반짝', items:['★','☆','✦','✧','✨','🌟','⭐','💫','⚡','☀️','🌙','☁️','🌈','🔥','💎','🪄'] },
  { id:'nature', label:'꽃·자연', items:['✿','❀','🌸','🌼','🌻','🌹','🌷','🪻','🍀','🌿','🍃','🍁','🍂','❄️','🦋','🐚'] },
  { id:'party', label:'파티', items:['🎂','🎉','🎊','🎈','🎁','🥳','🍰','🧁','🍾','🥂','🎵','🎶','📸','🎤','🪩','🎆'] },
  { id:'faces', label:'표정·동물', items:['😊','😍','🥰','😎','🤩','😘','😆','🥹','🐰','🐻','🐶','🐱','🐥','🦊','🐼','🐾'] },
  { id:'decor', label:'리본·소품', items:['🎀','👑','💍','💌','💬','🗯️','📍','📅','🕶️','☕','🍓','🍒','🧸','🫧','🎧','📷'] },
  { id:'shapes', label:'도형·화살표', items:['○','●','△','▲','□','■','◇','◆','→','←','↑','↓','↗','↘','✓','!'] },
  { id:'seasons', label:'계절', items:['🌸','☀️','🏖️','🍉','🌊','🍁','🎃','🦇','❄️','☃️','🎄','🎅','🧧','🎇','🌾','🧣'] },
] as const
const recommendedTexts = ['OUR MEMORIES','BEST FRIENDS','LOVE YOU','HAPPY BIRTHDAY','FOREVER TOGETHER','오늘의 추억','우리의 네컷','행복한 하루']
const templateCategories = ['전체', ...Array.from(new Set(templates.map((template) => template.category)))]

function SectionTitle({ title, description }: { title: string; description?: string }) {
  return <div className="mb-4"><h2 className="text-base font-bold text-slate-900">{title}</h2>{description && <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>}</div>
}

function Range({ label, value, min, max, step=1, suffix='', onChange }: { label:string; value:number; min:number; max:number; step?:number; suffix?:string; onChange:(value:number)=>void }) {
  return <label className="block"><span className="mb-2 flex justify-between text-xs font-medium text-slate-600"><span>{label}</span><span>{Math.round(value * 100) / 100}{suffix}</span></span><input className="range" type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}/></label>
}

function IconButton({ label, disabled, onClick, children }: { label:string; disabled?:boolean; onClick?:()=>void; children:React.ReactNode }) {
  return <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className="icon-btn">{children}</button>
}

export function Editor({ onExit }: { onExit: () => void }) {
  const [document, setDocument] = useState<EditorDocument>(() => createDocument())
  const [undoStack, setUndoStack] = useState<EditorDocument[]>([])
  const [redoStack, setRedoStack] = useState<EditorDocument[]>([])
  const [tab, setTab] = useState<ToolTab>('layout')
  const [selected, setSelected] = useState<SelectedElement>(null)
  const [viewZoom, setViewZoom] = useState(1)
  const [fitScale, setFitScale] = useState(.48)
  const [showSafeArea, setShowSafeArea] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [stickerCategory, setStickerCategory] = useState<string>(stickerCategories[0].id)
  const [templateCategory, setTemplateCategory] = useState('전체')
  const [downloadFormat, setDownloadFormat] = useState<'png'|'jpeg'|'pdf'>('png')
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [projects, setProjects] = useState<EditorDocument[]>([])
  const [status, setStatus] = useState('자동 저장 켜짐')
  const [mobilePanel, setMobilePanel] = useState(false)
  const canvasRef = useRef<CanvasHandle>(null)
  const workspaceRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const projectInputRef = useRef<HTMLInputElement>(null)
  const stickerInputRef = useRef<HTMLInputElement>(null)
  const uploadTarget = useRef<number | null>(null)
  const restored = useRef(false)

  const commit = useCallback((updater: (current: EditorDocument) => EditorDocument, history = true) => {
    setDocument((current) => {
      const next = { ...updater(current), updatedAt: Date.now() }
      if (history) {
        setUndoStack((items) => [...items.slice(-49), current])
        setRedoStack([])
      }
      return next
    })
  }, [])

  const undo = useCallback(() => {
    setUndoStack((items) => {
      const previous = items.at(-1)
      if (!previous) return items
      setDocument((current) => { setRedoStack((next) => [...next, current]); return previous })
      return items.slice(0, -1)
    })
  }, [])
  const redo = useCallback(() => {
    setRedoStack((items) => {
      const next = items.at(-1)
      if (!next) return items
      setDocument((current) => { setUndoStack((past) => [...past, current]); return next })
      return items.slice(0, -1)
    })
  }, [])

  useEffect(() => {
    loadLastProject().then((saved) => { if (saved) { setDocument(saved); setStatus('이전 작업을 복구했어요') } }).finally(() => { restored.current = true })
  }, [])

  useEffect(() => {
    if (!restored.current) return
    setStatus('저장 중…')
    const timer = window.setTimeout(() => saveProject(document).then(() => setStatus('자동 저장됨')).catch(() => setStatus('저장 실패')), 900)
    return () => window.clearTimeout(timer)
  }, [document])

  useEffect(() => {
    if (tab === 'projects') listProjects().then(setProjects)
  }, [tab, document.updatedAt])

  useEffect(() => {
    const updateFit = () => {
      const host = workspaceRef.current
      if (!host) return
      const { width, height } = ARTBOARD[document.orientation]
      const availableW = Math.max(260, host.clientWidth - 80)
      const availableH = Math.max(300, host.clientHeight - 80)
      setFitScale(Math.min(availableW / width, availableH / height, 1))
    }
    updateFit()
    const observer = new ResizeObserver(updateFit)
    if (workspaceRef.current) observer.observe(workspaceRef.current)
    return () => observer.disconnect()
  }, [document.orientation])

  const selectedPhotoIndex = selected?.type === 'slot' ? Number(selected.id) : -1
  const selectedPhoto = selectedPhotoIndex >= 0 ? document.photos[selectedPhotoIndex] : null
  const selectedText = selected?.type === 'text' ? document.texts.find((item) => item.id === selected.id) : undefined
  const selectedSticker = selected?.type === 'sticker' ? document.stickers.find((item) => item.id === selected.id) : undefined

  const replacePhoto = useCallback((index: number, photo: SlotPhoto | null) => commit((current) => {
    const photos = [...current.photos]
    photos[index] = photo
    return { ...current, photos }
  }), [commit])

  const addFiles = useCallback(async (files: File[], startIndex?: number) => {
    const valid = files.filter((file) => ['image/jpeg','image/png','image/webp'].includes(file.type))
    if (!valid.length) { setStatus('JPG, PNG, WEBP 이미지만 사용할 수 있어요'); return }
    const created = await Promise.all(valid.map(async (file) => createPhoto(await readImageFile(file), file.name)))
    commit((current) => {
      const photos = [...current.photos]
      let pointer = startIndex ?? photos.findIndex((item) => !item)
      if (pointer < 0) pointer = 0
      created.forEach((photo) => {
        while (pointer < photos.length && photos[pointer]) pointer += 1
        if (pointer < photos.length) photos[pointer++] = photo
      })
      return { ...current, photos }
    })
    setStatus(`${created.length}장의 사진을 배치했어요`)
  }, [commit])

  const requestUpload = (index?: number) => { uploadTarget.current = index ?? null; fileInputRef.current?.click() }

  const deleteSelected = useCallback(() => {
    if (!selected) return
    if (selected.type === 'slot') replacePhoto(Number(selected.id), null)
    if (selected.type === 'text') commit((current) => ({ ...current, texts: current.texts.filter((item) => item.id !== selected.id) }))
    if (selected.type === 'sticker') commit((current) => ({ ...current, stickers: current.stickers.filter((item) => item.id !== selected.id) }))
    setSelected(null)
  }, [selected, replacePhoto, commit])

  const duplicateSelected = useCallback(() => {
    if (!selected) return
    if (selected.type === 'slot') {
      const photo = document.photos[Number(selected.id)]
      const empty = document.photos.findIndex((item) => !item)
      if (photo && empty >= 0) replacePhoto(empty, { ...photo, id:crypto.randomUUID() })
    }
    if (selected.type === 'text' && selectedText) commit((current) => ({ ...current, texts:[...current.texts, { ...selectedText, id:crypto.randomUUID(), x:selectedText.x+16, y:selectedText.y+16 }] }))
    if (selected.type === 'sticker' && selectedSticker) commit((current) => ({ ...current, stickers:[...current.stickers, { ...selectedSticker, id:crypto.randomUUID(), x:selectedSticker.x+16, y:selectedSticker.y+16 }] }))
  }, [selected, document.photos, selectedText, selectedSticker, replacePhoto, commit])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (['INPUT','TEXTAREA','SELECT'].includes(target.tagName)) return
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); return }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); return }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') { event.preventDefault(); duplicateSelected(); return }
      if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); deleteSelected(); return }
      if (selected && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) {
        event.preventDefault(); const amount = event.shiftKey ? 10 : 1
        const dx = event.key === 'ArrowLeft' ? -amount : event.key === 'ArrowRight' ? amount : 0
        const dy = event.key === 'ArrowUp' ? -amount : event.key === 'ArrowDown' ? amount : 0
        if (selected.type === 'text' && selectedText) commit((d) => ({ ...d, texts:d.texts.map((x) => x.id === selected.id ? { ...x, x:x.x+dx, y:x.y+dy } : x) }))
        if (selected.type === 'sticker' && selectedSticker) commit((d) => ({ ...d, stickers:d.stickers.map((x) => x.id === selected.id ? { ...x, x:x.x+dx, y:x.y+dy } : x) }))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, deleteSelected, duplicateSelected, selected, selectedText, selectedSticker, commit])

  const applyTemplate = (id: string) => commit((current) => ({ ...current, templateId:id, frame:frameFromTemplate(templateById(id)) }))
  const setCutCount = (count: number) => commit((current) => ({ ...current, cutCount:count, photos:Array.from({ length:count }, (_, i) => current.photos[i] ?? null) }))
  const setOrientation = (orientation: Orientation) => commit((current) => ({ ...current, orientation }))
  const updatePhoto = (index:number, photo:SlotPhoto) => replacePhoto(index, photo)
  const updateText = (id:string, patch:Partial<TextElement>) => commit((current) => ({ ...current, texts:current.texts.map((item) => item.id === id ? { ...item, ...patch } : item) }))
  const updateSticker = (id:string, patch:Partial<StickerElement>) => commit((current) => ({ ...current, stickers:current.stickers.map((item) => item.id === id ? { ...item, ...patch } : item) }))
  const updateFrame = (patch:Partial<EditorDocument['frame']>) => commit((current) => ({ ...current, frame:{ ...current.frame, ...patch } }))

  const addText = (text='텍스트를 입력하세요') => {
    const art = ARTBOARD[document.orientation]
    const item:TextElement = { id:crypto.randomUUID(), text, x:art.width*.2, y:art.height*.45, width:art.width*.6, fontFamily:'Gaegu', fontSize:28, fontStyle:'bold', fill:'#111827', align:'center', letterSpacing:0, lineHeight:1.2, rotation:0, opacity:1, stroke:'transparent', strokeWidth:0, shadowColor:'#000000', shadowBlur:0, background:'transparent' }
    commit((current) => ({ ...current, texts:[...current.texts, item] })); setSelected({ type:'text', id:item.id })
  }
  const addSticker = (value:string, kind:'emoji'|'image'='emoji') => {
    const art = ARTBOARD[document.orientation]
    const item:StickerElement = { id:crypto.randomUUID(), kind, value, x:art.width/2, y:art.height/2, size:56, rotation:0, opacity:1 }
    commit((current) => ({ ...current, stickers:[...current.stickers, item] })); setSelected({ type:'sticker', id:item.id })
  }

  const captureCanvas = async (mime:'image/png'|'image/jpeg', pixelRatio:number, quality=.96) => {
    setIsExporting(true)
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve())))
    try {
      return canvasRef.current?.toDataURL(mime, pixelRatio, quality)
    } finally {
      setIsExporting(false)
    }
  }

  const exportImage = async (format:'png'|'jpeg'|'pdf') => {
    await window.document.fonts?.ready
    const outputW = Math.round(document.output.widthMm / 25.4 * document.output.dpi)
    const logicalW = canvasRef.current?.size().width || 400
    const pixelRatio = Math.min(8, outputW / (logicalW * fitScale * viewZoom))
    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png'
    const url = await captureCanvas(mime, Math.max(1, pixelRatio), .96)
    if (!url) return
    if (format === 'pdf') {
      const pdf = new jsPDF({ orientation: document.output.widthMm > document.output.heightMm ? 'landscape' : 'portrait', unit:'mm', format:[document.output.widthMm, document.output.heightMm] })
      pdf.addImage(url, 'PNG', 0, 0, document.output.widthMm, document.output.heightMm)
      pdf.save(`${document.name}.pdf`)
    } else {
      const anchor = window.document.createElement('a'); anchor.href = url; anchor.download = `${document.name}.${format === 'jpeg' ? 'jpg' : 'png'}`; anchor.click()
    }
    setStatus(`${format.toUpperCase()} 파일을 저장했어요`); setDownloadOpen(false)
  }

  const renderTab = () => {
    if (tab === 'layout') return <><SectionTitle title="레이아웃" description="사진 수와 배치 방향을 선택하세요."/><p className="field-label">컷 수</p><div className="grid grid-cols-3 gap-2">{Array.from({ length:9 },(_,i)=>i+1).map((count)=><button key={count} onClick={()=>setCutCount(count)} className={`choice-btn ${document.cutCount===count?'active':''}`}>{count}컷</button>)}</div><p className="field-label mt-6">배치 방식</p><div className="grid grid-cols-3 gap-2">{(['portrait','landscape','grid'] as Orientation[]).map((orientation)=><button key={orientation} onClick={()=>setOrientation(orientation)} className={`layout-thumb ${document.orientation===orientation?'active':''}`}><span className={`mini-layout ${orientation==='grid'?'gridmode':orientation}`} >{Array.from({ length:Math.min(document.cutCount,6) },(_,i)=><i key={i}/>)}</span><small>{layoutLabel(document.cutCount,orientation)}</small></button>)}</div></>
    if (tab === 'templates') {
      const visibleTemplates = templateCategory === '전체' ? templates : templates.filter((template) => template.category === templateCategory)
      return <><SectionTitle title="디자인 템플릿" description={`${templates.length}가지 디자인 중 분위기에 맞게 골라보세요. 사진은 그대로 유지됩니다.`}/><div className="mb-4 flex flex-wrap gap-2">{templateCategories.map((category)=><button key={category} onClick={()=>setTemplateCategory(category)} className={`chip ${category===templateCategory?'border-violet-400 bg-violet-50 text-violet-700':''}`}>{category}</button>)}</div><div className="grid grid-cols-2 gap-3">{visibleTemplates.map((template)=><button key={template.id} onClick={()=>applyTemplate(template.id)} className={`template-card ${document.templateId===template.id?'active':''}`} style={{ background:template.background, color:template.colors[1] }}><span className="template-preview-decoration" style={{ color:template.colors[2] }}>{template.decoration}</span><span className="template-preview-caption">{template.topCaption}</span><span className="template-photos">{[0,1,2,3].map(i=><i key={i} style={{ borderColor:template.borderColor }}/>)}</span><strong>{template.name}</strong><small>{template.category}</small></button>)}</div></>
    }
    if (tab === 'photos') return <><SectionTitle title="사진" description="여러 장을 고르면 빈 컷부터 자동 배치해요."/><button className="primary-btn w-full" onClick={()=>requestUpload()}><ImagePlus size={17}/> 사진 불러오기</button><div className="mt-4 rounded-xl bg-violet-50 p-4 text-xs leading-5 text-violet-700">캔버스의 원하는 컷에 사진 파일을 직접 끌어다 놓을 수도 있어요.</div><div className="mt-5 grid grid-cols-3 gap-2">{document.photos.map((photo,index)=><button key={index} onClick={()=>photo?setSelected({type:'slot',id:String(index)}):requestUpload(index)} className={`photo-tile ${selectedPhotoIndex===index?'active':''}`}>{photo?<img src={photo.src} alt={`${index+1}번 컷`}/>:<Plus/>}<span>{index+1}</span></button>)}</div><button className="secondary-btn mt-5 w-full" onClick={()=>commit(d=>({...d,photos:d.photos.map(()=>null)}))}><Trash2 size={15}/> 모든 사진 비우기</button></>
    if (tab === 'text') return <><SectionTitle title="텍스트" description="캔버스 어디든 문구를 추가할 수 있어요."/><button className="primary-btn w-full" onClick={()=>addText()}><Type size={17}/> 텍스트 추가</button><p className="field-label mt-6">추천 문구</p><div className="flex flex-wrap gap-2">{recommendedTexts.map(text=><button key={text} onClick={()=>addText(text)} className="chip">{text}</button>)}<button onClick={()=>addText(new Intl.DateTimeFormat('ko-KR').format(new Date()))} className="chip">오늘 날짜</button></div></>
    if (tab === 'stickers') {
      const category = stickerCategories.find((item) => item.id === stickerCategory) ?? stickerCategories[0]
      return <><SectionTitle title="스티커" description="카테고리에서 골라 추가한 뒤 자유롭게 옮겨보세요."/><div className="mb-4 flex flex-wrap gap-2">{stickerCategories.map((item)=><button key={item.id} onClick={()=>setStickerCategory(item.id)} className={`chip ${item.id===category.id?'border-violet-400 bg-violet-50 text-violet-700':''}`}>{item.label}</button>)}</div><div className="grid grid-cols-5 gap-2">{category.items.map(value=><button key={value} title={`${value} 스티커 추가`} aria-label={`${value} 스티커 추가`} onClick={()=>addSticker(value)} className="sticker-btn">{value}</button>)}</div><button className="secondary-btn mt-5 w-full" onClick={()=>stickerInputRef.current?.click()}><Upload size={15}/> 내 PNG 스티커</button></>
    }
    if (tab === 'background') return <><SectionTitle title="프레임 꾸미기"/><label className="color-field">배경색<input type="color" value={document.frame.background} onChange={e=>updateFrame({background:e.target.value})}/></label><label className="color-field">테두리색<input type="color" value={document.frame.borderColor} onChange={e=>updateFrame({borderColor:e.target.value})}/></label><div className="mt-5 space-y-5"><Range label="사진 간격" value={document.frame.gap} min={0} max={40} suffix="px" onChange={gap=>updateFrame({gap})}/><Range label="바깥 여백" value={document.frame.padding} min={8} max={60} suffix="px" onChange={padding=>updateFrame({padding})}/><Range label="모서리" value={document.frame.radius} min={0} max={80} suffix="px" onChange={radius=>updateFrame({radius})}/><Range label="테두리" value={document.frame.borderWidth} min={0} max={12} suffix="px" onChange={borderWidth=>updateFrame({borderWidth})}/></div><label className="toggle-row"><span>장식 표시</span><input type="checkbox" checked={document.frame.showDecorations} onChange={e=>updateFrame({showDecorations:e.target.checked})}/></label><label className="toggle-row"><span>날짜 표시</span><input type="checkbox" checked={document.frame.showDate} onChange={e=>updateFrame({showDate:e.target.checked})}/></label><label className="field-label mt-4">상단 문구<input className="text-input" value={document.frame.topCaption} onChange={e=>updateFrame({topCaption:e.target.value})}/></label><label className="field-label mt-4">하단 문구<input className="text-input" value={document.frame.bottomCaption} onChange={e=>updateFrame({bottomCaption:e.target.value})}/></label></>
    return <><SectionTitle title="내 프로젝트" description="이 브라우저의 IndexedDB에 안전하게 저장됩니다."/><button className="primary-btn w-full" onClick={()=>{ const fresh=createDocument(); setUndoStack([]); setRedoStack([]); setDocument(fresh); setSelected(null) }}><Plus size={17}/> 새 프로젝트</button><div className="mt-4 space-y-2">{projects.map(project=><div key={project.id} className="project-row"><button onClick={async()=>{ const loaded=await loadProject(project.id); if(loaded){setDocument(loaded);setSelected(null)}}}><strong>{project.name}</strong><small>{new Date(project.updatedAt).toLocaleString('ko-KR')}</small></button><IconButton label="삭제" onClick={async()=>{await deleteProject(project.id);setProjects(await listProjects())}}><Trash2 size={15}/></IconButton></div>)}</div><div className="mt-5 grid grid-cols-2 gap-2"><button className="secondary-btn" onClick={()=>exportProjectFile(document)}><ArrowDownToLine size={15}/> 내보내기</button><button className="secondary-btn" onClick={()=>projectInputRef.current?.click()}><Upload size={15}/> 가져오기</button></div></>
  }

  const renderInspector = () => {
    if (selectedPhoto) return <><SectionTitle title={`사진 ${selectedPhotoIndex+1}`} description="휠 또는 슬라이더로 확대하고 사진을 직접 드래그하세요."/><div className="mb-4 grid grid-cols-4 gap-2"><IconButton label="왼쪽 회전" onClick={()=>updatePhoto(selectedPhotoIndex,{...selectedPhoto,rotation:selectedPhoto.rotation-90})}><RotateCcw size={17}/></IconButton><IconButton label="오른쪽 회전" onClick={()=>updatePhoto(selectedPhotoIndex,{...selectedPhoto,rotation:selectedPhoto.rotation+90})}><RotateCw size={17}/></IconButton><IconButton label="좌우 반전" onClick={()=>updatePhoto(selectedPhotoIndex,{...selectedPhoto,flipX:!selectedPhoto.flipX})}><FlipHorizontal2 size={17}/></IconButton><IconButton label="상하 반전" onClick={()=>updatePhoto(selectedPhotoIndex,{...selectedPhoto,flipY:!selectedPhoto.flipY})}><FlipVertical2 size={17}/></IconButton></div><div className="space-y-5"><Range label="확대" value={selectedPhoto.zoom} min={selectedPhoto.fit==='cover'?1:.15} max={5} step={.01} suffix="×" onChange={zoom=>updatePhoto(selectedPhotoIndex,{...selectedPhoto,zoom})}/><Range label="세부 회전" value={selectedPhoto.rotation} min={-180} max={180} suffix="°" onChange={rotation=>updatePhoto(selectedPhotoIndex,{...selectedPhoto,rotation})}/><Range label="밝기" value={selectedPhoto.brightness} min={-100} max={100} onChange={brightness=>updatePhoto(selectedPhotoIndex,{...selectedPhoto,brightness})}/><Range label="대비" value={selectedPhoto.contrast} min={-100} max={100} onChange={contrast=>updatePhoto(selectedPhotoIndex,{...selectedPhoto,contrast})}/><Range label="채도" value={selectedPhoto.saturation} min={-100} max={100} onChange={saturation=>updatePhoto(selectedPhotoIndex,{...selectedPhoto,saturation})}/></div><p className="field-label mt-6">맞춤 방식</p><div className="grid grid-cols-2 gap-2"><button className={`choice-btn ${selectedPhoto.fit==='cover'?'active':''}`} onClick={()=>updatePhoto(selectedPhotoIndex,{...selectedPhoto,fit:'cover',zoom:1,offsetX:0,offsetY:0})}>프레임 채우기</button><button className={`choice-btn ${selectedPhoto.fit==='contain'?'active':''}`} onClick={()=>updatePhoto(selectedPhotoIndex,{...selectedPhoto,fit:'contain',zoom:1,offsetX:0,offsetY:0})}>전체 보기</button></div><p className="field-label mt-6">필터</p><div className="grid grid-cols-3 gap-2">{(['none','grayscale','sepia'] as const).map(filter=><button key={filter} className={`choice-btn ${selectedPhoto.filter===filter?'active':''}`} onClick={()=>updatePhoto(selectedPhotoIndex,{...selectedPhoto,filter})}>{filter==='none'?'원본':filter==='grayscale'?'흑백':'세피아'}</button>)}</div><div className="mt-6 grid grid-cols-2 gap-2"><button className="secondary-btn" onClick={()=>updatePhoto(selectedPhotoIndex,{...selectedPhoto,zoom:1,offsetX:0,offsetY:0,rotation:0,flipX:false,flipY:false,brightness:0,contrast:0,saturation:0,filter:'none'})}><RotateCcw size={15}/> 초기화</button><button className="danger-btn" onClick={deleteSelected}><Trash2 size={15}/> 삭제</button></div></>
    if (selectedText) return <><SectionTitle title="텍스트 편집"/><textarea className="text-input min-h-24 resize-y" value={selectedText.text} onChange={e=>updateText(selectedText.id,{text:e.target.value})}/><p className="field-label mt-5">글꼴</p><div className="mt-2 grid grid-cols-2 gap-2">{fonts.map(font=><button key={font.family} type="button" onClick={()=>updateText(selectedText.id,{fontFamily:font.family})} className={`font-choice ${selectedText.fontFamily===font.family?'active':''}`} style={{fontFamily:font.family}}><strong>{font.sample}</strong><small>{font.label}</small></button>)}</div><div className="mt-5 space-y-5"><Range label="글자 크기" value={selectedText.fontSize} min={10} max={120} suffix="px" onChange={fontSize=>updateText(selectedText.id,{fontSize})}/><Range label="자간" value={selectedText.letterSpacing} min={-3} max={20} suffix="px" onChange={letterSpacing=>updateText(selectedText.id,{letterSpacing})}/><Range label="줄 간격" value={selectedText.lineHeight} min={.8} max={3} step={.1} onChange={lineHeight=>updateText(selectedText.id,{lineHeight})}/><Range label="회전" value={selectedText.rotation} min={-180} max={180} suffix="°" onChange={rotation=>updateText(selectedText.id,{rotation})}/><Range label="투명도" value={selectedText.opacity} min={.1} max={1} step={.01} onChange={opacity=>updateText(selectedText.id,{opacity})}/></div><div className="mt-5 grid grid-cols-2 gap-3"><label className="color-field compact">글자<input type="color" value={selectedText.fill} onChange={e=>updateText(selectedText.id,{fill:e.target.value})}/></label><label className="color-field compact">테두리<input type="color" value={selectedText.stroke==='transparent'?'#ffffff':selectedText.stroke} onChange={e=>updateText(selectedText.id,{stroke:e.target.value,strokeWidth:1})}/></label></div><div className="mt-5 grid grid-cols-2 gap-2"><button className="secondary-btn" onClick={duplicateSelected}><Copy size={15}/> 복제</button><button className="danger-btn" onClick={deleteSelected}><Trash2 size={15}/> 삭제</button></div></>
    if (selectedSticker) return <><SectionTitle title="스티커 편집"/><div className="space-y-5"><Range label="크기" value={selectedSticker.size} min={16} max={220} suffix="px" onChange={size=>updateSticker(selectedSticker.id,{size})}/><Range label="회전" value={selectedSticker.rotation} min={-180} max={180} suffix="°" onChange={rotation=>updateSticker(selectedSticker.id,{rotation})}/><Range label="투명도" value={selectedSticker.opacity} min={.1} max={1} step={.01} onChange={opacity=>updateSticker(selectedSticker.id,{opacity})}/></div><div className="mt-5 grid grid-cols-2 gap-2"><button className="secondary-btn" onClick={duplicateSelected}><Copy size={15}/> 복제</button><button className="danger-btn" onClick={deleteSelected}><Trash2 size={15}/> 삭제</button></div></>
    return <><SectionTitle title="프레임 설정" description="요소를 선택하면 상세 설정이 표시됩니다."/><div className="summary-card"><Frame/><div><strong>{layoutLabel(document.cutCount,document.orientation)}</strong><small>{templateById(document.templateId).name}</small></div></div><button className="secondary-btn mt-4 w-full" onClick={()=>setTab('background')}><Palette size={15}/> 프레임 꾸미기</button><label className="toggle-row mt-5"><span>인쇄 안전 영역</span><input type="checkbox" checked={showSafeArea} onChange={e=>setShowSafeArea(e.target.checked)}/></label></>
  }

  const actualScale = fitScale * viewZoom
  const outputPixels = useMemo(() => ({ width:Math.round(document.output.widthMm/25.4*document.output.dpi), height:Math.round(document.output.heightMm/25.4*document.output.dpi) }), [document.output])

  return <div className="flex h-screen min-h-[640px] flex-col overflow-hidden bg-slate-100 text-slate-900">
    <input ref={fileInputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>{ if(e.target.files) addFiles(Array.from(e.target.files),uploadTarget.current??undefined); e.target.value='' }}/>
    <input ref={projectInputRef} hidden type="file" accept=".json,.photostudio.json" onChange={async e=>{const file=e.target.files?.[0];if(file){try{setDocument(await importProjectFile(file));setStatus('프로젝트를 가져왔어요')}catch{setStatus('올바른 프로젝트 파일이 아니에요')}}e.target.value=''}}/>
    <input ref={stickerInputRef} hidden type="file" accept="image/png,image/webp" onChange={async e=>{const file=e.target.files?.[0];if(file)addSticker(await readImageFile(file),'image');e.target.value=''}}/>
    <header className="editor-header">
      <button className="flex shrink-0 items-center gap-2.5 text-left" onClick={onExit} aria-label="너를, 바라봄 시작 화면으로"><img src={`${import.meta.env.BASE_URL}barabom-mark.svg`} alt="" className="size-9"/><span className="hidden sm:block"><strong className="block font-['Noto_Serif_KR'] text-sm font-semibold leading-tight tracking-[-.035em]">너를, 바라봄</strong><small className="mt-0.5 block text-[8px] font-semibold tracking-[.18em] text-[#8a6f47]">BARABOM STUDIO</small></span></button>
      <div className="flex min-w-0 flex-1 items-center justify-center gap-2"><input aria-label="프로젝트 이름" className="project-name" value={document.name} onChange={e=>commit(d=>({...d,name:e.target.value}),false)}/><span className="hidden text-xs text-slate-400 lg:block">{status}</span></div>
      <div className="header-actions flex shrink-0 items-center gap-1"><IconButton label="저장" onClick={()=>saveProject(document).then(()=>setStatus('저장 완료'))}><Save size={17}/></IconButton><IconButton label="실행 취소" disabled={!undoStack.length} onClick={undo}><Undo2 size={17}/></IconButton><IconButton label="다시 실행" disabled={!redoStack.length} onClick={redo}><Redo2 size={17}/></IconButton><button className="primary-btn" onClick={()=>setDownloadOpen(true)}><Download size={16}/><span className="hidden sm:inline">다운로드</span></button></div>
    </header>
    <div className="flex min-h-0 flex-1">
      <nav className="tool-nav">{tabs.map(item=><button key={item.id} className={tab===item.id?'active':''} onClick={()=>{setTab(item.id);setMobilePanel(true)}}><item.icon size={19}/><span>{item.label}</span></button>)}</nav>
      <aside className={`left-panel ${mobilePanel?'mobile-open':''}`}><button className="mobile-close" onClick={()=>setMobilePanel(false)}>닫기</button>{renderTab()}</aside>
      <main ref={workspaceRef} className="workspace" onClick={()=>setMobilePanel(false)}>
        <div className="canvas-center"><CanvasStage ref={canvasRef} document={document} viewScale={actualScale} selected={isExporting ? null : selected} showSafeArea={!isExporting && showSafeArea} onSelect={setSelected} onPhotoChange={updatePhoto} onTextChange={updateText} onTextDelete={(id)=>{commit(current=>({...current,texts:current.texts.filter(item=>item.id!==id)}));setSelected(null)}} onStickerChange={updateSticker} onStickerDelete={(id)=>{commit(current=>({...current,stickers:current.stickers.filter(item=>item.id!==id)}));setSelected(null)}} onRequestUpload={requestUpload} onFilesDropped={addFiles}/></div>
        <div className="zoom-bar"><IconButton label="축소" onClick={()=>setViewZoom(v=>Math.max(.5,v-.1))}><ZoomOut size={16}/></IconButton><span>{Math.round(viewZoom*100)}%</span><IconButton label="확대" onClick={()=>setViewZoom(v=>Math.min(2,v+.1))}><ZoomIn size={16}/></IconButton><button onClick={()=>setViewZoom(1)}><Maximize2 size={14}/> 화면 맞춤</button></div>
      </main>
      <aside className="right-panel">{renderInspector()}</aside>
    </div>
    <footer className="editor-footer"><span>{document.cutCount}컷 · {document.output.widthMm}×{document.output.heightMm}mm · {document.output.dpi}DPI</span><span>{outputPixels.width}×{outputPixels.height}px</span></footer>
    {downloadOpen && <div className="modal-backdrop" onMouseDown={()=>setDownloadOpen(false)}><div className="download-modal" onMouseDown={e=>e.stopPropagation()}><div className="flex items-start justify-between"><SectionTitle title="다운로드" description="파일 형식과 출력 품질을 선택한 뒤 다운로드하세요."/><button onClick={()=>setDownloadOpen(false)} className="icon-btn"><Minus/></button></div><p className="field-label">출력 규격</p><select className="select-input" value={document.output.preset} onChange={e=>{const preset=e.target.value as EditorDocument['output']['preset'];const size=preset==='strip50x150'?[50,150]:preset==='2x6'?[50.8,152.4]:preset==='4x6'?[101.6,152.4]:[document.output.widthMm,document.output.heightMm];commit(d=>({...d,output:{...d.output,preset,widthMm:size[0],heightMm:size[1]}}))}}><option value="strip50x150">인생네컷 50×150mm</option><option value="2x6">2×6인치 포토 스트립</option><option value="4x6">4×6인치 사진</option><option value="custom">사용자 지정</option></select>{document.output.preset==='custom'&&<div className="mt-3 grid grid-cols-2 gap-3"><label className="field-label">가로(mm)<input className="text-input" type="number" value={document.output.widthMm} onChange={e=>commit(d=>({...d,output:{...d.output,widthMm:Number(e.target.value)}}))}/></label><label className="field-label">세로(mm)<input className="text-input" type="number" value={document.output.heightMm} onChange={e=>commit(d=>({...d,output:{...d.output,heightMm:Number(e.target.value)}}))}/></label></div>}<p className="field-label mt-5">출력 품질</p><select className="select-input" value={document.output.dpi} onChange={e=>commit(d=>({...d,output:{...d.output,dpi:Number(e.target.value)}}))}><option value={150}>일반 화질 · 150DPI</option><option value={240}>고화질 · 240DPI</option><option value={300}>인화용 · 300DPI</option></select><div className="mt-4 rounded-xl bg-slate-100 p-4 text-sm"><div className="flex justify-between"><span>예상 이미지 크기</span><strong>{outputPixels.width} × {outputPixels.height}px</strong></div></div><p className="field-label mt-5">파일 형식</p><div className="mt-2 grid grid-cols-3 gap-2"><button className={`choice-btn ${downloadFormat==='png'?'active':''}`} onClick={()=>setDownloadFormat('png')}>PNG</button><button className={`choice-btn ${downloadFormat==='jpeg'?'active':''}`} onClick={()=>setDownloadFormat('jpeg')}>JPG</button><button className={`choice-btn ${downloadFormat==='pdf'?'active':''}`} onClick={()=>setDownloadFormat('pdf')}>PDF</button></div><button className="primary-btn mt-5 w-full justify-center" onClick={()=>exportImage(downloadFormat)}><Download size={16}/> {downloadFormat==='jpeg'?'JPG':downloadFormat.toUpperCase()} 다운로드</button></div></div>}
  </div>
}
