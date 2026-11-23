import { ARTBOARD, getLayoutRects, scallopOutline } from '../data/layouts'
import type { DesignTemplate, FrameCaption, Orientation } from '../types'
import './fourcut-templates.css'

function PreviewCaption({ text, caption, color }: { text: string; caption: FrameCaption; color: string }) {
  const left = caption.align === 'left'
  const x = left ? caption.x : caption.x + caption.width / 2
  return (
    <text x={x} y={caption.y} fill={color} dominantBaseline="text-before-edge"
      textAnchor={left ? 'start' : 'middle'} fontSize={caption.fontSize} fontFamily={caption.fontFamily} fontWeight={700}>
      {text.split('\n').map((line, index) => <tspan key={index} x={x} dy={index === 0 ? 0 : caption.fontSize * 1.12}>{line}</tspan>)}
    </text>
  )
}

export function FourcutTemplateCard({template, orientation, cutCount, active, onApply}: {
  template: DesignTemplate
  orientation: Orientation
  cutCount: number
  active: boolean
  onApply: () => void
}) {
  const layout = template.layout
  const {width, height} = ARTBOARD[layout?.orientation ?? orientation]
  const slots = layout?.slots ?? getLayoutRects(cutCount, orientation, template.padding, template.gap)
  const title = layout?.title ?? {x:20,y:18,width:width-40,fontSize:15,fontFamily:'Noto Sans KR'}
  const footer = layout?.footer ?? {x:24,y:height-48,width:width-48,fontSize:18,fontFamily:'Gaegu'}
  const ink = template.colors[1]
  const fill = layout ? '#fffdf4' : template.colors[2]
  const stroke = template.borderWidth ? template.borderColor : 'none'
  return (
    <button type="button" className="fourcut-template-card" aria-pressed={active} onClick={onApply}>
      <span className="fourcut-template-art" aria-hidden="true">
        <svg viewBox={`0 0 ${width} ${height}`}>
          <rect width={width} height={height} fill={template.background} />
          {layout?.illustration && <image href={layout.illustration} width={width} height={height} preserveAspectRatio="none" />}
          {!layout && template.decoration && <text x={width*.5} y={height*.60} textAnchor="middle" fill={ink} opacity={.18} fontSize={Math.min(width,height)*.8}>{template.decoration}</text>}
          {slots.map((slot) => {
            if (slot.mask === 'scallop') {
              const points = scallopOutline.map(([x,y]) => `${slot.x+x*slot.width},${slot.y+y*slot.height}`).join(' ')
              return <polygon key={slot.id} points={points} fill={fill} stroke={stroke} strokeWidth={template.borderWidth} />
            }
            if (slot.mask === 'oval') {
              return <ellipse key={slot.id} cx={slot.x+slot.width/2} cy={slot.y+slot.height/2} rx={slot.width/2} ry={slot.height/2}
                fill={fill} stroke={stroke} strokeWidth={template.borderWidth} />
            }
            return <rect key={slot.id} x={slot.x} y={slot.y} width={slot.width} height={slot.height} rx={template.radius}
              fill={fill} stroke={stroke} strokeWidth={template.borderWidth} />
          })}
          <PreviewCaption text={template.topCaption} caption={title} color={ink} />
          <PreviewCaption text={template.bottomCaption} caption={footer} color={ink} />
        </svg>
      </span>
      <span className="fourcut-template-caption"><strong>{template.name}</strong><span>{layout?.label ?? template.category}</span></span>
    </button>
  )
}
