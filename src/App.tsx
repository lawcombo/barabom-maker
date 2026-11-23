import { useState } from 'react'
import { Editor } from './components/Editor'
import { Landing } from './components/Landing'

export default function App() {
  const [screen, setScreen] = useState<'landing' | 'editor'>(() => window.location.hash === '#editor' ? 'editor' : 'landing')
  const openEditor = () => { window.location.hash = 'editor'; setScreen('editor') }
  const closeEditor = () => { window.location.hash = ''; setScreen('landing') }
  return screen === 'landing'
    ? <Landing onStart={openEditor}/>
    : <Editor onExit={closeEditor}/>
}
