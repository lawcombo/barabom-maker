import localforage from 'localforage'
import type { PosterDocument } from './types'

const posterProjects = localforage.createInstance({
  name:'barabom-poster-studio',
  storeName:'poster_projects',
  description:'인생네컷 프로젝트와 분리된 BARABOM STUDIO 포스터 프로젝트',
})

const LAST_POSTER_KEY = 'barabom-poster:last-project'

export async function savePosterProject(document: PosterDocument) {
  const saved = { ...document, updatedAt:Date.now() }
  await posterProjects.setItem(saved.id, saved)
  localStorage.setItem(LAST_POSTER_KEY, saved.id)
  return saved
}

export async function loadPosterProject(id: string) {
  return posterProjects.getItem<PosterDocument>(id)
}

export async function loadLastPosterProject() {
  const id = localStorage.getItem(LAST_POSTER_KEY)
  return id ? loadPosterProject(id) : null
}

export async function listPosterProjects() {
  const result: PosterDocument[] = []
  await posterProjects.iterate<PosterDocument, void>((value) => { result.push(value) })
  return result.sort((a,b) => b.updatedAt - a.updatedAt)
}

export async function deletePosterProject(id: string) {
  await posterProjects.removeItem(id)
  if (localStorage.getItem(LAST_POSTER_KEY) === id) localStorage.removeItem(LAST_POSTER_KEY)
}

export function copyPosterProject(document: PosterDocument) {
  const now = Date.now()
  return { ...document, id:crypto.randomUUID(), name:`${document.name} 복사본`, createdAt:now, updatedAt:now }
}

export function exportPosterProject(document: PosterDocument) {
  const blob = new Blob([JSON.stringify(document)], { type:'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = window.document.createElement('a')
  anchor.href = url
  anchor.download = `${document.name || 'poster'}.barabom-poster.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function importPosterProject(file: File) {
  const parsed = JSON.parse(await file.text()) as PosterDocument
  if (parsed.version !== 'poster-v1' || !Array.isArray(parsed.elements)) throw new Error('지원하지 않는 포스터 프로젝트입니다.')
  const now = Date.now()
  return { ...parsed, id:crypto.randomUUID(), name:`${parsed.name} 가져옴`, createdAt:now, updatedAt:now }
}
