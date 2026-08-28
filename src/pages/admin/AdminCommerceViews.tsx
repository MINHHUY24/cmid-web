import {
  ArrowRight,
  CaretLeft,
  CaretRight,
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
import { AdminPageHeading, AdminPanel, AdminSelect, AdminStatus } from './AdminPrimitives'
import type { AdminDatabase, AdminOrder } from './admin-database'
import type { AdminView } from './admin-navigation'

type OrderFilter = 'ALL' | AdminOrder['status']
type PaymentFilter = 'ALL' | AdminOrder['paymentStatus']
type ProductStatusFilter = 'ALL' | ProductStatus
type ProductSaleFilter = 'ALL' | SaleType
type ReportPeriod = '30' | '90' | '365' | 'ALL'
type RevenueChartGrouping = 'day' | 'month' | 'year'

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
  const [dashboardRevenuePeriod, setDashboardRevenuePeriod] = useState<6 | 12>(6)
  const paidOrders = database.orders.filter(
    (order) => order.paymentStatus === 'Đã thanh toán' && order.status !== 'Đã hủy',
  )
  const recordedRevenue = sum(paidOrders.map((order) => order.total))
  const activeProducts = products.filter((product) => product.status === 'ACTIVE').length
  const pendingOrders = database.orders.filter((order) => order.status === 'Chờ xác nhận').length
  const monthlyRevenue = getMonthlyRevenue(database.orders, dashboardRevenuePeriod)

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
        <AdminPanel className="admin-revenue-line-chart-panel">
          <header>
            <h2>Doanh thu {dashboardRevenuePeriod} tháng gần nhất</h2>
            <AdminSelect
              className="admin-inline-select"
              value={String(dashboardRevenuePeriod)}
              onChange={(value) => setDashboardRevenuePeriod(Number(value) as 6 | 12)}
              aria-label="Khoảng thời gian doanh thu"
              options={[
                { value: '6', label: '6 tháng gần nhất' },
                { value: '12', label: '12 tháng gần nhất' },
              ]}
            />
          </header>
          <RevenueLineChart data={monthlyRevenue} />
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
        <AdminSelect className="admin-inline-select" value={category} onChange={setCategory} aria-label="Lọc danh mục" options={[
          { value: 'ALL', label: 'Tất cả danh mục' },
          ...categories.map(([slug, name]) => ({ value: slug, label: name })),
        ]} />
        <AdminSelect className="admin-inline-select" value={status} onChange={(value) => setStatus(value as ProductStatusFilter)} aria-label="Lọc trạng thái" options={[
          { value: 'ALL', label: 'Tất cả trạng thái' },
          ...Object.entries(productStatusLabels).map(([value, label]) => ({ value, label })),
        ]} />
        <AdminSelect className="admin-inline-select" value={saleType} onChange={(value) => setSaleType(value as ProductSaleFilter)} aria-label="Lọc loại bán" options={[
          { value: 'ALL', label: 'Tất cả loại bán' },
          ...Object.entries(saleTypeLabels).map(([value, label]) => ({ value, label })),
        ]} />
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
        <AdminSelect className="admin-inline-select" value={paymentFilter} onChange={(value) => setPaymentFilter(value as PaymentFilter)} aria-label="Lọc thanh toán" options={[
          { value: 'ALL', label: 'Tất cả thanh toán' },
          ...paymentStatuses.map((status) => ({ value: status, label: status })),
        ]} />
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
                    <AdminSelect className="admin-inline-select" value={order.status} onChange={(value) => updateStatus(order.id, value as AdminOrder['status'])} aria-label={`Trạng thái đơn ${order.id}`} options={orderStatuses.map((status) => ({ value: status, label: status }))} />
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
  const [revenueChartGrouping, setRevenueChartGrouping] = useState<RevenueChartGrouping>('month')
  const [revenueChartPage, setRevenueChartPage] = useState(0)
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
  const revenueChartAnchor = getRevenueChartAnchor(reportingAnchor, revenueChartGrouping, revenueChartPage)
  const revenueChart = getRevenueChartData(orders, revenueChartGrouping, revenueChartAnchor)
  const maxRevenue = Math.max(1, ...revenueChart.map((item) => item.value))
  const topProducts = aggregateProducts(validOrders)
  const maxStatusCount = Math.max(1, ...orderStatuses.map((status) => orders.filter((order) => order.status === status).length))

  return (
    <>
      <AdminPageHeading
        title="Báo cáo & thống kê"
        description="Theo dõi doanh thu, hiệu quả xử lý đơn và nhóm sản phẩm được quan tâm."
        action={(
          <div className="admin-heading-actions">
            <AdminSelect className="admin-inline-select" value={period} onChange={(value) => setPeriod(value as ReportPeriod)} aria-label="Kỳ báo cáo" options={[
              { value: '30', label: '30 ngày gần nhất' },
              { value: '90', label: '90 ngày gần nhất' },
              { value: '365', label: '12 tháng gần nhất' },
              { value: 'ALL', label: 'Toàn bộ dữ liệu' },
            ]} />
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

      <AdminPanel className="admin-commerce-chart-panel">
        <div className="admin-commerce-chart-panel__header">
          <h2>Doanh thu theo {revenueChartGrouping === 'day' ? 'ngày' : revenueChartGrouping === 'month' ? 'tháng' : 'năm'}</h2>
          <div className="admin-commerce-chart-panel__actions">
            <div className="admin-chart-pagination" aria-label="Điều hướng kỳ doanh thu">
              <button type="button" onClick={() => setRevenueChartPage((current) => current + 1)} aria-label="Xem kỳ trước">
                <CaretLeft size={16} weight="bold" />
              </button>
              <button
                type="button"
                disabled={revenueChartPage === 0}
                onClick={() => setRevenueChartPage((current) => Math.max(0, current - 1))}
                aria-label="Xem kỳ tiếp theo"
              >
                <CaretRight size={16} weight="bold" />
              </button>
            </div>
            <div className="admin-segmented-control" role="group" aria-label="Cách nhóm dữ liệu doanh thu">
              {([
                ['day', 'Ngày'],
                ['month', 'Tháng'],
                ['year', 'Năm'],
              ] as const).map(([grouping, label]) => (
                <button
                  className={revenueChartGrouping === grouping ? 'is-active' : undefined}
                  type="button"
                  key={grouping}
                  aria-pressed={revenueChartGrouping === grouping}
                  onClick={() => {
                    setRevenueChartGrouping(grouping)
                    setRevenueChartPage(0)
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div
          className={`admin-commerce-chart admin-commerce-chart--wide admin-commerce-chart--${revenueChartGrouping}`}
          aria-label={`Biểu đồ doanh thu theo ${revenueChartGrouping === 'day' ? 'ngày' : revenueChartGrouping === 'month' ? 'tháng' : 'năm'}`}
        >
          {revenueChart.map((item) => (
            <div className="admin-commerce-chart__column" key={item.key}>
              <span>{formatCompactCurrency(item.value)}</span>
              <i
                aria-hidden="true"
                style={{ '--admin-commerce-bar': `${Math.max(3, Math.round((item.value / maxRevenue) * 100))}%` } as CSSProperties}
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

function RevenueLineChart({ data }: { data: Array<{ key: string; label: string; value: number }> }) {
  const width = 680
  const height = 230
  const plot = { top: 18, right: 18, bottom: 39, left: 48 }
  const maximumValue = Math.max(...data.map((item) => item.value), 0)
  const chartMaximum = getRevenueChartMaximum(maximumValue)
  const plotWidth = width - plot.left - plot.right
  const plotHeight = height - plot.top - plot.bottom
  const points = data.map((item, index) => {
    const x = plot.left + (data.length <= 1 ? plotWidth / 2 : (plotWidth * index) / (data.length - 1))
    const y = chartMaximum === 0 ? plot.top + plotHeight : plot.top + (1 - item.value / chartMaximum) * plotHeight
    return { ...item, x, y }
  })
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const areaPath = points.length > 0
    ? `${linePath} L ${points.at(-1)?.x} ${plot.top + plotHeight} L ${points[0].x} ${plot.top + plotHeight} Z`
    : ''

  return (
    <div className="admin-revenue-line-chart" role="img" aria-label="Biểu đồ đường doanh thu theo tháng">
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <defs>
          <linearGradient id="admin-revenue-line-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#d5a456" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#d5a456" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {Array.from({ length: 5 }, (_, index) => {
          const value = chartMaximum * (1 - index / 4)
          const y = plot.top + (plotHeight * index) / 4
          return (
            <g key={index}>
              <line className="admin-revenue-line-chart__grid" x1={plot.left} x2={width - plot.right} y1={y} y2={y} />
              <text className="admin-revenue-line-chart__axis" x={plot.left - 10} y={y + 4} textAnchor="end">
                {chartMaximum === 0 ? '0 đ' : formatCompactCurrency(value)}
              </text>
            </g>
          )
        })}
        {areaPath ? <path className="admin-revenue-line-chart__area" d={areaPath} /> : null}
        {linePath ? <path className="admin-revenue-line-chart__line" d={linePath} /> : null}
        {points.map((point) => (
          <g key={point.key}>
            <text className="admin-revenue-line-chart__value" x={point.x} y={Math.max(plot.top + 12, point.y - 11)} textAnchor="middle">
              {formatCompactCurrency(point.value)}
            </text>
            <circle className="admin-revenue-line-chart__point" cx={point.x} cy={point.y} r="3.5" />
            <text className="admin-revenue-line-chart__label" x={point.x} y={height - 10} textAnchor="middle">
              {point.label.replace('Thg', 'Tháng')}
            </text>
          </g>
        ))}
      </svg>
    </div>
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
          <AdminSelect className="admin-inline-select" value={order.status} onChange={(value) => onStatusChange(value as AdminOrder['status'])} aria-label="Cập nhật trạng thái đơn hàng" options={orderStatuses.map((status) => ({ value: status, label: status }))} />
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

function getRevenueChartMaximum(value: number) {
  if (value <= 0) return 0
  const desiredStep = value / 4
  const magnitude = 10 ** Math.floor(Math.log10(desiredStep))
  const normalizedStep = desiredStep / magnitude
  const niceStep = [1, 1.5, 2, 2.5, 5, 10].find((step) => step >= normalizedStep) ?? 10
  return niceStep * magnitude * 4
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

function getRevenueChartData(orders: AdminOrder[], grouping: RevenueChartGrouping, anchor: Date) {
  if (grouping === 'day') return getDailyRevenue(orders, 7, anchor)
  if (grouping === 'year') return getYearlyRevenue(orders, 5, anchor)
  return getMonthlyRevenue(orders, 12, anchor)
}

function getRevenueChartAnchor(anchor: Date, grouping: RevenueChartGrouping, page: number) {
  const chartAnchor = new Date(anchor)
  if (grouping === 'day') chartAnchor.setDate(chartAnchor.getDate() - page)
  if (grouping === 'month') chartAnchor.setMonth(chartAnchor.getMonth() - page)
  if (grouping === 'year') chartAnchor.setFullYear(chartAnchor.getFullYear() - page)
  return chartAnchor
}

function getDailyRevenue(orders: AdminOrder[], length: number, anchor: Date) {
  const days = Array.from({ length }, (_, reverseIndex) => {
    const date = new Date(anchor)
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (length - reverseIndex - 1))
    return {
      key: formatDateKey(date),
      label: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      value: 0,
    }
  })
  const byKey = new Map(days.map((day) => [day.key, day]))

  orders.forEach((order) => {
    if (order.paymentStatus !== 'Đã thanh toán' || order.status === 'Đã hủy') return
    const date = new Date(order.createdAt)
    if (Number.isNaN(date.getTime())) return
    const day = byKey.get(formatDateKey(date))
    if (day) day.value += order.total
  })

  return days
}

function getYearlyRevenue(orders: AdminOrder[], length: number, anchor: Date) {
  const years = Array.from({ length }, (_, reverseIndex) => {
    const year = anchor.getFullYear() - (length - reverseIndex - 1)
    return { key: String(year), label: `Năm ${year}`, value: 0 }
  })
  const byKey = new Map(years.map((year) => [year.key, year]))

  orders.forEach((order) => {
    if (order.paymentStatus !== 'Đã thanh toán' || order.status === 'Đã hủy') return
    const date = new Date(order.createdAt)
    if (Number.isNaN(date.getTime())) return
    const year = byKey.get(String(date.getFullYear()))
    if (year) year.value += order.total
  })

  return years
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
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
  const separator = ';'
  const content = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(separator))
    .join('\r\n')
  // Excel in the Vietnamese locale expects a semicolon separator. UTF-16LE with
  // its BOM is recognized reliably by Excel on both macOS and Windows.
  const csv = `sep=${separator}\r\n${content}`
  const url = URL.createObjectURL(new Blob([encodeUtf16Le(csv)], { type: 'text/csv;charset=utf-16le' }))
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

function encodeUtf16Le(value: string) {
  const bytes = new Uint8Array(2 + value.length * 2)
  bytes[0] = 0xff
  bytes[1] = 0xfe

  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index)
    bytes[index * 2 + 2] = codeUnit & 0xff
    bytes[index * 2 + 3] = codeUnit >> 8
  }

  return bytes
}
