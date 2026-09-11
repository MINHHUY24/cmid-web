import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminProductEditor } from '../src/pages/admin/AdminProductEditor'
import { createProductImageSlots, toProductImages } from '../src/pages/admin/admin-product-images'
import { getAdminProducts } from '../src/pages/admin/admin-local-store'
import type { Product } from '../src/types/product'
import * as trellis from '../src/services/trellis.service'

vi.mock('../src/services/trellis.service', async (original) => ({
  ...await original<typeof trellis>(),
  getTrellisHealth: vi.fn(), getTrellisJob: vi.fn(), createTrellisJob: vi.fn(),
  saveTrellisModel: vi.fn(), cancelTrellisJob: vi.fn(),
}))
vi.mock('../src/components/product/ProductModelViewer', () => ({
  ProductModelViewer: ({ src }: { src: string }) => <div data-testid="model-preview">{src}</div>,
}))

const product: Product = {
  id: 77, name: 'Ghế mẫu', sku: 'TEST-CHAIR', slug: 'ghe-mau', price: '100000', unit: 'cái',
  description: null, saleType: 'DIRECT_ORDER', status: 'ACTIVE',
  category: { id: 1, name: 'Ghế', slug: 'ghe' }, brand: null,
  images: toProductImages([
    { key: 'front', imageUrl: '/front.png' }, { key: 'left', imageUrl: '' },
    { key: 'right', imageUrl: '/right.png' }, { key: 'back', imageUrl: '/back.png' },
    { key: 'extra-1', imageUrl: '/detail.png' },
  ], 77, 'Ghế mẫu'), models3D: [],
}
const completed: trellis.TrellisJob = {
  id: 'abc123', state: 'completed', message: 'Mô hình đã sẵn sàng.',
  previewUrl: '/trellis-api/jobs/abc123/model', savedUrl: null,
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.clearAllMocks()
  vi.mocked(trellis.getTrellisHealth).mockResolvedValue({ service: 'cmid-trellis', ready: true })
  vi.mocked(trellis.createTrellisJob).mockResolvedValue(completed)
  vi.mocked(trellis.getTrellisJob).mockResolvedValue(completed)
  vi.mocked(trellis.saveTrellisModel).mockResolvedValue({ modelUrl: '/models/generated/abc123.glb', fileName: 'chair.glb', fileSize: 2048 })
})
afterEach(cleanup)

function editor(input = product) {
  return render(<AdminProductEditor product={input} categories={[{ id: 'cat-1', name: 'Ghế', slug: 'ghe', status: 'ACTIVE' }]} brands={[]} onCancel={() => {}} onSaved={() => {}} />)
}

describe('product media', () => {
  it('keeps missing left view empty after save/reopen and extras at the end', () => {
    const slots = createProductImageSlots(product.images)
    expect(slots.map((slot) => slot.imageUrl)).toEqual(['/front.png', '', '/right.png', '/back.png', '/detail.png'])
    const saved = toProductImages(slots, 77, 'Ghế mẫu')
    expect(saved.map((image) => image.sortOrder)).toEqual([0, 2, 3, 4])
    expect(saved.filter((image) => image.isPrimary)).toHaveLength(1)
    expect(saved[1].altText).toBe('Ghế mẫu – Mặt phải')
  })

  it('organizes old images using primary and sort order without dropping extras', () => {
    const legacy = product.images.map((image) => ({ ...image, view: undefined })).reverse()
    expect(createProductImageSlots(legacy).map((slot) => slot.imageUrl)).toEqual(['/front.png', '/right.png', '/back.png', '/detail.png'])
  })

  it('shows four named uploads, allows extras, and removes the old alt-text input', async () => {
    editor()
    for (const view of ['Mặt trước', 'Mặt trái', 'Mặt phải', 'Mặt sau']) expect(screen.getByLabelText(new RegExp(`^\\d. ${view}`))).toBeTruthy()
    expect(screen.queryByLabelText('Mô tả thay thế cho ảnh')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Thêm ảnh khác' }))
    expect(screen.getByLabelText('6. Ảnh bổ sung 2')).toBeTruthy()
    await screen.findByText('TRELLIS đã kết nối')
  })

  it('allows product-specific technical details, guidance and sales policy to be saved and edited again', async () => {
    const mounted = editor()
    await screen.findByText('TRELLIS đã kết nối')
    fireEvent.click(screen.getByRole('button', { name: 'Thêm thông số' }))
    fireEvent.change(screen.getByLabelText('Tên thông số 1'), { target: { value: 'Kích thước' } })
    fireEvent.change(screen.getByLabelText('Giá trị thông số 1'), { target: { value: '180 × 85 × 78 cm' } })
    fireEvent.change(screen.getByLabelText('Điểm nổi bật'), { target: { value: 'Khung gỗ tự nhiên\nĐệm mút đàn hồi' } })
    fireEvent.change(screen.getByLabelText('Hướng dẫn'), { target: { value: 'Lắp đặt trên bề mặt phẳng.' } })
    fireEvent.change(screen.getByLabelText('Các lưu ý hướng dẫn'), { target: { value: 'Không dùng chất tẩy mạnh' } })
    fireEvent.change(screen.getByLabelText('Chính sách bán hàng'), { target: { value: 'Bảo hành theo điều kiện của CMID.' } })
    fireEvent.change(screen.getByLabelText('Các điểm trong chính sách'), { target: { value: 'Kiểm tra sản phẩm khi nhận hàng' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu sản phẩm' }))
    const saved = getAdminProducts()[0]
    expect(saved).toMatchObject({
      descriptionHighlights: ['Khung gỗ tự nhiên', 'Đệm mút đàn hồi'],
      technicalSpecifications: [{ label: 'Kích thước', value: '180 × 85 × 78 cm' }],
      usageGuide: 'Lắp đặt trên bề mặt phẳng.',
      usageGuidePoints: ['Không dùng chất tẩy mạnh'],
      salesPolicy: 'Bảo hành theo điều kiện của CMID.',
      salesPolicyPoints: ['Kiểm tra sản phẩm khi nhận hàng'],
    })
    mounted.unmount()
    editor(saved)
    expect((screen.getByLabelText('Tên thông số 1') as HTMLInputElement).value).toBe('Kích thước')
    expect((screen.getByLabelText('Hướng dẫn') as HTMLTextAreaElement).value).toBe('Lắp đặt trên bề mặt phẳng.')
  })

  it('sends the first four views, previews before accepting, and persists the saved GLB on the product', async () => {
    const mounted = editor()
    await screen.findByText('TRELLIS đã kết nối')
    fireEvent.click(screen.getByRole('button', { name: 'Tạo mô hình 3D' }))
    await screen.findByTestId('model-preview')
    expect(trellis.createTrellisJob).toHaveBeenCalledWith(['/front.png', '', '/right.png', '/back.png'], 12, expect.any(AbortSignal))
    expect(trellis.saveTrellisModel).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Lưu mô hình để sử dụng' }))
    await screen.findByText('Đã chọn dùng cho sản phẩm')
    await waitFor(() => expect((screen.getByRole('button', { name: 'Lưu sản phẩm' }) as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(screen.getByRole('button', { name: 'Lưu sản phẩm' }))
    const saved = getAdminProducts()[0]
    expect(saved.images.map((image) => image.imageUrl)).toEqual(['/front.png', '/right.png', '/back.png', '/detail.png'])
    expect(saved.models3D[0].modelUrl).toBe('/models/generated/abc123.glb')
    mounted.unmount()
    sessionStorage.clear()
    editor(saved)
    expect(screen.getByTestId('model-preview').textContent).toBe('/models/generated/abc123.glb')
  })

  it('requires the front view and offers reconnection after connection failure', async () => {
    vi.mocked(trellis.getTrellisHealth).mockRejectedValueOnce(new Error('offline'))
    editor({ ...product, images: [] })
    await screen.findByText('TRELLIS chưa kết nối')
    expect((screen.getByRole('button', { name: 'Tạo mô hình 3D' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Kết nối lại' }))
    await screen.findByText('TRELLIS đã kết nối')
    expect((screen.getByRole('button', { name: 'Tạo mô hình 3D' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('never attaches a model when saving it fails', async () => {
    vi.mocked(trellis.saveTrellisModel).mockRejectedValueOnce(new Error('Ổ đĩa đầy'))
    editor()
    await screen.findByText('TRELLIS đã kết nối')
    fireEvent.click(screen.getByRole('button', { name: 'Tạo mô hình 3D' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Lưu mô hình để sử dụng' }))
    await screen.findByText('Ổ đĩa đầy')
    expect(screen.queryByText('Đã chọn dùng cho sản phẩm')).toBeNull()
  })
})
