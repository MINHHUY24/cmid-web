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
      authScope: 'admin',
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

  it('supplies six curated detail images for every published 2026 project', () => {
    const projectSlugs = [
      'can-ho-ven-song-thao-dien',
      'nha-pho-san-trong-an-phu',
      'biet-thu-vuon-binh-chanh',
      'showroom-vat-lieu-cmid-quan-7',
      'van-phong-sang-tao-nam-sai-gon',
      'khach-san-boutique-hoi-an',
      'can-ho-nghi-duong-ho-tram',
      'nha-vuon-da-lat',
    ]

    for (const slug of projectSlugs) {
      const localized = localizeProject({ ...project, slug }, 'vi')

      expect(localized.gallery).toHaveLength(6)
      expect(localized.gallery.every(({ image, alt }) => image.length > 0 && alt.length > 0)).toBe(true)
    }
  })
})
