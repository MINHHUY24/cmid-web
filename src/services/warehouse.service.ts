import { apiFetch } from "./api";

export type WarehouseStatus = {
  mode: "mock" | "remote" | "unconfigured";
  configured: boolean;
  verifiedWarehouse: boolean;
  lastActivity: {
    success: boolean;
    message: string | null;
    createdAt: string;
  } | null;
};

export type InventorySnapshot = {
  sku: string;
  onHand: number;
  available: number;
  warehouseUpdatedAt: string | null;
  lastSyncedAt: string;
  syncStatus: "SUCCESS" | "FAILED" | "STALE";
  lastError: string | null;
};

export function getWarehouseStatus() {
  return apiFetch<WarehouseStatus>("/warehouse/admin/status", {
    authScope: "admin",
  });
}

export function getInventorySnapshots() {
  return apiFetch<InventorySnapshot[]>("/warehouse/admin/inventory", {
    authScope: "admin",
  });
}

export function syncWarehouseInventory(skus: string[]) {
  return apiFetch<InventorySnapshot[]>("/warehouse/admin/inventory/sync", {
    method: "POST",
    authScope: "admin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skus }),
  });
}

export function getWarehouseReservations() {
  return apiFetch<Array<Record<string, unknown>>>(
    "/warehouse/admin/reservations",
    { authScope: "admin" },
  );
}

export function getWarehouseOutboundRequests() {
  return apiFetch<Array<Record<string, unknown>>>(
    "/warehouse/admin/outbound-requests",
    { authScope: "admin" },
  );
}

export function getWarehouseLogs() {
  return apiFetch<Array<Record<string, unknown>>>("/warehouse/admin/logs", {
    authScope: "admin",
  });
}
