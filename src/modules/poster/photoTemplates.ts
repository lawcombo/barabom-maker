import { block, body, centered, copy, disc, posterAsset, posterSizes, slot } from './templateParts'
import type { PosterElement, PosterMask, PosterPreset, PosterTemplate } from './types'

const display = 'Black Han Sans'
const serif = 'Gowun Batang'
const rounded = 'Jua'
const cream = '#fff9ed'

function photo(name: string, x: number, y: number, width: number, height: number, mask: PosterMask = 'rect', rotation = 0) {
  return { ...slot(name, name, x + width / 2, y + height / 2, width, height, rotation), mask }
}

function photoPoster(
  id: string, name: string, category: string, color: string, elements: PosterElement[],
  { preset = 'a4-portrait', backdrop }: { preset?: PosterPreset; backdrop?: string } = {},
): PosterTemplate {
  return {
    id, name, category, kind: 'frame', tags: [name, category, '사진 포스터'], recommended: true,
    size: posterSizes[preset],
    background: {
      type: backdrop ? 'image' : 'color', color, secondary: color,
      imageSrc: backdrop ? posterAsset(backdrop) : '', opacity: 1,
    },
    elements,
  }
}

function flower(name: string, x: number, y: number, size: number, petals: string, center: string) {
  const petalSize = size * .45
  return [
    ...Array.from({ length: 5 }, (_, index) => {
      const angle = index * 2 * Math.PI / 5 - Math.PI / 2
      return disc(`${name} 꽃잎 ${index + 1}`, x + size * .27 * Math.cos(angle) - petalSize / 2,
        y + size * .27 * Math.sin(angle) - petalSize / 2, petalSize, petals)
    }),
    disc(`${name} 꽃술`, x - size * .17, y - size * .17, size * .34, center),
  ]
}

const easel = { x: 166, y: 143, width: 380, height: 484 }
const gallery = { x: 145, y: 134, width: 431, height: 589 }

export const photoPosterTemplates = [
  photoPoster('welcome-easel', '웨딩 웰컴 이젤', '웨딩·기념일', '#e9d9c2', [
    photo('웨딩 사진', easel.x, easel.y, easel.width, easel.height),
    { ...block('사진 하단 음영', easel.x, easel.y + easel.height - 205, easel.width, 205, '#231a15'), opacity: .58 },
    copy('환영 문구', '함께 맞는 오늘', easel.x + 12, easel.y + easel.height - 194, easel.width - 24, 91, 60, cream,
      { ...centered, font: 'Nanum Pen Script' }),
    copy('신랑 · 신부 이름', '지훈  ·  서연', easel.x + 12, easel.y + easel.height - 101, easel.width - 24, 46, 30, cream,
      { ...centered, font: serif }),
    copy('예식 날짜', '2027. 04. 17.', easel.x + 12, easel.y + easel.height - 55, easel.width - 24, 37, 20, cream, centered),
  ], { backdrop: 'poster-wedding-easel.jpg' }),
  photoPoster('parents-bouquet', '꽃 한 다발 · 어버이날', '명절·기념일', '#ffdfdf', [
    block('하단 색면', 0, 843, 720, 175, '#fff3e8'),
    copy('상단 문구', '고마운 마음을 꽃에 담아요', 68, 41, 584, 56, 28, '#94362f', centered),
    copy('제목', '어버이날엔\n꽃 한 다발', 61, 106, 598, 201, 77, '#ba252c', { ...centered, font: rounded }),
    { ...block('붉은 종이 테두리', 89, 304, 542, 552, '#ce3036', 51), rotation: -3 },
    photo('가족 또는 꽃다발 사진', 108, 322, 506, 504, 'round'),
    ...flower('왼쪽 노란 꽃', 100, 348, 151, '#ffca47', '#be3032'),
    ...flower('왼쪽 하늘색 꽃', 70, 497, 106, '#95d9da', '#213a72'),
    ...flower('오른쪽 노란 꽃', 626, 749, 125, '#ffca47', '#213a72'),
    { ...block('편지 바탕', 252, 788, 398, 132, '#a7d9d7', 12), rotation: -3 },
    copy('감사 인사', '사랑하고 감사합니다.\n오늘은 제가 꽃을 드릴게요.', 267, 801, 366, 100, 25, '#213a62', centered),
    copy('예약과 문의', '꽃다발 예약  |  바라봄 꽃집 02-000-0000', 60, 934, 600, 57, 23, '#622c32', centered),
  ]),
  photoPoster('family-magazine', '우리 가족 매거진 · 3컷', '사진 콜라주', '#f6eedc', [
    copy('기록 종류', 'FAMILY ALBUM', 45, 36, 620, 40, 20, '#6e593c'),
    copy('제목', '우리 가족의 봄', 45, 81, 630, 114, 69, '#3c3023', { font: serif }),
    block('상단 줄', 45, 210, 630, 2, '#ac987d'),
    photo('왼쪽 큰 사진', 45, 240, 354, 591),
    photo('오른쪽 위 사진', 417, 240, 258, 285),
    photo('오른쪽 아래 사진', 417, 545, 258, 286),
    block('하단 줄', 45, 855, 630, 2, '#ac987d'),
    copy('사진 설명', '함께한 봄날의 세 장면', 45, 879, 392, 69, 25, '#3c3023'),
    copy('날짜', '2027. 04.', 448, 879, 227, 69, 26, '#3c3023', { align: 'right' }),
  ]),
  photoPoster('bronze-gallery-wall', '브론즈 갤러리 벽걸이', '프리미엄', '#54483c', [
    photo('전시 작품 사진', gallery.x, gallery.y, gallery.width, gallery.height),
    block('작품 라벨', 244, 768, 232, 101, '#f1e7d3', 4),
    copy('작품 제목', '오후의 빛', 255, 778, 210, 40, 26, '#32291f', { ...centered, font: serif }),
    copy('작품 설명', 'BARABOM COLLECTION', 255, 819, 210, 29, 13, '#32291f', centered),
  ], { backdrop: 'poster-gallery-rail.jpg' }),
  photoPoster('event-photo-journal', '현장 스케치 · 3컷', '행사·이벤트', '#fff4d4', [
    block('정보 색면', 0, 0, 300, 720, '#166658'),
    copy('행사 이름', '동네 창작 마켓', 31, 39, 240, 53, 22, '#d6ffcb'),
    copy('제목', '현장\n스케치', 30, 106, 240, 210, 77, '#fff4d4', { font: display }),
    copy('소개', '기억에 남은 하루를\n사진으로 전합니다.', 34, 335, 234, 91, 23, '#f5ffdb', body),
    block('날짜 구분선', 34, 537, 232, 2, '#8cdab3'),
    copy('행사 날짜', '6.20 SAT', 34, 551, 232, 71, 34, '#fff4d4', { font: display }),
    photo('현장 큰 사진', 331, 30, 657, 365),
    photo('현장 왼쪽 사진', 331, 413, 320, 277),
    photo('현장 오른쪽 사진', 669, 413, 319, 277),
  ], { preset: 'a4-landscape' }),
  photoPoster('signature-menu-photos', '시그니처 메뉴 보드 · 2컷', '카페·음식점', '#f9eada', [
    copy('매장 이름', '바라봄 키친', 44, 37, 632, 48, 24, '#856249', centered),
    copy('메뉴판 제목', '오늘의 추천', 44, 91, 632, 114, 73, '#46261e', { ...centered, font: serif }),
    photo('왼쪽 메뉴 사진', 45, 240, 306, 385, 'round'),
    photo('오른쪽 메뉴 사진', 369, 240, 306, 385, 'round'),
    copy('왼쪽 메뉴 이름', '크림 라테', 45, 659, 306, 61, 34, '#46261e', { ...centered, font: serif }),
    copy('오른쪽 메뉴 이름', '레몬 케이크', 369, 659, 306, 61, 34, '#46261e', { ...centered, font: serif }),
    copy('왼쪽 메뉴 가격', '₩ 6,500', 45, 740, 306, 61, 32, '#75452f', centered),
    copy('오른쪽 메뉴 가격', '₩ 7,000', 369, 740, 306, 61, 32, '#75452f', centered),
    block('안내 구분선', 45, 850, 630, 2, '#c29e84'),
    copy('메뉴 안내', '매일 준비한 수량만 판매합니다.', 45, 873, 630, 70, 24, '#75452f', centered),
  ]),
  photoPoster('lookbook-diptych', '컬렉션 룩북 · 2컷', '매장 홍보', '#e7eaf4', [
    copy('매장 이름', 'BARABOM SELECT', 56, 31, 608, 57, 23, '#263967'),
    photo('메인 상품 사진', 56, 106, 443, 574),
    photo('상품 디테일 사진', 520, 378, 144, 302),
    copy('번호', '01', 517, 240, 147, 114, 78, '#263967', { font: serif, align: 'right' }),
    copy('제목', '새 계절의 취향', 56, 711, 608, 118, 63, '#202e53', { font: serif }),
    block('구분선', 56, 838, 608, 2, '#8998b5'),
    copy('컬렉션 소개', '오래 곁에 두고 싶은 생활 소품', 56, 861, 608, 52, 28, '#202e53'),
    copy('매장 안내', '매일 11:00–19:00  ·  골목길 12', 56, 923, 608, 53, 22, '#405785', body),
  ]),
  photoPoster('sale-product-hero', '주말 특가 · 제품 사진', '할인·세일', '#ffe064', [
    block('상단 색면', 0, 0, 720, 196, '#311934'),
    copy('제목', '주말 특가', 43, 36, 634, 121, 89, '#ffea70', { font: display }),
    photo('할인 상품 사진', 42, 219, 636, 566, 'round'),
    disc('할인율 스티커', 473, 622, 204, '#ef5469'),
    copy('할인율', '30%', 486, 671, 178, 90, 65, '#311934', { ...centered, font: display }),
    copy('할인 대상', '선택 상품에 한해 최대 30% 할인', 44, 824, 632, 64, 31, '#311934'),
    copy('기간', '6.19–6.21  /  매장 방문 고객 한정', 44, 915, 632, 57, 25, '#311934'),
  ]),
  photoPoster('exhibition-key-image', '전시 키 비주얼', '공연·전시', '#20192f', [
    photo('전시 대표 사진', 0, 0, 720, 755),
    { ...block('사진 글자 음영', 0, 534, 720, 221, '#1e172d'), opacity: .72 },
    copy('전시 유형', 'PHOTO & MEDIA EXHIBITION', 44, 555, 632, 45, 20, '#d8bcf4'),
    copy('전시 제목', '빛과 잔상', 41, 607, 638, 113, 82, '#fff6ff', { font: display }),
    block('하단 선', 44, 788, 632, 2, '#b08bd6'),
    copy('전시 기간', '6.13–7.12  /  18:00–22:00', 44, 812, 632, 56, 32, '#fff6ff'),
    copy('전시 장소', '바라봄 아트홀 B1  ·  월요일 휴관', 44, 895, 632, 59, 25, '#e6cdfc', body),
  ]),
  photoPoster('directions-with-photo', '찾아오시는 길 · 사진 안내', '공지사항', '#eff7f8', [
    block('상단 색면', 0, 0, 1018, 162, '#123f57'),
    copy('제목', '찾아오시는 길', 48, 33, 922, 99, 66, '#f4ffff', { font: display }),
    photo('건물 입구 또는 약도', 45, 194, 483, 470, 'round'),
    copy('장소', '바라봄 문화센터', 566, 221, 406, 82, 38, '#123f57', { font: serif }),
    copy('주소', '서울시 문화로 12  ·  2층', 568, 319, 400, 58, 24, '#123f57'),
    copy('이동 경로', '1번 출구에서 도보 5분\n정문 왼쪽 엘리베이터를 이용해 주세요.', 569, 395, 399, 138, 23, '#224760', body),
    block('구분선', 570, 557, 396, 2, '#a5c8d4'),
    copy('연락처', '문의 02-000-0000', 570, 571, 396, 70, 24, '#123f57'),
  ], { preset: 'a4-landscape' }),
  photoPoster('team-introduction', '우리 팀을 소개합니다', '채용·모집', '#e9f3d8', [
    block('채용 라벨', 46, 42, 219, 57, '#1f4f3b', 28),
    copy('상단 문구', '채용 안내', 54, 46, 204, 49, 24, '#f5ffe8', centered),
    copy('제목', '함께 일할 사람들', 45, 111, 634, 112, 61, '#173d2e', { font: display }),
    photo('팀 단체 사진', 46, 252, 628, 412, 'round'),
    copy('모집 포지션', '브랜드 디자이너  ·  1명', 48, 708, 626, 73, 37, '#173d2e', { font: serif }),
    copy('공고 설명', '함께 디자인하고 기록하는 일을 합니다.', 48, 805, 626, 58, 27, '#214b37', body),
    copy('지원 방법', '지원서  |  apply@example.com', 48, 911, 626, 57, 25, '#173d2e'),
  ]),
  photoPoster('class-showcase', '수업 결과 전시 · 3컷', '교육·학원', '#f3ecff', [
    disc('보라색 점', 550, 62, 103, '#d0b2f6'),
    disc('노란색 점', 580, 123, 84, '#ffe384'),
    copy('수업 이름', '어린이 미술 교실  ·  봄학기', 48, 51, 478, 55, 24, '#534083'),
    copy('제목', '우리의 첫 전시', 46, 120, 626, 118, 70, '#472b71', { font: rounded }),
    photo('대표 작품', 48, 267, 624, 299, 'round'),
    photo('왼쪽 작품', 48, 583, 302, 240, 'round'),
    photo('오른쪽 작품', 370, 583, 302, 240, 'round'),
    block('관람 정보 색면', 48, 853, 624, 113, '#503776', 16),
    copy('관람 안내', '6월 20일 토요일  ·  문화센터 전시장', 65, 870, 591, 78, 28, '#fff9ff', centered),
  ]),
  photoPoster('birthday-color-pop', '컬러팝 생일 포스터', '생일·파티', '#ffe687', [
    block('상단 색면', 0, 0, 720, 229, '#ffb8cd'),
    copy('상단 문구', '반짝이는 오늘의 주인공', 46, 33, 628, 55, 26, '#5d2870', centered),
    copy('제목', '생일 축하해!', 45, 91, 630, 118, 88, '#502575', { ...centered, font: rounded }),
    disc('사진 바탕', 100, 244, 520, '#fff8e2'),
    photo('생일 주인공 사진', 116, 260, 488, 488, 'circle'),
    disc('보라 장식', 57, 361, 85, '#a990fb'),
    disc('핑크 장식', 583, 591, 66, '#f18cb8'),
    copy('축하 이름', '지우의 생일 파티', 45, 781, 630, 82, 46, '#502575', { ...centered, font: rounded }),
    copy('파티 장소와 시간', '6월 20일 오후 3시  ·  바라봄 라운지', 46, 903, 628, 58, 24, '#502575', centered),
  ]),
  photoPoster('social-product-photo', '신제품 사진 · SNS', 'SNS 홍보', '#eef9d6', [
    photo('신제품 사진', 18, 18, 684, 864, 'round'),
    block('신상품 표시', 52, 56, 218, 59, '#e5f6b5', 30),
    copy('신상품 라벨', 'NEW ARRIVAL', 64, 62, 193, 45, 22, '#284432', centered),
    block('게시 문구 바탕', 49, 627, 622, 207, '#1e3530', 22),
    copy('제품 제목', '새 계절의 물건들', 71, 649, 575, 88, 53, '#f3ffe1', { font: display }),
    copy('구매 안내', '프로필 링크에서 만나 보세요  →', 74, 754, 571, 49, 25, '#f3ffe1'),
  ], { preset: 'feed' }),
  photoPoster('city-in-three', '한 도시 세 장면', '여행·관광', '#f9d9af', [
    copy('여행지', '해안 도시로 떠난 주말', 48, 33, 624, 55, 23, '#7f3d37'),
    copy('제목', '바람이 부는 곳', 46, 90, 628, 105, 69, '#323232', { font: serif }),
    photo('도시 대표 풍경', 48, 218, 624, 351),
    photo('여행 왼쪽 사진', 48, 588, 302, 241),
    photo('여행 오른쪽 사진', 370, 588, 302, 241),
    copy('여행 경로', '항구 산책 → 시장 골목 → 노을 전망대', 48, 858, 624, 65, 29, '#572a2b'),
    copy('여행 날짜', 'WEEKEND DIARY  /  06.20', 48, 930, 624, 50, 21, '#7f3d37'),
  ]),
  photoPoster('spring-window', '봄의 기록 · 타원 사진', '계절·시즌', '#e0eedc', [
    copy('제목', '봄의 기록', 52, 53, 616, 138, 84, '#21493c', { ...centered, font: serif }),
    copy('한 줄 소개', '다시 피어나는 것들을 모읍니다.', 53, 198, 614, 52, 25, '#31594a', centered),
    photo('봄 풍경 사진', 146, 275, 428, 528, 'oval'),
    ...flower('왼쪽 흰 꽃', 149, 669, 86, '#fffcee', '#d7a93a'),
    ...flower('오른쪽 흰 꽃', 564, 359, 99, '#fffcee', '#d7a93a'),
    copy('기록 문구', '2027 SPRING NOTES', 53, 845, 614, 57, 22, '#31594a', centered),
    copy('장소', '바라봄 정원', 55, 916, 610, 57, 28, '#21493c', { ...centered, font: serif }),
  ]),
  photoPoster('minimal-photo-print', '한 장의 사진 · 미니멀', '심플·미니멀', '#fcfaf5', [
    block('상단 선', 52, 63, 616, 2, '#292923'),
    copy('사진 분류', '사진에 담은 하루', 52, 74, 616, 57, 24, '#292923'),
    photo('메인 흑백 또는 컬러 사진', 52, 148, 616, 605),
    copy('제목', '어느 조용한 오후', 52, 768, 616, 102, 59, '#292923', { font: serif }),
    block('하단 선', 52, 880, 616, 2, '#292923'),
    copy('짧은 메모', '오래 기억하고 싶은 장면', 52, 894, 414, 53, 23, '#292923', body),
    copy('촬영 날짜', '2027. 04.', 476, 894, 192, 53, 22, '#292923', { align: 'right' }),
  ]),
  photoPoster('nostalgia-postcard', '스냅 엽서 · 빈티지', '감성·빈티지', '#503924', [
    { ...block('기울어진 엽서 종이', 76, 65, 568, 840, '#f9ecd0', 5), rotation: -3 },
    photo('엽서 사진', 105, 121, 506, 528, 'rect', -3),
    copy('제목', '오래된 엽서', 102, 668, 499, 97, 66, '#594028', { ...centered, font: 'Nanum Pen Script' }),
    copy('기록 내용', '좋았던 순간을 다시 꺼내 읽으며', 104, 766, 495, 59, 24, '#705236', centered),
    copy('받는 사람', 'TO. 우리가 기억하는 그날', 85, 940, 550, 43, 21, '#594028', centered),
  ], { backdrop: 'poster-scrapbook.jpg' }),
  photoPoster('monochrome-wedding-print', '모노톤 웨딩 프린트', '웨딩·기념일', '#fbf8f0', [
    photo('대표 웨딩 사진', 19, 19, 682, 771),
    { ...block('사진 아래 음영', 19, 588, 682, 202, '#1c1915'), opacity: .56 },
    copy('웨딩 제목', '함께하는 첫날', 44, 625, 632, 108, 85, cream, { ...centered, font: 'Nanum Pen Script' }),
    copy('신랑 · 신부 이름', '지훈  ·  서연', 44, 812, 632, 79, 44, '#372b24', { ...centered, font: serif }),
    copy('예식 날짜와 장소', '2027. 04. 17.  ·  바라봄 가든', 44, 914, 632, 62, 25, '#604c42', centered),
  ]),
  photoPoster('gold-mat-frame', '골드 매트 액자', '프리미엄', '#222d2a', [
    block('액자 바깥 선', 56, 62, 608, 746, '#c6a26c', 3),
    block('액자 안쪽 선', 62, 68, 596, 734, '#745e40', 2),
    block('매트지', 74, 80, 572, 710, '#f5eedc'),
    block('사진 가장자리', 134, 133, 452, 605, '#685339'),
    photo('프리미엄 액자 사진', 139, 138, 442, 595),
    copy('작품 제목', '우리가 사랑한 순간', 49, 827, 622, 77, 48, '#f5eedc', { ...centered, font: serif }),
    copy('작품 이름 또는 날짜', 'PRINT COLLECTION  /  2027', 49, 914, 622, 51, 20, '#cfaa77', centered),
  ]),
]
