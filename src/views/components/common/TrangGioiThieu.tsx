/*
 * Vai trò: Khối intro trang đơn giản gồm title/description.
 */
import { ArrowRightIcon } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../controllers/state/NgonNguContext'

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
        <ArrowRightIcon size={17} weight="bold" aria-hidden="true" />
      </Link>
    </section>
  )
}
