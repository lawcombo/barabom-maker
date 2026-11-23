import localforage from 'localforage'
import type { EditorDocument } from '../types'

const projects = localforage.createInstance({
  name: 'photo-studio',
  storeName: 'projects',
  description: '브라우저 내부에 저장되는 PHOTO STUDIO 프로젝트',
})

const LAST_PROJECT_KEY = 'photo-studio:last-project'

export async function saveProject(document: EditorDocument) {
  const saved = { ...document, updatedAt: Date.now() }
  await projects.setItem(saved.id, saved)
  localStorage.setItem(LAST_PROJECT_KEY, saved.id)
  return saved
}

export async function loadProject(id: string) {
  return projects.getItem<EditorDocument>(id)
}

export async function loadLastProject() {
  const id = localStorage.getItem(LAST_PROJECT_KEY)
  return id ? loadProject(id) : null
}

export async function listProjects() {
  const result: EditorDocument[] = []
  await projects.iterate<EditorDocument, void>((value) => { result.push(value) })
  return result.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function deleteProject(id: string) {
  await projects.removeItem(id)
  if (localStorage.getItem(LAST_PROJECT_KEY) === id) localStorage.removeItem(LAST_PROJECT_KEY)
}

export function exportProjectFile(document: EditorDocument) {
  const blob = new Blob([JSON.stringify(document)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = window.document.createElement('a')
  anchor.href = url
  anchor.download = `${document.name || 'photo-studio'}.photostudio.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function importProjectFile(file: File) {
  const parsed = JSON.parse(await file.text()) as EditorDocument
  if (parsed.version !== 1 || !Array.isArray(parsed.photos)) throw new Error('지원하지 않는 프로젝트 파일입니다.')
  const imported = { ...parsed, id: crypto.randomUUID(), updatedAt: Date.now() }
  await saveProject(imported)
  return imported
}
