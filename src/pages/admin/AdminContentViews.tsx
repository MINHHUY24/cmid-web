import {
  Buildings,
  FloppyDisk,
  MagnifyingGlass,
  Newspaper,
  PencilSimple,
  Plus,
  Trash,
  X,
} from '@phosphor-icons/react'
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import {
  newsArticles,
  newsCategoryKeys,
  type ArticleCategoryKey,
} from '../../content/news-articles'
import { AdminImageUpload } from './AdminImageUpload'
import { AdminPageHeading, AdminPanel, AdminSelect, AdminStatus } from './AdminPrimitives'
import {
  ADMIN_CONTENT_UPDATED_EVENT,
  deleteAdminNewsArticle,
  deleteAdminProject,
  getAdminNewsArticles,
  getHiddenAdminNewsSlugs,
  getAdminProjects,
  saveAdminNewsArticle,
  saveAdminProject,
  type AdminNewsArticle,
  type AdminProject,
  type AdminPublishStatus,
} from './admin-local-store'

interface AdminContentViewProps {
  onToast: (message: string) => void
}

interface NewsFormState {
  title: string
  titleEn: string
  summary: string
  summaryEn: string
  body: string
  bodyEn: string
  highlights: string
  highlightsEn: string
  tags: string
  tagsEn: string
  category: ArticleCategoryKey
  image: string
  status: AdminPublishStatus
  featured: boolean
  publishedAt: string
  readingMinutes: number
}

interface ProjectFormState {
  title: string
  titleEn: string
  location: string
  locationEn: string
  description: string
  descriptionEn: string
  image: string
  status: AdminPublishStatus
  featured: boolean
}

const categoryLabels: Record<ArticleCategoryKey, string> = {
  'material-trends': 'Xu hướng vật liệu',
  'design-insights': 'Kinh nghiệm thiết kế',
  'new-products': 'Sản phẩm mới',
  'featured-projects': 'Dự án nổi bật',
  'cmid-news': 'Tin tức CMID',
}

const articleCategories = newsCategoryKeys.filter(
  (category): category is ArticleCategoryKey => category !== 'all',
)

function createEmptyNewsForm(): NewsFormState {
  return {
    title: '',
    titleEn: '',
    summary: '',
    summaryEn: '',
    body: '',
    bodyEn: '',
    highlights: '',
    highlightsEn: '',
    tags: '',
    tagsEn: '',
    category: 'material-trends',
    image: '',
    status: 'DRAFT',
    featured: false,
    publishedAt: new Date().toISOString().slice(0, 10),
    readingMinutes: 4,
  }
}

const emptyProjectForm: ProjectFormState = {
  title: '',
  titleEn: '',
  location: '',
  locationEn: '',
  description: '',
  descriptionEn: '',
  image: '',
  status: 'DRAFT',
  featured: false,
}

export function AdminNewsView({ onToast }: AdminContentViewProps) {
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [deletingArticle, setDeletingArticle] = useState<AdminNewsArticle | null>(null)
  const [form, setForm] = useState<NewsFormState>(createEmptyNewsForm)
  const [, setRevision] = useState(0)

  useEffect(() => {
    const refresh = () => setRevision((revision) => revision + 1)
    window.addEventListener(ADMIN_CONTENT_UPDATED_EVENT, refresh)
    return () => window.removeEventListener(ADMIN_CONTENT_UPDATED_EVENT, refresh)
  }, [])

  const articles = mergeManagedNews('vi')
  const englishArticles = mergeManagedNews('en')
  const filteredArticles = useMemo(() => {
    const query = normalizeSearch(search)
    if (!query) return articles

    return articles.filter((article) =>
      [article.title, article.summary, article.slug, categoryLabels[article.category]]
        .some((value) => normalizeSearch(value).includes(query)),
    )
  }, [articles, search])

  function update<K extends keyof NewsFormState>(key: K, value: NewsFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function openCreateDialog() {
    setEditingSlug(null)
    setForm(createEmptyNewsForm())
    setDialogOpen(true)
  }

  function openEditDialog(article: AdminNewsArticle) {
    const englishArticle = englishArticles.find((item) => item.slug === article.slug)
    setEditingSlug(article.slug)
    setForm({
      title: article.title,
      titleEn: englishArticle?.title ?? '',
      summary: article.summary,
      summaryEn: englishArticle?.summary ?? '',
      body: joinLines(article.body),
      bodyEn: joinLines(englishArticle?.body ?? []),
      highlights: joinLines(article.highlights),
      highlightsEn: joinLines(englishArticle?.highlights ?? []),
      tags: article.tags.join(', '),
      tagsEn: (englishArticle?.tags ?? []).join(', '),
      category: article.category,
      image: article.image,
      status: article.status,
      featured: Boolean(article.featured),
      publishedAt: article.publishedAt,
      readingMinutes: article.readingMinutes,
    })
    setDialogOpen(true)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.image) {
      onToast('Vui lòng tải ảnh bìa cho bài viết.')
      return
    }

    saveAdminNewsArticle({
      slug: editingSlug ?? undefined,
      category: form.category,
      image: form.image,
      featured: form.featured,
      status: form.status,
      publishedAt: form.publishedAt,
      readingMinutes: form.readingMinutes,
      vi: {
        title: form.title.trim(),
        summary: form.summary.trim(),
        body: splitLines(form.body),
        highlights: splitLines(form.highlights),
        tags: splitTags(form.tags),
      },
      en: {
        title: form.titleEn.trim() || form.title.trim(),
        summary: form.summaryEn.trim() || form.summary.trim(),
        body: splitLines(form.bodyEn || form.body),
        highlights: splitLines(form.highlightsEn || form.highlights),
        tags: splitTags(form.tagsEn || form.tags),
      },
    })

    setDialogOpen(false)
    setEditingSlug(null)
    onToast(editingSlug ? 'Đã cập nhật bài viết.' : 'Đã thêm bài viết mới.')
  }

  function confirmDelete() {
    if (!deletingArticle) return
    deleteAdminNewsArticle(deletingArticle.slug)
    setDeletingArticle(null)
    onToast('Đã xóa bài viết khỏi dữ liệu quản trị.')
  }

  return (
    <>
      <AdminPageHeading
        title="Quản lý tin tức & bài viết"
        description="Biên tập nội dung song ngữ, ảnh bìa và trạng thái xuất bản trên trang Tin tức."
        action={(
          <button className="admin-button admin-button--primary" type="button" onClick={openCreateDialog}>
            <Plus size={17} weight="bold" /> Thêm bài viết
          </button>
        )}
      />

      <ContentToolbar
        value={search}
        onChange={setSearch}
        placeholder="Tìm theo tiêu đề, nội dung hoặc chuyên mục..."
        count={filteredArticles.length}
        unit="bài viết"
      />

      <AdminPanel className="admin-table-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ảnh bìa</th>
                <th>Tiêu đề bài viết</th>
                <th>Chuyên mục</th>
                <th>Ngày đăng</th>
                <th className="admin-table__cell--center">Trạng thái</th>
                <th className="admin-table__cell--center">Hiển thị</th>
                <th className="admin-table__cell--actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredArticles.map((article) => (
                <tr key={article.slug}>
                  <td><ContentThumbnail src={article.image} alt={article.title} /></td>
                  <td>
                    <strong>{article.title}</strong>
                    <small>{article.summary}</small>
                  </td>
                  <td>{categoryLabels[article.category]}</td>
                  <td>{article.date}</td>
                  <td className="admin-table__cell--center"><AdminStatus>{publishStatusLabel(article.status)}</AdminStatus></td>
                  <td className="admin-table__cell--center"><AdminStatus>{article.featured ? 'Nổi bật' : 'Thông thường'}</AdminStatus></td>
                  <td className="admin-table__cell--actions">
                    <RowActions
                      label={article.title}
                      onEdit={() => openEditDialog(article)}
                      onDelete={() => setDeletingArticle(article)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredArticles.length === 0 ? (
            <ContentEmpty icon={<Newspaper size={31} />} text="Chưa có bài viết quản trị phù hợp." />
          ) : null}
        </div>
      </AdminPanel>

      {dialogOpen ? (
        <ContentDialog
          title={editingSlug ? 'Cập nhật bài viết' : 'Thêm bài viết mới'}
          description="Các trường tiếng Anh để trống sẽ tự dùng nội dung tiếng Việt."
          onClose={() => setDialogOpen(false)}
        >
          <form onSubmit={submit}>
            <div className="admin-dialog__body">
              <div className="admin-form-grid admin-form-grid--two">
                <TextField label="Tiêu đề (VI)" value={form.title} onChange={(value) => update('title', value)} required />
                <TextField label="Title (EN)" value={form.titleEn} onChange={(value) => update('titleEn', value)} />
              </div>
              <div className="admin-form-grid admin-form-grid--two">
                <TextAreaField label="Tóm tắt (VI)" value={form.summary} onChange={(value) => update('summary', value)} required />
                <TextAreaField label="Summary (EN)" value={form.summaryEn} onChange={(value) => update('summaryEn', value)} />
              </div>
              <div className="admin-form-grid admin-form-grid--two">
                <TextAreaField label="Nội dung bài viết (VI)" value={form.body} onChange={(value) => update('body', value)} helper="Mỗi dòng là một đoạn nội dung." required />
                <TextAreaField label="Article content (EN)" value={form.bodyEn} onChange={(value) => update('bodyEn', value)} helper="Each line becomes one paragraph." />
              </div>
              <div className="admin-form-grid admin-form-grid--two">
                <TextAreaField label="Điểm nổi bật (VI)" value={form.highlights} onChange={(value) => update('highlights', value)} helper="Nhập mỗi ý trên một dòng." />
                <TextAreaField label="Highlights (EN)" value={form.highlightsEn} onChange={(value) => update('highlightsEn', value)} helper="Enter one highlight per line." />
              </div>
              <div className="admin-form-grid admin-form-grid--two">
                <TextField label="Thẻ nội dung (VI)" value={form.tags} onChange={(value) => update('tags', value)} helper="Phân tách bằng dấu phẩy." />
                <TextField label="Tags (EN)" value={form.tagsEn} onChange={(value) => update('tagsEn', value)} helper="Separate tags with commas." />
              </div>
              <div className="admin-form-grid admin-form-grid--three">
                <SelectField
                  label="Chuyên mục"
                  value={form.category}
                  onChange={(value) => update('category', value as ArticleCategoryKey)}
                  options={articleCategories.map((category) => ({
                    value: category,
                    label: categoryLabels[category],
                  }))}
                  required
                />
                <TextField label="Ngày đăng" value={form.publishedAt} onChange={(value) => update('publishedAt', value)} type="date" required />
                <TextField label="Thời gian đọc (phút)" value={String(form.readingMinutes)} onChange={(value) => update('readingMinutes', Number(value))} type="number" min="1" required />
              </div>
              <div className="admin-form-grid admin-form-grid--two">
                <SelectField
                  label="Trạng thái"
                  value={form.status}
                  onChange={(value) => update('status', value as AdminPublishStatus)}
                  options={publishStatusOptions}
                  required
                />
                <label className="admin-check-field">
                  <input type="checkbox" checked={form.featured} onChange={(event) => update('featured', event.target.checked)} />
                  <span>Hiển thị bài viết ở vị trí nổi bật</span>
                </label>
              </div>
              <div className="admin-field">
                <AdminImageUpload
                  id="admin-news-cover"
                  label="Ảnh bìa bài viết"
                  value={form.image}
                  onChange={(value) => update('image', value)}
                  helper="Ảnh này hiển thị tại danh sách, bài nổi bật và trang chi tiết tin tức."
                  required
                />
              </div>
            </div>
            <DialogFooter onCancel={() => setDialogOpen(false)} />
          </form>
        </ContentDialog>
      ) : null}

      {deletingArticle ? (
        <DeleteDialog
          title="Xóa bài viết?"
          description={`“${deletingArticle.title}” sẽ bị gỡ khỏi cả nội dung tiếng Việt và tiếng Anh.`}
          onCancel={() => setDeletingArticle(null)}
          onConfirm={confirmDelete}
        />
      ) : null}
    </>
  )
}

export function AdminProjectsView({ onToast }: AdminContentViewProps) {
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingProject, setDeletingProject] = useState<AdminProject | null>(null)
  const [form, setForm] = useState<ProjectFormState>(emptyProjectForm)
  const [, setRevision] = useState(0)

  useEffect(() => {
    const refresh = () => setRevision((revision) => revision + 1)
    window.addEventListener(ADMIN_CONTENT_UPDATED_EVENT, refresh)
    return () => window.removeEventListener(ADMIN_CONTENT_UPDATED_EVENT, refresh)
  }, [])

  const projects = getAdminProjects('vi', true)
  const englishProjects = getAdminProjects('en', true)
  const filteredProjects = useMemo(() => {
    const query = normalizeSearch(search)
    if (!query) return projects

    return projects.filter((project) =>
      [project.title, project.location, project.description, project.slug]
        .some((value) => normalizeSearch(value).includes(query)),
    )
  }, [projects, search])

  function update<K extends keyof ProjectFormState>(key: K, value: ProjectFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function openCreateDialog() {
    setEditingId(null)
    setForm({ ...emptyProjectForm })
    setDialogOpen(true)
  }

  function openEditDialog(project: AdminProject) {
    const englishProject = englishProjects.find((item) => item.id === project.id)
    setEditingId(project.id)
    setForm({
      title: project.title,
      titleEn: englishProject?.title ?? '',
      location: project.location,
      locationEn: englishProject?.location ?? '',
      description: project.description,
      descriptionEn: englishProject?.description ?? '',
      image: project.image,
      status: project.status,
      featured: project.featured,
    })
    setDialogOpen(true)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.image) {
      onToast('Vui lòng tải ảnh đại diện cho dự án.')
      return
    }

    saveAdminProject({
      id: editingId ?? undefined,
      image: form.image,
      status: form.status,
      featured: form.featured,
      vi: {
        title: form.title.trim(),
        location: form.location.trim(),
        description: form.description.trim(),
      },
      en: {
        title: form.titleEn.trim() || form.title.trim(),
        location: form.locationEn.trim() || form.location.trim(),
        description: form.descriptionEn.trim() || form.description.trim(),
      },
    })

    setDialogOpen(false)
    setEditingId(null)
    onToast(editingId ? 'Đã cập nhật dự án.' : 'Đã thêm dự án mới.')
  }

  function confirmDelete() {
    if (!deletingProject) return
    deleteAdminProject(deletingProject.id)
    setDeletingProject(null)
    onToast('Đã xóa dự án khỏi dữ liệu quản trị.')
  }

  return (
    <>
      <AdminPageHeading
        title="Quản lý dự án"
        description="Quản lý hồ sơ dự án song ngữ, ảnh đại diện và vị trí hiển thị trên website."
        action={(
          <button className="admin-button admin-button--primary" type="button" onClick={openCreateDialog}>
            <Plus size={17} weight="bold" /> Thêm dự án
          </button>
        )}
      />

      <ContentToolbar
        value={search}
        onChange={setSearch}
        placeholder="Tìm theo tên, địa điểm hoặc mô tả dự án..."
        count={filteredProjects.length}
        unit="dự án"
      />

      <AdminPanel className="admin-table-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Hình ảnh</th>
                <th>Tên dự án</th>
                <th>Địa điểm</th>
                <th className="admin-table__cell--center">Trạng thái</th>
                <th className="admin-table__cell--center">Hiển thị</th>
                <th className="admin-table__cell--actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => (
                <tr key={project.id}>
                  <td><ContentThumbnail src={project.image} alt={project.title} /></td>
                  <td>
                    <strong>{project.title}</strong>
                    <small>{project.description || 'Chưa có mô tả dự án.'}</small>
                  </td>
                  <td>{project.location || 'Chưa cập nhật'}</td>
                  <td className="admin-table__cell--center"><AdminStatus>{publishStatusLabel(project.status)}</AdminStatus></td>
                  <td className="admin-table__cell--center"><AdminStatus>{project.featured ? 'Nổi bật' : 'Thông thường'}</AdminStatus></td>
                  <td className="admin-table__cell--actions">
                    <RowActions
                      label={project.title}
                      onEdit={() => openEditDialog(project)}
                      onDelete={() => setDeletingProject(project)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProjects.length === 0 ? (
            <ContentEmpty icon={<Buildings size={31} />} text="Chưa có dự án quản trị phù hợp." />
          ) : null}
        </div>
      </AdminPanel>

      {dialogOpen ? (
        <ContentDialog
          title={editingId ? 'Cập nhật dự án' : 'Thêm dự án mới'}
          description="Các trường tiếng Anh để trống sẽ tự dùng nội dung tiếng Việt."
          onClose={() => setDialogOpen(false)}
        >
          <form onSubmit={submit}>
            <div className="admin-dialog__body">
              <div className="admin-form-grid admin-form-grid--two">
                <TextField label="Tên dự án (VI)" value={form.title} onChange={(value) => update('title', value)} required />
                <TextField label="Project name (EN)" value={form.titleEn} onChange={(value) => update('titleEn', value)} />
              </div>
              <div className="admin-form-grid admin-form-grid--two">
                <TextField label="Địa điểm (VI)" value={form.location} onChange={(value) => update('location', value)} required />
                <TextField label="Location (EN)" value={form.locationEn} onChange={(value) => update('locationEn', value)} />
              </div>
              <div className="admin-form-grid admin-form-grid--two">
                <TextAreaField label="Mô tả dự án (VI)" value={form.description} onChange={(value) => update('description', value)} required />
                <TextAreaField label="Project description (EN)" value={form.descriptionEn} onChange={(value) => update('descriptionEn', value)} />
              </div>
              <div className="admin-form-grid admin-form-grid--two">
                <SelectField
                  label="Trạng thái"
                  value={form.status}
                  onChange={(value) => update('status', value as AdminPublishStatus)}
                  options={publishStatusOptions}
                  required
                />
                <label className="admin-check-field">
                  <input type="checkbox" checked={form.featured} onChange={(event) => update('featured', event.target.checked)} />
                  <span>Ưu tiên dự án trong khu vực nổi bật</span>
                </label>
              </div>
              <div className="admin-field">
                <AdminImageUpload
                  id="admin-project-cover"
                  label="Ảnh đại diện dự án"
                  value={form.image}
                  onChange={(value) => update('image', value)}
                  helper="Ảnh này hiển thị trên card dự án tại trang chủ và trang Dự án."
                  required
                />
              </div>
            </div>
            <DialogFooter onCancel={() => setDialogOpen(false)} />
          </form>
        </ContentDialog>
      ) : null}

      {deletingProject ? (
        <DeleteDialog
          title="Xóa dự án?"
          description={`“${deletingProject.title}” sẽ bị gỡ khỏi cả nội dung tiếng Việt và tiếng Anh.`}
          onCancel={() => setDeletingProject(null)}
          onConfirm={confirmDelete}
        />
      ) : null}
    </>
  )
}

const publishStatusOptions = [
  { value: 'DRAFT', label: 'Bản nháp - chưa hiển thị' },
  { value: 'PUBLISHED', label: 'Đã xuất bản' },
]

function ContentToolbar({
  value,
  onChange,
  placeholder,
  count,
  unit,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  count: number
  unit: string
}) {
  return (
    <AdminPanel className="admin-toolbar">
      <label>
        <MagnifyingGlass size={17} />
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      </label>
      <span>{count} {unit}</span>
    </AdminPanel>
  )
}

function ContentThumbnail({ src, alt }: { src: string; alt: string }) {
  return (
    <span className="admin-product-thumb">
      <img src={src} alt={alt} />
    </span>
  )
}

function RowActions({
  label,
  onEdit,
  onDelete,
}: {
  label: string
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="admin-row-actions">
      <button type="button" onClick={onEdit} aria-label={`Sửa ${label}`}><PencilSimple size={17} /></button>
      <button type="button" className="is-danger" onClick={onDelete} aria-label={`Xóa ${label}`}><Trash size={17} /></button>
    </div>
  )
}

function ContentEmpty({ icon, text }: { icon: ReactNode; text: string }) {
  return <div className="admin-empty">{icon}<p>{text}</p></div>
}

function ContentDialog({
  title,
  description,
  onClose,
  children,
}: {
  title: string
  description: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="admin-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="admin-dialog admin-dialog--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-content-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div><h2 id="admin-content-dialog-title">{title}</h2><p>{description}</p></div>
          <button type="button" onClick={onClose} aria-label="Đóng"><X size={19} /></button>
        </header>
        {children}
      </section>
    </div>
  )
}

function DialogFooter({ onCancel }: { onCancel: () => void }) {
  return (
    <footer>
      <button className="admin-button" type="button" onClick={onCancel}>Hủy</button>
      <button className="admin-button admin-button--primary" type="submit">
        <FloppyDisk size={17} /> Lưu thay đổi
      </button>
    </footer>
  )
}

function DeleteDialog({
  title,
  description,
  onCancel,
  onConfirm,
}: {
  title: string
  description: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="admin-dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        className="admin-dialog admin-dialog--confirm"
        role="alertdialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header><div><h2>{title}</h2><p>{description}</p></div></header>
        <footer>
          <button className="admin-button" type="button" onClick={onCancel}>Giữ lại</button>
          <button className="admin-button admin-button--danger" type="button" onClick={onConfirm}>
            <Trash size={17} /> Xóa dữ liệu
          </button>
        </footer>
      </section>
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  required = false,
  helper,
  type = 'text',
  min,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  helper?: string
  type?: 'text' | 'date' | 'number'
  min?: string
}) {
  return (
    <label className="admin-field">
      <span>{label}{required ? <b>*</b> : null}</span>
      <input type={type} min={min} value={value} onChange={(event) => onChange(event.target.value)} required={required} />
      {helper ? <small>{helper}</small> : null}
    </label>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  required = false,
  helper,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  helper?: string
}) {
  return (
    <label className="admin-field">
      <span>{label}{required ? <b>*</b> : null}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} required={required} />
      {helper ? <small>{helper}</small> : null}
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  required?: boolean
}) {
  return (
    <label className="admin-field">
      <span>{label}{required ? <b>*</b> : null}</span>
      <AdminSelect value={value} onChange={onChange} options={options} required={required} aria-label={label} />
    </label>
  )
}

function publishStatusLabel(status: AdminPublishStatus) {
  return status === 'PUBLISHED' ? 'Đã xuất bản' : 'Bản nháp'
}

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase('vi')
}

function splitLines(value: string) {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
}

function splitTags(value: string) {
  return value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean)
}

function joinLines(values: string[]) {
  return values.join('\n')
}

function mergeManagedNews(language: 'vi' | 'en'): AdminNewsArticle[] {
  const customArticles = getAdminNewsArticles(language, true)
  const customSlugs = new Set(customArticles.map((article) => article.slug))
  const hiddenSlugs = new Set(getHiddenAdminNewsSlugs())
  const builtInArticles = newsArticles[language]
    .filter((article) => !customSlugs.has(article.slug) && !hiddenSlugs.has(article.slug))
    .map((article) => ({ ...article, status: 'PUBLISHED' as const }))
  return [...customArticles, ...builtInArticles]
}
