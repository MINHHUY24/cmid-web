interface ProjectCardProps {
  image: string
  location: string
  title: string
}

export function ProjectCard({ image, location, title }: ProjectCardProps) {
  return (
    <article className="project-card">
      <img src={image} alt="" />
      <div className="project-card__body">
        <h3>{title}</h3>
        <p>{location}</p>
      </div>
    </article>
  )
}
