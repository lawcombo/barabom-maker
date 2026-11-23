import type { PosterElement, PosterPreset, PosterSize, PosterTextElement } from './types'

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

export const posterAsset = (fileName:string) => `${import.meta.env.BASE_URL}poster-assets/${fileName}`

export const base = (kind: PosterElement['kind'], id: string, name: string, x: number, y: number, width: number, height: number) => ({
  kind, id, name, x, y, width, height, rotation:0, opacity:1, visible:true, locked:false,
})

export const text = (id:string, name:string, value:string, x:number, y:number, width:number, height:number, fontSize:number, fill:string, fontFamily='Noto Sans KR', align:PosterTextElement['align']='left', fontStyle:PosterTextElement['fontStyle']='bold'): PosterTextElement => ({
  ...base('text',id,name,x,y,width,height), kind:'text', text:value, fontFamily, fontSize, fontStyle, fill, align, letterSpacing:0, lineHeight:1.12, stroke:'transparent', strokeWidth:0, shadowColor:'#000000', shadowBlur:0, background:'transparent', underline:false,
})

export const shape = (id:string, name:string, shapeType:'rect'|'circle'|'line'|'banner', x:number, y:number, width:number, height:number, fill:string, radius=0): PosterElement => ({
  ...base('shape',id,name,x,y,width,height), shape:shapeType, fill, stroke:'transparent', strokeWidth:0, radius,
}) as PosterElement
