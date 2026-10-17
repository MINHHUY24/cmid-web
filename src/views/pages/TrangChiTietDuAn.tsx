/*
 * Vai trò: Chi tiết một dự án theo slug, gallery và nội dung song ngữ.
 */
import { ArrowLeftIcon, MapPinIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  KhungXuong,
  TrangDangTaiKhungXuong,
} from "../components/common/KhungXuong";
import { Seo } from "../components/common/Seo";
import { StatusPanel } from "../components/common/KhunTranThai";
import { useLanguage } from "../../controllers/state/NgonNguContext";
import { getAbsoluteUrl } from "../utils/seo";
import {
  getProjectBySlug,
  localizeProject,
  type Project,
} from "../../services/project.service";

function ChiTietDuAnKhungXuong({ label }: { label: string }) {
  return (
    <main className="trang-chi-tiet-du-an trang-noi-dung">
      <TrangDangTaiKhungXuong
        className="du-an-chi-tiet du-an-chi-tiet--skeleton khung-noi-dung"
        label={label}
      >
        <div
          className="du-an-chi-tiet__breadcrumb du-an-chi-tiet__skeleton-breadcrumb"
          aria-hidden="true"
        >
          <KhungXuong />
          <KhungXuong />
          <KhungXuong />
        </div>
        <section
          className="du-an-chi-tiet__header du-an-chi-tiet__header--skeleton"
          aria-hidden="true"
        >
          <div className="du-an-chi-tiet__skeleton-copy">
            <KhungXuong className="du-an-chi-tiet__skeleton-eyebrow" />
            <KhungXuong className="du-an-chi-tiet__skeleton-title" />
            <KhungXuong className="du-an-chi-tiet__skeleton-title du-an-chi-tiet__skeleton-title--short" />
            <KhungXuong className="du-an-chi-tiet__skeleton-location" />
            <KhungXuong className="du-an-chi-tiet__skeleton-summary" />
            <KhungXuong className="du-an-chi-tiet__skeleton-summary du-an-chi-tiet__skeleton-summary--short" />
          </div>
          <KhungXuong className="du-an-chi-tiet__skeleton-image" />
        </section>
        <section
          className="du-an-chi-tiet__content du-an-chi-tiet__content--skeleton"
          aria-hidden="true"
        >
          <KhungXuong className="du-an-chi-tiet__skeleton-aside" />
          <div className="du-an-chi-tiet__body">
            <KhungXuong className="du-an-chi-tiet__skeleton-eyebrow" />
            <KhungXuong className="du-an-chi-tiet__skeleton-paragraph" />
            <KhungXuong className="du-an-chi-tiet__skeleton-paragraph" />
            <KhungXuong className="du-an-chi-tiet__skeleton-paragraph du-an-chi-tiet__skeleton-paragraph--short" />
          </div>
        </section>
      </TrangDangTaiKhungXuong>
    </main>
  );
}

export function TrangChiTietDuAnPage() {
  const { slug } = useParams();
  const { content, language } = useLanguage();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestedPath = slug ? `/du-an/${slug}` : "/du-an";

  useEffect(() => {
    let isCurrentRequest = true;

    async function loadProject() {
      if (!slug) {
        setErrorMessage("Không tìm thấy dự án.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await getProjectBySlug(slug);
        if (isCurrentRequest) setProject(response);
      } catch (error: unknown) {
        if (isCurrentRequest) {
          setProject(null);
          setErrorMessage(
            error instanceof Error ? error.message : "Không thể tải dự án.",
          );
        }
      } finally {
        if (isCurrentRequest) setIsLoading(false);
      }
    }

    void loadProject();
    return () => {
      isCurrentRequest = false;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <ChiTietDuAnKhungXuong
        label={language === "vi" ? "Đang tải dự án" : "Loading project"}
      />
    );
  }

  if (!project || errorMessage) {
    return (
      <main className="trang-chi-tiet-du-an trang-noi-dung">
        <Seo
          title={
            language === "vi"
              ? "Không tìm thấy dự án | CMID"
              : "Project not found | CMID"
          }
          description={
            language === "vi"
              ? "Dự án bạn tìm kiếm hiện không khả dụng."
              : "The project you requested is unavailable."
          }
          language={language}
          canonicalPath={requestedPath}
          robots="noindex,nofollow"
        />
        <StatusPanel
          title={
            errorMessage ??
            (language === "vi" ? "Không tìm thấy dự án." : "Project not found.")
          }
          tone="error"
        >
          <Link className="button button--gold" to="/du-an">
            {language === "vi" ? "Xem tất cả dự án" : "Browse projects"}
          </Link>
        </StatusPanel>
      </main>
    );
  }

  const localizedProject = localizeProject(project, language);
  const paragraphs = localizedProject.content
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  const canonicalPath = `/du-an/${localizedProject.slug}`;
  const projectStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        "@id": `${getAbsoluteUrl(canonicalPath)}#project`,
        name: localizedProject.title,
        description: localizedProject.description,
        image: [
          localizedProject.image,
          ...localizedProject.gallery.map((item) => item.image),
        ].map(getAbsoluteUrl),
        url: getAbsoluteUrl(canonicalPath),
        inLanguage: language === "vi" ? "vi-VN" : "en-US",
        mainEntityOfPage: getAbsoluteUrl(canonicalPath),
        author: { "@type": "Organization", name: "CMID" },
        publisher: { "@type": "Organization", name: "CMID" },
        spatialCoverage: { "@type": "Place", name: localizedProject.location },
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
            name: content.header.projects,
            item: getAbsoluteUrl("/du-an"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: localizedProject.title,
            item: getAbsoluteUrl(canonicalPath),
          },
        ],
      },
    ],
  };

  return (
    <main className="trang-chi-tiet-du-an trang-noi-dung">
      <Seo
        title={`${localizedProject.title} | CMID`}
        description={localizedProject.description}
        language={language}
        canonicalPath={canonicalPath}
        image={localizedProject.image}
        imageAlt={localizedProject.title}
        type="article"
        structuredData={projectStructuredData}
      />

      <article className="du-an-chi-tiet khung-noi-dung">
        <nav className="du-an-chi-tiet__breadcrumb" aria-label="Breadcrumb">
          <Link to="/">{content.common.home}</Link>
          <span aria-hidden="true">/</span>
          <Link to="/du-an">{content.header.projects}</Link>
          <span aria-hidden="true">/</span>
          <span>{localizedProject.title}</span>
        </nav>

        <header className="du-an-chi-tiet__header">
          <div>
            <p className="nhan-noi-dung">
              {localizedProject.featured
                ? content.projects.featureEyebrow
                : content.header.projects}
            </p>
            <h1>{localizedProject.title}</h1>
            <p className="du-an-chi-tiet__location">
              <MapPinIcon size={20} weight="fill" aria-hidden="true" />
              {localizedProject.location}
            </p>
            <p className="du-an-chi-tiet__summary">
              {localizedProject.description}
            </p>
          </div>
          <img src={localizedProject.image} alt={localizedProject.title} />
        </header>

        <section
          className="du-an-chi-tiet__content"
          aria-label={language === "vi" ? "Nội dung dự án" : "Project details"}
        >
          <aside
            className="du-an-chi-tiet__aside"
            aria-label={
              language === "vi" ? "Thông tin dự án" : "Project information"
            }
          >
            <figure>
              <div className="du-an-chi-tiet__aside-media">
                <img
                  src={localizedProject.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <figcaption className="du-an-chi-tiet__aside-caption">
                <span className="du-an-chi-tiet__aside-label">
                  {localizedProject.featured
                    ? content.projects.featureEyebrow
                    : content.header.projects}
                </span>
                <span className="du-an-chi-tiet__aside-location">
                  <MapPinIcon size={16} weight="fill" aria-hidden="true" />
                  {localizedProject.location}
                </span>
              </figcaption>
            </figure>
          </aside>
          <div className="du-an-chi-tiet__body">
            <p className="nhan-noi-dung">
              {language === "vi" ? "Câu chuyện dự án" : "Project story"}
            </p>
            {paragraphs.map((paragraph, index) => (
              <ProjectContentBlock
                key={`${index}-${paragraph}`}
                block={paragraph}
              />
            ))}
            <footer className="du-an-chi-tiet__footer">
              <Link className="text-link" to="/du-an">
                <ArrowLeftIcon size={16} weight="bold" aria-hidden="true" />
                {language === "vi" ? "Quay lại dự án" : "Back to projects"}
              </Link>
            </footer>
          </div>
        </section>

        {localizedProject.gallery.length > 0 ? (
          <section
            className="du-an-chi-tiet__gallery-section"
            aria-labelledby="du-an-chi-tiet-gallery-heading"
          >
            <h2 id="du-an-chi-tiet-gallery-heading">
              {language === "vi"
                ? "Không gian đã thiết kế"
                : "Designed interiors"}
            </h2>
            <div className="du-an-chi-tiet__gallery">
              {localizedProject.gallery.map((item) => (
                <figure key={item.image}>
                  <img
                    src={item.image}
                    alt={item.alt}
                    width={1672}
                    height={941}
                    loading="lazy"
                    decoding="async"
                  />
                </figure>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </main>
  );
}

function ProjectContentBlock({ block }: { block: string }) {
  const content = block.trim();

  if (content.startsWith("### ")) {
    return <h3>{content.slice(4)}</h3>;
  }

  if (content.startsWith("## ")) {
    return <h2>{content.slice(3)}</h2>;
  }

  return <p>{content}</p>;
}
