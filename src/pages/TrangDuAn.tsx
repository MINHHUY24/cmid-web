import { ArrowRight, MapPin } from "@phosphor-icons/react";
import projectGreenImage from "../assets/images/du-an-khu-do-thi-xanh.jpg";
import projectPlanningImage from "../assets/images/du-an-quy-hoach-do-thi.jpg";
import projectTowerImage from "../assets/images/du-an-thap-do-thi.jpg";
import projectRiversideImage from "../assets/images/du-an-ven-song.jpg";
import heroImage from "../assets/images/hero-du-an-cmid.png";
import { KhungDauTrang } from "../components/common/KhungDauTrang";
import { ProjectCard } from "../components/common/TheDuAn";
import { useLanguage } from '../contexts/NgonNguContext'
import { getAdminProjects } from './admin/admin-local-store'

const duAnTieuBieu = [
  { image: projectGreenImage },
  { image: projectTowerImage },
  { image: projectRiversideImage },
];

export function TrangDuAnPage() {
  const { content, language } = useLanguage()
  const { projects } = content
  const displayedProjects = [
    ...getAdminProjects(language),
    ...projects.cards.map((project, index) => ({
      ...project,
      image: duAnTieuBieu[index]?.image ?? projectPlanningImage,
    })),
  ].slice(0, 6)

  return (
    <main className="trang-du-an trang-noi-dung">
      <KhungDauTrang
        tone="toi"
        title={projects.title}
        description={projects.description}
        image={heroImage}
        imageAlt="Không gian nội thất dự án cao cấp"
        actionLabel={projects.action}
        actionHref="#danh-sach-du-an"
      />

      <section className="du-an__danh-sach khung-noi-dung" id="danh-sach-du-an" aria-label={projects.title}>
        <div className="du-an__danh-sach-dau">
          <p className="nhan-noi-dung">{projects.eyebrow}</p>
          <h2>{projects.heading}</h2>
        </div>
        <div className="du-an__luoi">
          {displayedProjects.map((project) => (
            <ProjectCard key={`${project.title}-${project.location}`} {...project} />
          ))}
        </div>
      </section>

      <section className="du-an__noi-bat khung-noi-dung">
        <img src={projectPlanningImage} alt="Riverside urban project" />
        <div>
          <p className="nhan-noi-dung">{projects.featureEyebrow}</p>
          <h2>{projects.featureTitle}</h2>
          <p className="du-an__dia-diem"><MapPin size={18} weight="fill" aria-hidden="true" />{projects.featureLocation}</p>
          <p>{projects.featureDescription}</p>
          <a className="text-link" href="#danh-sach-du-an">{projects.details} <ArrowRight size={16} weight="bold" aria-hidden="true" /></a>
        </div>
      </section>
    </main>
  );
}
