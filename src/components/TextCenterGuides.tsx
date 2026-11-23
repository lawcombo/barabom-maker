import { useCallback, useEffect, useRef, useState } from 'react'
import type Konva from 'konva'
import { Line } from 'react-konva'

const hidden = { vertical: false, horizontal: false }
const snapDistancePx = 6
const releaseDistancePx = 12
type Point = { x: number; y: number }

export function useTextCenterGuides(width: number, height: number, scale: number) {
  const [axes, setAxes] = useState(hidden)
  const snapped = useRef(hidden)
  const clear = useCallback(() => {
    snapped.current = hidden
    setAxes(hidden)
  }, [])

  useEffect(() => {
    window.addEventListener('blur', clear)
    return () => window.removeEventListener('blur', clear)
  }, [clear])

  function boundPosition(this: Konva.Node, proposed: Point, event?: Event): Point {
    const mouse = event && (event.type.startsWith('mouse') || ('pointerType' in event && event.pointerType === 'mouse'))
    if (!mouse) return proposed

    const group = this as Konva.Group
    const text = group.findOne('Text')
    const layer = group.getLayer()
    if (!text || !layer) return proposed

    const layerTransform = layer.getAbsoluteTransform()
    const toLayer = layerTransform.copy().invert()
    const proposedOrigin = toLayer.point(proposed)
    const currentOrigin = toLayer.point(group.getAbsolutePosition())
    const bounds = text.getClientRect({ relativeTo: layer, skipStroke: true, skipShadow: true })
    // Measure the proposed center from the pointer position, before applying either snap.
    const dx = width / 2 - (bounds.x + bounds.width / 2 + proposedOrigin.x - currentOrigin.x)
    const dy = height / 2 - (bounds.y + bounds.height / 2 + proposedOrigin.y - currentOrigin.y)
    const previous = snapped.current
    const vertical = Math.abs(dx) * scale <= (previous.vertical ? releaseDistancePx : snapDistancePx)
    const horizontal = Math.abs(dy) * scale <= (previous.horizontal ? releaseDistancePx : snapDistancePx)
    if (previous.vertical !== vertical || previous.horizontal !== horizontal) {
      snapped.current = { vertical, horizontal }
      setAxes(snapped.current)
    }
    if (!vertical && !horizontal) return proposed

    return layerTransform.point({
      x: proposedOrigin.x + (vertical ? dx : 0),
      y: proposedOrigin.y + (horizontal ? dy : 0),
    })
  }

  const style = { stroke: '#8b5cf6', strokeWidth: 1.5 / scale, dash: [5 / scale, 5 / scale], listening: false }
  const overlay = <>
    {axes.vertical && <Line name="text-center-guide" points={[width / 2, 0, width / 2, height]} {...style} />}
    {axes.horizontal && <Line name="text-center-guide" points={[0, height / 2, width, height / 2]} {...style} />}
  </>

  return { clear, boundPosition, overlay }
}
