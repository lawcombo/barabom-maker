import { ArrowLeft, Download, Eye, Plus, Redo2, Save, Undo2 } from 'lucide-react'
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
}

export function StudioHeaderActions(props: StudioHeaderActionsProps) {
  const actions = [
    { label:'메인', icon:ArrowLeft, onClick:props.onBack },
    { label:'새 프로젝트', icon:Plus, onClick:props.onNew },
    { label:'저장', icon:Save, onClick:props.onSave },
    { label:'실행 취소', icon:Undo2, onClick:props.onUndo, disabled:!props.canUndo },
    { label:'다시 실행', icon:Redo2, onClick:props.onRedo, disabled:!props.canRedo },
    { label:'미리보기', icon:Eye, onClick:props.onPreview },
  ]

  return (
    <div className="studio-header-actions" role="group" aria-label="프로젝트 도구">
      {actions.map(({label, icon:Icon, onClick, disabled}) => (
        <button key={label} type="button" className="studio-header-button" title={label} aria-label={label} onClick={onClick} disabled={disabled}>
          <Icon size={17} aria-hidden="true" />
        </button>
      ))}
      <button type="button" className="studio-header-button studio-header-download" title="다운로드" aria-label="다운로드" onClick={props.onDownload}>
        <Download size={16} aria-hidden="true" /><span>다운로드</span>
      </button>
    </div>
  )
}
