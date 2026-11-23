import { useState } from 'react'
import { Editor } from './components/Editor'
import { Landing } from './components/Landing'
import { PosterStart } from './modules/poster/PosterStart'
import { PosterEditor } from './modules/poster/PosterEditor'
import type { PosterDocument } from './modules/poster/types'

export default function App() {
  const initialHash=window.location.hash
  const [screen, setScreen] = useState<'landing' | 'editor' | 'poster-start' | 'poster-editor'>(() => initialHash === '#editor' ? 'editor' : initialHash === '#poster' ? 'poster-start' : initialHash === '#poster-editor' ? 'poster-editor' : 'landing')
  const [posterDocument,setPosterDocument]=useState<PosterDocument|undefined>()
  const openEditor = () => { window.location.hash = 'editor'; setScreen('editor') }
  const openPoster = () => { window.location.hash='poster'; setScreen('poster-start') }
  const openPosterEditor=(document:PosterDocument)=>{setPosterDocument(document);window.location.hash='poster-editor';setScreen('poster-editor')}
  const closeEditor = () => { window.location.hash = ''; setScreen('landing') }
  if(screen==='editor')return <Editor onExit={closeEditor}/>
  if(screen==='poster-start')return <PosterStart onBack={closeEditor} onOpen={openPosterEditor}/>
  if(screen==='poster-editor')return <PosterEditor initialDocument={posterDocument} onExit={openPoster}/>
  return <Landing onStart={openEditor} onPosterStart={openPoster}/>
}
