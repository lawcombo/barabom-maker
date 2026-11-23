import { useMemo, useRef, useState } from 'react'
import { ArrowLeft, FileImage, Heart, ImagePlus, LayoutTemplate, Search, Sparkles } from 'lucide-react'
import { createBlankPoster, documentFromTemplate, posterCategories, posterSizes, posterTemplates } from './templates'
import { readPosterImage } from './utils'
import type { PosterDocument, PosterPreset } from './types'
import './poster.css'

export function PosterStart({onBack,onOpen}:{onBack:()=>void;onOpen:(document:PosterDocument)=>void}) {
  const [category,setCategory]=useState('전체')
  const [query,setQuery]=useState('')
  const [orientation,setOrientation]=useState<'all'|'portrait'|'landscape'>('all')
  const [blankPreset,setBlankPreset]=useState<PosterPreset>('a4-portrait')
  const [favorites,setFavorites]=useState<string[]>(()=>JSON.parse(localStorage.getItem('barabom-poster:favorites')||'[]'))
  const uploadRef=useRef<HTMLInputElement>(null)
  const filtered=useMemo(()=>posterTemplates.filter((template)=>{
    const categoryMatch=category==='전체'||template.category===category
    const queryMatch=!query||`${template.name} ${template.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())
    const orientationMatch=orientation==='all'||(orientation==='portrait'?template.size.height>=template.size.width:template.size.width>template.size.height)
    return categoryMatch&&queryMatch&&orientationMatch
  }),[category,query,orientation])
  const toggleFavorite=(id:string)=>{
    const next=favorites.includes(id)?favorites.filter((item)=>item!==id):[...favorites,id]
    setFavorites(next);localStorage.setItem('barabom-poster:favorites',JSON.stringify(next))
  }
  const uploadTemplate=async(file:File)=>{
    const src=await readPosterImage(file)
    const document=createBlankPoster('a4-portrait')
    document.name=file.name.replace(/\.[^.]+$/,'')
    document.background={type:'image',color:'#ffffff',secondary:'#ffffff',imageSrc:src,opacity:1}
    onOpen(document)
  }
  return <main className="poster-start">
    <input ref={uploadRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event)=>{const file=event.target.files?.[0];if(file)void uploadTemplate(file);event.target.value=''}}/>
    <header className="poster-start-header">
      <button className="poster-back" onClick={onBack}><ArrowLeft size={18}/> 메인으로</button>
      <div className="poster-brand"><img src={`${import.meta.env.BASE_URL}barabom-mark.svg`} alt=""/><div><strong>너를, 바라봄</strong><span>POSTER STUDIO</span></div></div>
      <span className="poster-private">사진은 브라우저 안에서만 처리돼요</span>
    </header>
    <section className="poster-start-hero">
      <div><span className="poster-kicker"><Sparkles size={16}/> POSTER STUDIO</span><h1>템플릿을 고르고,<br/>나만의 포스터를 완성하세요.</h1><p>사진과 문구만 바꿔도 완성되는 54가지 디자인부터 빈 캔버스까지 준비했습니다.</p></div>
      <div className="poster-start-actions">
        <button onClick={()=>uploadRef.current?.click()}><FileImage/><strong>내 템플릿 업로드</strong><span>JPG, PNG, WebP를 배경으로 시작</span></button>
        <div className="blank-start"><div><ImagePlus/><strong>빈 캔버스</strong></div><select value={blankPreset} onChange={(event)=>setBlankPreset(event.target.value as PosterPreset)}><option value="a4-portrait">A4 세로</option><option value="a4-landscape">A4 가로</option><option value="a3-portrait">A3 세로</option><option value="square">SNS 정사각형</option><option value="feed">SNS 피드</option><option value="story">SNS 스토리</option><option value="signage">디지털 사이니지</option></select><button onClick={()=>onOpen(createBlankPoster(blankPreset))}>새 디자인 시작</button></div>
      </div>
    </section>
    <section className="poster-library">
      <div className="poster-library-title"><div><LayoutTemplate/><div><h2>디자인 템플릿</h2><p>18개 카테고리 · 총 {posterTemplates.length}종</p></div></div><div className="poster-search"><Search size={17}/><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="템플릿 검색"/><select value={orientation} onChange={(event)=>setOrientation(event.target.value as typeof orientation)}><option value="all">전체 방향</option><option value="portrait">세로형</option><option value="landscape">가로형</option></select></div></div>
      <div className="poster-categories">{posterCategories.map((item)=><button key={item} className={category===item?'active':''} onClick={()=>setCategory(item)}>{item}</button>)}</div>
      <div className="poster-template-grid">{filtered.map((template)=>{
        const title=template.elements.find((item)=>item.kind==='text'&&item.name==='제목')
        const slot=template.elements.find((item)=>item.kind==='image')
        return <article key={template.id} className="poster-template-card">
          <button className="poster-favorite" aria-label="즐겨찾기" onClick={()=>toggleFavorite(template.id)}><Heart size={16} fill={favorites.includes(template.id)?'currentColor':'none'}/></button>
          <button className={`poster-template-preview ${template.size.width>template.size.height?'landscape':''}`} style={{background:template.background.color}} onClick={()=>onOpen(documentFromTemplate(template))}>
            <span className="preview-accent" style={{background:template.background.secondary}}/>
            {slot&&<span className="preview-photo" style={{borderColor:template.background.secondary}}/>}
            <strong style={{color:(title&&title.kind==='text')?title.fill:'#111827'}}>{title&&title.kind==='text'?title.text:template.name}</strong>
            <small>{template.category}</small>
          </button>
          <div><strong>{template.name}</strong><span>{template.size.width>template.size.height?'가로형':'세로형'} · {posterSizes[template.size.preset].preset.toUpperCase()}</span></div>
        </article>
      })}</div>
      {!filtered.length&&<div className="poster-empty">조건에 맞는 템플릿이 없습니다.</div>}
    </section>
  </main>
}
