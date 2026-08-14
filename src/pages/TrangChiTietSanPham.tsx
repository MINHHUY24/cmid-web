import {
  CaretRight,
  Check,
  Cube,
  House,
  Minus,
  Phone,
  Plus,
  ShoppingCartSimple,
} from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CamKetDichVu } from '../components/common/CamKetDichVu'
import { StatusPanel } from '../components/common/KhunTranThai'
import { TheSanPhamLienQuan } from '../components/product/TheSanPhamLienQuan'
import { ThuVienAnhSanPham } from '../components/product/ThuVienAnhSanPham'
import { SALE_TYPE_LABELS } from '../constants/product'
import { useProducts } from '../hooks/useProducts'
import type { Product } from '../types/product'
import { formatCurrency } from '../utils/formatCurrency'

type TabChiTiet = 'mo-ta' | 'thong-so' | 'huong-dan' | 'chinh-sach'

const tabChiTiet: Array<{ id: TabChiTiet; label: string }> = [
  { id: 'mo-ta', label: 'Mô tả' },
  { id: 'thong-so', label: 'Thông số kỹ thuật' },
  { id: 'huong-dan', label: 'Hướng dẫn' },
  { id: 'chinh-sach', label: 'Chính sách bán hàng' },
]

function createDescription(product: Product): string {
  if (product.description) {
    return product.description
  }

  return `${product.name} là lựa chọn phù hợp cho không gian cần tính thẩm mỹ, độ bền và sự đồng bộ trong hoàn thiện. CMID hỗ trợ tư vấn giải pháp theo nhu cầu sử dụng thực tế của công trình.`
}

function getRelatedProducts(products: Product[], product: Product): Product[] {
  const sameCategoryProducts = products.filter(
    (currentProduct) =>
      currentProduct.id !== product.id &&
      currentProduct.category?.id === product.category?.id,
  )
  const remainingProducts = products.filter(
    (currentProduct) =>
      currentProduct.id !== product.id &&
      !sameCategoryProducts.some(
        (relatedProduct) => relatedProduct.id === currentProduct.id,
      ),
  )

  return [...sameCategoryProducts, ...remainingProducts].slice(0, 5)
}

export function TrangChiTietSanPham() {
  const { id } = useParams()
  const { products, isLoading, errorMessage, retry } = useProducts()
  const [activeTab, setActiveTab] = useState<TabChiTiet>('mo-ta')
  const [quantity, setQuantity] = useState(1)
  const [isAddedToCart, setIsAddedToCart] = useState(false)
  const productId = Number(id)
  const product = products.find((currentProduct) => currentProduct.id === productId)
  const relatedProducts = useMemo(
    () => (product ? getRelatedProducts(products, product) : []),
    [product, products],
  )

  if (isLoading) {
    return (
      <div className="product-detail-shell product-detail-shell--status">
        <StatusPanel title="Đang tải thông tin sản phẩm…" />
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="product-detail-shell product-detail-shell--status">
        <StatusPanel title="Không thể tải thông tin sản phẩm" tone="error">
          <p>{errorMessage}</p>
          <button className="button button--small" type="button" onClick={retry}>
            Thử lại
          </button>
        </StatusPanel>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="product-detail-shell product-detail-shell--status">
        <StatusPanel title="Không tìm thấy sản phẩm">
          <p>Sản phẩm này không tồn tại hoặc đã được cập nhật.</p>
          <Link className="button button--small button--gold" to="/products">
            Quay lại danh sách sản phẩm
          </Link>
        </StatusPanel>
      </div>
    )
  }

  const primaryImage = product.images.find((image) => image.isPrimary) ?? product.images[0]
  const isDirectOrder = product.saleType === 'DIRECT_ORDER'
  const actionPath = isDirectOrder
    ? `/lien-he?mua-san-pham=${product.id}`
    : `/lien-he?bao-gia-san-pham=${product.id}`
  const actionLabel = isDirectOrder ? 'Mua ngay' : 'Yêu cầu báo giá'
  const detailSpecs = [
    { label: 'Tình trạng', value: product.status === 'ACTIVE' ? 'Còn hàng' : 'Đặt hàng' },
    { label: 'Loại bán', value: SALE_TYPE_LABELS[product.saleType] },
    { label: 'Danh mục', value: product.category?.name ?? 'Đang cập nhật' },
    { label: 'Thương hiệu', value: product.brand?.name ?? 'CMID' },
    { label: 'Đơn vị tính', value: product.unit ?? 'Đang cập nhật' },
    { label: 'Mô hình 3D', value: product.models3D.length > 0 ? 'Có sẵn' : 'Chưa có' },
  ]

  return (
    <div className="trang-chi-tiet-san-pham">
      <div className="product-detail-shell">
        <nav className="product-detail-breadcrumb" aria-label="Đường dẫn trang">
          <Link aria-label="Trang chủ" to="/">
            <House size={15} weight="fill" aria-hidden="true" />
          </Link>
          <CaretRight size={14} aria-hidden="true" />
          <Link to="/products">Sản phẩm</Link>
          {product.category ? (
            <>
              <CaretRight size={14} aria-hidden="true" />
              <Link to="/products">{product.category.name}</Link>
            </>
          ) : null}
          <CaretRight size={14} aria-hidden="true" />
          <span>{product.name}</span>
        </nav>

        <section className="product-detail-overview" aria-labelledby="product-detail-title">
          <ThuVienAnhSanPham
            productName={product.name}
            images={product.images}
            models3D={product.models3D}
          />

          <div className="product-detail-summary">
            <h1 id="product-detail-title">{product.name}</h1>
            <div className="product-detail-summary__meta">
              <span>SKU: {product.sku}</span>
              <span>Thương hiệu: {product.brand?.name ?? 'CMID'}</span>
              <span>Danh mục: {product.category?.name ?? 'Đang cập nhật'}</span>
            </div>

            <dl className="product-detail-spec-list">
              {detailSpecs.slice(0, 5).map((spec) => (
                <div key={spec.label}>
                  <dt>{spec.label}</dt>
                  <dd>
                    {spec.label === 'Tình trạng' ? <i aria-hidden="true" /> : null}
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="product-detail-price">
              <strong>{formatCurrency(product.price)}</strong>
              {product.unit ? <span>/{product.unit}</span> : null}
            </div>

            <div className="product-detail-quantity">
              <span>Số lượng</span>
              <div>
                <button
                  type="button"
                  aria-label="Giảm số lượng"
                  disabled={quantity === 1}
                  onClick={() => setQuantity((currentQuantity) => Math.max(1, currentQuantity - 1))}
                >
                  <Minus size={15} aria-hidden="true" />
                </button>
                <output aria-label="Số lượng hiện tại">{quantity}</output>
                <button
                  type="button"
                  aria-label="Tăng số lượng"
                  onClick={() => setQuantity((currentQuantity) => currentQuantity + 1)}
                >
                  <Plus size={15} aria-hidden="true" />
                </button>
              </div>
              {product.unit ? <small>{product.unit}</small> : null}
            </div>

            <div className="product-detail-actions">
              <Link className="button button--gold product-detail-actions__primary" to={actionPath}>
                {actionLabel}
              </Link>
              <button
                className="product-detail-actions__secondary"
                type="button"
                onClick={() => setIsAddedToCart(true)}
              >
                <ShoppingCartSimple size={18} aria-hidden="true" />
                {isAddedToCart ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ'}
              </button>
              <Link className="product-detail-actions__secondary" to={`/lien-he?tu-van-san-pham=${product.id}`}>
                Yêu cầu tư vấn
              </Link>
            </div>
          </div>
        </section>

        <CamKetDichVu />

        <section className="product-detail-tabs" aria-label="Thông tin chi tiết sản phẩm">
          <div className="product-detail-tabs__tab-list" role="tablist" aria-label="Nội dung sản phẩm">
            {tabChiTiet.map((tab) => (
              <button
                key={tab.id}
                className={activeTab === tab.id ? 'product-detail-tabs__tab product-detail-tabs__tab--active' : 'product-detail-tabs__tab'}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'mo-ta' ? (
            <div className="product-detail-tabs__description">
              <div>
                <p>{createDescription(product)}</p>
                <ul>
                  <li><Check size={15} weight="bold" aria-hidden="true" /> Phù hợp với nhiều giải pháp hoàn thiện không gian.</li>
                  <li><Check size={15} weight="bold" aria-hidden="true" /> Chất lượng được CMID tư vấn theo nhu cầu sử dụng.</li>
                  <li><Check size={15} weight="bold" aria-hidden="true" /> Hỗ trợ báo giá và giao hàng trên toàn quốc.</li>
                </ul>
              </div>
              <div className="product-detail-tabs__visual">
                {primaryImage ? <img src={primaryImage.imageUrl} alt="" /> : <Cube size={70} weight="thin" aria-hidden="true" />}
              </div>
            </div>
          ) : null}

          {activeTab === 'thong-so' ? (
            <dl className="product-detail-tabs__technical">
              {detailSpecs.map((spec) => (
                <div key={spec.label}>
                  <dt>{spec.label}</dt>
                  <dd>{spec.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {activeTab === 'huong-dan' ? (
            <div className="product-detail-tabs__copy">
              <p>Liên hệ CMID để được tư vấn lựa chọn sản phẩm, số lượng và phương án giao hàng phù hợp cho công trình của bạn.</p>
              <ul>
                <li>Kiểm tra quy cách, số lượng trước khi đặt hàng.</li>
                <li>Bảo quản sản phẩm theo hướng dẫn của nhà sản xuất.</li>
                <li>Đội ngũ CMID sẵn sàng hỗ trợ giải đáp khi cần.</li>
              </ul>
            </div>
          ) : null}

          {activeTab === 'chinh-sach' ? (
            <div className="product-detail-tabs__copy">
              <p>CMID cung cấp chính sách báo giá rõ ràng, giao hàng an toàn và hỗ trợ sau bán hàng cho từng nhóm sản phẩm.</p>
              <ul>
                <li>Tư vấn điều kiện đổi trả trước khi xác nhận đơn hàng.</li>
                <li>Hỗ trợ báo giá dự án theo số lượng và tiến độ thực tế.</li>
                <li>Liên hệ CMID để biết chính sách áp dụng cho sản phẩm này.</li>
              </ul>
            </div>
          ) : null}
        </section>

        {relatedProducts.length > 0 ? (
          <section className="related-products" aria-labelledby="related-products-title">
            <h2 id="related-products-title">Sản phẩm liên quan</h2>
            <div className="related-products__grid">
              {relatedProducts.map((relatedProduct) => (
                <TheSanPhamLienQuan key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="product-consultation" aria-label="Tư vấn sản phẩm">
          <Phone size={39} weight="fill" aria-hidden="true" />
          <div>
            <h2>Cần tư vấn sản phẩm?</h2>
            <p>Đội ngũ CMID sẵn sàng hỗ trợ bạn lựa chọn sản phẩm phù hợp nhất.</p>
          </div>
          <Link className="button button--gold" to={`/lien-he?tu-van-san-pham=${product.id}`}>
            Liên hệ tư vấn
            <CaretRight size={18} weight="bold" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </div>
  )
}
