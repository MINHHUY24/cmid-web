import {
  ArrowRight,
  ChartBar,
  CheckCircle,
  Clock,
  DownloadSimple,
  Eye,
  MagnifyingGlass,
  Package,
  PencilSimple,
  Plus,
  ShoppingCartSimple,
  TrendUp,
  UsersThree,
  X,
} from '@phosphor-icons/react'
import { useMemo, useState, type CSSProperties } from 'react'
import type { Product, ProductStatus, SaleType } from '../../types/product'
import { formatCurrency } from '../../utils/formatCurrency'
import { AdminPageHeading, AdminPanel, AdminStatus } from './AdminPrimitives'
import type { AdminDatabase, AdminOrder } from './admin-database'
import type { AdminView } from './admin-navigation'

type OrderFilter = 'ALL' | AdminOrder['status']
type PaymentFilter = 'ALL' | AdminOrder['paymentStatus']
type ProductStatusFilter = 'ALL' | ProductStatus
type ProductSaleFilter = 'ALL' | SaleType
type ReportPeriod = '30' | '90' | '365' | 'ALL'

const orderStatuses: AdminOrder['status'][] = [
  'Chờ xác nhận',
  'Đang xử lý',
  'Đang giao',
  'Hoàn thành',
  'Đã hủy',
]

const paymentStatuses: AdminOrder['paymentStatus'][] = [
  'Chưa thanh toán',
  'Đã thanh toán',
  'Đã hoàn tiền',
]

const productStatusLabels: Record<ProductStatus, string> = {
  ACTIVE: 'Đang bán',
  INACTIVE: 'Ngưng bán',
  DRAFT: 'Bản nháp',
}

const saleTypeLabels: Record<SaleType, string> = {
  DIRECT_ORDER: 'Mua trực tiếp',
  REQUEST_QUOTE: 'Liên hệ báo giá',
}

export interface AdminDashboardViewProps {
  products: Product[]
  database: AdminDatabase
  onNavigate: (view: AdminView) => void
}

export interface AdminProductsListViewProps {
  products: Product[]
  isLoading: boolean
  errorMessage: string | null
  onRetry: () => void
  onCreate: () => void
  onEdit: (product: Product) => void
}

export interface AdminOrdersViewProps {
  database: AdminDatabase
  onStatusChange: (orderId: string, status: AdminOrder['status']) => void
}

export interface AdminReportsViewProps {
  products: Product[]
  database: AdminDatabase
}

export function AdminDashboardView({
  products,
  database,
  onNavigate,
}: AdminDashboardViewProps) {
  const paidOrders = database.orders.filter(
    (order) => order.paymentStatus === 'Đã thanh toán' && order.status !== 'Đã hủy',
  )
  const recordedRevenue = sum(paidOrders.map((order) => order.total))
  const activeProducts = products.filter((product) => product.status === 'ACTIVE').length
  const pendingOrders = database.orders.filter((order) => order.status === 'Chờ xác nhận').length
  const monthlyRevenue = getMonthlyRevenue(database.orders, 6)
  const maxRevenue = Math.max(1, ...monthlyRevenue.map((item) => item.value))

  return (
    <>
      <AdminPageHeading
        title="Xin chào, Admin"
        description="Tổng hợp nhanh hoạt động thương mại và nội dung đang vận hành trên website CMID."
        action={(
          <button className="admin-button admin-button--primary" type="button" onClick={() => onNavigate('reports')}>
            <ChartBar size={17} /> Xem báo cáo
          </button>
        )}
      />

      <div className="admin-kpi-grid">
        <MetricCard
          label="Doanh thu ghi nhận"
          value={formatCurrency(recordedRevenue)}
          helper={`${paidOrders.length} đơn đã thanh toán`}
          icon={<TrendUp size={19} />}
          highlighted
        />
        <MetricCard
          label="Đơn chờ xác nhận"
          value={String(pendingOrders)}
          helper={`${database.orders.length} đơn trong hệ thống`}
          icon={<ShoppingCartSimple size={19} />}
        />
        <MetricCard
          label="Sản phẩm đang bán"
          value={String(activeProducts)}
          helper={`${products.length} sản phẩm trong catalogue`}
          icon={<Package size={19} />}
        />
        <MetricCard
          label="Khách hàng"
          value={String(database.customers.length)}
          helper={`${database.customerGroups.length} nhóm khách hàng`}
          icon={<UsersThree size={19} />}
        />
      </div>

      <div className="admin-dashboard-grid">
        <AdminPanel title="Doanh thu 6 tháng gần nhất" className="admin-commerce-chart-panel">
          <div className="admin-commerce-chart" aria-label="Biểu đồ doanh thu 6 tháng">
            {monthlyRevenue.map((item) => (
              <div className="admin-commerce-chart__column" key={item.key}>
                <span>{formatCompactCurrency(item.value)}</span>
                <i
                  aria-hidden="true"
                  style={{ '--admin-commerce-bar': `${Math.max(4, Math.round((item.value / maxRevenue) * 100))}%` } as CSSProperties}
                />
                <b>{item.label}</b>
              </div>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Việc cần xử lý" className="admin-panel--tasks">
          <button type="button" onClick={() => onNavigate('orders')}>
            <span><Clock size={18} /> {pendingOrders} đơn đang chờ xác nhận</span>
            <ArrowRight size={15} />
          </button>
          <button type="button" onClick={() => onNavigate('returns')}>
            <span><ShoppingCartSimple size={18} /> {database.returns.length} yêu cầu trả hàng</span>
            <ArrowRight size={15} />
          </button>
          <button type="button" onClick={() => onNavigate('products')}>
            <span><Package size={18} /> {countLowStockProducts(products)} sản phẩm sắp hết hàng</span>
            <ArrowRight size={15} />
          </button>
          <button type="button" onClick={() => onNavigate('inquiries')}>
            <span><UsersThree size={18} /> Kiểm tra liên hệ và yêu cầu báo giá</span>
            <ArrowRight size={15} />
          </button>
        </AdminPanel>
      </div>

      <div className="admin-dashboard-grid">
        <AdminPanel title="Đơn hàng gần đây" className="admin-table-panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Mã đơn</th><th>Khách hàng</th><th>Tổng giá trị</th><th className="admin-table__cell--center">Trạng thái</th></tr>
              </thead>
              <tbody>
                {database.orders.slice(0, 5).map((order) => (
                  <tr key={order.id}>
                    <td><strong>{order.id}</strong><small>{formatDate(order.createdAt)}</small></td>
                    <td>{order.customer}</td>
                    <td className="admin-table__price">{formatCurrency(order.total)}</td>
                    <td className="admin-table__cell--center"><AdminStatus>{order.status}</AdminStatus></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminPanel>

        <AdminPanel title="Sản phẩm cập nhật gần đây" className="admin-panel--recent">
          {products.slice(0, 5).map((product) => {
            const image = getProductImage(product)
            return (
              <div className="admin-recent-product" key={product.id}>
                <span className="admin-product-thumb">
                  {image ? <img src={image} alt="" /> : <Package size={19} />}
                </span>
                <div><strong>{product.name}</strong><span>{product.sku}</span></div>
                <b>{formatCurrency(product.price)}</b>
              </div>
            )
          })}
          {products.length === 0 ? <div className="admin-empty"><Package size={28} /><p>Chưa có sản phẩm.</p></div> : null}
        </AdminPanel>
      </div>

      <AdminPanel title="Nhật ký hoạt động" className="admin-activity">
        {database.activities.slice(0, 6).map((activity) => (
          <div key={activity.id}>
            <CheckCircle size={17} />
            <p><strong>{activity.actor}</strong> {activity.action}<span>{activity.module} · {formatDateTime(activity.createdAt)}</span></p>
          </div>
        ))}
      </AdminPanel>
    </>
  )
}

export function AdminProductsListView({
  products,
  isLoading,
  errorMessage,
  onRetry,
  onCreate,
  onEdit,
}: AdminProductsListViewProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')
  const [status, setStatus] = useState<ProductStatusFilter>('ALL')
  const [saleType, setSaleType] = useState<ProductSaleFilter>('ALL')

  const categories = useMemo(() => {
    const options = new Map<string, string>()
    products.forEach((product) => {
      if (product.category) options.set(product.category.slug, product.category.name)
    })
    return [...options.entries()].sort((first, second) => first[1].localeCompare(second[1], 'vi'))
  }, [products])

  const filteredProducts = useMemo(() => {
    const query = normalize(search)
    return products.filter((product) => {
      const matchesSearch = !query || normalize([
        product.name,
        product.nameEn,
        product.sku,
        product.category?.name,
        product.brand?.name,
      ].filter(Boolean).join(' ')).includes(query)
      const matchesCategory = category === 'ALL' || product.category?.slug === category
      const matchesStatus = status === 'ALL' || product.status === status
      const matchesSaleType = saleType === 'ALL' || product.saleType === saleType
      return matchesSearch && matchesCategory && matchesStatus && matchesSaleType
    })
  }, [category, products, saleType, search, status])

  return (
    <>
      <AdminPageHeading
        title="Quản lý sản phẩm"
        description="Quản lý dữ liệu catalogue, loại bán, trạng thái hiển thị và tồn kho tham chiếu."
        action={(
          <button className="admin-button admin-button--primary" type="button" onClick={onCreate}>
            <Plus size={17} weight="bold" /> Thêm sản phẩm
          </button>
        )}
      />

      <div className="admin-kpi-grid">
        <MetricCard label="Tổng sản phẩm" value={String(products.length)} helper="Toàn bộ catalogue" icon={<Package size={19} />} />
        <MetricCard label="Đang bán" value={String(products.filter((item) => item.status === 'ACTIVE').length)} helper="Hiển thị trên website" icon={<CheckCircle size={19} />} />
        <MetricCard label="Mua trực tiếp" value={String(products.filter((item) => item.saleType === 'DIRECT_ORDER').length)} helper="Có thể thêm vào giỏ" icon={<ShoppingCartSimple size={19} />} />
        <MetricCard label="Cần báo giá" value={String(products.filter((item) => item.saleType === 'REQUEST_QUOTE').length)} helper="Chuyển sang liên hệ" icon={<ChartBar size={19} />} />
      </div>

      <AdminPanel className="admin-toolbar admin-commerce-toolbar">
        <label>
          <MagnifyingGlass size={17} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên, mã SKU, thương hiệu..." />
        </label>
        <select className="admin-inline-select" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Lọc danh mục">
          <option value="ALL">Tất cả danh mục</option>
          {categories.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
        </select>
        <select className="admin-inline-select" value={status} onChange={(event) => setStatus(event.target.value as ProductStatusFilter)} aria-label="Lọc trạng thái">
          <option value="ALL">Tất cả trạng thái</option>
          {Object.entries(productStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select className="admin-inline-select" value={saleType} onChange={(event) => setSaleType(event.target.value as ProductSaleFilter)} aria-label="Lọc loại bán">
          <option value="ALL">Tất cả loại bán</option>
          {Object.entries(saleTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <span>{filteredProducts.length} sản phẩm</span>
      </AdminPanel>

      {isLoading ? (
        <AdminPanel><div className="admin-loading"><Package size={30} /><p>Đang tải sản phẩm...</p></div></AdminPanel>
      ) : errorMessage ? (
        <AdminPanel>
          <div className="admin-empty">
            <Package size={30} />
            <p>{errorMessage}</p>
            <button className="admin-button" type="button" onClick={onRetry}>Thử lại</button>
          </div>
        </AdminPanel>
      ) : (
        <AdminPanel className="admin-table-panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Sản phẩm</th><th>Mã SKU</th><th>Danh mục</th><th>Giá bán</th><th>Loại bán</th><th>Tồn kho</th><th className="admin-table__cell--center">Trạng thái</th><th className="admin-table__cell--actions">Thao tác</th></tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const image = getProductImage(product)
                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="admin-product-cell">
                          <span className="admin-product-thumb">{image ? <img src={image} alt="" /> : <Package size={19} />}</span>
                          <strong>{product.name}</strong>
                        </div>
                      </td>
                      <td>{product.sku}</td>
                      <td>{product.category?.name ?? 'Chưa phân loại'}<small>{product.brand?.name ?? 'Chưa có thương hiệu'}</small></td>
                      <td className="admin-table__price">{formatCurrency(product.price)}</td>
                      <td>{saleTypeLabels[product.saleType]}</td>
                      <td>{typeof product.stock === 'number' ? `${product.stock} ${product.unit ?? ''}`.trim() : 'Chưa cập nhật'}</td>
                      <td className="admin-table__cell--center"><AdminStatus>{productStatusLabels[product.status]}</AdminStatus></td>
                      <td className="admin-table__cell--actions"><button className="admin-row-action" type="button" onClick={() => onEdit(product)} aria-label={`Chỉnh sửa ${product.name}`}><PencilSimple size={17} /></button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredProducts.length === 0 ? <div className="admin-empty"><Package size={29} /><p>Không có sản phẩm phù hợp bộ lọc.</p></div> : null}
        </AdminPanel>
      )}
    </>
  )
}

export function AdminOrdersView({ database, onStatusChange }: AdminOrdersViewProps) {
  const [activeTab, setActiveTab] = useState<OrderFilter>('ALL')
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('ALL')
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)

  const filteredOrders = useMemo(() => {
    const query = normalize(search)
    return database.orders.filter((order) => {
      const matchesTab = activeTab === 'ALL' || order.status === activeTab
      const matchesPayment = paymentFilter === 'ALL' || order.paymentStatus === paymentFilter
      const matchesSearch = !query || normalize([
        order.id,
        order.customer,
        order.email,
        order.phone,
        ...order.items.map((item) => item.name),
      ].join(' ')).includes(query)
      return matchesTab && matchesPayment && matchesSearch
    })
  }, [activeTab, database.orders, paymentFilter, search])

  function updateStatus(orderId: string, status: AdminOrder['status']) {
    onStatusChange(orderId, status)
    setSelectedOrder((current) => current?.id === orderId ? { ...current, status } : current)
  }

  return (
    <>
      <AdminPageHeading
        title="Quản lý đơn hàng"
        description="Tiếp nhận đơn từ website, kiểm tra thanh toán và theo dõi tiến độ xử lý."
        action={(
          <button className="admin-button" type="button" onClick={() => exportOrdersCsv(filteredOrders)}>
            <DownloadSimple size={17} /> Xuất CSV
          </button>
        )}
      />

      <div className="admin-order-tabs" role="tablist" aria-label="Trạng thái đơn hàng">
        <button className={activeTab === 'ALL' ? 'is-active' : ''} type="button" onClick={() => setActiveTab('ALL')}>
          Tất cả <b>{database.orders.length}</b>
        </button>
        {orderStatuses.map((status) => (
          <button className={activeTab === status ? 'is-active' : ''} key={status} type="button" onClick={() => setActiveTab(status)}>
            {status} <b>{database.orders.filter((order) => order.status === status).length}</b>
          </button>
        ))}
      </div>

      <AdminPanel className="admin-toolbar admin-commerce-toolbar">
        <label>
          <MagnifyingGlass size={17} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm mã đơn, khách hàng, sản phẩm..." />
        </label>
        <select className="admin-inline-select" value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value as PaymentFilter)} aria-label="Lọc thanh toán">
          <option value="ALL">Tất cả thanh toán</option>
          {paymentStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <span>{filteredOrders.length} đơn hàng</span>
      </AdminPanel>

      <AdminPanel className="admin-table-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Mã đơn</th><th>Khách hàng</th><th>Sản phẩm</th><th>Tổng giá trị</th><th className="admin-table__cell--center">Thanh toán</th><th className="admin-table__cell--center">Trạng thái</th><th className="admin-table__cell--actions">Chi tiết</th></tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td><strong>{order.id}</strong><small>{formatDate(order.createdAt)}</small></td>
                  <td>{order.customer}<small>{order.phone || order.email || 'Chưa có liên hệ'}</small></td>
                  <td>{summarizeOrderItems(order)}</td>
                  <td className="admin-table__price">{formatCurrency(order.total)}</td>
                  <td className="admin-table__cell--center"><AdminStatus>{order.paymentStatus}</AdminStatus></td>
                  <td className="admin-table__cell--center">
                    <select className="admin-inline-select" value={order.status} onChange={(event) => updateStatus(order.id, event.target.value as AdminOrder['status'])} aria-label={`Trạng thái đơn ${order.id}`}>
                      {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </td>
                  <td className="admin-table__cell--actions"><button className="admin-row-action" type="button" onClick={() => setSelectedOrder(order)} aria-label={`Xem đơn ${order.id}`}><Eye size={18} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 ? <div className="admin-empty"><ShoppingCartSimple size={29} /><p>Không có đơn hàng phù hợp bộ lọc.</p></div> : null}
      </AdminPanel>

      {selectedOrder ? (
        <OrderDetailDialog
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={(status) => updateStatus(selectedOrder.id, status)}
        />
      ) : null}
    </>
  )
}

export function AdminReportsView({ products, database }: AdminReportsViewProps) {
  const [period, setPeriod] = useState<ReportPeriod>('365')
  const reportingAnchor = getReportingAnchor(database.orders)
  const orders = useMemo(
    () => filterOrdersByPeriod(database.orders, period, reportingAnchor),
    [database.orders, period, reportingAnchor],
  )
  const validOrders = orders.filter((order) => order.status !== 'Đã hủy')
  const paidOrders = validOrders.filter((order) => order.paymentStatus === 'Đã thanh toán')
  const revenue = sum(paidOrders.map((order) => order.total))
  const averageOrder = validOrders.length > 0 ? Math.round(sum(validOrders.map((order) => order.total)) / validOrders.length) : 0
  const completionRate = validOrders.length > 0
    ? Math.round((validOrders.filter((order) => order.status === 'Hoàn thành').length / validOrders.length) * 100)
    : 0
  const monthlyRevenue = getMonthlyRevenue(paidOrders, 12, reportingAnchor)
  const maxMonthlyRevenue = Math.max(1, ...monthlyRevenue.map((item) => item.value))
  const topProducts = aggregateProducts(validOrders)
  const maxStatusCount = Math.max(1, ...orderStatuses.map((status) => orders.filter((order) => order.status === status).length))

  return (
    <>
      <AdminPageHeading
        title="Báo cáo & thống kê"
        description="Theo dõi doanh thu, hiệu quả xử lý đơn và nhóm sản phẩm được quan tâm."
        action={(
          <div className="admin-heading-actions">
            <select className="admin-inline-select" value={period} onChange={(event) => setPeriod(event.target.value as ReportPeriod)} aria-label="Kỳ báo cáo">
              <option value="30">30 ngày gần nhất</option>
              <option value="90">90 ngày gần nhất</option>
              <option value="365">12 tháng gần nhất</option>
              <option value="ALL">Toàn bộ dữ liệu</option>
            </select>
            <button className="admin-button admin-button--primary" type="button" onClick={() => exportReportCsv(orders)}>
              <DownloadSimple size={17} /> Xuất báo cáo CSV
            </button>
          </div>
        )}
      />

      <div className="admin-kpi-grid">
        <MetricCard label="Doanh thu" value={formatCurrency(revenue)} helper={`${paidOrders.length} đơn đã thanh toán`} icon={<TrendUp size={19} />} highlighted />
        <MetricCard label="Đơn hàng" value={String(orders.length)} helper={`${validOrders.length} đơn hợp lệ`} icon={<ShoppingCartSimple size={19} />} />
        <MetricCard label="Giá trị trung bình" value={formatCurrency(averageOrder)} helper="Trên mỗi đơn hợp lệ" icon={<ChartBar size={19} />} />
        <MetricCard label="Tỷ lệ hoàn thành" value={`${completionRate}%`} helper={`${products.length} sản phẩm đang quản lý`} icon={<CheckCircle size={19} />} />
      </div>

      <AdminPanel title="Doanh thu theo tháng" className="admin-commerce-chart-panel">
        <div className="admin-commerce-chart admin-commerce-chart--wide" aria-label="Biểu đồ doanh thu 12 tháng">
          {monthlyRevenue.map((item) => (
            <div className="admin-commerce-chart__column" key={item.key}>
              <span>{formatCompactCurrency(item.value)}</span>
              <i
                aria-hidden="true"
                style={{ '--admin-commerce-bar': `${Math.max(3, Math.round((item.value / maxMonthlyRevenue) * 100))}%` } as CSSProperties}
              />
              <b>{item.label}</b>
            </div>
          ))}
        </div>
      </AdminPanel>

      <div className="admin-dashboard-grid admin-commerce-report-grid">
        <AdminPanel title="Sản phẩm trong đơn hàng" className="admin-table-panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Sản phẩm</th><th>Số lượng</th><th>Doanh số</th></tr></thead>
              <tbody>
                {topProducts.slice(0, 6).map((item) => (
                  <tr key={item.key}>
                    <td><strong>{item.name}</strong><small>{item.sku || 'Chưa có SKU'}</small></td>
                    <td>{item.quantity}</td>
                    <td className="admin-table__price">{formatCurrency(item.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {topProducts.length === 0 ? <div className="admin-empty"><Package size={28} /><p>Chưa có dữ liệu sản phẩm trong kỳ.</p></div> : null}
        </AdminPanel>

        <AdminPanel title="Phân bổ trạng thái đơn">
          <div className="admin-commerce-distribution">
            {orderStatuses.map((status) => {
              const count = orders.filter((order) => order.status === status).length
              return (
                <div key={status}>
                  <p><span>{status}</span><strong>{count}</strong></p>
                  <progress max={maxStatusCount} value={count}>{count}</progress>
                </div>
              )
            })}
          </div>
        </AdminPanel>
      </div>
    </>
  )
}

function MetricCard({
  label,
  value,
  helper,
  icon,
  highlighted = false,
}: {
  label: string
  value: string
  helper: string
  icon: React.ReactNode
  highlighted?: boolean
}) {
  return (
    <article className={`admin-metric${highlighted ? ' admin-metric--gold' : ''}`}>
      <span>{icon}</span>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  )
}

function OrderDetailDialog({
  order,
  onClose,
  onStatusChange,
}: {
  order: AdminOrder
  onClose: () => void
  onStatusChange: (status: AdminOrder['status']) => void
}) {
  return (
    <div className="admin-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="admin-dialog admin-order-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-order-detail-title" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div><h2 id="admin-order-detail-title">Chi tiết đơn {order.id}</h2><p>Được tạo lúc {formatDateTime(order.createdAt)}</p></div>
          <button type="button" onClick={onClose} aria-label="Đóng chi tiết"><X size={19} /></button>
        </header>

        <div className="admin-dialog__body admin-order-detail">
          <div className="admin-order-detail__summary">
            <div><span>Khách hàng</span><strong>{order.customer}</strong><small>{order.email || 'Chưa có email'} · {order.phone || 'Chưa có số điện thoại'}</small></div>
            <div><span>Thanh toán</span><strong>{order.paymentStatus}</strong><small>{order.paymentMethod || 'Chưa chọn phương thức'}</small></div>
            <div><span>Địa chỉ giao hàng</span><strong>{order.address || 'Chưa cập nhật địa chỉ'}</strong></div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Sản phẩm</th><th>SKU</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={`${item.productId}-${item.sku}-${index}`}>
                    <td><div className="admin-product-cell"><span className="admin-product-thumb">{item.image ? <img src={item.image} alt="" /> : <Package size={18} />}</span><strong>{item.name}</strong></div></td>
                    <td>{item.sku || 'Chưa có'}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.price)}</td>
                    <td className="admin-table__price">{formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="admin-order-detail__totals">
            <div><dt>Tạm tính</dt><dd>{formatCurrency(order.subtotal)}</dd></div>
            <div><dt>VAT</dt><dd>{formatCurrency(order.vat)}</dd></div>
            <div><dt>Tổng cộng</dt><dd>{formatCurrency(order.total)}</dd></div>
          </dl>
          {order.note ? <div className="admin-note-block"><p><strong>Ghi chú:</strong> {order.note}</p></div> : null}
        </div>

        <footer>
          <button className="admin-button" type="button" onClick={onClose}>Đóng</button>
          <select className="admin-inline-select" value={order.status} onChange={(event) => onStatusChange(event.target.value as AdminOrder['status'])} aria-label="Cập nhật trạng thái đơn hàng">
            {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </footer>
      </section>
    </div>
  )
}

function getProductImage(product: Product) {
  return product.images.find((image) => image.isPrimary)?.imageUrl ?? product.images[0]?.imageUrl ?? ''
}

function countLowStockProducts(products: Product[]) {
  return products.filter((product) => typeof product.stock === 'number' && product.stock <= 5).length
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase('vi')
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Chưa có ngày' : date.toLocaleDateString('vi-VN')
}

function formatDateTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Chưa có thời gian'
    : date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
}

function formatCompactCurrency(value: number) {
  if (value === 0) return '0 đ'
  if (value >= 1_000_000_000) return `${trimNumber(value / 1_000_000_000)} tỷ`
  if (value >= 1_000_000) return `${trimNumber(value / 1_000_000)} tr`
  if (value >= 1_000) return `${trimNumber(value / 1_000)} nghìn`
  return formatCurrency(value)
}

function trimNumber(value: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value)
}

function summarizeOrderItems(order: AdminOrder) {
  const firstItem = order.items[0]
  if (!firstItem) return 'Chưa có sản phẩm'
  if (order.items.length === 1) return firstItem.name
  return `${firstItem.name} và ${order.items.length - 1} sản phẩm khác`
}

function getReportingAnchor(orders: AdminOrder[]) {
  const timestamps = orders
    .map((order) => new Date(order.createdAt).getTime())
    .filter(Number.isFinite)
  return new Date(Math.max(Date.now(), ...timestamps))
}

function filterOrdersByPeriod(orders: AdminOrder[], period: ReportPeriod, anchor: Date) {
  if (period === 'ALL') return orders
  const minimum = anchor.getTime() - Number(period) * 24 * 60 * 60 * 1000
  return orders.filter((order) => {
    const timestamp = new Date(order.createdAt).getTime()
    return Number.isFinite(timestamp) && timestamp >= minimum && timestamp <= anchor.getTime()
  })
}

function getMonthlyRevenue(orders: AdminOrder[], length: number, anchor = getReportingAnchor(orders)) {
  const months = Array.from({ length }, (_, reverseIndex) => {
    const date = new Date(anchor.getFullYear(), anchor.getMonth() - (length - reverseIndex - 1), 1)
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: `Thg ${date.getMonth() + 1}`,
      value: 0,
    }
  })
  const byKey = new Map(months.map((month) => [month.key, month]))

  orders.forEach((order) => {
    if (order.paymentStatus !== 'Đã thanh toán' || order.status === 'Đã hủy') return
    const date = new Date(order.createdAt)
    if (Number.isNaN(date.getTime())) return
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const month = byKey.get(key)
    if (month) month.value += order.total
  })

  return months
}

function aggregateProducts(orders: AdminOrder[]) {
  const products = new Map<string, { key: string; name: string; sku: string; quantity: number; revenue: number }>()
  orders.forEach((order) => {
    if (order.status === 'Đã hủy') return
    order.items.forEach((item) => {
      const key = item.sku || `${item.productId}-${item.name}`
      const current = products.get(key) ?? { key, name: item.name, sku: item.sku, quantity: 0, revenue: 0 }
      current.quantity += item.quantity
      current.revenue += item.price * item.quantity
      products.set(key, current)
    })
  })
  return [...products.values()].sort((first, second) => second.revenue - first.revenue)
}

function exportOrdersCsv(orders: AdminOrder[]) {
  downloadCsv(
    `cmid-don-hang-${new Date().toISOString().slice(0, 10)}.csv`,
    ['Mã đơn', 'Ngày đặt', 'Khách hàng', 'Email', 'Điện thoại', 'Sản phẩm', 'Tổng giá trị', 'Thanh toán', 'Trạng thái'],
    orders.map((order) => [
      order.id,
      formatDate(order.createdAt),
      order.customer,
      order.email,
      order.phone,
      order.items.map((item) => `${item.name} x${item.quantity}`).join('; '),
      order.total,
      order.paymentStatus,
      order.status,
    ]),
  )
}

function exportReportCsv(orders: AdminOrder[]) {
  downloadCsv(
    `cmid-bao-cao-${new Date().toISOString().slice(0, 10)}.csv`,
    ['Mã đơn', 'Ngày', 'Khách hàng', 'Tạm tính', 'VAT', 'Tổng cộng', 'Thanh toán', 'Trạng thái'],
    orders.map((order) => [
      order.id,
      formatDate(order.createdAt),
      order.customer,
      order.subtotal,
      order.vat,
      order.total,
      order.paymentStatus,
      order.status,
    ]),
  )
}

function downloadCsv(fileName: string, headers: string[], rows: Array<Array<string | number>>) {
  const content = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\n')
  const url = URL.createObjectURL(new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function escapeCsvValue(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`
}
