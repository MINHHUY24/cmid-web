import {
  Buildings,
  CalendarBlank,
  Camera,
  CaretDown,
  Check,
  Coins,
  EnvelopeSimple,
  GenderFemale,
  GenderIntersex,
  GenderMale,
  Gift,
  House,
  HouseLine,
  MapPin,
  MapTrifold,
  MagnifyingGlass,
  Package,
  PencilSimple,
  Phone,
  SignOut,
  User,
} from '@phosphor-icons/react'
import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { KhungXuong } from '../components/common/KhungXuong'
import type { AppLanguage, SiteContent } from '../content/site-content'
import { useLanguage } from '../contexts/NgonNguContext'
import { type CustomerProfile, useUser } from '../contexts/NguoiDungContext'
import type { AdminOrder } from './admin/admin-database'
import { getCustomerOrders } from '../services/order.service'
import { formatCurrency } from '../utils/formatCurrency'

type AccountSection = 'overview' | 'information' | 'orders' | 'gifts'
type AccountOrderFilter = 'all' | 'pending-confirmation' | 'awaiting-pickup' | 'awaiting-delivery' | 'delivered' | 'returned' | 'cancelled'

const ACCOUNT_SECTION_IDS = ['overview', 'information', 'orders', 'gifts'] as const satisfies readonly AccountSection[]
const ACCOUNT_ORDER_FILTER_IDS = ['all', 'pending-confirmation', 'awaiting-pickup', 'awaiting-delivery', 'delivered', 'returned', 'cancelled'] as const satisfies readonly AccountOrderFilter[]

const ORDER_FILTER_STATUSES: Record<Exclude<AccountOrderFilter, 'all'>, readonly AdminOrder['status'][]> = {
  'pending-confirmation': ['Chờ thanh toán', 'Thanh toán thất bại', 'Chờ xác nhận'],
  'awaiting-pickup': ['Đang xử lý', 'Chờ lấy hàng'],
  'awaiting-delivery': ['Chờ giao hàng', 'Đang giao'],
  delivered: ['Hoàn thành'],
  returned: ['Đã trả hàng'],
  cancelled: ['Đã hủy'],
}

type AccountProfileDropdownOption = {
  value: string
  label: string
  searchText?: string
}

type AdministrativeProvince = {
  idProvince: string
  name: string
}

type AdministrativeDistrict = {
  idProvince: string
  idDistrict: string
  name: string
}

type AdministrativeWard = {
  idDistrict: string
  idCommune: string
  name: string
}

type AdministrativeData = {
  provinces: AdministrativeProvince[]
  districts: AdministrativeDistrict[]
  wards: AdministrativeWard[]
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLocaleLowerCase('vi-VN')
    .trim()
}

function getAdministrativeDisplayName(value: string) {
  return value.replace(/^(?:Thành phố|Tỉnh|Quận|Huyện|Thị xã|Thị trấn|Phường|Xã)\s+/u, '')
}

function matchesAdministrativeValue(name: string, value: string) {
  const normalizedValue = normalizeSearchText(value)

  return Boolean(normalizedValue) && (
    normalizeSearchText(name) === normalizedValue ||
    normalizeSearchText(getAdministrativeDisplayName(name)) === normalizedValue
  )
}

function toAdministrativeOption(unit: { name: string }): AccountProfileDropdownOption {
  const label = getAdministrativeDisplayName(unit.name)

  return {
    value: label,
    label,
    searchText: unit.name,
  }
}

function formatProfileAddress(profile: CustomerProfile, language: AppLanguage, fallback: string) {
  const city = getAdministrativeDisplayName(profile.city.trim())
  const ward = getAdministrativeDisplayName(profile.ward.trim())
  const district = getAdministrativeDisplayName(profile.district.trim())
  const addressParts = [
    profile.address.trim(),
    ward ? (language === 'vi' ? `Phường ${ward}` : `Ward ${ward}`) : '',
    district ? (language === 'vi' ? `Quận ${district}` : `${district} District`) : '',
    city ? (language === 'vi' ? `TP. ${city}` : `${city} City`) : '',
  ].filter(Boolean)

  return addressParts.length ? addressParts.join(', ') : fallback
}

function parseAccountSection(value: string | null): AccountSection {
  return value !== null && ACCOUNT_SECTION_IDS.includes(value as AccountSection) ? value as AccountSection : 'overview'
}

function parseAccountOrderFilter(value: string | null): AccountOrderFilter {
  return value !== null && ACCOUNT_ORDER_FILTER_IDS.includes(value as AccountOrderFilter) ? value as AccountOrderFilter : 'all'
}

export function TrangTaiKhoanPage() {
  const { content, language } = useLanguage()
  const { user, profile, isAuthLoading, signOut, updateProfile } = useUser()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeSection = parseAccountSection(searchParams.get('section'))
  const orderFilter = parseAccountOrderFilter(searchParams.get('filter'))
  const orderSearch = searchParams.get('q') ?? ''
  const [isProfileEditing, setIsProfileEditing] = useState(false)
  const [profileDraft, setProfileDraft] = useState<CustomerProfile>(profile)
  const [avatarError, setAvatarError] = useState('')
  const [administrativeData, setAdministrativeData] = useState<AdministrativeData | null>(null)
  const [isAdministrativeDataLoading, setIsAdministrativeDataLoading] = useState(false)
  const [isAdministrativeDataUnavailable, setIsAdministrativeDataUnavailable] = useState(false)
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [isOrdersLoading, setIsOrdersLoading] = useState(false)
  const [hasOrdersLoadError, setHasOrdersLoadError] = useState(false)
  const [ordersReloadKey, setOrdersReloadKey] = useState(0)
  const customerId = user?.id

  const provinceOptions = useMemo(
    () => administrativeData?.provinces
      .map(toAdministrativeOption)
      .sort((left, right) => left.label.localeCompare(right.label, 'vi')) ?? [],
    [administrativeData],
  )
  const selectedProvince = useMemo(
    () => administrativeData?.provinces.find((province) => matchesAdministrativeValue(province.name, profileDraft.city)) ?? null,
    [administrativeData, profileDraft.city],
  )
  const districtOptions = useMemo(
    () => selectedProvince
      ? administrativeData?.districts
          .filter((district) => district.idProvince === selectedProvince.idProvince)
          .map(toAdministrativeOption)
          .sort((left, right) => left.label.localeCompare(right.label, 'vi')) ?? []
      : [],
    [administrativeData, selectedProvince],
  )
  const selectedDistrict = useMemo(
    () => selectedProvince
      ? administrativeData?.districts.find(
          (district) => district.idProvince === selectedProvince.idProvince && matchesAdministrativeValue(district.name, profileDraft.district),
        ) ?? null
      : null,
    [administrativeData, profileDraft.district, selectedProvince],
  )
  const wardOptions = useMemo(
    () => selectedDistrict
      ? administrativeData?.wards
          .filter((ward) => ward.idDistrict === selectedDistrict.idDistrict)
          .map(toAdministrativeOption)
          .sort((left, right) => left.label.localeCompare(right.label, 'vi')) ?? []
      : [],
    [administrativeData, selectedDistrict],
  )
  const searchedOrders = useMemo(() => {
    const normalizedSearch = normalizeSearchText(orderSearch)
    if (!normalizedSearch) return orders

    return orders.filter((order) => order.items.some((item) => (
      normalizeSearchText(item.name).includes(normalizedSearch) ||
      normalizeSearchText(item.sku).includes(normalizedSearch)
    )))
  }, [orderSearch, orders])
  const orderCounts = useMemo<Record<AccountOrderFilter, number>>(() => {
    const counts: Record<AccountOrderFilter, number> = {
      all: searchedOrders.length,
      'pending-confirmation': 0,
      'awaiting-pickup': 0,
      'awaiting-delivery': 0,
      delivered: 0,
      returned: 0,
      cancelled: 0,
    }

    for (const [filter, statuses] of Object.entries(ORDER_FILTER_STATUSES) as Array<[Exclude<AccountOrderFilter, 'all'>, readonly AdminOrder['status'][]]>) {
      counts[filter] = searchedOrders.filter((order) => statuses.includes(order.status)).length
    }

    return counts
  }, [searchedOrders])
  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') return searchedOrders

    return searchedOrders.filter((order) => ORDER_FILTER_STATUSES[orderFilter].includes(order.status))
  }, [orderFilter, searchedOrders])
  useEffect(() => {
    if (!customerId) return undefined

    let isCurrent = true
    void Promise.resolve()
      .then(() => {
        if (!isCurrent) return null
        setIsOrdersLoading(true)
        setHasOrdersLoadError(false)
        return getCustomerOrders()
      })
      .then((nextOrders) => {
        if (isCurrent && nextOrders) {
          setOrders(nextOrders)
        }
      })
      .catch(() => {
        if (isCurrent) {
          setOrders([])
          setHasOrdersLoadError(true)
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsOrdersLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [customerId, ordersReloadKey])

  if (isAuthLoading) {
    return <AccountSessionSkeleton label={content.auth.restoringSession} />
  }

  if (!user) {
    return <Navigate to="/dang-nhap" state={{ from: `${location.pathname}${location.search}` }} replace />
  }

  const authenticatedUser = user
  const displayName = profile.fullName || authenticatedUser.name
  const profileAvatar = profile.avatar || authenticatedUser.picture
  const accountLayoutClassName = activeSection === 'information' ? 'account-layout account-layout--profile' : 'account-layout'

  const navigation: Array<{ id: AccountSection; label: string; icon: typeof House }> = [
    { id: 'overview', label: content.auth.overview, icon: House },
    { id: 'information', label: content.auth.userInformation, icon: User },
    { id: 'orders', label: content.auth.orders, icon: Package },
    { id: 'gifts', label: content.auth.gifts, icon: Gift },
  ]

  function handleSignOut() {
    signOut()
    navigate('/')
  }

  function handleProfileSection(section: AccountSection) {
    const nextSearchParams = new URLSearchParams(searchParams)

    if (section === 'overview') {
      nextSearchParams.delete('section')
    } else {
      nextSearchParams.set('section', section)
    }

    setSearchParams(nextSearchParams, { preventScrollReset: true })

    if (section !== 'information') {
      setIsProfileEditing(false)
    }
  }

  function handleOrderFilter(nextFilter: AccountOrderFilter) {
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.set('section', 'orders')

    if (nextFilter === 'all') {
      nextSearchParams.delete('filter')
    } else {
      nextSearchParams.set('filter', nextFilter)
    }

    setSearchParams(nextSearchParams, { preventScrollReset: true })
  }

  function handleOrderSearch(nextSearch: string) {
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.set('section', 'orders')

    if (nextSearch.trim()) {
      nextSearchParams.set('q', nextSearch)
    } else {
      nextSearchParams.delete('q')
    }

    setSearchParams(nextSearchParams, { replace: true, preventScrollReset: true })
  }

  function handleProfileFieldChange<Field extends keyof CustomerProfile>(field: Field, value: CustomerProfile[Field]) {
    setProfileDraft((currentProfile) => ({ ...currentProfile, [field]: value }))
  }

  function handleProvinceChange(city: string) {
    setProfileDraft((currentProfile) => ({ ...currentProfile, city, district: '', ward: '' }))
  }

  function handleDistrictChange(district: string) {
    setProfileDraft((currentProfile) => ({ ...currentProfile, district, ward: '' }))
  }

  function loadAdministrativeData() {
    if (administrativeData || isAdministrativeDataLoading || isAdministrativeDataUnavailable) {
      return
    }

    setIsAdministrativeDataLoading(true)

    void Promise.all([
      import('vietnam-divisions-js/provinces'),
      import('vietnam-divisions-js/districts'),
      import('vietnam-divisions-js/communes'),
    ])
      .then(async ([provinceModule, districtModule, communeModule]) => {
        const [provinces, districts, wards] = await Promise.all([
          provinceModule.getAllProvince() as Promise<AdministrativeProvince[]>,
          districtModule.getAllDistricts() as Promise<AdministrativeDistrict[]>,
          communeModule.getAllCommunes() as Promise<AdministrativeWard[]>,
        ])

        setAdministrativeData({ provinces, districts, wards })
      })
      .catch(() => {
        setIsAdministrativeDataUnavailable(true)
      })
      .finally(() => {
        setIsAdministrativeDataLoading(false)
      })
  }

  function handleStartProfileEdit() {
    setProfileDraft({ ...profile, fullName: profile.fullName || authenticatedUser.name })
    setAvatarError('')
    setIsProfileEditing(true)
    loadAdministrativeData()
  }

  function handleCancelProfileEdit() {
    setProfileDraft(profile)
    setAvatarError('')
    setIsProfileEditing(false)
  }

  function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateProfile({ ...profileDraft, fullName: profileDraft.fullName.trim() || authenticatedUser.name })
    setAvatarError('')
    setIsProfileEditing(false)
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    const isSupportedImage = file.type === 'image/jpeg' || file.type === 'image/png'
    const isWithinSizeLimit = file.size <= 2 * 1024 * 1024

    if (!isSupportedImage || !isWithinSizeLimit) {
      setAvatarError(content.auth.avatarInvalid)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const avatar = reader.result
      if (typeof avatar !== 'string') {
        return
      }

      setProfileDraft((currentProfile) => ({ ...currentProfile, avatar }))
      setAvatarError('')
    }
    reader.readAsDataURL(file)
  }

  const genderLabel = {
    male: content.auth.genderMale,
    female: content.auth.genderFemale,
    other: content.auth.genderOther,
  }

  const genderIcon =
    profile.gender === 'male' ? (
      <GenderMale size={23} weight="thin" />
    ) : profile.gender === 'female' ? (
      <GenderFemale size={23} weight="thin" />
    ) : (
      <GenderIntersex size={23} weight="thin" />
    )

  return (
    <main className="account-page">
      <div className="account-shell">
        <div className={accountLayoutClassName}>
          <aside className="account-sidebar">
            <div className="account-sidebar__identity">
              {profileAvatar ? (
                <img src={profileAvatar} alt="" referrerPolicy="no-referrer" />
              ) : (
                <span aria-hidden="true">{displayName.slice(0, 1).toUpperCase()}</span>
              )}
              <div>
                <strong>{displayName}</strong>
                <small>{content.auth.memberSince}</small>
              </div>
            </div>

            <div className="account-sidebar__nav" aria-label={content.auth.profileTitle}>
              {navigation.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={activeSection === item.id ? 'account-nav__item account-nav__item--active' : 'account-nav__item'}
                  onClick={() => handleProfileSection(item.id)}
                >
                  <item.icon size={19} weight="regular" aria-hidden="true" />
                  {item.label}
                </button>
              ))}
            </div>

            <button type="button" className="account-sign-out" onClick={handleSignOut}>
              <SignOut size={18} aria-hidden="true" />
              {content.auth.signOut}
            </button>
          </aside>

          <section className="account-panel" aria-live="polite">
            <div className="account-panel__content">
              {activeSection === 'overview' ? (
                <>
                  <header className="account-panel__header">
                    <h1 className="account-panel__welcome">{content.auth.welcome(displayName)}</h1>
                  </header>
                  <div className="account-metrics">
                    <article>
                      <span className="account-metrics__icon" aria-hidden="true"><Package size={24} weight="thin" /></span>
                      <span>
                        <small>{content.auth.orderCount}</small>
                        <strong>{orders.length}</strong>
                      </span>
                    </article>
                    <article>
                      <span className="account-metrics__icon" aria-hidden="true"><Gift size={24} weight="thin" /></span>
                      <span>
                        <small>{content.auth.giftCount}</small>
                        <strong>0</strong>
                      </span>
                    </article>
                    <article>
                      <span className="account-metrics__icon" aria-hidden="true"><Coins size={24} weight="thin" /></span>
                      <span>
                        <small>{content.auth.loyaltyPoints}</small>
                        <strong>0</strong>
                      </span>
                    </article>
                  </div>
                  <AccountOrdersState
                    title={content.auth.recentOrderTitle}
                    emptyDescription={content.auth.noOrders}
                    orders={orders.slice(0, 2)}
                    isLoading={isOrdersLoading}
                    hasError={hasOrdersLoadError}
                    language={language}
                    copy={content.auth}
                    onRetry={() => setOrdersReloadKey((currentKey) => currentKey + 1)}
                    emptyAction={<Link className="button button--gold" to="/products">{content.common.products}</Link>}
                    compact
                  />
                </>
              ) : null}

              {activeSection === 'information' ? (
                isProfileEditing ? (
                  <form className="account-profile account-profile--editing" onSubmit={handleSaveProfile}>
                      <div className="account-profile__avatar-row">
                        <div className="account-profile__avatar-preview">
                          {profileDraft.avatar || user.picture ? (
                            <img src={profileDraft.avatar || user.picture} alt="" referrerPolicy="no-referrer" />
                          ) : (
                            <span aria-hidden="true">{(profileDraft.fullName || user.name).slice(0, 1).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="account-profile__avatar-copy">
                          <strong>{content.auth.avatar}</strong>
                          <span>{content.auth.avatarHint}</span>
                        </div>
                        <label className="account-profile__avatar-button">
                          <Camera size={17} weight="regular" aria-hidden="true" />
                          {content.auth.changeAvatar}
                          <input type="file" accept="image/jpeg,image/png" onChange={handleAvatarChange} />
                        </label>
                        {avatarError ? <p className="account-profile__avatar-error" role="alert">{avatarError}</p> : null}
                      </div>
                      <div className="account-profile__edit-grid">
                        <AccountProfileEditField id="account-profile-full-name" label={content.auth.fullName}>
                          <input
                            id="account-profile-full-name"
                            autoComplete="name"
                            value={profileDraft.fullName}
                            onChange={(event) => handleProfileFieldChange('fullName', event.target.value)}
                          />
                        </AccountProfileEditField>
                        <AccountProfileEditField id="account-profile-email" label={content.auth.accountEmail}>
                          <input id="account-profile-email" value={user.email} disabled />
                        </AccountProfileEditField>
                        <AccountProfileEditField id="account-profile-phone" label={content.auth.phone}>
                          <input
                            id="account-profile-phone"
                            autoComplete="tel"
                            inputMode="tel"
                            value={profileDraft.phone}
                            onChange={(event) => handleProfileFieldChange('phone', event.target.value)}
                          />
                        </AccountProfileEditField>
                        <AccountProfileEditField id="account-profile-birth-date" label={content.auth.birthDate}>
                          <input
                            id="account-profile-birth-date"
                            type="date"
                            value={profileDraft.birthDate}
                            onChange={(event) => handleProfileFieldChange('birthDate', event.target.value)}
                          />
                        </AccountProfileEditField>
                        <AccountProfileEditField id="account-profile-gender" label={content.auth.gender}>
                          <AccountProfileDropdown
                            id="account-profile-gender"
                            value={profileDraft.gender}
                            placeholder={content.auth.selectGender}
                            searchable={false}
                            searchPlaceholder={content.auth.searchOptions}
                            emptyMessage={content.auth.noOptionsFound}
                            options={[
                              { value: 'male', label: content.auth.genderMale },
                              { value: 'female', label: content.auth.genderFemale },
                              { value: 'other', label: content.auth.genderOther },
                            ]}
                            onChange={(value) => handleProfileFieldChange('gender', value as CustomerProfile['gender'])}
                          />
                        </AccountProfileEditField>
                        <AccountProfileEditField id="account-profile-city" label={content.auth.provinceCity}>
                          <AccountProfileDropdown
                            id="account-profile-city"
                            value={profileDraft.city}
                            placeholder={content.auth.provinceCity}
                            searchPlaceholder={content.auth.searchOptions}
                            emptyMessage={content.auth.noOptionsFound}
                            statusLabel={content.auth.noOptionsFound}
                            loadingLabel={isAdministrativeDataLoading ? content.auth.loadingOptions : undefined}
                            disabled={!administrativeData}
                            options={provinceOptions}
                            onChange={handleProvinceChange}
                          />
                        </AccountProfileEditField>
                        <AccountProfileEditField id="account-profile-district" label={content.auth.district}>
                          <AccountProfileDropdown
                            id="account-profile-district"
                            value={profileDraft.district}
                            placeholder={content.auth.district}
                            searchPlaceholder={content.auth.searchOptions}
                            emptyMessage={selectedProvince ? content.auth.noOptionsFound : content.auth.selectProvinceFirst}
                            statusLabel={content.auth.selectProvinceFirst}
                            loadingLabel={isAdministrativeDataLoading ? content.auth.loadingOptions : undefined}
                            disabled={!administrativeData || !selectedProvince}
                            options={districtOptions}
                            placement="top"
                            onChange={handleDistrictChange}
                          />
                        </AccountProfileEditField>
                        <AccountProfileEditField id="account-profile-ward" label={content.auth.ward}>
                          <AccountProfileDropdown
                            id="account-profile-ward"
                            value={profileDraft.ward}
                            placeholder={content.auth.ward}
                            searchPlaceholder={content.auth.searchOptions}
                            emptyMessage={selectedDistrict ? content.auth.noOptionsFound : content.auth.selectDistrictFirst}
                            statusLabel={content.auth.selectDistrictFirst}
                            loadingLabel={isAdministrativeDataLoading ? content.auth.loadingOptions : undefined}
                            disabled={!administrativeData || !selectedDistrict}
                            options={wardOptions}
                            placement="top"
                            onChange={(value) => handleProfileFieldChange('ward', value)}
                          />
                        </AccountProfileEditField>
                        <AccountProfileEditField id="account-profile-address" label={content.auth.address} isWide>
                          <input
                            id="account-profile-address"
                            autoComplete="street-address"
                            value={profileDraft.address}
                            onChange={(event) => handleProfileFieldChange('address', event.target.value)}
                          />
                        </AccountProfileEditField>
                      </div>
                      <div className="account-profile__actions">
                        <div className="account-profile__buttons">
                          <button className="account-profile__button account-profile__button--secondary" type="button" onClick={handleCancelProfileEdit}>
                            {content.auth.cancelChanges}
                          </button>
                          <button className="account-profile__button account-profile__button--primary" type="submit">
                            {content.auth.saveChanges}
                          </button>
                        </div>
                      </div>
                  </form>
                ) : (
                  <section className="account-profile">
                    <div className="account-profile__grid">
                      <AccountProfileField icon={<User size={23} weight="thin" />} label={content.auth.fullName} value={displayName} />
                      <AccountProfileField icon={<EnvelopeSimple size={23} weight="thin" />} label={content.auth.accountEmail} value={user.email} />
                      <AccountProfileField icon={<Phone size={23} weight="thin" />} label={content.auth.phone} value={profile.phone || content.auth.notUpdated} />
                      <AccountProfileField icon={<CalendarBlank size={23} weight="thin" />} label={content.auth.birthDate} value={formatBirthDate(profile.birthDate, content.auth.notUpdated)} />
                      <AccountProfileField
                        icon={genderIcon}
                        label={content.auth.gender}
                        value={profile.gender ? genderLabel[profile.gender] : content.auth.notUpdated}
                      />
                      <AccountProfileField icon={<Buildings size={23} weight="thin" />} label={content.auth.provinceCity} value={profile.city || content.auth.notUpdated} />
                      <AccountProfileField icon={<MapPin size={23} weight="thin" />} label={content.auth.ward} value={profile.ward || content.auth.notUpdated} />
                      <AccountProfileField icon={<MapTrifold size={23} weight="thin" />} label={content.auth.district} value={profile.district || content.auth.notUpdated} />
                      <AccountProfileField icon={<HouseLine size={23} weight="thin" />} label={content.auth.address} value={formatProfileAddress(profile, language, content.auth.notUpdated)} isWide />
                    </div>
                    <div className="account-profile__actions">
                      <div className="account-profile__buttons">
                        <button className="account-profile__button account-profile__button--primary" type="button" onClick={handleStartProfileEdit}>
                          <PencilSimple size={17} weight="regular" aria-hidden="true" />
                          {content.auth.editInformation}
                        </button>
                      </div>
                    </div>
                  </section>
                )
              ) : null}

              {activeSection === 'orders' ? (
                <AccountOrdersState
                  title={content.auth.ordersTitle}
                  emptyDescription={content.auth.noOrders}
                  orders={filteredOrders}
                  isLoading={isOrdersLoading}
                  hasError={hasOrdersLoadError}
                  language={language}
                  copy={content.auth}
                  onRetry={() => setOrdersReloadKey((currentKey) => currentKey + 1)}
                  filter={{
                    value: orderFilter,
                    onChange: handleOrderFilter,
                    counts: orderCounts,
                    searchQuery: orderSearch,
                    onSearchChange: handleOrderSearch,
                    searchPlaceholder: content.auth.orderSearchPlaceholder,
                  }}
                />
              ) : null}
              {activeSection === 'gifts' ? (
                <AccountEmpty icon={<Gift size={34} weight="thin" />} title={content.auth.giftsTitle} description={content.auth.giftsDescription} />
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

function AccountProfileField({
  icon,
  label,
  value,
  isWide = false,
}: {
  icon: ReactNode
  label: string
  value: string
  isWide?: boolean
}) {
  return (
    <div className={isWide ? 'account-profile__field account-profile__field--wide' : 'account-profile__field'}>
      <span className="account-profile__icon" aria-hidden="true">{icon}</span>
      <div className="account-profile__field-content">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  )
}

function AccountProfileEditField({
  id,
  label,
  isWide = false,
  children,
}: {
  id: string
  label: string
  isWide?: boolean
  children: ReactNode
}) {
  return (
    <div className={isWide ? 'account-profile__edit-field account-profile__edit-field--wide' : 'account-profile__edit-field'}>
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  )
}

function AccountProfileDropdown({
  id,
  value,
  placeholder,
  options,
  placement = 'bottom',
  searchable = true,
  searchPlaceholder,
  emptyMessage,
  statusLabel,
  loadingLabel,
  disabled = false,
  onChange,
}: {
  id: string
  value: string
  placeholder: string
  options: AccountProfileDropdownOption[]
  placement?: 'bottom' | 'top'
  searchable?: boolean
  searchPlaceholder: string
  emptyMessage: string
  statusLabel?: string
  loadingLabel?: string
  disabled?: boolean
  onChange: (value: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const menuId = useId()
  const isDropdownOpen = isOpen && !disabled
  const displayOptions = useMemo(
    () => value && !options.some((option) => option.value === value)
      ? [{ value, label: value }, ...options]
      : options,
    [options, value],
  )
  const selectedOption = displayOptions.find((option) => option.value === value)
  const filteredOptions = useMemo(() => {
    if (!searchable) {
      return displayOptions
    }

    const normalizedQuery = normalizeSearchText(searchQuery)

    if (!normalizedQuery) {
      return displayOptions
    }

    return displayOptions.filter((option) =>
      normalizeSearchText(`${option.label} ${option.searchText ?? ''}`).includes(normalizedQuery),
    )
  }, [displayOptions, searchQuery, searchable])

  function closeDropdown(returnFocus = false) {
    setIsOpen(false)
    setSearchQuery('')

    if (returnFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus())
    }
  }

  function selectOption(nextValue: string) {
    onChange(nextValue)
    closeDropdown(true)
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      if (searchable) {
        searchInputRef.current?.focus()
        return
      }

      optionRefs.current[0]?.focus()
    })

    function handlePointerDown(event: PointerEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        closeDropdown()
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeDropdown(true)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.cancelAnimationFrame(frameId)
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, searchable])

  if (loadingLabel) {
    return (
      <div className="account-profile__dropdown account-profile__dropdown--loading" role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">{loadingLabel}</span>
        <KhungXuong className="account-profile__dropdown-skeleton" />
      </div>
    )
  }

  return (
    <div
      ref={dropdownRef}
      className={`account-profile__dropdown account-profile__dropdown--${placement}${isDropdownOpen ? ' account-profile__dropdown--open' : ''}`}
    >
      <button
        ref={triggerRef}
        id={id}
        className="account-profile__dropdown-trigger"
        type="button"
        aria-controls={menuId}
        aria-expanded={isDropdownOpen}
        aria-haspopup={searchable ? 'dialog' : 'listbox'}
        disabled={disabled}
        onClick={() => {
          setIsOpen((currentValue) => {
            if (!currentValue) {
              setSearchQuery('')
            }

            return !currentValue
          })
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            setSearchQuery('')
            setIsOpen(true)
          }
        }}
      >
        <span className={selectedOption ? '' : 'account-profile__dropdown-placeholder'}>{selectedOption?.label || statusLabel || placeholder}</span>
        <CaretDown size={16} weight="regular" aria-hidden="true" />
      </button>
      {isDropdownOpen ? (
        <div
          id={menuId}
          className="account-profile__dropdown-menu"
          role={searchable ? 'dialog' : undefined}
          aria-label={searchable ? placeholder : undefined}
        >
          {searchable ? (
            <div className="account-profile__dropdown-search">
              <MagnifyingGlass size={16} weight="regular" aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="text"
                inputMode="search"
                value={searchQuery}
                autoComplete="off"
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown') {
                    event.preventDefault()
                    optionRefs.current[0]?.focus()
                  }

                  if (event.key === 'Escape') {
                    event.preventDefault()
                    closeDropdown(true)
                  }
                }}
              />
            </div>
          ) : null}
          <div className="account-profile__dropdown-options" role="listbox" aria-label={placeholder}>
            <button
              ref={(element) => {
                optionRefs.current[0] = element
              }}
              className={!value ? 'account-profile__dropdown-option account-profile__dropdown-option--selected' : 'account-profile__dropdown-option'}
              type="button"
              role="option"
              aria-selected={!value}
              onClick={() => selectOption('')}
              onKeyDown={(event) => {
                if (event.key === 'ArrowUp') {
                  event.preventDefault()
                  if (searchable) {
                    searchInputRef.current?.focus()
                  } else {
                    triggerRef.current?.focus()
                  }
                }

                if (event.key === 'ArrowDown' && filteredOptions.length > 0) {
                  event.preventDefault()
                  optionRefs.current[1]?.focus()
                }

                if (event.key === 'End' && filteredOptions.length > 0) {
                  event.preventDefault()
                  optionRefs.current[filteredOptions.length]?.focus()
                }

                if (event.key === 'Escape') {
                  event.preventDefault()
                  closeDropdown(true)
                }
              }}
            >
              {!value ? <Check size={16} weight="bold" aria-hidden="true" /> : <span aria-hidden="true" />}
              <span>{placeholder}</span>
            </button>
            {filteredOptions.length ? filteredOptions.map((option, index) => {
              const isSelected = option.value === value
              const optionIndex = index + 1

              return (
                <button
                  key={option.value}
                  ref={(element) => {
                    optionRefs.current[optionIndex] = element
                  }}
                  className={isSelected ? 'account-profile__dropdown-option account-profile__dropdown-option--selected' : 'account-profile__dropdown-option'}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => selectOption(option.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowUp') {
                      event.preventDefault()
                      optionRefs.current[optionIndex - 1]?.focus()
                    }

                    if (event.key === 'ArrowDown' && optionIndex < filteredOptions.length) {
                      event.preventDefault()
                      optionRefs.current[optionIndex + 1]?.focus()
                    }

                    if (event.key === 'Home') {
                      event.preventDefault()
                      optionRefs.current[0]?.focus()
                    }

                    if (event.key === 'End') {
                      event.preventDefault()
                      optionRefs.current[filteredOptions.length]?.focus()
                    }

                    if (event.key === 'Escape') {
                      event.preventDefault()
                      closeDropdown(true)
                    }
                  }}
                >
                  {isSelected ? <Check size={16} weight="bold" aria-hidden="true" /> : <span aria-hidden="true" />}
                  <span>{option.label}</span>
                </button>
              )
            }) : (
              <p className="account-profile__dropdown-empty" role="status">{emptyMessage}</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function AccountSessionSkeleton({ label }: { label: string }) {
  return (
    <main className="account-page account-page--skeleton" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className="account-shell" aria-hidden="true">
        <div className="account-layout account-session-skeleton">
          <aside className="account-sidebar account-session-skeleton__sidebar">
            <div className="account-sidebar__identity account-session-skeleton__identity">
              <div className="account-session-skeleton__avatar">
                <KhungXuong />
              </div>
              <div className="account-session-skeleton__identity-copy">
                <KhungXuong className="account-session-skeleton__identity-name" />
                <KhungXuong className="account-session-skeleton__identity-meta" />
              </div>
            </div>

            <div className="account-sidebar__nav account-session-skeleton__nav">
              {Array.from({ length: 5 }, (_, index) => (
                <div className="account-session-skeleton__nav-item" key={index}>
                  <KhungXuong className="account-session-skeleton__nav-icon" />
                  <KhungXuong className="account-session-skeleton__nav-copy" />
                </div>
              ))}
            </div>

            <div className="account-sign-out account-session-skeleton__sign-out">
              <KhungXuong className="account-session-skeleton__sign-out-icon" />
              <KhungXuong className="account-session-skeleton__sign-out-copy" />
            </div>
          </aside>

          <section className="account-panel">
            <div className="account-panel__content">
              <header className="account-panel__header account-session-skeleton__header">
                <KhungXuong className="account-session-skeleton__title" />
              </header>

              <div className="account-metrics account-session-skeleton__metrics">
                {Array.from({ length: 3 }, (_, index) => (
                  <article key={index}>
                    <KhungXuong className="account-session-skeleton__metric-icon" />
                    <div className="account-session-skeleton__metric-copy">
                      <KhungXuong className="account-session-skeleton__metric-label" />
                      <KhungXuong className="account-session-skeleton__metric-value" />
                    </div>
                  </article>
                ))}
              </div>

              <section className="account-orders account-orders--compact account-session-skeleton__orders">
                <header className="account-orders__header">
                  <KhungXuong className="account-session-skeleton__orders-title" />
                  <KhungXuong className="account-session-skeleton__orders-count" />
                </header>
                <div className="account-orders__list account-orders__list--loading">
                  {Array.from({ length: 2 }, (_, index) => (
                    <div className="account-order account-order--skeleton" key={index}>
                      <KhungXuong className="account-order__skeleton account-order__skeleton--title" />
                      <KhungXuong className="account-order__skeleton account-order__skeleton--line" />
                      <KhungXuong className="account-order__skeleton account-order__skeleton--line account-order__skeleton--short" />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

type AccountOrderCopy = Pick<
  SiteContent['auth'],
  | 'ordersLoading'
  | 'ordersLoadError'
  | 'ordersRetry'
  | 'orderCode'
  | 'orderDate'
  | 'orderItems'
  | 'orderTotal'
  | 'orderPayment'
  | 'orderDelivery'
  | 'orderFilterLabel'
  | 'orderFilterAll'
  | 'orderFilterPendingConfirmation'
  | 'orderFilterAwaitingPickup'
  | 'orderFilterAwaitingDelivery'
  | 'orderFilterDelivered'
  | 'orderFilterReturned'
  | 'orderFilterCancelled'
  | 'orderSearchPlaceholder'
  | 'orderFilterEmpty'
>

type AccountOrderFilterControl = {
  value: AccountOrderFilter
  onChange: (nextFilter: AccountOrderFilter) => void
  counts: Record<AccountOrderFilter, number>
  searchQuery: string
  onSearchChange: (nextSearch: string) => void
  searchPlaceholder: string
}

function AccountOrdersState({
  title,
  emptyDescription,
  orders,
  isLoading,
  hasError,
  language,
  copy,
  onRetry,
  emptyAction,
  compact = false,
  filter,
}: {
  title: string
  emptyDescription: string
  orders: AdminOrder[]
  isLoading: boolean
  hasError: boolean
  language: AppLanguage
  copy: AccountOrderCopy
  onRetry: () => void
  emptyAction?: ReactNode
  compact?: boolean
  filter?: AccountOrderFilterControl
}) {
  const Heading = compact ? 'h2' : 'h1'
  const stateClassName = compact
    ? 'account-empty-state'
    : 'account-empty-state account-empty-state--full account-empty-state--orders'

  if (isLoading) {
    return <AccountOrdersLoading title={title} label={copy.ordersLoading} compact={compact} />
  }

  if (hasError) {
    return (
      <section className={stateClassName} aria-live="polite">
        <Heading>{title}</Heading>
        <div className="account-empty-state__content">
          <span className="account-empty-state__icon" aria-hidden="true"><Package size={30} weight="thin" /></span>
          <p role="alert">{copy.ordersLoadError}</p>
          <button className="button button--gold" type="button" onClick={onRetry}>{copy.ordersRetry}</button>
        </div>
      </section>
    )
  }

  if (!orders.length && !filter) {
    return (
      <section className={stateClassName}>
        <Heading>{title}</Heading>
        <div className="account-empty-state__content">
          <span className="account-empty-state__icon" aria-hidden="true"><Package size={compact ? 26 : 34} weight="thin" /></span>
          <p>{emptyDescription}</p>
          {emptyAction}
        </div>
      </section>
    )
  }

  return (
    <AccountOrderList
      title={title}
      orders={orders}
      language={language}
      copy={copy}
      compact={compact}
      filter={filter}
      emptyDescription={filter ? copy.orderFilterEmpty : undefined}
    />
  )
}

function AccountOrdersLoading({ title, label, compact }: { title: string; label: string; compact: boolean }) {
  const Heading = compact ? 'h2' : 'h1'

  return (
    <section
      className={compact ? 'account-orders account-orders--compact' : 'account-orders account-orders--full'}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <header className="account-orders__header">
        <Heading>{title}</Heading>
      </header>
      <div className="account-orders__list account-orders__list--loading">
        <div className="account-order account-order--skeleton" aria-hidden="true">
          <KhungXuong className="account-order__skeleton account-order__skeleton--title" />
          <KhungXuong className="account-order__skeleton account-order__skeleton--line" />
          <KhungXuong className="account-order__skeleton account-order__skeleton--line account-order__skeleton--short" />
        </div>
        <div className="account-order account-order--skeleton" aria-hidden="true">
          <KhungXuong className="account-order__skeleton account-order__skeleton--title" />
          <KhungXuong className="account-order__skeleton account-order__skeleton--line" />
        </div>
      </div>
      <span className="sr-only">{label}</span>
    </section>
  )
}

function AccountOrderList({
  title,
  orders,
  language,
  copy,
  compact,
  filter,
  emptyDescription,
}: {
  title: string
  orders: AdminOrder[]
  language: AppLanguage
  copy: AccountOrderCopy
  compact: boolean
  filter?: AccountOrderFilterControl
  emptyDescription?: string
}) {
  const Heading = compact ? 'h2' : 'h1'

  return (
    <section className={compact ? 'account-orders account-orders--compact' : 'account-orders account-orders--full'}>
      <header className={filter ? 'account-orders__header account-orders__header--filters' : 'account-orders__header'}>
        {filter ? (
          <>
            <Heading className="sr-only">{title}</Heading>
            <AccountOrderFilterTags filter={filter} copy={copy} />
          </>
        ) : (
          <>
            <Heading>{title}</Heading>
            <span className="account-orders__count" aria-label={`${orders.length}`}>{orders.length}</span>
          </>
        )}
      </header>
      <div className="account-orders__list">
        {orders.length ? (
          orders.map((order) => <AccountOrderCard key={order.id} order={order} language={language} copy={copy} />)
        ) : (
          <p className="account-orders__filter-empty" role="status">{emptyDescription}</p>
        )}
      </div>
    </section>
  )
}

function AccountOrderFilterTags({ filter, copy }: { filter: AccountOrderFilterControl; copy: AccountOrderCopy }) {
  const options: Array<{ value: AccountOrderFilter; label: string }> = [
    { value: 'all', label: copy.orderFilterAll },
    { value: 'pending-confirmation', label: copy.orderFilterPendingConfirmation },
    { value: 'awaiting-pickup', label: copy.orderFilterAwaitingPickup },
    { value: 'awaiting-delivery', label: copy.orderFilterAwaitingDelivery },
    { value: 'delivered', label: copy.orderFilterDelivered },
    { value: 'returned', label: copy.orderFilterReturned },
    { value: 'cancelled', label: copy.orderFilterCancelled },
  ]

  return (
    <div className="account-order-filters" role="group" aria-label={copy.orderFilterLabel}>
      {options.map((option) => {
        const count = filter.counts[option.value]
        const label = count > 0 ? `${option.label} (${count})` : option.label

        return (
          <button
            key={option.value}
            className={filter.value === option.value ? 'account-order-filter account-order-filter--active' : 'account-order-filter'}
            type="button"
            aria-label={label}
            aria-pressed={filter.value === option.value}
            onClick={() => filter.onChange(option.value)}
          >
            {option.label}
            {count > 0 ? <span className="account-order-filter__count" aria-hidden="true">{count}</span> : null}
          </button>
        )
      })}
      <label className="account-order-search">
        <MagnifyingGlass size={16} weight="bold" aria-hidden="true" />
        <input
          type="search"
          value={filter.searchQuery}
          autoComplete="off"
          placeholder={filter.searchPlaceholder}
          aria-label={filter.searchPlaceholder}
          onChange={(event) => filter.onSearchChange(event.target.value)}
        />
      </label>
    </div>
  )
}

function AccountOrderCard({ order, language, copy }: { order: AdminOrder; language: AppLanguage; copy: AccountOrderCopy }) {
  const statusTone = getOrderStatusTone(order.status)
  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0)
  const visibleItems = order.items.slice(0, 3)
  const remainingItemCount = Math.max(0, order.items.length - visibleItems.length)

  return (
    <article className="account-order">
      <header className="account-order__header">
        <div>
          <span>{copy.orderCode}</span>
          <strong>{order.id}</strong>
          <time dateTime={order.createdAt}>{copy.orderDate}: {formatAccountOrderDate(order.createdAt, language)}</time>
        </div>
        <span className={`account-order__status account-order__status--${statusTone}`}>{order.status}</span>
      </header>
      <dl className="account-order__facts">
        <div>
          <dt>{copy.orderPayment}</dt>
          <dd>{order.paymentMethod} · {order.paymentStatus}</dd>
        </div>
        <div>
          <dt>{copy.orderTotal}</dt>
          <dd>{formatCurrency(order.total, language)}</dd>
        </div>
      </dl>
      <div className="account-order__items">
        <span>{copy.orderItems} ({itemCount})</span>
        <ul>
          {visibleItems.map((item) => (
            <li key={`${item.productId}-${item.sku}`}><span>{item.name}</span><b>×{item.quantity}</b></li>
          ))}
          {remainingItemCount ? <li className="account-order__more-items">+{remainingItemCount}</li> : null}
        </ul>
      </div>
      <p className="account-order__address"><span>{copy.orderDelivery}</span>{order.address}</p>
    </article>
  )
}

function getOrderStatusTone(status: AdminOrder['status']) {
  if (status === 'Hoàn thành') return 'complete'
  if (status === 'Đã hủy' || status === 'Thanh toán thất bại' || status === 'Đã trả hàng') return 'problem'
  if (status === 'Chờ thanh toán' || status === 'Chờ xác nhận') return 'pending'
  return 'progress'
}

function formatAccountOrderDate(value: string, language: AppLanguage) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString(language === 'en' ? 'en-GB' : 'vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function AccountEmpty({ icon, title, description, className = '' }: { icon: ReactNode; title: string; description: string; className?: string }) {
  return (
    <section className={`account-empty-state account-empty-state--full ${className}`.trim()}>
      <span className="account-empty-state__icon" aria-hidden="true">{icon}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  )
}

function formatBirthDate(value: string, fallback: string) {
  const [year, month, day] = value.split('-')
  return year && month && day ? `${day}/${month}/${year}` : fallback
}
