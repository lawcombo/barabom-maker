import { useEffect, useState, type ComponentProps } from 'react'
import { Text } from 'react-konva'
import { studioFontStack } from '../lib/studioFonts'

export function StudioCanvasText(props: ComponentProps<typeof Text>) {
  const { text, fontSize = 12, fontStyle = 'normal' } = props
  const family = studioFontStack(props.fontFamily ?? 'Noto Sans KR')
  const [fontRevision, setFontRevision] = useState(0)

  useEffect(() => {
    const fonts = document.fonts
    const description = `${fontStyle} ${fontSize}px ${family}`
    if (!text || !fonts || fonts.check(description, text)) return

    let active = true
    void fonts.load(description, text).then(() => {
      // Rebuild the text node so Konva measures wrapping with the loaded font.
      if (active) setFontRevision((revision) => revision + 1)
    }).catch(() => {})
    return () => { active = false }
  }, [family, fontSize, fontStyle, text])

  return <Text key={fontRevision} {...props} fontFamily={family} />
}
