import greenDistrictProjectImage from '../assets/images/du-an-khu-do-thi-xanh.jpg'
import materialShowroomProjectImage from '../assets/images/khong-gian-trung-bay-vat-lieu.jpg'
import riversideProjectImage from '../assets/images/du-an-ven-song.jpg'
import towerProjectImage from '../assets/images/du-an-thap-do-thi.jpg'
import type { AppLanguage } from '../content/site-content'
import { apiFetch } from './api'

export type ProjectStatus = 'DRAFT' | 'PUBLISHED'

export interface Project {
  id: string
  slug: string
  title: string
  titleEn: string | null
  location: string
  locationEn: string | null
  imageUrl: string
  description: string
  descriptionEn: string | null
  content: string
  contentEn: string | null
  status: ProjectStatus
  isFeatured: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface SaveProjectInput {
  id?: string
  slug: string
  title: string
  titleEn?: string | null
  location: string
  locationEn?: string | null
  imageUrl: string
  description: string
  descriptionEn?: string | null
  content: string
  contentEn?: string | null
  status: ProjectStatus
  isFeatured: boolean
  sortOrder?: number
}

export interface LocalizedProject {
  id: string
  slug: string
  title: string
  location: string
  image: string
  description: string
  content: string
  featured: boolean
}

const bundledProjectImages: Record<string, string> = {
  'cmid-asset://project-tower': towerProjectImage,
  'cmid-asset://project-riverside': riversideProjectImage,
  'cmid-asset://project-material-showroom': materialShowroomProjectImage,
  'cmid-asset://project-green-district': greenDistrictProjectImage,
}

export function getProjects(): Promise<Project[]> {
  return apiFetch<Project[]>('/projects', { skipAuth: true })
}

export function getProjectBySlug(slug: string): Promise<Project> {
  return apiFetch<Project>(`/projects/${encodeURIComponent(slug)}`, { skipAuth: true })
}

export function getAdminProjects(useDemoAccess = false): Promise<Project[]> {
  return apiFetch<Project[]>(adminProjectPath(useDemoAccess), {
    headers: adminHeaders(useDemoAccess),
    authScope: 'admin',
    skipAuth: useDemoAccess,
  })
}

export function saveProject(input: SaveProjectInput, useDemoAccess = false): Promise<Project> {
  return apiFetch<Project>(adminProjectPath(useDemoAccess), {
    method: 'POST',
    authScope: 'admin',
    headers: {
      'Content-Type': 'application/json',
      ...adminHeaders(useDemoAccess),
    },
    skipAuth: useDemoAccess,
    body: JSON.stringify(input),
  })
}

export function deleteProject(id: string, useDemoAccess = false): Promise<void> {
  return apiFetch<void>(`${adminProjectPath(useDemoAccess)}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    authScope: 'admin',
    headers: adminHeaders(useDemoAccess),
    skipAuth: useDemoAccess,
  })
}

export function localizeProject(project: Project, language: AppLanguage): LocalizedProject {
  const useEnglish = language === 'en'

  return {
    id: project.id,
    slug: project.slug,
    title: useEnglish ? project.titleEn || project.title : project.title,
    location: useEnglish ? project.locationEn || project.location : project.location,
    image: resolveProjectImage(project.imageUrl),
    description: useEnglish ? project.descriptionEn || project.description : project.description,
    content: useEnglish ? project.contentEn || project.content : project.content,
    featured: project.isFeatured,
  }
}

export function resolveProjectImage(imageUrl: string) {
  return bundledProjectImages[imageUrl] ?? imageUrl
}

function adminProjectPath(useDemoAccess: boolean) {
  return `/projects/${useDemoAccess ? 'demo' : 'admin'}`
}

function adminHeaders(useDemoAccess: boolean) {
  return useDemoAccess ? { 'X-CMID-Demo-Admin': 'true' } : undefined
}
