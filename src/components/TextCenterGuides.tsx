import { useCallback, useEffect, useState } from 'react'
import type Konva from 'konva'
import { Line } from 'react-konva'

const hidden = { vertical: false, horizontal: false }
const guideDistancePx = 4

export function useTextCenterGuides(width: number, height: number, scale: number) {
  const [axes, setAxes] = useState(hidden)
  const clear = useCallback(() => setAxes(hidden), [])

  useEffect(() => {
    window.addEventListener('blur', clear)
    return () => window.removeEventListener('blur', clear)
  }, [clear])

  const update = (event: Event, group: Konva.Group) => {
    const mouse = event.type.startsWith('mouse') || ('pointerType' in event && event.pointerType === 'mouse')
    if (!mouse) return

    const text = group.findOne('Text')
    const layer = group.getLayer()
    if (!text || !layer) return
    const bounds = text.getClientRect({ relativeTo: layer, skipStroke: true, skipShadow: true })
    const distance = guideDistancePx / scale
    const vertical = Math.abs(bounds.x + bounds.width / 2 - width / 2) <= distance
    const horizontal = Math.abs(bounds.y + bounds.height / 2 - height / 2) <= distance
    setAxes((previous) => previous.vertical === vertical && previous.horizontal === horizontal
      ? previous
      : { vertical, horizontal })
  }

  const style = { stroke: '#8b5cf6', strokeWidth: 1.5 / scale, dash: [5 / scale, 5 / scale], listening: false }
  const overlay = <>
    {axes.vertical && <Line name="text-center-guide" points={[width / 2, 0, width / 2, height]} {...style} />}
    {axes.horizontal && <Line name="text-center-guide" points={[0, height / 2, width, height / 2]} {...style} />}
  </>

  return { clear, update, overlay }
}
