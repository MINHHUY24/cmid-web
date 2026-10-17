/*
 * Vai trò: Dải cam kết dịch vụ/bảo hành/giao hàng.
 */
import {
  ArrowsCounterClockwiseIcon,
  ClipboardTextIcon,
  HeadsetIcon,
  SealCheckIcon,
  TruckIcon,
} from '@phosphor-icons/react'
import { useLanguage } from '../../../controllers/state/NgonNguContext'

const assuranceIcons = [
  {
    icon: <SealCheckIcon weight="thin" />,
  },
  {
    icon: <TruckIcon weight="thin" />,
  },
  {
    icon: <ArrowsCounterClockwiseIcon weight="thin" />,
  },
  {
    icon: <ClipboardTextIcon weight="thin" />,
  },
  {
    icon: <HeadsetIcon weight="thin" />,
  },
]

export function CamKetDichVu() {
  const { content } = useLanguage()

  return (
    <section className="product-assurances" aria-label="CMID service commitments">
      {assuranceIcons.map((item, index) => (
        <article key={content.assurances[index].title} className="product-assurance">
          <span aria-hidden="true">{item.icon}</span>
          <h2>{content.assurances[index].title}</h2>
          <p>{content.assurances[index].description}</p>
        </article>
      ))}
    </section>
  )
}
