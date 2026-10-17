/*
 * Vai trò: Dialog QR thanh toán và đồng hồ đếm hạn giao dịch.
 */
import { CircleNotchIcon, XIcon } from '@phosphor-icons/react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

type PaymentQrDialogLabels = {
  title: string
  amount: string
  orderCode: string
  recipient: string
  waiting: string
  waitingDescription: string
  timeRemaining: string
  cancel: string
  testSuccess: string
  close: string
}

type PaymentQrDialogProps = {
  method: 'bank' | 'momo'
  amount: string
  orderCode: string
  recipientName: string
  recipientDetail: string
  qrImageUrl?: string
  remainingSeconds: number
  labels: PaymentQrDialogLabels
  onCancel: () => void
  onTestSuccess?: () => void
}

const QR_SIZE = 29

function getSeed(value: string) {
  return [...value].reduce((seed, character) => ((seed * 31) + character.charCodeAt(0)) >>> 0, 2166136261)
}

function getFinderCell(row: number, column: number, top: number, left: number) {
  const relativeRow = row - top
  const relativeColumn = column - left

  if (relativeRow < 0 || relativeRow > 6 || relativeColumn < 0 || relativeColumn > 6) return null

  const isOuterEdge = relativeRow === 0 || relativeRow === 6 || relativeColumn === 0 || relativeColumn === 6
  const isInnerSquare = relativeRow >= 2 && relativeRow <= 4 && relativeColumn >= 2 && relativeColumn <= 4

  return isOuterEdge || isInnerSquare
}

function isQrCellDark(row: number, column: number, seed: number) {
  for (const [top, left] of [[1, 1], [1, QR_SIZE - 8], [QR_SIZE - 8, 1]]) {
    const finderCell = getFinderCell(row, column, top, left)
    if (finderCell !== null) return finderCell
  }

  if (row === 7 || column === 7) return (row + column) % 2 === 0

  const value = Math.abs(Math.imul(row + 11, 1103515245) ^ Math.imul(column + 17, 12345) ^ seed)
  return value % 100 < 44
}

function DecorativeQrCode({ value }: { value: string }) {
  const seed = getSeed(value)

  return (
    <div className="payment-qr-dialog__qr" role="img" aria-label="Mã QR thanh toán">
      {Array.from({ length: QR_SIZE * QR_SIZE }, (_, index) => {
        const row = Math.floor(index / QR_SIZE)
        const column = index % QR_SIZE

        return <span key={index} className={isQrCellDark(row, column, seed) ? 'is-dark' : undefined} />
      })}
    </div>
  )
}

function formatRemainingTime(value: number) {
  const minutes = Math.floor(Math.max(value, 0) / 60)
  const seconds = Math.max(value, 0) % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function PaymentQrDialog({
  method,
  amount,
  orderCode,
  recipientName,
  recipientDetail,
  qrImageUrl,
  remainingSeconds,
  labels,
  onCancel,
  onTestSuccess,
}: PaymentQrDialogProps) {
  const qrValue = `${method}|${orderCode}|${amount}|${recipientName}|${recipientDetail}`
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const onCancelRef = useRef(onCancel)

  useEffect(() => {
    onCancelRef.current = onCancel
  }, [onCancel])

  useEffect(() => {
    const previouslyFocusedElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    const previousOverflow = document.body.style.overflow
    const previousPaddingRight = document.body.style.paddingRight
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth)
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus())

    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onCancelRef.current()
    }

    document.addEventListener('keydown', closeOnEscape)

    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = previousOverflow
      document.body.style.paddingRight = previousPaddingRight

      if (previouslyFocusedElement?.isConnected) {
        previouslyFocusedElement.focus({ preventScroll: true })
      }
    }
  }, [])

  const dialog = (
    <div className="payment-qr-dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        className={`payment-qr-dialog payment-qr-dialog--${method}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-qr-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button ref={closeButtonRef} type="button" className="payment-qr-dialog__close" aria-label={labels.close} onClick={onCancel}>
          <XIcon size={22} weight="regular" aria-hidden="true" />
        </button>

        <div className="payment-qr-dialog__code-side">
          {qrImageUrl ? (
            <div className="payment-qr-dialog__qr-image-frame">
              <img className="payment-qr-dialog__qr-image" src={qrImageUrl} alt="Mã QR thanh toán" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <DecorativeQrCode value={qrValue} />
          )}
        </div>

        <div className="payment-qr-dialog__details">
          <h2 id="payment-qr-dialog-title">{labels.title}</h2>
          <dl>
            <div className="payment-qr-dialog__amount-row">
              <dt>{labels.amount}</dt>
              <dd>{amount}</dd>
            </div>
            <div>
              <dt>{labels.orderCode}</dt>
              <dd>{orderCode}</dd>
            </div>
            <div>
              <dt>{labels.recipient}</dt>
              <dd>
                <strong>{recipientName}</strong>
                <span>{recipientDetail}</span>
              </dd>
            </div>
          </dl>

          <div className="payment-qr-dialog__status" aria-live="polite">
            <CircleNotchIcon size={22} weight="bold" aria-hidden="true" />
            <div>
              <strong>{labels.waiting}</strong>
              <p>{labels.waitingDescription}</p>
            </div>
          </div>

          <div className="payment-qr-dialog__timer" aria-live="polite">
            <span>{labels.timeRemaining}</span>
            <strong>{formatRemainingTime(remainingSeconds)}</strong>
          </div>

          <button type="button" className="button button--ghost payment-qr-dialog__cancel" onClick={onCancel}>
            {labels.cancel}
          </button>
          {onTestSuccess ? (
            <button type="button" className="button button--gold payment-qr-dialog__test-success" onClick={onTestSuccess}>
              {labels.testSuccess}
            </button>
          ) : null}
        </div>
      </section>
    </div>
  )

  const modalRoot = typeof document === 'undefined'
    ? null
    : document.getElementById('site-modal-root') ?? document.body

  return modalRoot ? createPortal(dialog, modalRoot) : dialog
}
