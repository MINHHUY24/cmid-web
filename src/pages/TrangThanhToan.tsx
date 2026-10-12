import { Bank, CaretDown, Check, CheckCircle, CreditCard, MagnifyingGlass, Truck, Wallet, WarningCircle, X } from '@phosphor-icons/react'
import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Link, useSearchParams } from 'react-router-dom'
import { DonHangTomTat } from '../components/cart/DonHangTomTat'
import { KhungXuong } from '../components/common/KhungXuong'
import { TrangThaiPhienDangNhap } from '../components/common/TrangThaiPhienDangNhap'
import { PaymentQrDialog } from '../components/payment/PaymentQrDialog'
import momoQrAsset from '../components/payment/momo-qr.png'
import { useCart, type CartItem } from '../contexts/GioHangContext'
import { useLanguage } from '../contexts/NgonNguContext'
import { useUser } from '../contexts/NguoiDungContext'
import { useSiteSettings } from '../contexts/ThongTinWebsiteContext'
import { createMomoPayment, getMomoPaymentStatus, type MomoPaymentStatus } from '../services/payment.service'
import { createCheckoutOrder, createDemoCheckoutOrder, updateAdminPaymentStatus } from '../services/order.service'
import { formatCurrency } from '../utils/formatCurrency'
import { getOrderCosts, getProductPrice } from '../utils/order'
import { getPaymentErrorMessage } from './TrangThanhToan.helpers'

type PaymentMethod = 'bank' | 'cod' | 'momo' | 'card'

type PendingPayment = {
  customer: string
  email: string
  phone: string
  address: string
  paymentMethod: PaymentMethod
  paymentMethodLabel: string
  note: string
  items: CartItem[]
  amount: number
  orderCode: string
  serverBacked: boolean
}

const isMockPaymentMode = import.meta.env.DEV && import.meta.env.VITE_PAYMENT_MODE === 'mock'
const paymentRecipientName = import.meta.env.VITE_PAYMENT_RECIPIENT_NAME?.trim() || 'LÊ MINH HUY'
const vnpayBankId = import.meta.env.VITE_VNPAY_BANK_ID?.trim() || 'TCB'
const vnpayBankName = import.meta.env.VITE_VNPAY_BANK_NAME?.trim() || 'Techcombank'
const vnpayAccountNumber = import.meta.env.VITE_VNPAY_ACCOUNT_NUMBER?.trim() || '2410 5873 6252'
const momoAccountLabel = import.meta.env.VITE_MOMO_ACCOUNT_LABEL?.trim() || '******097'
const vnpayQrImageUrl = import.meta.env.VITE_VNPAY_QR_IMAGE_URL?.trim()
const momoQrImageUrl = import.meta.env.VITE_MOMO_QR_IMAGE_URL?.trim()

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

function compareAdministrativeLabels(left: string, right: string) {
  return left.localeCompare(right, 'vi', { numeric: true, sensitivity: 'base' })
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

function hasValidCardData(formData: FormData) {
  const number = String(formData.get('card-number') ?? '').replaceAll(/\s/g, '')
  const holder = String(formData.get('card-holder') ?? '').trim()
  const expiry = String(formData.get('card-expiry') ?? '').trim()
  const cvc = String(formData.get('card-cvc') ?? '').trim()

  return /^\d{16,19}$/u.test(number) && Boolean(holder) && /^\d{2}\/\d{2}$/u.test(expiry) && /^\d{3,4}$/u.test(cvc)
}

function createVietQrQuickLink(amount: number, orderCode: string) {
  const accountNumber = vnpayAccountNumber.replaceAll(/\s/g, '')
  const parameters = new URLSearchParams({
    amount: String(amount),
    addInfo: orderCode.slice(0, 25),
    accountName: paymentRecipientName,
  })

  return `https://img.vietqr.io/image/${encodeURIComponent(vnpayBankId)}-${encodeURIComponent(accountNumber)}-compact2.png?${parameters.toString()}`
}

export function TrangThanhToanPage() {
  const { clearCart, items } = useCart()
  const { content, language } = useLanguage()
  const { user, profile, isAuthLoading, updateProfile } = useUser()
  const { settings } = useSiteSettings()
  const { checkout, common } = content
  const [searchParams] = useSearchParams()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isPaymentStarting, setIsPaymentStarting] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [paymentNotice, setPaymentNotice] = useState('')
  const [momoPaymentStatus, setMomoPaymentStatus] = useState<MomoPaymentStatus | null>(null)
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null)
  const paymentTimeoutSeconds = Math.max(30, Math.round(settings.paymentQrTimeoutSeconds || 300))
  const [paymentCountdown, setPaymentCountdown] = useState(0)
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const [administrativeData, setAdministrativeData] = useState<AdministrativeData | null>(null)
  const [isAdministrativeDataLoading, setIsAdministrativeDataLoading] = useState(true)
  const [isAdministrativeDataUnavailable, setIsAdministrativeDataUnavailable] = useState(false)
  const [deliveryLocation, setDeliveryLocation] = useState(() => ({
    city: getAdministrativeDisplayName(profile.city) || 'Hồ Chí Minh',
    district: getAdministrativeDisplayName(profile.district),
    ward: getAdministrativeDisplayName(profile.ward),
  }))
  const [customerDetails, setCustomerDetails] = useState(() => ({
    fullName: profile.fullName || user?.name || '',
    phone: profile.phone,
    address: profile.address,
  }))
  const checkoutProfileUserIdRef = useRef<string | null>(null)
  const hasEditedCustomerDetailsRef = useRef(false)
  const hasEditedDeliveryLocationRef = useRef(false)
  const [locationError, setLocationError] = useState('')
  const momoOrderId = searchParams.get('momoOrderId')
  const siteToastRoot = typeof document !== 'undefined'
    ? document.getElementById('site-toast-root')
    : null

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

  useEffect(() => {
    if (!momoOrderId || isAuthLoading || !user) return

    let isCurrent = true
    let retryTimeout: number | undefined
    let attempts = 0

    const checkMomoPaymentStatus = () => {
      attempts += 1
      void getMomoPaymentStatus(momoOrderId)
        .then((status) => {
          if (!isCurrent) return
          setMomoPaymentStatus(status)

          if (status.paymentStatus === 'PAID') {
            clearCart()
            setIsSubmitted(true)
            return
          }

          if (status.paymentStatus === 'FAILED') {
            setPaymentError(checkout.momoPaymentFailed)
            return
          }

          if (attempts < 10) {
            retryTimeout = window.setTimeout(checkMomoPaymentStatus, 2_000)
          }
        })
        .catch((error: unknown) => {
          if (isCurrent) setPaymentError(getPaymentErrorMessage(error))
        })
    }

    checkMomoPaymentStatus()

    return () => {
      isCurrent = false
      if (retryTimeout !== undefined) window.clearTimeout(retryTimeout)
    }
  }, [checkout.momoPaymentFailed, clearCart, isAuthLoading, momoOrderId, user])

  useEffect(() => {
    const userId = user?.id
    if (!userId) {
      checkoutProfileUserIdRef.current = null
      hasEditedCustomerDetailsRef.current = false
      hasEditedDeliveryLocationRef.current = false
      return undefined
    }

    if (checkoutProfileUserIdRef.current !== userId) {
      checkoutProfileUserIdRef.current = userId
      hasEditedCustomerDetailsRef.current = false
      hasEditedDeliveryLocationRef.current = false
    }

    if (isAuthLoading) return undefined

    const savedCustomerDetails = {
      fullName: profile.fullName || user.name,
      phone: profile.phone,
      address: profile.address,
    }
    const savedLocation = {
      city: getAdministrativeDisplayName(profile.city) || 'Hồ Chí Minh',
      district: getAdministrativeDisplayName(profile.district),
      ward: getAdministrativeDisplayName(profile.ward),
    }
    const shouldSyncCustomerDetails = !hasEditedCustomerDetailsRef.current
    const shouldSyncDeliveryLocation = !hasEditedDeliveryLocationRef.current

    // The remote profile can arrive after the access session. Populate the
    // checkout from it unless the shopper has already started entering a
    // different address in this visit.
    void Promise.resolve().then(() => {
      if (checkoutProfileUserIdRef.current !== userId) return
      if (shouldSyncCustomerDetails) setCustomerDetails(savedCustomerDetails)
      if (shouldSyncDeliveryLocation) setDeliveryLocation(savedLocation)
    })
    return undefined
  }, [isAuthLoading, profile.address, profile.city, profile.district, profile.fullName, profile.phone, profile.ward, user?.id, user?.name])

  useEffect(() => {
    if (!paymentNotice) return undefined

    const noticeTimer = window.setTimeout(() => setPaymentNotice(''), 4_500)
    return () => window.clearTimeout(noticeTimer)
  }, [paymentNotice])

  const completePendingPayment = useCallback(async (isSuccessful: boolean) => {
    if (!pendingPayment) return

    setPendingPayment(null)
    setPaymentCountdown(0)

    if (!isSuccessful) {
      setPaymentNotice(checkout.paymentCancelled)
      return
    }

    try {
      if (!pendingPayment.serverBacked) throw new Error('Đơn thử nghiệm chưa được lưu trên máy chủ.')
      await updateAdminPaymentStatus(pendingPayment.orderCode, 'PAID', true)
      setIsSubmitted(true)
      clearCart()
    } catch (error) {
      setPaymentError(getPaymentErrorMessage(error))
    }
  }, [checkout.paymentCancelled, clearCart, pendingPayment])

  useEffect(() => {
    if (!isMockPaymentMode || !pendingPayment || (pendingPayment.paymentMethod !== 'bank' && pendingPayment.paymentMethod !== 'momo')) {
      return undefined
    }

    const paymentConfirmationTimer = window.setTimeout(
      () => void completePendingPayment(true),
      paymentTimeoutSeconds * 1_000,
    )

    return () => window.clearTimeout(paymentConfirmationTimer)
  }, [completePendingPayment, paymentTimeoutSeconds, pendingPayment])

  useEffect(() => {
    if (!pendingPayment || (pendingPayment.paymentMethod !== 'bank' && pendingPayment.paymentMethod !== 'momo')) {
      return undefined
    }

    const deadline = Date.now() + paymentTimeoutSeconds * 1_000
    const updateCountdown = () => {
      const nextCountdown = Math.max(0, Math.ceil((deadline - Date.now()) / 1_000))
      setPaymentCountdown(nextCountdown)

      if (nextCountdown === 0 && !isMockPaymentMode) {
        window.clearInterval(countdownTimer)
        setPendingPayment(null)
        setPaymentNotice(checkout.paymentQrExpired)
      }
    }

    const countdownTimer = window.setInterval(updateCountdown, 250)
    updateCountdown()

    return () => window.clearInterval(countdownTimer)
  }, [checkout.paymentQrExpired, paymentTimeoutSeconds, pendingPayment])

  const provinceOptions = useMemo(
    () => administrativeData?.provinces
      .map(toAdministrativeOption)
      .sort((left, right) => compareAdministrativeLabels(left.label, right.label)) ?? [],
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
          .sort((left, right) => compareAdministrativeLabels(left.label, right.label)) ?? []
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
          .sort((left, right) => compareAdministrativeLabels(left.label, right.label)) ?? []
      : [],
    [administrativeData, selectedDistrict],
  )
  const checkoutTotal = useMemo(
    () => getOrderCosts(items.reduce((total, item) => total + getProductPrice(item.product.price) * item.quantity, 0)).total,
    [items],
  )

  function handleProvinceChange(city: string) {
    hasEditedDeliveryLocationRef.current = true
    setDeliveryLocation({ city, district: '', ward: '' })
    setLocationError('')
  }

  function handleDistrictChange(district: string) {
    hasEditedDeliveryLocationRef.current = true
    setDeliveryLocation((currentLocation) => ({ ...currentLocation, district, ward: '' }))
    setLocationError('')
  }

  function handleWardChange(ward: string) {
    hasEditedDeliveryLocationRef.current = true
    setDeliveryLocation((currentLocation) => ({ ...currentLocation, ward }))
    setLocationError('')
  }

  function handleCustomerDetailChange(field: keyof typeof customerDetails, value: string) {
    hasEditedCustomerDetailsRef.current = true
    setCustomerDetails((currentDetails) => ({ ...currentDetails, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isAuthLoading) {
      return
    }

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
    setPaymentError('')
    setPaymentNotice('')

    const formData = new FormData(event.currentTarget)
    const getFieldValue = (fieldName: string) =>
      String(formData.get(fieldName) ?? '').trim()
    const submittedPaymentMethod = getFieldValue('payment') as PaymentMethod
    const paymentMethodLabels: Record<PaymentMethod, string> = {
      bank: checkout.bank,
      cod: checkout.cod,
      momo: checkout.momo,
      card: checkout.card,
    }

    if (isMockPaymentMode && submittedPaymentMethod === 'card' && !hasValidCardData(formData)) {
      setPaymentError(checkout.cardInvalid)
      return
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

    const shouldSaveAddress = formData.get('save-address') === 'on'

    const nextProfile = {
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
    }

    const checkoutOrderInput = {
      customerName: fullName,
      // An authenticated checkout must always be associated with the signed-in
      // account. Keeping this out of an editable form field also makes the
      // account's order history deterministic.
      customerEmail: user.email,
      customerPhone: phone,
      address: submittedAddress,
      note: getFieldValue('note') || undefined,
      items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
    }

    if (submittedPaymentMethod === 'cod') {
      setIsPaymentStarting(true)
      try {
        await createCheckoutOrder({ ...checkoutOrderInput, paymentMethod: 'COD' })
        await Promise.resolve(updateProfile(nextProfile))
        setIsSubmitted(true)
        clearCart()
      } catch (error) {
        setPaymentError(getPaymentErrorMessage(error))
      } finally {
        setIsPaymentStarting(false)
      }
      return
    }

    if (submittedPaymentMethod === 'bank') {
      setIsPaymentStarting(true)
      try {
        const order = await createCheckoutOrder({ ...checkoutOrderInput, paymentMethod: 'BANK_TRANSFER' })
        await Promise.resolve(updateProfile(nextProfile))
        setPaymentCountdown(paymentTimeoutSeconds)
        setPendingPayment({
          customer: fullName,
          email: user.email,
          phone,
          address: submittedAddress,
          paymentMethod: submittedPaymentMethod,
          paymentMethodLabel: paymentMethodLabels[submittedPaymentMethod],
          note: getFieldValue('note'),
          items,
          amount: checkoutTotal,
          orderCode: order.id,
          serverBacked: true,
        })
      } catch (error) {
        setPaymentError(getPaymentErrorMessage(error))
      } finally {
        setIsPaymentStarting(false)
      }
      return
    }

    if (submittedPaymentMethod === 'momo' || submittedPaymentMethod === 'card') {
      if (isMockPaymentMode) {
        setIsPaymentStarting(true)
        try {
          const order = await createDemoCheckoutOrder({
            ...checkoutOrderInput,
            paymentMethod: submittedPaymentMethod === 'momo' ? 'MOMO_WALLET' : 'MOMO_CARD',
          })
          await Promise.resolve(updateProfile(nextProfile))
          setPaymentCountdown(paymentTimeoutSeconds)
          setPendingPayment({
            customer: fullName,
            email: user.email,
            phone,
            address: submittedAddress,
            paymentMethod: submittedPaymentMethod,
            paymentMethodLabel: paymentMethodLabels[submittedPaymentMethod],
            note: getFieldValue('note'),
            items,
            amount: checkoutTotal,
            orderCode: order.id,
            serverBacked: true,
          })
        } catch (error) {
          setPaymentError(getPaymentErrorMessage(error))
        } finally {
          setIsPaymentStarting(false)
        }
        return
      }

      setIsPaymentStarting(true)

      try {
        const payment = await createMomoPayment({
          paymentMethod: submittedPaymentMethod === 'momo' ? 'MOMO_WALLET' : 'MOMO_CARD',
          customer: {
            name: fullName,
            email: user.email,
            phone,
          },
          address: submittedAddress,
          note: getFieldValue('note') || undefined,
          items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
        })

        await Promise.resolve(updateProfile(nextProfile))
        window.location.assign(payment.payUrl)
        return
      } catch (error: unknown) {
        setPaymentError(getPaymentErrorMessage(error))
        setIsPaymentStarting(false)
        return
      }
    }

    setPaymentError('Phương thức thanh toán không được hỗ trợ.')
  }

  if (isAuthLoading) {
    return <TrangThaiPhienDangNhap message={content.auth.restoringSession} variant="account" />
  }

  return (
    <main className="commerce-page checkout-page">
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
        ) : momoOrderId && (momoPaymentStatus?.paymentStatus === 'PENDING' || (!momoPaymentStatus && !paymentError)) ? (
          <section className="checkout-success" aria-live="polite">
            <CheckCircle size={48} weight="thin" aria-hidden="true" />
            <h2>{checkout.momoPendingTitle}</h2>
            <p>{checkout.momoPendingDescription}</p>
            {paymentError ? <p className="checkout-form__payment-error" role="alert">{paymentError}</p> : null}
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
                  <label><span className="form-label-text">{checkout.fullName} <b>*</b></span><input name="name" autoComplete="name" value={customerDetails.fullName} onChange={(event) => handleCustomerDetailChange('fullName', event.target.value)} required /></label>
                  <label><span className="form-label-text">{checkout.phone} <b>*</b></span><input name="phone" type="tel" autoComplete="tel" value={customerDetails.phone} onChange={(event) => handleCustomerDetailChange('phone', event.target.value)} required /></label>
                  <label><span className="form-label-text">{checkout.email} <b>*</b></span><input name="email" type="email" autoComplete="email" value={user?.email ?? ''} readOnly required /></label>
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
                      statusLabel={isAdministrativeDataUnavailable ? content.auth.noOptionsFound : undefined}
                      loadingLabel={isAdministrativeDataLoading ? content.auth.loadingOptions : undefined}
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
                      statusLabel={content.auth.selectProvinceFirst}
                      loadingLabel={isAdministrativeDataLoading ? content.auth.loadingOptions : undefined}
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
                      statusLabel={content.auth.selectDistrictFirst}
                      loadingLabel={isAdministrativeDataLoading ? content.auth.loadingOptions : undefined}
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
                <label className="checkout-form__full"><span className="form-label-text">{checkout.address} <b>*</b></span><input name="address" autoComplete="street-address" value={customerDetails.address} onChange={(event) => handleCustomerDetailChange('address', event.target.value)} required /></label>
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
                    <input type="radio" name="payment" value="momo" checked={paymentMethod === 'momo'} onChange={() => setPaymentMethod('momo')} />
                    <Wallet size={26} weight="thin" aria-hidden="true" />
                    <span><strong>{checkout.momo}</strong><small>{checkout.momoDescription}</small></span>
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
                {isMockPaymentMode && paymentMethod === 'card' ? (
                  <section className="checkout-card-form" aria-labelledby="card-form-title">
                    <h3 id="card-form-title">{checkout.cardFormTitle}</h3>
                    <div className="checkout-form__grid checkout-form__grid--card">
                      <label className="checkout-card-form__number">
                        <span className="form-label-text">{checkout.cardNumber} <b>*</b></span>
                        <input name="card-number" inputMode="numeric" autoComplete="off" maxLength={19} pattern="[0-9 ]{16,19}" placeholder="1234 5678 9012 3456" required />
                      </label>
                      <label>
                        <span className="form-label-text">{checkout.cardHolder} <b>*</b></span>
                        <input name="card-holder" autoComplete="off" maxLength={80} placeholder="NGUYEN VAN A" required />
                      </label>
                      <label>
                        <span className="form-label-text">{checkout.cardExpiry} <b>*</b></span>
                        <input name="card-expiry" inputMode="numeric" autoComplete="off" maxLength={5} pattern="[0-9]{2}/[0-9]{2}" placeholder="MM/YY" required />
                      </label>
                      <label>
                        <span className="form-label-text">{checkout.cardCvc} <b>*</b></span>
                        <input name="card-cvc" inputMode="numeric" autoComplete="off" maxLength={4} pattern="[0-9]{3,4}" placeholder="123" required />
                      </label>
                    </div>
                    <label className="checkout-form__save-address checkout-form__save-card">
                      <input name="save-card" type="checkbox" />
                      <span className="checkout-form__save-address-box" aria-hidden="true"><Check size={13} weight="bold" /></span>
                      <span>{checkout.saveCard}</span>
                    </label>
                  </section>
                ) : null}
                {paymentError ? <p className="checkout-form__payment-error" role="alert">{paymentError}</p> : null}
              </fieldset>

              <fieldset>
                <legend><span>4</span> {checkout.noteTitle}</legend>
                <label className="checkout-form__full"><span className="sr-only">{checkout.noteTitle}</span><textarea name="note" rows={4} placeholder={checkout.notePlaceholder} /></label>
              </fieldset>
            </form>

            <DonHangTomTat
              items={items}
              actionLabel={isPaymentStarting ? checkout.redirectingToMomo : checkout.placeOrder}
              formId="checkout-form"
              onAction={user ? undefined : () => setIsLoginDialogOpen(true)}
              showProducts
              disabled={isPaymentStarting || isAuthLoading}
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

      {pendingPayment?.paymentMethod === 'bank' || pendingPayment?.paymentMethod === 'momo' ? (
        <PaymentQrDialog
          method={pendingPayment.paymentMethod}
          amount={formatCurrency(pendingPayment.amount, language)}
          orderCode={pendingPayment.orderCode}
          recipientName={paymentRecipientName}
          recipientDetail={pendingPayment.paymentMethod === 'bank' ? `${vnpayBankName} • ${vnpayAccountNumber}` : `MoMo • ${momoAccountLabel}`}
          qrImageUrl={!isMockPaymentMode ? (pendingPayment.paymentMethod === 'bank' ? vnpayQrImageUrl || createVietQrQuickLink(pendingPayment.amount, pendingPayment.orderCode) : momoQrImageUrl || momoQrAsset) : undefined}
          labels={{
            title: pendingPayment.paymentMethod === 'bank' ? checkout.vnpayQrTitle : checkout.momoQrTitle,
            amount: checkout.paymentQrAmount,
            orderCode: checkout.paymentQrOrderCode,
            recipient: checkout.paymentQrRecipient,
          waiting: checkout.paymentQrWaiting,
          waitingDescription: checkout.paymentQrWaitingDescription,
          timeRemaining: checkout.paymentQrTimeRemaining,
          cancel: checkout.paymentQrCancel,
          testSuccess: checkout.paymentQrTestSuccess,
          close: checkout.paymentQrClose,
          }}
          remainingSeconds={paymentCountdown}
          onCancel={() => completePendingPayment(false)}
          onTestSuccess={isMockPaymentMode ? () => completePendingPayment(true) : undefined}
        />
      ) : pendingPayment ? (
        <div className="auth-dialog-backdrop" role="presentation" onMouseDown={() => completePendingPayment(false)}>
          <section
            className="auth-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-confirmation-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="payment-confirmation-title">{checkout.paymentConfirmationTitle}</h2>
            <p>{checkout.paymentConfirmationDescription}</p>
            <div className="auth-dialog__actions">
              <button type="button" className="button button--ghost" onClick={() => completePendingPayment(false)}>
                {checkout.paymentConfirmationCancel}
              </button>
              <button type="button" className="button button--gold" onClick={() => completePendingPayment(true)}>
                {checkout.paymentConfirmationSuccess}
              </button>
            </div>
          </section>
        </div>
      ) : null}
      {paymentNotice && siteToastRoot ? createPortal(
        <div className="checkout-payment-toast" role="status" aria-live="polite">
          <span className="checkout-payment-toast__icon" aria-hidden="true">
            <WarningCircle size={27} weight="fill" />
          </span>
          <div className="checkout-payment-toast__content">
            <strong>{checkout.paymentNoticeTitle}</strong>
          </div>
          <button type="button" aria-label={content.cart.closeNotification} onClick={() => setPaymentNotice('')}>
            <X size={22} weight="bold" aria-hidden="true" />
          </button>
        </div>,
        siteToastRoot,
      ) : null}
    </main>
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
  loadingLabel,
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
  loadingLabel?: string
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

  if (loadingLabel) {
    return (
      <div className="checkout-location-dropdown checkout-location-dropdown--loading" role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">{loadingLabel}</span>
        <KhungXuong className="checkout-location-dropdown__skeleton" />
      </div>
    )
  }

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
