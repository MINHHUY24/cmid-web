import { afterEach, describe, expect, it, vi } from 'vitest'

const serverOrder = {
  id: 'CMID-1001',
  customerName: 'Nguyễn Văn A',
  customerEmail: 'a@example.com',
  customerPhone: '0909000000',
  address: 'TP. Hồ Chí Minh',
  note: null,
  subtotal: '1000000',
  vat: '100000',
  shippingFee: '0',
  total: '1100000',
  refundedAmount: '250000',
  paymentMethod: 'BANK_TRANSFER',
  paymentStatus: 'PARTIALLY_REFUNDED',
  status: 'COMPLETED',
  createdAt: '2026-09-13T01:00:00.000Z',
  items: [{
    productId: 7,
    productName: 'Ghế thử nghiệm',
    sku: 'GHE-01',
    unitPrice: '1000000',
    quantity: 1,
    product: { images: [{ imageUrl: '/chair.webp', isPrimary: true }] },
  }],
  refunds: [{
    id: 'REF-1001',
    orderId: 'CMID-1001',
    amount: '250000',
    reason: 'Hoàn một phần',
    status: 'COMPLETED',
    provider: 'MANUAL',
    providerRefundId: null,
    requestedBy: 'sale@example.com',
    processedBy: 'admin@example.com',
    processedAt: '2026-09-13T02:00:00.000Z',
    createdAt: '2026-09-13T01:30:00.000Z',
  }],
  statusHistory: [{
    id: 1,
    fromStatus: 'SHIPPING',
    toStatus: 'COMPLETED',
    actor: 'admin@example.com',
    note: 'Đã giao thành công',
    createdAt: '2026-09-13T01:20:00.000Z',
  }],
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

function successfulJson(payload: unknown) {
  return {
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => payload,
  }
}

async function setup(payload: unknown = serverOrder) {
  vi.stubEnv('VITE_API_URL', 'https://api.example/api')
  const fetchMock = vi.fn().mockResolvedValue(successfulJson(payload))
  vi.stubGlobal('fetch', fetchMock)
  return {
    service: await import('../src/services/order.service'),
    fetchMock,
  }
}

describe('order service', () => {
  it('maps the pickup and delivery queues from the server', async () => {
    const { service } = await setup([
      { ...serverOrder, id: 'CMID-PICKUP', status: 'AWAITING_PICKUP' },
      { ...serverOrder, id: 'CMID-DELIVERY', status: 'AWAITING_DELIVERY' },
    ])

    await expect(service.getAdminOrders(true)).resolves.toEqual([
      expect.objectContaining({ id: 'CMID-PICKUP', status: 'Chờ lấy hàng' }),
      expect.objectContaining({ id: 'CMID-DELIVERY', status: 'Chờ giao hàng' }),
    ])
  })

  it('loads authoritative demo orders and maps payment, refunds, and history', async () => {
    const { service, fetchMock } = await setup([serverOrder])

    const orders = await service.getAdminOrders(true)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example/api/orders/demo',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-CMID-Demo-Admin': 'true' }),
      }),
    )
    expect(orders[0]).toMatchObject({
      id: 'CMID-1001',
      paymentMethod: 'Chuyển khoản ngân hàng',
      paymentStatus: 'Hoàn tiền một phần',
      status: 'Hoàn thành',
      refundedAmount: 250000,
      refunds: [{
        status: 'Hoàn tất',
        processedBy: 'admin@example.com',
      }],
      statusHistory: [{
        fromStatus: 'Đang giao',
        toStatus: 'Hoàn thành',
      }],
    })
  })

  it('loads only the signed-in customer\'s orders from the customer endpoint', async () => {
    const { service, fetchMock } = await setup([serverOrder])
    const { setAccessToken } = await import('../src/services/auth-token')
    setAccessToken('customer-access-token')

    await expect(service.getCustomerOrders()).resolves.toEqual([
      expect.objectContaining({
        id: 'CMID-1001',
        status: 'Hoàn thành',
        total: 1_100_000,
      }),
    ])

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example/api/orders/me',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer customer-access-token' }),
      }),
    )
  })

  it('creates a normal checkout order with the signed-in customer token', async () => {
    const { service, fetchMock } = await setup(serverOrder)
    const { setAccessToken } = await import('../src/services/auth-token')
    setAccessToken('customer-access-token')

    await service.createCheckoutOrder({
      customerName: 'Nguyễn Văn A',
      customerEmail: 'a@example.com',
      customerPhone: '0909000000',
      address: 'TP. Hồ Chí Minh',
      paymentMethod: 'COD',
      items: [{ productId: 7, quantity: 1 }],
    })

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.example/api/orders')
    expect(request.headers).toEqual(expect.objectContaining({
      Authorization: 'Bearer customer-access-token',
      'Content-Type': 'application/json',
    }))
  })

  it('sends only the allowed backend enum when updating order status', async () => {
    const { service, fetchMock } = await setup(serverOrder)

    await service.updateAdminOrderStatus('CMID-1001', 'Đã trả hàng', true)

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://api.example/api/orders/demo/CMID-1001/status',
    )
    expect(JSON.parse(String(request.body))).toEqual({ status: 'RETURNED' })
  })

  it('creates mock MoMo orders through the protected demo API', async () => {
    const { service, fetchMock } = await setup(serverOrder)

    await service.createDemoCheckoutOrder({
      customerName: 'Nguyễn Văn A',
      customerEmail: 'a@example.com',
      customerPhone: '0909000000',
      address: 'TP. Hồ Chí Minh',
      paymentMethod: 'MOMO_WALLET',
      items: [{ productId: 7, quantity: 1 }],
    })

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.example/api/orders/demo')
    expect(request.method).toBe('POST')
    expect(request.headers).toEqual(expect.objectContaining({
      'X-CMID-Demo-Admin': 'true',
    }))
    expect(JSON.parse(String(request.body))).toMatchObject({
      paymentMethod: 'MOMO_WALLET',
    })
  })
})
