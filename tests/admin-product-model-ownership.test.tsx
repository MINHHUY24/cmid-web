/*
 * Vai trò: Mỗi draft sản phẩm phải có namespace job 3D riêng.
 */
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AdminProductEditor } from '../src/views/pages/admin/TrinhSuaSanPhamQuanTri'
import type { AdminNamedRecord } from '../src/models/admin-workspace'

const modelOwnerKeys = vi.hoisted(() => [] as string[])

vi.mock('../src/views/pages/admin/MoHinhTrellisQuanTri', () => ({
  AdminTrellisModel: ({ productKey }: { productKey: string }) => {
    modelOwnerKeys.push(productKey)
    return <div data-testid="trellis-owner">{productKey}</div>
  },
}))

const categories: AdminNamedRecord[] = [
  { id: 'cat-1', name: 'Ghế', slug: 'ghe', description: '', status: 'ACTIVE', updatedAt: '' },
]

afterEach(() => {
  cleanup()
  modelOwnerKeys.length = 0
})

describe('product model ownership', () => {
  it('uses a different TRELLIS job namespace for every new product draft', () => {
    const first = render(
      <AdminProductEditor
        categories={categories}
        brands={[]}
        showrooms={[]}
        onCancel={() => {}}
        onSaved={() => {}}
      />,
    )
    const firstKey = modelOwnerKeys.at(-1)
    first.unmount()

    render(
      <AdminProductEditor
        categories={categories}
        brands={[]}
        showrooms={[]}
        onCancel={() => {}}
        onSaved={() => {}}
      />,
    )
    const secondKey = modelOwnerKeys.at(-1)

    expect(firstKey).toMatch(/^draft-/)
    expect(secondKey).toMatch(/^draft-/)
    expect(secondKey).not.toBe(firstKey)
  })
})
