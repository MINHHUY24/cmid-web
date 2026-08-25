import { EnvelopeSimple, MapPin, Phone } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useLanguage } from '../../contexts/NgonNguContext'

export function SiteFooter() {
  const { content } = useLanguage()
  const { footer } = content
  const footerGroups = [
    {
      title: footer.quickLinks,
      links: [
        { label: footer.about, to: '/ve-cmid' },
        { label: footer.catalog, to: '/products' },
        { label: footer.projects, to: '/du-an' },
        { label: footer.careers, to: '/lien-he' },
        { label: footer.warranty, to: '/dich-vu' },
      ],
    },
    {
      title: footer.premiumProducts,
      links: [
        { label: footer.granite, to: '/products' },
        { label: footer.marble, to: '/products' },
        { label: footer.tiles, to: '/products' },
        { label: footer.bathroom, to: '/products' },
        { label: footer.furniture, to: '/products' },
      ],
    },
  ]

  return (
    <footer className="site-footer">
      <div className="site-footer__grid">
        <div className="site-footer__brand">
          <Link
            className="brand brand--footer"
            to="/"
            aria-label={`CMID - ${content.common.home}`}
          >
            <span className="brand__copy"><strong>CMID</strong><small>Stone &amp; Interior</small></span>
          </Link>
          <p>{footer.description}</p>
        </div>

        {footerGroups.map((group) => (
          <div key={group.title} className="site-footer__links">
            <h2>{group.title}</h2>
            {group.links.map((link) => (
              <Link key={link.label} to={link.to}>
                {link.label}
              </Link>
            ))}
          </div>
        ))}

        <div className="site-footer__contact">
          <h2>{footer.contactInformation}</h2>
          <a href="tel:02838386173">
            <Phone size={15} aria-hidden="true" />
            {footer.phone} (028) 3930 8888
          </a>
          <a href="mailto:cmidvxd@gmail.com">
            <EnvelopeSimple size={15} aria-hidden="true" />
            info@cmid.vn
          </a>
          <p>
            <MapPin size={15} aria-hidden="true" />
            {footer.office} 156 Nguyễn Văn Trỗi, Phường 8, Phú Nhuận, TP. Hồ Chí Minh
          </p>
        </div>
      </div>
      <div className="site-footer__bottom">
        <span>{footer.copyright}</span>
        <span><Link to="/lien-he">{footer.privacy}</Link><Link to="/lien-he">{footer.terms}</Link></span>
      </div>
    </footer>
  );
}
