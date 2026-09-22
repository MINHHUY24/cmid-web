import {
  CaretDown,
  ArrowLeft,
  ArrowRight,
  CaretRight,
  Check,
  Cube,
  House,
  MapPin,
  Minus,
  Phone,
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
import { chiNhanhCmid } from "../constants/chi-nhanh";
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

function ProductDetailLoadingSkeleton({ label }: { label: string }) {
  return (
    <main className="trang-chi-tiet-san-pham">
      <div
        className="product-detail-shell product-detail-loading"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={label}
      >
        <span className="sr-only">{label}</span>

        <nav className="product-detail-loading__breadcrumb" aria-hidden="true">
          <span className="product-detail-skeleton product-detail-skeleton--crumb product-detail-skeleton--crumb-short" />
          <span className="product-detail-skeleton product-detail-skeleton--crumb" />
          <span className="product-detail-skeleton product-detail-skeleton--crumb product-detail-skeleton--crumb-current" />
        </nav>

        <section className="product-detail-overview" aria-hidden="true">
          <div className="product-detail-loading__gallery">
            <div className="product-detail-skeleton product-detail-loading__image" />
            <div className="product-detail-loading__thumbnails">
              {Array.from({ length: 3 }, (_, index) => (
                <span className="product-detail-skeleton" key={index} />
              ))}
            </div>
          </div>

          <div className="product-detail-loading__summary">
            <span className="product-detail-skeleton product-detail-skeleton--title" />
            <span className="product-detail-skeleton product-detail-skeleton--title product-detail-skeleton--title-short" />
            <div className="product-detail-loading__meta">
              <span className="product-detail-skeleton" />
              <span className="product-detail-skeleton" />
              <span className="product-detail-skeleton" />
            </div>
            <dl className="product-detail-loading__spec-list">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index}>
                  <span className="product-detail-skeleton product-detail-skeleton--spec-label" />
                  <span className="product-detail-skeleton product-detail-skeleton--spec-value" />
                </div>
              ))}
            </dl>
            <span className="product-detail-skeleton product-detail-skeleton--price" />
            <div className="product-detail-loading__quantity">
              <span className="product-detail-skeleton product-detail-skeleton--quantity-label" />
              <span className="product-detail-skeleton product-detail-skeleton--quantity-control" />
            </div>
            <div className="product-detail-loading__actions">
              <span className="product-detail-skeleton product-detail-skeleton--primary-action" />
              <span className="product-detail-skeleton product-detail-skeleton--secondary-action" />
              <span className="product-detail-skeleton product-detail-skeleton--secondary-action" />
            </div>
          </div>
        </section>

        <section className="product-detail-loading__assurances" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index}>
              <span className="product-detail-skeleton product-detail-skeleton--assurance-icon" />
              <span className="product-detail-skeleton product-detail-skeleton--assurance-title" />
              <span className="product-detail-skeleton product-detail-skeleton--assurance-copy" />
            </div>
          ))}
        </section>

        <section className="product-detail-loading__tabs" aria-hidden="true">
          <div className="product-detail-loading__tab-list">
            {Array.from({ length: 4 }, (_, index) => (
              <span className="product-detail-skeleton" key={index} />
            ))}
          </div>
          <div className="product-detail-loading__tab-content">
            <div>
              <span className="product-detail-skeleton product-detail-skeleton--copy" />
              <span className="product-detail-skeleton product-detail-skeleton--copy" />
              <span className="product-detail-skeleton product-detail-skeleton--copy product-detail-skeleton--copy-short" />
              <span className="product-detail-skeleton product-detail-skeleton--copy" />
              <span className="product-detail-skeleton product-detail-skeleton--copy product-detail-skeleton--copy-medium" />
            </div>
            <span className="product-detail-skeleton product-detail-loading__tab-visual" />
          </div>
        </section>
      </div>
    </main>
  );
}

function StoreAvailabilitySelect({
  value,
  options,
  ariaLabel,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  ariaLabel: string;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!isOpen) return undefined;

    function closeMenu(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div className="product-detail-store-select" ref={rootRef}>
      <button
        className="product-detail-store-select__trigger"
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((currentOpen) => !currentOpen)}
      >
        <span>{selectedOption?.label}</span>
        <CaretDown size={18} weight="bold" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="product-detail-store-select__menu" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                className={isSelected ? "is-selected" : undefined}
                type="button"
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span>{option.label}</span>
                {isSelected ? <Check size={16} weight="bold" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function TrangChiTietSanPham() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, isLoading, errorMessage, retry } = useProducts();
  const [activeTab, setActiveTab] = useState<TabChiTiet>("mo-ta");
  const [quantity, setQuantity] = useState(1);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [selectedStoreCity, setSelectedStoreCity] = useState("");
  const [selectedStoreDistrict, setSelectedStoreDistrict] = useState("");
  const relatedProductsScrollerRef = useRef<HTMLDivElement>(null);
  const { addItem, dismissCartToast } = useCart();
  const { content, language } = useLanguage();
  const { productDetail } = content;
  const requestedProductPath = id ? `/products/${id}` : "/products";

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
        <ProductDetailLoadingSkeleton label={productDetail.loading} />
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
  const descriptionHighlights = product.descriptionHighlights?.filter(Boolean).length
    ? product.descriptionHighlights.filter(Boolean)
    : productDetail.descriptionPoints;
  const usageGuide = product.usageGuide?.trim() || productDetail.guide;
  const usageGuidePoints = product.usageGuidePoints?.filter(Boolean).length
    ? product.usageGuidePoints.filter(Boolean)
    : productDetail.guidePoints;
  const salesPolicy = product.salesPolicy?.trim() || productDetail.policy;
  const salesPolicyPoints = product.salesPolicyPoints?.filter(Boolean).length
    ? product.salesPolicyPoints.filter(Boolean)
    : productDetail.policyPoints;
  const isDirectOrder = product.saleType === "DIRECT_ORDER";
  const isOutOfStock = product.status === "OUT_OF_STOCK";
  const canAddToCart = isDirectOrder && product.status === "ACTIVE";
  const hasStoreAvailability = canAddToCart && product.stock !== 0;
  const availableStoreBranches = hasStoreAvailability ? chiNhanhCmid : [];
  const storeCities = [...new Set(availableStoreBranches.map((branch) => branch.city))];
  const activeStoreCity = selectedStoreCity || storeCities[0] || "";
  const storeDistricts = [
    ...new Set(
      availableStoreBranches
        .filter((branch) => branch.city === activeStoreCity)
        .map((branch) => branch.district),
    ),
  ];
  const activeStoreDistrict = storeDistricts.includes(selectedStoreDistrict)
    ? selectedStoreDistrict
    : "";
  const filteredStoreBranches = availableStoreBranches.filter(
    (branch) =>
      branch.city === activeStoreCity &&
      (!activeStoreDistrict || branch.district === activeStoreDistrict),
  );
  const storeAvailabilityCopy =
    language === "vi"
      ? {
          title: "Xem chi nhánh có hàng",
          availableSuffix: "chi nhánh có sản phẩm",
          city: "Tỉnh/Thành phố",
          district: "Quận/Huyện",
          allDistricts: "Tất cả quận/huyện",
          call: "Gọi cửa hàng",
          map: "Bản đồ",
        }
      : {
          title: "Find an in-stock branch",
          availableSuffix: "branches have this product",
          city: "City",
          district: "District",
          allDistricts: "All districts",
          call: "Call store",
          map: "Map",
        };
  const actionPath = `/lien-he?bao-gia-san-pham=${product.id}`;
  const actionLabel = isOutOfStock
    ? content.product.outOfStock
    : canAddToCart
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
                isOutOfStock
                  ? "https://schema.org/OutOfStock"
                  : product.status === "ACTIVE"
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
        isOutOfStock
          ? content.product.outOfStock
          : product.status === "ACTIVE"
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
    ...(product.technicalSpecifications ?? [])
      .filter((specification) => specification.label.trim() && specification.value.trim())
      .map((specification) => ({
        label: specification.label.trim(),
        value: specification.value.trim(),
      })),
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
            productId={product.id}
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

                {canAddToCart ? <div className="product-detail-quantity">
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
                </div> : null}
              </>
            ) : null}

            <div className="product-detail-actions">
              {isOutOfStock ? (
                <button className="button button--gold product-detail-actions__primary" type="button" disabled>
                  {actionLabel}
                </button>
              ) : canAddToCart ? (
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
              {canAddToCart ? (
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

            {availableStoreBranches.length > 0 ? (
              <section
                className="product-detail-store-availability"
                aria-labelledby="product-detail-store-availability-title"
              >
                <div className="product-detail-store-availability__heading">
                  <div>
                    <h2 id="product-detail-store-availability-title">
                      {storeAvailabilityCopy.title}
                    </h2>
                    <p>
                      <strong>{filteredStoreBranches.length}</strong>{" "}
                      {storeAvailabilityCopy.availableSuffix}
                    </p>
                  </div>
                  <div className="product-detail-store-availability__filters">
                    <StoreAvailabilitySelect
                      ariaLabel={storeAvailabilityCopy.city}
                      value={activeStoreCity}
                      options={storeCities.map((city) => ({ value: city, label: city }))}
                      onChange={(city) => {
                        setSelectedStoreCity(city);
                        setSelectedStoreDistrict("");
                      }}
                    />
                    <StoreAvailabilitySelect
                      ariaLabel={storeAvailabilityCopy.district}
                      value={activeStoreDistrict}
                      options={[
                        { value: "", label: storeAvailabilityCopy.allDistricts },
                        ...storeDistricts.map((district) => ({ value: district, label: district })),
                      ]}
                      onChange={setSelectedStoreDistrict}
                    />
                  </div>
                </div>

                <ul className="product-detail-store-availability__list">
                  {filteredStoreBranches.map((branch) => {
                    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address)}`;

                    return (
                      <li key={branch.id}>
                        <strong>{branch.name}</strong>
                        <p>{branch.address}</p>
                        <div>
                          <a href={`tel:${branch.phone.replaceAll(" ", "")}`}>
                            <Phone size={16} weight="fill" aria-hidden="true" />
                            {storeAvailabilityCopy.call}
                          </a>
                          <a href={mapUrl} target="_blank" rel="noreferrer">
                            <MapPin size={16} weight="fill" aria-hidden="true" />
                            {storeAvailabilityCopy.map}
                          </a>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}
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
                  {descriptionHighlights.map((point) => (
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
              <p>{usageGuide}</p>
              <ul>
                {usageGuidePoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {activeTab === "chinh-sach" ? (
            <div className="product-detail-tabs__copy">
              <p>{salesPolicy}</p>
              <ul>
                {salesPolicyPoints.map((point) => (
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
