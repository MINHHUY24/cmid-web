import {
  Clock,
  EnvelopeSimple,
  MapPin,
  PaperPlaneTilt,
  Phone,
  Storefront,
} from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import heroImage from '../assets/images/hero-lien-he-cmid.png'
import { CamKetDichVu } from '../components/common/CamKetDichVu'
import { KhungDauTrang } from '../components/common/KhungDauTrang'
import { useLanguage } from '../contexts/NgonNguContext'

const showrooms = [
  {
    name: 'Showroom chính TP. Hồ Chí Minh',
    address: '620 Tô Ngọc Vân, Phường Linh Đông, TP. Thủ Đức, TP. Hồ Chí Minh',
    phone: '028 3838 6173',
    email: 'info@cmid.vn',
    hours: '08:00 - 18:00, Thứ 2 - Chủ nhật',
  },
  {
    name: 'Showroom Quận 7',
    address: 'Số 123 Đường Nguyễn Văn Linh, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh',
    phone: '028 5410 6173',
    email: 'q7@cmid.vn',
    hours: '08:30 - 17:30, Thứ 2 - Thứ 7',
  },
  {
    name: 'Showroom Bình Dương',
    address: 'Số 789 Đại lộ Bình Dương, Phường Phú Hòa, TP. Thủ Dầu Một, Bình Dương',
    phone: '0274 730 6173',
    email: 'binhduong@cmid.vn',
    hours: '08:00 - 17:30, Thứ 2 - Thứ 7',
  },
]

export function TrangLienHePage() {
  const [isSent, setIsSent] = useState(false)
  const { content } = useLanguage()
  const { contact } = content
  const localizedShowrooms = showrooms.map((showroom, index) => ({
    ...showroom,
    name: contact.showroomNames[index] ?? showroom.name,
    hours: contact.hours[index] ?? showroom.hours,
  }))

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSent(true)
  }

  return (
    <main className="trang-lien-he trang-noi-dung">
      <KhungDauTrang
        tone="toi"
        title={contact.title}
        description={contact.heroDescription}
        image={heroImage}
        imageAlt="Không gian tư vấn nội thất tại CMID"
      />

      <div className="contact-shell khung-noi-dung">
        <section className="contact-info-strip" aria-label={contact.quickInfoLabel}>
          <article>
            <Phone size={31} weight="thin" aria-hidden="true" />
            <div><h2>{contact.phone}</h2><a href="tel:02838386173">028 3838 6173</a><p>{contact.phoneDescription}</p></div>
          </article>
          <article>
            <EnvelopeSimple size={31} weight="thin" aria-hidden="true" />
            <div><h2>{contact.email}</h2><a href="mailto:info@cmid.vn">info@cmid.vn</a><p>{contact.emailDescription}</p></div>
          </article>
          <article>
            <MapPin size={31} weight="thin" aria-hidden="true" />
            <div><h2>{contact.mainShowroom}</h2><p>620 Tô Ngọc Vân, TP. Thủ Đức</p><p>TP. Hồ Chí Minh</p></div>
          </article>
          <article>
            <Clock size={31} weight="thin" aria-hidden="true" />
            <div><h2>{contact.openingHours}</h2><p>{contact.hours[0]}</p><p>{contact.openingHoursDescription}</p></div>
          </article>
        </section>

        <section className="contact-main-grid">
          <section className="contact-form-panel" aria-labelledby="contact-form-title">
            <h2 id="contact-form-title">{contact.formTitle}</h2>
            <p className="contact-form-panel__intro">{contact.formDescription}</p>
            <form onSubmit={handleSubmit}>
              <label><span className="form-label-text">{contact.name} <b>*</b></span><input name="name" autoComplete="name" placeholder={contact.namePlaceholder} required /></label>
              <label><span className="form-label-text">{contact.phoneLabel} <b>*</b></span><input name="phone" type="tel" autoComplete="tel" placeholder={contact.phonePlaceholder} required /></label>
              <label><span className="form-label-text">{contact.emailLabel} <b>*</b></span><input name="email" type="email" autoComplete="email" placeholder="name@example.com" required /></label>
              <label><span className="form-label-text">{contact.subject} <b>*</b></span><select name="subject" defaultValue="" required><option value="" disabled>{contact.subjectPlaceholder}</option>{contact.subjects.map((subject) => <option key={subject}>{subject}</option>)}</select></label>
              <label className="contact-form-panel__wide"><span className="form-label-text">{contact.message} <b>*</b></span><textarea name="message" rows={5} placeholder={contact.messagePlaceholder} required /></label>
              <label className="contact-form-panel__consent contact-form-panel__wide"><input type="checkbox" name="consent" required />{contact.consent}</label>
              <button className="button button--gold contact-form-panel__wide" type="submit"><PaperPlaneTilt size={18} aria-hidden="true" />{contact.submit}</button>
              {isSent ? <p className="contact-form-panel__success contact-form-panel__wide" role="status">{contact.success}</p> : null}
            </form>
          </section>

          <section className="contact-map" aria-labelledby="contact-map-title">
            <h2 id="contact-map-title">{contact.mapTitle}</h2>
            <iframe
              title={contact.mapFrameTitle}
              src="https://www.google.com/maps?q=620%20To%20Ngoc%20Van%2C%20Thu%20Duc%2C%20Ho%20Chi%20Minh&output=embed"
              loading="lazy"
            />
            <article>
              <MapPin size={26} weight="fill" aria-hidden="true" />
              <h3>CMID Showroom</h3>
              <p>{localizedShowrooms[0].address}</p>
              <a href="https://maps.google.com/?q=620+To+Ngoc+Van,+Thu+Duc,+Ho+Chi+Minh" target="_blank" rel="noreferrer">{contact.directions}</a>
            </article>
          </section>
        </section>

        <section className="contact-showrooms" aria-labelledby="contact-showroom-title">
          <div className="contact-showrooms__heading"><h2 id="contact-showroom-title">{contact.showroomTitle}</h2><p>{contact.showroomDescription}</p></div>
          <div className="contact-showrooms__list">
            {localizedShowrooms.map((showroom) => (
              <article key={showroom.name}>
                <Storefront size={28} weight="thin" aria-hidden="true" />
                <div><h3>{showroom.name}</h3><p>{showroom.address}</p></div>
                <a href={`tel:${showroom.phone.replaceAll(' ', '')}`}>{showroom.phone}</a>
              </article>
            ))}
          </div>
        </section>

        <CamKetDichVu />
      </div>
    </main>
  )
}
