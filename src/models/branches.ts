/*
 * Vai trò: Dữ liệu chi nhánh/showroom CMID tĩnh dùng cho giao diện.
 */
/* Cấu trúc một showroom dùng để hiển thị vị trí và thông tin liên hệ. */
export interface ChiNhanh {
  id: string
  city: string
  district: string
  name: string
  address: string
  phone: string
}

/* Danh sách fallback đang hiển thị; sẽ thay bằng API khi có tồn kho theo showroom. */
export const chiNhanhCmid: ChiNhanh[] = [
  {
    id: 'hcm-quan-1',
    city: 'Hồ Chí Minh',
    district: 'Quận 1',
    name: 'CMID Showroom Quận 1',
    address: '123 Lê Duẩn, Quận 1, TP. Hồ Chí Minh',
    phone: '1800 6868',
  },
  {
    id: 'hcm-phu-nhuan',
    city: 'Hồ Chí Minh',
    district: 'Phú Nhuận',
    name: 'CMID Showroom Phú Nhuận',
    address: '156 Nguyễn Văn Trỗi, Phường 8, Phú Nhuận, TP. Hồ Chí Minh',
    phone: '1800 6868',
  },
  {
    id: 'danang-hai-chau',
    city: 'Đà Nẵng',
    district: 'Hải Châu',
    name: 'CMID Showroom Đà Nẵng',
    address: '456 Nguyễn Văn Linh, Hải Châu, Đà Nẵng',
    phone: '0236 388 6868',
  },
]
