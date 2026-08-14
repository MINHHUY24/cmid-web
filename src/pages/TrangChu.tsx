import {
  Armchair,
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
import { useState } from "react";
import { Link } from "react-router-dom";
import aboutImage from "../assets/images/khong-gian-trung-bay-vat-lieu.jpg";
import projectGreenImage from "../assets/images/du-an-khu-do-thi-xanh.jpg";
import projectPlanningImage from "../assets/images/du-an-quy-hoach-do-thi.jpg";
import projectTowerImage from "../assets/images/du-an-thap-do-thi.jpg";
import projectRiversideImage from "../assets/images/du-an-ven-song.jpg";
import heroImage from "../assets/images/noi-that-phong-khach-cao-cap.jpg";
import modelImage from "../assets/images/mo-hinh-khong-gian-3d.jpg";
import { CategoryShortcut } from "../components/common/DanhMucNhanh";
import { ProjectCard } from "../components/common/TheDuAn";
import { SectionHeading } from "../components/common/TieuDeMuc";
import { StatusPanel } from "../components/common/KhunTranThai";
import { ProductCard } from "../components/product/TheSanPham";
import { useProducts } from "../hooks/useProducts";
import type { Product } from "../types/product";

type BoLocSanPham = {
  label: string;
  matches: (product: Product) => boolean;
};

const danhMucNhanh = [
  {
    label: "Xi măng & Bê tông",
    to: "/products",
    icon: <Wall size={32} weight="thin" />,
  },
  {
    label: "Gạch ốp lát",
    to: "/products",
    icon: <GridFour size={32} weight="thin" />,
  },
  {
    label: "Sơn & Chống thấm",
    to: "/products",
    icon: <PaintBrush size={32} weight="thin" />,
  },
  {
    label: "Thiết bị vệ sinh",
    to: "/products",
    icon: <Toilet size={32} weight="thin" />,
  },
  {
    label: "Đá tự nhiên",
    to: "/products",
    icon: <Cube size={32} weight="thin" />,
  },
  {
    label: "Cửa & Phụ kiện",
    to: "/products",
    icon: <DoorOpen size={32} weight="thin" />,
  },
  {
    label: "Trần & Vách",
    to: "/products",
    icon: <Buildings size={32} weight="thin" />,
  },
  {
    label: "Nội thất phòng khách",
    to: "/products",
    icon: <Armchair size={32} weight="thin" />,
  },
  {
    label: "Nội thất phòng ăn",
    to: "/products",
    icon: <Chair size={32} weight="thin" />,
  },
  {
    label: "Nội thất văn phòng",
    to: "/products",
    icon: <Storefront size={32} weight="thin" />,
  },
  {
    label: "Xem tất cả",
    to: "/products",
    icon: <GridFour size={32} weight="thin" />,
  },
];

const boLocSanPham: BoLocSanPham[] = [
  { label: "Tất cả", matches: () => true },
  {
    label: "Vật liệu xây dựng",
    matches: (product) =>
      /xi măng|gạch|sơn/i.test(product.category?.name ?? ""),
  },
  {
    label: "Thiết bị & Hoàn thiện",
    matches: (product) =>
      /thiết bị|vệ sinh/i.test(product.category?.name ?? ""),
  },
  {
    label: "Nội thất",
    matches: (product) => /nội thất/i.test(product.category?.name ?? ""),
  },
];

const duAnNoiBat = [
  {
    title: "Khu đô thị xanh",
    location: "TP. Thủ Đức, TP. Hồ Chí Minh",
    image: projectGreenImage,
  },
  {
    title: "Tháp đô thị",
    location: "Quận 1, TP. Hồ Chí Minh",
    image: projectTowerImage,
  },
  {
    title: "Khu căn hộ ven sông",
    location: "TP. Thủ Đức, TP. Hồ Chí Minh",
    image: projectRiversideImage,
  },
  {
    title: "Đô thị sinh thái",
    location: "Phía Nam, TP. Hồ Chí Minh",
    image: projectPlanningImage,
  },
];

const tinTuc = [
  {
    title: "Xu hướng gạch ốp lát cho không gian hiện đại",
    date: "10/04/2026",
    image: aboutImage,
  },
  {
    title: "Thiết kế phòng khách sang trọng với vật liệu tự nhiên",
    date: "08/04/2026",
    image: projectRiversideImage,
  },
  {
    title: "Giải pháp chống thấm hiệu quả mùa mưa",
    date: "05/04/2026",
    image: projectGreenImage,
  },
];

export function TrangChuPage() {
  const { products, isLoading, errorMessage, retry } = useProducts();
  const [boLocDangChon, setBoLocDangChon] = useState("Tất cả");
  const activeFilter = boLocSanPham.find(
    (filter) => filter.label === boLocDangChon,
  );
  const sanPhamHienThi = activeFilter
    ? products.filter(activeFilter.matches)
    : products;

  return (
    <div className="trang-chu">
      <section
        className="trang-chu__hero"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="trang-chu__hero-overlay" />
        <div className="trang-chu__hero-content">
          <h1>
            Giải pháp vật liệu xây dựng <span>& nội thất cao cấp</span>
          </h1>
          <p>
            CMID mang đến những sản phẩm chính hãng, chất lượng vượt trội cho
            mọi không gian sống và công trình.
          </p>
          <div className="trang-chu__hero-actions">
            <Link className="button button--gold" to="/products">
              Khám phá sản phẩm
              <ArrowRight size={18} weight="bold" aria-hidden="true" />
            </Link>
            <Link className="button button--outline-light" to="/lien-he">
              Yêu cầu báo giá
            </Link>
          </div>
        </div>
      </section>

      <div className="trang-chu__container">
        <nav className="category-bar" aria-label="Danh mục sản phẩm">
          {danhMucNhanh.map((category) => (
            <CategoryShortcut key={category.label} {...category} />
          ))}
        </nav>

        <section
          className="home-products section-space"
          aria-labelledby="san-pham-noi-bat"
        >
          <SectionHeading id="san-pham-noi-bat" title="Sản phẩm nổi bật" />
          <div className="product-filters" aria-label="Lọc sản phẩm">
            {boLocSanPham.map((filter) => (
              <button
                key={filter.label}
                type="button"
                className={
                  boLocDangChon === filter.label
                    ? "product-filter product-filter--active"
                    : "product-filter"
                }
                onClick={() => setBoLocDangChon(filter.label)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div
              className="home-products__skeleton"
              aria-label="Đang tải sản phẩm"
            />
          ) : null}

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

          {!isLoading && !errorMessage && sanPhamHienThi.length === 0 ? (
            <StatusPanel title="Chưa có sản phẩm thuộc nhóm này" />
          ) : null}

          {!isLoading && !errorMessage && sanPhamHienThi.length > 0 ? (
            <div className="home-product-grid">
              {sanPhamHienThi.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="showcase"
                />
              ))}
            </div>
          ) : null}
        </section>

        <section className="order-options" aria-label="Phương thức mua hàng">
          <div className="order-option">
            <div className="order-option__icon" aria-hidden="true">
              <ShoppingCart size={42} weight="thin" />
            </div>
            <div>
              <h2>Mua trực tiếp</h2>
              <p>Sản phẩm có sẵn, giao hàng nhanh chóng.</p>
              <ul>
                <li>
                  <Check size={15} weight="bold" aria-hidden="true" /> Đặt hàng
                  dễ dàng
                </li>
                <li>
                  <Check size={15} weight="bold" aria-hidden="true" /> Thanh
                  toán linh hoạt
                </li>
                <li>
                  <Check size={15} weight="bold" aria-hidden="true" /> Giao hàng
                  toàn quốc
                </li>
              </ul>
            </div>
            <Link className="button button--gold" to="/products">
              Mua ngay
            </Link>
          </div>
          <div className="order-option">
            <div className="order-option__icon" aria-hidden="true">
              <ClipboardText size={42} weight="thin" />
            </div>
            <div>
              <h2>Yêu cầu báo giá</h2>
              <p>Giải pháp tối ưu cho công trình và dự án.</p>
              <ul>
                <li>
                  <Check size={15} weight="bold" aria-hidden="true" /> Báo giá
                  nhanh chóng
                </li>
                <li>
                  <Check size={15} weight="bold" aria-hidden="true" /> Chiết
                  khấu dự án
                </li>
                <li>
                  <Check size={15} weight="bold" aria-hidden="true" /> Tư vấn
                  chuyên sâu
                </li>
              </ul>
            </div>
            <Link className="button button--gold" to="/lien-he">
              Gửi yêu cầu
            </Link>
          </div>
        </section>

        <section className="about-cmid section-space" aria-labelledby="ve-cmid">
          <img
            src={aboutImage}
            alt="Không gian trưng bày vật liệu và nội thất CMID"
          />
          <div className="about-cmid__content">
            <SectionHeading
              alignment="left"
              id="ve-cmid"
              title="Về CMID"
              description="CMID đồng hành cùng khách hàng từ khâu chọn vật liệu đến hoàn thiện không gian sống và công trình."
            />
            <div className="about-cmid__values">
              <div>
                <Medal size={30} weight="thin" aria-hidden="true" />
                <span>
                  Sản phẩm
                  <br />
                  chính hãng
                </span>
              </div>
              <div>
                <Sparkle size={30} weight="thin" aria-hidden="true" />
                <span>
                  Chất lượng
                  <br />
                  hàng đầu
                </span>
              </div>
              <div>
                <Cube size={30} weight="thin" aria-hidden="true" />
                <span>
                  Giải pháp
                  <br />
                  đa dạng
                </span>
              </div>
              <div>
                <Storefront size={30} weight="thin" aria-hidden="true" />
                <span>
                  Dịch vụ
                  <br />
                  chuyên nghiệp
                </span>
              </div>
            </div>
            <Link className="button button--gold" to="/ve-cmid">
              Tìm hiểu về CMID
              <ArrowRight size={17} weight="bold" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section className="brand-strip" aria-label="Đối tác và thương hiệu">
          <span>INSEE</span>
          <span>VICOSTONE</span>
          <span>TOTO</span>
          <span>Dulux</span>
          <span>HÄFELE</span>
          <span>AN CƯỜNG</span>
          <span>CAESAR</span>
        </section>

        <section
          className="experience-3d"
          style={{ backgroundImage: `url(${modelImage})` }}
        >
          <div className="experience-3d__content">
            <p>Trải nghiệm 3D</p>
            <h2>Kiến tạo không gian của bạn</h2>
            <span>
              Khám phá sản phẩm trong không gian trực quan và hình dung vẻ đẹp
              của ngôi nhà.
            </span>
            <Link className="button button--gold" to="/products">
              Trải nghiệm ngay
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
              title="Dự án tiêu biểu"
            />
            <Link className="text-link" to="/du-an">
              Xem tất cả dự án <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="project-grid">
            {duAnNoiBat.map((project) => (
              <ProjectCard key={project.title} {...project} />
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
              title="Tin tức & cảm hứng"
            />
            <Link className="text-link" to="/tin-tuc-su-kien">
              Xem tất cả tin tức <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="news-list">
            {tinTuc.map((article) => (
              <article key={article.title} className="news-item">
                <img src={article.image} alt="" />
                <div>
                  <h3>{article.title}</h3>
                  <p>{article.date}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
