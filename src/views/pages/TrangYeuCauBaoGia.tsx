import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useProductController } from "../../controllers/catalog/useProductController";
import { useUser } from "../../controllers/state/NguoiDungContext";
import { createQuotationRequest } from "../../services/quotation.service";

export function TrangYeuCauBaoGiaPage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAuthLoading } = useUser();
  const productId = Number(params.get("productId"));
  const { product, isLoading, errorMessage } = useProductController(productId);
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contactSummary = useMemo(
    () => [user?.name, user?.email, profile.phone].filter(Boolean).join(" · "),
    [profile.phone, user?.email, user?.name],
  );

  if (isAuthLoading) return null;
  if (!user) {
    return (
      <Navigate
        to="/dang-nhap"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }
  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return <Navigate to="/products" replace />;
  }
  if (isLoading) {
    return (
      <main className="trang-lien-he">
        <p>Đang tải sản phẩm báo giá…</p>
      </main>
    );
  }
  if (errorMessage || !product || product.saleType !== "REQUEST_QUOTE") {
    return (
      <main className="trang-lien-he">
        <h1>Không thể tạo yêu cầu báo giá</h1>
        <p>{errorMessage ?? "Sản phẩm này không thuộc luồng báo giá."}</p>
        <Link className="button button--gold" to="/products">
          Quay lại sản phẩm
        </Link>
      </main>
    );
  }

  const quotationProduct = product;
  const profileAddress = [
    profile.address,
    profile.ward,
    profile.district,
    profile.city,
  ]
    .filter(Boolean)
    .join(", ");
  const effectiveUnit = unit || quotationProduct.unit || "";
  const effectiveSiteAddress = siteAddress || profileAddress;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const parsedQuantity = Number(quantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setError("Số lượng hoặc diện tích phải lớn hơn 0.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await createQuotationRequest({
        siteAddress: effectiveSiteAddress,
        note: note || undefined,
        items: [
          {
            productId: quotationProduct.id,
            quantity: parsedQuantity,
            unit: effectiveUnit || undefined,
          },
        ],
      });
      setSuccessCode(response.request.code);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Không thể gửi yêu cầu báo giá.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (successCode) {
    return (
      <main className="trang-lien-he">
        <h1>Đã gửi yêu cầu báo giá</h1>
        <p>
          Mã yêu cầu của bạn là <strong>{successCode}</strong>. Nhân viên kinh
          doanh sẽ tiếp nhận và báo giá trên tài khoản của bạn.
        </p>
        <button
          className="button button--gold"
          type="button"
          onClick={() => navigate("/bao-gia-cua-toi")}
        >
          Xem báo giá của tôi
        </button>
      </main>
    );
  }

  return (
    <main className="trang-lien-he">
      <section
        className="contact-page__content"
        aria-labelledby="quotation-request-title"
      >
        <div className="contact-page__intro">
          <p className="eyebrow">CMID BUSINESS</p>
          <h1 id="quotation-request-title">Yêu cầu báo giá</h1>
          <p>
            Yêu cầu này được gửi từ tài khoản đã đăng nhập. Thông tin liên hệ:{" "}
            {contactSummary || "cần cập nhật hồ sơ"}.
          </p>
        </div>
        <form className="contact-form" onSubmit={submit}>
          <label>
            <span>Sản phẩm</span>
            <input value={quotationProduct.name} readOnly />
          </label>
          <label>
            <span>SKU</span>
            <input value={quotationProduct.sku} readOnly />
          </label>
          <div className="contact-form__row">
            <label>
              <span>Số lượng hoặc diện tích</span>
              <input
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                inputMode="decimal"
                required
              />
            </label>
            <label>
              <span>Đơn vị</span>
              <input
                value={effectiveUnit}
                onChange={(event) => setUnit(event.target.value)}
                maxLength={40}
                placeholder="Ví dụ: m², bộ, tấm"
              />
            </label>
          </div>
          <label>
            <span>Địa chỉ công trình hoặc giao hàng</span>
            <textarea
              value={effectiveSiteAddress}
              onChange={(event) => setSiteAddress(event.target.value)}
              maxLength={500}
              required
            />
          </label>
          <label>
            <span>Ghi chú yêu cầu</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={2000}
              placeholder="Mô tả nhu cầu, tiến độ hoặc yêu cầu kỹ thuật"
            />
          </label>
          <p className="contact-form__hint">
            Tệp đính kèm sẽ được bổ sung khi kho lưu trữ tài liệu được cấu hình;
            hệ thống không lưu tệp trực tiếp trong form này.
          </p>
          {error ? (
            <p className="contact-form__error" role="alert">
              {error}
            </p>
          ) : null}
          <button
            className="button button--gold"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang gửi…" : "Gửi yêu cầu báo giá"}
          </button>
        </form>
      </section>
    </main>
  );
}
