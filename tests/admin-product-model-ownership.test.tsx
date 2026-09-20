import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AdminProductEditor } from '../src/pages/admin/AdminProductEditor'

const modelOwnerKeys = vi.hoisted(() => [] as string[])

vi.mock('../src/pages/admin/AdminTrellisModel', () => ({
  AdminTrellisModel: ({ productKey }: { productKey: string }) => {
    modelOwnerKeys.push(productKey)
    return <div data-testid="trellis-owner">{productKey}</div>
  },
}))

const categories = [
  { id: 'cat-1', name: 'Ghế', slug: 'ghe', status: 'ACTIVE' as const },
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
