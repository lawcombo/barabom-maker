import type { DesignTemplate, DesignedFrameLayout, LayoutRect } from '../types'

function slots(...areas: [number, number, number, number, LayoutRect['mask']?][]): LayoutRect[] {
  return areas.map(([x, y, width, height, mask], index) => ({id:`slot-${index}`, x, y, width, height, mask}))
}

function design({id, name, category, colors, topCaption, bottomCaption, layout, borderWidth=0, radius=0}: {
  id: string
  name: string
  category: string
  colors: DesignTemplate['colors']
  topCaption: string
  bottomCaption: string
  layout: DesignedFrameLayout
  borderWidth?: number
  radius?: number
}): DesignTemplate {
  return {
    id, name, category, colors, topCaption, bottomCaption, layout, borderWidth, radius,
    background:colors[0], borderColor:colors[2], padding:22, gap:12, pattern:'none', decoration:'',
  }
}

const art = (file: string) => `${import.meta.env.BASE_URL}fourcut-assets/${file}.jpg`
const cardTitle = {x:30, y:35, width:660, fontSize:46, fontFamily:'Gowun Batang'}
const cardFooter = {x:30, y:779, width:660, fontSize:34, fontFamily:'Gowun Batang'}
const fourGrid = () => slots([34,48,316,317],[370,48,316,317],[34,386,316,317],[370,386,316,317])

export const illustratedTemplates = [
  design({
    id:'frame-lemon-friends', name:'레몬색 소풍', category:'캐릭터',
    colors:['#f9e694','#5c451c','#fff4cf'], topCaption:'', bottomCaption:'오늘의 소풍',
    borderWidth:4, radius:42,
    layout:{
      label:'교차 믹스 4컷', orientation:'grid', illustration:art('lemon-friends'),
      slots:slots([34,48,316,317],[370,48,316,317,'oval'],[34,386,316,317,'oval'],[370,386,316,317]),
      title:cardTitle, footer:{x:365,y:786,width:320,fontSize:42,fontFamily:'Do Hyeon'},
    },
  }),
  design({
    id:'frame-mono-archive', name:'모노 아카이브', category:'심플',
    colors:['#101c19','#f4f4e9','#3a4741'], topCaption:'', bottomCaption:'MONO ARCHIVE',
    layout:{
      label:'정갈한 그리드 4컷', orientation:'grid', slots:fourGrid(),
      title:cardTitle, footer:{...cardFooter,fontSize:48,fontFamily:'Noto Sans KR'},
    },
  }),
  design({
    id:'frame-blue-aquarium', name:'유리빛 바다', category:'시즌',
    colors:['#17699a','#effaff','#e8feff'], topCaption:'', bottomCaption:'파도 아래의 하루',
    borderWidth:3, radius:12,
    layout:{
      label:'바다 그리드 4컷', orientation:'grid', illustration:art('blue-aquarium'),
      slots:slots([56,125,295,266],[369,125,295,266],[56,411,295,266],[369,411,295,266]),
      title:cardTitle, footer:{...cardFooter,y:739,fontSize:39,fontFamily:'Nanum Pen Script'},
    },
  }),
  design({
    id:'frame-wedding-vows', name:'웨딩 인비테이션', category:'기념일',
    colors:['#fffcf7','#703e35','#e6ddd3'], topCaption:'우리의 결혼식', bottomCaption:'신랑 이름  ·  신부 이름',
    borderWidth:2,
    layout:{
      label:'비대칭 웨딩 4컷', orientation:'grid',
      slots:slots([33,115,317,340],[370,115,317,231],[33,472,317,235],[370,363,317,344]),
      title:cardTitle, footer:{...cardFooter,y:756,fontSize:36},
    },
  }),
  design({
    id:'frame-pet-clouds', name:'구름 위 반려일기', category:'라이프',
    colors:['#a8d4f5','#244c6f','#fff7c2'], topCaption:'MY LITTLE CLOUD', bottomCaption:'늘 함께하는 우리',
    borderWidth:6,
    layout:{
      label:'구름형 3컷', orientation:'portrait', illustration:art('pet-clouds'),
      slots:slots([38,96,324,250,'scallop'],[38,416,324,250,'scallop'],[38,736,324,250,'scallop']),
      title:{x:24,y:29,width:352,fontSize:23,fontFamily:'Do Hyeon'},
      footer:{x:22,y:1050,width:356,fontSize:36,fontFamily:'Nanum Pen Script'},
    },
  }),
  design({
    id:'frame-moonlit-skies', name:'달빛 하늘', category:'파스텔',
    colors:['#596ab3','#fff5e8','#f9e3f3'], topCaption:'달빛에 남긴\n우리의 순간', bottomCaption:'MOONLIT MEMORIES',
    borderWidth:3, radius:3,
    layout:{
      label:'엇갈림 콜라주 4컷', orientation:'grid', illustration:art('moonlit-skies'),
      slots:slots([30,211,311,286],[379,48,311,286],[30,515,311,286],[379,352,311,286]),
      title:{x:32,y:55,width:320,fontSize:48,fontFamily:'Nanum Pen Script',align:'left'},
      footer:{x:366,y:786,width:326,fontSize:20,fontFamily:'Noto Sans KR'},
    },
  }),
  design({
    id:'frame-birthday-bakery', name:'딸기 케이크 생일', category:'이벤트',
    colors:['#ffdce5','#8a244c','#fff5e1'], topCaption:'생일 축하해!', bottomCaption:'오늘의 주인공은 너',
    borderWidth:4, radius:9,
    layout:{
      label:'생일 포토 스트립 4컷', orientation:'portrait', illustration:art('birthday-bakery'),
      slots:slots([48,170,304,216],[48,400,304,216],[48,630,304,216],[48,860,304,216]),
      title:{x:31,y:86,width:239,fontSize:42,fontFamily:'Do Hyeon'},
      footer:{x:24,y:1099,width:352,fontSize:31,fontFamily:'Do Hyeon'},
    },
  }),
]
