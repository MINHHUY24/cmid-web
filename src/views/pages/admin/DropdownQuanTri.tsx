/*
 * Vai trò: Dropdown select có type generic dùng trong Admin.
 */
import { CaretDownIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

export interface AdminDropdownOption<T extends string> {
  value: T;
  label: string;
}

interface AdminDropdownProps<T extends string> {
  ariaLabel: string;
  disabled?: boolean;
  onChange: (value: T) => void;
  options: Array<AdminDropdownOption<T>>;
  value: T;
}

export function AdminDropdown<T extends string>({
  ariaLabel,
  disabled = false,
  onChange,
  options,
  value,
}: AdminDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const activeOption =
    options.find((option) => option.value === value) ?? options[0];

  function openMenu() {
    if (disabled) return;
    if (closeTimerRef.current !== null)
      window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
    setIsClosing(false);
    setIsOpen(true);
  }

  function closeMenu(shouldRestoreFocus = false) {
    if (!isOpen && !isClosing) return;
    setIsOpen(false);
    setIsClosing(true);
    if (closeTimerRef.current !== null)
      window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setIsClosing(false);
      closeTimerRef.current = null;
    }, 180);
    if (shouldRestoreFocus)
      requestAnimationFrame(() => triggerRef.current?.focus());
  }

  useEffect(
    () => () => {
      if (closeTimerRef.current !== null)
        window.clearTimeout(closeTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!isOpen) return;
    const closeWhenClickingOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) closeMenu();
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu(true);
    };
    document.addEventListener("pointerdown", closeWhenClickingOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeWhenClickingOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div className="admin-dropdown" ref={rootRef}>
      <button
        ref={triggerRef}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className="admin-dropdown__trigger"
        disabled={disabled}
        onClick={() => (isOpen ? closeMenu() : openMenu())}
        type="button"
      >
        <span>{activeOption?.label ?? ""}</span>
        <CaretDownIcon aria-hidden="true" size={18} weight="bold" />
      </button>
      {isOpen || isClosing ? (
        <div
          aria-label={ariaLabel}
          className={`admin-dropdown__menu${isClosing ? " is-closing" : ""}`}
          role="listbox"
        >
          {options.map((option) => (
            <button
              aria-selected={option.value === value}
              className={option.value === value ? "is-selected" : ""}
              key={option.value}
              onClick={() => {
                onChange(option.value);
                closeMenu(true);
              }}
              role="option"
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
