interface SectionHeadingProps {
  id?: string
  title: string
  description?: string
  alignment?: 'left' | 'center'
}

export function SectionHeading({
  id,
  title,
  description,
  alignment = 'center',
}: SectionHeadingProps) {
  return (
    <div className={`section-heading section-heading--${alignment}`}>
      <h2 id={id}>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  )
}
