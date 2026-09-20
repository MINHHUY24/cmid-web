import {
  ArrowDown,
  CheckCircle,
  DownloadSimple,
  FileText,
  FloppyDisk,
  GlobeHemisphereWest,
  LockKey,
  MagnifyingGlass,
  Trash,
  UploadSimple,
  WarningCircle,
  Wrench,
} from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import type { AppLanguage } from '../../content/site-content'
import { getAdminDataMode } from '../../services/admin.service'
import { formatCurrency } from '../../utils/formatCurrency'
import {
  AdminCollectionManager,
  AdminPageHeading,
  AdminPanel,
  AdminSelect,
  AdminStatus,
  type AdminEditableRecord,
} from './AdminPrimitives'
import {
  createAdminId,
  mutateAdminDatabase,
  type AdminDatabase,
  type AdminDatabaseCollection,
  type AdminDocument,
  type AdminSettings,
} from './admin-database'
import type { AdminView } from './admin-navigation'
import { useAdminCopy } from './admin-language-context'

interface OperationalViewProps {
  view: AdminView
  database: AdminDatabase
  onToast: (message: string) => void
}

function editableRows(records: Array<{ id: string }>) {
  return records.map((record) => ({ ...record }) as AdminEditableRecord)
}

function upsertRecord(
  collection: AdminDatabaseCollection,
  record: AdminEditableRecord,
  label: string,
) {
  mutateAdminDatabase((database) => {
    const records = database[collection] as unknown as AdminEditableRecord[]
    const nextRecords = [record, ...records.filter((item) => item.id !== record.id)]
    return { ...database, [collection]: nextRecords } as AdminDatabase
  }, `Lưu ${label}: ${String(record.name ?? record.title ?? record.id)}`, label)
}

function deleteRecord(collection: AdminDatabaseCollection, id: string, label: string) {
  mutateAdminDatabase((database) => {
    const records = database[collection] as unknown as AdminEditableRecord[]
    return { ...database, [collection]: records.filter((item) => item.id !== id) } as AdminDatabase
  }, `Xóa ${label} ${id}`, label)
}

const statusOptions = [
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'INACTIVE', label: 'Không hoạt động' },
]

export function AdminOperationalView({ view, database, onToast }: OperationalViewProps) {
  const complete = (message: string) => onToast(message)

  if (view === 'categories') {
    return (
      <AdminCollectionManager
        title="Quản lý danh mục"
        description="Tổ chức các nhóm sản phẩm xuất hiện trong bộ lọc và dải danh mục ngoài website."
        singularLabel="danh mục"
        rows={editableRows(database.categories)}
        columns={[
          { key: 'name', label: 'Tên danh mục', render: (row) => <strong>{String(row.name)}</strong> },
          { key: 'slug', label: 'Đường dẫn' },
          { key: 'description', label: 'Mô tả' },
          { key: 'status', label: 'Trạng thái', render: (row) => <AdminStatus>{String(row.status)}</AdminStatus> },
        ]}
        fields={[
          { key: 'name', label: 'Tên danh mục', required: true },
          { key: 'slug', label: 'Slug', required: true, helper: 'Dùng chữ thường, không dấu và dấu gạch nối.' },
          { key: 'description', label: 'Mô tả', type: 'textarea' },
          { key: 'status', label: 'Trạng thái', type: 'select', options: statusOptions },
        ]}
        onSave={(record) => { upsertRecord('categories', { ...record, updatedAt: new Date().toISOString() }, 'Danh mục'); complete('Đã lưu danh mục.') }}
        onDelete={(id) => { deleteRecord('categories', id, 'Danh mục'); complete('Đã xóa danh mục.') }}
      />
    )
  }

  if (view === 'brands') {
    return (
      <AdminCollectionManager
        title="Quản lý thương hiệu"
        description="Cập nhật tên, logo và liên kết của các thương hiệu đối tác."
        singularLabel="thương hiệu"
        rows={editableRows(database.brands)}
        columns={[
          { key: 'logo', label: 'Logo', render: (row) => row.logo ? <img className="admin-table-thumb" src={String(row.logo)} alt="" /> : <span className="admin-table-placeholder">Chưa có</span> },
          { key: 'name', label: 'Thương hiệu', render: (row) => <strong>{String(row.name)}</strong> },
          { key: 'website', label: 'Website' },
          { key: 'status', label: 'Trạng thái', render: (row) => <AdminStatus>{String(row.status)}</AdminStatus> },
        ]}
        fields={[
          { key: 'name', label: 'Tên thương hiệu', required: true },
          { key: 'slug', label: 'Slug', required: true },
          { key: 'website', label: 'Website', type: 'text' },
          { key: 'logo', label: 'Logo thương hiệu', type: 'image', helper: 'Nên dùng PNG nền trong hoặc WEBP.' },
          { key: 'description', label: 'Giới thiệu', type: 'textarea' },
          { key: 'status', label: 'Trạng thái', type: 'select', options: statusOptions },
        ]}
        onSave={(record) => { upsertRecord('brands', { ...record, updatedAt: new Date().toISOString() }, 'Thương hiệu'); complete('Đã lưu thương hiệu.') }}
        onDelete={(id) => { deleteRecord('brands', id, 'Thương hiệu'); complete('Đã xóa thương hiệu.') }}
      />
    )
  }

  if (view === 'materials') {
    return (
      <AdminCollectionManager
        title="Thư viện vật liệu"
        description="Quản lý xuất xứ, đặc tính và hình ảnh đại diện cho từng dòng vật liệu."
        singularLabel="vật liệu"
        rows={editableRows(database.materials)}
        columns={[
          { key: 'image', label: 'Ảnh', render: (row) => row.image ? <img className="admin-table-thumb" src={String(row.image)} alt="" /> : <span className="admin-table-placeholder">Chưa có</span> },
          { key: 'name', label: 'Vật liệu', render: (row) => <strong>{String(row.name)}</strong> },
          { key: 'origin', label: 'Xuất xứ' },
          { key: 'properties', label: 'Đặc tính' },
          { key: 'status', label: 'Trạng thái', render: (row) => <AdminStatus>{String(row.status)}</AdminStatus> },
        ]}
        fields={[
          { key: 'name', label: 'Tên vật liệu', required: true },
          { key: 'slug', label: 'Slug', required: true },
          { key: 'origin', label: 'Xuất xứ' },
          { key: 'properties', label: 'Đặc tính', type: 'textarea' },
          { key: 'image', label: 'Ảnh vật liệu', type: 'image' },
          { key: 'description', label: 'Mô tả', type: 'textarea' },
          { key: 'status', label: 'Trạng thái', type: 'select', options: statusOptions },
        ]}
        onSave={(record) => { upsertRecord('materials', { ...record, updatedAt: new Date().toISOString() }, 'Vật liệu'); complete('Đã lưu vật liệu.') }}
        onDelete={(id) => { deleteRecord('materials', id, 'Vật liệu'); complete('Đã xóa vật liệu.') }}
      />
    )
  }

  if (view === 'suppliers') {
    return (
      <AdminCollectionManager
        title="Quản lý nhà cung cấp"
        description="Lưu đầu mối liên hệ và nguồn cung phục vụ hoạt động mua hàng."
        singularLabel="nhà cung cấp"
        rows={editableRows(database.suppliers)}
        columns={[
          { key: 'name', label: 'Nhà cung cấp', render: (row) => <strong>{String(row.name)}</strong> },
          { key: 'contactName', label: 'Đầu mối' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Điện thoại' },
          { key: 'status', label: 'Trạng thái', render: (row) => <AdminStatus>{String(row.status)}</AdminStatus> },
        ]}
        fields={[
          { key: 'name', label: 'Tên nhà cung cấp', required: true },
          { key: 'slug', label: 'Slug', required: true },
          { key: 'contactName', label: 'Người liên hệ' },
          { key: 'email', label: 'Email', type: 'email' },
          { key: 'phone', label: 'Điện thoại', type: 'tel' },
          { key: 'address', label: 'Địa chỉ', type: 'textarea' },
          { key: 'description', label: 'Ghi chú', type: 'textarea' },
          { key: 'status', label: 'Trạng thái', type: 'select', options: statusOptions },
        ]}
        onSave={(record) => { upsertRecord('suppliers', { ...record, updatedAt: new Date().toISOString() }, 'Nhà cung cấp'); complete('Đã lưu nhà cung cấp.') }}
        onDelete={(id) => { deleteRecord('suppliers', id, 'Nhà cung cấp'); complete('Đã xóa nhà cung cấp.') }}
      />
    )
  }

  if (view === 'quotes') {
    return (
      <AdminCollectionManager
        title="Yêu cầu báo giá"
        description="Tiếp nhận nhu cầu dự án, ngân sách và tiến độ tư vấn của khách hàng."
        singularLabel="yêu cầu báo giá"
        rows={editableRows(database.quotes)}
        columns={[
          { key: 'id', label: 'Mã yêu cầu', render: (row) => <strong>{String(row.id)}</strong> },
          { key: 'customer', label: 'Khách hàng' },
          { key: 'product', label: 'Nhu cầu' },
          { key: 'budget', label: 'Ngân sách' },
          { key: 'status', label: 'Trạng thái', render: (row) => <AdminStatus>{String(row.status)}</AdminStatus> },
        ]}
        fields={[
          { key: 'customer', label: 'Khách hàng', required: true },
          { key: 'email', label: 'Email', type: 'email' },
          { key: 'phone', label: 'Điện thoại', type: 'tel' },
          { key: 'product', label: 'Sản phẩm hoặc nhu cầu', type: 'textarea', required: true },
          { key: 'projectType', label: 'Loại công trình' },
          { key: 'budget', label: 'Ngân sách dự kiến' },
          { key: 'note', label: 'Ghi chú tư vấn', type: 'textarea' },
          { key: 'status', label: 'Trạng thái', type: 'select', options: ['Mới', 'Đang tư vấn', 'Đã gửi báo giá', 'Đã chốt', 'Đã đóng'].map((value) => ({ value, label: value })) },
        ]}
        onSave={(record) => { upsertRecord('quotes', { ...record, createdAt: String(record.createdAt || new Date().toISOString()) }, 'Báo giá'); complete('Đã lưu yêu cầu báo giá.') }}
        onDelete={(id) => { deleteRecord('quotes', id, 'Báo giá'); complete('Đã xóa yêu cầu báo giá.') }}
      />
    )
  }

  if (view === 'returns') {
    return (
      <AdminCollectionManager
        title="Trả hàng và hoàn tiền"
        description="Theo dõi yêu cầu được tạo từ chi tiết đơn hàng. Trạng thái được cập nhật trong đơn để bảo đảm đồng bộ thanh toán."
        singularLabel="yêu cầu hoàn tiền"
        rows={editableRows(database.returns)}
        columns={[
          { key: 'id', label: 'Mã yêu cầu', render: (row) => <strong>{String(row.id)}</strong> },
          { key: 'orderId', label: 'Đơn hàng' },
          { key: 'customer', label: 'Khách hàng' },
          { key: 'amount', label: 'Giá trị', render: (row) => <strong className="admin-table__price">{formatCurrency(Number(row.amount))}</strong> },
          { key: 'status', label: 'Trạng thái', render: (row) => <AdminStatus>{String(row.status)}</AdminStatus> },
        ]}
        fields={[
          { key: 'orderId', label: 'Mã đơn hàng', required: true },
          { key: 'customer', label: 'Khách hàng', required: true },
          { key: 'reason', label: 'Lý do', type: 'textarea', required: true },
          { key: 'amount', label: 'Số tiền hoàn', type: 'number', required: true },
          { key: 'status', label: 'Trạng thái', type: 'select', options: ['Chờ duyệt', 'Đã duyệt', 'Đang hoàn tiền', 'Hoàn tất', 'Từ chối'].map((value) => ({ value, label: value })) },
        ]}
        onSave={() => undefined}
        onDelete={() => undefined}
        readOnly
      />
    )
  }

  if (view === 'customers') {
    return (
      <AdminCollectionManager
        title="Quản lý khách hàng"
        description="Theo dõi hồ sơ, nhóm thành viên và tổng giá trị giao dịch."
        singularLabel="khách hàng"
        rows={editableRows(database.customers)}
        columns={[
          { key: 'name', label: 'Khách hàng', render: (row) => <strong>{String(row.name)}</strong> },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Điện thoại' },
          { key: 'orderCount', label: 'Đơn hàng', render: (row) => `${String(row.orderCount)} đơn` },
          { key: 'totalSpent', label: 'Tổng chi tiêu', render: (row) => <strong className="admin-table__price">{formatCurrency(Number(row.totalSpent))}</strong> },
          { key: 'status', label: 'Trạng thái', render: (row) => <AdminStatus>{String(row.status)}</AdminStatus> },
        ]}
        fields={[
          { key: 'name', label: 'Họ và tên', required: true },
          { key: 'email', label: 'Email', type: 'email', required: true },
          { key: 'phone', label: 'Điện thoại', type: 'tel' },
          { key: 'company', label: 'Công ty' },
          { key: 'groupId', label: 'Nhóm khách hàng', type: 'select', options: database.customerGroups.map((group) => ({ value: group.id, label: group.name })) },
          { key: 'orderCount', label: 'Số đơn', type: 'number' },
          { key: 'totalSpent', label: 'Tổng chi tiêu', type: 'number' },
          { key: 'status', label: 'Trạng thái', type: 'select', options: statusOptions },
        ]}
        onSave={(record) => { upsertRecord('customers', { ...record, createdAt: String(record.createdAt || new Date().toISOString()) }, 'Khách hàng'); complete('Đã lưu khách hàng.') }}
        onDelete={(id) => { deleteRecord('customers', id, 'Khách hàng'); complete('Đã xóa khách hàng.') }}
      />
    )
  }

  if (view === 'customer-groups') {
    return (
      <AdminCollectionManager
        title="Nhóm khách hàng"
        description="Thiết lập mức chiết khấu và quyền lợi theo từng nhóm thành viên."
        singularLabel="nhóm khách hàng"
        rows={editableRows(database.customerGroups)}
        columns={[
          { key: 'name', label: 'Tên nhóm', render: (row) => <strong>{String(row.name)}</strong> },
          { key: 'memberCount', label: 'Thành viên' },
          { key: 'discountPercent', label: 'Chiết khấu', render: (row) => `${String(row.discountPercent)}%` },
          { key: 'status', label: 'Trạng thái', render: (row) => <AdminStatus>{String(row.status)}</AdminStatus> },
        ]}
        fields={[
          { key: 'name', label: 'Tên nhóm', required: true },
          { key: 'slug', label: 'Slug', required: true },
          { key: 'description', label: 'Quyền lợi', type: 'textarea' },
          { key: 'discountPercent', label: 'Chiết khấu phần trăm', type: 'number' },
          { key: 'memberCount', label: 'Số thành viên', type: 'number' },
          { key: 'status', label: 'Trạng thái', type: 'select', options: statusOptions },
        ]}
        onSave={(record) => { upsertRecord('customerGroups', { ...record, updatedAt: new Date().toISOString() }, 'Nhóm khách hàng'); complete('Đã lưu nhóm khách hàng.') }}
        onDelete={(id) => { deleteRecord('customerGroups', id, 'Nhóm khách hàng'); complete('Đã xóa nhóm khách hàng.') }}
      />
    )
  }

  if (view === 'gifts') {
    return (
      <AdminCollectionManager
        title="Quà tặng và ưu đãi"
        description="Tạo mã giảm giá, điều kiện áp dụng và thời hạn sử dụng."
        singularLabel="ưu đãi"
        rows={editableRows(database.gifts)}
        columns={[
          { key: 'name', label: 'Chương trình', render: (row) => <strong>{String(row.name)}</strong> },
          { key: 'code', label: 'Mã' },
          { key: 'value', label: 'Giá trị', render: (row) => row.type === 'PERCENT' ? `${String(row.value)}%` : formatCurrency(Number(row.value)) },
          { key: 'expiresAt', label: 'Hết hạn' },
          { key: 'status', label: 'Trạng thái', render: (row) => <AdminStatus>{String(row.status)}</AdminStatus> },
        ]}
        fields={[
          { key: 'name', label: 'Tên chương trình', required: true },
          { key: 'code', label: 'Mã ưu đãi', required: true },
          { key: 'type', label: 'Loại ưu đãi', type: 'select', options: [{ value: 'PERCENT', label: 'Giảm theo phần trăm' }, { value: 'FIXED', label: 'Giảm số tiền cố định' }, { value: 'GIFT', label: 'Quà tặng' }] },
          { key: 'value', label: 'Giá trị', type: 'number' },
          { key: 'minimumOrder', label: 'Đơn tối thiểu', type: 'number' },
          { key: 'expiresAt', label: 'Ngày hết hạn', type: 'text', placeholder: 'YYYY-MM-DD' },
          { key: 'status', label: 'Trạng thái', type: 'select', options: statusOptions },
        ]}
        onSave={(record) => { upsertRecord('gifts', record, 'Ưu đãi'); complete('Đã lưu chương trình ưu đãi.') }}
        onDelete={(id) => { deleteRecord('gifts', id, 'Ưu đãi'); complete('Đã xóa ưu đãi.') }}
      />
    )
  }

  if (view === 'banners') {
    return (
      <AdminCollectionManager
        title="Quản lý banner"
        description="Điều khiển hình ảnh, thông điệp và liên kết ở các vùng hero."
        singularLabel="banner"
        rows={editableRows(database.banners)}
        columns={[
          { key: 'image', label: 'Ảnh', render: (row) => row.image ? <img className="admin-table-thumb admin-table-thumb--wide" src={String(row.image)} alt="" /> : <span className="admin-table-placeholder">Chưa tải ảnh</span> },
          { key: 'title', label: 'Tiêu đề', render: (row) => <strong>{String(row.title)}</strong> },
          { key: 'placement', label: 'Vị trí' },
          { key: 'link', label: 'Liên kết' },
          { key: 'status', label: 'Trạng thái', render: (row) => <AdminStatus>{String(row.status)}</AdminStatus> },
        ]}
        fields={[
          { key: 'title', label: 'Tiêu đề tiếng Việt', required: true },
          { key: 'titleEn', label: 'Tiêu đề tiếng Anh' },
          { key: 'placement', label: 'Vị trí', type: 'select', options: [{ value: 'HOME_HERO', label: 'Trang chủ' }, { value: 'PRODUCT_HERO', label: 'Trang sản phẩm' }, { value: 'NEWS_HERO', label: 'Trang tin tức' }] },
          { key: 'image', label: 'Ảnh banner', type: 'image', required: true },
          { key: 'link', label: 'Đường dẫn khi bấm', placeholder: '/products' },
          { key: 'status', label: 'Trạng thái', type: 'select', options: statusOptions },
        ]}
        onSave={(record) => { upsertRecord('banners', { ...record, updatedAt: new Date().toISOString() }, 'Banner'); complete('Đã lưu banner.') }}
        onDelete={(id) => { deleteRecord('banners', id, 'Banner'); complete('Đã xóa banner.') }}
      />
    )
  }

  if (view === 'documents') return <AdminDocumentsView documents={database.documents} onToast={onToast} />

  if (view === 'inquiries') {
    return (
      <AdminCollectionManager
        title="Liên hệ và yêu cầu tư vấn"
        description="Tập trung các yêu cầu từ form liên hệ, showroom và báo giá."
        singularLabel="yêu cầu liên hệ"
        rows={editableRows(database.inquiries)}
        columns={[
          { key: 'name', label: 'Khách hàng', render: (row) => <strong>{String(row.name)}</strong> },
          { key: 'subject', label: 'Chủ đề' },
          { key: 'phone', label: 'Điện thoại' },
          { key: 'source', label: 'Nguồn' },
          { key: 'status', label: 'Trạng thái', render: (row) => <AdminStatus>{String(row.status)}</AdminStatus> },
        ]}
        fields={[
          { key: 'name', label: 'Khách hàng', required: true },
          { key: 'email', label: 'Email', type: 'email' },
          { key: 'phone', label: 'Điện thoại', type: 'tel' },
          { key: 'subject', label: 'Chủ đề', required: true },
          { key: 'message', label: 'Nội dung', type: 'textarea' },
          { key: 'source', label: 'Nguồn', type: 'select', options: [{ value: 'CONTACT', label: 'Form liên hệ' }, { value: 'QUOTE', label: 'Yêu cầu báo giá' }, { value: 'SHOWROOM', label: 'Đặt lịch showroom' }] },
          { key: 'status', label: 'Trạng thái', type: 'select', options: ['Mới', 'Đang xử lý', 'Đã phản hồi', 'Đã đóng'].map((value) => ({ value, label: value })) },
        ]}
        onSave={(record) => { upsertRecord('inquiries', { ...record, createdAt: String(record.createdAt || new Date().toISOString()) }, 'Liên hệ'); complete('Đã cập nhật yêu cầu liên hệ.') }}
        onDelete={(id) => { deleteRecord('inquiries', id, 'Liên hệ'); complete('Đã xóa yêu cầu liên hệ.') }}
      />
    )
  }

  if (view === 'showrooms') {
    return (
      <AdminCollectionManager
        title="Hệ thống showroom"
        description="Quản lý thông tin liên hệ, giờ mở cửa, bản đồ và ảnh đại diện."
        singularLabel="showroom"
        rows={editableRows(database.showrooms)}
        columns={[
          { key: 'image', label: 'Ảnh', render: (row) => row.image ? <img className="admin-table-thumb" src={String(row.image)} alt="" /> : <span className="admin-table-placeholder">Chưa có</span> },
          { key: 'name', label: 'Showroom', render: (row) => <strong>{String(row.name)}</strong> },
          { key: 'address', label: 'Địa chỉ' },
          { key: 'phone', label: 'Điện thoại' },
          { key: 'status', label: 'Trạng thái', render: (row) => <AdminStatus>{String(row.status)}</AdminStatus> },
        ]}
        fields={[
          { key: 'name', label: 'Tên showroom', required: true },
          { key: 'address', label: 'Địa chỉ', type: 'textarea', required: true },
          { key: 'phone', label: 'Điện thoại', type: 'tel' },
          { key: 'email', label: 'Email', type: 'email' },
          { key: 'hours', label: 'Giờ mở cửa' },
          { key: 'mapUrl', label: 'Liên kết bản đồ' },
          { key: 'image', label: 'Ảnh showroom', type: 'image' },
          { key: 'status', label: 'Trạng thái', type: 'select', options: statusOptions },
        ]}
        onSave={(record) => { upsertRecord('showrooms', record, 'Showroom'); complete('Đã lưu showroom.') }}
        onDelete={(id) => { deleteRecord('showrooms', id, 'Showroom'); complete('Đã xóa showroom.') }}
      />
    )
  }

  if (view === 'settings') return <AdminSettingsView settings={database.settings} onToast={onToast} />

  if (view === 'users') {
    return (
      <AdminCollectionManager
        title="Người dùng quản trị"
        description="Quản lý tài khoản nội bộ và vai trò được cấp."
        singularLabel="người dùng"
        rows={editableRows(database.users)}
        columns={[
          { key: 'name', label: 'Người dùng', render: (row) => <strong>{String(row.name)}</strong> },
          { key: 'email', label: 'Email' },
          { key: 'roleId', label: 'Vai trò', render: (row) => database.roles.find((role) => role.id === row.roleId)?.name ?? String(row.roleId) },
          { key: 'lastLogin', label: 'Đăng nhập gần nhất', render: (row) => formatDate(String(row.lastLogin)) },
          { key: 'status', label: 'Trạng thái', render: (row) => <AdminStatus>{String(row.status)}</AdminStatus> },
        ]}
        fields={[
          { key: 'name', label: 'Họ và tên', required: true },
          { key: 'email', label: 'Email', type: 'email', required: true },
          { key: 'roleId', label: 'Vai trò', type: 'select', options: database.roles.map((role) => ({ value: role.id, label: role.name })) },
          { key: 'status', label: 'Trạng thái', type: 'select', options: [{ value: 'ACTIVE', label: 'Đang hoạt động' }, { value: 'LOCKED', label: 'Đã khóa' }] },
        ]}
        onSave={(record) => { upsertRecord('users', { ...record, lastLogin: String(record.lastLogin || '') }, 'Người dùng'); complete('Đã lưu người dùng.') }}
        onDelete={(id) => { deleteRecord('users', id, 'Người dùng'); complete('Đã xóa người dùng.') }}
      />
    )
  }

  if (view === 'roles') {
    return (
      <AdminCollectionManager
        title="Vai trò và phân quyền"
        description="Khai báo nhóm quyền cho quản trị, nội dung và kinh doanh."
        singularLabel="vai trò"
        rows={database.roles.map((role) => ({ ...role, permissionsText: role.permissions.join(', ') }))}
        columns={[
          { key: 'name', label: 'Vai trò', render: (row) => <strong>{String(row.name)}</strong> },
          { key: 'description', label: 'Mô tả' },
          { key: 'permissionsText', label: 'Phạm vi quyền' },
          { key: 'userCount', label: 'Người dùng' },
        ]}
        fields={[
          { key: 'name', label: 'Tên vai trò', required: true },
          { key: 'description', label: 'Mô tả', type: 'textarea' },
          { key: 'permissionsText', label: 'Danh sách quyền', type: 'textarea', helper: 'Ngăn cách quyền bằng dấu phẩy, ví dụ products.read, products.write.' },
          { key: 'userCount', label: 'Số người dùng', type: 'number' },
        ]}
        onSave={(record) => {
          const permissions = String(record.permissionsText ?? '').split(',').map((item) => item.trim()).filter(Boolean)
          upsertRecord('roles', { ...record, permissions }, 'Vai trò')
          complete('Đã lưu vai trò và phạm vi quyền.')
        }}
        onDelete={(id) => { deleteRecord('roles', id, 'Vai trò'); complete('Đã xóa vai trò.') }}
      />
    )
  }

  if (view === 'logs') {
    return (
      <AdminCollectionManager
        title="Nhật ký hoạt động"
        description="Dòng thời gian thay đổi dữ liệu và thao tác trong khu vực quản trị."
        singularLabel="nhật ký"
        rows={editableRows(database.activities)}
        columns={[
          { key: 'createdAt', label: 'Thời gian', render: (row) => formatDate(String(row.createdAt), true) },
          { key: 'actor', label: 'Người thao tác', render: (row) => <strong>{String(row.actor)}</strong> },
          { key: 'module', label: 'Phân hệ' },
          { key: 'action', label: 'Hoạt động' },
        ]}
        fields={[]}
        onSave={() => undefined}
        onDelete={() => undefined}
        searchPlaceholder="Tìm theo người dùng, phân hệ hoặc hoạt động..."
        readOnly
      />
    )
  }

  return null
}

function AdminDocumentsView({ documents, onToast }: { documents: AdminDocument[]; onToast: (message: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<{ name: string; data: string } | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Catalogue')
  const [visibility, setVisibility] = useState<AdminDocument['visibility']>('PUBLIC')
  const [error, setError] = useState('')

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0]
    event.target.value = ''
    if (!selected) return
    if (selected.size > 2 * 1024 * 1024) {
      setError('Tệp không được vượt quá 2 MB trong bản demo cục bộ.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFile({ name: selected.name, data: reader.result })
        setTitle((current) => current || selected.name.replace(/\.[^.]+$/, ''))
        setError('')
      }
    }
    reader.onerror = () => setError('Không thể đọc tệp đã chọn.')
    reader.readAsDataURL(selected)
  }

  function saveDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) {
      setError('Vui lòng chọn tệp từ thiết bị.')
      return
    }
    const documentRecord: AdminDocument = {
      id: createAdminId('document'),
      title: title.trim(),
      category,
      fileName: file.name,
      fileData: file.data,
      visibility,
      updatedAt: new Date().toISOString(),
    }
    upsertRecord('documents', { ...documentRecord }, 'Tài liệu')
    setTitle('')
    setFile(null)
    onToast('Đã tải và lưu tài liệu.')
  }

  return (
    <>
      <AdminPageHeading title="Quản lý tài liệu" description="Lưu hồ sơ năng lực, catalogue, bảng giá và tài liệu vận hành." />
      <div className="admin-content-layout">
        <AdminPanel title="Kho tài liệu">
          <div className="admin-document-list">
            {documents.map((document) => (
              <article key={document.id}>
                <span><FileText size={22} /></span>
                <div><strong>{document.title}</strong><small>{document.fileName} · {document.category}</small></div>
                <AdminStatus>{document.visibility === 'PUBLIC' ? 'ACTIVE' : 'INTERNAL'}</AdminStatus>
                {document.fileData ? <a href={document.fileData} download={document.fileName} aria-label={`Tải ${document.title}`}><DownloadSimple size={18} /></a> : <button type="button" disabled aria-label="Tệp chưa được tải lên"><ArrowDown size={18} /></button>}
                <button type="button" className="is-danger" onClick={() => { deleteRecord('documents', document.id, 'Tài liệu'); onToast('Đã xóa tài liệu.') }} aria-label={`Xóa ${document.title}`}><Trash size={18} /></button>
              </article>
            ))}
          </div>
        </AdminPanel>
        <AdminPanel title="Tải tài liệu mới">
          <form className="admin-compact-form" onSubmit={saveDocument}>
            <label className="admin-field"><span>Tên tài liệu <b>*</b></span><input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
            <label className="admin-field"><span>Phân loại</span><AdminSelect value={category} onChange={setCategory} aria-label="Phân loại tài liệu" options={['Catalogue', 'Hồ sơ năng lực', 'Bảng giá', 'Hướng dẫn'].map((value) => ({ value, label: value }))} /></label>
            <label className="admin-field"><span>Phạm vi</span><AdminSelect value={visibility} onChange={(value) => setVisibility(value as AdminDocument['visibility'])} aria-label="Phạm vi tài liệu" options={[{ value: 'PUBLIC', label: 'Công khai' }, { value: 'INTERNAL', label: 'Nội bộ' }]} /></label>
            <button className="admin-file-picker" type="button" onClick={() => fileRef.current?.click()}><UploadSimple size={23} /><span><strong>{file?.name ?? 'Chọn tệp từ thiết bị'}</strong><small>PDF, DOCX, XLSX hoặc tài liệu có dung lượng tối đa 2 MB</small></span></button>
            <input ref={fileRef} className="sr-only" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" onChange={selectFile} />
            {error ? <p className="admin-form-error" role="alert">{error}</p> : null}
            <button className="admin-button admin-button--primary" type="submit"><FloppyDisk size={17} />Lưu tài liệu</button>
          </form>
        </AdminPanel>
      </div>
    </>
  )
}

type AdminSettingsTab = 'business' | 'commerce' | 'notifications' | 'security' | 'maintenance' | 'language'
type SaveableSettingsTab = Exclude<AdminSettingsTab, 'language' | 'security'>

interface AdminLanguageOption {
  code: AppLanguage
  locale: string
  label: string
  nativeLabel: string
  searchTerms: string
}

const adminSettingsTabs: Array<{ id: AdminSettingsTab; label: string; panelTitle: string }> = [
  { id: 'business', label: 'Thông tin doanh nghiệp', panelTitle: 'Thông tin cửa hàng và showroom' },
  { id: 'commerce', label: 'Bán hàng và vận chuyển', panelTitle: 'Chính sách thương mại' },
  { id: 'notifications', label: 'Email thông báo', panelTitle: 'Thông báo vận hành' },
  { id: 'maintenance', label: 'Bảo trì website', panelTitle: 'Chế độ bảo trì website' },
  { id: 'language', label: 'Ngôn ngữ hệ thống', panelTitle: 'Ngôn ngữ hệ thống quản trị' },
  { id: 'security', label: 'Bảo mật và dữ liệu', panelTitle: 'Trạng thái kết nối' },
]

const adminSettingsSaveActions: Record<SaveableSettingsTab, {
  fields: Array<keyof AdminSettings>
  label: string
  activity: string
  toast: string
}> = {
  business: {
    fields: ['businessName', 'email', 'phone', 'address', 'weekdayHours', 'weekendHours'],
    label: 'Lưu thông tin doanh nghiệp',
    activity: 'Cập nhật thông tin doanh nghiệp',
    toast: 'Đã lưu thông tin doanh nghiệp.',
  },
  commerce: {
    fields: ['freeShippingThreshold', 'defaultVatPercent', 'paymentQrTimeoutSeconds'],
    label: 'Lưu chính sách thương mại',
    activity: 'Cập nhật chính sách thương mại',
    toast: 'Đã lưu chính sách thương mại.',
  },
  notifications: {
    fields: ['orderNotificationEmail'],
    label: 'Lưu email thông báo',
    activity: 'Cập nhật email thông báo',
    toast: 'Đã lưu email thông báo.',
  },
  maintenance: {
    fields: ['maintenanceMode'],
    label: 'Lưu chế độ bảo trì',
    activity: 'Cập nhật chế độ bảo trì website',
    toast: 'Đã lưu chế độ bảo trì website.',
  },
}

const adminLanguageOptions: AdminLanguageOption[] = [
  {
    code: 'vi',
    locale: 'vi-VN',
    label: 'Tiếng Việt',
    nativeLabel: 'Vietnamese',
    searchTerms: 'viet nam vietnam vi tieng viet',
  },
  {
    code: 'en',
    locale: 'en-GB',
    label: 'Tiếng Anh',
    nativeLabel: 'English',
    searchTerms: 'english anh en united kingdom quoc te',
  },
]

function normalizeAdminSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('vi')
}

function AdminSettingsView({ settings, onToast }: { settings: AdminSettings; onToast: (message: string) => void }) {
  const { t } = useAdminCopy()
  const [form, setForm] = useState(settings)
  const [tab, setTab] = useState<AdminSettingsTab>('business')
  const [languageQuery, setLanguageQuery] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>(settings.adminLanguage)
  const keepDraftOnSettingsSync = useRef(false)

  useEffect(() => {
    const shouldKeepDraft = keepDraftOnSettingsSync.current
    keepDraftOnSettingsSync.current = false
    if (!shouldKeepDraft) {
      setForm(settings)
      setSelectedLanguage(settings.adminLanguage)
    }
  }, [settings])

  const filteredLanguages = useMemo(() => {
    const query = normalizeAdminSearch(languageQuery)
    if (!query) return adminLanguageOptions
    return adminLanguageOptions.filter((option) => normalizeAdminSearch(
      `${option.label} ${option.nativeLabel} ${option.locale} ${option.searchTerms}`,
    ).includes(query))
  }, [languageQuery])

  const activeTab = adminSettingsTabs.find((item) => item.id === tab) ?? adminSettingsTabs[0]

  function update<K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function saveSettingsSection() {
    if (tab === 'language' || tab === 'security') return

    const action = adminSettingsSaveActions[tab]
    const sectionSettings = Object.fromEntries(
      action.fields.map((field) => [field, form[field]]),
    ) as Partial<AdminSettings>

    keepDraftOnSettingsSync.current = true
    mutateAdminDatabase(
      (database) => ({ ...database, settings: { ...database.settings, ...sectionSettings } }),
      action.activity,
      'Cấu hình',
    )
    onToast(action.toast)
  }

  function confirmLanguage() {
    const selectedOption = adminLanguageOptions.find((option) => option.code === selectedLanguage)
    keepDraftOnSettingsSync.current = true
    setForm((current) => ({ ...current, adminLanguage: selectedLanguage }))
    mutateAdminDatabase(
      (database) => ({ ...database, settings: { ...database.settings, adminLanguage: selectedLanguage } }),
      `Đổi ngôn ngữ quản trị sang ${selectedOption?.label ?? selectedLanguage}`,
      'Cấu hình',
    )
    onToast(`Đã chọn ${selectedOption?.label ?? selectedLanguage} cho hệ thống quản trị.`)
  }

  const saveAction = tab === 'language' || tab === 'security' ? null : adminSettingsSaveActions[tab]

  return (
    <>
      <AdminPageHeading title="Cấu hình hệ thống" description="Thiết lập thông tin doanh nghiệp, chính sách bán hàng và vận hành admin." />
      <div className="admin-settings-layout">
        <AdminPanel title="Nhóm cấu hình">
          <nav className="admin-settings-nav">
            {adminSettingsTabs.map((item) => (
              <button className={tab === item.id ? 'is-active' : ''} key={item.id} type="button" onClick={() => setTab(item.id)}>
                {t(item.label)}
              </button>
            ))}
          </nav>
        </AdminPanel>
        <AdminPanel title={activeTab.panelTitle}>
          <div className="admin-settings-form">
            {tab === 'business' ? (
              <>
                <label className="admin-field"><span>{t('Tên doanh nghiệp')}</span><input value={form.businessName} onChange={(event) => update('businessName', event.target.value)} /></label>
                <div className="admin-form-grid admin-form-grid--two"><label className="admin-field"><span>{t('Email chính thức')}</span><input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} /></label><label className="admin-field"><span>{t('Hotline')}</span><input value={form.phone} onChange={(event) => update('phone', event.target.value)} /></label></div>
                <label className="admin-field"><span>{t('Địa chỉ')}</span><textarea value={form.address} onChange={(event) => update('address', event.target.value)} /></label>
                <div className="admin-form-grid admin-form-grid--two"><label className="admin-field"><span>{t('Giờ ngày thường')}</span><input value={form.weekdayHours} onChange={(event) => update('weekdayHours', event.target.value)} /></label><label className="admin-field"><span>{t('Giờ cuối tuần')}</span><input value={form.weekendHours} onChange={(event) => update('weekendHours', event.target.value)} /></label></div>
              </>
            ) : null}
            {tab === 'commerce' ? (
              <>
                <label className="admin-field"><span>{t('Ngưỡng miễn phí giao hàng')}</span><input type="number" value={form.freeShippingThreshold} onChange={(event) => update('freeShippingThreshold', Number(event.target.value))} /></label>
                <label className="admin-field"><span>{t('Thuế VAT mặc định (%)')}</span><input type="number" min="0" max="100" value={form.defaultVatPercent} onChange={(event) => update('defaultVatPercent', Number(event.target.value))} /></label>
                <label className="admin-field">
                  <span>{t('Thời gian hiển thị QR (giây)')}</span>
                  <input type="number" min="30" step="1" value={form.paymentQrTimeoutSeconds} onChange={(event) => update('paymentQrTimeoutSeconds', Math.max(30, Number(event.target.value) || 30))} />
                  <small>{t('Tối thiểu 30 giây. Khi hết thời gian, QR không còn hiệu lực trong luồng thanh toán.')}</small>
                </label>
              </>
            ) : null}
            {tab === 'notifications' ? <><label className="admin-field"><span>{t('Email nhận thông báo đơn hàng')}</span><input type="email" value={form.orderNotificationEmail} onChange={(event) => update('orderNotificationEmail', event.target.value)} /></label><div className="admin-settings-note"><CheckCircle size={20} /><p>{t('Email này sẽ nhận thông báo khi backend gửi sự kiện đơn hàng mới.')}</p></div></> : null}
            {tab === 'maintenance' ? (
              <>
                <div className={`admin-maintenance-summary${form.maintenanceMode ? ' is-enabled' : ''}`}>
                  <span><Wrench size={24} /></span>
                  <div>
                    <strong>{t(form.maintenanceMode ? 'Website đang ở chế độ bảo trì' : 'Website đang hoạt động bình thường')}</strong>
                    <p>{t(form.maintenanceMode ? 'Khách truy cập sẽ thấy trang thông báo bảo trì. Khu vực admin vẫn hoạt động để bạn có thể tắt chế độ này.' : 'Khách hàng có thể truy cập sản phẩm, tin tức, giỏ hàng và các trang nội dung như bình thường.')}</p>
                  </div>
                </div>
                <label className="admin-maintenance-toggle">
                  <input type="checkbox" checked={form.maintenanceMode} onChange={(event) => update('maintenanceMode', event.target.checked)} />
                  <span>
                    <strong>{t('Bật chế độ bảo trì website')}</strong>
                    <small>{t('Thay đổi có hiệu lực sau khi bấm Lưu chế độ bảo trì.')}</small>
                  </span>
                </label>
                <div className="admin-settings-note">
                  <WarningCircle size={20} />
                  <p>{t('Bản demo hiện lưu trạng thái trên trình duyệt này. Khi triển khai thật, backend cần đồng bộ cờ bảo trì để áp dụng cho mọi khách truy cập.')}</p>
                </div>
              </>
            ) : null}
            {tab === 'language' ? (
              <div className="admin-language-settings">
                <div className="admin-language-intro">
                  <span><GlobeHemisphereWest size={23} /></span>
                  <div><strong>{t('Chọn ngôn ngữ ưu tiên')}</strong><p>{t('Danh sách chỉ gồm những ngôn ngữ đã có bộ nội dung trong hệ thống.')}</p></div>
                </div>
                <label className="admin-language-search">
                  <MagnifyingGlass size={18} />
                  <input value={languageQuery} onChange={(event) => setLanguageQuery(event.target.value)} placeholder={t('Tìm theo tên hoặc mã ngôn ngữ...')} />
                </label>
                <div className="admin-language-list" role="radiogroup" aria-label="Danh sách ngôn ngữ quản trị">
                  {filteredLanguages.map((option) => (
                    <label className={`admin-language-option${selectedLanguage === option.code ? ' is-selected' : ''}`} key={option.code}>
                      <input type="radio" name="admin-language" value={option.code} checked={selectedLanguage === option.code} onChange={() => setSelectedLanguage(option.code)} />
                      <span className="admin-language-option__code">{option.code.toLocaleUpperCase('vi')}</span>
                      <span className="admin-language-option__name"><strong>{t(option.label)}</strong><small>{option.nativeLabel}, {option.locale}</small></span>
                      <span className="admin-language-option__state">{t(form.adminLanguage === option.code ? 'Đang sử dụng' : 'Có sẵn')}</span>
                    </label>
                  ))}
                  {filteredLanguages.length === 0 ? <p className="admin-language-empty">{t('Không tìm thấy ngôn ngữ phù hợp.')}</p> : null}
                </div>
                <div className="admin-language-actions">
                  <p>{t('Nội dung bạn đã nhập sẽ được giữ nguyên và không tự động dịch.')}</p>
                  <button className="admin-button admin-button--primary" type="button" onClick={confirmLanguage} disabled={selectedLanguage === form.adminLanguage}>
                    {t('Xác nhận thay đổi ngôn ngữ')}
                  </button>
                </div>
              </div>
            ) : null}
            {tab === 'security' ? <div className="admin-security-summary"><span><LockKey size={23} /></span><div><strong>{t('Chế độ dữ liệu hiện tại')}: {getAdminDataMode() === 'backend' ? t('API quản trị') : t('bản demo cục bộ')}</strong><p>{t('Phiên đăng nhập hiện là bảo vệ giao diện phía trình duyệt. Cần JWT, phân quyền và API backend trước khi dùng trong môi trường thật.')}</p></div></div> : null}
            {saveAction ? (
              <div className="admin-settings-section-actions">
                <button className="admin-button admin-button--primary" type="button" onClick={saveSettingsSection}>
                  <FloppyDisk size={17} />
                  {t(saveAction.label)}
                </button>
              </div>
            ) : null}
          </div>
        </AdminPanel>
      </div>
    </>
  )
}

function formatDate(value: string, withTime = false) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value || 'Chưa có'
  return new Intl.DateTimeFormat('vi-VN', withTime ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'short' }).format(date)
}
