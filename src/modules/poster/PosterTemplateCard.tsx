import type { CSSProperties } from 'react'
import type { PosterElement, PosterSize, PosterTemplate } from './types'
import './poster-templates.css'

const layerBounds = (element: PosterElement, size: PosterSize): CSSProperties => ({
  left: `${100 * element.x / size.width}%`,
  top: `${100 * element.y / size.height}%`,
  width: `${100 * element.width / size.width}%`,
  height: `${100 * element.height / size.height}%`,
  opacity: element.opacity,
  transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
})

export function PosterTemplateCard({ template, active, onApply }: {
  template: PosterTemplate
  active: boolean
  onApply: () => void
}) {
  const {background, elements, name, size} = template
  const slotCount = elements.filter((element) => element.kind === 'image' && element.isSlot).length
  return (
    <button type="button" className="poster-design-card" aria-pressed={active} onClick={onApply}>
      <span className="poster-design-card-mat" aria-hidden="true">
        <span className="poster-design-art" style={{
          aspectRatio: `${size.width} / ${size.height}`,
          background: background.color,
        }}>
          <img src={background.imageSrc} alt="" loading="lazy" decoding="async" />
          {elements.filter((element) => element.visible).map((element) => {
            const bounds = layerBounds(element, size)
            if (element.kind === 'shape') {
              return <span className="poster-design-layer" key={element.id} style={{
                ...bounds,
                background:element.fill,
                borderRadius:`${100 * element.radius / size.width}cqw`,
              }} />
            }
            if (element.kind === 'text') {
              return <span className="poster-design-layer poster-design-text" key={element.id} style={{
                ...bounds,
                color:element.fill,
                fontFamily:element.fontFamily,
                fontSize:`${100 * element.fontSize / size.width}cqw`,
                fontWeight:element.fontStyle.includes('bold') ? 700 : 400,
                textAlign:element.align,
                lineHeight:element.lineHeight,
              }}>{element.text}</span>
            }
            if (element.kind === 'image' && element.isSlot) {
              return <span className="poster-design-layer poster-design-slot" key={element.id} style={{
                ...bounds,
                borderRadius: element.mask === 'oval' || element.mask === 'circle' ? '50%' : undefined,
              }}>+</span>
            }
            return null
          })}
        </span>
      </span>
      <span className="poster-design-caption">
        <strong>{name}</strong>
        <span>{slotCount ? `사진 칸 ${slotCount}개` : size.width > size.height ? '가로 포스터' : '세로 포스터'}</span>
      </span>
    </button>
  )
}
