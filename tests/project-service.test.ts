import { describe, expect, it, vi } from 'vitest'
import {
  getAdminProjects,
  getProjects,
  localizeProject,
  type Project,
} from '../src/services/project.service'
import { apiFetch } from '../src/services/api'

vi.mock('../src/services/api', () => ({
  apiFetch: vi.fn(),
}))

const project: Project = {
  id: 'project-1',
  slug: 'can-ho-thu-nghiem',
  title: 'Căn hộ thử nghiệm',
  titleEn: 'Test apartment',
  location: 'TP. Hồ Chí Minh',
  locationEn: 'Ho Chi Minh City',
  imageUrl: 'cmid-asset://project-tower',
  description: 'Mô tả dự án',
  descriptionEn: 'Project summary',
  content: 'Nội dung chi tiết',
  contentEn: 'Detailed content',
  status: 'PUBLISHED',
  isFeatured: true,
  sortOrder: 1,
  createdAt: '2026-09-13T00:00:00.000Z',
  updatedAt: '2026-09-13T00:00:00.000Z',
}

describe('project service', () => {
  it('uses the public API for website project lists', () => {
    void getProjects()

    expect(apiFetch).toHaveBeenCalledWith('/projects', { skipAuth: true })
  })

  it('uses the protected admin path outside of demo mode', () => {
    void getAdminProjects(false)

    expect(apiFetch).toHaveBeenCalledWith('/projects/admin', {
      headers: undefined,
      skipAuth: false,
    })
  })

  it('selects bilingual detail fields and resolves bundled seed imagery', () => {
    const localized = localizeProject(project, 'en')

    expect(localized).toMatchObject({
      id: 'project-1',
      slug: 'can-ho-thu-nghiem',
      title: 'Test apartment',
      location: 'Ho Chi Minh City',
      description: 'Project summary',
      content: 'Detailed content',
      featured: true,
    })
    expect(localized.image).toContain('du-an-thap-do-thi')
  })
})
