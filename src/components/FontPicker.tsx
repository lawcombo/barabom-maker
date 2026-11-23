import { useId } from 'react'
import { studioFontStack, studioFonts } from '../lib/studioFonts'
import './font-picker.css'

export function FontPicker({ family, onChange }: { family: string; onChange: (family: string) => void }) {
  const label = useId()
  const chosen = studioFonts.find((font) => font.family === family)
  return <section className="studio-font-picker" aria-labelledby={label}>
    <div className="studio-font-heading">
      <h3 id={label}>글꼴</h3>
      <span>{chosen?.label ?? family}</span>
    </div>
    <div className="studio-font-options">
      {studioFonts.map((font) => (
        <button key={font.family} type="button" aria-pressed={family === font.family} aria-label={font.label} title={font.label}
          onClick={() => onChange(font.family)}>
          <span className="studio-font-sample" style={{ fontFamily: studioFontStack(font.family) }}>
            {font.sample ?? '바라봄 글'}
          </span>
          <small>{font.label}</small>
        </button>
      ))}
    </div>
  </section>
}
