import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { AdminAuthProvider } from "../../../controllers/state/QuanTriContext";
import { useAdminAuth } from "../../../controllers/state/useQuanTriAuth";
import {
  createAdminQuotation,
  getAdminQuotationRequests,
  getAdminQuotations,
  sendAdminQuotation,
  updateAdminQuotationRequest,
  type QuotationRequest,
  type Quotation,
} from "../../../services/quotation.service";

type DraftLine = {
  productId: number;
  productName: string;
  sku: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  discount: string;
};

export function TrangBaoGiaQuanTriPage() {
  return (
    <AdminAuthProvider>
      <AdminQuotationWorkspace />
    </AdminAuthProvider>
  );
}

function AdminQuotationWorkspace() {
  const { adminUser, isAdminAuthLoading } = useAdminAuth();
  const [requests, setRequests] = useState<QuotationRequest[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [selected, setSelected] = useState<QuotationRequest | null>(null);
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [validUntil, setValidUntil] = useState(defaultValidUntil());
  const [shippingFee, setShippingFee] = useState("0");
  const [vatPercent, setVatPercent] = useState("10");
  const [terms, setTerms] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "" | QuotationRequest["status"]
  >("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const canView = Boolean(
    adminUser?.permissions.some(
      (permission) => permission === "*" || permission === "quotation.view",
    ),
  );
  const canCreate = Boolean(
    adminUser?.permissions.some(
      (permission) => permission === "*" || permission === "quotation.create",
    ),
  );
  const canUpdate = Boolean(
    adminUser?.permissions.some(
      (permission) => permission === "*" || permission === "quotation.update",
    ),
  );

  const reload = () => {
    if (!canView) return;
    setError(null);
    void Promise.all([
      getAdminQuotationRequests({ search, status: statusFilter }),
      getAdminQuotations(),
    ])
      .then(([nextRequests, nextQuotations]) => {
        setRequests(nextRequests);
        setQuotations(nextQuotations);
      })
      .catch((caughtError) =>
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Không thể tải dữ liệu báo giá.",
        ),
      );
  };
  useEffect(() => {
    if (!canView) return;
    let active = true;
    void Promise.all([
      getAdminQuotationRequests({ search, status: statusFilter }),
      getAdminQuotations(),
    ])
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
            : "Không thể tải dữ liệu báo giá.",
        );
      });
    return () => {
      active = false;
    };
  }, [canView, search, statusFilter]);

  const projectedTotal = useMemo(() => {
    const subtotal = lines.reduce(
      (sum, line) =>
        sum +
        Math.max(0, Number(line.quantity) || 0) *
          Math.max(0, Number(line.unitPrice) || 0) -
        Math.max(0, Number(line.discount) || 0),
      0,
    );
    return Math.round(
      subtotal +
        subtotal * (Math.max(0, Number(vatPercent) || 0) / 100) +
        Math.max(0, Number(shippingFee) || 0),
    );
  }, [lines, shippingFee, vatPercent]);

  if (isAdminAuthLoading)
    return (
      <main className="admin-shell">
        <p>Đang khôi phục phiên quản trị…</p>
      </main>
    );
  if (!adminUser) return <Navigate to="/admin" replace />;
  if (!canView)
    return (
      <main className="admin-shell">
        <p>Bạn không có quyền xem báo giá.</p>
      </main>
    );

  function selectRequest(request: QuotationRequest) {
    setSelected(request);
    setLines(
      request.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: String(item.quantity),
        unit: item.unit ?? "",
        unitPrice: "",
        discount: "0",
      })),
    );
    setValidUntil(defaultValidUntil());
    setShippingFee("0");
    setVatPercent("10");
    setTerms("");
  }

  async function receive(request: QuotationRequest) {
    setBusy(request.id);
    setError(null);
    try {
      await updateAdminQuotationRequest(request.id, { status: "PROCESSING" });
      reload();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Không thể tiếp nhận yêu cầu.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function cancelRequest(request: QuotationRequest) {
    setBusy(request.id);
    setError(null);
    try {
      await updateAdminQuotationRequest(request.id, { status: "CANCELLED" });
      reload();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Không thể hủy yêu cầu báo giá.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function createQuotation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setBusy(selected.id);
    setError(null);
    try {
      await createAdminQuotation({
        requestId: selected.id,
        validUntil: new Date(validUntil).toISOString(),
        vatPercent: Number(vatPercent),
        shippingFee: Number(shippingFee),
        terms: terms || undefined,
        items: lines.map((line) => ({
          productId: line.productId,
          quantity: Number(line.quantity),
          unit: line.unit || undefined,
          unitPrice: Number(line.unitPrice),
          discount: Number(line.discount) || 0,
        })),
      });
      setSelected(null);
      reload();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Không thể lập báo giá.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function send(quotation: Quotation) {
    setBusy(quotation.id);
    setError(null);
    try {
      await sendAdminQuotation(quotation.id);
      reload();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Không thể gửi báo giá.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <main
      className="admin-shell"
      style={{ padding: "32px", maxWidth: 1180, margin: "0 auto" }}
    >
      <header>
        <p className="eyebrow">ADMIN · KINH DOANH</p>
        <h1>Yêu cầu và báo giá</h1>
        <p>
          Luồng server-backed: tiếp nhận yêu cầu, lập DRAFT, gửi khách, khách
          phản hồi và chuyển thành đơn.
        </p>
      </header>
      {error ? (
        <p className="admin-login-form__error" role="alert">
          {error}
        </p>
      ) : null}
      <section>
        <h2>Yêu cầu báo giá</h2>
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            margin: "12px 0",
          }}
        >
          <label style={{ flex: "1 1 280px" }}>
            Tìm theo mã, tên hoặc email khách
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label>
            Trạng thái
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "" | QuotationRequest["status"],
                )
              }
            >
              <option value="">Tất cả</option>
              <option value="NEW">NEW</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="QUOTED">QUOTED</option>
              <option value="CLOSED">CLOSED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </label>
        </div>
        {requests.length === 0 ? (
          <p>Chưa có yêu cầu.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {requests.map((request) => (
              <article
                key={request.id}
                style={{
                  border: "1px solid #d9d9d9",
                  padding: 16,
                  background: "#fff",
                }}
              >
                <strong>{request.code}</strong> · {request.status}
                <br />
                <small>
                  {request.customerName} · {request.customerPhone} ·{" "}
                  {request.siteAddress}
                </small>
                <p>
                  {request.items
                    .map(
                      (item) =>
                        `${item.productName} (${item.sku}) × ${item.quantity} ${item.unit ?? ""}`,
                    )
                    .join("; ")}
                </p>
                {request.status === "NEW" && canUpdate ? (
                  <button
                    className="button"
                    disabled={busy === request.id}
                    onClick={() => void receive(request)}
                  >
                    Tiếp nhận và phân công cho tôi
                  </button>
                ) : null}
                {request.status === "PROCESSING" && canCreate ? (
                  <button
                    className="button button--gold"
                    onClick={() => selectRequest(request)}
                  >
                    Lập báo giá
                  </button>
                ) : null}
                {["NEW", "PROCESSING", "QUOTED"].includes(request.status) &&
                canUpdate ? (
                  <button
                    className="button"
                    disabled={busy === request.id}
                    onClick={() => void cancelRequest(request)}
                  >
                    Hủy yêu cầu
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
      {selected ? (
        <section
          style={{
            marginTop: 32,
            border: "1px solid #d9d9d9",
            padding: 20,
            background: "#fff",
          }}
        >
          <h2>Lập báo giá cho {selected.code}</h2>
          <form onSubmit={createQuotation}>
            {lines.map((line, index) => (
              <fieldset
                key={line.productId}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr",
                  gap: 8,
                  border: 0,
                  padding: 0,
                  marginBottom: 12,
                }}
              >
                <label>
                  {line.productName} ({line.sku})
                  <input
                    value={line.quantity}
                    onChange={(event) =>
                      setLines((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, quantity: event.target.value }
                            : item,
                        ),
                      )
                    }
                    inputMode="decimal"
                    required
                  />
                </label>
                <label>
                  Đơn vị
                  <input
                    value={line.unit}
                    onChange={(event) =>
                      setLines((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, unit: event.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  Đơn giá
                  <input
                    value={line.unitPrice}
                    onChange={(event) =>
                      setLines((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, unitPrice: event.target.value }
                            : item,
                        ),
                      )
                    }
                    inputMode="numeric"
                    required
                  />
                </label>
                <label>
                  Chiết khấu
                  <input
                    value={line.discount}
                    onChange={(event) =>
                      setLines((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, discount: event.target.value }
                            : item,
                        ),
                      )
                    }
                    inputMode="numeric"
                  />
                </label>
              </fieldset>
            ))}
            <p>
              <label>
                Hiệu lực đến
                <input
                  type="datetime-local"
                  value={validUntil}
                  onChange={(event) => setValidUntil(event.target.value)}
                  required
                />
              </label>{" "}
              <label>
                VAT %
                <input
                  value={vatPercent}
                  onChange={(event) => setVatPercent(event.target.value)}
                  inputMode="numeric"
                />
              </label>{" "}
              <label>
                Phí giao hàng
                <input
                  value={shippingFee}
                  onChange={(event) => setShippingFee(event.target.value)}
                  inputMode="numeric"
                />
              </label>
            </p>
            <label>
              Điều khoản
              <textarea
                value={terms}
                onChange={(event) => setTerms(event.target.value)}
                maxLength={5000}
              />
            </label>
            <p>
              <strong>
                Tổng dự kiến: {projectedTotal.toLocaleString("vi-VN")}đ
              </strong>{" "}
              (backend sẽ tính và kiểm tra lại).
            </p>
            <button
              className="button button--gold"
              type="submit"
              disabled={busy === selected.id}
            >
              Lưu DRAFT
            </button>{" "}
            <button
              className="button"
              type="button"
              onClick={() => setSelected(null)}
            >
              Hủy
            </button>
          </form>
        </section>
      ) : null}
      <section style={{ marginTop: 32 }}>
        <h2>Báo giá đã lập</h2>
        {quotations.length === 0 ? (
          <p>Chưa có báo giá.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {quotations.map((quotation) => (
              <article
                key={quotation.id}
                style={{
                  border: "1px solid #d9d9d9",
                  padding: 16,
                  background: "#fff",
                }}
              >
                <strong>{quotation.code}</strong> · {quotation.status}
                <br />
                <span>
                  Tổng {Number(quotation.total).toLocaleString("vi-VN")}đ · hiệu
                  lực đến{" "}
                  {new Date(quotation.validUntil).toLocaleString("vi-VN")}
                </span>
                {quotation.status === "DRAFT" && canUpdate ? (
                  <p>
                    <button
                      className="button button--gold"
                      disabled={busy === quotation.id}
                      onClick={() => void send(quotation)}
                    >
                      Gửi báo giá
                    </button>
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

function defaultValidUntil() {
  const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}
