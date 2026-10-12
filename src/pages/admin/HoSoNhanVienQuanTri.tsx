import {
  BriefcaseBusiness,
  ChevronRight,
  CircleCheck,
  CircleUserRound,
  Eye,
  EyeOff,
  KeyRound,
  Landmark,
  LockKeyhole,
  Pencil,
  X,
} from 'lucide-react'
import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react'
import {
  changeAdminOwnPassword,
  getAdminOwnProfile,
  updateAdminOwnProfile,
  type AdminOwnProfile,
} from '../../services/admin-profile.service'
import { AdminModalPortal, AdminPageHeading } from './ThanhPhanCoBanQuanTri'
import type { AdminSession } from './XacThucQuanTri'

type ProfileTab = 'account' | 'work' | 'bank'
type ProfileDraft = Pick<
  AdminOwnProfile,
  | 'fullName'
  | 'phone'
  | 'workEmail'
  | 'bankName'
  | 'bankAccountNumber'
  | 'bankAccountHolder'
  | 'bankBranch'
>

const profileTabs: Array<{ id: ProfileTab; label: string }> = [
  { id: 'account', label: 'Thông tin tài khoản' },
  { id: 'work', label: 'Thông tin công việc' },
  { id: 'bank', label: 'Thông tin ngân hàng' },
]

function toDraft(profile: AdminOwnProfile): ProfileDraft {
  return {
    fullName: profile.fullName,
    phone: profile.phone,
    workEmail: profile.workEmail,
    bankName: profile.bankName,
    bankAccountNumber: profile.bankAccountNumber,
    bankAccountHolder: profile.bankAccountHolder,
    bankBranch: profile.bankBranch,
  }
}

function createFallbackProfile(session: AdminSession): AdminOwnProfile {
  return {
    fullName: session.name,
    email: session.email,
    avatarUrl: '',
    phone: '',
    workEmail: '',
    employeeCode: '',
    department: '',
    directManager: '',
    joinedAt: '',
    workBranch: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountHolder: '',
    bankBranch: '',
    roleName: session.roleName,
    isActive: true,
    lastLoginAt: '',
    passwordConfigured: true,
    permissions: session.permissions,
  }
}

function profileValue(value: string | null | undefined) {
  return value?.trim() || '—'
}

function formatDate(value: string) {
  if (!value) return '—'
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed)
}

function formatLastLogin(value: string) {
  if (!value) return 'Chưa có dữ liệu'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Chưa có dữ liệu'
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed).replace(',', ' •')
}

function maskAccountNumber(value: string) {
  const normalized = value.replace(/\s/g, '')
  if (!normalized) return '—'
  return `•••• ${normalized.slice(-4)}`
}

function profileInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return (words.length > 1 ? words.slice(-2) : words.slice(0, 1))
    .map((word) => word.charAt(0).toLocaleUpperCase('vi-VN'))
    .join('') || 'CM'
}

export function AdminEmployeeProfileView({
  session,
  onUpdated,
}: {
  session: AdminSession
  onUpdated: (profile: AdminOwnProfile) => void
}) {
  const [profile, setProfile] = useState<AdminOwnProfile>(() => createFallbackProfile(session))
  const [draft, setDraft] = useState<ProfileDraft>(() => toDraft(createFallbackProfile(session)))
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<ProfileTab>('account')
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const passwordCurrentId = useId()
  const passwordNextId = useId()
  const passwordConfirmId = useId()

  useEffect(() => {
    let isCurrent = true

    void getAdminOwnProfile()
      .then(({ profile: nextProfile }) => {
        if (!isCurrent) return
        setProfile(nextProfile)
        setDraft(toDraft(nextProfile))
      })
      .catch((error: unknown) => {
        if (!isCurrent) return
        setErrorMessage(error instanceof Error ? error.message : 'Không thể tải thông tin tài khoản.')
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  useEffect(() => {
    if (!isEditorOpen && !isPasswordDialogOpen) return undefined

    const originalOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (isPasswordDialogOpen && !isChangingPassword) setIsPasswordDialogOpen(false)
      else if (isEditorOpen && !isSaving) setIsEditorOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isChangingPassword, isEditorOpen, isPasswordDialogOpen, isSaving])

  useEffect(() => {
    if (!successMessage) return undefined
    const timer = window.setTimeout(() => setSuccessMessage(null), 3200)
    return () => window.clearTimeout(timer)
  }, [successMessage])

  function openEditor(tab: ProfileTab) {
    setErrorMessage(null)
    setDraft(toDraft(profile))
    setActiveTab(tab)
    setIsEditorOpen(true)
  }

  function closeEditor() {
    if (!isSaving) setIsEditorOpen(false)
  }

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    setIsSaving(true)
    try {
      const { profile: nextProfile } = await updateAdminOwnProfile(draft)
      setProfile(nextProfile)
      setDraft(toDraft(nextProfile))
      onUpdated(nextProfile)
      setSuccessMessage('Đã cập nhật thông tin cá nhân.')
      setIsEditorOpen(false)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể cập nhật thông tin tài khoản.')
    } finally {
      setIsSaving(false)
    }
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const currentPassword = String(values.get('currentPassword') ?? '')
    const newPassword = String(values.get('newPassword') ?? '')
    const confirmPassword = String(values.get('confirmPassword') ?? '')

    if (newPassword !== confirmPassword) {
      setPasswordError('Xác nhận mật khẩu mới chưa khớp.')
      return
    }

    setPasswordError(null)
    setIsChangingPassword(true)
    try {
      await changeAdminOwnPassword({ currentPassword, newPassword })
      setSuccessMessage('Đã thay đổi mật khẩu.')
      setIsPasswordDialogOpen(false)
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Không thể thay đổi mật khẩu.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <section className="admin-employee-profile" aria-busy={isLoading}>
      <AdminPageHeading
        title="Thông tin cá nhân"
        description="Quản lý thông tin cá nhân, thông tin công việc, tài khoản và bảo mật của bạn."
      />

      {errorMessage && !isEditorOpen ? (
        <p className="admin-employee-profile__error" role="alert">{errorMessage}</p>
      ) : null}

      <section className="admin-profile-identity">
        <ProfileAvatar name={profile.fullName} avatarUrl={profile.avatarUrl} />
        <div className="admin-profile-identity__copy">
          <div>
            <h2>{profile.fullName}</h2>
            <span className={`admin-profile-status${profile.isActive ? ' is-active' : ''}`}>
              <i aria-hidden="true" /> {profile.isActive ? 'Đang hoạt động' : 'Tạm ngưng'}
            </span>
          </div>
          <p>{profile.roleName}</p>
        </div>
        <button className="admin-button admin-button--primary admin-profile-identity__edit" type="button" onClick={() => openEditor('account')}>
          <Pencil size={16} aria-hidden="true" /> Chỉnh sửa hồ sơ
        </button>
      </section>

      <div className="admin-profile-grid">
        <ProfileCard icon={<CircleUserRound aria-hidden="true" />} title="Thông tin tài khoản" action="Chỉnh sửa" onEdit={() => openEditor('account')}>
          <ProfileRow label="Họ và tên" value={profile.fullName} />
          <ProfileRow label="Số điện thoại" value={profileValue(profile.phone)} />
          <ProfileRow label="Email đăng nhập" value={profile.email} />
          <ProfileRow label="Email công việc" value={profileValue(profile.workEmail)} />
        </ProfileCard>

        <ProfileCard icon={<BriefcaseBusiness aria-hidden="true" />} title="Thông tin công việc" action="Xem chi tiết" onEdit={() => openEditor('work')}>
          <ProfileRow label="Mã nhân viên" value={profileValue(profile.employeeCode)} />
          <ProfileRow label="Chức vụ" value={profile.roleName} />
          <ProfileRow label="Phòng ban" value={profileValue(profile.department)} />
          <ProfileRow label="Quản lý trực tiếp" value={profileValue(profile.directManager)} />
          <ProfileRow label="Ngày tham gia" value={formatDate(profile.joinedAt)} />
          <ProfileRow label="Chi nhánh làm việc" value={profileValue(profile.workBranch)} />
        </ProfileCard>

        <ProfileCard icon={<Landmark aria-hidden="true" />} title="Thông tin ngân hàng" action="Chỉnh sửa" onEdit={() => openEditor('bank')}>
          <ProfileRow label="Ngân hàng" value={profileValue(profile.bankName)} />
          <ProfileRow label="Số tài khoản" value={maskAccountNumber(profile.bankAccountNumber)} />
          <ProfileRow label="Chủ tài khoản" value={profileValue(profile.bankAccountHolder)} />
          <ProfileRow label="Chi nhánh" value={profileValue(profile.bankBranch)} />
        </ProfileCard>

        <ProfileCard icon={<LockKeyhole aria-hidden="true" />} title="Bảo mật tài khoản">
          <ProfileRow label="Mật khẩu" value={profile.passwordConfigured ? 'Đã thiết lập' : 'Chưa thiết lập'} />
          <ProfileRow label="Xác thực hai bước (2FA)" value="Chưa hỗ trợ" />
          <ProfileRow label="Đăng nhập gần nhất" value={formatLastLogin(profile.lastLoginAt)} />
          <div className="admin-profile-card__footer">
            <button className="admin-button" type="button" onClick={() => {
              setPasswordError(null)
              setIsEditorOpen(false)
              setIsPasswordDialogOpen(true)
            }}>
              <KeyRound size={16} aria-hidden="true" /> Đổi mật khẩu
            </button>
          </div>
        </ProfileCard>

      </div>

      {successMessage ? <div className="admin-profile-toast" role="status"><CircleCheck size={18} aria-hidden="true" /> {successMessage}</div> : null}

      {isEditorOpen ? (
        <AdminModalPortal>
          <div className="admin-profile-drawer-backdrop" role="presentation" onMouseDown={closeEditor}>
            <section className="admin-profile-drawer" role="dialog" aria-modal="true" aria-labelledby="admin-profile-editor-title" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div>
                <h2 id="admin-profile-editor-title">Chỉnh sửa thông tin cá nhân</h2>
                <p>Cập nhật thông tin cá nhân của bạn.</p>
              </div>
              <button type="button" onClick={closeEditor} disabled={isSaving} aria-label="Đóng chỉnh sửa thông tin cá nhân"><X size={20} /></button>
            </header>

            <form onSubmit={submitProfile}>
              <div className="admin-profile-tabs" role="tablist" aria-label="Nhóm thông tin hồ sơ">
                {profileTabs.map((tab) => (
                  <button key={tab.id} id={`admin-profile-tab-${tab.id}`} type="button" role="tab" aria-selected={activeTab === tab.id} aria-controls={`admin-profile-panel-${tab.id}`} tabIndex={activeTab === tab.id ? 0 : -1} className={activeTab === tab.id ? 'is-active' : ''} onClick={() => setActiveTab(tab.id)}>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="admin-profile-drawer__body">
                {activeTab === 'account' ? (
                  <div id="admin-profile-panel-account" role="tabpanel" aria-labelledby="admin-profile-tab-account" className="admin-profile-form-grid">
                    <div className="admin-profile-avatar-editor">
                      <ProfileAvatar name={profile.fullName} avatarUrl={profile.avatarUrl} />
                      <div>
                        <strong>Ảnh đại diện</strong>
                        <p>{profile.avatarUrl ? 'Ảnh đang dùng được lấy từ hồ sơ tài khoản.' : 'Chưa có ảnh đại diện, hệ thống đang dùng chữ viết tắt.'}</p>
                      </div>
                    </div>
                    <ProfileInput label="Họ và tên" required value={draft.fullName} onChange={(value) => setDraft((current) => ({ ...current, fullName: value }))} disabled={isSaving} autoComplete="name" />
                    <ProfileInput label="Số điện thoại" type="tel" value={draft.phone} onChange={(value) => setDraft((current) => ({ ...current, phone: value }))} disabled={isSaving} autoComplete="tel" />
                    <ProfileInput label="Email đăng nhập" value={profile.email} disabled helper="Email đăng nhập được quản lý bởi quản trị viên." />
                    <ProfileInput label="Email công việc" type="email" value={draft.workEmail} onChange={(value) => setDraft((current) => ({ ...current, workEmail: value }))} disabled={isSaving} autoComplete="email" />
                  </div>
                ) : null}

                {activeTab === 'work' ? (
                  <div id="admin-profile-panel-work" role="tabpanel" aria-labelledby="admin-profile-tab-work" className="admin-profile-form-grid">
                    <p className="admin-profile-readonly-note">Thông tin công việc được quản lý bởi quản trị viên.</p>
                    <ProfileInput label="Mã nhân viên" value={profileValue(profile.employeeCode)} disabled />
                    <ProfileInput label="Chức vụ" value={profile.roleName} disabled />
                    <ProfileInput label="Phòng ban" value={profileValue(profile.department)} disabled />
                    <ProfileInput label="Quản lý trực tiếp" value={profileValue(profile.directManager)} disabled />
                    <ProfileInput label="Ngày tham gia" value={formatDate(profile.joinedAt)} disabled />
                    <ProfileInput label="Chi nhánh làm việc" value={profileValue(profile.workBranch)} disabled />
                  </div>
                ) : null}

                {activeTab === 'bank' ? (
                  <div id="admin-profile-panel-bank" role="tabpanel" aria-labelledby="admin-profile-tab-bank" className="admin-profile-form-grid">
                    <p className="admin-profile-readonly-note">Thông tin này chỉ hiển thị cho tài khoản của bạn và được dùng cho công tác nội bộ khi cần.</p>
                    <ProfileInput label="Ngân hàng" value={draft.bankName} onChange={(value) => setDraft((current) => ({ ...current, bankName: value }))} disabled={isSaving} />
                    <ProfileInput label="Số tài khoản" value={draft.bankAccountNumber} onChange={(value) => setDraft((current) => ({ ...current, bankAccountNumber: value }))} disabled={isSaving} inputMode="numeric" />
                    <ProfileInput label="Chủ tài khoản" value={draft.bankAccountHolder} onChange={(value) => setDraft((current) => ({ ...current, bankAccountHolder: value }))} disabled={isSaving} />
                    <ProfileInput label="Chi nhánh" value={draft.bankBranch} onChange={(value) => setDraft((current) => ({ ...current, bankBranch: value }))} disabled={isSaving} />
                  </div>
                ) : null}

                {errorMessage ? <p className="admin-employee-profile__error" role="alert">{errorMessage}</p> : null}
              </div>

              <footer>
                <button className="admin-button" type="button" onClick={closeEditor} disabled={isSaving}>Hủy</button>
                <button className="admin-button admin-button--primary" type="submit" disabled={isSaving}>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
              </footer>
            </form>
            </section>
          </div>
        </AdminModalPortal>
      ) : null}

      {isPasswordDialogOpen ? (
        <AdminModalPortal>
          <div className="admin-dialog-backdrop admin-profile-password-backdrop" role="presentation" onMouseDown={() => { if (!isChangingPassword) setIsPasswordDialogOpen(false) }}>
            <section className="admin-dialog admin-profile-password-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-profile-password-title" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div>
                <h2 id="admin-profile-password-title">Đổi mật khẩu</h2>
                <p>Dùng mật khẩu nội bộ mới để bảo vệ tài khoản của bạn.</p>
              </div>
              <button type="button" onClick={() => setIsPasswordDialogOpen(false)} disabled={isChangingPassword} aria-label="Đóng đổi mật khẩu"><X size={20} /></button>
            </header>
            <form onSubmit={submitPassword}>
              <div className="admin-dialog__body admin-profile-password-form">
                <PasswordField id={passwordCurrentId} name="currentPassword" label="Mật khẩu hiện tại" visible={isPasswordVisible} onToggle={() => setIsPasswordVisible((current) => !current)} disabled={isChangingPassword} autoComplete="current-password" />
                <PasswordField id={passwordNextId} name="newPassword" label="Mật khẩu mới" visible={isPasswordVisible} onToggle={() => setIsPasswordVisible((current) => !current)} disabled={isChangingPassword} autoComplete="new-password" helper="Gồm chữ hoa, chữ thường và ký tự đặc biệt." />
                <PasswordField id={passwordConfirmId} name="confirmPassword" label="Xác nhận mật khẩu mới" visible={isPasswordVisible} onToggle={() => setIsPasswordVisible((current) => !current)} disabled={isChangingPassword} autoComplete="new-password" />
                {passwordError ? <p className="admin-employee-profile__error" role="alert">{passwordError}</p> : null}
              </div>
              <footer>
                <button className="admin-button" type="button" onClick={() => setIsPasswordDialogOpen(false)} disabled={isChangingPassword}>Hủy</button>
                <button className="admin-button admin-button--primary" type="submit" disabled={isChangingPassword}>{isChangingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}</button>
              </footer>
            </form>
            </section>
          </div>
        </AdminModalPortal>
      ) : null}
    </section>
  )
}

function ProfileAvatar({ name, avatarUrl }: { name: string; avatarUrl: string }) {
  return <span className="admin-profile-avatar" aria-label={`Ảnh đại diện của ${name}`}>{avatarUrl ? <img src={avatarUrl} alt="" /> : profileInitials(name)}</span>
}

function ProfileCard({ icon, title, children, action, onEdit, className = '' }: {
  icon: ReactNode
  title: string
  children: ReactNode
  action?: string
  onEdit?: () => void
  className?: string
}) {
  return (
    <article className={`admin-profile-card ${className}`}>
      <header>
        <h2>{icon}<span>{title}</span></h2>
        {action && onEdit ? <button type="button" onClick={onEdit}>{action} <ChevronRight size={16} aria-hidden="true" /></button> : null}
      </header>
      <div className="admin-profile-card__rows">{children}</div>
    </article>
  )
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return <div className="admin-profile-row"><span>{label}</span><strong>{value}</strong></div>
}

function ProfileInput({ label, value, onChange, disabled = false, helper, required = false, type = 'text', autoComplete, inputMode }: {
  label: string
  value: string
  onChange?: (value: string) => void
  disabled?: boolean
  helper?: string
  required?: boolean
  type?: 'text' | 'email' | 'tel'
  autoComplete?: string
  inputMode?: 'numeric'
}) {
  const id = useId()
  return (
    <label className="admin-field" htmlFor={id}>
      <span>{label}{required ? <b>*</b> : null}</span>
      <input id={id} type={type} value={value} onChange={(event) => onChange?.(event.target.value)} disabled={disabled} required={required} autoComplete={autoComplete} inputMode={inputMode} />
      {helper ? <small>{helper}</small> : null}
    </label>
  )
}

function PasswordField({ id, name, label, visible, onToggle, disabled, autoComplete, helper }: {
  id: string
  name: string
  label: string
  visible: boolean
  onToggle: () => void
  disabled: boolean
  autoComplete: string
  helper?: string
}) {
  return (
    <label className="admin-field" htmlFor={id}>
      <span>{label}<b>*</b></span>
      <div className="admin-password-input">
        <input id={id} name={name} type={visible ? 'text' : 'password'} required disabled={disabled} autoComplete={autoComplete} maxLength={128} />
        <button className="admin-password-input__toggle" type="button" onClick={onToggle} disabled={disabled} aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>
      </div>
      {helper ? <small>{helper}</small> : null}
    </label>
  )
}
