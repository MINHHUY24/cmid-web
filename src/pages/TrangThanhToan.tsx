import { Bank, CaretDown, Check, CheckCircle, CreditCard, MagnifyingGlass, Truck } from '@phosphor-icons/react'
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { DonHangTomTat } from '../components/cart/DonHangTomTat'
import { useCart } from '../contexts/GioHangContext'
import { useLanguage } from '../contexts/NgonNguContext'
import { useUser } from '../contexts/NguoiDungContext'
import { createAdminOrderFromCheckout } from './admin/admin-database'

type PaymentMethod = 'bank' | 'cod' | 'card'

type CheckoutDropdownOption = {
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
  return value.replace(/^(?:Thành phố|Tỉnh|TP\.?|Quận|Huyện|Thị xã|Thị trấn|Phường|Xã)\s+/iu, '')
}

function matchesAdministrativeValue(name: string, value: string) {
  const normalizedValue = normalizeSearchText(getAdministrativeDisplayName(value))

  return Boolean(normalizedValue) && (
    normalizeSearchText(name) === normalizedValue ||
    normalizeSearchText(getAdministrativeDisplayName(name)) === normalizedValue
  )
}

function toAdministrativeOption(unit: { name: string }): CheckoutDropdownOption {
  const label = getAdministrativeDisplayName(unit.name)

  return {
    value: label,
    label,
    searchText: unit.name,
  }
}

export function TrangThanhToanPage() {
  const { clearCart, items } = useCart()
  const { content } = useLanguage()
  const { user, profile, updateProfile } = useUser()
  const { checkout, common } = content
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const [administrativeData, setAdministrativeData] = useState<AdministrativeData | null>(null)
  const [isAdministrativeDataLoading, setIsAdministrativeDataLoading] = useState(true)
  const [isAdministrativeDataUnavailable, setIsAdministrativeDataUnavailable] = useState(false)
  const [deliveryLocation, setDeliveryLocation] = useState(() => ({
    city: getAdministrativeDisplayName(profile.city) || 'Hồ Chí Minh',
    district: getAdministrativeDisplayName(profile.district),
    ward: getAdministrativeDisplayName(profile.ward),
  }))
  const [locationError, setLocationError] = useState('')

  useEffect(() => {
    let isCurrent = true

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

        if (isCurrent) {
          setAdministrativeData({ provinces, districts, wards })
        }
      })
      .catch(() => {
        if (isCurrent) {
          setIsAdministrativeDataUnavailable(true)
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsAdministrativeDataLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [])

  const provinceOptions = useMemo(
    () => administrativeData?.provinces
      .map(toAdministrativeOption)
      .sort((left, right) => left.label.localeCompare(right.label, 'vi')) ?? [],
    [administrativeData],
  )
  const selectedProvince = useMemo(
    () => administrativeData?.provinces.find((province) => matchesAdministrativeValue(province.name, deliveryLocation.city)) ?? null,
    [administrativeData, deliveryLocation.city],
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
          (district) => district.idProvince === selectedProvince.idProvince && matchesAdministrativeValue(district.name, deliveryLocation.district),
        ) ?? null
      : null,
    [administrativeData, deliveryLocation.district, selectedProvince],
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

  function handleProvinceChange(city: string) {
    setDeliveryLocation({ city, district: '', ward: '' })
    setLocationError('')
  }

  function handleDistrictChange(district: string) {
    setDeliveryLocation((currentLocation) => ({ ...currentLocation, district, ward: '' }))
    setLocationError('')
  }

  function handleWardChange(ward: string) {
    setDeliveryLocation((currentLocation) => ({ ...currentLocation, ward }))
    setLocationError('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!user) {
      setIsLoginDialogOpen(true)
      return
    }

    if (!deliveryLocation.city || !deliveryLocation.district || !deliveryLocation.ward) {
      setLocationError('Vui lòng chọn đầy đủ Tỉnh/Thành phố, Quận/Huyện và Phường/Xã.')
      window.requestAnimationFrame(() => document.getElementById('checkout-city')?.focus())
      return
    }

    setLocationError('')

    const formData = new FormData(event.currentTarget)
    const getFieldValue = (fieldName: string) =>
      String(formData.get(fieldName) ?? '').trim()
    const submittedPaymentMethod = getFieldValue('payment') as PaymentMethod
    const paymentMethodLabels: Record<PaymentMethod, string> = {
      bank: checkout.bank,
      cod: checkout.cod,
      card: checkout.card,
    }

    const fullName = getFieldValue('name') || profile.fullName || user.name
    const phone = getFieldValue('phone')
    const address = getFieldValue('address')
    const submittedAddress = [
      address,
      deliveryLocation.ward,
      deliveryLocation.district,
      deliveryLocation.city,
    ]
      .filter(Boolean)
      .join(', ')

    createAdminOrderFromCheckout({
      customer: fullName,
      email: getFieldValue('email'),
      phone,
      address: submittedAddress,
      paymentMethod:
        paymentMethodLabels[submittedPaymentMethod] ??
        paymentMethodLabels[paymentMethod],
      note: getFieldValue('note'),
      items,
    })

    const shouldSaveAddress = formData.get('save-address') === 'on'

    updateProfile({
      ...profile,
      fullName,
      phone,
      ...(shouldSaveAddress
        ? {
            city: deliveryLocation.city,
            district: deliveryLocation.district,
            ward: deliveryLocation.ward,
            address,
          }
        : {}),
    })

    setIsSubmitted(true)
    clearCart()
  }

  return (
    <div className="commerce-page checkout-page">
      <div className="commerce-shell">
        <nav className="commerce-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">{common.home}</Link>
          <span aria-hidden="true">/</span>
          <Link to="/gio-hang">{content.cart.breadcrumb}</Link>
          <span aria-hidden="true">/</span>
          <span>{checkout.title}</span>
        </nav>
        <h1>{checkout.title}</h1>

        {isSubmitted ? (
          <section className="checkout-success" aria-live="polite">
            <CheckCircle size={48} weight="thin" aria-hidden="true" />
            <h2>{checkout.successTitle}</h2>
            <p>{checkout.successDescription}</p>
            <Link className="button button--gold" to="/products">{checkout.continueShopping}</Link>
          </section>
        ) : items.length === 0 ? (
          <section className="commerce-empty">
            <h2>{checkout.noItemsTitle}</h2>
            <p>{checkout.noItemsDescription}</p>
            <Link className="button button--gold" to="/products">{content.cart.browseProducts}</Link>
          </section>
        ) : (
          <div className="commerce-layout checkout-page__layout">
            <form id="checkout-form" className="checkout-form" onSubmit={handleSubmit}>
              <fieldset>
                <legend><span>1</span> {checkout.customerTitle}</legend>
                <div className="checkout-form__grid checkout-form__grid--three">
                  <label><span className="form-label-text">{checkout.fullName} <b>*</b></span><input name="name" autoComplete="name" defaultValue={profile.fullName || user?.name || ''} required /></label>
                  <label><span className="form-label-text">{checkout.phone} <b>*</b></span><input name="phone" type="tel" autoComplete="tel" defaultValue={profile.phone} required /></label>
                  <label><span className="form-label-text">{checkout.email} <b>*</b></span><input name="email" type="email" autoComplete="email" defaultValue={user?.email ?? ''} required /></label>
                </div>
              </fieldset>

              <fieldset>
                <legend><span>2</span> {checkout.deliveryTitle}</legend>
                <div className="checkout-form__grid checkout-form__grid--three">
                  <div className={locationError ? 'checkout-form__location-field checkout-form__location-field--invalid' : 'checkout-form__location-field'}>
                    <span id="checkout-city-label" className="form-label-text">{checkout.province} <b>*</b></span>
                    <CheckoutLocationDropdown
                      id="checkout-city"
                      value={deliveryLocation.city}
                      placeholder={checkout.province}
                      options={provinceOptions}
                      searchPlaceholder={content.auth.searchOptions}
                      emptyMessage={content.auth.noOptionsFound}
                      statusLabel={isAdministrativeDataLoading ? content.auth.loadingOptions : isAdministrativeDataUnavailable ? content.auth.noOptionsFound : undefined}
                      disabled={!administrativeData}
                      invalid={Boolean(locationError)}
                      ariaLabelledBy="checkout-city-label"
                      ariaDescribedBy={locationError ? 'checkout-location-error' : undefined}
                      onChange={handleProvinceChange}
                    />
                    <input type="hidden" name="city" value={deliveryLocation.city} />
                  </div>
                  <div className={locationError ? 'checkout-form__location-field checkout-form__location-field--invalid' : 'checkout-form__location-field'}>
                    <span id="checkout-district-label" className="form-label-text">{checkout.district} <b>*</b></span>
                    <CheckoutLocationDropdown
                      id="checkout-district"
                      value={deliveryLocation.district}
                      placeholder={checkout.selectDistrict}
                      options={districtOptions}
                      searchPlaceholder={content.auth.searchOptions}
                      emptyMessage={selectedProvince ? content.auth.noOptionsFound : content.auth.selectProvinceFirst}
                      statusLabel={isAdministrativeDataLoading ? content.auth.loadingOptions : content.auth.selectProvinceFirst}
                      disabled={!administrativeData || !selectedProvince}
                      invalid={Boolean(locationError)}
                      ariaLabelledBy="checkout-district-label"
                      ariaDescribedBy={locationError ? 'checkout-location-error' : undefined}
                      onChange={handleDistrictChange}
                    />
                    <input type="hidden" name="district" value={deliveryLocation.district} />
                  </div>
                  <div className={locationError ? 'checkout-form__location-field checkout-form__location-field--invalid' : 'checkout-form__location-field'}>
                    <span id="checkout-ward-label" className="form-label-text">{checkout.ward} <b>*</b></span>
                    <CheckoutLocationDropdown
                      id="checkout-ward"
                      value={deliveryLocation.ward}
                      placeholder={checkout.selectWard}
                      options={wardOptions}
                      searchPlaceholder={content.auth.searchOptions}
                      emptyMessage={selectedDistrict ? content.auth.noOptionsFound : content.auth.selectDistrictFirst}
                      statusLabel={isAdministrativeDataLoading ? content.auth.loadingOptions : content.auth.selectDistrictFirst}
                      disabled={!administrativeData || !selectedDistrict}
                      invalid={Boolean(locationError)}
                      ariaLabelledBy="checkout-ward-label"
                      ariaDescribedBy={locationError ? 'checkout-location-error' : undefined}
                      onChange={handleWardChange}
                    />
                    <input type="hidden" name="ward" value={deliveryLocation.ward} />
                  </div>
                </div>
                {locationError ? <p id="checkout-location-error" className="checkout-form__location-error" role="alert">{locationError}</p> : null}
                <label className="checkout-form__full"><span className="form-label-text">{checkout.address} <b>*</b></span><input name="address" autoComplete="street-address" defaultValue={profile.address} required /></label>
                <label className="checkout-form__save-address">
                  <input name="save-address" type="checkbox" defaultChecked />
                  <span className="checkout-form__save-address-box" aria-hidden="true"><Check size={13} weight="bold" /></span>
                  <span>{checkout.saveAddress}</span>
                </label>
              </fieldset>

              <fieldset>
                <legend><span>3</span> {checkout.paymentTitle}</legend>
                <div className="payment-options">
                  <label className="payment-option">
                    <input type="radio" name="payment" value="bank" checked={paymentMethod === 'bank'} onChange={() => setPaymentMethod('bank')} />
                    <Bank size={26} weight="thin" aria-hidden="true" />
                    <span><strong>{checkout.bank}</strong><small>{checkout.bankDescription}</small></span>
                  </label>
                  <label className="payment-option">
                    <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                    <Truck size={26} weight="thin" aria-hidden="true" />
                    <span><strong>{checkout.cod}</strong><small>{checkout.codDescription}</small></span>
                  </label>
                  <label className="payment-option">
                    <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                    <CreditCard size={26} weight="thin" aria-hidden="true" />
                    <span><strong>{checkout.card}</strong><small>{checkout.cardDescription}</small></span>
                  </label>
                </div>
              </fieldset>

              <fieldset>
                <legend><span>4</span> {checkout.noteTitle}</legend>
                <label className="checkout-form__full"><span className="sr-only">{checkout.noteTitle}</span><textarea name="note" rows={4} placeholder={checkout.notePlaceholder} /></label>
              </fieldset>
            </form>

            <DonHangTomTat
              items={items}
              actionLabel={checkout.placeOrder}
              formId="checkout-form"
              onAction={user ? undefined : () => setIsLoginDialogOpen(true)}
              showProducts
            />
          </div>
        )}
      </div>

      {isLoginDialogOpen ? (
        <div className="auth-dialog-backdrop" role="presentation" onMouseDown={() => setIsLoginDialogOpen(false)}>
          <section
            className="auth-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-login-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="checkout-login-title">{content.auth.checkoutTitle}</h2>
            <p>{content.auth.checkoutDescription}</p>
            <div className="auth-dialog__actions">
              <button type="button" className="button button--ghost" onClick={() => setIsLoginDialogOpen(false)}>
                {content.auth.cancel}
              </button>
              <Link className="button button--gold" to="/dang-nhap" state={{ from: '/thanh-toan' }} onClick={() => setIsLoginDialogOpen(false)}>
                {content.auth.continueToLogin}
              </Link>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function CheckoutLocationDropdown({
  id,
  value,
  placeholder,
  options,
  searchPlaceholder,
  emptyMessage,
  statusLabel,
  disabled = false,
  invalid = false,
  ariaLabelledBy,
  ariaDescribedBy,
  onChange,
}: {
  id: string
  value: string
  placeholder: string
  options: CheckoutDropdownOption[]
  searchPlaceholder: string
  emptyMessage: string
  statusLabel?: string
  disabled?: boolean
  invalid?: boolean
  ariaLabelledBy?: string
  ariaDescribedBy?: string
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
    const normalizedQuery = normalizeSearchText(searchQuery)

    if (!normalizedQuery) {
      return displayOptions
    }

    return displayOptions.filter((option) =>
      normalizeSearchText(`${option.label} ${option.searchText ?? ''}`).includes(normalizedQuery),
    )
  }, [displayOptions, searchQuery])

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

    const frameId = window.requestAnimationFrame(() => searchInputRef.current?.focus())

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
  }, [isOpen])

  return (
    <div
      ref={dropdownRef}
      className={isDropdownOpen ? 'checkout-location-dropdown checkout-location-dropdown--open' : 'checkout-location-dropdown'}
    >
      <button
        ref={triggerRef}
        id={id}
        className="checkout-location-dropdown__trigger"
        type="button"
        aria-controls={menuId}
        aria-expanded={isDropdownOpen}
        aria-haspopup="dialog"
        aria-invalid={invalid || undefined}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
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
        <span className={selectedOption ? '' : 'checkout-location-dropdown__placeholder'}>{selectedOption?.label || statusLabel || placeholder}</span>
        <CaretDown size={16} weight="regular" aria-hidden="true" />
      </button>
      {isDropdownOpen ? (
        <div id={menuId} className="checkout-location-dropdown__menu" role="dialog" aria-label={placeholder}>
          <div className="checkout-location-dropdown__search">
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
                if (event.key === 'Enter') {
                  event.preventDefault()
                }

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
          <div className="checkout-location-dropdown__options" role="listbox" aria-label={placeholder}>
            <button
              ref={(element) => {
                optionRefs.current[0] = element
              }}
              className={!value ? 'checkout-location-dropdown__option checkout-location-dropdown__option--selected' : 'checkout-location-dropdown__option'}
              type="button"
              role="option"
              aria-selected={!value}
              onClick={() => selectOption('')}
              onKeyDown={(event) => {
                if (event.key === 'ArrowUp') {
                  event.preventDefault()
                  searchInputRef.current?.focus()
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
                  className={isSelected ? 'checkout-location-dropdown__option checkout-location-dropdown__option--selected' : 'checkout-location-dropdown__option'}
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
              <p className="checkout-location-dropdown__empty" role="status">{emptyMessage}</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
