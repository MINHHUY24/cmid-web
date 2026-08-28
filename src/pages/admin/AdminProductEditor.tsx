import { Check, FloppyDisk, Trash, UploadSimple } from '@phosphor-icons/react'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import type { Product, ProductStatus, SaleType } from '../../types/product'
import { AdminImageUpload } from './AdminImageUpload'
import { AdminPageHeading, AdminPanel, AdminSelect } from './AdminPrimitives'
import type { AdminBrand, AdminNamedRecord } from './admin-database'
import { saveAdminProduct } from './admin-local-store'

interface AdminProductEditorProps {
  product?: Product
  categories: AdminNamedRecord[]
  brands: AdminBrand[]
  onCancel: () => void
  onSaved: (product: Product) => void
}

interface ProductEditorState {
  name: string
  nameEn: string
  sku: string
  price: string
  unit: string
  categoryId: string
  brandId: string
  saleType: SaleType
  status: ProductStatus
  stock: string
  isFeatured: boolean
  description: string
  descriptionEn: string
  imageUrl: string
  altText: string
  modelUrl: string
  modelFileName: string
  modelFileSize: number | null
}

const MAX_MODEL_SIZE = 40 * 1024 * 1024

export function AdminProductEditor({
  product,
  categories,
  brands,
  onCancel,
  onSaved,
}: AdminProductEditorProps) {
  const [form, setForm] = useState<ProductEditorState>(() =>
    createEditorState(product, categories, brands),
  )
  const [modelError, setModelError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  function update<K extends keyof ProductEditorState>(key: K, value: ProductEditorState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleModelFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.name.toLocaleLowerCase('vi').endsWith('.glb')) {
      setModelError('Vui lòng chọn đúng tệp mô hình định dạng GLB.')
      return
    }

    if (file.size > MAX_MODEL_SIZE) {
      setModelError('Tệp GLB không được vượt quá 40 MB.')
      return
    }

    update('modelUrl', URL.createObjectURL(file))
    update('modelFileName', file.name)
    update('modelFileSize', file.size)
    setModelError(null)
  }

  function clearModel() {
    update('modelUrl', '')
    update('modelFileName', '')
    update('modelFileSize', null)
    setModelError(null)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaveError(null)

    const category = categories.find((item) => item.id === form.categoryId)
    const brand = brands.find((item) => item.id === form.brandId)
    if (!category) {
      setSaveError('Vui lòng chọn danh mục sản phẩm.')
      return
    }
    if (!form.imageUrl) {
      setSaveError('Vui lòng tải ảnh chính cho sản phẩm.')
      return
    }

    const id = product?.id ?? Date.now()
    const existingPrimaryImage = product?.images.find((image) => image.isPrimary)
    const existingModel = product?.models3D[0]
    const nextProduct: Product = {
      id,
      sku: form.sku.trim(),
      name: form.name.trim(),
      nameEn: form.nameEn.trim() || null,
      slug: product?.slug ?? (toSlug(form.name) || `san-pham-${id}`),
      description: form.description.trim() || null,
      descriptionEn: form.descriptionEn.trim() || null,
      price: form.price.trim() || null,
      unit: form.unit.trim() || null,
      saleType: form.saleType,
      status: form.status,
      stock: form.stock.trim() ? Number(form.stock) : null,
      isFeatured: form.isFeatured,
      materialIds: product?.materialIds ?? [],
      supplierId: product?.supplierId ?? null,
      category: {
        id: product?.category?.slug === category.slug
          ? product.category.id
          : toNumericId(category.id),
        name: category.name,
        nameEn: product?.category?.slug === category.slug ? product.category.nameEn : null,
        slug: category.slug,
      },
      brand: brand
        ? {
            id: product?.brand?.slug === brand.slug ? product.brand.id : toNumericId(brand.id),
            name: brand.name,
            nameEn: product?.brand?.slug === brand.slug ? product.brand.nameEn : null,
            slug: brand.slug,
          }
        : null,
      images: form.imageUrl
        ? [
            {
              id: existingPrimaryImage?.id ?? id + 10,
              productId: id,
              imageUrl: form.imageUrl,
              altText: form.altText.trim() || null,
              isPrimary: true,
              sortOrder: 0,
            },
            ...(product?.images.filter((image) => !image.isPrimary) ?? []),
          ]
        : product?.images.filter((image) => !image.isPrimary) ?? [],
      models3D: form.modelUrl
        ? [{
            id: existingModel?.id ?? id + 20,
            productId: id,
            modelUrl: form.modelUrl,
            posterUrl: form.imageUrl || null,
            format: 'GLB',
            version: form.modelFileName || existingModel?.version || null,
            lodLevel: form.modelFileSize ? `${form.modelFileSize} bytes` : existingModel?.lodLevel ?? null,
            mobileReady: existingModel?.mobileReady ?? false,
            isActive: true,
          }]
        : [],
    }

    try {
      saveAdminProduct(nextProduct)
    } catch {
      setSaveError('Không thể lưu sản phẩm. Dữ liệu ảnh hoặc mô hình có thể vượt giới hạn bộ nhớ cục bộ.')
      return
    }

    onSaved(nextProduct)
  }

  return (
    <form onSubmit={submit}>
      <AdminPageHeading
        title={product ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
        description="Hoàn thiện nội dung sản phẩm để hiển thị đồng bộ trên catalogue và trang chi tiết."
        action={(
          <div className="admin-heading-actions">
            <button className="admin-button" type="button" onClick={onCancel}>Hủy</button>
            <button className="admin-button admin-button--primary" type="submit">
              <FloppyDisk size={17} /> Lưu sản phẩm
            </button>
          </div>
        )}
      />

      {saveError ? <p className="admin-upload-field__error" role="alert">{saveError}</p> : null}

      <div className="admin-editor-grid">
        <div className="admin-editor-main">
          <AdminPanel title="Thông tin hiển thị">
            <div className="admin-form-grid admin-form-grid--two">
              <TextField label="Tên sản phẩm (VI)" value={form.name} required onChange={(value) => update('name', value)} />
              <TextField label="Tên sản phẩm (EN)" value={form.nameEn} onChange={(value) => update('nameEn', value)} />
            </div>
            <div className="admin-form-grid admin-form-grid--two">
              <TextField label="Mã sản phẩm (SKU)" value={form.sku} required onChange={(value) => update('sku', value)} />
              <TextField label="Đơn giá (VNĐ)" value={form.price} type="number" required min="0" onChange={(value) => update('price', value)} />
            </div>
            <TextField label="Đơn vị tính" value={form.unit} required onChange={(value) => update('unit', value)} />
            <TextAreaField label="Mô tả sản phẩm (VI)" value={form.description} onChange={(value) => update('description', value)} />
            <TextAreaField label="Mô tả sản phẩm (EN)" value={form.descriptionEn} onChange={(value) => update('descriptionEn', value)} />
          </AdminPanel>

          <AdminPanel title="Hình ảnh và trải nghiệm 3D">
            <div className="admin-field">
              <AdminImageUpload
                id="admin-product-primary-image"
                label="Ảnh chính"
                value={form.imageUrl}
                onChange={(value) => update('imageUrl', value)}
                helper="Chọn JPG, PNG, WEBP hoặc AVIF. Ảnh này hiển thị trên card sản phẩm và trang chi tiết."
                required
              />
            </div>
            <TextField label="Mô tả thay thế cho ảnh" value={form.altText} onChange={(value) => update('altText', value)} />
            <label className="admin-field">
              <span>Mô hình 3D (GLB, tùy chọn)</span>
              <input type="file" accept=".glb,model/gltf-binary" onChange={handleModelFile} />
              <small>Tối đa 40 MB. Bản demo dùng đường dẫn cục bộ trong phiên hiện tại.</small>
            </label>
            {form.modelFileName || form.modelUrl ? (
              <div className="admin-form-note">
                <UploadSimple size={17} />
                <span>
                  {form.modelFileName || 'Mô hình GLB hiện có'}
                  {form.modelFileSize ? `, ${formatFileSize(form.modelFileSize)}` : ''}
                </span>
                <button className="admin-button" type="button" onClick={clearModel}>
                  <Trash size={15} /> Xóa mô hình
                </button>
              </div>
            ) : null}
            {modelError ? <p className="admin-upload-field__error" role="alert">{modelError}</p> : null}
          </AdminPanel>
        </div>

        <div className="admin-editor-side">
          <AdminPanel title="Phân loại">
            <label className="admin-field">
              <span>Danh mục <b>*</b></span>
              <AdminSelect
                required
                value={form.categoryId}
                onChange={(value) => update('categoryId', value)}
                aria-label="Danh mục"
                options={[
                  { value: '', label: 'Chọn danh mục' },
                  ...categories.map((category) => ({ value: category.id, label: `${category.name}${category.status === 'INACTIVE' ? ' (đang ẩn)' : ''}` })),
                ]}
              />
            </label>
            <label className="admin-field">
              <span>Thương hiệu</span>
              <AdminSelect
                value={form.brandId}
                onChange={(value) => update('brandId', value)}
                aria-label="Thương hiệu"
                options={[
                  { value: '', label: 'Không có thương hiệu' },
                  ...brands.map((brand) => ({ value: brand.id, label: `${brand.name}${brand.status === 'INACTIVE' ? ' (đang ẩn)' : ''}` })),
                ]}
              />
            </label>
          </AdminPanel>

          <AdminPanel title="Bán hàng và hiển thị">
            <label className="admin-field">
              <span>Loại bán</span>
              <AdminSelect
                value={form.saleType}
                onChange={(value) => update('saleType', value as SaleType)}
                aria-label="Loại bán"
                options={[
                  { value: 'DIRECT_ORDER', label: 'Mua trực tiếp, thêm vào giỏ' },
                  { value: 'REQUEST_QUOTE', label: 'Liên hệ báo giá' },
                ]}
              />
            </label>
            <label className="admin-field">
              <span>Trạng thái catalogue</span>
              <AdminSelect
                value={form.status}
                onChange={(value) => update('status', value as ProductStatus)}
                aria-label="Trạng thái catalogue"
                options={[
                  { value: 'ACTIVE', label: 'Đang bán và hiển thị' },
                  { value: 'INACTIVE', label: 'Ngưng bán' },
                  { value: 'DRAFT', label: 'Bản nháp' },
                ]}
              />
            </label>
            <TextField label="Số lượng tồn kho" value={form.stock} type="number" min="0" onChange={(value) => update('stock', value)} />
            <label className="admin-checkbox">
              <input type="checkbox" checked={form.isFeatured} onChange={(event) => update('isFeatured', event.target.checked)} />
              Hiển thị trong khu vực sản phẩm nổi bật
            </label>
            <p className="admin-form-note">
              <Check size={16} weight="bold" />
              Sản phẩm đang bán sẽ xuất hiện trên catalogue. Chỉ loại mua trực tiếp mới có thể thêm vào giỏ hàng.
            </p>
          </AdminPanel>
        </div>
      </div>
    </form>
  )
}

function createEditorState(
  product: Product | undefined,
  categories: AdminNamedRecord[],
  brands: AdminBrand[],
): ProductEditorState {
  const image = product?.images.find((item) => item.isPrimary) ?? product?.images[0]
  const model = product?.models3D[0]

  return {
    name: product?.name ?? '',
    nameEn: product?.nameEn ?? '',
    sku: product?.sku ?? '',
    price: product?.price ?? '',
    unit: product?.unit ?? 'cái',
    categoryId: product
      ? categories.find((item) => item.slug === product.category?.slug)?.id ?? ''
      : categories.find((item) => item.status === 'ACTIVE')?.id ?? '',
    brandId: brands.find((item) => item.slug === product?.brand?.slug)?.id ?? '',
    saleType: product?.saleType ?? 'DIRECT_ORDER',
    status: product?.status ?? 'ACTIVE',
    stock: product?.stock == null ? '' : String(product.stock),
    isFeatured: product?.isFeatured ?? false,
    description: product?.description ?? '',
    descriptionEn: product?.descriptionEn ?? '',
    imageUrl: image?.imageUrl ?? '',
    altText: image?.altText ?? '',
    modelUrl: model?.modelUrl ?? '',
    modelFileName: model?.version ?? '',
    modelFileSize: null,
  }
}

function TextField({
  label,
  value,
  onChange,
  required = false,
  type = 'text',
  min,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  type?: 'text' | 'number'
  min?: string
}) {
  return (
    <label className="admin-field">
      <span>{label}{required ? <b>*</b> : null}</span>
      <input type={type} min={min} required={required} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function toSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('vi')
    .trim()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function toNumericId(value: string) {
  const digits = Number(value.replace(/\D/g, ''))
  if (Number.isSafeInteger(digits) && digits > 0) return digits

  let hash = 0
  for (const character of value) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return hash || Date.now()
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
