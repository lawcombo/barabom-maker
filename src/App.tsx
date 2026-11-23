import { useState } from 'react'
import { Editor } from './components/Editor'
import { Landing } from './components/Landing'
import { PosterEditor } from './modules/poster/PosterEditor'

export default function App() {
  const initialHash=window.location.hash
  const [screen, setScreen] = useState<'landing' | 'editor' | 'poster-editor'>(() => initialHash === '#editor' ? 'editor' : initialHash === '#poster' || initialHash === '#poster-editor' ? 'poster-editor' : 'landing')
  const openEditor = () => { window.location.hash = 'editor'; setScreen('editor') }
  const openPoster = () => { window.location.hash='poster-editor'; setScreen('poster-editor') }
  const closeEditor = (hasUnsavedChanges: boolean) => {
    if (hasUnsavedChanges && !window.confirm('저장하지 않은 변경 사항이 있습니다.\n홈화면으로 이동됩니다. 정말로 이동하시겠습니까?')) return
    window.location.hash = ''
    setScreen('landing')
  }
  if(screen==='editor')return <Editor onExit={closeEditor}/>
  if(screen==='poster-editor')return <PosterEditor onExit={closeEditor}/>
  return <Landing onStart={openEditor} onPosterStart={openPoster}/>
}
