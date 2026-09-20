import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { KhungXuong } from '../../components/common/KhungXuong'
import { useProducts } from '../../hooks/useProducts'
import { useUser, type AuthenticatedUser } from '../../contexts/NguoiDungContext'
import { getCurrentAdmin } from '../../services/auth.service'
import { deleteProduct } from '../../services/product.service'
import {
  createAdminRefund,
  getAdminOrders,
  getRefundsFromOrders,
  updateAdminOrderStatus,
  updateAdminPaymentStatus,
  updateAdminRefundStatus,
} from '../../services/order.service'
import type { Product } from '../../types/product'
import {
  AdminDashboardView,
  AdminOrdersView,
  AdminProductsListView,
  AdminReportsView,
} from './AdminCommerceViews'
import { AdminNewsView, AdminProjectsView } from './AdminContentViews'
import { AdminLayout } from './AdminLayout'
import { AdminLanguageProvider } from './admin-language'
import { AdminOperationalView } from './AdminOperationalViews'
import { AdminProductEditor } from './AdminProductEditor'
import { AdminToast } from './AdminPrimitives'
import { TrangDangNhapQuanTri } from './TrangDangNhapQuanTri'
import {
  getAdminDemoSession,
  isAdminDemoEnabled,
  signInAdminDemo,
  signOutAdminDemo,
} from './admin-demo-auth'
import {
  isAdminUser,
  toAdminSession,
  type AdminRole,
  type AdminSession,
} from './admin-auth'
import {
  ADMIN_DATABASE_UPDATED_EVENT,
  getAdminDatabase,
  type AdminDatabase,
  type AdminOrder,
} from './admin-database'
import {
  ADMIN_CONTENT_UPDATED_EVENT,
  ADMIN_PRODUCTS_UPDATED_EVENT,
  deleteAdminProduct,
} from './admin-local-store'
import { isAdminView, type AdminView } from './admin-navigation'

const operationalViews = new Set<AdminView>([
  'categories',
  'brands',
  'materials',
  'suppliers',
  'quotes',
  'returns',
  'customers',
  'customer-groups',
  'gifts',
  'banners',
  'documents',
  'inquiries',
  'showrooms',
  'settings',
  'users',
  'roles',
  'logs',
])

export function TrangQuanTriPage() {
  const { user, isAuthLoading, signOut } = useUser()
  const [demoSession, setDemoSession] = useState(getAdminDemoSession)

  if (isAdminDemoEnabled && demoSession) {
    return (
      <AuthenticatedAdmin
        session={demoSession}
        onSignOut={() => {
          signOutAdminDemo()
          setDemoSession(null)
        }}
      />
    )
  }

  if (isAdminDemoEnabled && !isAdminUser(user)) {
    return <TrangDangNhapQuanTri onDemoSignIn={() => setDemoSession(signInAdminDemo())} />
  }

  if (isAuthLoading) {
    return <AdminAccessState message="Đang xác minh quyền truy cập quản trị..." isLoading />
  }

  if (!user) {
    return <TrangDangNhapQuanTri />
  }

  if (!isAdminUser(user)) {
    return (
      <AdminAccessState
        message="Tài khoản này chưa được cấp quyền quản trị trên hệ thống."
        onSignOut={() => {
          void signOut()
        }}
      />
    )
  }

  return (
    <AdminAuthorizationGate
      key={`${user.id}:${user.role}`}
      user={user}
      onSignOut={() => {
        void signOut()
      }}
    />
  )
}

function AdminAuthorizationGate({
  user,
  onSignOut,
}: {
  user: AuthenticatedUser & { role: AdminRole }
  onSignOut: () => void
}) {
  const [accessState, setAccessState] = useState<'checking' | 'allowed' | 'denied'>('checking')

  useEffect(() => {
    let isCurrent = true

    void getCurrentAdmin()
      .then(() => {
        if (isCurrent) {
          setAccessState('allowed')
        }
      })
      .catch(() => {
        if (isCurrent) {
          setAccessState('denied')
        }
      })

    return () => {
      isCurrent = false
    }
  }, [])

  if (accessState === 'checking') {
    return <AdminAccessState message="Đang xác minh quyền truy cập quản trị..." isLoading />
  }

  if (accessState === 'denied') {
    return (
      <AdminAccessState
        message="Tài khoản này chưa được cấp quyền quản trị trên hệ thống."
        onSignOut={onSignOut}
      />
    )
  }

  return <AuthenticatedAdmin session={toAdminSession(user)} onSignOut={onSignOut} />
}

function AuthenticatedAdmin({
  session,
  onSignOut,
}: {
  session: AdminSession
  onSignOut: () => void
}) {
  const { products, isLoading, errorMessage, retry } = useProducts()
  const [searchParams, setSearchParams] = useSearchParams()
  const [database, setDatabase] = useState<AdminDatabase>(() => {
    const localDatabase = getAdminDatabase()
    return { ...localDatabase, orders: [], returns: [] }
  })
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>()
  const [toast, setToast] = useState<string | null>(null)
  const [contentVersion, setContentVersion] = useState(0)

  const activeView = useMemo<AdminView>(() => {
    const requestedView = searchParams.get('view')
    return isAdminView(requestedView) ? requestedView : 'dashboard'
  }, [searchParams])
  const requestedProductId = useMemo(
    () => parseProductId(searchParams.get('product')),
    [searchParams],
  )
  const editorProduct = useMemo(
    () => requestedProductId === null
      ? undefined
      : editingProduct?.id === requestedProductId
        ? editingProduct
        : products.find((product) => product.id === requestedProductId),
    [editingProduct, products, requestedProductId],
  )
  const searchedProducts = useMemo(() => {
    const query = (searchParams.get('q') ?? '').trim().toLocaleLowerCase('vi')
    if (!query) return products
    return products.filter((product) => [
      product.name,
      product.nameEn,
      product.sku,
      product.category?.name,
      product.brand?.name,
    ].filter(Boolean).join(' ').toLocaleLowerCase('vi').includes(query))
  }, [products, searchParams])

  const replaceServerOrders = useCallback((orders: AdminOrder[]) => {
    setDatabase((current) => ({
      ...current,
      orders,
      returns: getRefundsFromOrders(orders),
    }))
  }, [])

  const refreshOrders = useCallback(async () => {
    setOrdersLoading(true)
    setOrdersError(null)
    try {
      replaceServerOrders(await getAdminOrders(isAdminDemoEnabled))
    } catch (error) {
      setOrdersError(error instanceof Error ? error.message : 'Không thể tải đơn hàng từ máy chủ.')
    } finally {
      setOrdersLoading(false)
    }
  }, [replaceServerOrders])

  useEffect(() => {
    let isCurrent = true
    void getAdminOrders(isAdminDemoEnabled)
      .then((orders) => {
        if (isCurrent) replaceServerOrders(orders)
      })
      .catch((error: unknown) => {
        if (isCurrent) setOrdersError(error instanceof Error ? error.message : 'Không thể tải đơn hàng từ máy chủ.')
      })
      .finally(() => {
        if (isCurrent) setOrdersLoading(false)
      })
    return () => {
      isCurrent = false
    }
  }, [replaceServerOrders])

  useEffect(() => {
    function syncDatabase() {
      setDatabase((current) => ({
        ...getAdminDatabase(),
        orders: current.orders,
        returns: current.returns,
      }))
    }
    function syncContent() {
      setContentVersion((current) => current + 1)
    }
    window.addEventListener(ADMIN_DATABASE_UPDATED_EVENT, syncDatabase)
    window.addEventListener(ADMIN_CONTENT_UPDATED_EVENT, syncContent)
    window.addEventListener(ADMIN_PRODUCTS_UPDATED_EVENT, syncContent)
    return () => {
      window.removeEventListener(ADMIN_DATABASE_UPDATED_EVENT, syncDatabase)
      window.removeEventListener(ADMIN_CONTENT_UPDATED_EVENT, syncContent)
      window.removeEventListener(ADMIN_PRODUCTS_UPDATED_EVENT, syncContent)
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  function navigate(view: AdminView) {
    if (view !== 'product-editor') setEditingProduct(undefined)
    setSearchParams(view === 'dashboard' ? {} : { view })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function signOut() {
    onSignOut()
  }

  function applyServerOrder(updatedOrder: AdminOrder) {
    setDatabase((current) => {
      const orders = [
        updatedOrder,
        ...current.orders.filter((order) => order.id !== updatedOrder.id),
      ].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
      return { ...current, orders, returns: getRefundsFromOrders(orders) }
    })
  }

  async function changeOrderStatus(orderId: string, status: AdminOrder['status']) {
    const updatedOrder = await updateAdminOrderStatus(orderId, status, isAdminDemoEnabled)
    applyServerOrder(updatedOrder)
    setToast(`Đã cập nhật trạng thái đơn ${orderId}.`)
    return updatedOrder
  }

  async function markOrderPaid(orderId: string) {
    const updatedOrder = await updateAdminPaymentStatus(orderId, 'PAID', isAdminDemoEnabled)
    applyServerOrder(updatedOrder)
    setToast(`Đã xác nhận thanh toán đơn ${orderId}.`)
    return updatedOrder
  }

  async function refundOrder(orderId: string, amount: number, reason: string) {
    const updatedOrder = await createAdminRefund(orderId, { amount, reason }, isAdminDemoEnabled)
    applyServerOrder(updatedOrder)
    setToast(updatedOrder.paymentMethodCode?.startsWith('MOMO')
      ? `Đã gửi yêu cầu hoàn tiền MoMo cho đơn ${orderId}.`
      : `Đã tạo yêu cầu hoàn tiền cho đơn ${orderId}.`)
    return updatedOrder
  }

  async function changeRefundStatus(refundId: string, status: AdminOrder['refunds'][number]['status']) {
    const updatedOrder = await updateAdminRefundStatus(refundId, status, isAdminDemoEnabled)
    applyServerOrder(updatedOrder)
    setToast(`Đã cập nhật yêu cầu hoàn tiền ${refundId}.`)
    return updatedOrder
  }

  function openProductEditor(product?: Product) {
    setEditingProduct(product)
    setSearchParams(product
      ? { view: 'product-editor', product: String(product.id) }
      : { view: 'product-editor' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function removeProduct(product: Product) {
    await deleteProduct(product.id, isAdminDemoEnabled)
    deleteAdminProduct(product.id)
    retry()
    setToast(`Đã xóa sản phẩm “${product.name}”.`)
  }

  return (
    <AdminLanguageProvider language={database.settings.adminLanguage}>
      <AdminLayout
        session={session}
        activeView={activeView}
        activities={database.activities}
        onNavigate={navigate}
        onSignOut={signOut}
        badges={{
          orders: database.orders.filter((order) => order.status === 'Chờ xác nhận').length,
          quotes: database.quotes.filter((quote) => quote.status === 'Mới').length,
          returns: database.returns.filter((item) => item.status === 'Chờ duyệt').length,
          inquiries: database.inquiries.filter((inquiry) => inquiry.status === 'Mới').length,
        }}
      >
        {activeView === 'dashboard' ? (
          <AdminDashboardView products={products} database={database} isLoading={isLoading || ordersLoading} onNavigate={navigate} />
        ) : null}

        {activeView === 'products' ? (
          <AdminProductsListView
            products={searchedProducts}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onRetry={retry}
            onCreate={() => openProductEditor()}
            onEdit={openProductEditor}
            onDelete={removeProduct}
          />
        ) : null}

        {activeView === 'product-editor' ? (
          requestedProductId !== null && !editorProduct ? (
            isLoading ? (
              <AdminEditorLoading />
            ) : (
              <AdminEditorUnavailable onBack={() => navigate('products')} />
            )
          ) : (
            <AdminProductEditor
              key={editorProduct?.id ?? 'new-product'}
              product={editorProduct}
              categories={database.categories}
              brands={database.brands}
              onCancel={() => navigate('products')}
              onSaved={(product) => {
                setEditingProduct(product)
                setToast(editorProduct ? 'Đã cập nhật sản phẩm.' : 'Đã thêm sản phẩm mới.')
                navigate('products')
              }}
            />
          )
        ) : null}

        {activeView === 'orders' ? (
          <AdminOrdersView
            database={database}
            isLoading={ordersLoading}
            errorMessage={ordersError}
            onRetry={() => void refreshOrders()}
            onStatusChange={changeOrderStatus}
            onMarkPaid={markOrderPaid}
            onCreateRefund={refundOrder}
            onRefundStatusChange={changeRefundStatus}
          />
        ) : null}

        {activeView === 'reports' ? (
          <AdminReportsView products={products} database={database} isLoading={isLoading || ordersLoading} />
        ) : null}

        {activeView === 'news' ? (
          <AdminNewsView key={`news-${contentVersion}`} onToast={setToast} />
        ) : null}

        {activeView === 'projects' ? (
          <AdminProjectsView key={`projects-${contentVersion}`} onToast={setToast} />
        ) : null}

        {operationalViews.has(activeView) ? (
          <AdminOperationalView view={activeView} database={database} onToast={setToast} />
        ) : null}

        {toast ? <AdminToast message={toast} onClose={() => setToast(null)} /> : null}
      </AdminLayout>
    </AdminLanguageProvider>
  )
}

function AdminEditorLoading() {
  return (
    <section className="admin-panel" aria-busy="true" aria-label="Đang tải sản phẩm">
      <KhungXuong className="admin-login-form__loading-title" />
      <KhungXuong className="admin-login-form__loading-copy" />
      <KhungXuong className="admin-login-form__loading-copy admin-login-form__loading-copy--short" />
    </section>
  )
}

function AdminEditorUnavailable({ onBack }: { onBack: () => void }) {
  return (
    <section className="admin-panel" role="alert">
      <h2>Không tìm thấy sản phẩm</h2>
      <p>Sản phẩm trong liên kết này đã bị xóa hoặc hiện không còn khả dụng.</p>
      <button className="admin-button admin-button--primary" type="button" onClick={onBack}>
        Quay lại danh sách sản phẩm
      </button>
    </section>
  )
}

function parseProductId(value: string | null) {
  if (!value || !/^\d+$/.test(value)) return null
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function AdminAccessState({
  message,
  onSignOut,
  isLoading = false,
}: {
  message: string
  onSignOut?: () => void
  isLoading?: boolean
}) {
  return (
    <main className="admin-login-page">
      <section className="admin-login-panel" aria-live="polite">
        <div className="admin-login-panel__brand">
          <strong>CMID</strong>
          <span>ADMIN CONSOLE</span>
        </div>
        <div className="admin-login-form" aria-busy={isLoading || undefined}>
          {isLoading ? (
            <div className="admin-login-form__loading" role="status" aria-live="polite">
              <span className="sr-only">{message}</span>
              <KhungXuong className="admin-login-form__loading-title" />
              <KhungXuong className="admin-login-form__loading-copy" />
              <KhungXuong className="admin-login-form__loading-copy admin-login-form__loading-copy--short" />
            </div>
          ) : (
            <div className="admin-login-form__heading">
              <h1>Quyền truy cập quản trị</h1>
              <p>{message}</p>
            </div>
          )}
          {onSignOut ? (
            <button className="admin-login-form__submit" type="button" onClick={onSignOut}>
              Đăng xuất
            </button>
          ) : null}
        </div>
      </section>
    </main>
  )
}
