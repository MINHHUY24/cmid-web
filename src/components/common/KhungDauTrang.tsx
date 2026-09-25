import { ArrowRight } from "@phosphor-icons/react";
import type { ReactNode } from "react";

interface KhungDauTrangProps {
  title: ReactNode;
  description: string;
  image: string;
  imageAlt: string;
  actionLabel?: string;
  actionHref?: string;
  tone?: "sang" | "toi";
}

export function KhungDauTrang({
  title,
  description,
  image,
  imageAlt,
  actionLabel,
  actionHref,
  tone = "sang",
}: KhungDauTrangProps) {
  return (
    <section className={`khung-dau-trang khung-dau-trang--${tone}`}>
      <div className="khung-dau-trang__noi-dung">
        <h1>{title}</h1>
        <span className="khung-dau-trang__duong-ke" aria-hidden="true" />
        <p>{description}</p>
        {actionLabel && actionHref ? (
          <a className="button cmid-hero-action khung-dau-trang__button" href={actionHref}>
            {actionLabel}
            <ArrowRight size={18} weight="bold" aria-hidden="true" />
          </a>
        ) : null}
      </div>
      <div className="khung-dau-trang__anh">
        <img src={image} alt={imageAlt} width="1672" height="941" />
      </div>
    </section>
  );
}
