import {
  Armchair,
  Bathtub,
  Buildings,
  Diamond,
  Eye,
  Handshake,
  Medal,
  PaintBrush,
  Storefront,
  SquaresFour,
} from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import showroomImage from '../assets/images/khong-gian-trung-bay-vat-lieu.jpg'
import heroImage from '../assets/images/hero-ve-cmid.png'
import projectCityImage from '../assets/images/du-an-khu-do-thi-xanh.jpg'
import projectPlanningImage from '../assets/images/du-an-quy-hoach-do-thi.jpg'
import projectTowerImage from '../assets/images/du-an-thap-do-thi.jpg'
import projectRiverImage from '../assets/images/du-an-ven-song.jpg'
import { KhungDauTrang } from '../components/common/KhungDauTrang'
import { ProjectCard } from '../components/common/TheDuAn'
import { useLanguage } from '../contexts/NgonNguContext'

const coreValueIcons = [
  {
    icon: <Medal size={38} weight="thin" aria-hidden="true" />,
  },
  {
    icon: <Eye size={40} weight="thin" aria-hidden="true" />,
  },
  {
    icon: <Diamond size={39} weight="thin" aria-hidden="true" />,
  },
]

const metrics = [
  { value: 15, suffix: '+', icon: <Medal weight="thin" /> },
  { value: 1200, suffix: '+', icon: <Handshake weight="thin" /> },
  { value: 50, suffix: '+', icon: <Diamond weight="thin" /> },
  { value: 1500, suffix: '+', icon: <Buildings weight="thin" /> },
]

const metricTargets = metrics.map(({ value }) => value)
const reachMetricTargets = [2, 63, 100]

const categories = [
  { icon: <SquaresFour weight="thin" /> }, { icon: <Bathtub weight="thin" /> }, { icon: <Diamond weight="thin" /> }, { icon: <PaintBrush weight="thin" /> }, { icon: <Armchair weight="thin" /> }, { icon: <Storefront weight="thin" /> },
]

const partners = ['TOTO', 'Dulux', 'INAX', 'VICOSTONE', 'HÄFELE', 'AN CƯỜNG', 'CAESAR']

const milestones = [
  { year: '2009' }, { year: '2013' }, { year: '2017' }, { year: '2021' }, { year: '2024' },
]

export function TrangVeCmidPage() {
  const { content } = useLanguage()
  const { about } = content
  const [metricsRef, animatedMetrics] = useCountUpOnView(metricTargets)
  const [reachMetricsRef, animatedReachMetrics] = useCountUpOnView(reachMetricTargets)

  return (
    <main className="trang-ve-cmid trang-noi-dung">
      <KhungDauTrang
        title={
          <>
            <span className="trang-ve-cmid__hero-title-first-line">
              CMID – VẬT LIỆU XÂY DỰNG
            </span>
            <br />
            & NỘI THẤT UY TÍN
          </>
        }
        description={about.description}
        image={heroImage}
        imageAlt={about.title}
        actionLabel={about.action}
        actionHref="#lien-he-cmid"
      />

      <section className="about-values khung-noi-dung" aria-label={about.title}>
        {coreValueIcons.map((item, index) => (
          <article key={about.values[index].title}>
            <span>{item.icon}</span>
            <div>
              <h2>{about.values[index].title}</h2>
              <p>{about.values[index].description}</p>
            </div>
          </article>
        ))}
      </section>

      <section ref={metricsRef} className="about-metrics khung-noi-dung" aria-label="CMID metrics">
        {metrics.map((item, index) => (
          <article key={about.metrics[index]}>
            <span aria-hidden="true">{item.icon}</span>
            <strong>{formatMetricValue(animatedMetrics[index], item.suffix)}</strong>
            <p>{about.metrics[index]}</p>
          </article>
        ))}
      </section>

      <section className="about-categories khung-noi-dung" aria-labelledby="about-categories-title">
        <h2 id="about-categories-title">{about.categoriesTitle}</h2>
        <div>
          {categories.map((category, index) => (
            <article key={about.categories[index]}>
              <span aria-hidden="true">{category.icon}</span>
              <p>{about.categories[index]}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-partners khung-noi-dung" aria-labelledby="about-partners-title">
        <h2 id="about-partners-title">{about.partnersTitle}</h2>
        <div className="about-partners__viewport">
          <div className="about-partners__track">
            <div className="about-partners__group">
              {partners.map((partner) => <strong key={partner}>{partner}</strong>)}
            </div>
            <div className="about-partners__group" aria-hidden="true">
              {partners.map((partner) => <strong key={`duplicate-${partner}`}>{partner}</strong>)}
            </div>
          </div>
        </div>
      </section>

      <section className="about-projects khung-noi-dung" aria-labelledby="about-projects-title">
        <h2 id="about-projects-title">{about.projectsTitle}</h2>
        <div className="project-grid">
          <ProjectCard image={projectCityImage} {...about.projects[0]} />
          <ProjectCard image={projectTowerImage} {...about.projects[1]} />
          <ProjectCard image={projectPlanningImage} {...about.projects[2]} />
          <ProjectCard image={projectRiverImage} {...about.projects[3]} />
        </div>
      </section>

      <section ref={reachMetricsRef} className="about-reach khung-noi-dung">
        <article>
          <h2>{about.reachTitle}</h2>
          <p>{about.reachDescription}</p>
          <dl>
            <div><dt>{formatMetricValue(animatedReachMetrics[0], '', 2)}</dt><dd>{about.reachMetrics[0]}</dd></div>
            <div><dt>{formatMetricValue(animatedReachMetrics[1])}</dt><dd>{about.reachMetrics[1]}</dd></div>
            <div><dt>{formatMetricValue(animatedReachMetrics[2], '+')}</dt><dd>{about.reachMetrics[2]}</dd></div>
          </dl>
        </article>
        <article className="about-timeline">
          <h2>{about.timelineTitle}</h2>
          <ol>
            {milestones.map((milestone, index) => (
              <li key={milestone.year}>
                <strong>{milestone.year}</strong>
                <span>{about.milestones[index]}</span>
              </li>
            ))}
          </ol>
        </article>
      </section>

      <section id="lien-he-cmid" className="about-cta" style={{ backgroundImage: `url(${showroomImage})` }}>
        <div className="khung-noi-dung">
          <div>
            <h2>{about.ctaTitle}</h2>
            <p>{about.ctaDescription}</p>
          </div>
          <a className="button button--gold" href="/lien-he">{about.ctaAction}</a>
        </div>
      </section>
    </main>
  )
}

function useCountUpOnView(targets: readonly number[]) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [values, setValues] = useState(() => targets.map(() => 0))

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const showFinalValues = () => setValues([...targets])
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const startAnimation = () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current)
      }

      if (prefersReducedMotion) {
        showFinalValues()
        return
      }

      const startTime = performance.now()
      const duration = 1400
      setValues(targets.map(() => 1))

      const animate = (currentTime: number) => {
        const progress = Math.min((currentTime - startTime) / duration, 1)
        const easedProgress = 1 - (1 - progress) ** 3

        setValues(targets.map((target) => Math.round(1 + (target - 1) * easedProgress)))

        if (progress < 1) {
          animationFrameRef.current = window.requestAnimationFrame(animate)
        } else {
          animationFrameRef.current = null
        }
      }

      animationFrameRef.current = window.requestAnimationFrame(animate)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) startAnimation()
      },
      { threshold: 0.3 },
    )

    observer.observe(section)

    return () => {
      observer.disconnect()
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [targets])

  return [sectionRef, values] as const
}

function formatMetricValue(value: number | undefined, suffix = '', minimumIntegerDigits = 1) {
  return new Intl.NumberFormat('vi-VN', { minimumIntegerDigits }).format(value ?? 0) + suffix
}
