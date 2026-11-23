import { useEffect, useId, useRef, useState } from 'react'
import { studioFontStack, studioFonts } from '../lib/studioFonts'
import './font-picker.css'

export function FontPicker({ family, onChange }: { family: string; onChange: (family: string) => void }) {
  const label = useId()
  const chosen = studioFonts.find((font) => font.family === family)
  const optionsRef = useRef<HTMLDivElement>(null)
  const [readyPreviews, setReadyPreviews] = useState(() => new Set<string>())

  useEffect(() => {
    const options = optionsRef.current
    if (!options || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting)
      if (!visible.length) return
      setReadyPreviews((current) => {
        const next = new Set(current)
        for (const { target } of visible) next.add((target as HTMLElement).dataset.fontPreview!)
        return next
      })
      for (const { target } of visible) observer.unobserve(target)
    }, { root: options, rootMargin: '65px 0px' })
    for (const button of options.querySelectorAll('[data-font-preview]')) observer.observe(button)
    return () => observer.disconnect()
  }, [])

  return <section className="studio-font-picker" aria-labelledby={label}>
    <div className="studio-font-heading">
      <h3 id={label}>글꼴</h3>
      <span>{chosen?.label ?? family}</span>
    </div>
    <div ref={optionsRef} className="studio-font-options">
      {studioFonts.map((font) => (
        <button key={font.family} type="button" aria-pressed={family === font.family} aria-label={font.label} title={font.label}
          data-font-preview={font.family}
          onClick={() => onChange(font.family)}>
          <span className="studio-font-sample" style={{
            fontFamily: readyPreviews.has(font.family) || typeof IntersectionObserver === 'undefined'
              ? studioFontStack(font.family) : undefined,
          }}>
            {font.sample ?? '바라봄 글'}
          </span>
          <small>{font.label}</small>
        </button>
      ))}
    </div>
  </section>
}
