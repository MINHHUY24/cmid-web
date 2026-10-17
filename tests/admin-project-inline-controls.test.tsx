/*
 * Vai trò: Tương tự cho dự án Admin.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AdminProjectsView } from '../src/views/pages/admin/GiaoDienNoiDungQuanTri'
import {
  getAdminProjects,
  saveProject,
  type Project,
} from '../src/services/project.service'

vi.mock('../src/services/project.service', () => ({
  deleteProject: vi.fn(),
  getAdminProjects: vi.fn(),
  resolveProjectImage: (imageUrl: string) => imageUrl,
  saveProject: vi.fn(),
}))

const targetProject: Project = {
  id: 'project-featured-target',
  slug: 'du-an-can-chuyen-noi-bat',
  title: 'Dự án cần chuyển nổi bật',
  titleEn: 'Project to feature',
  location: 'TP. Hồ Chí Minh',
  locationEn: 'Ho Chi Minh City',
  imageUrl: 'https://example.com/project-cover.webp',
  description: 'Mô tả dùng để kiểm thử cập nhật hiển thị dự án.',
  descriptionEn: 'A project description used to test display updates.',
  content: 'Nội dung kiểm thử dự án.',
  contentEn: 'Project test content.',
  isFeatured: false,
  status: 'PUBLISHED',
  sortOrder: 24,
  createdAt: '2026-09-30T02:00:00.000Z',
  updatedAt: '2026-09-30T02:00:00.000Z',
}

const projects: Project[] = [
  targetProject,
  ...Array.from({ length: 7 }, (_, index) => ({
    ...targetProject,
    id: `project-${index + 1}`,
    slug: `du-an-${index + 1}`,
    title: `Dự án tham khảo ${index + 1}`,
    sortOrder: index + 1,
  })),
]

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0)
    return 1
  })
  vi.mocked(getAdminProjects).mockResolvedValue(projects)
  vi.mocked(saveProject).mockResolvedValue({ ...targetProject, isFeatured: true })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('shows the project total at the toolbar edge and saves a featured change without losing publication state or sort order', async () => {
  const onToast = vi.fn()
  const { container } = render(<AdminProjectsView onToast={onToast} />)

  await screen.findByText(targetProject.title)

  const toolbar = container.querySelector('.admin-content-toolbar')
  const total = toolbar?.querySelector('.admin-content-toolbar__total')
  expect(total?.textContent).toBe('Tổng số dự án: 8')
  expect(total?.getAttribute('aria-live')).toBe('polite')

  fireEvent.change(screen.getByPlaceholderText('Tìm theo tên, địa điểm hoặc mô tả dự án...'), {
    target: { value: targetProject.title },
  })
  expect(total?.textContent).toBe('Tổng số dự án: 8')

  const featuredSelect = screen.getByRole('button', {
    name: `Cập nhật hiển thị ${targetProject.title}`,
  })
  expect(featuredSelect.textContent).toContain('Thông thường')

  fireEvent.click(featuredSelect)
  fireEvent.click(await screen.findByRole('option', { name: 'Nổi bật' }))

  await waitFor(() => {
    expect(saveProject).toHaveBeenCalledWith(expect.objectContaining({
      id: targetProject.id,
      isFeatured: true,
      status: targetProject.status,
      sortOrder: targetProject.sortOrder,
    }), false)
  })
})
