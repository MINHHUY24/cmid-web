/*
 * Vai trò: Form liên hệ, lịch showroom và gửi inquiry.
 */
import {
  CaretDownIcon,
  CheckIcon,
  CheckCircleIcon,
  ClockIcon,
  EnvelopeSimpleIcon,
  MapPinIcon,
  PaperPlaneTiltIcon,
  PhoneIcon,
  StorefrontIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import heroImage from "../../models/assets/images/hero-lien-he-cmid.png";
import { CamKetDichVu } from "../components/common/CamKetDichVu";
import { KhungDauTrang } from "../components/common/KhungDauTrang";
import { useLanguage } from "../../controllers/state/NgonNguContext";
import { useSiteSettings } from "../../controllers/state/ThongTinWebsiteContext";
import { createContactInquiry } from "../../services/inquiry.service";
import {
  getPublishedShowrooms,
  type Showroom,
} from "../../services/showroom.service";

function getDirectionsUrl(showroom: Showroom) {
  const configuredMapUrl = showroom.mapUrl?.trim() ?? "";
  const isGenericMapsHome = /^https?:\/\/(?:www\.)?maps\.google\.com\/?$/i.test(
    configuredMapUrl,
  );

  if (configuredMapUrl && !isGenericMapsHome) {
    try {
      const parsedUrl = new URL(configuredMapUrl);
      if (parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:")
        return parsedUrl.href;
    } catch {
      // Fall through to a directions link generated from the managed address.
    }
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(showroom.address)}`;
}

export function TrangLienHePage() {
  const [isSubjectMenuOpen, setIsSubjectMenuOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [showrooms, setShowrooms] = useState<Showroom[]>([]);
  const subjectDropdownRef = useRef<HTMLDivElement>(null);
  const { content, language } = useLanguage();
  const { settings } = useSiteSettings();
  const { contact } = content;
  const primaryShowroom = showrooms[0];
  const businessHours =
    language === "en"
      ? {
          weekday: `Weekdays: ${settings.weekdayHours}`,
          weekend: `Weekend: ${settings.weekendHours}`,
        }
      : {
          weekday: `Ngày thường: ${settings.weekdayHours}`,
          weekend: `Cuối tuần: ${settings.weekendHours}`,
        };
  const siteToastRoot =
    typeof document !== "undefined"
      ? document.getElementById("site-toast-root")
      : null;

  useEffect(() => {
    function closeSubjectMenu(event: MouseEvent) {
      if (!subjectDropdownRef.current?.contains(event.target as Node)) {
        setIsSubjectMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", closeSubjectMenu);
    return () => document.removeEventListener("mousedown", closeSubjectMenu);
  }, []);

  useEffect(() => {
    let isCurrent = true;
    void getPublishedShowrooms()
      .then((next) => {
        if (isCurrent) setShowrooms(next);
      })
      .catch(() => undefined);
    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!successNotice) return undefined;
    const timeout = window.setTimeout(() => setSuccessNotice(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [successNotice]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSubject) {
      setSubmissionError("Vui lòng chọn chủ đề cần hỗ trợ.");
      setIsSubjectMenuOpen(true);
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    setSubmissionError(null);
    setIsSubmitting(true);

    try {
      await createContactInquiry({
        name: String(formData.get("name") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        email: String(formData.get("email") ?? ""),
        subject: selectedSubject,
        message: String(formData.get("message") ?? ""),
        consent: formData.get("consent") === "on",
      });
      form.reset();
      setSelectedSubject("");
      setSuccessNotice(contact.success);
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : "Không thể gửi yêu cầu. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function selectSubject(subject: string) {
    setSelectedSubject(subject);
    setSubmissionError(null);
    setIsSubjectMenuOpen(false);
  }

  return (
    <main className="trang-lien-he trang-noi-dung">
      {successNotice && siteToastRoot
        ? createPortal(
            <div
              className="contact-submit-toast"
              role="status"
              aria-live="polite"
            >
              <CheckCircleIcon size={22} weight="fill" aria-hidden="true" />
              <p>
                <strong>Đã gửi yêu cầu</strong>
                <span>{successNotice}</span>
              </p>
              <button
                type="button"
                onClick={() => setSuccessNotice(null)}
                aria-label="Đóng thông báo"
              >
                <XIcon size={18} />
              </button>
            </div>,
            siteToastRoot,
          )
        : null}
      <KhungDauTrang
        tone="toi"
        title={contact.title}
        description={contact.heroDescription}
        image={heroImage}
        imageAlt="Không gian tư vấn nội thất tại CMID"
        showDivider={false}
      />

      <div className="contact-shell khung-noi-dung">
        <section
          className="contact-info-strip"
          aria-label={contact.quickInfoLabel}
        >
          <article>
            <PhoneIcon size={31} weight="thin" aria-hidden="true" />
            <div>
              <h2>{contact.phone}</h2>
              <a href={`tel:${settings.phone.replaceAll(/[^+\d]/g, "")}`}>
                {settings.phone}
              </a>
              <p>{contact.phoneDescription}</p>
            </div>
          </article>
          <article>
            <EnvelopeSimpleIcon size={31} weight="thin" aria-hidden="true" />
            <div>
              <h2>{contact.email}</h2>
              <a href={`mailto:${settings.email}`}>{settings.email}</a>
              <p>{contact.emailDescription}</p>
            </div>
          </article>
          <article>
            <MapPinIcon size={31} weight="thin" aria-hidden="true" />
            <div>
              <h2>{contact.mainShowroom}</h2>
              <p>{primaryShowroom?.address ?? settings.address}</p>
            </div>
          </article>
          <article>
            <ClockIcon size={31} weight="thin" aria-hidden="true" />
            <div>
              <h2>{contact.openingHours}</h2>
              <p>{businessHours.weekday}</p>
              <p>{businessHours.weekend}</p>
            </div>
          </article>
        </section>

        <section className="contact-main-grid">
          <section
            className="contact-form-panel"
            aria-labelledby="contact-form-title"
          >
            <h2 id="contact-form-title">{contact.formTitle}</h2>
            <p className="contact-form-panel__intro">
              {contact.formDescription}
            </p>
            <form onSubmit={handleSubmit}>
              <label>
                <span className="form-label-text">
                  {contact.name} <b>*</b>
                </span>
                <input
                  name="name"
                  autoComplete="name"
                  placeholder={contact.namePlaceholder}
                  required
                />
              </label>
              <label>
                <span className="form-label-text">
                  {contact.phoneLabel} <b>*</b>
                </span>
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder={contact.phonePlaceholder}
                  required
                />
              </label>
              <label>
                <span className="form-label-text">
                  {contact.emailLabel} <b>*</b>
                </span>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  required
                />
              </label>
              <div className="contact-subject-field">
                <span className="form-label-text" id="contact-subject-label">
                  {contact.subject} <b>*</b>
                </span>
                <div
                  className={`contact-subject-dropdown${isSubjectMenuOpen ? " contact-subject-dropdown--open" : ""}`}
                  ref={subjectDropdownRef}
                >
                  <input name="subject" type="hidden" value={selectedSubject} />
                  <button
                    aria-controls="contact-subject-options"
                    aria-expanded={isSubjectMenuOpen}
                    aria-haspopup="listbox"
                    aria-labelledby="contact-subject-label"
                    className="contact-subject-dropdown__trigger"
                    type="button"
                    onClick={() => setIsSubjectMenuOpen((isOpen) => !isOpen)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") setIsSubjectMenuOpen(false);
                      if (event.key === "ArrowDown") setIsSubjectMenuOpen(true);
                    }}
                  >
                    <span
                      className={
                        selectedSubject
                          ? ""
                          : "contact-subject-dropdown__placeholder"
                      }
                    >
                      {selectedSubject || contact.subjectPlaceholder}
                    </span>
                    <CaretDownIcon size={18} weight="bold" aria-hidden="true" />
                  </button>
                  {isSubjectMenuOpen ? (
                    <div
                      className="contact-subject-dropdown__menu"
                      id="contact-subject-options"
                      role="listbox"
                      aria-labelledby="contact-subject-label"
                    >
                      {contact.subjects.map((subject) => {
                        const isSelected = selectedSubject === subject;
                        return (
                          <button
                            aria-selected={isSelected}
                            className={isSelected ? "is-selected" : undefined}
                            key={subject}
                            role="option"
                            type="button"
                            onClick={() => selectSubject(subject)}
                          >
                            <span>{subject}</span>
                            {isSelected ? (
                              <CheckIcon
                                size={16}
                                weight="bold"
                                aria-hidden="true"
                              />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
              <label className="contact-form-panel__wide">
                <span className="form-label-text">
                  {contact.message} <b>*</b>
                </span>
                <textarea
                  name="message"
                  rows={5}
                  placeholder={contact.messagePlaceholder}
                  required
                />
              </label>
              <label className="contact-form-panel__consent contact-form-panel__wide">
                <input type="checkbox" name="consent" required />
                {contact.consent}
              </label>
              <button
                className="button button--gold contact-form-panel__wide"
                type="submit"
                disabled={isSubmitting}
              >
                <PaperPlaneTiltIcon size={18} aria-hidden="true" />
                {isSubmitting ? "Đang gửi..." : contact.submit}
              </button>
              {submissionError ? (
                <p
                  className="contact-form-panel__error contact-form-panel__wide"
                  role="alert"
                >
                  {submissionError}
                </p>
              ) : null}
            </form>
          </section>

          {primaryShowroom ? (
            <section
              className="contact-map"
              aria-labelledby="contact-map-title"
            >
              <h2 id="contact-map-title">{contact.mapTitle}</h2>
              <iframe
                title={contact.mapFrameTitle}
                src={`https://www.google.com/maps?q=${encodeURIComponent(primaryShowroom.address)}&output=embed`}
                loading="lazy"
              />
              <article>
                <MapPinIcon size={26} weight="fill" aria-hidden="true" />
                <h3>{primaryShowroom.name}</h3>
                <p>{primaryShowroom.address}</p>
                <a
                  href={getDirectionsUrl(primaryShowroom)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {contact.directions}
                </a>
              </article>
            </section>
          ) : null}
        </section>

        <section
          className="contact-showrooms"
          aria-labelledby="contact-showroom-title"
        >
          <h2 id="contact-showroom-title">{contact.showroomTitle}</h2>
          <div className="contact-showrooms__list">
            {showrooms.map((showroom) => (
              <article key={showroom.id}>
                <StorefrontIcon size={28} weight="thin" aria-hidden="true" />
                <div className="contact-showrooms__details">
                  <h3>{showroom.name}</h3>
                  <p>{showroom.address}</p>
                  <div className="contact-showrooms__actions">
                    {showroom.phone ? (
                      <a
                        href={`tel:${showroom.phone.replaceAll(/[^+\d]/g, "")}`}
                      >
                        {showroom.phone}
                      </a>
                    ) : null}
                    <a
                      href={getDirectionsUrl(showroom)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MapPinIcon size={15} weight="fill" aria-hidden="true" />
                      {contact.directions}
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <CamKetDichVu />
      </div>
    </main>
  );
}
