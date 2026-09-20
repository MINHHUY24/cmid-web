import type { AdminOrder, AdminReturn } from '../pages/admin/admin-database'
import { apiFetch } from './api'

export type ServerOrderStatus =
  | 'PENDING_PAYMENT'
  | 'PENDING_CONFIRMATION'
  | 'PROCESSING'
  | 'AWAITING_PICKUP'
  | 'AWAITING_DELIVERY'
  | 'SHIPPING'
  | 'COMPLETED'
  | 'PAYMENT_FAILED'
  | 'CANCELLED'
  | 'RETURNED'

export type ServerPaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED'

export type ServerRefundStatus = 'PENDING' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED'

type ServerOrder = {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  address: string
  note: string | null
  subtotal: number | string
  vat: number | string
  shippingFee: number | string
  total: number | string
  refundedAmount: number | string
  paymentMethod: 'BANK_TRANSFER' | 'COD' | 'MOMO_WALLET' | 'MOMO_CARD'
  paymentStatus: ServerPaymentStatus
  status: ServerOrderStatus
  createdAt: string
  items: Array<{
    productId: number
    productName: string
    sku: string
    unitPrice: number | string
    quantity: number
    product?: { images?: Array<{ imageUrl: string; isPrimary: boolean }> }
  }>
  refunds?: Array<{
    id: string
    orderId: string
    amount: number | string
    reason: string
    status: ServerRefundStatus
    provider: 'MOMO' | 'MANUAL'
    providerRefundId: string | null
    requestedBy: string
    processedBy: string | null
    processedAt: string | null
    createdAt: string
  }>
  statusHistory?: Array<{
    id: number
    fromStatus: ServerOrderStatus | null
    toStatus: ServerOrderStatus
    actor: string
    note: string | null
    createdAt: string
  }>
}

export type CreateCheckoutOrderInput = {
  customerName: string
  customerEmail: string
  customerPhone: string
  address: string
  note?: string
  paymentMethod: 'BANK_TRANSFER' | 'COD'
  items: Array<{ productId: number; quantity: number }>
}

const orderStatusToServer: Record<AdminOrder['status'], ServerOrderStatus> = {
  'Chờ thanh toán': 'PENDING_PAYMENT',
  'Thanh toán thất bại': 'PAYMENT_FAILED',
  'Chờ xác nhận': 'PENDING_CONFIRMATION',
  'Đang xử lý': 'PROCESSING',
  'Chờ lấy hàng': 'AWAITING_PICKUP',
  'Chờ giao hàng': 'AWAITING_DELIVERY',
  'Đang giao': 'SHIPPING',
  'Hoàn thành': 'COMPLETED',
  'Đã hủy': 'CANCELLED',
  'Đã trả hàng': 'RETURNED',
}

const orderStatusFromServer: Record<ServerOrderStatus, AdminOrder['status']> = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  PAYMENT_FAILED: 'Thanh toán thất bại',
  PENDING_CONFIRMATION: 'Chờ xác nhận',
  PROCESSING: 'Đang xử lý',
  AWAITING_PICKUP: 'Chờ lấy hàng',
  AWAITING_DELIVERY: 'Chờ giao hàng',
  SHIPPING: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  RETURNED: 'Đã trả hàng',
}

const paymentStatusFromServer: Record<ServerPaymentStatus, AdminOrder['paymentStatus']> = {
  PENDING: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thanh toán thất bại',
  PARTIALLY_REFUNDED: 'Hoàn tiền một phần',
  REFUNDED: 'Đã hoàn tiền',
}

const paymentMethodFromServer: Record<ServerOrder['paymentMethod'], string> = {
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
  COD: 'Thanh toán khi nhận hàng (COD)',
  MOMO_WALLET: 'Ví MoMo',
  MOMO_CARD: 'Thẻ qua MoMo',
}

const refundStatusFromServer: Record<ServerRefundStatus, AdminReturn['status']> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  PROCESSING: 'Đang hoàn tiền',
  COMPLETED: 'Hoàn tất',
  REJECTED: 'Từ chối',
}

const refundStatusToServer: Record<AdminReturn['status'], ServerRefundStatus> = {
  'Chờ duyệt': 'PENDING',
  'Đã duyệt': 'APPROVED',
  'Đang hoàn tiền': 'PROCESSING',
  'Hoàn tất': 'COMPLETED',
  'Từ chối': 'REJECTED',
}

function adminHeaders(useDemoAccess: boolean) {
  return useDemoAccess ? { 'X-CMID-Demo-Admin': 'true' } : undefined
}

function adminOrderPath(useDemoAccess: boolean, suffix = '') {
  return `/orders/${useDemoAccess ? 'demo' : 'admin'}${suffix}`
}

export async function getAdminOrders(useDemoAccess = false): Promise<AdminOrder[]> {
  const orders = await apiFetch<ServerOrder[]>(adminOrderPath(useDemoAccess), {
    headers: adminHeaders(useDemoAccess),
    skipAuth: useDemoAccess,
  })
  return orders.map(toAdminOrder)
}

export async function updateAdminOrderStatus(
  orderId: string,
  status: AdminOrder['status'],
  useDemoAccess = false,
) {
  const order = await apiFetch<ServerOrder>(adminOrderPath(useDemoAccess, `/${encodeURIComponent(orderId)}/status`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...adminHeaders(useDemoAccess) },
    body: JSON.stringify({ status: orderStatusToServer[status] }),
    skipAuth: useDemoAccess,
  })
  return toAdminOrder(order)
}

export async function updateAdminPaymentStatus(
  orderId: string,
  status: 'PAID' | 'FAILED',
  useDemoAccess = false,
) {
  const order = await apiFetch<ServerOrder>(adminOrderPath(useDemoAccess, `/${encodeURIComponent(orderId)}/payment-status`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...adminHeaders(useDemoAccess) },
    body: JSON.stringify({ status }),
    skipAuth: useDemoAccess,
  })
  return toAdminOrder(order)
}

export async function createAdminRefund(
  orderId: string,
  input: { amount: number; reason: string },
  useDemoAccess = false,
) {
  const order = await apiFetch<ServerOrder>(adminOrderPath(useDemoAccess, `/${encodeURIComponent(orderId)}/refunds`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...adminHeaders(useDemoAccess) },
    body: JSON.stringify(input),
    skipAuth: useDemoAccess,
  })
  return toAdminOrder(order)
}

export async function updateAdminRefundStatus(
  refundId: string,
  status: AdminReturn['status'],
  useDemoAccess = false,
) {
  const order = await apiFetch<ServerOrder>(adminOrderPath(useDemoAccess, `/refunds/${encodeURIComponent(refundId)}/status`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...adminHeaders(useDemoAccess) },
    body: JSON.stringify({ status: refundStatusToServer[status] }),
    skipAuth: useDemoAccess,
  })
  return toAdminOrder(order)
}

export async function createCheckoutOrder(input: CreateCheckoutOrderInput) {
  const order = await apiFetch<ServerOrder>('/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    skipAuth: true,
  })
  return toAdminOrder(order)
}

export async function createDemoCheckoutOrder(
  input: Omit<CreateCheckoutOrderInput, 'paymentMethod'> & {
    paymentMethod: ServerOrder['paymentMethod']
  },
) {
  const order = await apiFetch<ServerOrder>('/orders/demo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...adminHeaders(true),
    },
    body: JSON.stringify(input),
    skipAuth: true,
  })
  return toAdminOrder(order)
}

export function getRefundsFromOrders(orders: AdminOrder[]) {
  return orders.flatMap((order) => order.refunds)
}

function toAdminOrder(order: ServerOrder): AdminOrder {
  return {
    id: order.id,
    customer: order.customerName,
    email: order.customerEmail,
    phone: order.customerPhone,
    address: order.address,
    items: order.items.map((item) => ({
      productId: item.productId,
      name: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      price: Number(item.unitPrice),
      image: item.product?.images?.find((image) => image.isPrimary)?.imageUrl ?? item.product?.images?.[0]?.imageUrl ?? '',
    })),
    subtotal: Number(order.subtotal),
    vat: Number(order.vat),
    total: Number(order.total),
    refundedAmount: Number(order.refundedAmount),
    paymentMethod: paymentMethodFromServer[order.paymentMethod],
    paymentMethodCode: order.paymentMethod,
    paymentStatus: paymentStatusFromServer[order.paymentStatus],
    status: orderStatusFromServer[order.status],
    note: order.note ?? '',
    createdAt: order.createdAt,
    refunds: (order.refunds ?? []).map((refund) => ({
      id: refund.id,
      orderId: refund.orderId,
      customer: order.customerName,
      reason: refund.reason,
      amount: Number(refund.amount),
      status: refundStatusFromServer[refund.status],
      provider: refund.provider,
      providerRefundId: refund.providerRefundId,
      requestedBy: refund.requestedBy,
      processedBy: refund.processedBy,
      processedAt: refund.processedAt,
      createdAt: refund.createdAt,
    })),
    statusHistory: (order.statusHistory ?? []).map((entry) => ({
      id: entry.id,
      fromStatus: entry.fromStatus ? orderStatusFromServer[entry.fromStatus] : null,
      toStatus: orderStatusFromServer[entry.toStatus],
      actor: entry.actor,
      note: entry.note ?? '',
      createdAt: entry.createdAt,
    })),
  }
}
