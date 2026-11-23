import { useLayoutEffect, useRef, useSyncExternalStore, useState, type ReactNode } from 'react'
import { createPortal, flushSync } from 'react-dom'
import { Check, SlidersHorizontal } from 'lucide-react'
import type Konva from 'konva'
import './studio-mobile.css'

const compactCanvas = '(max-width: 820px), (max-width: 1180px) and (pointer: coarse)'
export const studioPhoneLayout = '(max-width: 820px), (max-width: 1180px) and (hover: none) and (max-height: 540px)'
const supportsInlineEditing = () => window.matchMedia(compactCanvas).matches
const listenForCompactCanvas = (listener: () => void) => {
  const media = window.matchMedia(compactCanvas)
  media.addEventListener('change', listener)
  return () => media.removeEventListener('change', listener)
}

type TextAnchor = { left: number; top: number; width: number; height: number }

export function getCanvasTextAnchor(node: Konva.Node): TextAnchor | null {
  const stage = node.getStage()
  if (!stage || !stage.width() || !stage.height()) return null
  const viewport = stage.container().querySelector('.konvajs-content')?.getBoundingClientRect()
  if (!viewport?.width || !viewport.height) return null
  const bounds = node.getClientRect({ skipShadow: true })
  const scaleX = viewport.width / stage.width()
  const scaleY = viewport.height / stage.height()
  return {
    left: viewport.left + bounds.x * scaleX,
    top: viewport.top + bounds.y * scaleY,
    width: bounds.width * scaleX,
    height: bounds.height * scaleY,
  }
}

type TextEdit = {
  key: number
  value: string
  anchor: TextAnchor
  onCommit: (value: string) => void
}

export function useCanvasTextEdit() {
  const [edit, setEdit] = useState<TextEdit | null>(null)
  const openCount = useRef(0)
  const enabled = useSyncExternalStore(listenForCompactCanvas, supportsInlineEditing)

  const open = (value: string, node: Konva.Node, onCommit: TextEdit['onCommit']) => {
    const anchor = getCanvasTextAnchor(node)
    if (!anchor) return
    // Mobile Safari needs the textarea to focus during the original tap.
    const key = ++openCount.current
    flushSync(() => setEdit({ key, value, anchor, onCommit }))
  }

  return {
    enabled,
    open,
    editor: edit && <CanvasTextEditor key={edit.key} edit={edit} onClose={() => setEdit(null)} />,
  }
}

function positionEditor(anchor: TextAnchor, height: number) {
  const viewport = window.visualViewport
  const leftEdge = (viewport?.offsetLeft ?? 0) + 12
  const topEdge = (viewport?.offsetTop ?? 0) + 10
  const availableWidth = (viewport?.width ?? window.innerWidth) - 24
  const availableHeight = (viewport?.height ?? window.innerHeight) - 20
  const width = Math.min(availableWidth, Math.max(232, Math.min(380, anchor.width)))
  return {
    width,
    left: Math.max(leftEdge, Math.min(leftEdge + availableWidth - width, anchor.left + (anchor.width - width) / 2)),
    top: Math.max(topEdge, Math.min(topEdge + availableHeight - height, anchor.top + (anchor.height - height) / 2)),
  }
}

function CanvasTextEditor({ edit, onClose }: { edit: TextEdit; onClose: () => void }) {
  const [value, setValue] = useState(edit.value)
  const [position, setPosition] = useState(() => positionEditor(edit.anchor, 116))
  const formRef = useRef<HTMLFormElement>(null)
  const fieldRef = useRef<HTMLTextAreaElement>(null)
  const closed = useRef(false)
  const finish = (save: boolean) => {
    if (closed.current) return
    closed.current = true
    const next = fieldRef.current?.value ?? value
    if (save && next !== edit.value) edit.onCommit(next)
    onClose()
  }

  useLayoutEffect(() => {
    const resize = () => setPosition(positionEditor(edit.anchor, formRef.current?.offsetHeight ?? 116))
    resize()
    window.addEventListener('resize', resize)
    window.visualViewport?.addEventListener('resize', resize)
    window.visualViewport?.addEventListener('scroll', resize)
    fieldRef.current?.focus({ preventScroll: true })
    fieldRef.current?.select()
    return () => {
      window.removeEventListener('resize', resize)
      window.visualViewport?.removeEventListener('resize', resize)
      window.visualViewport?.removeEventListener('scroll', resize)
    }
  }, [edit])

  return createPortal(
    <form ref={formRef} className="studio-inline-editor" style={position}
      onSubmit={(event) => { event.preventDefault(); finish(true) }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) finish(true)
      }}
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing) return
        if (event.key === 'Escape') { event.stopPropagation(); finish(false) }
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); finish(true) }
      }}>
      <textarea ref={fieldRef} aria-label="캔버스 문구 수정" rows={edit.value.includes('\n') ? 3 : 2}
        value={value} onChange={(event) => setValue(event.target.value)} />
      <button type="submit" onPointerDown={(event) => event.preventDefault()}><Check size={16} aria-hidden="true" /> 완료</button>
    </form>,
    window.document.body,
  )
}

export function StudioInspector({ id, className, label, open, onToggle, children }: {
  id: string
  className: string
  label: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  const panelRef = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    if (open && panelRef.current) panelRef.current.scrollTop = 0
  }, [open])

  return <>
    <button type="button" className="studio-settings-trigger" aria-controls={id} aria-expanded={open} onClick={onToggle}>
      <SlidersHorizontal size={19} aria-hidden="true" />
      <span>{label}</span>
    </button>
    <aside ref={panelRef} id={id} className={`${className} studio-inspector ${open ? 'studio-sheet-open' : ''}`}
      onKeyDown={(event) => { if (event.key === 'Escape' && open) onToggle() }}>
      <div className="studio-sheet-bar">
        <strong>{label}</strong>
        <button type="button" onClick={onToggle}>완료</button>
      </div>
      {children}
    </aside>
  </>
}
