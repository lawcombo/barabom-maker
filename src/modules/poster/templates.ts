import type { PosterDocument, PosterElement, PosterImageElement, PosterPreset, PosterSize, PosterTemplate, PosterTextElement } from './types'

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
  ['행사·이벤트','SPECIAL EVENT','함께 만드는 특별한 하루','#34264d','#f2b8d1','#fff7fb','✦','event-festival.webp'],
  ['할인·세일','BIG SALE','오늘만 만나는 특별한 가격','#c51f3a','#ffd84f','#fff8ec','%','cafe-dessert.webp'],
  ['매장 홍보','GRAND OPEN','새로운 공간에서 만나요','#102a43','#d9b36c','#f7f2e8','OPEN','premium-boutique.webp'],
  ['카페·음식점','NEW MENU','한 입 가득 행복한 순간','#613a2b','#e8c69e','#fffaf3','☕','cafe-dessert.webp'],
  ['공연·전시','LIVE STAGE','빛과 음악이 만나는 밤','#111827','#7c3aed','#f4f0ff','♪','event-festival.webp'],
  ['공지사항','NOTICE','꼭 확인해 주세요','#17324d','#62b6cb','#f4fbfd','!','creative-workshop.webp'],
  ['채용·모집','WE ARE HIRING','함께 성장할 동료를 찾습니다','#153b2e','#8fcf9e','#f3faf4','+','creative-workshop.webp'],
  ['교육·학원','NEW CLASS','배움이 내일을 바꿉니다','#173f6d','#f6b94b','#f6f9ff','A+','creative-workshop.webp'],
  ['생일·파티','HAPPY BIRTHDAY','오늘의 주인공을 초대합니다','#813c68','#ffc6df','#fff4fa','♥','celebration-table.webp'],
  ['웨딩·기념일','OUR DAY','소중한 시작을 함께해 주세요','#6b5b52','#d8c1ad','#fbf8f4','♡','celebration-table.webp'],
  ['SNS 홍보','TREND NOW','지금 가장 주목할 이야기','#131313','#65e6c4','#f3fffb','#','iridescent-modern.webp'],
  ['사진 콜라주','MEMORY WALL','우리의 장면을 한 장에','#334155','#f6a5a5','#fff8f7','▦','vintage-camera.webp'],
  ['여행·관광','TRAVEL NOTE','새로운 풍경을 만나러 갑니다','#175a6f','#f0b35a','#f3fbfc','✈','coastal-travel.webp'],
  ['계절·시즌','SEASON STORY','계절이 머무는 순간','#315b4b','#f1c98e','#f9fbf6','❀','coastal-travel.webp'],
  ['명절·기념일','WITH LOVE','마음을 전하는 따뜻한 날','#8b2635','#d7aa58','#fff9ef','福','celebration-table.webp'],
  ['심플·미니멀','LESS IS MORE','간결하게 전하는 메시지','#171717','#b7b7b7','#ffffff','—','iridescent-modern.webp'],
  ['프리미엄','SIGNATURE','가치를 빛내는 단 하나의 선택','#111217','#cba66b','#f7f2e9','B','premium-boutique.webp'],
  ['감성·빈티지','OLD DAYS','천천히 오래 남는 기록','#5c4636','#bf8a63','#f1e5d2','✣','vintage-camera.webp'],
] as const

const posterAsset = (fileName:string) => `${import.meta.env.BASE_URL}poster-assets/${fileName}`

const base = (kind: PosterElement['kind'], id: string, name: string, x: number, y: number, width: number, height: number) => ({
  kind, id, name, x, y, width, height, rotation:0, opacity:1, visible:true, locked:false,
})

const text = (id:string, name:string, value:string, x:number, y:number, width:number, height:number, fontSize:number, fill:string, fontFamily='Noto Sans KR', align:PosterTextElement['align']='left', fontStyle:PosterTextElement['fontStyle']='bold'): PosterTextElement => ({
  ...base('text',id,name,x,y,width,height), kind:'text', text:value, fontFamily, fontSize, fontStyle, fill, align, letterSpacing:0, lineHeight:1.12, stroke:'transparent', strokeWidth:0, shadowColor:'#000000', shadowBlur:0, background:'transparent', underline:false,
})

const shape = (id:string, name:string, shapeType:'rect'|'circle'|'line'|'banner', x:number, y:number, width:number, height:number, fill:string, radius=0): PosterElement => ({
  ...base('shape',id,name,x,y,width,height), shape:shapeType, fill, stroke:'transparent', strokeWidth:0, radius,
}) as PosterElement

const slot = (id:string, name:string, x:number, y:number, width:number, height:number, rotation=0): PosterImageElement => ({
  ...base('image',id,name,x,y,width,height), kind:'image', src:'', isSlot:true, mask:'rect', rotation,
  zoom:1, offsetX:0, offsetY:0, flipX:false, flipY:false, brightness:0, contrast:0, saturation:0, filter:'none',
})

const templatesWithCustomArtwork: Record<number, { name:string; file:string; title:string; accent:string }> = {
  0: { name:'시트러스 서머', file:'poster-citrus.jpg', title:'여름의 조각', accent:'#123f3c' },
  3: { name:'크림 라테', file:'poster-latte.jpg', title:'Cream Latte', accent:'#3e2c22' },
  12: { name:'바다가 있는 길', file:'coastal-travel.webp', title:'바다가 있는 길', accent:'#122e45' },
}

function makeTemplate(categoryIndex:number, variant:number): PosterTemplate {
  const [category, headline, subline, dark, accent, light, , assetFile] = categories[categoryIndex]
  const size = posterSizes[variant === 2 ? 'a4-landscape' : 'a4-portrait']
  const { width:w, height:h } = size
  const id = `tpl-${categoryIndex + 1}-${variant + 1}`
  const layer = (key:string) => `${id}-${key}`
  const frame = variant === 1
  const scrapbook = frame && (categoryIndex === 11 || categoryIndex === 17)
  const oak = frame && (categoryIndex === 9 || categoryIndex === 16)
  const artwork = variant === 0 ? templatesWithCustomArtwork[categoryIndex] : undefined
  let name = artwork?.name ?? `${category} ${['포스터','액자','에디토리얼'][variant]}`
  let backgroundFile = artwork?.file ?? assetFile
  let elements: PosterElement[]

  if (scrapbook) {
    name = categoryIndex === 11 ? '사진 일기 · 4컷' : '오래된 장면 · 4컷'
    backgroundFile = 'poster-scrapbook.jpg'
    const photos = [
      slot(layer('photo-1'),'사진 1',w*.33,h*.37,w*.34,h*.24,-7),
      slot(layer('photo-2'),'사진 2',w*.68,h*.45,w*.30,h*.20,6),
      slot(layer('photo-3'),'사진 3',w*.31,h*.68,w*.32,h*.20,5),
      slot(layer('photo-4'),'사진 4',w*.65,h*.71,w*.31,h*.24,-8),
    ]
    elements = [
      text(layer('title'),'제목',categoryIndex === 11 ? '우리의 사진 일기' : '오래된 장면',w*.45,h*.13,w*.66,h*.09,53,'#243e84','Nanum Pen Script'),
      text(layer('sub'),'설명','오래 기억하고 싶은 순간들',w*.45,h*.195,w*.66,28,21,'#243e84','Gowun Batang','left','normal'),
      ...photos.flatMap((photo) => [
        { ...shape(`${photo.id}-mat`,'인화지','rect',photo.x,photo.y,photo.width + 18,photo.height + 18,'#fffdf6'), rotation:photo.rotation },
        photo,
      ]),
      text(layer('info'),'날짜','MOMENTS TO KEEP',w*.36,h*.91,w*.52,28,15,'#243e84'),
    ]
  } else if (oak) {
    name = categoryIndex === 16 ? '햇살 드는 오크 액자' : '우리의 하루 · 오크 액자'
    backgroundFile = 'poster-oak-frame.jpg'
    elements = [
      slot(layer('photo-1'),'액자 사진',w*.363,h*.479,w*.388,h*.388),
      text(layer('title'),'제목',categoryIndex === 16 ? '소중한 순간' : '우리의 하루',w*.48,h*.895,w*.82,h*.073,42,'#3e2d21','Gowun Batang','center'),
    ]
  } else if (frame) {
    const frameFill = categoryIndex % 3 === 0 ? dark : light
    const ink = frameFill === dark ? light : dark
    const photoY = categoryIndex % 2 ? .48 : .50
    elements = [
      { ...shape(layer('wash'),'배경 보정','rect',w/2,h/2,w,h,dark), opacity:.48, locked:true },
      shape(layer('mat'),'액자 여백','rect',w*.5,h*photoY,w*.77,h*.60,frameFill,3),
      slot(layer('photo-1'),'액자 사진',w*.5,h*(photoY-.022),w*.67,h*.49),
      text(layer('tag'),'상단 문구',category,w*.5,h*.10,w*.74,35,20,'#ffffff','Noto Sans KR','center'),
      text(layer('title'),'제목',headline,w*.5,h*(photoY+.25),w*.67,h*.064,34,ink,'Gowun Batang','center'),
      text(layer('sub'),'설명',subline,w*.5,h*.90,w*.78,50,22,'#ffffff','Noto Sans KR','center','normal'),
    ]
  } else if (artwork) {
    const latte = categoryIndex === 3
    const travel = categoryIndex === 12
    const align = latte ? 'center' : 'left'
    const x = latte ? .5 : .52
    elements = [
      text(layer('tag'),'상단 문구',category,w*x,h*.105,w*.80,32,18,artwork.accent,'Noto Sans KR',align),
      text(layer('title'),'제목',artwork.title,w*x,h*.205,w*.80,h*.115,latte ? 69 : 75,artwork.accent,'Gowun Batang',align),
      text(layer('sub'),'설명',latte ? '부드러운 크림과 깊은 에스프레소' : subline,w*x,h*.295,w*.80,32,22,artwork.accent,'Noto Sans KR',align,'normal'),
      { ...text(layer('info'),'상세 안내',latte ? 'SEASONAL MENU  /  ₩ 6,500' : 'BARABOM STUDIO',w*x,h*.922,w*.80,40,18,latte ? artwork.accent : '#ffffff','Noto Sans KR',align), shadowBlur:travel ? 9 : 0 },
    ]
  } else if (variant === 2) {
    const rightSide = categoryIndex % 2 === 1
    const center = rightSide ? .76 : .24
    const serif = categoryIndex % 3 === 0
    elements = [
      shape(layer('panel'),'편집 면','rect',w*center,h/2,w*.48,h,dark),
      text(layer('tag'),'상단 문구',category,w*center,h*.15,w*.37,42,23,accent,'Noto Sans KR'),
      shape(layer('line'),'구분선','rect',w*center,h*.236,w*.37,2,accent),
      text(layer('title'),'제목',headline,w*center,h*.42,w*.37,h*.26,57,light,serif ? 'Gowun Batang' : 'Black Han Sans'),
      text(layer('sub'),'설명',subline,w*center,h*.65,w*.37,72,24,light,'Noto Sans KR','left','normal'),
      text(layer('info'),'상세 안내','BARABOM STUDIO',w*center,h*.87,w*.37,32,17,accent),
    ]
  } else {
    const bottom = categoryIndex % 2 === 0
    const center = categoryIndex % 3 === 1
    const serif = categoryIndex % 3 === 2
    const align = center ? 'center' : 'left'
    const titleY = bottom ? .76 : .225
    elements = [
      { ...shape(layer('wash'),'배경 보정','rect',w/2,h/2,w,h,'#101526'), opacity:.22, locked:true },
      { ...shape(layer('panel'),'문구 배경','rect',w*.5,h*(bottom ? .79 : .24),w*.89,h*.35,dark,2), opacity:.89 },
      text(layer('tag'),'상단 문구',category,w*.5,h*(titleY-.11),w*.75,33,20,light,'Noto Sans KR',align),
      text(layer('title'),'제목',headline,w*.5,h*titleY,w*.75,h*.13,headline.length > 12 ? 53 : 70,light,serif ? 'Gowun Batang' : 'Black Han Sans',align),
      text(layer('sub'),'설명',subline,w*.5,h*(titleY+.098),w*.75,40,23,light,'Noto Sans KR',align,'normal'),
      text(layer('info'),'상세 안내','BARABOM STUDIO',w*.5,h*(titleY+.153),w*.75,28,16,light,'Noto Sans KR',align),
    ]
  }

  return {
    id, name, category, kind:frame ? 'frame' : 'poster',
    tags:[category,headline,'포스터',variant === 2 ? '가로' : '세로'],
    recommended:Boolean(artwork || (scrapbook && categoryIndex === 11) || (oak && categoryIndex === 16)),
    size:{...size},
    background:{ type:'image', color:light, secondary:accent, imageSrc:posterAsset(backgroundFile), opacity:1 },
    elements,
  }
}

const extraFrames = [
  { id:'gallery-frame', name:'모노 갤러리 · 1컷', category:'프리미엄', file:'poster-gallery-frame.jpg', color:'#efebe5' },
  { id:'botanical-frame', name:'보태니컬 타원 액자', category:'웨딩·기념일', file:'poster-botanical-paper.jpg', color:'#f4eddf' },
  { id:'polaroid-duo', name:'폴라로이드 듀오 · 2컷', category:'사진 콜라주', file:'poster-scrapbook.jpg', color:'#f5e9d3' },
  { id:'film-strip', name:'필름 스트립 · 3컷', category:'감성·빈티지', file:'vintage-camera.webp', color:'#201d1b' },
] as const

function makeExtraFrame(design: typeof extraFrames[number]): PosterTemplate {
  const {id, name, category, file, color} = design
  const size = posterSizes['a4-portrait']
  const {width:w, height:h} = size
  const layer = (key:string) => `${id}-${key}`
  let elements: PosterElement[]

  if (id === 'gallery-frame') {
    elements = [
      text(layer('title'),'제목','모노 갤러리',w*.5,h*.095,w*.8,60,41,'#292421','Gowun Batang','center'),
      slot(layer('photo'),'갤러리 사진',w*.5,h*.50,w*.42,h*.394),
      text(layer('sub'),'설명','오래 바라보고 싶은 장면',w*.5,h*.927,w*.8,40,21,'#292421','Noto Sans KR','center','normal'),
    ]
  } else if (id === 'botanical-frame') {
    elements = [
      text(layer('title'),'제목','우리의 계절',w*.5,h*.13,w*.78,80,66,'#445341','Nanum Pen Script','center'),
      { ...slot(layer('photo'),'타원형 사진',w*.478,h*.466,w*.763,h*.477), mask:'oval' },
      text(layer('sub'),'설명','함께여서 더 아름다운 순간',w*.54,h*.83,w*.70,62,28,'#445341','Gowun Batang','center','normal'),
    ]
  } else if (id === 'polaroid-duo') {
    const photos = [
      slot(layer('photo-1'),'사진 1',w*.375,h*.365,w*.51,h*.265,-9),
      slot(layer('photo-2'),'사진 2',w*.62,h*.66,w*.51,h*.265,8),
    ]
    elements = [
      text(layer('title'),'제목','둘이서, 오늘',w*.43,h*.115,w*.68,84,63,'#243e84','Nanum Pen Script'),
      ...photos.flatMap((photo) => [
        {
          ...shape(`${photo.id}-mat`,'폴라로이드 종이','rect',photo.x,photo.y + 16,photo.width + 28,photo.height + 54,'#fffdf4'),
          rotation:photo.rotation,
        },
        photo,
      ]),
      text(layer('sub'),'메모','오늘의 장면을 기억해요.',w*.54,h*.925,w*.7,50,31,'#243e84','Nanum Pen Script','center'),
    ]
  } else {
    const holeRows = Array.from({length:12}, (_, index) => .22 + index * .0515)
    elements = [
      { ...shape(layer('shade'),'배경 보정','rect',w/2,h/2,w,h,'#201b19'), opacity:.83, locked:true },
      text(layer('title'),'제목','FILM NOTES',w*.5,h*.109,w*.85,72,61,'#fff0d5','Black Han Sans','center'),
      shape(layer('strip'),'필름 바탕','rect',w*.5,h*.505,w*.79,h*.64,'#171615',5),
      ...holeRows.flatMap((y, index) => [.133,.867].map((x, edge) => (
        shape(layer(`hole-${index}-${edge}`),'필름 구멍','rect',w*x,h*y,w*.027,h*.016,'#cab18d',2)
      ))),
      ...[.299, .505, .711].map((y, index) => slot(layer(`photo-${index + 1}`),`사진 ${index + 1}`,w*.5,h*y,w*.65,h*.189)),
      text(layer('sub'),'메모','기억에 남은 세 장면',w*.5,h*.90,w*.73,40,25,'#fff0d5','Gowun Batang','center'),
    ]
  }

  return {
    id, name, category, kind:'frame', tags:[category,'액자','세로'], recommended:true,
    size:{...size},
    background:{type:'image',color,secondary:color,imageSrc:posterAsset(file),opacity:1},
    elements,
  }
}

export const posterTemplates: PosterTemplate[] = [
  ...categories.flatMap((_, categoryIndex) => [0,1,2].map((variant) => makeTemplate(categoryIndex, variant))),
  ...extraFrames.map(makeExtraFrame),
]
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
