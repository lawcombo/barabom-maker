import { useState } from 'react'
import { Editor } from './components/Editor'
import { Landing } from './components/Landing'
import { PosterEditor } from './modules/poster/PosterEditor'

export default function App() {
  const initialHash=window.location.hash
  const [screen, setScreen] = useState<'landing' | 'editor' | 'poster-editor'>(() => initialHash === '#editor' ? 'editor' : initialHash === '#poster' || initialHash === '#poster-editor' ? 'poster-editor' : 'landing')
  const openEditor = () => { window.location.hash = 'editor'; setScreen('editor') }
  const openPoster = () => { window.location.hash='poster-editor'; setScreen('poster-editor') }
  const closeEditor = () => { window.location.hash = ''; setScreen('landing') }
  if(screen==='editor')return <Editor onExit={closeEditor}/>
  if(screen==='poster-editor')return <PosterEditor onExit={closeEditor}/>
  return <Landing onStart={openEditor} onPosterStart={openPoster}/>
}
