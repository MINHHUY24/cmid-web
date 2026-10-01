import { Link } from 'react-router-dom'

interface ProjectCardProps {
  image: string
  location: string
  title: string
  slug?: string
}

export function ProjectCard({ image, location, title, slug }: ProjectCardProps) {
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
    <article className="project-card">
      {slug ? <Link to={`/du-an/${slug}`} aria-label={`Xem chi tiết ${title}`}>{content}</Link> : content}
    </article>
  )
}
