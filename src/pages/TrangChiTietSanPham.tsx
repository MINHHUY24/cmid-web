import {
  ArrowLeft,
  ArrowRight,
  CaretRight,
  Check,
  Cube,
  House,
  Minus,
  Plus,
  ShoppingCartSimple,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CamKetDichVu } from "../components/common/CamKetDichVu";
import { StatusPanel } from "../components/common/KhunTranThai";
import { Seo } from "../components/common/Seo";
import { TheSanPhamLienQuan } from "../components/product/TheSanPhamLienQuan";
import { ThuVienAnhSanPham } from "../components/product/ThuVienAnhSanPham";
import { useCart } from "../contexts/GioHangContext";
import { useLanguage } from "../contexts/NgonNguContext";
import { useProducts } from "../hooks/useProducts";
import type { Product } from "../types/product";
import { formatCurrency } from "../utils/formatCurrency";
import {
  getBrandName,
  getCategoryName,
  getProductDescription,
  getProductName,
} from "../utils/localizeProduct";
import { getAbsoluteUrl } from "../utils/seo";

type TabChiTiet = "mo-ta" | "thong-so" | "huong-dan" | "chinh-sach";

const tabChiTiet: TabChiTiet[] = [
  "mo-ta",
  "thong-so",
  "huong-dan",
  "chinh-sach",
];

function createDescription(
  description: string | null,
  fallback: string,
): string {
  if (description) {
    return description;
  }

  return fallback;
}

function getRelatedProducts(products: Product[], product: Product): Product[] {
  const sameCategoryProducts = products.filter(
    (currentProduct) =>
      currentProduct.id !== product.id &&
      currentProduct.category?.id === product.category?.id,
  );
  const remainingProducts = products.filter(
    (currentProduct) =>
      currentProduct.id !== product.id &&
      !sameCategoryProducts.some(
        (relatedProduct) => relatedProduct.id === currentProduct.id,
      ),
  );

  return [...sameCategoryProducts, ...remainingProducts];
}

export function TrangChiTietSanPham() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, isLoading, errorMessage, retry } = useProducts();
  const [activeTab, setActiveTab] = useState<TabChiTiet>("mo-ta");
  const [quantity, setQuantity] = useState(1);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const relatedProductsScrollerRef = useRef<HTMLDivElement>(null);
  const { addItem, dismissCartToast } = useCart();
  const { content, language } = useLanguage();
  const { productDetail } = content;
  const requestedProductPath = id ? `/products/${id}` : "/products";

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [id]);

  const productId = Number(id);
  const product = products.find(
    (currentProduct) => currentProduct.id === productId,
  );
  const relatedProducts = useMemo(
    () => (product ? getRelatedProducts(products, product) : []),
    [product, products],
  );

  function scrollRelatedProducts(direction: -1 | 1) {
    const relatedProductsScroller = relatedProductsScrollerRef.current;

    if (!relatedProductsScroller) return;

    relatedProductsScroller.scrollBy({
      left: direction * relatedProductsScroller.clientWidth * 0.82,
      behavior: "smooth",
    });
  }

  if (isLoading) {
    return (
      <>
        <Seo
          title={language === "vi" ? "Đang tải sản phẩm | CMID" : "Loading product | CMID"}
          description={language === "vi" ? "Đang tải thông tin sản phẩm CMID." : "Loading CMID product information."}
          language={language}
          canonicalPath={requestedProductPath}
          robots="noindex,nofollow"
        />
        <main className="product-detail-shell product-detail-shell--status">
          <StatusPanel title={productDetail.loading} />
        </main>
      </>
    );
  }

  if (errorMessage) {
    return (
      <>
        <Seo
          title={language === "vi" ? "Sản phẩm chưa khả dụng | CMID" : "Product unavailable | CMID"}
          description={language === "vi" ? "Thông tin sản phẩm hiện chưa khả dụng." : "Product information is currently unavailable."}
          language={language}
          canonicalPath={requestedProductPath}
          robots="noindex,nofollow"
        />
        <main className="product-detail-shell product-detail-shell--status">
          <StatusPanel title={productDetail.loadFailed} tone="error">
            <p>{errorMessage}</p>
            <button
              className="button button--small"
              type="button"
              onClick={retry}
            >
              {content.common.retry}
            </button>
          </StatusPanel>
        </main>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Seo
          title={language === "vi" ? "Không tìm thấy sản phẩm | CMID" : "Product not found | CMID"}
          description={productDetail.notFoundDescription}
          language={language}
          canonicalPath={requestedProductPath}
          robots="noindex,nofollow"
        />
        <main className="product-detail-shell product-detail-shell--status">
          <StatusPanel title={productDetail.notFound}>
            <p>{productDetail.notFoundDescription}</p>
            <Link className="button button--small button--gold" to="/products">
              {productDetail.backToCatalog}
            </Link>
          </StatusPanel>
        </main>
      </>
    );
  }

  const primaryImage =
    product.images.find((image) => image.isPrimary) ?? product.images[0];
  const productName = getProductName(product, language);
  const categoryName = getCategoryName(product.category, language);
  const brandName = getBrandName(product.brand, language);
  const productDescription = getProductDescription(product, language);
  const isDirectOrder = product.saleType === "DIRECT_ORDER";
  const actionPath = `/lien-he?bao-gia-san-pham=${product.id}`;
  const actionLabel = isDirectOrder
    ? productDetail.buyNow
    : productDetail.requestQuoteAndConsultation;
  const canonicalPath = `/products/${product.id}`;
  const seoDescription = createDescription(
    productDescription,
    isDirectOrder
      ? language === "vi"
        ? `${productName} tại CMID. Xem thông tin, giá và tư vấn sản phẩm.`
        : `${productName} at CMID. View product details, pricing and consultation options.`
      : language === "vi"
        ? `${productName} tại CMID. Liên hệ CMID để nhận báo giá và tư vấn sản phẩm.`
        : `${productName} at CMID. Contact CMID for a quote and product consultation.`,
  );
  const numericPrice = Number(product.price);
  const hasPrice = isDirectOrder && Number.isFinite(numericPrice) && numericPrice > 0;
  const productStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${getAbsoluteUrl(canonicalPath)}#product`,
        name: productName,
        description: seoDescription,
        image: primaryImage ? getAbsoluteUrl(primaryImage.imageUrl) : undefined,
        sku: product.sku,
        category: categoryName ?? undefined,
        brand: { "@type": "Brand", name: brandName ?? "CMID" },
        offers: hasPrice
          ? {
              "@type": "Offer",
              url: getAbsoluteUrl(canonicalPath),
              priceCurrency: "VND",
              price: numericPrice,
              availability:
                product.status === "ACTIVE"
                  ? "https://schema.org/InStock"
                  : "https://schema.org/PreOrder",
            }
          : undefined,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: content.common.home,
            item: getAbsoluteUrl("/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: content.common.products,
            item: getAbsoluteUrl("/products"),
          },
          ...(product.category && categoryName
            ? [
                {
                  "@type": "ListItem",
                  position: 3,
                  name: categoryName,
                  item: getAbsoluteUrl(`/products?category=${product.category.slug}`),
                },
              ]
            : []),
          {
            "@type": "ListItem",
            position: product.category && categoryName ? 4 : 3,
            name: productName,
            item: getAbsoluteUrl(canonicalPath),
          },
        ],
      },
    ],
  };
  const detailSpecs = [
    {
      label: productDetail.specs.availability,
      value:
        product.status === "ACTIVE"
          ? content.product.inStock
          : content.product.madeToOrder,
    },
    {
      label: productDetail.specs.purchaseType,
      value:
        product.saleType === "DIRECT_ORDER"
          ? content.product.directOrder
          : content.product.quote,
    },
    {
      label: productDetail.specs.category,
      value: categoryName ?? productDetail.specs.updating,
    },
    { label: productDetail.specs.brand, value: brandName ?? "CMID" },
    {
      label: productDetail.specs.unit,
      value: product.unit ?? productDetail.specs.updating,
    },
    {
      label: productDetail.specs.model3D,
      value:
        product.models3D.length > 0
          ? productDetail.specs.yes
          : productDetail.specs.no,
    },
  ];

  return (
    <>
      <Seo
        title={`${productName} | CMID`}
        description={seoDescription}
        language={language}
        canonicalPath={canonicalPath}
        image={primaryImage?.imageUrl}
        imageAlt={primaryImage?.altText?.trim() || productName}
        type="product"
        structuredData={productStructuredData}
      />
      <main className="trang-chi-tiet-san-pham">
      <div className="product-detail-shell">
        <nav className="product-detail-breadcrumb" aria-label="Breadcrumb">
          <Link aria-label={content.common.home} to="/">
            <House size={15} weight="fill" aria-hidden="true" />
          </Link>
          <CaretRight size={14} aria-hidden="true" />
          <Link to="/products">{content.common.products}</Link>
          {product.category ? (
            <>
              <CaretRight size={14} aria-hidden="true" />
              <Link to={`/products?category=${product.category.slug}`}>{categoryName}</Link>
            </>
          ) : null}
          <CaretRight size={14} aria-hidden="true" />
          <span>{productName}</span>
        </nav>

        <section
          className="product-detail-overview"
          aria-labelledby="product-detail-title"
        >
          <ThuVienAnhSanPham
            productName={productName}
            images={product.images}
            models3D={product.models3D}
          />

          <div className="product-detail-summary">
            <h1 id="product-detail-title">{productName}</h1>
            <div className="product-detail-summary__meta">
              <span>SKU: {product.sku}</span>
              <span>
                {productDetail.brand}: {brandName ?? "CMID"}
              </span>
              <span>
                {productDetail.category}:{" "}
                {categoryName ?? productDetail.specs.updating}
              </span>
            </div>

            <dl className="product-detail-spec-list">
              {detailSpecs.slice(0, 5).map((spec) => (
                <div key={spec.label}>
                  <dt>{spec.label}</dt>
                  <dd>{spec.value}</dd>
                </div>
              ))}
            </dl>

            {isDirectOrder ? (
              <>
                <div className="product-detail-price">
                  <strong>{formatCurrency(product.price, language)}</strong>
                  {product.unit ? <span>/{product.unit}</span> : null}
                </div>

                <div className="product-detail-quantity">
                  <span>{productDetail.quantity}</span>
                  <div>
                    <button
                      type="button"
                      aria-label={content.cart.decrease(productName)}
                      disabled={quantity === 1}
                      onClick={() =>
                        setQuantity((currentQuantity) =>
                          Math.max(1, currentQuantity - 1),
                        )
                      }
                    >
                      <Minus size={15} aria-hidden="true" />
                    </button>
                    <output aria-label={productDetail.quantity}>{quantity}</output>
                    <button
                      type="button"
                      aria-label={content.cart.increase(productName)}
                      onClick={() =>
                        setQuantity((currentQuantity) => currentQuantity + 1)
                      }
                    >
                      <Plus size={15} aria-hidden="true" />
                    </button>
                  </div>
                  {product.unit ? <small>{product.unit}</small> : null}
                </div>
              </>
            ) : null}

            <div className="product-detail-actions">
              {isDirectOrder ? (
                <button
                  className="button button--gold product-detail-actions__primary"
                  type="button"
                  onClick={() => {
                    addItem(product, quantity);
                    setIsAddedToCart(true);
                    dismissCartToast();
                    navigate("/thanh-toan");
                  }}
                >
                  {actionLabel}
                </button>
              ) : (
                <Link
                  className="button button--gold product-detail-actions__primary"
                  to={actionPath}
                >
                  {actionLabel}
                </Link>
              )}
              {isDirectOrder ? (
                <button
                  className="product-detail-actions__secondary"
                  type="button"
                  onClick={() => {
                    addItem(product, quantity);
                    setIsAddedToCart(true);
                  }}
                >
                  <ShoppingCartSimple size={18} aria-hidden="true" />
                  {isAddedToCart ? productDetail.added : productDetail.addToCart}
                </button>
              ) : null}
              {isDirectOrder ? (
                <Link
                  className="product-detail-actions__secondary"
                  to={`/lien-he?tu-van-san-pham=${product.id}`}
                >
                  {productDetail.consultation}
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <CamKetDichVu />

        <section className="product-detail-tabs" aria-label={productName}>
          <div
            className="product-detail-tabs__tab-list"
            role="tablist"
            aria-label={productName}
          >
            {tabChiTiet.map((tab, index) => (
              <button
                key={tab}
                className={
                  activeTab === tab
                    ? "product-detail-tabs__tab product-detail-tabs__tab--active"
                    : "product-detail-tabs__tab"
                }
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              >
                {productDetail.tabs[index]}
              </button>
            ))}
          </div>

          {activeTab === "mo-ta" ? (
            <div className="product-detail-tabs__description">
              <div>
                <p>
                  {createDescription(
                    productDescription,
                    productDetail.descriptionFallback(productName),
                  )}
                </p>
                <ul>
                  {productDetail.descriptionPoints.map((point) => (
                    <li key={point}>
                      <Check size={15} weight="bold" aria-hidden="true" />{" "}
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="product-detail-tabs__visual">
                {primaryImage ? (
                  <img src={primaryImage.imageUrl} alt="" />
                ) : (
                  <Cube size={70} weight="thin" aria-hidden="true" />
                )}
              </div>
            </div>
          ) : null}

          {activeTab === "thong-so" ? (
            <dl className="product-detail-tabs__technical">
              {detailSpecs.map((spec) => (
                <div key={spec.label}>
                  <dt>{spec.label}</dt>
                  <dd>{spec.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {activeTab === "huong-dan" ? (
            <div className="product-detail-tabs__copy">
              <p>{productDetail.guide}</p>
              <ul>
                {productDetail.guidePoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {activeTab === "chinh-sach" ? (
            <div className="product-detail-tabs__copy">
              <p>{productDetail.policy}</p>
              <ul>
                {productDetail.policyPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        {relatedProducts.length > 0 ? (
          <section
            className="related-products"
            aria-labelledby="related-products-title"
          >
            <h2 id="related-products-title">{productDetail.related}</h2>
            <div className="related-products__carousel">
              <button
                className="related-products__control related-products__control--previous"
                type="button"
                aria-label={content.home.previousProduct}
                onClick={() => scrollRelatedProducts(-1)}
              >
                <ArrowLeft size={18} weight="bold" aria-hidden="true" />
              </button>
              <div
                ref={relatedProductsScrollerRef}
                className="related-products__grid"
                aria-label={productDetail.related}
              >
                {relatedProducts.map((relatedProduct) => (
                  <TheSanPhamLienQuan
                    key={relatedProduct.id}
                    product={relatedProduct}
                  />
                ))}
              </div>
              <button
                className="related-products__control related-products__control--next"
                type="button"
                aria-label={content.home.nextProduct}
                onClick={() => scrollRelatedProducts(1)}
              >
                <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </button>
            </div>
          </section>
        ) : null}
      </div>
      </main>
    </>
  );
}
