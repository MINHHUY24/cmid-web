import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProducts } from '../../hooks/useProducts'
import { useUser, type AuthenticatedUser } from '../../contexts/NguoiDungContext'
import { getCurrentAdmin } from '../../services/auth.service'
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
  mutateAdminDatabase,
  type AdminOrder,
} from './admin-database'
import {
  ADMIN_CONTENT_UPDATED_EVENT,
  ADMIN_PRODUCTS_UPDATED_EVENT,
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
    return <AdminAccessState message="Đang xác minh quyền truy cập quản trị..." />
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
    return <AdminAccessState message="Đang xác minh quyền truy cập quản trị..." />
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
  const [database, setDatabase] = useState(() => getAdminDatabase())
  const [editingProduct, setEditingProduct] = useState<Product | undefined>()
  const [toast, setToast] = useState<string | null>(null)
  const [contentVersion, setContentVersion] = useState(0)

  const activeView = useMemo<AdminView>(() => {
    const requestedView = searchParams.get('view')
    return isAdminView(requestedView) ? requestedView : 'dashboard'
  }, [searchParams])
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

  useEffect(() => {
    function syncDatabase() {
      setDatabase(getAdminDatabase())
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

  function changeOrderStatus(orderId: string, status: AdminOrder['status']) {
    mutateAdminDatabase(
      (current) => ({
        ...current,
        orders: current.orders.map((order) => order.id === orderId ? { ...order, status } : order),
      }),
      `Cập nhật đơn hàng ${orderId} sang trạng thái ${status}`,
      'Đơn hàng',
    )
    setToast(`Đã cập nhật trạng thái đơn ${orderId}.`)
  }

  function openProductEditor(product?: Product) {
    setEditingProduct(product)
    setSearchParams({ view: 'product-editor' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
          <AdminDashboardView products={products} database={database} onNavigate={navigate} />
        ) : null}

        {activeView === 'products' ? (
          <AdminProductsListView
            products={searchedProducts}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onRetry={retry}
            onCreate={() => openProductEditor()}
            onEdit={openProductEditor}
          />
        ) : null}

        {activeView === 'product-editor' ? (
          <AdminProductEditor
            key={editingProduct?.id ?? 'new-product'}
            product={editingProduct}
            categories={database.categories}
            brands={database.brands}
            onCancel={() => navigate('products')}
            onSaved={(product) => {
              setEditingProduct(product)
              setToast(editingProduct ? 'Đã cập nhật sản phẩm.' : 'Đã thêm sản phẩm mới.')
              navigate('products')
            }}
          />
        ) : null}

        {activeView === 'orders' ? (
          <AdminOrdersView database={database} onStatusChange={changeOrderStatus} />
        ) : null}

        {activeView === 'reports' ? (
          <AdminReportsView products={products} database={database} />
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

function AdminAccessState({
  message,
  onSignOut,
}: {
  message: string
  onSignOut?: () => void
}) {
  return (
    <main className="admin-login-page">
      <section className="admin-login-panel" aria-live="polite">
        <div className="admin-login-panel__brand">
          <strong>CMID</strong>
          <span>ADMIN CONSOLE</span>
        </div>
        <div className="admin-login-form">
          <div className="admin-login-form__heading">
            <h1>Quyền truy cập quản trị</h1>
            <p>{message}</p>
          </div>
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
