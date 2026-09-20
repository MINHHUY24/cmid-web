import { afterEach, expect, it, vi } from 'vitest'
import type { Product } from '../src/types/product'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
  localStorage.clear()
})

it('sends stable relation slugs instead of local numeric IDs', async () => {
  vi.stubEnv('VITE_API_URL', 'https://api.example/api')
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => ({}),
  })
  vi.stubGlobal('fetch', fetchMock)
  const { saveProduct } = await import('../src/services/product.service')
  const product = {
    id: 77,
    sku: 'SOFA-TEST',
    name: 'Sofa thử nghiệm',
    slug: 'sofa-thu-nghiem',
    description: null,
    price: '3000000',
    unit: 'cái',
    saleType: 'DIRECT_ORDER',
    status: 'ACTIVE',
    category: {
      id: 8,
      name: 'Nội thất phòng khách',
      slug: 'noi-that-phong-khach',
    },
    brand: { id: 1, name: 'TOTO', slug: 'toto' },
    images: [],
    models3D: [],
  } satisfies Product

  await saveProduct(product)

  const request = fetchMock.mock.calls[0]?.[1] as RequestInit
  const payload = JSON.parse(String(request.body)) as Record<string, unknown>
  expect(payload).toMatchObject({
    categorySlug: 'noi-that-phong-khach',
    brandSlug: 'toto',
  })
  expect(payload).not.toHaveProperty('categoryId')
  expect(payload).not.toHaveProperty('brandId')
})

it('uses the protected demo delete endpoint when demo access is active', async () => {
  vi.stubEnv('VITE_API_URL', 'https://api.example/api')
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 204,
    headers: new Headers(),
  })
  vi.stubGlobal('fetch', fetchMock)
  const { deleteProduct } = await import('../src/services/product.service')

  await deleteProduct(5, true)

  expect(fetchMock).toHaveBeenCalledWith(
    'https://api.example/api/products/demo/5',
    expect.objectContaining({
      method: 'DELETE',
      headers: expect.objectContaining({ 'X-CMID-Demo-Admin': 'true' }),
    }),
  )
})

it('removes a legacy browser-only product without sending its timestamp ID to PostgreSQL', async () => {
  vi.stubEnv('VITE_API_URL', 'https://api.example/api')
  const fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  const { deleteProduct } = await import('../src/services/product.service')

  await deleteProduct(1_757_000_000_000, true)

  expect(fetchMock).not.toHaveBeenCalled()
})
