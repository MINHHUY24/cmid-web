/*
 * Vai trò: Card dự án dùng ở danh sách/trang chủ.
 */
import { type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useScrollRevealController } from '../../../controllers/ui/useScrollRevealController'

interface ProjectCardProps {
  image: string
  location: string
  title: string
  slug?: string
  revealIndex?: number
}

export function ProjectCard({
  image,
  location,
  title,
  slug,
  revealIndex = 0,
}: ProjectCardProps) {
  const { elementRef, isRevealed, reveal } =
    useScrollRevealController<HTMLElement>()
  const revealStyle = {
    '--reveal-delay': `${Math.min(revealIndex, 4) * 45}ms`,
  } as CSSProperties
  const content = (
    <>
      <img src={image} alt={`${title}, ${location}`} loading="lazy" decoding="async" />
      <div className="project-card__body">
        <h3>{title}</h3>
        <p>{location}</p>
      </div>
    </>
  )

  return (
    <article
      ref={elementRef}
      className={`project-card project-card--reveal${isRevealed ? ' is-revealed' : ''}`}
      style={revealStyle}
      onFocus={reveal}
    >
      {slug ? <Link to={`/du-an/${slug}`} aria-label={`Xem chi tiết ${title}`}>{content}</Link> : content}
    </article>
  )
}
