import { Check, FloppyDisk, Plus, Trash } from '@phosphor-icons/react'
import { useId, useState, type FormEvent } from 'react'
import type { Product, ProductStatus, ProductStoreStock, ProductTechnicalSpecification, SaleType } from '../../types/product'
import { AdminImageUpload } from './TaiAnhLenQuanTri'
import { AdminTrellisModel } from './MoHinhTrellisQuanTri'
import { createProductImageSlots, PRODUCT_IMAGE_VIEWS, toProductImages, type ProductImageSlot } from './HinhAnhSanPhamQuanTri'
import { AdminPageHeading, AdminPanel, AdminSelect } from './ThanhPhanCoBanQuanTri'
import type { AdminBrand, AdminNamedRecord, AdminShowroom } from './CoSoDuLieuQuanTri'
import { saveProduct } from '../../services/product.service'
import { isAdminDemoEnabled } from './XacThucMauQuanTri'

interface AdminProductEditorProps {
  product?: Product
  categories: AdminNamedRecord[]
  brands: AdminBrand[]
  showrooms: AdminShowroom[]
  canManageInventory?: boolean
  canPublish?: boolean
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
  stockByStore: ProductStoreStockDraft[]
  isFeatured: boolean
  description: string
  descriptionEn: string
  descriptionHighlights: string
  technicalSpecifications: ProductTechnicalSpecification[]
  usageGuide: string
  usageGuidePoints: string
  salesPolicy: string
  salesPolicyPoints: string
  images: ProductImageSlot[]
  modelUrl: string
  modelFileName: string
  modelFileSize: number | null
}

interface ProductStoreStockDraft {
  storeId: string
  quantity: string
}

export function AdminProductEditor({
  product,
  categories,
  brands,
  showrooms,
  canManageInventory = true,
  canPublish = true,
  onCancel,
  onSaved,
}: AdminProductEditorProps) {
  const [modelOwnerKey] = useState(() => createModelOwnerKey(product))
  const [form, setForm] = useState<ProductEditorState>(() =>
    createEditorState(product, categories, brands),
  )
  const [modelBusy, setModelBusy] = useState(false)
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(() => new Set())
  const mediaBusy = modelBusy || uploadingImages.size > 0
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  function update<K extends keyof ProductEditorState>(key: K, value: ProductEditorState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function updateImage(key: string, imageUrl: string) {
    setForm((current) => ({ ...current, images: current.images.map((slot) => slot.key === key ? { ...slot, imageUrl } : slot) }))
  }

  function updateTechnicalSpecification(index: number, key: keyof ProductTechnicalSpecification, value: string) {
    setForm((current) => ({
      ...current,
      technicalSpecifications: current.technicalSpecifications.map((specification, currentIndex) =>
        currentIndex === index ? { ...specification, [key]: value } : specification,
      ),
    }))
  }

  function addTechnicalSpecification() {
    update('technicalSpecifications', [...form.technicalSpecifications, { label: '', value: '' }])
  }

  function removeTechnicalSpecification(index: number) {
    update('technicalSpecifications', form.technicalSpecifications.filter((_, currentIndex) => currentIndex !== index))
  }

  function updateStoreStock(index: number, key: keyof ProductStoreStockDraft, value: string) {
    update('stockByStore', form.stockByStore.map((storeStock, currentIndex) =>
      currentIndex === index ? { ...storeStock, [key]: value } : storeStock,
    ))
  }

  function addStoreStock() {
    update('stockByStore', [...form.stockByStore, { storeId: '', quantity: '' }])
  }

  function removeStoreStock(index: number) {
    update('stockByStore', form.stockByStore.filter((_, currentIndex) => currentIndex !== index))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaveError(null)
    if (mediaBusy) {
      setSaveError('Vui lòng đợi hình ảnh và mô hình xử lý xong trước khi lưu.')
      return
    }

    const category = categories.find((item) => item.id === form.categoryId)
    const brand = brands.find((item) => item.id === form.brandId)
    if (!category) {
      setSaveError('Vui lòng chọn danh mục sản phẩm.')
      return
    }
    if (!form.images[0]?.imageUrl) {
      setSaveError('Vui lòng tải ảnh mặt trước cho sản phẩm.')
      return
    }

    const stockError = validateStoreStocks(form.stockByStore)
    if (stockError) {
      setSaveError(stockError)
      return
    }

    const stockByStore = toStoreStocks(form.stockByStore)

    const id = product?.id ?? Date.now()
    const existingModel = product?.models3D[0]
    const nextProduct: Product = {
      id,
      sku: form.sku.trim(),
      name: form.name.trim(),
      nameEn: form.nameEn.trim() || null,
      slug: product?.slug ?? (toSlug(form.name) || `san-pham-${id}`),
      description: form.description.trim() || null,
      descriptionEn: form.descriptionEn.trim() || null,
      descriptionHighlights: textLines(form.descriptionHighlights),
      technicalSpecifications: form.technicalSpecifications
        .map((specification) => ({ label: specification.label.trim(), value: specification.value.trim() }))
        .filter((specification) => specification.label && specification.value),
      usageGuide: form.usageGuide.trim() || null,
      usageGuidePoints: textLines(form.usageGuidePoints),
      salesPolicy: form.salesPolicy.trim() || null,
      salesPolicyPoints: textLines(form.salesPolicyPoints),
      price: form.price.trim() || null,
      unit: form.unit.trim() || null,
      saleType: form.saleType,
      status: form.status,
      stock: stockByStore.length ? stockByStore.reduce((total, storeStock) => total + storeStock.quantity, 0) : null,
      stockByStore,
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
      images: toProductImages(form.images, id, form.name),
      models3D: form.modelUrl
        ? [{
            id: existingModel?.id ?? id + 20,
            productId: id,
            modelUrl: form.modelUrl,
            posterUrl: form.images[0]?.imageUrl || null,
            format: 'GLB',
            version: form.modelFileName || existingModel?.version || null,
            lodLevel: form.modelFileSize ? `${form.modelFileSize} bytes` : existingModel?.lodLevel ?? null,
            mobileReady: existingModel?.mobileReady ?? false,
            isActive: true,
          }]
        : [],
    }

    try {
      setIsSaving(true)
      const savedProduct = await saveProduct(nextProduct, isAdminDemoEnabled)
      onSaved(savedProduct)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Không thể lưu sản phẩm lên máy chủ.')
      return
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <AdminPageHeading
        title={product ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
        description="Hoàn thiện nội dung sản phẩm để hiển thị đồng bộ trên catalogue và trang chi tiết."
        action={(
          <div className="admin-heading-actions">
            <button className="admin-button" type="button" onClick={onCancel}>Hủy</button>
            <button className="admin-button admin-button--primary" type="submit" disabled={mediaBusy || isSaving}>
              <FloppyDisk size={17} /> {isSaving ? 'Đang lưu...' : 'Lưu sản phẩm'}
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
              <PriceField value={form.price} onChange={(value) => update('price', value)} />
            </div>
            <TextField label="Đơn vị tính" value={form.unit} required onChange={(value) => update('unit', value)} />
            <TextAreaField label="Mô tả sản phẩm (VI)" value={form.description} onChange={(value) => update('description', value)} />
            <TextAreaField label="Mô tả sản phẩm (EN)" value={form.descriptionEn} onChange={(value) => update('descriptionEn', value)} />
            <TextAreaField
              label="Điểm nổi bật"
              value={form.descriptionHighlights}
              onChange={(value) => update('descriptionHighlights', value)}
              helper="Mỗi dòng là một điểm nổi bật, hiển thị trong tab Mô tả."
            />
          </AdminPanel>

          <AdminPanel title="Nội dung trang chi tiết">
            <section className="admin-product-content-section" aria-labelledby="technical-specifications-title">
              <div className="admin-product-content-section__heading">
                <div>
                  <h3 id="technical-specifications-title">Thông số kỹ thuật</h3>
                  <p>Thêm các thông số riêng của sản phẩm để hiển thị trong tab Thông số kỹ thuật.</p>
                </div>
                <button className="admin-button" type="button" onClick={addTechnicalSpecification}>
                  <Plus size={16} /> Thêm thông số
                </button>
              </div>
              <div className="admin-product-specifications">
                {form.technicalSpecifications.map((specification, index) => (
                  <div className="admin-product-specification" key={index}>
                    <input
                      aria-label={`Tên thông số ${index + 1}`}
                      value={specification.label}
                      onChange={(event) => updateTechnicalSpecification(index, 'label', event.target.value)}
                      placeholder="Ví dụ: Kích thước"
                    />
                    <input
                      aria-label={`Giá trị thông số ${index + 1}`}
                      value={specification.value}
                      onChange={(event) => updateTechnicalSpecification(index, 'value', event.target.value)}
                      placeholder="Ví dụ: 180 × 85 × 78 cm"
                    />
                    <button
                      className="admin-product-specification__remove"
                      type="button"
                      aria-label={`Xóa thông số ${index + 1}`}
                      onClick={() => removeTechnicalSpecification(index)}
                    >
                      <Trash size={17} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <TextAreaField
              label="Hướng dẫn"
              value={form.usageGuide}
              onChange={(value) => update('usageGuide', value)}
              helper="Nội dung mở đầu trong tab Hướng dẫn."
            />
            <TextAreaField
              label="Các lưu ý hướng dẫn"
              value={form.usageGuidePoints}
              onChange={(value) => update('usageGuidePoints', value)}
              helper="Mỗi dòng là một lưu ý."
            />
            <TextAreaField
              label="Chính sách bán hàng"
              value={form.salesPolicy}
              onChange={(value) => update('salesPolicy', value)}
              helper="Nội dung mở đầu trong tab Chính sách bán hàng."
            />
            <TextAreaField
              label="Các điểm trong chính sách"
              value={form.salesPolicyPoints}
              onChange={(value) => update('salesPolicyPoints', value)}
              helper="Mỗi dòng là một điều khoản hoặc lưu ý."
            />
          </AdminPanel>

          <AdminPanel title="Hình ảnh và trải nghiệm 3D" className="admin-product-media-panel">
            <p className="admin-product-images__intro">Ảnh mặt trước hiển thị đầu tiên trên danh sách và trang chi tiết sản phẩm. Sắp xếp bốn góc theo thứ tự bên dưới.</p>
            <div className="admin-product-images">
              {form.images.map((slot, index) => (
                <AdminImageUpload
                  key={slot.key}
                  id={`admin-product-image-${slot.key}`}
                  label={`${index + 1}. ${PRODUCT_IMAGE_VIEWS[index]?.label ?? `Ảnh bổ sung ${index - 3}`}`}
                  value={slot.imageUrl}
                  onChange={(value) => updateImage(slot.key, value)}
                  onUploadingChange={(uploading) => setUploadingImages((current) => {
                    const next = new Set(current)
                    if (uploading) next.add(slot.key)
                    else next.delete(slot.key)
                    return next
                  })}
                  disabled={modelBusy}
                  showDataMode={false}
                  helper={index === 0 ? 'Ảnh chính của sản phẩm.' : index < 4 ? 'Dùng thêm góc này khi tạo mô hình 3D.' : 'Hiển thị tiếp trong thư viện ảnh sản phẩm.'}
                  required={index === 0}
                />
              ))}
            </div>
            <button className="admin-button admin-product-images__add" type="button" disabled={mediaBusy} onClick={() => update('images', [...form.images, { key: `extra-${crypto.randomUUID()}`, imageUrl: '' }])}>
              <Plus size={17} /> Thêm ảnh khác
            </button>
            <AdminTrellisModel
              images={uploadingImages.size ? [] : form.images.slice(0, 4).map((slot) => slot.imageUrl)}
              productName={form.name}
              productKey={modelOwnerKey}
              modelUrl={form.modelUrl}
              onBusyChange={setModelBusy}
              onSaved={(model) => setForm((current) => ({ ...current, modelUrl: model.modelUrl, modelFileName: model.fileName, modelFileSize: model.fileSize }))}
              onRemove={() => setForm((current) => ({ ...current, modelUrl: '', modelFileName: '', modelFileSize: null }))}
            />
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
                disabled={!canPublish}
                options={[
                  { value: 'ACTIVE', label: 'Đang bán và hiển thị' },
                  { value: 'OUT_OF_STOCK', label: 'Hết hàng, vẫn hiển thị' },
                  { value: 'INACTIVE', label: 'Ngưng bán' },
                  { value: 'DRAFT', label: 'Bản nháp' },
                ]}
              />
            </label>
            <section className="admin-product-stock-picker" aria-labelledby="stock-by-store-title">
              <div className="admin-product-stock-picker__heading">
                <div>
                  <h3 id="stock-by-store-title">Tồn kho theo cửa hàng</h3>
                  <p>{canManageInventory ? 'Chọn từng cửa hàng và nhập số lượng tồn kho tương ứng.' : 'Bạn được xem tồn kho nhưng không có quyền chỉnh sửa.'}</p>
                </div>
                <strong>Tổng: {formatStockTotal(form.stockByStore)} {form.unit.trim() || 'cái'}</strong>
              </div>
              <div className="admin-product-stock-picker__labels" aria-hidden="true">
                <span>Cửa hàng</span>
                <span>Số lượng tồn kho</span>
              </div>
              <div className="admin-product-stock-picker__rows">
                {form.stockByStore.map((storeStock, index) => {
                  const selectedStoreIds = new Set(form.stockByStore.map((item) => item.storeId).filter(Boolean))
                  const storeOptions = [
                    { value: '', label: 'Chọn cửa hàng' },
                    ...showrooms
                      .filter((showroom) => (
                        (showroom.status === 'ACTIVE' || showroom.id === storeStock.storeId)
                        && (!selectedStoreIds.has(showroom.id) || showroom.id === storeStock.storeId)
                      ))
                      .map((showroom) => ({
                        value: showroom.id,
                        label: `${showroom.name}${showroom.status === 'INACTIVE' ? ' (ngưng hoạt động)' : ''}`,
                      })),
                  ]

                  return (
                    <div className="admin-product-stock-picker__row" key={`${storeStock.storeId}-${index}`}>
                      <AdminSelect
                        value={storeStock.storeId}
                        onChange={(value) => updateStoreStock(index, 'storeId', value)}
                        aria-label={`Cửa hàng tồn kho ${index + 1}`}
                        options={storeOptions}
                        disabled={!canManageInventory}
                      />
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={storeStock.quantity}
                        onChange={(event) => updateStoreStock(index, 'quantity', event.target.value)}
                        aria-label={`Số lượng tồn kho tại cửa hàng ${index + 1}`}
                        placeholder="0"
                        disabled={!canManageInventory}
                      />
                      <button
                        className="admin-product-stock-picker__remove"
                        type="button"
                        onClick={() => removeStoreStock(index)}
                        aria-label={`Xóa tồn kho tại cửa hàng ${index + 1}`}
                        disabled={!canManageInventory}
                      >
                        <Trash size={17} />
                      </button>
                    </div>
                  )
                })}
              </div>
              <button className="admin-button admin-product-stock-picker__add" type="button" onClick={addStoreStock} disabled={!canManageInventory}>
                <Plus size={16} /> Thêm cửa hàng
              </button>
              {form.stockByStore.length === 0 ? <p className="admin-product-stock-picker__empty">Chưa có tồn kho tại cửa hàng nào.</p> : null}
            </section>
            <label className="admin-checkbox">
              <input type="checkbox" checked={form.isFeatured} onChange={(event) => update('isFeatured', event.target.checked)} />
              <span>Hiển thị trong khu vực sản phẩm nổi bật</span>
            </label>
            <p className="admin-form-note">
              <Check size={16} weight="bold" />
              Sản phẩm đang bán hoặc hết hàng vẫn xuất hiện trên catalogue. Sản phẩm hết hàng không thể thêm vào giỏ.
            </p>
          </AdminPanel>
        </div>
      </div>
    </form>
  )
}

function createModelOwnerKey(product?: Product) {
  if (product) return `product-${product.id}`

  // Every new-product editor gets its own TRELLIS job namespace. Reusing a
  // literal "new" key would leak the completed job from one draft into the
  // next draft and allow two products to select the same generated model.
  return `draft-${crypto.randomUUID()}`
}

function createEditorState(
  product: Product | undefined,
  categories: AdminNamedRecord[],
  brands: AdminBrand[],
): ProductEditorState {
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
    stockByStore: createStoreStockDrafts(product),
    isFeatured: product?.isFeatured ?? false,
    description: product?.description ?? '',
    descriptionEn: product?.descriptionEn ?? '',
    descriptionHighlights: product?.descriptionHighlights?.join('\n') ?? '',
    technicalSpecifications: product?.technicalSpecifications ?? [],
    usageGuide: product?.usageGuide ?? '',
    usageGuidePoints: product?.usageGuidePoints?.join('\n') ?? '',
    salesPolicy: product?.salesPolicy ?? '',
    salesPolicyPoints: product?.salesPolicyPoints?.join('\n') ?? '',
    images: createProductImageSlots(product?.images),
    modelUrl: model?.modelUrl ?? '',
    modelFileName: model?.version ?? '',
    modelFileSize: null,
  }
}

function createStoreStockDrafts(product?: Product): ProductStoreStockDraft[] {
  if (product?.stockByStore?.length) {
    return product.stockByStore.map((storeStock) => ({
      storeId: storeStock.storeId,
      quantity: String(storeStock.quantity),
    }))
  }

  // Preserve the quantity recorded before inventory was split by store. The
  // administrator can assign it to the appropriate store before saving.
  return product?.stock == null ? [] : [{ storeId: '', quantity: String(product.stock) }]
}

function toStoreStocks(drafts: ProductStoreStockDraft[]): ProductStoreStock[] {
  return drafts
    .filter((draft) => draft.storeId && draft.quantity.trim())
    .map((draft) => ({ storeId: draft.storeId, quantity: Number(draft.quantity) }))
}

function validateStoreStocks(drafts: ProductStoreStockDraft[]): string | null {
  const selectedStores = new Set<string>()

  for (const draft of drafts) {
    const hasStore = Boolean(draft.storeId)
    const hasQuantity = Boolean(draft.quantity.trim())

    if (hasStore !== hasQuantity) return 'Mỗi dòng tồn kho cần chọn cửa hàng và nhập số lượng.'
    if (!hasStore) continue

    const quantity = Number(draft.quantity)
    if (!Number.isSafeInteger(quantity) || quantity < 0) return 'Số lượng tồn kho phải là số nguyên không âm.'
    if (selectedStores.has(draft.storeId)) return 'Mỗi cửa hàng chỉ được khai báo tồn kho một lần.'
    selectedStores.add(draft.storeId)
  }

  return null
}

function formatStockTotal(drafts: ProductStoreStockDraft[]) {
  const total = drafts.reduce((sum, draft) => {
    const quantity = Number(draft.quantity)
    return Number.isSafeInteger(quantity) && quantity >= 0 ? sum + quantity : sum
  }, 0)

  return new Intl.NumberFormat('vi-VN').format(total)
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

function PriceField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  function formatPrice(amount: string) {
    return amount === '' ? '' : new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Number(amount))
  }

  return (
    <label className="admin-field">
      <span>Đơn giá (VNĐ)<b>*</b></span>
      <input
        type="text"
        inputMode="numeric"
        required
        value={formatPrice(value)}
        onChange={(event) => {
          const input = event.currentTarget
          const digitsBeforeCaret = input.value.slice(0, input.selectionStart ?? input.value.length).replace(/\D/g, '').length
          const amount = input.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
          const formatted = formatPrice(amount)
          // Keep the cursor beside the edited digit when grouping separators move.
          let caret = 0
          let digits = 0
          while (caret < formatted.length && digits < digitsBeforeCaret) {
            if (/\d/.test(formatted[caret])) digits += 1
            caret += 1
          }
          input.value = formatted
          input.setSelectionRange(caret, caret)
          onChange(amount)
        }}
      />
    </label>
  )
}

function TextAreaField({ label, value, onChange, helper }: { label: string; value: string; onChange: (value: string) => void; helper?: string }) {
  const id = useId()
  const helperId = `${id}-helper`
  return (
    <div className="admin-field">
      <label htmlFor={id}><span>{label}</span></label>
      <textarea
        id={id}
        value={value}
        aria-describedby={helper ? helperId : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {helper ? <small id={helperId}>{helper}</small> : null}
    </div>
  )
}

function textLines(value: string) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean)
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
