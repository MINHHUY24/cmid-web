import { ArrowRight } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/NgonNguContext'

interface TrangGioiThieuProps {
  title: string
  description: string
}

export function TrangGioiThieu({ title, description }: TrangGioiThieuProps) {
  const { content } = useLanguage()

  return (
    <section className="trang-gioi-thieu">
      <p className="trang-gioi-thieu__nhan">CMID</p>
      <h1>{title}</h1>
      <p>{description}</p>
      <Link className="button button--gold" to="/products">
        {content.showroom.browseProducts}
        <ArrowRight size={17} weight="bold" aria-hidden="true" />
      </Link>
    </section>
  )
}
