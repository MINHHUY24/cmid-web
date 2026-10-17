/*
 * Vai trò: Dropdown sắp xếp sản phẩm.
 */
import { CaretDownIcon, CheckIcon } from '@phosphor-icons/react'
import { useEffect, useId, useRef, useState } from 'react'

export interface CatalogSortOption {
  value: string
  label: string
}

interface CatalogSortDropdownProps {
  options: CatalogSortOption[]
  value: string
  label: string
  onChange: (value: string) => void
}

export function CatalogSortDropdown({ options, value, label, onChange }: CatalogSortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const menuId = useId()
  const selectedOptionIndex = Math.max(0, options.findIndex((option) => option.value === value))
  const selectedOption = options[selectedOptionIndex]

  useEffect(() => {
    if (!isOpen) return undefined

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }

    document.addEventListener('mousedown', closeOnOutsideClick)

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
    }
  }, [isOpen])

  function focusOption(index: number) {
    if (!options.length) return

    const normalizedIndex = (index + options.length) % options.length
    setActiveIndex(normalizedIndex)
    optionRefs.current[normalizedIndex]?.focus()
  }

  function openMenu(index = selectedOptionIndex) {
    setActiveIndex(index)
    setIsOpen(true)
    window.requestAnimationFrame(() => optionRefs.current[index]?.focus())
  }

  function selectOption(nextValue: string) {
    onChange(nextValue)
    setIsOpen(false)
    window.requestAnimationFrame(() => triggerRef.current?.focus())
  }

  return (
    <div
      className={`catalog-sort${isOpen ? ' catalog-sort--open' : ''}`}
      ref={rootRef}
      onBlur={(event) => {
        if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return
        setIsOpen(false)
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return
        setIsOpen(false)
        triggerRef.current?.focus()
      }}
    >
      <button
        ref={triggerRef}
        className="catalog-sort__trigger"
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false)
            return
          }

          openMenu()
        }}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
          event.preventDefault()
          openMenu()
        }}
      >
        <span>{selectedOption?.label}</span>
        <CaretDownIcon size={17} weight="bold" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div id={menuId} className="catalog-sort__menu" role="menu" aria-label={label}>
          {options.map((option, optionIndex) => {
            const isSelected = option.value === value

            return (
              <button
                key={option.value}
                ref={(element) => {
                  optionRefs.current[optionIndex] = element
                }}
                className={isSelected ? 'is-selected' : undefined}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                tabIndex={activeIndex === optionIndex ? 0 : -1}
                onClick={() => selectOption(option.value)}
                onFocus={() => setActiveIndex(optionIndex)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown') {
                    event.preventDefault()
                    focusOption(optionIndex + 1)
                  }

                  if (event.key === 'ArrowUp') {
                    event.preventDefault()
                    focusOption(optionIndex - 1)
                  }

                  if (event.key === 'Home') {
                    event.preventDefault()
                    focusOption(0)
                  }

                  if (event.key === 'End') {
                    event.preventDefault()
                    focusOption(options.length - 1)
                  }
                }}
              >
                <span>{option.label}</span>
                {isSelected ? <CheckIcon size={17} weight="bold" aria-hidden="true" /> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
