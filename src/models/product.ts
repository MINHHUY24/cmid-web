/*
 * Vai trò: Kiểu domain sản phẩm: category, brand, ảnh, model 3D, tồn kho, trạng thái và loại bán. Đây là nguồn type chuẩn cho toàn bộ sản phẩm.
 */
/* Hai cách mua hàng mà hệ thống hỗ trợ: đặt trực tiếp hoặc yêu cầu báo giá. */
export type SaleType = "DIRECT_ORDER" | "REQUEST_QUOTE";

/* Trạng thái xuất bản/khả dụng quyết định sản phẩm có thể hiển thị và bán hay không. */
export type ProductStatus = "ACTIVE" | "OUT_OF_STOCK" | "INACTIVE" | "DRAFT";

/* Nhóm danh mục được gắn với mỗi sản phẩm. */
export interface ProductCategory {
  id: number;
  name: string;
  nameEn?: string | null;
  slug: string;
}

/* Thương hiệu được gắn với mỗi sản phẩm. */
export interface ProductBrand {
  id: number;
  name: string;
  nameEn?: string | null;
  slug: string;
}

/* Một ảnh gallery, kèm thứ tự hiển thị và góc chụp nếu có. */
export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
  view?: "front" | "left" | "right" | "back" | "extra";
}

/* Tệp mô hình 3D và metadata để Viewer lựa chọn cách tải/hiển thị. */
export interface ProductModel3D {
  id: number;
  productId: number;
  modelUrl: string;
  posterUrl: string | null;
  format: string | null;
  version: string | null;
  lodLevel: string | null;
  mobileReady: boolean;
  isActive: boolean;
}

/* Cặp thông số kỹ thuật để render bảng thông số sản phẩm. */
export interface ProductTechnicalSpecification {
  label: string;
  value: string;
}

/* Số lượng tồn của một sản phẩm tại từng showroom/kho. */
export interface ProductStoreStock {
  storeId: string;
  quantity: number;
}

/* Domain model đầy đủ của một sản phẩm dùng xuyên suốt frontend. */
export interface Product {
  id: number;
  sku: string;
  name: string;
  nameEn?: string | null;
  slug: string;
  description: string | null;
  descriptionEn?: string | null;
  /* Nội dung bán hàng và thông số dùng cho vùng chi tiết sản phẩm. */
  descriptionHighlights?: string[];
  technicalSpecifications?: ProductTechnicalSpecification[];
  usageGuide?: string | null;
  usageGuidePoints?: string[];
  salesPolicy?: string | null;
  salesPolicyPoints?: string[];
  /* Dữ liệu giá, loại bán và khả năng tồn kho của sản phẩm. */
  price: string | null;
  unit: string | null;
  saleType: SaleType;
  status: ProductStatus;
  stock?: number | null;
  stockByStore?: ProductStoreStock[];
  isFeatured?: boolean;
  materialIds?: string[];
  supplierId?: string | null;
  /* Các quan hệ dữ liệu phục vụ gallery, 3D và điều hướng catalogue. */
  category: ProductCategory | null;
  brand: ProductBrand | null;
  images: ProductImage[];
  models3D: ProductModel3D[];
  has3DModel?: boolean;
}
