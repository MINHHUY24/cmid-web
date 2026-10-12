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
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import {
  newsCategoryKeys,
  type ArticleCategoryKey,
} from '../../content/news-articles'
import { AdminImageUpload } from './TaiAnhLenQuanTri'
import { AdminBangKhungXuong, AdminModalPortal, AdminPageHeading, AdminPanel, AdminSelect } from './ThanhPhanCoBanQuanTri'
import { isAdminDemoEnabled } from './XacThucMauQuanTri'
import {
  deleteProject,
  getAdminProjects as getAdminProjectsFromApi,
  resolveProjectImage,
  saveProject,
  type Project,
} from '../../services/project.service'
import {
  deleteNewsArticle,
  getAdminNewsArticles as getAdminNewsArticlesFromApi,
  resolveNewsImage,
  saveNewsArticle,
  type NewsStatus,
  type NewsArticleRecord,
} from '../../services/news.service'

type AdminPublishStatus = NewsStatus

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
  content: string
  contentEn: string
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
  content: '',
  contentEn: '',
  image: '',
  status: 'DRAFT',
  featured: false,
}

export function AdminNewsView({ onToast }: AdminContentViewProps) {
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingArticle, setDeletingArticle] = useState<NewsArticleRecord | null>(null)
  const [form, setForm] = useState<NewsFormState>(createEmptyNewsForm)
  const [articles, setArticles] = useState<NewsArticleRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [updatingArticleId, setUpdatingArticleId] = useState<string | null>(null)

  const loadNews = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      setArticles(await getAdminNewsArticlesFromApi(isAdminDemoEnabled))
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : 'Không thể tải danh sách bài viết.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { void loadNews() }, 0)
    return () => {
      window.clearTimeout(initialLoad)
    }
  }, [loadNews])

  const filteredArticles = useMemo(() => {
    const query = normalizeSearch(search)
    if (!query) return articles

    return articles.filter((article) =>
      [article.title, article.summary, article.slug, getAdminCategoryLabel(article.category)]
        .some((value) => normalizeSearch(value).includes(query)),
    )
  }, [articles, search])

  function update<K extends keyof NewsFormState>(key: K, value: NewsFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function openCreateDialog() {
    setEditingId(null)
    setForm(createEmptyNewsForm())
    setDialogOpen(true)
  }

  function openEditDialog(article: NewsArticleRecord) {
    setEditingId(article.id)
    setForm({
      title: article.title,
      titleEn: article.titleEn ?? '',
      summary: article.summary,
      summaryEn: article.summaryEn ?? '',
      body: joinLines(toStringArray(article.body)),
      bodyEn: joinLines(toStringArray(article.bodyEn)),
      highlights: joinLines(toStringArray(article.highlights)),
      highlightsEn: joinLines(toStringArray(article.highlightsEn)),
      tags: toStringArray(article.tags).join(', '),
      tagsEn: toStringArray(article.tagsEn).join(', '),
      category: toArticleCategory(article.category),
      image: article.imageUrl,
      status: article.status,
      featured: article.isFeatured,
      publishedAt: article.publishedAt.slice(0, 10),
      readingMinutes: article.readingMinutes,
    })
    setDialogOpen(true)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.image) {
      onToast('Vui lòng tải ảnh bìa cho bài viết.')
      return
    }

    const existingArticle = articles.find((article) => article.id === editingId)

    try {
      await saveNewsArticle({
        id: editingId ?? undefined,
        slug: existingArticle?.slug ?? createNewsSlug(form.title),
        title: form.title.trim(),
        titleEn: form.titleEn.trim() || form.title.trim(),
        summary: form.summary.trim(),
        summaryEn: form.summaryEn.trim() || form.summary.trim(),
        body: splitLines(form.body),
        bodyEn: splitLines(form.bodyEn || form.body),
        highlights: splitLines(form.highlights),
        highlightsEn: splitLines(form.highlightsEn || form.highlights),
        tags: splitTags(form.tags),
        tagsEn: splitTags(form.tagsEn || form.tags),
        category: form.category,
        imageUrl: form.image,
        readingMinutes: form.readingMinutes,
        isFeatured: form.featured,
        status: form.status,
        publishedAt: new Date(`${form.publishedAt}T00:00:00.000Z`).toISOString(),
      }, isAdminDemoEnabled)

      await loadNews()
      setDialogOpen(false)
      setEditingId(null)
      onToast(editingId ? 'Đã cập nhật bài viết.' : 'Đã thêm bài viết mới.')
    } catch (error: unknown) {
      onToast(error instanceof Error ? error.message : 'Không thể lưu bài viết.')
    }
  }

  async function confirmDelete() {
    if (!deletingArticle) return
    try {
      await deleteNewsArticle(deletingArticle.id, isAdminDemoEnabled)
      await loadNews()
      setDeletingArticle(null)
      onToast('Đã xóa bài viết khỏi dữ liệu quản trị.')
    } catch (error: unknown) {
      onToast(error instanceof Error ? error.message : 'Không thể xóa bài viết.')
    }
  }

  async function updateArticleInline(
    article: NewsArticleRecord,
    updates: Pick<NewsArticleRecord, 'status' | 'isFeatured'>,
    successMessage: string,
  ) {
    if (updatingArticleId) return

    setUpdatingArticleId(article.id)
    try {
      await saveNewsArticle({
        id: article.id,
        slug: article.slug,
        title: article.title,
        titleEn: article.titleEn,
        summary: article.summary,
        summaryEn: article.summaryEn,
        body: toStringArray(article.body),
        bodyEn: toStringArray(article.bodyEn),
        highlights: toStringArray(article.highlights),
        highlightsEn: toStringArray(article.highlightsEn),
        tags: toStringArray(article.tags),
        tagsEn: toStringArray(article.tagsEn),
        category: toArticleCategory(article.category),
        imageUrl: article.imageUrl,
        readingMinutes: article.readingMinutes,
        isFeatured: updates.isFeatured,
        status: updates.status,
        publishedAt: article.publishedAt,
        sortOrder: article.sortOrder,
      }, isAdminDemoEnabled)
      await loadNews()
      onToast(successMessage)
    } catch (error: unknown) {
      onToast(error instanceof Error ? error.message : 'Không thể cập nhật bài viết.')
    } finally {
      setUpdatingArticleId(null)
    }
  }

  async function updateArticleStatus(article: NewsArticleRecord, status: AdminPublishStatus) {
    if (article.status === status) return
    await updateArticleInline(
      article,
      { status, isFeatured: article.isFeatured },
      `Đã cập nhật trạng thái bài viết “${article.title}”.`,
    )
  }

  async function updateArticleFeatured(article: NewsArticleRecord, isFeatured: boolean) {
    if (article.isFeatured === isFeatured) return
    await updateArticleInline(
      article,
      { status: article.status, isFeatured },
      `Đã chuyển bài viết “${article.title}” thành ${isFeatured ? 'nổi bật' : 'thông thường'}.`,
    )
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

      <section className="admin-searchable-workspace" aria-label="Danh sách bài viết">
        <ContentToolbar
          value={search}
          onChange={setSearch}
          placeholder="Tìm theo tiêu đề, nội dung hoặc chuyên mục..."
          totalCount={isLoading ? undefined : articles.length}
          totalLabel="Tổng số bài viết"
        />

        <AdminPanel className="admin-table-panel admin-searchable-table-panel">
          {isLoading ? <AdminBangKhungXuong columns={7} label="Đang tải danh sách bài viết" /> : (
            <div className="admin-table-wrap admin-searchable-table-wrap">
            <table className="admin-table admin-table--sticky-heading">
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
                  <td><ContentThumbnail src={resolveNewsImage(article.imageUrl)} alt={article.title} /></td>
                  <td>
                    <strong>{article.title}</strong>
                    <small>{article.summary}</small>
                  </td>
                  <td>{getAdminCategoryLabel(article.category)}</td>
                  <td>{formatAdminDate(article.publishedAt)}</td>
                  <td className="admin-table__cell--center">
                    <AdminSelect
                      className="admin-inline-select"
                      value={article.status}
                      onChange={(value) => void updateArticleStatus(article, value as AdminPublishStatus)}
                      options={inlinePublishStatusOptions}
                      disabled={updatingArticleId !== null}
                      aria-label={`Cập nhật trạng thái ${article.title}`}
                    />
                  </td>
                  <td className="admin-table__cell--center">
                    <AdminSelect
                      className="admin-inline-select admin-featured-select"
                      value={article.isFeatured ? 'FEATURED' : 'STANDARD'}
                      onChange={(value) => void updateArticleFeatured(article, value === 'FEATURED')}
                      options={inlineFeaturedOptions}
                      disabled={updatingArticleId !== null}
                      aria-label={`Cập nhật hiển thị ${article.title}`}
                    />
                  </td>
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
            <ContentEmpty icon={<Newspaper size={31} />} text={loadError ?? 'Chưa có bài viết quản trị phù hợp.'} />
          ) : null}
            </div>
          )}
        </AdminPanel>
      </section>

      {dialogOpen ? (
        <ContentDialog
          title={editingId ? 'Cập nhật bài viết' : 'Thêm bài viết mới'}
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
                <TextAreaField label="Nội dung bài viết (VI)" value={form.body} onChange={(value) => update('body', value)} helper="Mỗi dòng là một đoạn. Dùng ## hoặc ### ở đầu dòng để tạo tiêu đề mục." required />
                <TextAreaField label="Article content (EN)" value={form.bodyEn} onChange={(value) => update('bodyEn', value)} helper="Each line becomes one paragraph. Start a line with ## or ### for a section heading." />
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
                  value={resolveNewsImage(form.image)}
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
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)
  const [form, setForm] = useState<ProjectFormState>(emptyProjectForm)
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [updatingProjectId, setUpdatingProjectId] = useState<string | null>(null)

  const loadProjects = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      setProjects(await getAdminProjectsFromApi(isAdminDemoEnabled))
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : 'Không thể tải danh sách dự án.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { void loadProjects() }, 0)
    return () => {
      window.clearTimeout(initialLoad)
    }
  }, [loadProjects])

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

  function openEditDialog(project: Project) {
    setEditingId(project.id)
    setForm({
      title: project.title,
      titleEn: project.titleEn ?? '',
      location: project.location,
      locationEn: project.locationEn ?? '',
      description: project.description,
      descriptionEn: project.descriptionEn ?? '',
      content: project.content,
      contentEn: project.contentEn ?? '',
      image: project.imageUrl,
      status: project.status,
      featured: project.isFeatured,
    })
    setDialogOpen(true)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.image) {
      onToast('Vui lòng tải ảnh đại diện cho dự án.')
      return
    }

    const existingProject = projects.find((project) => project.id === editingId)

    try {
      await saveProject({
        id: editingId ?? undefined,
        slug: existingProject?.slug ?? createProjectSlug(form.title),
        title: form.title.trim(),
        titleEn: form.titleEn.trim() || form.title.trim(),
        location: form.location.trim(),
        locationEn: form.locationEn.trim() || form.location.trim(),
        description: form.description.trim(),
        descriptionEn: form.descriptionEn.trim() || form.description.trim(),
        content: form.content.trim(),
        contentEn: form.contentEn.trim() || form.content.trim(),
        imageUrl: form.image,
        status: form.status,
        isFeatured: form.featured,
        sortOrder: existingProject?.sortOrder ?? projects.length + 1,
      }, isAdminDemoEnabled)

      await loadProjects()
      setDialogOpen(false)
      setEditingId(null)
      onToast(editingId ? 'Đã cập nhật dự án.' : 'Đã thêm dự án mới.')
    } catch (error: unknown) {
      onToast(error instanceof Error ? error.message : 'Không thể lưu dự án.')
    }
  }

  async function confirmDelete() {
    if (!deletingProject) return
    try {
      await deleteProject(deletingProject.id, isAdminDemoEnabled)
      await loadProjects()
      setDeletingProject(null)
      onToast('Đã xóa dự án khỏi dữ liệu quản trị.')
    } catch (error: unknown) {
      onToast(error instanceof Error ? error.message : 'Không thể xóa dự án.')
    }
  }

  async function updateProjectInline(
    project: Project,
    updates: Pick<Project, 'status' | 'isFeatured'>,
    successMessage: string,
  ) {
    if (updatingProjectId) return

    setUpdatingProjectId(project.id)
    try {
      await saveProject({
        id: project.id,
        slug: project.slug,
        title: project.title,
        titleEn: project.titleEn,
        location: project.location,
        locationEn: project.locationEn,
        description: project.description,
        descriptionEn: project.descriptionEn,
        content: project.content,
        contentEn: project.contentEn,
        imageUrl: project.imageUrl,
        status: updates.status,
        isFeatured: updates.isFeatured,
        sortOrder: project.sortOrder,
      }, isAdminDemoEnabled)
      await loadProjects()
      onToast(successMessage)
    } catch (error: unknown) {
      onToast(error instanceof Error ? error.message : 'Không thể cập nhật dự án.')
    } finally {
      setUpdatingProjectId(null)
    }
  }

  async function updateProjectStatus(project: Project, status: AdminPublishStatus) {
    if (project.status === status) return
    await updateProjectInline(
      project,
      { status, isFeatured: project.isFeatured },
      `Đã cập nhật trạng thái dự án “${project.title}”.`,
    )
  }

  async function updateProjectFeatured(project: Project, isFeatured: boolean) {
    if (project.isFeatured === isFeatured) return
    await updateProjectInline(
      project,
      { status: project.status, isFeatured },
      `Đã chuyển dự án “${project.title}” thành ${isFeatured ? 'nổi bật' : 'thông thường'}.`,
    )
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

      <section className="admin-searchable-workspace" aria-label="Danh sách dự án">
        <ContentToolbar
          value={search}
          onChange={setSearch}
          placeholder="Tìm theo tên, địa điểm hoặc mô tả dự án..."
          totalCount={isLoading ? undefined : projects.length}
          totalLabel="Tổng số dự án"
        />

        <AdminPanel className="admin-table-panel admin-searchable-table-panel">
          {isLoading ? <AdminBangKhungXuong columns={6} label="Đang tải danh sách dự án" /> : (
            <div className="admin-table-wrap admin-searchable-table-wrap">
              <table className="admin-table admin-table--sticky-heading">
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
                    <td><ContentThumbnail src={resolveProjectImage(project.imageUrl)} alt={project.title} /></td>
                    <td>
                      <strong>{project.title}</strong>
                      <small>{project.description || 'Chưa có mô tả dự án.'}</small>
                    </td>
                    <td>{project.location || 'Chưa cập nhật'}</td>
                    <td className="admin-table__cell--center">
                      <AdminSelect
                        className="admin-inline-select"
                        value={project.status}
                        onChange={(value) => void updateProjectStatus(project, value as AdminPublishStatus)}
                        options={inlinePublishStatusOptions}
                        disabled={updatingProjectId !== null}
                        aria-label={`Cập nhật trạng thái ${project.title}`}
                      />
                    </td>
                    <td className="admin-table__cell--center">
                      <AdminSelect
                        className="admin-inline-select admin-featured-select"
                        value={project.isFeatured ? 'FEATURED' : 'STANDARD'}
                        onChange={(value) => void updateProjectFeatured(project, value === 'FEATURED')}
                        options={inlineFeaturedOptions}
                        disabled={updatingProjectId !== null}
                        aria-label={`Cập nhật hiển thị ${project.title}`}
                      />
                    </td>
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
              <ContentEmpty
                icon={<Buildings size={31} />}
                text={loadError ?? 'Chưa có dự án quản trị phù hợp.'}
              />
            ) : null}
            </div>
          )}
        </AdminPanel>
      </section>

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
                <TextAreaField label="Nội dung chi tiết (VI)" value={form.content} onChange={(value) => update('content', value)} helper="Tách các đoạn bằng một dòng trống. Dùng ## hoặc ### để tạo tiêu đề mục." required />
                <TextAreaField label="Project details (EN)" value={form.contentEn} onChange={(value) => update('contentEn', value)} helper="Separate paragraphs with a blank line. Use ## or ### for section headings." />
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

const inlinePublishStatusOptions = [
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'PUBLISHED', label: 'Đã xuất bản' },
]

const inlineFeaturedOptions = [
  { value: 'FEATURED', label: 'Nổi bật' },
  { value: 'STANDARD', label: 'Thông thường' },
]

function ContentToolbar({
  value,
  onChange,
  placeholder,
  count,
  unit,
  totalCount,
  totalLabel,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  count?: number
  unit?: string
  totalCount?: number
  totalLabel?: string
}) {
  const hasTotal = typeof totalCount === 'number' && Boolean(totalLabel)

  return (
    <AdminPanel className={`admin-toolbar${hasTotal ? ' admin-content-toolbar' : ''}`}>
      <label className={hasTotal ? 'admin-content-toolbar__search' : undefined}>
        <MagnifyingGlass size={17} />
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      </label>
      {hasTotal ? <span className="admin-content-toolbar__total" aria-live="polite">{totalLabel}: <strong>{totalCount}</strong></span> : typeof count === 'number' && unit ? <span>{count} {unit}</span> : null}
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
    <AdminModalPortal>
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
    </AdminModalPortal>
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
    <AdminModalPortal>
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
    </AdminModalPortal>
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

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase('vi')
}

function createProjectSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('vi')
    .trim()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function createNewsSlug(value: string) {
  return createProjectSlug(value) || `bai-viet-${Date.now()}`
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

function toStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function toArticleCategory(value: string): ArticleCategoryKey {
  return articleCategories.includes(value as ArticleCategoryKey)
    ? value as ArticleCategoryKey
    : 'cmid-news'
}

function getAdminCategoryLabel(value: string) {
  return categoryLabels[toArticleCategory(value)]
}

function formatAdminDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeZone: 'UTC' }).format(date)
}
