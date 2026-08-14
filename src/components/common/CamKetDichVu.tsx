import {
  ArrowsCounterClockwise,
  ClipboardText,
  Headset,
  SealCheck,
  Truck,
} from '@phosphor-icons/react'

const camKet = [
  {
    title: 'Sản phẩm chính hãng',
    description: 'Cam kết chất lượng',
    icon: <SealCheck weight="thin" />,
  },
  {
    title: 'Giao hàng toàn quốc',
    description: 'Nhanh chóng, an toàn',
    icon: <Truck weight="thin" />,
  },
  {
    title: 'Đổi trả dễ dàng',
    description: 'Trong 7 ngày',
    icon: <ArrowsCounterClockwise weight="thin" />,
  },
  {
    title: 'Báo giá dự án',
    description: 'Tối ưu chi phí',
    icon: <ClipboardText weight="thin" />,
  },
  {
    title: 'Tư vấn chuyên nghiệp',
    description: 'Hỗ trợ tận tâm',
    icon: <Headset weight="thin" />,
  },
]

export function CamKetDichVu() {
  return (
    <section className="product-assurances" aria-label="Cam kết dịch vụ CMID">
      {camKet.map((item) => (
        <article key={item.title} className="product-assurance">
          <span aria-hidden="true">{item.icon}</span>
          <h2>{item.title}</h2>
          <p>{item.description}</p>
        </article>
      ))}
    </section>
  )
}
