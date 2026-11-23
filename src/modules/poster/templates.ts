import type { PosterDocument, PosterElement, PosterPreset, PosterSize, PosterTemplate } from './types'

export const POSTER_WIDTH = 720

export const posterSizes: Record<PosterPreset, PosterSize> = {
  'a4-portrait': { preset:'a4-portrait', width:720, height:1018, outputWidth:2480, outputHeight:3508, unit:'mm', dpi:300 },
  'a4-landscape': { preset:'a4-landscape', width:1018, height:720, outputWidth:3508, outputHeight:2480, unit:'mm', dpi:300 },
  'a3-portrait': { preset:'a3-portrait', width:720, height:1018, outputWidth:3508, outputHeight:4961, unit:'mm', dpi:300 },
  'a3-landscape': { preset:'a3-landscape', width:1018, height:720, outputWidth:4961, outputHeight:3508, unit:'mm', dpi:300 },
  square: { preset:'square', width:720, height:720, outputWidth:1080, outputHeight:1080, unit:'px', dpi:150 },
  feed: { preset:'feed', width:720, height:900, outputWidth:1080, outputHeight:1350, unit:'px', dpi:150 },
  story: { preset:'story', width:720, height:1280, outputWidth:1080, outputHeight:1920, unit:'px', dpi:150 },
  signage: { preset:'signage', width:1018, height:573, outputWidth:1920, outputHeight:1080, unit:'px', dpi:150 },
  custom: { preset:'custom', width:720, height:1018, outputWidth:1440, outputHeight:2036, unit:'px', dpi:150 },
}

const categories = [
  ['행사·이벤트','SPECIAL EVENT','함께 만드는 특별한 하루','#34264d','#f2b8d1','#fff7fb','✦'],
  ['할인·세일','BIG SALE','오늘만 만나는 특별한 가격','#c51f3a','#ffd84f','#fff8ec','%'],
  ['매장 홍보','GRAND OPEN','새로운 공간에서 만나요','#102a43','#d9b36c','#f7f2e8','OPEN'],
  ['카페·음식점','NEW MENU','한 입 가득 행복한 순간','#613a2b','#e8c69e','#fffaf3','☕'],
  ['공연·전시','LIVE STAGE','빛과 음악이 만나는 밤','#111827','#7c3aed','#f4f0ff','♪'],
  ['공지사항','NOTICE','꼭 확인해 주세요','#17324d','#62b6cb','#f4fbfd','!'],
  ['채용·모집','WE ARE HIRING','함께 성장할 동료를 찾습니다','#153b2e','#8fcf9e','#f3faf4','+'],
  ['교육·학원','NEW CLASS','배움이 내일을 바꿉니다','#173f6d','#f6b94b','#f6f9ff','A+'],
  ['생일·파티','HAPPY BIRTHDAY','오늘의 주인공을 초대합니다','#813c68','#ffc6df','#fff4fa','♥'],
  ['웨딩·기념일','OUR DAY','소중한 시작을 함께해 주세요','#6b5b52','#d8c1ad','#fbf8f4','♡'],
  ['SNS 홍보','TREND NOW','지금 가장 주목할 이야기','#131313','#65e6c4','#f3fffb','#'],
  ['사진 콜라주','MEMORY WALL','우리의 장면을 한 장에','#334155','#f6a5a5','#fff8f7','▦'],
  ['여행·관광','TRAVEL NOTE','새로운 풍경을 만나러 갑니다','#175a6f','#f0b35a','#f3fbfc','✈'],
  ['계절·시즌','SEASON STORY','계절이 머무는 순간','#315b4b','#f1c98e','#f9fbf6','❀'],
  ['명절·기념일','WITH LOVE','마음을 전하는 따뜻한 날','#8b2635','#d7aa58','#fff9ef','福'],
  ['심플·미니멀','LESS IS MORE','간결하게 전하는 메시지','#171717','#b7b7b7','#ffffff','—'],
  ['프리미엄','SIGNATURE','가치를 빛내는 단 하나의 선택','#111217','#cba66b','#f7f2e9','B'],
  ['감성·빈티지','OLD DAYS','천천히 오래 남는 기록','#5c4636','#bf8a63','#f1e5d2','✣'],
] as const

const base = (kind: PosterElement['kind'], id: string, name: string, x: number, y: number, width: number, height: number) => ({
  kind, id, name, x, y, width, height, rotation:0, opacity:1, visible:true, locked:false,
})

const text = (id:string, name:string, value:string, x:number, y:number, width:number, height:number, fontSize:number, fill:string, fontFamily='Noto Sans KR', align:'left'|'center'|'right'='left', fontStyle:'normal'|'bold'='bold'): PosterElement => ({
  ...base('text',id,name,x,y,width,height), text:value, fontFamily, fontSize, fontStyle, fill, align, letterSpacing:0, lineHeight:1.12, stroke:'transparent', strokeWidth:0, shadowColor:'#000000', shadowBlur:0, background:'transparent', underline:false,
}) as PosterElement

const shape = (id:string, name:string, shapeType:'rect'|'circle'|'line'|'banner', x:number, y:number, width:number, height:number, fill:string, radius=0): PosterElement => ({
  ...base('shape',id,name,x,y,width,height), shape:shapeType, fill, stroke:'transparent', strokeWidth:0, radius,
}) as PosterElement

const slot = (id:string, name:string, x:number, y:number, width:number, height:number, mask:'rect'|'round'|'circle'|'oval'='round'): PosterElement => ({
  ...base('image',id,name,x,y,width,height), src:'', isSlot:true, mask, zoom:1, offsetX:0, offsetY:0, flipX:false, flipY:false, brightness:0, contrast:0, saturation:0, filter:'none',
}) as PosterElement

function makeTemplate(categoryIndex:number, variant:number): PosterTemplate {
  const [category, headline, subline, dark, accent, light, deco] = categories[categoryIndex]
  const landscape = variant === 2
  const size = landscape ? posterSizes['a4-landscape'] : posterSizes['a4-portrait']
  const w = size.width
  const h = size.height
  const prefix = `tpl-${categoryIndex + 1}-${variant + 1}`
  let elements: PosterElement[]
  if (variant === 0) {
    elements = [
      shape(`${prefix}-accent`,'포인트 블록','rect',w*.5,h*.17,w*.88,h*.22,accent,22),
      text(`${prefix}-tag`,'카테고리',category,w*.30,h*.09,w*.36,32,15,dark,'Noto Sans KR','left','bold'),
      text(`${prefix}-title`,'제목',headline,w*.49,h*.19,w*.74,130,54,dark,categoryIndex % 3 === 0 ? 'Black Han Sans' : 'Noto Sans KR'),
      text(`${prefix}-sub`,'설명',subline,w*.445,h*.30,w*.65,64,22,dark,'Noto Serif KR','left','normal'),
      slot(`${prefix}-photo`,'메인 사진',w*.5,h*.62,w*.78,h*.48,'round'),
      text(`${prefix}-deco`,'장식',deco,w*.87,h*.10,w*.16,60,34,dark,'Noto Serif KR','center','bold'),
      text(`${prefix}-info`,'상세 안내','2026. 12. 24  ·  BARABOM STUDIO',w*.5,h*.92,w*.76,38,16,dark,'Noto Sans KR','center','normal'),
    ]
  } else if (variant === 1) {
    elements = [
      shape(`${prefix}-bar`,'세로 포인트','rect',w*.06,h*.5,w*.12,h,accent),
      text(`${prefix}-deco`,'장식',deco,w*.06,h*.12,w*.12,80,35,dark,'Noto Serif KR','center','bold'),
      slot(`${prefix}-photo`,'메인 사진',w*.58,h*.34,w*.66,h*.48,categoryIndex % 2 ? 'circle' : 'round'),
      text(`${prefix}-title`,'제목',headline,w*.58,h*.67,w*.66,120,50,dark,'Noto Sans KR','center','bold'),
      text(`${prefix}-sub`,'설명',subline,w*.58,h*.78,w*.58,70,21,dark,'Noto Serif KR','center','normal'),
      shape(`${prefix}-button`,'안내 박스','rect',w*.58,h*.89,w*.44,58,dark,29),
      text(`${prefix}-info`,'상세 안내','자세히 보기  ·  02-123-4567',w*.58,h*.89,w*.42,40,15,light,'Noto Sans KR','center','bold'),
    ]
  } else {
    elements = [
      slot(`${prefix}-photo`,'메인 사진',w*.68,h*.5,w*.56,h*.78,'round'),
      shape(`${prefix}-line`,'구분선','rect',w*.20,h*.20,w*.14,8,accent,4),
      text(`${prefix}-tag`,'카테고리',category.toUpperCase(),w*.27,h*.13,w*.28,30,15,accent,'Noto Sans KR','left','bold'),
      text(`${prefix}-title`,'제목',headline,w*.30,h*.36,w*.34,155,52,dark,'Noto Sans KR','left','bold'),
      text(`${prefix}-sub`,'설명',subline,w*.29,h*.58,w*.32,90,21,dark,'Noto Serif KR','left','normal'),
      text(`${prefix}-info`,'상세 안내','DEC 24 — 7PM\nBARABOM STUDIO',w*.28,h*.79,w*.30,70,16,dark,'Noto Sans KR','left','bold'),
    ]
  }
  return {
    id:prefix,
    name:`${category} ${['시그니처','포커스','에디토리얼'][variant]}`,
    category,
    tags:[category,headline,'포스터',landscape?'가로':'세로'],
    recommended: variant === 0 && categoryIndex < 6,
    size:{...size},
    background:{ type:'color', color:light, secondary:accent, imageSrc:'', opacity:1 },
    elements,
  }
}

export const posterTemplates: PosterTemplate[] = categories.flatMap((_, categoryIndex) => [0,1,2].map((variant) => makeTemplate(categoryIndex, variant)))
export const posterCategories = ['전체', ...categories.map((item) => item[0])]

export function templateById(id: string) { return posterTemplates.find((item) => item.id === id) }

export function documentFromTemplate(template: PosterTemplate): PosterDocument {
  const now = Date.now()
  return {
    version:'poster-v1', id:crypto.randomUUID(), name:`${template.name} 포스터`, templateId:template.id,
    createdAt:now, updatedAt:now, size:{...template.size}, background:{...template.background},
    elements:template.elements.map((element) => ({...element, id:crypto.randomUUID()})),
  }
}

export function createBlankPoster(preset: PosterPreset = 'a4-portrait'): PosterDocument {
  const now = Date.now()
  return { version:'poster-v1', id:crypto.randomUUID(), name:'나의 포스터', templateId:null, createdAt:now, updatedAt:now, size:{...posterSizes[preset]}, background:{type:'color',color:'#ffffff',secondary:'#f1f5f9',imageSrc:'',opacity:1}, elements:[] }
}
