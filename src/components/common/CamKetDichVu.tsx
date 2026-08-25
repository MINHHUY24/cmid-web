import {
  ArrowsCounterClockwise,
  ClipboardText,
  Headset,
  SealCheck,
  Truck,
} from '@phosphor-icons/react'
import { useLanguage } from '../../contexts/NgonNguContext'

const assuranceIcons = [
  {
    icon: <SealCheck weight="thin" />,
  },
  {
    icon: <Truck weight="thin" />,
  },
  {
    icon: <ArrowsCounterClockwise weight="thin" />,
  },
  {
    icon: <ClipboardText weight="thin" />,
  },
  {
    icon: <Headset weight="thin" />,
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
