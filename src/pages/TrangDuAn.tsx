import { ArrowRight, MapPin } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import heroImage from '../assets/images/hero-du-an-cmid.png'
import { KhungDauTrang } from '../components/common/KhungDauTrang'
import { KhungXuong, TrangDangTaiKhungXuong } from '../components/common/KhungXuong'
import { ProjectCard } from '../components/common/TheDuAn'
import { StatusPanel } from '../components/common/KhunTranThai'
import { useLanguage } from '../contexts/NgonNguContext'
import { useProjects } from '../hooks/useProjects'
import { localizeProject } from '../services/project.service'

function DanhSachDuAnKhungXuong({ label }: { label: string }) {
  return (
    <TrangDangTaiKhungXuong className="du-an__luoi du-an__luoi--skeleton" label={label}>
      {Array.from({ length: 6 }, (_, index) => (
        <article className="du-an__skeleton-card" key={index} aria-hidden="true">
          <KhungXuong className="du-an__skeleton-image" />
          <div className="du-an__skeleton-body">
            <KhungXuong className="du-an__skeleton-title" />
            <KhungXuong className="du-an__skeleton-title du-an__skeleton-title--short" />
            <KhungXuong className="du-an__skeleton-location" />
          </div>
        </article>
      ))}
    </TrangDangTaiKhungXuong>
  )
}

export function TrangDuAnPage() {
  const { content, language } = useLanguage()
  const { projects: projectRecords, isLoading, errorMessage, retry } = useProjects()
  const projectPage = content.projects
  const displayedProjects = projectRecords.map((project) => localizeProject(project, language))
  const featuredProject = displayedProjects.find((project) => project.featured) ?? displayedProjects[0]

  return (
    <main className="trang-du-an trang-noi-dung">
      <KhungDauTrang
        tone="toi"
        title={projectPage.title}
        description={projectPage.description}
        image={heroImage}
        imageAlt="Không gian nội thất dự án cao cấp"
        actionLabel={projectPage.action}
        actionHref="#danh-sach-du-an"
      />

      <section className="du-an__danh-sach khung-noi-dung" id="danh-sach-du-an" aria-label={projectPage.title}>
        <div className="du-an__danh-sach-dau">
          <p className="nhan-noi-dung">{projectPage.eyebrow}</p>
          <h2>{projectPage.heading}</h2>
        </div>
        {isLoading ? <DanhSachDuAnKhungXuong label={language === 'vi' ? 'Đang tải dự án' : 'Loading projects'} /> : null}
        {errorMessage ? (
          <StatusPanel title={errorMessage} tone="error">
            <button className="button button--gold" type="button" onClick={retry}>{content.common.retry}</button>
          </StatusPanel>
        ) : null}
        {!isLoading && !errorMessage ? (
          <div className="du-an__luoi">
            {displayedProjects.map((project) => <ProjectCard key={project.id} {...project} />)}
          </div>
        ) : null}
      </section>

      {featuredProject ? (
        <section className="du-an__noi-bat khung-noi-dung" aria-label={projectPage.featureEyebrow}>
          <img src={featuredProject.image} alt={featuredProject.title} />
          <div>
            <p className="nhan-noi-dung">{projectPage.featureEyebrow}</p>
            <h2>{featuredProject.title}</h2>
            <p className="du-an__dia-diem"><MapPin size={18} weight="fill" aria-hidden="true" />{featuredProject.location}</p>
            <p>{featuredProject.description}</p>
            <Link className="text-link" to={`/du-an/${featuredProject.slug}`}>{projectPage.details} <ArrowRight size={16} weight="bold" aria-hidden="true" /></Link>
          </div>
        </section>
      ) : null}
    </main>
  )
}
