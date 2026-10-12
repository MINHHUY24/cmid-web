import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import '../../styles/admin-styles/trang-quan-tri.css'
import { KhungXuong } from '../../components/common/KhungXuong'
import { useProducts } from '../../hooks/useProducts'
import { type AuthenticatedUser } from '../../contexts/NguoiDungContext'
import { AdminAuthProvider } from '../../contexts/QuanTriContext'
import { useAdminAuth } from '../../contexts/useQuanTriAuth'
import { getCurrentAdmin } from '../../services/auth.service'
import { deleteProduct, saveProduct } from '../../services/product.service'
import {
  createAdminRefund,
  getAdminOrders,
  getRefundsFromOrders,
  updateAdminOrderStatus,
  updateAdminPaymentStatus,
  updateAdminRefundStatus,
} from '../../services/order.service'
import type { Product, ProductStatus, SaleType } from '../../types/product'
import {
  AdminDashboardView,
  AdminOrdersView,
  AdminProductsListView,
  AdminReportsView,
  type AdminProductListFilters,
  type ProductSaleFilter,
  type ProductStatusFilter,
} from './GiaoDienThuongMaiQuanTri'
import { AdminNewsView, AdminProjectsView } from './GiaoDienNoiDungQuanTri'
import { AdminLayout } from './BoCucQuanTri'
import { canAccessAdminView, getFirstAccessibleAdminView, hasPermission } from './PhanQuyenQuanTri'
import { AdminLanguageProvider } from './NgonNguQuanTri'
import { AdminOperationalView } from './GiaoDienVanHanhQuanTri'
import { AdminHelpdeskView } from './GiaoDienHoTroQuanTri'
import { AdminEmployeeProfileView } from './HoSoNhanVienQuanTri'
import { AdminProductEditor } from './TrinhSuaSanPhamQuanTri'
import { AdminBangKhungXuong, AdminToast } from './ThanhPhanCoBanQuanTri'
import { TrangDangNhapQuanTri } from './TrangDangNhapQuanTri'
import { isAdminDemoEnabled } from './XacThucMauQuanTri'
import {
  isAdminUser,
  toAdminSession,
  type AdminRole,
  type AdminSession,
} from './XacThucQuanTri'
import {
  ADMIN_DATABASE_UPDATED_EVENT,
  clearLegacyAdminDatabase,
  getAdminDatabase,
  hydrateAdminDatabase,
  setAdminWorkspacePersistence,
  type AdminDatabase,
  type AdminOrder,
} from './CoSoDuLieuQuanTri'
import {
  getAdminWorkspace,
  replaceAdminWorkspace,
} from '../../services/admin-workspace.service'
import { isAdminView, type AdminView } from './DieuHuongQuanTri'

const operationalViews = new Set<AdminView>([
  'categories',
  'brands',
  'materials',
  'suppliers',
  'returns',
  'customers',
  'customer-groups',
  'gifts',
  'banners',
  'inquiries',
  'showrooms',
  'settings',
  'users',
  'roles',
  'logs',
])

export function TrangQuanTriPage() {
  return (
    <AdminAuthProvider>
      <TrangQuanTriContent />
    </AdminAuthProvider>
  )
}

function TrangQuanTriContent() {
  const { adminUser, isAdminAuthLoading, signOutAdmin } = useAdminAuth()
  if (isAdminAuthLoading) {
    return <AdminSessionSkeleton />
  }

  if (!adminUser) {
    return <TrangDangNhapQuanTri />
  }

  if (!isAdminUser(adminUser)) {
    return (
      <AdminAccessState
        message="Tài khoản này chưa được cấp quyền quản trị trên hệ thống."
        onSignOut={() => {
          void signOutAdmin()
        }}
      />
    )
  }

  return (
    <AdminAuthorizationGate
      key={`${adminUser.id}:${adminUser.role}`}
      user={adminUser}
      onSignOut={() => {
        void signOutAdmin()
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
    return <AdminSessionSkeleton />
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

function AdminSessionSkeleton() {
  return (
    <div className="admin-shell admin-shell--skeleton" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Đang khôi phục phiên quản trị</span>
      <aside className="admin-sidebar" aria-hidden="true">
        <div className="admin-sidebar__brand admin-session-skeleton__brand">
          <KhungXuong className="admin-session-skeleton__brand-name" />
          <KhungXuong className="admin-session-skeleton__brand-subtitle" />
          <KhungXuong className="admin-session-skeleton__brand-label" />
        </div>
        <nav className="admin-sidebar__nav admin-session-skeleton__nav">
          {Array.from({ length: 3 }, (_, groupIndex) => (
            <div className="admin-session-skeleton__nav-group" key={groupIndex}>
              <KhungXuong className="admin-session-skeleton__nav-label" />
              {Array.from({ length: groupIndex === 0 ? 4 : 3 }, (_, itemIndex) => (
                <div className="admin-session-skeleton__nav-item" key={itemIndex}>
                  <KhungXuong className="admin-session-skeleton__nav-icon" />
                  <KhungXuong className="admin-session-skeleton__nav-copy" />
                </div>
              ))}
            </div>
          ))}
        </nav>
        <div className="admin-sidebar__profile admin-session-skeleton__profile">
          <KhungXuong className="admin-session-skeleton__avatar" />
          <div>
            <KhungXuong className="admin-session-skeleton__profile-name" />
            <KhungXuong className="admin-session-skeleton__profile-role" />
          </div>
          <KhungXuong className="admin-session-skeleton__sign-out" />
        </div>
      </aside>

      <div className="admin-workspace" aria-hidden="true">
        <header className="admin-topbar admin-session-skeleton__topbar">
          <KhungXuong className="admin-session-skeleton__breadcrumb" />
          <KhungXuong className="admin-session-skeleton__notification" />
          <KhungXuong className="admin-session-skeleton__site-link" />
        </header>
        <main className="admin-main">
          <section className="admin-session-skeleton__heading">
            <KhungXuong className="admin-session-skeleton__title" />
            <KhungXuong className="admin-session-skeleton__description" />
          </section>
          <section className="admin-panel admin-toolbar admin-session-skeleton__toolbar">
            <KhungXuong />
          </section>
          <section className="admin-panel admin-table-panel">
            <AdminBangKhungXuong columns={6} rows={6} label="Đang tải nội dung quản trị" />
          </section>
        </main>
      </div>
    </div>
  )
}

function AuthenticatedAdmin({
  session: initialSession,
  onSignOut,
}: {
  session: AdminSession
  onSignOut: () => void
}) {
  const [session, setSession] = useState(initialSession)
  const { products, isLoading, errorMessage, retry, removeProduct: removeProductFromList } = useProducts({ includeModels: true })
  const [searchParams, setSearchParams] = useSearchParams()
  const [database, setDatabase] = useState<AdminDatabase>(() => {
    const localDatabase = getAdminDatabase()
    return { ...localDatabase, orders: [], returns: [] }
  })
  const [ordersLoading, setOrdersLoading] = useState(
    () => canAccessAdminView(session.permissions, 'orders'),
  )
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>()
  const [toast, setToast] = useState<string | null>(null)
  const [isToastClosing, setIsToastClosing] = useState(false)
  const toastCloseTimerRef = useRef<number | null>(null)
  const previousToastRef = useRef<string | null>(null)

  const activeView = useMemo<AdminView>(() => {
    const requestedView = searchParams.get('view')
    return isAdminView(requestedView) ? requestedView : 'dashboard'
  }, [searchParams])
  const canAccessActiveView = canAccessAdminView(session.permissions, activeView)
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
  const productListFilters = useMemo<AdminProductListFilters>(() => ({
    search: searchParams.get('q') ?? '',
    category: searchParams.get('productCategory') ?? 'ALL',
    status: toProductStatusFilter(searchParams.get('productStatus')),
    saleType: toProductSaleFilter(searchParams.get('productSaleType')),
  }), [searchParams])

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
    if (!canAccessAdminView(session.permissions, 'orders')) return () => { isCurrent = false }
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
  }, [replaceServerOrders, session.permissions])

  useEffect(() => {
    let isCurrent = true
    setAdminWorkspacePersistence(async (nextDatabase) => {
      await replaceAdminWorkspace(nextDatabase)
    })

    void getAdminWorkspace()
      .then(async (state) => {
        if (!isCurrent) return
        const database = state.data ?? getAdminDatabase()
        if (state.data === null) {
          await replaceAdminWorkspace(database)
        }
        if (!isCurrent) return
        hydrateAdminDatabase(database)
        clearLegacyAdminDatabase()
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setToast(error instanceof Error ? error.message : 'Không thể đồng bộ dữ liệu quản trị với máy chủ.')
        }
      })

    return () => {
      isCurrent = false
      setAdminWorkspacePersistence(null)
    }
  }, [])

  useEffect(() => {
    function syncDatabase() {
      setDatabase((current) => ({
        ...getAdminDatabase(),
        orders: current.orders,
        returns: current.returns,
      }))
    }
    window.addEventListener(ADMIN_DATABASE_UPDATED_EVENT, syncDatabase)
    return () => {
      window.removeEventListener(ADMIN_DATABASE_UPDATED_EVENT, syncDatabase)
    }
  }, [])

  function closeToast() {
    if (!toast || isToastClosing) return
    setIsToastClosing(true)
    if (toastCloseTimerRef.current !== null) window.clearTimeout(toastCloseTimerRef.current)
    toastCloseTimerRef.current = window.setTimeout(() => {
      setToast(null)
      setIsToastClosing(false)
      toastCloseTimerRef.current = null
    }, 190)
  }

  useEffect(() => {
    if (previousToastRef.current === toast) return
    previousToastRef.current = toast
    if (toastCloseTimerRef.current !== null) window.clearTimeout(toastCloseTimerRef.current)
    toastCloseTimerRef.current = null
    setIsToastClosing(false)
  }, [toast])

  useEffect(() => {
    if (!toast || isToastClosing) return undefined
    const timeout = window.setTimeout(closeToast, 3200)
    return () => window.clearTimeout(timeout)
  }, [isToastClosing, toast])

  useEffect(() => () => {
    if (toastCloseTimerRef.current !== null) window.clearTimeout(toastCloseTimerRef.current)
  }, [])

  function navigate(view: AdminView) {
    if (!canAccessAdminView(session.permissions, view)) return
    if (view !== 'product-editor') setEditingProduct(undefined)
    const restoreProductsScroll = activeView === 'product-editor' && view === 'products'
    const nextSearchParams = new URLSearchParams(searchParams)
    if (view === 'dashboard') {
      nextSearchParams.delete('view')
    } else {
      nextSearchParams.set('view', view)
    }
    if (view !== 'product-editor') nextSearchParams.delete('product')
    setSearchParams(
      nextSearchParams,
      restoreProductsScroll ? { state: { restoreScroll: true } } : undefined,
    )
  }

  function openHelpdeskTicket(ticketId: string) {
    if (!canAccessAdminView(session.permissions, 'helpdesk')) return
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.set('view', 'helpdesk')
    nextSearchParams.set('ticket', ticketId)
    nextSearchParams.delete('product')
    setEditingProduct(undefined)
    setSearchParams(nextSearchParams)
  }

  function updateProductListFilters(filters: AdminProductListFilters) {
    setSearchParams((current) => {
      const nextSearchParams = new URLSearchParams(current)
      nextSearchParams.set('view', 'products')
      nextSearchParams.delete('product')
      setProductFilterParam(nextSearchParams, 'q', filters.search)
      setProductFilterParam(nextSearchParams, 'productCategory', filters.category, 'ALL')
      setProductFilterParam(nextSearchParams, 'productStatus', filters.status, 'ALL')
      setProductFilterParam(nextSearchParams, 'productSaleType', filters.saleType, 'ALL')
      return nextSearchParams
    }, { replace: true, preventScrollReset: true })
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
    setSearchParams((current) => {
      const nextSearchParams = new URLSearchParams(current)
      nextSearchParams.set('view', 'product-editor')
      if (product) {
        nextSearchParams.set('product', String(product.id))
      } else {
        nextSearchParams.delete('product')
      }
      return nextSearchParams
    })
  }

  async function removeProduct(product: Product) {
    await deleteProduct(product.id, isAdminDemoEnabled)
    removeProductFromList(product.id)
    setToast(`Đã xóa sản phẩm “${product.name}”.`)
  }

  async function changeProductStatus(product: Product, status: ProductStatus) {
    const savedProduct = await saveProduct({ ...product, status }, isAdminDemoEnabled)
    setEditingProduct((current) => current?.id === savedProduct.id ? savedProduct : current)
    setToast(`Đã cập nhật trạng thái “${savedProduct.name}”.`)
  }

  return (
    <AdminLanguageProvider language={database.settings.adminLanguage}>
      <AdminLayout
        session={session}
        activeView={activeView}
        activities={database.activities}
        onNavigate={navigate}
        onOpenHelpdeskTicket={openHelpdeskTicket}
        onSignOut={signOut}
        badges={{
          orders: database.orders.filter((order) => order.status === 'Chờ xác nhận').length,
          returns: database.returns.filter((item) => item.status === 'Chờ duyệt').length,
          inquiries: database.inquiries.filter((inquiry) => inquiry.status === 'Mới').length,
        }}
      >
        {!canAccessActiveView ? (
          <AdminForbiddenView onNavigate={() => {
            const fallback = getFirstAccessibleAdminView(session.permissions)
            if (fallback) navigate(fallback)
          }} />
        ) : null}

        {canAccessActiveView && activeView === 'dashboard' ? (
          <AdminDashboardView products={products} database={database} isLoading={isLoading || ordersLoading} onNavigate={navigate} />
        ) : null}

        {canAccessActiveView && activeView === 'products' ? (
          <AdminProductsListView
            products={products}
            filters={productListFilters}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onRetry={retry}
            onFiltersChange={updateProductListFilters}
            onCreate={() => openProductEditor()}
            onEdit={openProductEditor}
            onDelete={removeProduct}
            onStatusChange={changeProductStatus}
            canChangeStatus={hasPermission(session.permissions, 'product.publish')}
          />
        ) : null}

        {canAccessActiveView && activeView === 'product-editor' ? (
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
              showrooms={database.showrooms}
              canManageInventory={hasPermission(session.permissions, 'inventory.update')}
              canPublish={hasPermission(session.permissions, 'product.publish')}
              onCancel={() => navigate('products')}
              onSaved={(product) => {
                setEditingProduct(product)
                setToast(editorProduct ? 'Đã cập nhật sản phẩm.' : 'Đã thêm sản phẩm mới.')
                navigate('products')
              }}
            />
          )
        ) : null}

        {canAccessActiveView && activeView === 'orders' ? (
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

        {canAccessActiveView && activeView === 'reports' ? (
          <AdminReportsView products={products} database={database} isLoading={isLoading || ordersLoading} />
        ) : null}

        {canAccessActiveView && activeView === 'news' ? (
          <AdminNewsView onToast={setToast} />
        ) : null}

        {canAccessActiveView && activeView === 'projects' ? (
          <AdminProjectsView onToast={setToast} />
        ) : null}

        {canAccessActiveView && activeView === 'helpdesk' ? (
          <AdminHelpdeskView onToast={setToast} />
        ) : null}

        {canAccessActiveView && activeView === 'profile' ? (
          <AdminEmployeeProfileView
            session={session}
            onUpdated={(profile) => {
              setSession((current) => ({
                ...current,
                name: profile.fullName,
                roleName: profile.roleName,
              }))
              setToast('Đã cập nhật thông tin cá nhân.')
            }}
          />
        ) : null}

        {canAccessActiveView && operationalViews.has(activeView) ? (
          <AdminOperationalView view={activeView} database={database} onToast={setToast} />
        ) : null}

        {toast ? <AdminToast isClosing={isToastClosing} message={toast} onClose={closeToast} /> : null}
      </AdminLayout>
    </AdminLanguageProvider>
  )
}

function AdminForbiddenView({ onNavigate }: { onNavigate: () => void }) {
  return (
    <section className="admin-forbidden" role="alert">
      <span>403</span>
      <h1>Bạn không có quyền truy cập chức năng này</h1>
      <p>Chức năng chỉ hiển thị và hoạt động khi tài khoản được cấp permission phù hợp.</p>
      <button className="admin-button admin-button--primary" type="button" onClick={onNavigate}>Về trang được cấp quyền</button>
    </section>
  )
}

function AdminEditorLoading() {
  return (
    <section className="admin-editor-loading" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Đang tải dữ liệu sản phẩm</span>
      <header className="admin-editor-loading__heading" aria-hidden="true">
        <div>
          <KhungXuong className="admin-editor-loading__title" />
          <KhungXuong className="admin-editor-loading__description" />
        </div>
        <div className="admin-editor-loading__actions">
          <KhungXuong />
          <KhungXuong />
        </div>
      </header>

      <div className="admin-editor-loading__grid" aria-hidden="true">
        <div className="admin-editor-loading__main">
          <section className="admin-panel admin-editor-loading__panel">
            <KhungXuong className="admin-editor-loading__panel-title" />
            <div className="admin-editor-loading__field-grid">
              {Array.from({ length: 4 }, (_, index) => <KhungXuong key={index} />)}
            </div>
            <KhungXuong className="admin-editor-loading__field" />
            <KhungXuong className="admin-editor-loading__textarea" />
            <KhungXuong className="admin-editor-loading__textarea admin-editor-loading__textarea--short" />
          </section>
          <section className="admin-panel admin-editor-loading__panel admin-editor-loading__panel--detail">
            <KhungXuong className="admin-editor-loading__panel-title" />
            <KhungXuong className="admin-editor-loading__line" />
            <KhungXuong className="admin-editor-loading__line admin-editor-loading__line--short" />
            <KhungXuong className="admin-editor-loading__textarea" />
          </section>
        </div>
        <aside className="admin-editor-loading__side">
          <section className="admin-panel admin-editor-loading__panel">
            <KhungXuong className="admin-editor-loading__panel-title" />
            <KhungXuong className="admin-editor-loading__field" />
            <KhungXuong className="admin-editor-loading__field" />
            <KhungXuong className="admin-editor-loading__field admin-editor-loading__field--short" />
          </section>
          <section className="admin-panel admin-editor-loading__panel">
            <KhungXuong className="admin-editor-loading__panel-title" />
            <div className="admin-editor-loading__images">
              {Array.from({ length: 4 }, (_, index) => <KhungXuong key={index} />)}
            </div>
          </section>
        </aside>
      </div>
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

function toProductStatusFilter(value: string | null): ProductStatusFilter {
  return value === 'ACTIVE' || value === 'OUT_OF_STOCK' || value === 'INACTIVE' || value === 'DRAFT'
    ? value as ProductStatus
    : 'ALL'
}

function toProductSaleFilter(value: string | null): ProductSaleFilter {
  return value === 'DIRECT_ORDER' || value === 'REQUEST_QUOTE'
    ? value as SaleType
    : 'ALL'
}

function setProductFilterParam(
  searchParams: URLSearchParams,
  key: string,
  value: string,
  defaultValue = '',
) {
  if (value === defaultValue || value === '') {
    searchParams.delete(key)
  } else {
    searchParams.set(key, value)
  }
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
