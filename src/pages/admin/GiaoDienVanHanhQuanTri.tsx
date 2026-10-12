import {
  CheckCircle,
  FloppyDisk,
  GlobeHemisphereWest,
  LockKey,
  MagnifyingGlass,
  WarningCircle,
  Wrench,
  X,
} from "@phosphor-icons/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { KhungXuong } from "../../components/common/KhungXuong";
import type { AppLanguage } from "../../content/site-content";
import {
  defaultSiteSettings,
  getAdminSiteSettings,
  updateSiteSettings,
  type AdminSiteSettings,
  type SiteSettingsUpdate,
} from "../../services/site-settings.service";
import {
  deleteShowroom,
  getAdminShowrooms,
  saveShowroom,
  type Showroom,
} from "../../services/showroom.service";
import {
  getManagedCustomers,
  updateManagedCustomer,
  type ManagedCustomer,
} from "../../services/admin-customer.service";
import {
  deleteManagedInquiry,
  getManagedInquiries,
  updateManagedInquiry,
  type ContactInquiry,
  type InquiryStatus,
} from "../../services/inquiry.service";
import {
  createManagedRole,
  createManagedUser,
  deleteManagedUser,
  deleteManagedRole,
  getManagedRoles,
  getManagedUsers,
  resetManagedUserPassword,
  updateManagedRole,
  updateManagedUser,
  type ManagedAdminUser,
  type ManagedRole,
} from "../../services/admin-access.service";
import { formatCurrency } from "../../utils/formatCurrency";
import {
  AdminCollectionManager,
  AdminBangKhungXuong,
  AdminModalPortal,
  AdminPageHeading,
  AdminPanel,
  AdminStatus,
  type AdminEditableRecord,
} from "./ThanhPhanCoBanQuanTri";
import { getLocalizedAdminError } from "./ThongBaoLoiQuanTri";
import {
  mutateAdminDatabase,
  type AdminDatabase,
  type AdminDatabaseCollection,
  type AdminSettings,
} from "./CoSoDuLieuQuanTri";
import type { AdminView } from "./DieuHuongQuanTri";
import { hasPermission } from "./PhanQuyenQuanTri";
import { useAdminCopy } from "./NguCanhNgonNguQuanTri";
import { useAdminAuth } from "../../contexts/useQuanTriAuth";

interface OperationalViewProps {
  view: AdminView;
  database: AdminDatabase;
  onToast: (message: string) => void;
}

function editableRows(records: Array<{ id: string }>) {
  return records.map((record) => ({ ...record }) as AdminEditableRecord);
}

function upsertRecord(
  collection: AdminDatabaseCollection,
  record: AdminEditableRecord,
  label: string,
) {
  mutateAdminDatabase(
    (database) => {
      const records = database[collection] as unknown as AdminEditableRecord[];
      const nextRecords = [
        record,
        ...records.filter((item) => item.id !== record.id),
      ];
      return { ...database, [collection]: nextRecords } as AdminDatabase;
    },
    `Lưu ${label}: ${String(record.name ?? record.title ?? record.id)}`,
    label,
  );
}

function deleteRecord(
  collection: AdminDatabaseCollection,
  id: string,
  label: string,
) {
  mutateAdminDatabase(
    (database) => {
      const records = database[collection] as unknown as AdminEditableRecord[];
      return {
        ...database,
        [collection]: records.filter((item) => item.id !== id),
      } as AdminDatabase;
    },
    `Xóa ${label} ${id}`,
    label,
  );
}

const statusOptions = [
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "INACTIVE", label: "Không hoạt động" },
];

const rolePermissionGroups = [
  {
    label: "Tổng quan & báo cáo",
    permissions: [
      { value: "dashboard.view", label: "Xem Dashboard" },
      { value: "report.view", label: "Xem báo cáo" },
      { value: "sales.performance.view", label: "Xem hiệu suất kinh doanh" },
    ],
  },
  {
    label: "Sản phẩm",
    permissions: [
      { value: "product.view", label: "Xem sản phẩm" },
      { value: "product.create", label: "Tạo sản phẩm" },
      { value: "product.update", label: "Cập nhật sản phẩm" },
      { value: "product.delete", label: "Xóa sản phẩm" },
      { value: "product.publish", label: "Xuất bản sản phẩm" },
      { value: "category.manage", label: "Quản lý danh mục" },
      { value: "brand.manage", label: "Quản lý thương hiệu" },
      { value: "media.manage", label: "Quản lý hình ảnh" },
      { value: "model.manage", label: "Quản lý model 3D" },
    ],
  },
  {
    label: "Đơn hàng & khách hàng",
    permissions: [
      { value: "customer.view", label: "Xem khách hàng" },
      { value: "customer.manage", label: "Quản lý khách hàng" },
      { value: "quotation.view", label: "Xem báo giá" },
      { value: "quotation.create", label: "Tạo báo giá" },
      { value: "quotation.update", label: "Cập nhật báo giá" },
      { value: "quotation.approve", label: "Duyệt báo giá/chiết khấu" },
      { value: "order.view", label: "Xem đơn hàng" },
      { value: "order.create", label: "Tạo đơn hàng" },
      { value: "order.update", label: "Cập nhật trạng thái đơn" },
      { value: "order.cancel", label: "Hủy đơn hàng" },
    ],
  },
  {
    label: "Nội dung website",
    permissions: [
      { value: "content.manage", label: "Quản lý nội dung website" },
      { value: "content.publish", label: "Duyệt/Xuất bản nội dung" },
    ],
  },
  {
    label: "Hệ thống",
    permissions: [
      { value: "inventory.view", label: "Xem tồn kho" },
      { value: "inventory.update", label: "Cập nhật tồn kho" },
      { value: "warehouse.reserve", label: "Reserve/Release Request" },
      { value: "warehouse.outbound", label: "Outbound Request" },
      { value: "payment.view", label: "Xem thanh toán" },
      { value: "payment.update", label: "Cập nhật thanh toán" },
      { value: "settings.manage", label: "Cấu hình hệ thống" },
      { value: "helpdesk.access", label: "Truy cập Hỗ trợ IT" },
      { value: "helpdesk.manage", label: "Quản lý Hỗ trợ IT" },
      { value: "user.manage", label: "Quản lý người dùng" },
      { value: "role.manage", label: "Quản lý vai trò" },
      { value: "permission.manage", label: "Quản lý phân quyền" },
      { value: "audit.view", label: "Xem Audit Log" },
      { value: "integration.view", label: "Xem Integration Log" },
      { value: "integration.retry", label: "Retry tích hợp" },
      { value: "*", label: "Toàn quyền hệ thống" },
    ],
  },
];

export function AdminOperationalView({
  view,
  database,
  onToast,
}: OperationalViewProps) {
  const complete = (message: string) => onToast(message);

  if (view === "categories") {
    return (
      <AdminCollectionManager
        title="Quản lý danh mục"
        description="Tổ chức các nhóm sản phẩm xuất hiện trong bộ lọc và dải danh mục ngoài website."
        singularLabel="danh mục"
        rows={editableRows(database.categories)}
        columns={[
          {
            key: "name",
            label: "Tên danh mục",
            render: (row) => <strong>{String(row.name)}</strong>,
          },
          { key: "slug", label: "Đường dẫn" },
          { key: "description", label: "Mô tả" },
          {
            key: "status",
            label: "Trạng thái",
            render: (row) => <AdminStatus>{String(row.status)}</AdminStatus>,
          },
        ]}
        fields={[
          { key: "name", label: "Tên danh mục", required: true },
          {
            key: "slug",
            label: "Slug",
            required: true,
            helper: "Dùng chữ thường, không dấu và dấu gạch nối.",
          },
          { key: "description", label: "Mô tả", type: "textarea" },
          {
            key: "status",
            label: "Trạng thái",
            type: "select",
            options: statusOptions,
          },
        ]}
        onSave={(record) => {
          upsertRecord(
            "categories",
            { ...record, updatedAt: new Date().toISOString() },
            "Danh mục",
          );
          complete("Đã lưu danh mục.");
        }}
        onDelete={(id) => {
          deleteRecord("categories", id, "Danh mục");
          complete("Đã xóa danh mục.");
        }}
      />
    );
  }

  if (view === "brands") {
    return (
      <AdminCollectionManager
        title="Quản lý thương hiệu"
        description="Cập nhật tên, logo và liên kết của các thương hiệu đối tác."
        singularLabel="thương hiệu"
        rows={editableRows(database.brands)}
        columns={[
          {
            key: "logo",
            label: "Logo",
            render: (row) =>
              row.logo ? (
                <img
                  className="admin-table-thumb"
                  src={String(row.logo)}
                  alt=""
                />
              ) : (
                <span className="admin-table-placeholder">Chưa có</span>
              ),
          },
          {
            key: "name",
            label: "Thương hiệu",
            render: (row) => <strong>{String(row.name)}</strong>,
          },
          { key: "website", label: "Website" },
          {
            key: "status",
            label: "Trạng thái",
            render: (row) => <AdminStatus>{String(row.status)}</AdminStatus>,
          },
        ]}
        fields={[
          { key: "name", label: "Tên thương hiệu", required: true },
          { key: "slug", label: "Slug", required: true },
          { key: "website", label: "Website", type: "text" },
          {
            key: "logo",
            label: "Logo thương hiệu",
            type: "image",
            helper: "Nên dùng PNG nền trong hoặc WEBP.",
          },
          { key: "description", label: "Giới thiệu", type: "textarea" },
          {
            key: "status",
            label: "Trạng thái",
            type: "select",
            options: statusOptions,
          },
        ]}
        onSave={(record) => {
          upsertRecord(
            "brands",
            { ...record, updatedAt: new Date().toISOString() },
            "Thương hiệu",
          );
          complete("Đã lưu thương hiệu.");
        }}
        onDelete={(id) => {
          deleteRecord("brands", id, "Thương hiệu");
          complete("Đã xóa thương hiệu.");
        }}
      />
    );
  }

  if (view === "materials") {
    return (
      <AdminCollectionManager
        title="Thư viện vật liệu"
        description="Quản lý xuất xứ, đặc tính và hình ảnh đại diện cho từng dòng vật liệu."
        singularLabel="vật liệu"
        rows={editableRows(database.materials)}
        columns={[
          {
            key: "image",
            label: "Ảnh",
            render: (row) =>
              row.image ? (
                <img
                  className="admin-table-thumb"
                  src={String(row.image)}
                  alt=""
                />
              ) : (
                <span className="admin-table-placeholder">Chưa có</span>
              ),
          },
          {
            key: "name",
            label: "Vật liệu",
            render: (row) => <strong>{String(row.name)}</strong>,
          },
          { key: "origin", label: "Xuất xứ" },
          { key: "properties", label: "Đặc tính" },
          {
            key: "status",
            label: "Trạng thái",
            render: (row) => <AdminStatus>{String(row.status)}</AdminStatus>,
          },
        ]}
        fields={[
          { key: "name", label: "Tên vật liệu", required: true },
          { key: "slug", label: "Slug", required: true },
          { key: "origin", label: "Xuất xứ" },
          { key: "properties", label: "Đặc tính", type: "textarea" },
          { key: "image", label: "Ảnh vật liệu", type: "image" },
          { key: "description", label: "Mô tả", type: "textarea" },
          {
            key: "status",
            label: "Trạng thái",
            type: "select",
            options: statusOptions,
          },
        ]}
        onSave={(record) => {
          upsertRecord(
            "materials",
            { ...record, updatedAt: new Date().toISOString() },
            "Vật liệu",
          );
          complete("Đã lưu vật liệu.");
        }}
        onDelete={(id) => {
          deleteRecord("materials", id, "Vật liệu");
          complete("Đã xóa vật liệu.");
        }}
      />
    );
  }

  if (view === "suppliers") {
    return (
      <AdminCollectionManager
        title="Quản lý nhà cung cấp"
        description="Lưu đầu mối liên hệ và nguồn cung phục vụ hoạt động mua hàng."
        singularLabel="nhà cung cấp"
        rows={editableRows(database.suppliers)}
        columns={[
          {
            key: "name",
            label: "Nhà cung cấp",
            render: (row) => <strong>{String(row.name)}</strong>,
          },
          { key: "contactName", label: "Đầu mối" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Điện thoại" },
          {
            key: "status",
            label: "Trạng thái",
            render: (row) => <AdminStatus>{String(row.status)}</AdminStatus>,
          },
        ]}
        fields={[
          { key: "name", label: "Tên nhà cung cấp", required: true },
          { key: "slug", label: "Slug", required: true },
          { key: "contactName", label: "Người liên hệ" },
          { key: "email", label: "Email", type: "email" },
          { key: "phone", label: "Điện thoại", type: "tel" },
          { key: "address", label: "Địa chỉ", type: "textarea" },
          { key: "description", label: "Ghi chú", type: "textarea" },
          {
            key: "status",
            label: "Trạng thái",
            type: "select",
            options: statusOptions,
          },
        ]}
        onSave={(record) => {
          upsertRecord(
            "suppliers",
            { ...record, updatedAt: new Date().toISOString() },
            "Nhà cung cấp",
          );
          complete("Đã lưu nhà cung cấp.");
        }}
        onDelete={(id) => {
          deleteRecord("suppliers", id, "Nhà cung cấp");
          complete("Đã xóa nhà cung cấp.");
        }}
      />
    );
  }

  if (view === "returns") {
    return (
      <AdminCollectionManager
        title="Trả hàng và hoàn tiền"
        description="Theo dõi yêu cầu được tạo từ chi tiết đơn hàng. Trạng thái được cập nhật trong đơn để bảo đảm đồng bộ thanh toán."
        singularLabel="yêu cầu hoàn tiền"
        rows={editableRows(database.returns)}
        columns={[
          {
            key: "id",
            label: "Mã yêu cầu",
            render: (row) => <strong>{String(row.id)}</strong>,
          },
          { key: "orderId", label: "Đơn hàng" },
          { key: "customer", label: "Khách hàng" },
          {
            key: "amount",
            label: "Giá trị",
            render: (row) => (
              <strong className="admin-table__price">
                {formatCurrency(Number(row.amount))}
              </strong>
            ),
          },
          {
            key: "status",
            label: "Trạng thái",
            render: (row) => <AdminStatus>{String(row.status)}</AdminStatus>,
          },
        ]}
        fields={[
          { key: "orderId", label: "Mã đơn hàng", required: true },
          { key: "customer", label: "Khách hàng", required: true },
          { key: "reason", label: "Lý do", type: "textarea", required: true },
          {
            key: "amount",
            label: "Số tiền hoàn",
            type: "number",
            required: true,
          },
          {
            key: "status",
            label: "Trạng thái",
            type: "select",
            options: [
              "Chờ duyệt",
              "Đã duyệt",
              "Đang hoàn tiền",
              "Hoàn tất",
              "Từ chối",
            ].map((value) => ({ value, label: value })),
          },
        ]}
        onSave={() => undefined}
        onDelete={() => undefined}
        readOnly
      />
    );
  }

  if (view === "customers") {
    return <AdminCustomersView onToast={onToast} />;
  }

  if (view === "customer-groups") {
    return (
      <AdminCollectionManager
        title="Nhóm khách hàng"
        description="Thiết lập mức chiết khấu và quyền lợi theo từng nhóm thành viên."
        singularLabel="nhóm khách hàng"
        rows={editableRows(database.customerGroups)}
        columns={[
          {
            key: "name",
            label: "Tên nhóm",
            render: (row) => <strong>{String(row.name)}</strong>,
          },
          { key: "memberCount", label: "Thành viên" },
          {
            key: "discountPercent",
            label: "Chiết khấu",
            render: (row) => `${String(row.discountPercent)}%`,
          },
          {
            key: "status",
            label: "Trạng thái",
            render: (row) => <AdminStatus>{String(row.status)}</AdminStatus>,
          },
        ]}
        fields={[
          { key: "name", label: "Tên nhóm", required: true },
          { key: "slug", label: "Slug", required: true },
          { key: "description", label: "Quyền lợi", type: "textarea" },
          {
            key: "discountPercent",
            label: "Chiết khấu phần trăm",
            type: "number",
          },
          { key: "memberCount", label: "Số thành viên", type: "number" },
          {
            key: "status",
            label: "Trạng thái",
            type: "select",
            options: statusOptions,
          },
        ]}
        onSave={(record) => {
          upsertRecord(
            "customerGroups",
            { ...record, updatedAt: new Date().toISOString() },
            "Nhóm khách hàng",
          );
          complete("Đã lưu nhóm khách hàng.");
        }}
        onDelete={(id) => {
          deleteRecord("customerGroups", id, "Nhóm khách hàng");
          complete("Đã xóa nhóm khách hàng.");
        }}
      />
    );
  }

  if (view === "gifts") {
    return (
      <AdminCollectionManager
        title="Quà tặng và ưu đãi"
        description="Tạo mã giảm giá, điều kiện áp dụng và thời hạn sử dụng."
        singularLabel="ưu đãi"
        rows={editableRows(database.gifts)}
        columns={[
          {
            key: "name",
            label: "Chương trình",
            render: (row) => <strong>{String(row.name)}</strong>,
          },
          { key: "code", label: "Mã" },
          {
            key: "value",
            label: "Giá trị",
            render: (row) =>
              row.type === "PERCENT"
                ? `${String(row.value)}%`
                : formatCurrency(Number(row.value)),
          },
          { key: "expiresAt", label: "Hết hạn" },
          {
            key: "status",
            label: "Trạng thái",
            render: (row) => <AdminStatus>{String(row.status)}</AdminStatus>,
          },
        ]}
        fields={[
          { key: "name", label: "Tên chương trình", required: true },
          { key: "code", label: "Mã ưu đãi", required: true },
          {
            key: "type",
            label: "Loại ưu đãi",
            type: "select",
            options: [
              { value: "PERCENT", label: "Giảm theo phần trăm" },
              { value: "FIXED", label: "Giảm số tiền cố định" },
              { value: "GIFT", label: "Quà tặng" },
            ],
          },
          { key: "value", label: "Giá trị", type: "number" },
          { key: "minimumOrder", label: "Đơn tối thiểu", type: "number" },
          {
            key: "expiresAt",
            label: "Ngày hết hạn",
            type: "text",
            placeholder: "YYYY-MM-DD",
          },
          {
            key: "status",
            label: "Trạng thái",
            type: "select",
            options: statusOptions,
          },
        ]}
        onSave={(record) => {
          upsertRecord("gifts", record, "Ưu đãi");
          complete("Đã lưu chương trình ưu đãi.");
        }}
        onDelete={(id) => {
          deleteRecord("gifts", id, "Ưu đãi");
          complete("Đã xóa ưu đãi.");
        }}
      />
    );
  }

  if (view === "banners") {
    return (
      <AdminCollectionManager
        title="Quản lý banner"
        description="Điều khiển hình ảnh, thông điệp và liên kết ở các vùng hero."
        singularLabel="banner"
        rows={editableRows(database.banners)}
        columns={[
          {
            key: "image",
            label: "Ảnh",
            render: (row) =>
              row.image ? (
                <img
                  className="admin-table-thumb admin-table-thumb--wide"
                  src={String(row.image)}
                  alt=""
                />
              ) : (
                <span className="admin-table-placeholder">Chưa tải ảnh</span>
              ),
          },
          {
            key: "title",
            label: "Tiêu đề",
            render: (row) => <strong>{String(row.title)}</strong>,
          },
          { key: "placement", label: "Vị trí" },
          { key: "link", label: "Liên kết" },
          {
            key: "status",
            label: "Trạng thái",
            render: (row) => <AdminStatus>{String(row.status)}</AdminStatus>,
          },
        ]}
        fields={[
          { key: "title", label: "Tiêu đề tiếng Việt", required: true },
          { key: "titleEn", label: "Tiêu đề tiếng Anh" },
          {
            key: "placement",
            label: "Vị trí",
            type: "select",
            options: [
              { value: "HOME_HERO", label: "Trang chủ" },
              { value: "PRODUCT_HERO", label: "Trang sản phẩm" },
              { value: "NEWS_HERO", label: "Trang tin tức" },
            ],
          },
          { key: "image", label: "Ảnh banner", type: "image", required: true },
          { key: "link", label: "Đường dẫn khi bấm", placeholder: "/products" },
          {
            key: "status",
            label: "Trạng thái",
            type: "select",
            options: statusOptions,
          },
        ]}
        onSave={(record) => {
          upsertRecord(
            "banners",
            { ...record, updatedAt: new Date().toISOString() },
            "Banner",
          );
          complete("Đã lưu banner.");
        }}
        onDelete={(id) => {
          deleteRecord("banners", id, "Banner");
          complete("Đã xóa banner.");
        }}
      />
    );
  }

  if (view === "inquiries") {
    return <AdminInquiriesView onToast={onToast} />;
  }

  if (view === "showrooms") {
    return <AdminShowroomsView onToast={onToast} />;
  }

  if (view === "settings")
    return <AdminSettingsView settings={database.settings} onToast={onToast} />;

  if (view === "users" || view === "roles")
    return <AdminAccessManagementView view={view} onToast={onToast} />;

  if (view === "logs") {
    return (
      <AdminCollectionManager
        title="Nhật ký hoạt động"
        description="Dòng thời gian thay đổi dữ liệu và thao tác trong khu vực quản trị."
        singularLabel="nhật ký"
        rows={editableRows(database.activities)}
        columns={[
          {
            key: "createdAt",
            label: "Thời gian",
            render: (row) => formatDate(String(row.createdAt), true),
          },
          {
            key: "actor",
            label: "Người thao tác",
            render: (row) => <strong>{String(row.actor)}</strong>,
          },
          { key: "module", label: "Phân hệ" },
          { key: "action", label: "Hoạt động" },
        ]}
        fields={[]}
        onSave={() => undefined}
        onDelete={() => undefined}
        searchPlaceholder="Tìm theo người dùng, phân hệ hoặc hoạt động..."
        readOnly
      />
    );
  }

  return null;
}

function AdminCustomersView({
  onToast,
}: {
  onToast: (message: string) => void;
}) {
  const [customers, setCustomers] = useState<ManagedCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getManagedCustomers();
      setCustomers(result.customers);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể tải danh sách khách hàng.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void reload();
    }, 0);
    return () => window.clearTimeout(initialLoad);
  }, [reload]);

  if (isLoading) {
    return (
      <div
        className="admin-access-skeleton"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span className="sr-only">Đang tải khách hàng</span>
        <AdminPageHeading
          title="Quản lý khách hàng"
          description="Khách hàng đăng ký qua Google trên website sẽ hiển thị tại đây."
          action={<KhungXuong className="admin-access-skeleton__action" />}
        />
        <AdminPanel className="admin-toolbar">
          <KhungXuong className="admin-access-skeleton__search" />
        </AdminPanel>
        <AdminPanel className="admin-table-panel">
          <AdminBangKhungXuong
            columns={7}
            rows={6}
            label="Đang tải khách hàng"
          />
        </AdminPanel>
      </div>
    );
  }

  if (error) {
    return (
      <AdminPanel title="Quản lý khách hàng">
        <p className="admin-form-error">{error}</p>
        <button
          className="admin-button"
          type="button"
          onClick={() => void reload()}
        >
          Thử lại
        </button>
      </AdminPanel>
    );
  }

  const rows = customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone ?? "",
    orderCount: customer.orderCount,
    totalSpent: customer.totalSpent,
    status: customer.isActive ? "ACTIVE" : "LOCKED",
  })) as AdminEditableRecord[];

  return (
    <AdminCollectionManager
      title="Quản lý khách hàng"
      description="Hiển thị các tài khoản khách hàng đã đăng ký qua Google trên website."
      singularLabel="khách hàng"
      rows={rows}
      allowCreate={false}
      allowDelete={false}
      headingAction={
        <div className="admin-customer-total">
          <span>Tổng khách hàng</span>
          <strong>{customers.length}</strong>
        </div>
      }
      columns={[
        {
          key: "name",
          label: "Khách hàng",
          render: (row) => <strong>{String(row.name)}</strong>,
        },
        { key: "email", label: "Email" },
        {
          key: "phone",
          label: "Điện thoại",
          render: (row) => String(row.phone || "—"),
        },
        {
          key: "orderCount",
          label: "Đơn hàng",
          render: (row) => `${String(row.orderCount)} đơn`,
        },
        {
          key: "totalSpent",
          label: "Tổng chi tiêu",
          render: (row) => (
            <strong className="admin-table__price">
              {formatCurrency(Number(row.totalSpent))}
            </strong>
          ),
        },
        {
          key: "status",
          label: "Trạng thái",
          render: (row) => <AdminStatus>{String(row.status)}</AdminStatus>,
        },
      ]}
      fields={[
        { key: "name", label: "Họ và tên", required: true },
        { key: "phone", label: "Điện thoại", type: "tel" },
        {
          key: "status",
          label: "Trạng thái",
          type: "select",
          options: [
            { value: "ACTIVE", label: "Đang hoạt động" },
            { value: "LOCKED", label: "Đã khóa" },
          ],
        },
      ]}
      onSave={async (record) => {
        await updateManagedCustomer(record.id, {
          fullName: String(record.name),
          phone: String(record.phone ?? ""),
          isActive: record.status === "ACTIVE",
        });
        await reload();
        onToast("Đã cập nhật khách hàng.");
      }}
      onDelete={() => undefined}
    />
  );
}

const inquiryStatusOptions: Array<{ value: InquiryStatus; label: string }> = [
  { value: "NEW", label: "Mới" },
  { value: "IN_PROGRESS", label: "Đang xử lý" },
  { value: "RESPONDED", label: "Đã phản hồi" },
  { value: "CLOSED", label: "Đã đóng" },
];

function getInquiryStatusLabel(status: InquiryStatus) {
  return (
    inquiryStatusOptions.find((option) => option.value === status)?.label ??
    status
  );
}

function getInquirySourceLabel(source: ContactInquiry["source"]) {
  const labels: Record<ContactInquiry["source"], string> = {
    CONTACT: "Form liên hệ",
    SHOWROOM: "Đặt lịch showroom",
    QUOTE: "Yêu cầu báo giá",
  };
  return labels[source];
}

function AdminInquiriesView({
  onToast,
}: {
  onToast: (message: string) => void;
}) {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getManagedInquiries();
      setInquiries(result.inquiries);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể tải yêu cầu liên hệ.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void reload();
    }, 0);
    return () => window.clearTimeout(initialLoad);
  }, [reload]);

  if (isLoading) {
    return (
      <div
        className="admin-access-skeleton"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span className="sr-only">Đang tải yêu cầu liên hệ</span>
        <AdminPageHeading
          title="Liên hệ và yêu cầu tư vấn"
          description="Tập trung các yêu cầu được gửi từ form liên hệ trên website."
          action={<KhungXuong className="admin-access-skeleton__action" />}
        />
        <AdminPanel className="admin-toolbar">
          <KhungXuong className="admin-access-skeleton__search" />
        </AdminPanel>
        <AdminPanel className="admin-table-panel">
          <AdminBangKhungXuong
            columns={6}
            rows={5}
            label="Đang tải yêu cầu liên hệ"
          />
        </AdminPanel>
      </div>
    );
  }

  if (error) {
    return (
      <AdminPanel title="Liên hệ và yêu cầu tư vấn">
        <p className="admin-form-error">{error}</p>
        <button
          className="admin-button"
          type="button"
          onClick={() => void reload()}
        >
          Thử lại
        </button>
      </AdminPanel>
    );
  }

  const rows = inquiries.map((inquiry) => ({
    ...inquiry,
  })) as AdminEditableRecord[];
  return (
    <AdminCollectionManager
      title="Liên hệ và yêu cầu tư vấn"
      description="Các yêu cầu được gửi từ form liên hệ trên website sẽ xuất hiện tại đây."
      singularLabel="yêu cầu liên hệ"
      rows={rows}
      allowCreate={false}
      deleteDescription="Yêu cầu liên hệ này sẽ bị xóa vĩnh viễn. Không thể hoàn tác."
      columns={[
        {
          key: "name",
          label: "Khách hàng",
          render: (row) => <strong>{String(row.name)}</strong>,
        },
        { key: "subject", label: "Chủ đề" },
        { key: "phone", label: "Điện thoại" },
        {
          key: "source",
          label: "Nguồn",
          render: (row) =>
            getInquirySourceLabel(
              String(row.source) as ContactInquiry["source"],
            ),
        },
        {
          key: "status",
          label: "Trạng thái",
          render: (row) => (
            <AdminStatus>
              {getInquiryStatusLabel(String(row.status) as InquiryStatus)}
            </AdminStatus>
          ),
        },
      ]}
      fields={[
        { key: "name", label: "Khách hàng", readOnly: true },
        { key: "email", label: "Email", type: "email", readOnly: true },
        { key: "phone", label: "Điện thoại", type: "tel", readOnly: true },
        { key: "subject", label: "Chủ đề", readOnly: true },
        { key: "message", label: "Nội dung", type: "textarea", readOnly: true },
        {
          key: "status",
          label: "Trạng thái",
          type: "select",
          options: inquiryStatusOptions,
        },
      ]}
      onSave={async (record) => {
        await updateManagedInquiry(
          record.id,
          String(record.status) as InquiryStatus,
        );
        await reload();
        onToast("Đã cập nhật trạng thái yêu cầu liên hệ.");
      }}
      onDelete={async (id) => {
        await deleteManagedInquiry(id);
        await reload();
        onToast("Đã xóa yêu cầu liên hệ.");
      }}
    />
  );
}

function AdminAccessManagementView({
  view,
  onToast,
}: {
  view: "users" | "roles";
  onToast: (message: string) => void;
}) {
  const { adminUser } = useAdminAuth();
  const [users, setUsers] = useState<ManagedAdminUser[]>([]);
  const [roles, setRoles] = useState<ManagedRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRoleCreatorOpen, setIsRoleCreatorOpen] = useState(false);
  const roleSelectionRef = useRef<((roleCode: string) => void) | null>(null);
  const canCreateRoles = Boolean(
    adminUser &&
    hasPermission(adminUser.permissions, "role.manage") &&
    hasPermission(adminUser.permissions, "permission.manage"),
  );

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextRoles, nextUsers] = await Promise.all([
        getManagedRoles(),
        view === "users" ? getManagedUsers() : Promise.resolve(null),
      ]);
      setRoles(nextRoles.roles);
      if (nextUsers) setUsers(nextUsers.users);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể tải dữ liệu phân quyền.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [view]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void reload();
    }, 0);
    return () => window.clearTimeout(initialLoad);
  }, [reload]);

  if (isLoading) return <AdminAccessManagementSkeleton view={view} />;
  if (error)
    return (
      <AdminPanel
        title={
          view === "users" ? "Nhân viên quản trị" : "Vai trò và phân quyền"
        }
      >
        <p className="admin-form-error">{error}</p>
        <button
          className="admin-button"
          type="button"
          onClick={() => void reload()}
        >
          Thử lại
        </button>
      </AdminPanel>
    );

  if (view === "users") {
    const employeeRoles = roles.filter((role) => role.code !== "CUSTOMER");
    const openRoleCreator = (setRoleCode: (roleCode: string) => void) => {
      roleSelectionRef.current = setRoleCode;
      setIsRoleCreatorOpen(true);
    };
    const closeRoleCreator = () => {
      roleSelectionRef.current = null;
      setIsRoleCreatorOpen(false);
    };
    const handleRoleCreated = (role: ManagedRole) => {
      setRoles((current) =>
        [...current.filter((item) => item.id !== role.id), role].sort(
          (first, second) => first.name.localeCompare(second.name, "vi"),
        ),
      );
      roleSelectionRef.current?.(role.code);
      closeRoleCreator();
      onToast("Đã tạo vai trò mới và chọn cho nhân viên.");
    };
    const rows = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      roleCode: user.roleCode,
      lastLogin: user.lastLoginAt ?? "",
      status: user.isActive ? "ACTIVE" : "LOCKED",
    })) as AdminEditableRecord[];
    return (
      <>
        <AdminCollectionManager
          title="Nhân viên quản trị"
          description="Tạo và quản lý tài khoản nội bộ cho nhân viên được phép truy cập khu vực quản trị."
          singularLabel="nhân viên"
          addLabel="Thêm nhân viên"
          deleteDescription="Tài khoản này cùng toàn bộ phiên đăng nhập sẽ bị xóa vĩnh viễn. Không thể hoàn tác."
          rows={rows}
          columns={[
            {
              key: "name",
              label: "Nhân viên",
              render: (row) => <strong>{String(row.name)}</strong>,
            },
            { key: "email", label: "Email" },
            {
              key: "roleCode",
              label: "Vai trò",
              render: (row) =>
                employeeRoles.find((role) => role.code === row.roleCode)
                  ?.name ?? String(row.roleCode),
            },
            {
              key: "lastLogin",
              label: "Đăng nhập gần nhất",
              render: (row) => formatDate(String(row.lastLogin)),
            },
            {
              key: "status",
              label: "Trạng thái",
              render: (row) => <AdminStatus>{String(row.status)}</AdminStatus>,
            },
          ]}
          fields={[
            { key: "name", label: "Họ và tên", required: true },
            {
              key: "email",
              label: "Email",
              required: true,
              suffix: "@cmid.com.vn",
            },
            {
              key: "password",
              label: "Mật khẩu",
              type: "password",
              requiredOnCreate: true,
              helper: "Phải có chữ hoa, chữ thường và ký tự đặc biệt. Để trống khi không đổi mật khẩu.",
            },
            {
              key: "roleCode",
              label: "Vai trò",
              type: "select",
              options: employeeRoles.map((role) => ({
                value: role.code,
                label: role.name,
              })),
              required: true,
              action: canCreateRoles
                ? { label: "Tạo vai trò mới", onClick: openRoleCreator }
                : undefined,
            },
            {
              key: "status",
              label: "Trạng thái",
              type: "select",
              options: [
                { value: "ACTIVE", label: "Đang hoạt động" },
                { value: "LOCKED", label: "Đã khóa" },
              ],
            },
          ]}
          onSave={async (record) => {
            const isExisting = users.some((user) => user.id === record.id);
            const username = String(record.email ?? "").split("@")[0];
            const isActive = record.status === "ACTIVE";
            if (isExisting) {
              await updateManagedUser(record.id, {
                fullName: String(record.name),
                roleCode: String(record.roleCode),
                isActive,
              });
              if (String(record.password ?? ""))
                await resetManagedUserPassword(
                  record.id,
                  String(record.password),
                );
            } else {
              await createManagedUser({
                fullName: String(record.name),
                username,
                password: String(record.password ?? ""),
                roleCode: String(record.roleCode),
                isActive,
              });
            }
            await reload();
            onToast(
              isExisting
                ? "Đã cập nhật nhân viên."
                : "Đã tạo tài khoản nhân viên.",
            );
          }}
          onDelete={async (id) => {
            await deleteManagedUser(id);
            await reload();
            onToast("Đã xóa tài khoản nhân viên.");
          }}
        />
        {isRoleCreatorOpen ? (
          <AdminNewRoleDialog
            onClose={closeRoleCreator}
            onCreated={handleRoleCreated}
          />
        ) : null}
      </>
    );
  }

  const rows = roles.map((role) => ({ ...role })) as AdminEditableRecord[];
  return (
    <AdminCollectionManager
      title="Vai trò và phân quyền"
      description="Nhóm quyền được lưu trên Supabase và áp dụng cho cả menu lẫn API."
      singularLabel="vai trò"
      rows={rows}
      tableClassName="admin-table--roles"
      columns={[
        {
          key: "name",
          label: "Vai trò",
          render: (row) => <strong>{String(row.name)}</strong>,
        },
        { key: "description", label: "Mô tả" },
        {
          key: "permissions",
          label: "Quyền đã cấp",
          render: (row) => {
            const permissions = Array.isArray(row.permissions)
              ? row.permissions.map(String)
              : [];
            const isFullAccess = permissions.includes("*");
            const label = isFullAccess
              ? "Toàn quyền hệ thống"
              : `${permissions.length} chức năng`;
            return (
              <span
                className={`admin-permission-summary${isFullAccess ? " is-full-access" : ""}`}
                title={permissions.join(", ")}
              >
                {label}
              </span>
            );
          },
        },
        { key: "userCount", label: "Người dùng", align: "center" },
      ]}
      fields={[
        { key: "name", label: "Tên vai trò", required: true },
        { key: "description", label: "Mô tả", type: "textarea" },
        {
          key: "permissions",
          label: "Chức năng được phép",
          type: "permissions",
          permissionGroups: rolePermissionGroups,
        },
      ]}
      onSave={async (record) => {
        const isExisting = roles.some((role) => role.id === record.id);
        const permissions = Array.isArray(record.permissions)
          ? record.permissions.map(String)
          : [];
        if (isExisting) {
          await updateManagedRole(record.id, {
            name: String(record.name),
            description: String(record.description ?? ""),
            permissionCodes: permissions,
          });
        } else {
          await createManagedRole({
            code: createRoleCode(String(record.name)),
            name: String(record.name),
            description: String(record.description ?? ""),
            permissionCodes: permissions,
          });
        }
        await reload();
        onToast(isExisting ? "Đã cập nhật vai trò." : "Đã tạo vai trò mới.");
      }}
      onDelete={async (id) => {
        await deleteManagedRole(id);
        await reload();
        onToast("Đã xóa vai trò.");
      }}
    />
  );
}

function AdminNewRoleDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (role: ManagedRole) => void;
}) {
  const { t, language } = useAdminCopy();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissionCodes, setPermissionCodes] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function togglePermission(code: string, checked: boolean) {
    setPermissionCodes((current) => {
      if (checked) return current.includes(code) ? current : [...current, code];
      return current.filter((item) => item !== code);
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const roleName = name.trim();
    if (roleName.length < 2) {
      setError("Tên vai trò cần có ít nhất 2 ký tự.");
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      const { role } = await createManagedRole({
        code: createRoleCode(roleName),
        name: roleName,
        description: description.trim(),
        permissionCodes,
      });
      onCreated(role);
    } catch (requestError) {
      setError(
        getLocalizedAdminError(
          requestError,
          language,
          t("Không thể tạo vai trò mới."),
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminModalPortal>
      <div
        className="admin-dialog-backdrop admin-dialog-backdrop--nested"
        role="presentation"
        onMouseDown={() => {
          if (!isSaving) onClose();
        }}
      >
        <section
        className="admin-dialog admin-dialog--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-new-role-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <h2 id="admin-new-role-title">{t("Tạo vai trò mới")}</h2>
            <p>
              {t(
                "Thiết lập tên, mô tả và các chức năng mà vai trò này được phép sử dụng.",
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label={t("Đóng")}
          >
            <X size={19} />
          </button>
        </header>
        <form onSubmit={(event) => void submit(event)}>
          <div className="admin-dialog__body">
            {error ? (
              <p className="admin-form-error" role="alert">
                {t(error)}
              </p>
            ) : null}
            <label className="admin-field">
              <span>
                {t("Tên vai trò")}
                <b>*</b>
              </span>
              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                required
                disabled={isSaving}
                placeholder={t("Ví dụ: Quản lý showroom")}
              />
              <small>
                {t(
                  "Mã vai trò được tạo tự động từ tên và không thể thay đổi sau khi lưu.",
                )}
              </small>
            </label>
            <label className="admin-field">
              <span>{t("Mô tả")}</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={500}
                disabled={isSaving}
                placeholder={t("Mô tả phạm vi công việc của vai trò này")}
              />
            </label>
            <section className="admin-field admin-field--permissions">
              <span>{t("Chức năng được phép")}</span>
              <div className="admin-permission-groups">
                {rolePermissionGroups.map((group) => (
                  <fieldset key={group.label} disabled={isSaving}>
                    <legend>{t(group.label)}</legend>
                    <div>
                      {group.permissions.map((permission) => (
                        <label
                          className="admin-checkbox"
                          key={permission.value}
                        >
                          <input
                            type="checkbox"
                            value={permission.value}
                            checked={permissionCodes.includes(permission.value)}
                            onChange={(event) =>
                              togglePermission(
                                permission.value,
                                event.target.checked,
                              )
                            }
                          />
                          <span>{t(permission.label)}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
            </section>
          </div>
          <footer>
            <button
              className="admin-button"
              type="button"
              disabled={isSaving}
              onClick={onClose}
            >
              {t("Hủy")}
            </button>
            <button
              className="admin-button admin-button--primary"
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? t("Đang tạo...") : t("Tạo vai trò")}
            </button>
          </footer>
        </form>
        </section>
      </div>
    </AdminModalPortal>
  );
}

function AdminAccessManagementSkeleton({ view }: { view: "users" | "roles" }) {
  const isUsersView = view === "users";
  const title = isUsersView ? "Nhân viên quản trị" : "Vai trò và phân quyền";
  const description = isUsersView
    ? "Tài khoản nội bộ được lưu trên Supabase và xác thực bằng mật khẩu riêng."
    : "Nhóm quyền được lưu trên Supabase và áp dụng cho cả menu lẫn API.";

  return (
    <div
      className="admin-access-skeleton"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Đang tải dữ liệu phân quyền</span>
      <AdminPageHeading
        title={title}
        description={description}
        action={<KhungXuong className="admin-access-skeleton__action" />}
      />
      <AdminPanel className="admin-toolbar">
        <KhungXuong className="admin-access-skeleton__search" />
      </AdminPanel>
      <AdminPanel className="admin-table-panel">
        <AdminBangKhungXuong
          columns={isUsersView ? 6 : 5}
          rows={6}
          label="Đang tải dữ liệu phân quyền"
        />
      </AdminPanel>
    </div>
  );
}

function createRoleCode(name: string) {
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const slug = normalized
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `CUSTOM_${slug || Date.now().toString()}`.slice(0, 64);
}

type AdminSettingsTab =
  | "business"
  | "commerce"
  | "notifications"
  | "security"
  | "maintenance"
  | "language";
type SaveableSettingsTab = Exclude<AdminSettingsTab, "language" | "security">;

interface AdminLanguageOption {
  code: AppLanguage;
  locale: string;
  label: string;
  nativeLabel: string;
  searchTerms: string;
}

const adminSettingsTabs: Array<{
  id: AdminSettingsTab;
  label: string;
  panelTitle: string;
}> = [
  {
    id: "business",
    label: "Thông tin doanh nghiệp",
    panelTitle: "Thông tin cửa hàng và showroom",
  },
  {
    id: "commerce",
    label: "Bán hàng và vận chuyển",
    panelTitle: "Chính sách thương mại",
  },
  {
    id: "notifications",
    label: "Email thông báo",
    panelTitle: "Thông báo vận hành",
  },
  {
    id: "maintenance",
    label: "Bảo trì website",
    panelTitle: "Chế độ bảo trì website",
  },
  {
    id: "language",
    label: "Ngôn ngữ hệ thống",
    panelTitle: "Ngôn ngữ hệ thống quản trị",
  },
  {
    id: "security",
    label: "Bảo mật và dữ liệu",
    panelTitle: "Trạng thái kết nối",
  },
];

const adminSettingsSaveActions: Record<
  SaveableSettingsTab,
  {
    fields: Array<keyof AdminSettings>;
    label: string;
    activity: string;
    toast: string;
  }
> = {
  business: {
    fields: [
      "businessName",
      "email",
      "phone",
      "address",
      "weekdayHours",
      "weekendHours",
    ],
    label: "Lưu thông tin doanh nghiệp",
    activity: "Cập nhật thông tin doanh nghiệp",
    toast: "Đã lưu thông tin doanh nghiệp.",
  },
  commerce: {
    fields: [
      "freeShippingThreshold",
      "defaultVatPercent",
      "paymentQrTimeoutSeconds",
    ],
    label: "Lưu chính sách thương mại",
    activity: "Cập nhật chính sách thương mại",
    toast: "Đã lưu chính sách thương mại.",
  },
  notifications: {
    fields: ["orderNotificationEmail"],
    label: "Lưu email thông báo",
    activity: "Cập nhật email thông báo",
    toast: "Đã lưu email thông báo.",
  },
  maintenance: {
    fields: ["maintenanceMode"],
    label: "Lưu chế độ bảo trì",
    activity: "Cập nhật chế độ bảo trì website",
    toast: "Đã lưu chế độ bảo trì website.",
  },
};

const adminLanguageOptions: AdminLanguageOption[] = [
  {
    code: "vi",
    locale: "vi-VN",
    label: "Tiếng Việt",
    nativeLabel: "Vietnamese",
    searchTerms: "viet nam vietnam vi tieng viet",
  },
  {
    code: "en",
    locale: "en-GB",
    label: "Tiếng Anh",
    nativeLabel: "English",
    searchTerms: "english anh en united kingdom quoc te",
  },
];

function normalizeAdminSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("vi");
}

function AdminShowroomsView({ onToast }: { onToast: (message: string) => void }) {
  const [showrooms, setShowrooms] = useState<Showroom[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true
    void getAdminShowrooms()
      .then((records) => {
        if (isCurrent) setShowrooms(records)
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setLoadError(error instanceof Error ? error.message : 'Không thể tải showroom từ máy chủ.')
        }
      })
    return () => { isCurrent = false }
  }, [])

  async function save(record: AdminEditableRecord) {
    const saved = await saveShowroom({
      ...(showrooms.some((showroom) => showroom.id === String(record.id))
        ? { id: String(record.id) }
        : {}),
      name: String(record.name ?? ''),
      address: String(record.address ?? ''),
      phone: String(record.phone ?? ''),
      email: String(record.email ?? ''),
      hours: String(record.hours ?? ''),
      mapUrl: String(record.mapUrl ?? ''),
      image: String(record.image ?? ''),
      status: record.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    })
    setShowrooms((current) => [saved, ...current.filter((showroom) => showroom.id !== saved.id)])
    onToast('Đã lưu showroom. Thay đổi đã áp dụng trên trang Liên hệ.')
  }

  async function remove(id: string) {
    await deleteShowroom(id)
    setShowrooms((current) => current.filter((showroom) => showroom.id !== id))
    onToast('Đã xóa showroom.')
  }

  return (
    <>
      {loadError ? <p className="admin-form-error" role="alert">{loadError}</p> : null}
      <AdminCollectionManager
        title="Hệ thống showroom"
        description="Dữ liệu được lưu trên Supabase và hiển thị tại trang Liên hệ."
        singularLabel="showroom"
        rows={editableRows(showrooms)}
        columns={[
          {
            key: "image",
            label: "Ảnh",
            render: (row) => row.image ? (
              <img className="admin-table-thumb" src={String(row.image)} alt="" />
            ) : <span className="admin-table-placeholder">Chưa có</span>,
          },
          { key: "name", label: "Showroom", render: (row) => <strong>{String(row.name)}</strong> },
          { key: "address", label: "Địa chỉ" },
          { key: "phone", label: "Điện thoại" },
          { key: "status", label: "Trạng thái", render: (row) => <AdminStatus>{String(row.status)}</AdminStatus> },
        ]}
        fields={[
          { key: "name", label: "Tên showroom", required: true },
          { key: "address", label: "Địa chỉ", type: "textarea", required: true },
          { key: "phone", label: "Điện thoại", type: "tel" },
          { key: "email", label: "Email", type: "email" },
          { key: "hours", label: "Giờ mở cửa" },
          { key: "mapUrl", label: "Liên kết bản đồ" },
          { key: "image", label: "Ảnh showroom", type: "image" },
          { key: "status", label: "Trạng thái", type: "select", options: statusOptions },
        ]}
        onSave={save}
        onDelete={remove}
      />
    </>
  )
}

type AdminSettingsForm = AdminSiteSettings & { adminLanguage: AppLanguage }

function toAdminSettingsForm(
  settings: AdminSiteSettings,
  adminLanguage: AppLanguage = 'vi',
): AdminSettingsForm {
  return { ...settings, adminLanguage }
}

function AdminSettingsView({
  settings,
  onToast,
}: {
  settings: AdminSettings;
  onToast: (message: string) => void;
}) {
  const { t } = useAdminCopy();
  const [form, setForm] = useState<AdminSettingsForm>(() =>
    toAdminSettingsForm({ ...defaultSiteSettings, ...settings }),
  );
  const [tab, setTab] = useState<AdminSettingsTab>("business");
  const [languageQuery, setLanguageQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>(
    settings.adminLanguage,
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isCurrent = true
    void getAdminSiteSettings()
      .then((serverSettings) => {
        if (isCurrent) {
          setForm((current) => toAdminSettingsForm(serverSettings, current.adminLanguage))
        }
      })
      .catch(() => undefined)
    return () => { isCurrent = false }
  }, [settings]);

  const filteredLanguages = useMemo(() => {
    const query = normalizeAdminSearch(languageQuery);
    if (!query) return adminLanguageOptions;
    return adminLanguageOptions.filter((option) =>
      normalizeAdminSearch(
        `${option.label} ${option.nativeLabel} ${option.locale} ${option.searchTerms}`,
      ).includes(query),
    );
  }, [languageQuery]);

  const activeTab =
    adminSettingsTabs.find((item) => item.id === tab) ?? adminSettingsTabs[0];

  function update<K extends keyof AdminSettingsForm>(
    key: K,
    value: AdminSettingsForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveSettingsSection() {
    if (tab === "language" || tab === "security") return;

    const action = adminSettingsSaveActions[tab];
    const sectionSettings = Object.fromEntries(
      action.fields.map((field) => [field, form[field]]),
    ) as SiteSettingsUpdate;

    setIsSaving(true)
    try {
      const saved = await updateSiteSettings(sectionSettings)
      setForm((current) => toAdminSettingsForm(saved, current.adminLanguage))
      onToast(action.toast)
    } catch (error) {
      onToast(error instanceof Error ? error.message : t('Không thể lưu cấu hình. Vui lòng thử lại.'))
    } finally {
      setIsSaving(false)
    }
  }

  function confirmLanguage() {
    const selectedOption = adminLanguageOptions.find(
      (option) => option.code === selectedLanguage,
    );
    setForm((current) => ({ ...current, adminLanguage: selectedLanguage }));
    onToast(
      `Đã chọn ${selectedOption?.label ?? selectedLanguage} cho hệ thống quản trị.`,
    );
  }

  const saveAction =
    tab === "language" || tab === "security"
      ? null
      : adminSettingsSaveActions[tab];

  return (
    <>
      <AdminPageHeading
        title="Cấu hình hệ thống"
        description="Thiết lập thông tin doanh nghiệp, chính sách bán hàng và vận hành admin."
      />
      <div className="admin-settings-layout">
        <AdminPanel title="Nhóm cấu hình">
          <nav className="admin-settings-nav">
            {adminSettingsTabs.map((item) => (
              <button
                className={tab === item.id ? "is-active" : ""}
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
              >
                {t(item.label)}
              </button>
            ))}
          </nav>
        </AdminPanel>
        <AdminPanel title={activeTab.panelTitle}>
          <div className="admin-settings-form">
            {tab === "business" ? (
              <>
                <label className="admin-field">
                  <span>{t("Tên doanh nghiệp")}</span>
                  <input
                    value={form.businessName}
                    onChange={(event) =>
                      update("businessName", event.target.value)
                    }
                  />
                </label>
                <div className="admin-form-grid admin-form-grid--two">
                  <label className="admin-field">
                    <span>{t("Email chính thức")}</span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => update("email", event.target.value)}
                    />
                  </label>
                  <label className="admin-field">
                    <span>{t("Hotline")}</span>
                    <input
                      value={form.phone}
                      onChange={(event) => update("phone", event.target.value)}
                    />
                  </label>
                </div>
                <label className="admin-field">
                  <span>{t("Địa chỉ")}</span>
                  <textarea
                    value={form.address}
                    onChange={(event) => update("address", event.target.value)}
                  />
                </label>
                <div className="admin-form-grid admin-form-grid--two">
                  <label className="admin-field">
                    <span>{t("Giờ ngày thường")}</span>
                    <input
                      value={form.weekdayHours}
                      onChange={(event) =>
                        update("weekdayHours", event.target.value)
                      }
                    />
                  </label>
                  <label className="admin-field">
                    <span>{t("Giờ cuối tuần")}</span>
                    <input
                      value={form.weekendHours}
                      onChange={(event) =>
                        update("weekendHours", event.target.value)
                      }
                    />
                  </label>
                </div>
              </>
            ) : null}
            {tab === "commerce" ? (
              <>
                <label className="admin-field">
                  <span>{t("Ngưỡng miễn phí giao hàng")}</span>
                  <input
                    type="number"
                    value={form.freeShippingThreshold}
                    onChange={(event) =>
                      update(
                        "freeShippingThreshold",
                        Number(event.target.value),
                      )
                    }
                  />
                </label>
                <label className="admin-field">
                  <span>{t("Thuế VAT mặc định (%)")}</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.defaultVatPercent}
                    onChange={(event) =>
                      update("defaultVatPercent", Number(event.target.value))
                    }
                  />
                </label>
                <label className="admin-field">
                  <span>{t("Thời gian hiển thị QR (giây)")}</span>
                  <input
                    type="number"
                    min="30"
                    step="1"
                    value={form.paymentQrTimeoutSeconds}
                    onChange={(event) =>
                      update(
                        "paymentQrTimeoutSeconds",
                        Math.max(30, Number(event.target.value) || 30),
                      )
                    }
                  />
                  <small>
                    {t(
                      "Tối thiểu 30 giây. Khi hết thời gian, QR không còn hiệu lực trong luồng thanh toán.",
                    )}
                  </small>
                </label>
              </>
            ) : null}
            {tab === "notifications" ? (
              <>
                <label className="admin-field">
                  <span>{t("Email nhận thông báo đơn hàng")}</span>
                  <input
                    type="email"
                    value={form.orderNotificationEmail}
                    onChange={(event) =>
                      update("orderNotificationEmail", event.target.value)
                    }
                  />
                </label>
                <div className="admin-settings-note">
                  <CheckCircle size={20} />
                  <p>
                    {t(
                      "Email này sẽ nhận thông báo khi backend gửi sự kiện đơn hàng mới.",
                    )}
                  </p>
                </div>
              </>
            ) : null}
            {tab === "maintenance" ? (
              <>
                <div
                  className={`admin-maintenance-summary${form.maintenanceMode ? " is-enabled" : ""}`}
                >
                  <span>
                    <Wrench size={24} />
                  </span>
                  <div>
                    <strong>
                      {t(
                        form.maintenanceMode
                          ? "Website đang ở chế độ bảo trì"
                          : "Website đang hoạt động bình thường",
                      )}
                    </strong>
                    <p>
                      {t(
                        form.maintenanceMode
                          ? "Khách truy cập sẽ thấy trang thông báo bảo trì. Khu vực admin vẫn hoạt động để bạn có thể tắt chế độ này."
                          : "Khách hàng có thể truy cập sản phẩm, tin tức, giỏ hàng và các trang nội dung như bình thường.",
                      )}
                    </p>
                  </div>
                </div>
                <label className="admin-maintenance-toggle">
                  <input
                    type="checkbox"
                    checked={form.maintenanceMode}
                    onChange={(event) =>
                      update("maintenanceMode", event.target.checked)
                    }
                  />
                  <span>
                    <strong>{t("Bật chế độ bảo trì website")}</strong>
                    <small>
                      {t(
                        "Thay đổi có hiệu lực sau khi bấm Lưu chế độ bảo trì.",
                      )}
                    </small>
                  </span>
                </label>
                <div className="admin-settings-note">
                  <WarningCircle size={20} />
                  <p>
                    {t(
                      "Chế độ bảo trì được lưu trên Supabase và áp dụng cho mọi khách truy cập.",
                    )}
                  </p>
                </div>
              </>
            ) : null}
            {tab === "language" ? (
              <div className="admin-language-settings">
                <div className="admin-language-intro">
                  <span>
                    <GlobeHemisphereWest size={23} />
                  </span>
                  <div>
                    <strong>{t("Chọn ngôn ngữ ưu tiên")}</strong>
                    <p>
                      {t(
                        "Danh sách chỉ gồm những ngôn ngữ đã có bộ nội dung trong hệ thống.",
                      )}
                    </p>
                  </div>
                </div>
                <label className="admin-language-search">
                  <MagnifyingGlass size={18} />
                  <input
                    value={languageQuery}
                    onChange={(event) => setLanguageQuery(event.target.value)}
                    placeholder={t("Tìm theo tên hoặc mã ngôn ngữ...")}
                  />
                </label>
                <div
                  className="admin-language-list"
                  role="radiogroup"
                  aria-label="Danh sách ngôn ngữ quản trị"
                >
                  {filteredLanguages.map((option) => (
                    <label
                      className={`admin-language-option${selectedLanguage === option.code ? " is-selected" : ""}`}
                      key={option.code}
                    >
                      <input
                        type="radio"
                        name="admin-language"
                        value={option.code}
                        checked={selectedLanguage === option.code}
                        onChange={() => setSelectedLanguage(option.code)}
                      />
                      <span className="admin-language-option__code">
                        {option.code.toLocaleUpperCase("vi")}
                      </span>
                      <span className="admin-language-option__name">
                        <strong>{t(option.label)}</strong>
                        <small>
                          {option.nativeLabel}, {option.locale}
                        </small>
                      </span>
                      <span className="admin-language-option__state">
                        {t(
                          form.adminLanguage === option.code
                            ? "Đang sử dụng"
                            : "Có sẵn",
                        )}
                      </span>
                    </label>
                  ))}
                  {filteredLanguages.length === 0 ? (
                    <p className="admin-language-empty">
                      {t("Không tìm thấy ngôn ngữ phù hợp.")}
                    </p>
                  ) : null}
                </div>
                <div className="admin-language-actions">
                  <p>
                    {t(
                      "Nội dung bạn đã nhập sẽ được giữ nguyên và không tự động dịch.",
                    )}
                  </p>
                  <button
                    className="admin-button admin-button--primary"
                    type="button"
                    onClick={confirmLanguage}
                    disabled={selectedLanguage === form.adminLanguage}
                  >
                    {t("Xác nhận thay đổi ngôn ngữ")}
                  </button>
                </div>
              </div>
            ) : null}
            {tab === "security" ? (
              <div className="admin-security-summary">
                <span>
                  <LockKey size={23} />
                </span>
                <div>
                  <strong>
                    {t("Chế độ dữ liệu hiện tại")}:{" "}
                    {t("API quản trị / Supabase")}
                  </strong>
                  <p>
                    {t(
                      "Phiên đăng nhập hiện là bảo vệ giao diện phía trình duyệt. Cần JWT, phân quyền và API backend trước khi dùng trong môi trường thật.",
                    )}
                  </p>
                </div>
              </div>
            ) : null}
            {saveAction ? (
              <div className="admin-settings-section-actions">
                <button
                  className="admin-button admin-button--primary"
                  type="button"
                  onClick={saveSettingsSection}
                  disabled={isSaving}
                >
                  <FloppyDisk size={17} />
                  {t(saveAction.label)}
                </button>
              </div>
            ) : null}
          </div>
        </AdminPanel>
      </div>
    </>
  );
}

function formatDate(value: string, withTime = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "Chưa có";
  return new Intl.DateTimeFormat(
    "vi-VN",
    withTime
      ? { dateStyle: "short", timeStyle: "short" }
      : { dateStyle: "short" },
  ).format(date);
}
