import { CaretDown, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import productHeroImage from "../assets/images/hero-san-pham-cmid.png";
import { StatusPanel } from "../components/common/KhunTranThai";
import {
  ProductCatalogFilters,
  type ProductFilterOption,
} from "../components/product/BoLocSanPham";
import { ProductCard } from "../components/product/TheSanPham";
import { useProducts } from "../hooks/useProducts";
import type { Product } from "../types/product";
import { useLanguage } from "../contexts/NgonNguContext";

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
  getOption: (
    product: Product,
  ) => { id: string; label: string; slug?: string } | null,
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
  const { content } = useLanguage();
  const [searchParams] = useSearchParams();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [hasChangedCategoryFilter, setHasChangedCategoryFilter] =
    useState(false);
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
          ? {
              id: String(product.category.id),
              label: product.category.name,
              slug: product.category.slug,
            }
          : null,
      ),
    [products],
  );
  const requestedCategorySlug = searchParams.get("category");
  const requestedCategoryId = useMemo(
    () =>
      categoryOptions.find(
        (category) => category.slug === requestedCategorySlug,
      )?.id,
    [categoryOptions, requestedCategorySlug],
  );
  const isUsingRequestedCategory =
    Boolean(requestedCategorySlug) && !hasChangedCategoryFilter;
  const activeSelectedCategories = useMemo(
    () =>
      isUsingRequestedCategory
        ? requestedCategoryId
          ? [requestedCategoryId]
          : []
        : selectedCategories,
    [isUsingRequestedCategory, requestedCategoryId, selectedCategories],
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
        label: content.product.inStock,
        count: products.filter((product) => product.status === "ACTIVE").length,
      },
      {
        id: "ORDER",
        label: content.product.madeToOrder,
        count: products.filter((product) => product.status !== "ACTIVE").length,
      },
    ],
    [content.product.inStock, content.product.madeToOrder, products],
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
          isUsingRequestedCategory
            ? Boolean(
                requestedCategoryId &&
                  product.category &&
                  String(product.category.id) === requestedCategoryId,
              )
            : activeSelectedCategories.length === 0 ||
              (product.category &&
                activeSelectedCategories.includes(String(product.category.id)));
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
      selectedSaleTypes,
      selectedStatuses,
      activeSelectedCategories,
      isUsingRequestedCategory,
      requestedCategoryId,
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
    setHasChangedCategoryFilter(true);
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
          <div className="catalog-hero__glass">
            <h1 id="catalog-page-title">{content.common.products}</h1>
            <span>{content.product.catalogDescription}</span>
          </div>
        </div>
      </section>

      <div className="catalog-shell">
        <div className="catalog-toolbar">
          <nav className="catalog-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">{content.common.home}</Link>
            <CaretRight size={14} aria-hidden="true" />
            <span>{content.common.products}</span>
          </nav>
          {!isLoading && !errorMessage ? (
            <div className="catalog-toolbar__controls">
              <p>
                {content.product.showing(
                  displayStart,
                  displayEnd,
                  products.length,
                )}
              </p>
              <label className="catalog-sort">
                <span className="sr-only">{content.product.sortNewest}</span>
                <select
                  value={sortOrder}
                  onChange={(event) => {
                    setSortOrder(event.target.value as SortOrder);
                    setCurrentPage(1);
                  }}
                >
                  <option value="newest">{content.product.sortNewest}</option>
                  <option value="price-asc">
                    {content.product.sortPriceAsc}
                  </option>
                  <option value="price-desc">
                    {content.product.sortPriceDesc}
                  </option>
                </select>
                <CaretDown size={15} weight="bold" aria-hidden="true" />
              </label>
            </div>
          ) : null}
        </div>

        {isLoading ? <StatusPanel title={content.product.loading} /> : null}

        {!isLoading && errorMessage ? (
          <StatusPanel title={content.product.loadFailed} tone="error">
            <p>{errorMessage}</p>
            <button
              className="button button--small"
              type="button"
              onClick={retry}
            >
              {content.common.retry}
            </button>
          </StatusPanel>
        ) : null}

        {!isLoading && !errorMessage ? (
          <div className="catalog-layout">
            <ProductCatalogFilters
              categories={categoryOptions}
              brands={visibleBrandOptions}
              statuses={statusOptions}
              selectedCategories={activeSelectedCategories}
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
                setHasChangedCategoryFilter(true);
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
              aria-label={content.common.products}
            >
              {displayedProducts.length > 0 ? (
                <div className="product-grid">
                  {displayedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <StatusPanel title={content.product.noResults}>
                  <p>{content.product.noResultsDescription}</p>
                  <button
                    className="button button--small button--gold"
                    type="button"
                    onClick={resetFilters}
                  >
                    {content.product.clearFilters}
                  </button>
                </StatusPanel>
              )}

              {displayedProducts.length > 0 ? (
                <nav
                  className="catalog-pagination"
                  aria-label="Product pagination"
                >
                  <button
                    type="button"
                    aria-label="Previous page"
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
                    aria-label="Next page"
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
