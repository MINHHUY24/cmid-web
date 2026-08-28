import { Link, useLocation } from 'react-router-dom'
import { Seo } from '../components/common/Seo'
import { StatusPanel } from '../components/common/KhunTranThai'
import { useLanguage } from '../contexts/NgonNguContext'

export function TrangKhongTimThayPage() {
  const { language } = useLanguage()
  const { pathname } = useLocation()
  const isVietnamese = language === 'vi'

  return (
    <main className="trang-noi-dung product-detail-shell product-detail-shell--status">
      <Seo
        title={isVietnamese ? 'Không tìm thấy trang | CMID' : 'Page not found | CMID'}
        description={isVietnamese ? 'Trang bạn tìm kiếm không tồn tại.' : 'The page you requested does not exist.'}
        language={language}
        canonicalPath={pathname}
        robots="noindex,nofollow"
      />
      <StatusPanel title={isVietnamese ? 'Không tìm thấy trang' : 'Page not found'}>
        <p>{isVietnamese ? 'Đường dẫn này không tồn tại hoặc đã được thay đổi.' : 'This address does not exist or has changed.'}</p>
        <Link className="button button--small button--gold" to="/">
          {isVietnamese ? 'Về trang chủ' : 'Back to home'}
        </Link>
      </StatusPanel>
    </main>
  )
}
