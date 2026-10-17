import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useUser } from "../../controllers/state/NguoiDungContext";
import {
  acceptQuotation,
  getMyQuotationRequests,
  getMyQuotations,
  rejectQuotation,
  type Quotation,
  type QuotationRequest,
} from "../../services/quotation.service";

export function TrangBaoGiaCuaToiPage() {
  const location = useLocation();
  const { user, isAuthLoading } = useUser();
  const [requests, setRequests] = useState<QuotationRequest[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const reload = () => {
    setError(null);
    void Promise.all([getMyQuotationRequests(), getMyQuotations()])
      .then(([nextRequests, nextQuotations]) => {
        setRequests(nextRequests);
        setQuotations(nextQuotations);
      })
      .catch((caughtError) =>
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Không thể tải báo giá.",
        ),
      );
  };

  useEffect(() => {
    if (!user) return;
    let active = true;
    void Promise.all([getMyQuotationRequests(), getMyQuotations()])
      .then(([nextRequests, nextQuotations]) => {
        if (!active) return;
        setRequests(nextRequests);
        setQuotations(nextQuotations);
      })
      .catch((caughtError) => {
        if (!active) return;
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Không thể tải báo giá.",
        );
      });
    return () => {
      active = false;
    };
  }, [user]);

  if (isAuthLoading) return null;
  if (!user)
    return (
      <Navigate to="/dang-nhap" replace state={{ from: location.pathname }} />
    );

  async function accept(id: string) {
    setPendingId(id);
    setError(null);
    try {
      await acceptQuotation(id);
      reload();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Không thể chấp nhận báo giá.",
      );
    } finally {
      setPendingId(null);
    }
  }
  async function reject(id: string) {
    setPendingId(id);
    setError(null);
    try {
      await rejectQuotation(id);
      reload();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Không thể từ chối báo giá.",
      );
    } finally {
      setPendingId(null);
    }
  }

  return (
    <main className="trang-lien-he">
      <section
        className="contact-page__content"
        aria-labelledby="my-quotations-title"
      >
        <div className="contact-page__intro">
          <p className="eyebrow">TÀI KHOẢN CMID</p>
          <h1 id="my-quotations-title">Yêu cầu và báo giá của tôi</h1>
          <p>
            Kiểm tra hiệu lực báo giá trước khi chấp nhận. Mỗi báo giá chỉ được
            chuyển thành một đơn hàng.
          </p>
        </div>
        {error ? (
          <p className="contact-form__error" role="alert">
            {error}
          </p>
        ) : null}
        <h2>Yêu cầu đã gửi</h2>
        {requests.length === 0 ? (
          <p>
            Chưa có yêu cầu báo giá. <Link to="/products">Xem sản phẩm</Link>.
          </p>
        ) : (
          <ul>
            {requests.map((request) => (
              <li key={request.id}>
                <strong>{request.code}</strong> · {request.status} ·{" "}
                {new Date(request.createdAt).toLocaleDateString("vi-VN")}
                <br />
                {request.items
                  .map(
                    (item) =>
                      `${item.productName} (${item.sku}) × ${item.quantity} ${item.unit ?? ""}`,
                  )
                  .join(", ")}
              </li>
            ))}
          </ul>
        )}
        <h2>Báo giá</h2>
        {quotations.length === 0 ? (
          <p>Sales chưa gửi báo giá nào cho tài khoản của bạn.</p>
        ) : (
          <div>
            {quotations.map((quotation) => (
              <article key={quotation.id} className="contact-page__card">
                <h3>
                  {quotation.code} · {quotation.status}
                </h3>
                <p>
                  Hiệu lực đến{" "}
                  {new Date(quotation.validUntil).toLocaleString("vi-VN")}
                </p>
                <ul>
                  {quotation.items.map((item) => (
                    <li key={item.id}>
                      {item.productName}:{" "}
                      {Number(item.quantity).toLocaleString("vi-VN")}{" "}
                      {item.unit ?? ""} ×{" "}
                      {Number(item.unitPrice).toLocaleString("vi-VN")}đ
                    </li>
                  ))}
                </ul>
                <p>
                  <strong>
                    Tổng thanh toán:{" "}
                    {Number(quotation.total).toLocaleString("vi-VN")}đ
                  </strong>
                </p>
                {quotation.status === "SENT" ? (
                  <p>
                    <button
                      className="button button--gold"
                      disabled={pendingId === quotation.id}
                      onClick={() => void accept(quotation.id)}
                    >
                      Chấp nhận và tạo đơn
                    </button>{" "}
                    <button
                      className="button"
                      disabled={pendingId === quotation.id}
                      onClick={() => void reject(quotation.id)}
                    >
                      Từ chối
                    </button>
                  </p>
                ) : null}
                {quotation.order ? (
                  <p>
                    Đơn hàng nguồn:{" "}
                    <Link to="/tai-khoan">{quotation.order.id}</Link>
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
