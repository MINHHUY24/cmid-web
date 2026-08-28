import {
  Armchair,
  ArrowLeft,
  ArrowRight,
  Buildings,
  Chair,
  Check,
  ClipboardText,
  Cube,
  DoorOpen,
  GridFour,
  Medal,
  PaintBrush,
  ShoppingCart,
  Sparkle,
  Storefront,
  Toilet,
  Wall,
} from "@phosphor-icons/react";
import { useRef } from "react";
import { Link } from "react-router-dom";
import aboutImage from "../assets/images/khong-gian-trung-bay-vat-lieu.jpg";
import projectGreenImage from "../assets/images/du-an-khu-do-thi-xanh.jpg";
import projectPlanningImage from "../assets/images/du-an-quy-hoach-do-thi.jpg";
import projectTowerImage from "../assets/images/du-an-thap-do-thi.jpg";
import projectRiversideImage from "../assets/images/du-an-ven-song.jpg";
import heroImage from "../assets/images/noi-that-phong-khach-cao-cap.jpg";
import modelImage from "../assets/images/mo-hinh-khong-gian-3d.jpg";
import { getNewsArticles } from "../content/news-articles";
import { CategoryShortcut } from "../components/common/DanhMucNhanh";
import { ProjectCard } from "../components/common/TheDuAn";
import { SectionHeading } from "../components/common/TieuDeMuc";
import { StatusPanel } from "../components/common/KhunTranThai";
import { ProductCard } from "../components/product/TheSanPham";
import { useProducts } from "../hooks/useProducts";
import { useLanguage } from "../contexts/NgonNguContext";
import { getAdminProjects } from "./admin/admin-local-store";

const danhMucNhanh = [
  {
    to: "/products?category=xi-mang-vat-lieu-tho",
    icon: <Wall size={32} weight="thin" />,
  },
  {
    to: "/products?category=gach-op-lat",
    icon: <GridFour size={32} weight="thin" />,
  },
  {
    to: "/products?category=son-chong-tham",
    icon: <PaintBrush size={32} weight="thin" />,
  },
  {
    to: "/products?category=thiet-bi-ve-sinh",
    icon: <Toilet size={32} weight="thin" />,
  },
  {
    to: "/products?category=da-tu-nhien",
    icon: <Cube size={32} weight="thin" />,
  },
  {
    to: "/products?category=cua-phu-kien",
    icon: <DoorOpen size={32} weight="thin" />,
  },
  {
    to: "/products?category=tran-vach",
    icon: <Buildings size={32} weight="thin" />,
  },
  {
    to: "/products?category=noi-that-phong-khach",
    icon: <Armchair size={32} weight="thin" />,
  },
  {
    to: "/products?category=noi-that-phong-an",
    icon: <Chair size={32} weight="thin" />,
  },
  {
    to: "/products?category=noi-that-van-phong",
    icon: <Storefront size={32} weight="thin" />,
  },
  {
    to: "/products",
    icon: <GridFour size={32} weight="thin" />,
  },
];

const duAnNoiBat = [
  {
    image: projectGreenImage,
  },
  {
    image: projectTowerImage,
  },
  {
    image: projectRiversideImage,
  },
  {
    image: projectPlanningImage,
  },
];

const thuongHieu = [
  "INSEE",
  "VICOSTONE",
  "TOTO",
  "Dulux",
  "HÄFELE",
  "AN CƯỜNG",
  "CAESAR",
];

export function TrangChuPage() {
  const { products, isLoading, errorMessage, retry } = useProducts();
  const { content, language } = useLanguage();
  const { home, common } = content;
  const productScrollerRef = useRef<HTMLDivElement>(null);
  const recentArticles = getNewsArticles(language).slice(0, 3);
  const featuredProjects = [
    ...getAdminProjects(language),
    ...home.projects.map((project, index) => ({
      ...project,
      image: duAnNoiBat[index]?.image ?? projectPlanningImage,
    })),
  ].slice(0, 4);

  function scrollFeaturedProducts(direction: -1 | 1) {
    const productScroller = productScrollerRef.current;

    if (!productScroller) return;

    productScroller.scrollBy({
      left: direction * productScroller.clientWidth * 0.82,
      behavior: "smooth",
    });
  }

  return (
    <main className="trang-chu">
      <section
        className="trang-chu__hero"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="trang-chu__hero-overlay" />
        <div className="trang-chu__hero-content">
          <div className="trang-chu__hero-panel">
            <h1>
              {home.heroTitle}
              <br />
              <span>{home.heroHighlight}</span>
            </h1>
            <p>{home.heroDescription}</p>
            <div className="trang-chu__hero-actions">
              <Link className="button button--gold" to="/products">
                {home.browseProducts}
                <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </Link>
              <Link className="button button--outline-light" to="/lien-he">
                {home.requestQuote}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="trang-chu__container">
        <nav
          className="category-bar"
          aria-label={content.product.filter.category}
        >
          {danhMucNhanh.map((category, index) => (
            <CategoryShortcut
              key={home.categories[index]}
              {...category}
              label={home.categories[index]}
            />
          ))}
        </nav>

        <section
          className="home-products section-space"
          aria-labelledby="san-pham-noi-bat"
        >
          <SectionHeading id="san-pham-noi-bat" title={home.featuredTitle} />

          {isLoading ? (
            <div
              className="home-products__skeleton"
              aria-label={home.loading}
            />
          ) : null}

          {!isLoading && errorMessage ? (
            <StatusPanel title={home.loadFailed} tone="error">
              <p>{errorMessage}</p>
              <button
                className="button button--small"
                type="button"
                onClick={retry}
              >
                {common.retry}
              </button>
            </StatusPanel>
          ) : null}

          {!isLoading && !errorMessage && products.length === 0 ? (
            <StatusPanel title={home.emptyFeatured} />
          ) : null}

          {!isLoading && !errorMessage && products.length > 0 ? (
            <div className="home-products__carousel">
              <button
                className="home-products__control home-products__control--previous"
                type="button"
                aria-label={home.previousProduct}
                onClick={() => scrollFeaturedProducts(-1)}
              >
                <ArrowLeft size={18} weight="bold" aria-hidden="true" />
              </button>
              <div
                ref={productScrollerRef}
                className="home-product-grid"
                aria-label={home.featuredTitle}
              >
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="showcase"
                  />
                ))}
              </div>
              <button
                className="home-products__control home-products__control--next"
                type="button"
                aria-label={home.nextProduct}
                onClick={() => scrollFeaturedProducts(1)}
              >
                <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </section>

        <section className="order-options" aria-label="Purchase options">
          <div className="order-option">
            <div className="order-option__icon" aria-hidden="true">
              <ShoppingCart size={42} weight="thin" />
            </div>
            <div>
              <h2>{home.direct.title}</h2>
              <p>{home.direct.description}</p>
              <ul>
                <li>
                  <Check size={15} weight="bold" aria-hidden="true" />{" "}
                  {home.direct.points[0]}
                </li>
                <li>
                  <Check size={15} weight="bold" aria-hidden="true" />{" "}
                  {home.direct.points[1]}
                </li>
                <li>
                  <Check size={15} weight="bold" aria-hidden="true" />{" "}
                  {home.direct.points[2]}
                </li>
              </ul>
            </div>
            <Link className="button button--gold" to="/products">
              {home.direct.action}
            </Link>
          </div>
          <div className="order-option">
            <div className="order-option__icon" aria-hidden="true">
              <ClipboardText size={42} weight="thin" />
            </div>
            <div>
              <h2>{home.quote.title}</h2>
              <p>{home.quote.description}</p>
              <ul>
                <li>
                  <Check size={15} weight="bold" aria-hidden="true" />{" "}
                  {home.quote.points[0]}
                </li>
                <li>
                  <Check size={15} weight="bold" aria-hidden="true" />{" "}
                  {home.quote.points[1]}
                </li>
                <li>
                  <Check size={15} weight="bold" aria-hidden="true" />{" "}
                  {home.quote.points[2]}
                </li>
              </ul>
            </div>
            <Link className="button button--gold" to="/lien-he">
              {home.quote.action}
            </Link>
          </div>
        </section>

        <section className="about-cmid section-space" aria-labelledby="ve-cmid">
          <img src={aboutImage} alt="CMID materials and interiors showroom" />
          <div className="about-cmid__content">
            <SectionHeading
              alignment="left"
              id="ve-cmid"
              title={home.aboutTitle}
              description={home.aboutDescription}
            />
            <div className="about-cmid__values">
              <div>
                <Medal size={30} weight="thin" aria-hidden="true" />
                <span>{home.values[0]}</span>
              </div>
              <div>
                <Sparkle size={30} weight="thin" aria-hidden="true" />
                <span>{home.values[1]}</span>
              </div>
              <div>
                <Cube size={30} weight="thin" aria-hidden="true" />
                <span>{home.values[2]}</span>
              </div>
              <div>
                <Storefront size={30} weight="thin" aria-hidden="true" />
                <span>{home.values[3]}</span>
              </div>
            </div>
            <Link className="button button--gold" to="/ve-cmid">
              {home.learnAbout}
              <ArrowRight size={17} weight="bold" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section className="brand-strip" aria-label={home.brandsLabel}>
          <div className="brand-strip__track">
            {[...thuongHieu, ...thuongHieu].map((brand, index) => (
              <span
                key={`${brand}-${index}`}
                className={
                  brand === "TOTO"
                    ? "brand-strip__item brand-strip__item--toto"
                    : brand === "Dulux"
                      ? "brand-strip__item brand-strip__item--dulux"
                      : "brand-strip__item"
                }
                aria-hidden={index >= thuongHieu.length ? true : undefined}
              >
                {brand}
              </span>
            ))}
          </div>
        </section>

        <section
          className="experience-3d"
          style={{ backgroundImage: `url(${modelImage})` }}
        >
          <div className="experience-3d__content">
            <p>{home.experienceEyebrow}</p>
            <h2>{home.experienceTitle}</h2>
            <span>{home.experienceDescription}</span>
            <Link className="button button--gold" to="/products">
              {home.experienceAction}
              <ArrowRight size={17} weight="bold" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section
          className="featured-projects section-space"
          aria-labelledby="du-an-tieu-bieu"
        >
          <div className="featured-projects__heading">
            <SectionHeading
              id="du-an-tieu-bieu"
              alignment="left"
              title={home.projectsTitle}
            />
            <Link className="text-link" to="/du-an">
              {home.allProjects} <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="project-grid">
            {featuredProjects.map((project) => (
              <ProjectCard
                key={`${project.title}-${project.location}`}
                {...project}
              />
            ))}
          </div>
        </section>

        <section
          className="news-section section-space"
          aria-labelledby="tin-tuc-cam-hung"
        >
          <div>
            <SectionHeading
              id="tin-tuc-cam-hung"
              alignment="left"
              title={home.newsTitle}
            />
            <Link className="text-link" to="/tin-tuc-su-kien">
              {home.allNews} <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="news-list">
            {recentArticles.map((article) => (
              <article key={article.slug} className="news-item">
                <Link to={`/tin-tuc-su-kien/${article.slug}`}>
                  <img src={article.image} alt={article.title} loading="lazy" decoding="async" />
                  <div>
                    <h3>{article.title}</h3>
                    <p><time dateTime={article.publishedAt}>{article.date}</time></p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
