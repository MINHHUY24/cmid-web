import { CaretDown, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import productHeroImage from "../assets/images/khong-gian-trung-bay-vat-lieu.jpg";
import { StatusPanel } from "../components/common/KhunTranThai";
import {
  ProductCatalogFilters,
  type ProductFilterOption,
} from "../components/product/BoLocSanPham";
import { ProductCard } from "../components/product/TheSanPham";
import { useProducts } from "../hooks/useProducts";
import type { Product } from "../types/product";

type SortOrder = "newest" | "price-asc" | "price-desc";

const PRODUCTS_PER_PAGE = 12;

function getProductPrice(product: Product): number {
  const price = Number(product.price);
  return Number.isFinite(price) ? price : 0;
}

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((currentValue) => currentValue !== value)
    : [...values, value];
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function createFilterOptions(
  products: Product[],
  getOption: (product: Product) => { id: string; label: string } | null,
): ProductFilterOption[] {
  const options = new Map<string, ProductFilterOption>();

  products.forEach((product) => {
    const option = getOption(product);

    if (!option) {
      return;
    }

    const currentOption = options.get(option.id);
    options.set(option.id, {
      ...option,
      count: (currentOption?.count ?? 0) + 1,
    });
  });

  return Array.from(options.values()).sort((firstOption, secondOption) =>
    firstOption.label.localeCompare(secondOption.label, "vi"),
  );
}

export function TrangSanPhamPage() {
  const { products, isLoading, errorMessage, retry } = useProducts();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSaleTypes, setSelectedSaleTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [brandSearch, setBrandSearch] = useState("");
  const [only3D, setOnly3D] = useState(false);
  const [priceRange, setPriceRange] = useState<{
    from: number | null;
    to: number | null;
  }>({
    from: null,
    to: null,
  });
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const categoryOptions = useMemo(
    () =>
      createFilterOptions(products, (product) =>
        product.category
          ? { id: String(product.category.id), label: product.category.name }
          : null,
      ),
    [products],
  );
  const brandOptions = useMemo(
    () =>
      createFilterOptions(products, (product) =>
        product.brand
          ? { id: String(product.brand.id), label: product.brand.name }
          : null,
      ),
    [products],
  );
  const visibleBrandOptions = useMemo(() => {
    const normalizedSearch = brandSearch.trim().toLocaleLowerCase("vi");

    return normalizedSearch
      ? brandOptions.filter((brand) =>
          brand.label.toLocaleLowerCase("vi").includes(normalizedSearch),
        )
      : brandOptions;
  }, [brandOptions, brandSearch]);
  const statusOptions = useMemo<ProductFilterOption[]>(
    () => [
      {
        id: "AVAILABLE",
        label: "Còn hàng",
        count: products.filter((product) => product.status === "ACTIVE").length,
      },
      {
        id: "ORDER",
        label: "Đặt hàng",
        count: products.filter((product) => product.status !== "ACTIVE").length,
      },
    ],
    [products],
  );
  const priceBounds = useMemo(() => {
    const prices = products.map(getProductPrice).filter((price) => price > 0);

    return {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0,
    };
  }, [products]);
  const priceFrom = priceRange.from ?? priceBounds.min;
  const priceTo = priceRange.to ?? priceBounds.max;
  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const productPrice = getProductPrice(product);
        const categoryMatches =
          selectedCategories.length === 0 ||
          (product.category &&
            selectedCategories.includes(String(product.category.id)));
        const brandMatches =
          selectedBrands.length === 0 ||
          (product.brand && selectedBrands.includes(String(product.brand.id)));
        const saleTypeMatches =
          selectedSaleTypes.length === 0 ||
          selectedSaleTypes.includes(product.saleType);
        const statusMatches =
          selectedStatuses.length === 0 ||
          selectedStatuses.includes(
            product.status === "ACTIVE" ? "AVAILABLE" : "ORDER",
          );
        const modelMatches = !only3D || product.models3D.length > 0;

        return (
          categoryMatches &&
          brandMatches &&
          saleTypeMatches &&
          statusMatches &&
          modelMatches &&
          productPrice >= priceFrom &&
          productPrice <= priceTo
        );
      }),
    [
      only3D,
      priceFrom,
      priceTo,
      products,
      selectedBrands,
      selectedCategories,
      selectedSaleTypes,
      selectedStatuses,
    ],
  );
  const sortedProducts = useMemo(() => {
    const nextProducts = [...filteredProducts];

    if (sortOrder === "price-asc") {
      return nextProducts.sort(
        (firstProduct, secondProduct) =>
          getProductPrice(firstProduct) - getProductPrice(secondProduct),
      );
    }

    if (sortOrder === "price-desc") {
      return nextProducts.sort(
        (firstProduct, secondProduct) =>
          getProductPrice(secondProduct) - getProductPrice(firstProduct),
      );
    }

    return nextProducts.sort(
      (firstProduct, secondProduct) => secondProduct.id - firstProduct.id,
    );
  }, [filteredProducts, sortOrder]);
  const totalPages = Math.max(
    1,
    Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const displayedProducts = sortedProducts.slice(
    (safeCurrentPage - 1) * PRODUCTS_PER_PAGE,
    safeCurrentPage * PRODUCTS_PER_PAGE,
  );
  const displayStart =
    displayedProducts.length === 0
      ? 0
      : (safeCurrentPage - 1) * PRODUCTS_PER_PAGE + 1;
  const displayEnd =
    (safeCurrentPage - 1) * PRODUCTS_PER_PAGE + displayedProducts.length;

  function resetFilters() {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedSaleTypes([]);
    setSelectedStatuses([]);
    setBrandSearch("");
    setOnly3D(false);
    setPriceRange({ from: null, to: null });
    setCurrentPage(1);
  }

  function setPriceFrom(nextValue: number) {
    setPriceRange((currentRange) => ({
      ...currentRange,
      from: clamp(nextValue, priceBounds.min, priceTo),
    }));
    setCurrentPage(1);
  }

  function setPriceTo(nextValue: number) {
    setPriceRange((currentRange) => ({
      ...currentRange,
      to: clamp(nextValue, priceFrom, priceBounds.max),
    }));
    setCurrentPage(1);
  }

  return (
    <div className="trang-san-pham">
      <section
        className="catalog-hero"
        style={{ backgroundImage: `url(${productHeroImage})` }}
        aria-labelledby="catalog-page-title"
      >
        <div className="catalog-hero__overlay" />
        <div className="catalog-hero__content">
          <p>Danh mục CMID</p>
          <h1 id="catalog-page-title">Sản phẩm</h1>
          <span>Vật liệu và nội thất cao cấp cho không gian sống đẳng cấp</span>
        </div>
      </section>

      <div className="catalog-shell">
        <div className="catalog-toolbar">
          <nav className="catalog-breadcrumb" aria-label="Đường dẫn trang">
            <Link to="/">Trang chủ</Link>
            <CaretRight size={14} aria-hidden="true" />
            <span>Sản phẩm</span>
          </nav>
          {!isLoading && !errorMessage ? (
            <div className="catalog-toolbar__controls">
              <p>
                Hiển thị {displayStart}–{displayEnd} trong {products.length} sản
                phẩm
              </p>
              <label className="catalog-sort">
                <span className="sr-only">Sắp xếp sản phẩm</span>
                <select
                  value={sortOrder}
                  onChange={(event) => {
                    setSortOrder(event.target.value as SortOrder);
                    setCurrentPage(1);
                  }}
                >
                  <option value="newest">Sắp xếp: Mới nhất</option>
                  <option value="price-asc">Giá: Thấp đến cao</option>
                  <option value="price-desc">Giá: Cao đến thấp</option>
                </select>
                <CaretDown size={15} weight="bold" aria-hidden="true" />
              </label>
            </div>
          ) : null}
        </div>

        {isLoading ? <StatusPanel title="Đang tải sản phẩm…" /> : null}

        {!isLoading && errorMessage ? (
          <StatusPanel title="Không thể tải sản phẩm" tone="error">
            <p>{errorMessage}</p>
            <button
              className="button button--small"
              type="button"
              onClick={retry}
            >
              Thử lại
            </button>
          </StatusPanel>
        ) : null}

        {!isLoading && !errorMessage ? (
          <div className="catalog-layout">
            <ProductCatalogFilters
              categories={categoryOptions}
              brands={visibleBrandOptions}
              statuses={statusOptions}
              selectedCategories={selectedCategories}
              selectedBrands={selectedBrands}
              selectedSaleTypes={selectedSaleTypes}
              selectedStatuses={selectedStatuses}
              brandSearch={brandSearch}
              only3D={only3D}
              minPrice={priceBounds.min}
              maxPrice={priceBounds.max}
              priceFrom={priceFrom}
              priceTo={priceTo}
              onToggleCategory={(id) => {
                setSelectedCategories((currentCategories) =>
                  toggleValue(currentCategories, id),
                );
                setCurrentPage(1);
              }}
              onToggleBrand={(id) => {
                setSelectedBrands((currentBrands) =>
                  toggleValue(currentBrands, id),
                );
                setCurrentPage(1);
              }}
              onToggleSaleType={(id) => {
                setSelectedSaleTypes((currentSaleTypes) =>
                  toggleValue(currentSaleTypes, id),
                );
                setCurrentPage(1);
              }}
              onToggleStatus={(id) => {
                setSelectedStatuses((currentStatuses) =>
                  toggleValue(currentStatuses, id),
                );
                setCurrentPage(1);
              }}
              onBrandSearchChange={(value) => {
                setBrandSearch(value);
                setCurrentPage(1);
              }}
              onOnly3DChange={(value) => {
                setOnly3D(value);
                setCurrentPage(1);
              }}
              onPriceFromChange={setPriceFrom}
              onPriceToChange={setPriceTo}
              onReset={resetFilters}
            />

            <section
              className="catalog-results"
              aria-label="Danh sách sản phẩm"
            >
              {displayedProducts.length > 0 ? (
                <div className="product-grid">
                  {displayedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <StatusPanel title="Không tìm thấy sản phẩm phù hợp">
                  <p>Thử điều chỉnh lại bộ lọc để xem thêm sản phẩm.</p>
                  <button
                    className="button button--small button--gold"
                    type="button"
                    onClick={resetFilters}
                  >
                    Xóa bộ lọc
                  </button>
                </StatusPanel>
              )}

              {displayedProducts.length > 0 ? (
                <nav
                  className="catalog-pagination"
                  aria-label="Phân trang sản phẩm"
                >
                  <button
                    type="button"
                    aria-label="Trang trước"
                    disabled={safeCurrentPage === 1}
                    onClick={() =>
                      setCurrentPage((page) => Math.max(page - 1, 1))
                    }
                  >
                    <CaretLeft size={18} aria-hidden="true" />
                  </button>
                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1,
                  ).map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={
                        page === safeCurrentPage
                          ? "catalog-pagination__current"
                          : undefined
                      }
                      aria-current={
                        page === safeCurrentPage ? "page" : undefined
                      }
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    aria-label="Trang sau"
                    disabled={safeCurrentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((page) => Math.min(page + 1, totalPages))
                    }
                  >
                    <CaretRight size={18} aria-hidden="true" />
                  </button>
                </nav>
              ) : null}
            </section>
          </div>
        ) : null}

        {/* <section
          className="catalog-partners"
          aria-label="Đối tác thương hiệu hàng đầu"
        >
          <div className="catalog-partners__heading">
            <span aria-hidden="true">◇</span>
            <p>Đối tác thương hiệu hàng đầu</p>
          </div>
          <div className="catalog-partners__list">
            {partnerBrands.map((brand) => (
              <span key={brand}>{brand}</span>
            ))}
          </div>
          <CaretRight
            className="catalog-partners__next"
            size={18}
            aria-hidden="true"
          />
        </section> */}
      </div>
    </div>
  );
}
