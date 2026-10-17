import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { AdminAuthProvider } from "../../../controllers/state/QuanTriContext";
import { useAdminAuth } from "../../../controllers/state/useQuanTriAuth";
import {
  getInventorySnapshots,
  getWarehouseLogs,
  getWarehouseOutboundRequests,
  getWarehouseReservations,
  getWarehouseStatus,
  syncWarehouseInventory,
  type InventorySnapshot,
  type WarehouseStatus,
} from "../../../services/warehouse.service";

export function TrangKhoQuanTriPage() {
  return (
    <AdminAuthProvider>
      <WarehouseWorkspace />
    </AdminAuthProvider>
  );
}

function WarehouseWorkspace() {
  const { adminUser, isAdminAuthLoading } = useAdminAuth();
  const [status, setStatus] = useState<WarehouseStatus | null>(null);
  const [inventory, setInventory] = useState<InventorySnapshot[]>([]);
  const [reservations, setReservations] = useState<
    Array<Record<string, unknown>>
  >([]);
  const [outbound, setOutbound] = useState<Array<Record<string, unknown>>>([]);
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);
  const [skus, setSkus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const canView = Boolean(
    adminUser?.permissions.some(
      (permission) => permission === "*" || permission === "inventory.view",
    ),
  );
  const canSync = Boolean(
    adminUser?.permissions.some(
      (permission) => permission === "*" || permission === "inventory.update",
    ),
  );

  const reload = () => {
    if (!canView) return;
    setError(null);
    void Promise.all([
      getWarehouseStatus(),
      getInventorySnapshots(),
      getWarehouseReservations(),
      getWarehouseOutboundRequests(),
      getWarehouseLogs(),
    ])
      .then(
        ([
          nextStatus,
          nextInventory,
          nextReservations,
          nextOutbound,
          nextLogs,
        ]) => {
          setStatus(nextStatus);
          setInventory(nextInventory);
          setReservations(nextReservations);
          setOutbound(nextOutbound);
          setLogs(nextLogs);
        },
      )
      .catch((caughtError) =>
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Không thể tải trạng thái kho.",
        ),
      );
  };
  useEffect(() => {
    if (!canView) return;
    let active = true;
    void Promise.all([
      getWarehouseStatus(),
      getInventorySnapshots(),
      getWarehouseReservations(),
      getWarehouseOutboundRequests(),
      getWarehouseLogs(),
    ])
      .then(
        ([
          nextStatus,
          nextInventory,
          nextReservations,
          nextOutbound,
          nextLogs,
        ]) => {
          if (!active) return;
          setStatus(nextStatus);
          setInventory(nextInventory);
          setReservations(nextReservations);
          setOutbound(nextOutbound);
          setLogs(nextLogs);
        },
      )
      .catch((caughtError) => {
        if (!active) return;
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Không thể tải trạng thái kho.",
        );
      });
    return () => {
      active = false;
    };
  }, [canView]);
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
        <p>Bạn không có quyền xem tồn kho.</p>
      </main>
    );

  async function sync(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = skus
      .split(/[,\n]/)
      .map((value) => value.trim())
      .filter(Boolean);
    if (!values.length) {
      setError("Nhập ít nhất một SKU để đồng bộ.");
      return;
    }
    setIsSyncing(true);
    setError(null);
    try {
      await syncWarehouseInventory(values);
      reload();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Không thể đồng bộ tồn kho.",
      );
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <main
      className="admin-shell"
      style={{ padding: "32px", maxWidth: 1180, margin: "0 auto" }}
    >
      <header>
        <p className="eyebrow">ADMIN · KHO</p>
        <h1>Tích hợp Warehouse API</h1>
        <p>
          CMID chỉ lưu snapshot và trạng thái yêu cầu. Kho độc lập vẫn là nguồn
          dữ liệu tồn và reservation chính.
        </p>
      </header>
      {status ? (
        <p>
          <strong>Chế độ: {status.mode}</strong> ·{" "}
          {status.mode === "mock"
            ? "Đang dùng mock development/test, chưa nghiệm thu kho thật."
            : status.mode === "remote"
              ? "Đã cấu hình adapter REST, cần nghiệm thu API kho thật."
              : "Chưa cấu hình Warehouse API."}
        </p>
      ) : null}
      {error ? (
        <p className="admin-login-form__error" role="alert">
          {error}
        </p>
      ) : null}
      {canSync ? (
        <form
          onSubmit={sync}
          style={{
            display: "flex",
            gap: 8,
            alignItems: "end",
            margin: "20px 0",
          }}
        >
          <label style={{ flex: 1 }}>
            SKU cần đồng bộ (ngăn cách bằng dấu phẩy)
            <input
              value={skus}
              onChange={(event) => setSkus(event.target.value)}
            />
          </label>
          <button
            className="button button--gold"
            type="submit"
            disabled={isSyncing}
          >
            {isSyncing ? "Đang đồng bộ…" : "Đồng bộ lại"}
          </button>
        </form>
      ) : null}
      <section>
        <h2>Stock snapshot</h2>
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>On hand</th>
              <th>Available</th>
              <th>Đồng bộ</th>
              <th>Cập nhật kho</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item.sku}>
                <td>{item.sku}</td>
                <td>{item.onHand}</td>
                <td>{item.available}</td>
                <td>
                  {item.syncStatus}
                  <br />
                  <small>{item.lastError ?? ""}</small>
                </td>
                <td>{new Date(item.lastSyncedAt).toLocaleString("vi-VN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2>Reservation</h2>
        <pre>{JSON.stringify(reservations, null, 2)}</pre>
      </section>
      <section>
        <h2>Outbound</h2>
        <pre>{JSON.stringify(outbound, null, 2)}</pre>
      </section>
      <section>
        <h2>Nhật ký tích hợp</h2>
        <pre>{JSON.stringify(logs, null, 2)}</pre>
      </section>
    </main>
  );
}
