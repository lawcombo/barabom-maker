import { ArrowLeft, Download, Eye, MoreHorizontal, Plus, Redo2, Save, Undo2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import './studio-header.css'

type StudioHeaderActionsProps = {
  onBack: () => void
  onNew: () => void
  onSave: () => void
  onUndo: () => void
  onRedo: () => void
  onPreview: () => void
  onDownload: () => void
  canUndo: boolean
  canRedo: boolean
  saving: boolean
}

export function StudioHeaderActions(props: StudioHeaderActionsProps) {
  const moreRef = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      const menu = moreRef.current
      if (menu?.open && event.target instanceof Node && !menu.contains(event.target)) menu.open = false
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [])

  const actions = [
    { label:'메인', icon:ArrowLeft, onClick:props.onBack },
    { label:'새 프로젝트', icon:Plus, onClick:props.onNew },
    { label:'저장', icon:Save, onClick:props.onSave, disabled:props.saving, primary:true },
    { label:'실행 취소', icon:Undo2, onClick:props.onUndo, disabled:!props.canUndo },
    { label:'다시 실행', icon:Redo2, onClick:props.onRedo, disabled:!props.canRedo },
    { label:'미리보기', icon:Eye, onClick:props.onPreview },
  ]

  return (
    <div className="studio-header-actions" role="group" aria-label="프로젝트 도구">
      {actions.map(({label, icon:Icon, onClick, disabled, primary}) => (
        <button key={label} type="button" className={`studio-header-button ${primary ? '' : 'studio-header-secondary'}`}
          title={label} aria-label={label} onClick={onClick} disabled={disabled}>
          <Icon size={17} aria-hidden="true" />
        </button>
      ))}
      <button type="button" className="studio-header-button studio-header-download" title="다운로드" aria-label="다운로드" onClick={props.onDownload}>
        <Download size={16} aria-hidden="true" /><span>다운로드</span>
      </button>
      <details ref={moreRef} className="studio-header-more"
        onBlur={(event) => {
          if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.currentTarget.querySelector('summary')?.focus()
            event.currentTarget.open = false
          }
        }}>
        <summary className="studio-header-button" aria-label="더 보기" title="더 보기">
          <MoreHorizontal size={20} aria-hidden="true" />
        </summary>
        <div className="studio-header-more-actions">
          {actions.filter((action) => !action.primary).map(({label, icon:Icon, onClick, disabled}) => (
            <button key={label} type="button" disabled={disabled} onClick={(event) => {
              const menu = event.currentTarget.closest('details')
              if (menu) menu.open = false
              onClick()
            }}>
              <Icon size={17} aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      </details>
    </div>
  )
}
