import { EnvelopeSimple, MapPin, Phone } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useLanguage } from '../../contexts/NgonNguContext'
import { useSiteSettings } from '../../contexts/ThongTinWebsiteContext'

export function SiteFooter() {
  const { content } = useLanguage()
  const { settings } = useSiteSettings()
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
          <a href={`tel:${settings.phone.replaceAll(/[^+\d]/g, '')}`}>
            <Phone size={15} aria-hidden="true" />
            {footer.phone} {settings.phone}
          </a>
          <a href={`mailto:${settings.email}`}>
            <EnvelopeSimple size={15} aria-hidden="true" />
            {settings.email}
          </a>
          <p>
            <MapPin size={15} aria-hidden="true" />
            {footer.office} {settings.address}
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
