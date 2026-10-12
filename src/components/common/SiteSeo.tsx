import { useLocation } from 'react-router-dom'
import heroHomeImage from '../../assets/images/noi-that-phong-khach-cao-cap.jpg'
import heroAboutImage from '../../assets/images/hero-ve-cmid.png'
import heroContactImage from '../../assets/images/hero-lien-he-cmid.png'
import heroNewsImage from '../../assets/images/hero-tin-tuc-cmid.png'
import heroProductImage from '../../assets/images/hero-san-pham-cmid.png'
import heroProjectImage from '../../assets/images/hero-du-an-cmid.png'
import heroServiceImage from '../../assets/images/hero-dich-vu-cmid.png'
import heroShowroomImage from '../../assets/images/hero-showroom-cmid.png'
import heroSolutionImage from '../../assets/images/hero-giai-phap-cmid.png'
import logoImage from '../../assets/images/logo.webp'
import { useLanguage } from '../../contexts/NgonNguContext'
import { useSiteSettings } from '../../contexts/ThongTinWebsiteContext'
import type { PublicSiteSettings } from '../../services/site-settings.service'
import { getAbsoluteUrl, siteUrl } from '../../utils/seo'
import { Seo, type SeoProps } from './Seo'

type LocalizedPageMetadata = Omit<SeoProps, 'language' | 'canonicalPath' | 'structuredData'>

const metadata: Record<'vi' | 'en', Record<string, LocalizedPageMetadata>> = {
  vi: {
    '/': {
      title: 'Vật liệu xây dựng và nội thất cao cấp | CMID',
      description: 'CMID cung cấp vật liệu xây dựng, đá tự nhiên, gạch ốp lát, thiết bị vệ sinh và nội thất cho không gian sống, dự án và công trình.',
      image: heroHomeImage,
      imageAlt: 'Không gian nội thất cao cấp tại CMID',
    },
    '/products': {
      title: 'Sản phẩm vật liệu xây dựng và nội thất | CMID',
      description: 'Khám phá danh mục đá tự nhiên, gạch ốp lát, thiết bị vệ sinh, sơn và nội thất chính hãng tại CMID.',
      image: heroProductImage,
      imageAlt: 'Danh mục vật liệu và nội thất CMID',
    },
    '/giai-phap': {
      title: 'Giải pháp vật liệu cho không gian sống và dự án | CMID',
      description: 'Tìm giải pháp vật liệu đồng bộ cho nhà ở, công trình, showroom và không gian thương mại cùng CMID.',
      image: heroSolutionImage,
      imageAlt: 'Giải pháp vật liệu cao cấp của CMID',
    },
    '/du-an': {
      title: 'Dự án vật liệu và nội thất tiêu biểu | CMID',
      description: 'Khám phá các dự án tiêu biểu của CMID với giải pháp vật liệu và nội thất được chọn lọc cho từng không gian.',
      image: heroProjectImage,
      imageAlt: 'Dự án nội thất và vật liệu của CMID',
    },
    '/dich-vu': {
      title: 'Dịch vụ tư vấn, báo giá và giao hàng | CMID',
      description: 'CMID hỗ trợ tư vấn vật liệu, báo giá dự án, đặt hàng và đồng hành trong quá trình hoàn thiện công trình.',
      image: heroServiceImage,
      imageAlt: 'Dịch vụ tư vấn vật liệu của CMID',
    },
    '/ve-cmid': {
      title: 'Về CMID | Vật liệu xây dựng và nội thất uy tín',
      description: 'Tìm hiểu về CMID, đơn vị cung cấp vật liệu xây dựng và nội thất với định hướng chất lượng, thẩm mỹ và dịch vụ tận tâm.',
      image: heroAboutImage,
      imageAlt: 'Giới thiệu thương hiệu CMID',
    },
    '/lien-he': {
      title: 'Liên hệ tư vấn vật liệu và báo giá | CMID',
      description: 'Liên hệ CMID để được tư vấn sản phẩm, báo giá dự án, đặt lịch showroom và hỗ trợ đơn hàng.',
      image: heroContactImage,
      imageAlt: 'Không gian tư vấn tại showroom CMID',
    },
    '/tin-tuc-su-kien': {
      title: 'Tin tức vật liệu, nội thất và dự án | CMID',
      description: 'Cập nhật xu hướng vật liệu, kiến thức nội thất, dự án và tin tức mới nhất từ CMID.',
      image: heroNewsImage,
      imageAlt: 'Tin tức và xu hướng vật liệu tại CMID',
    },
    '/he-thong-showroom': {
      title: 'Hệ thống showroom vật liệu và nội thất | CMID',
      description: 'Khám phá hệ thống showroom CMID, nơi bạn có thể trải nghiệm trực tiếp vật liệu, mẫu hoàn thiện và không gian trưng bày.',
      image: heroShowroomImage,
      imageAlt: 'Hệ thống showroom CMID',
    },
    '/gio-hang': {
      title: 'Giỏ hàng | CMID',
      description: 'Giỏ hàng của bạn tại CMID.',
      robots: 'noindex,nofollow',
    },
    '/thanh-toan': {
      title: 'Thanh toán | CMID',
      description: 'Hoàn tất đơn hàng tại CMID.',
      robots: 'noindex,nofollow',
    },
    '/dang-nhap': {
      title: 'Đăng nhập | CMID',
      description: 'Đăng nhập tài khoản CMID.',
      robots: 'noindex,nofollow',
    },
    '/tai-khoan': {
      title: 'Tài khoản | CMID',
      description: 'Quản lý tài khoản CMID.',
      robots: 'noindex,nofollow',
    },
  },
  en: {
    '/': {
      title: 'Premium Building Materials & Interiors | CMID',
      description: 'CMID supplies building materials, natural stone, tiles, sanitary ware and interiors for homes, projects and commercial spaces.',
      image: heroHomeImage,
      imageAlt: 'Premium interior space at CMID',
    },
    '/products': {
      title: 'Building Materials & Interior Products | CMID',
      description: 'Explore natural stone, tiles, sanitary ware, paints and premium interior products from CMID.',
      image: heroProductImage,
      imageAlt: 'CMID materials and interior catalogue',
    },
    '/giai-phap': {
      title: 'Material Solutions for Homes & Projects | CMID',
      description: 'Find coordinated material solutions for homes, projects, showrooms and commercial spaces with CMID.',
      image: heroSolutionImage,
      imageAlt: 'CMID premium material solutions',
    },
    '/du-an': {
      title: 'Featured Material & Interior Projects | CMID',
      description: 'Discover selected CMID projects with tailored material and interior solutions for each space.',
      image: heroProjectImage,
      imageAlt: 'CMID interior and material project',
    },
    '/dich-vu': {
      title: 'Consultation, Quotations & Delivery Services | CMID',
      description: 'CMID supports material consultation, project quotations, ordering and project completion.',
      image: heroServiceImage,
      imageAlt: 'CMID material consultation service',
    },
    '/ve-cmid': {
      title: 'About CMID | Trusted Materials & Interiors',
      description: 'Learn about CMID, a provider of building materials and interiors focused on quality, design and attentive service.',
      image: heroAboutImage,
      imageAlt: 'About the CMID brand',
    },
    '/lien-he': {
      title: 'Contact CMID for Material Consultation & Quotes',
      description: 'Contact CMID for product advice, project quotations, showroom appointments and order support.',
      image: heroContactImage,
      imageAlt: 'Consultation space at CMID showroom',
    },
    '/tin-tuc-su-kien': {
      title: 'Materials, Interiors & Project News | CMID',
      description: 'Read the latest material trends, interior insights, projects and updates from CMID.',
      image: heroNewsImage,
      imageAlt: 'CMID materials and interior news',
    },
    '/he-thong-showroom': {
      title: 'Material & Interior Showroom Network | CMID',
      description: 'Visit CMID showrooms to experience materials, finishes and curated display spaces in person.',
      image: heroShowroomImage,
      imageAlt: 'CMID showroom network',
    },
    '/gio-hang': { title: 'Cart | CMID', description: 'Your CMID cart.', robots: 'noindex,nofollow' },
    '/thanh-toan': { title: 'Checkout | CMID', description: 'Complete your order at CMID.', robots: 'noindex,nofollow' },
    '/dang-nhap': { title: 'Sign in | CMID', description: 'Sign in to your CMID account.', robots: 'noindex,nofollow' },
    '/tai-khoan': { title: 'Account | CMID', description: 'Manage your CMID account.', robots: 'noindex,nofollow' },
  },
}

function createHomeStructuredData(language: 'vi' | 'en', settings: PublicSiteSettings) {
  const inLanguage = language === 'vi' ? 'vi-VN' : 'en-US'
  const phone = settings.phone.trim()

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: settings.businessName,
        url: `${siteUrl}/`,
        logo: getAbsoluteUrl(logoImage),
        email: settings.email,
        telephone: phone,
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: phone,
          contactType: 'customer service',
          availableLanguage: ['vi', 'en'],
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: `${siteUrl}/`,
        name: 'CMID',
        inLanguage,
        publisher: { '@id': `${siteUrl}/#organization` },
      },
    ],
  }
}

export function SiteSeo() {
  const { pathname } = useLocation()
  const { language } = useLanguage()
  const { settings } = useSiteSettings()
  const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '')

  if (/^\/products\/[^/]+$/.test(normalizedPath) || /^\/tin-tuc-su-kien\/[^/]+$/.test(normalizedPath)) {
    return null
  }

  const page = metadata[language][normalizedPath]

  if (!page) {
    return (
      <Seo
        title={language === 'vi' ? 'Không tìm thấy trang | CMID' : 'Page not found | CMID'}
        description={language === 'vi' ? 'Trang bạn tìm kiếm không tồn tại.' : 'The page you requested does not exist.'}
        language={language}
        canonicalPath={normalizedPath}
        robots="noindex,nofollow"
      />
    )
  }

  return (
    <Seo
      {...page}
      language={language}
      canonicalPath={normalizedPath}
      structuredData={normalizedPath === '/' ? createHomeStructuredData(language, settings) : undefined}
    />
  )
}
