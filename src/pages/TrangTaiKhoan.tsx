import {
  Buildings,
  CalendarBlank,
  Camera,
  CaretDown,
  Check,
  ClockCounterClockwise,
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
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/NgonNguContext'
import { type CustomerProfile, useUser } from '../contexts/NguoiDungContext'

type AccountSection = 'overview' | 'information' | 'orders' | 'history' | 'gifts'

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

export function TrangTaiKhoanPage() {
  const { content } = useLanguage()
  const { user, profile, signOut, updateProfile } = useUser()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<AccountSection>('overview')
  const [isProfileEditing, setIsProfileEditing] = useState(false)
  const [profileDraft, setProfileDraft] = useState<CustomerProfile>(profile)
  const [avatarError, setAvatarError] = useState('')
  const [administrativeData, setAdministrativeData] = useState<AdministrativeData | null>(null)
  const [isAdministrativeDataLoading, setIsAdministrativeDataLoading] = useState(false)
  const [isAdministrativeDataUnavailable, setIsAdministrativeDataUnavailable] = useState(false)

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

  if (!user) {
    return <Navigate to="/dang-nhap" state={{ from: '/tai-khoan' }} replace />
  }

  const authenticatedUser = user
  const displayName = profile.fullName || authenticatedUser.name
  const profileAvatar = profile.avatar || authenticatedUser.picture

  const navigation: Array<{ id: AccountSection; label: string; icon: typeof House }> = [
    { id: 'overview', label: content.auth.overview, icon: House },
    { id: 'information', label: content.auth.userInformation, icon: User },
    { id: 'orders', label: content.auth.orders, icon: Package },
    { id: 'history', label: content.auth.purchaseHistory, icon: ClockCounterClockwise },
    { id: 'gifts', label: content.auth.gifts, icon: Gift },
  ]

  function handleSignOut() {
    signOut()
    navigate('/')
  }

  function handleProfileSection(section: AccountSection) {
    setActiveSection(section)

    if (section !== 'information') {
      setIsProfileEditing(false)
    }
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
        <div className={activeSection === 'information' ? 'account-layout account-layout--profile' : 'account-layout'}>
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
                        <strong>0</strong>
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
                  <section className="account-empty-state">
                    <h2>{content.auth.recentOrderTitle}</h2>
                    <div className="account-empty-state__content">
                      <span className="account-empty-state__icon" aria-hidden="true"><Package size={26} weight="thin" /></span>
                      <p>{content.auth.noOrders}</p>
                      <Link className="button button--gold" to="/products">{content.common.products}</Link>
                    </div>
                  </section>
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
                            statusLabel={isAdministrativeDataLoading ? content.auth.loadingOptions : content.auth.noOptionsFound}
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
                            statusLabel={isAdministrativeDataLoading ? content.auth.loadingOptions : content.auth.selectProvinceFirst}
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
                            statusLabel={isAdministrativeDataLoading ? content.auth.loadingOptions : content.auth.selectDistrictFirst}
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
                      <AccountProfileField icon={<MapTrifold size={23} weight="thin" />} label={content.auth.district} value={profile.district || content.auth.notUpdated} />
                      <AccountProfileField icon={<MapPin size={23} weight="thin" />} label={content.auth.ward} value={profile.ward || content.auth.notUpdated} />
                      <AccountProfileField icon={<HouseLine size={23} weight="thin" />} label={content.auth.address} value={profile.address || content.auth.notUpdated} isWide />
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
                <AccountEmpty className="account-empty-state--orders" icon={<Package size={34} weight="thin" />} title={content.auth.ordersTitle} description={content.auth.noOrders} />
              ) : null}
              {activeSection === 'history' ? (
                <AccountEmpty icon={<Package size={34} weight="thin" />} title={content.auth.historyTitle} description={content.auth.historyDescription} />
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
