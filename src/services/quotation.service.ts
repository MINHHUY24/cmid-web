import { apiFetch } from "./api";

export type QuotationRequestStatus =
  | "NEW"
  | "PROCESSING"
  | "QUOTED"
  | "CLOSED"
  | "CANCELLED";

export type QuotationStatus =
  | "DRAFT"
  | "SENT"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "CONVERTED";

export type QuotationRequest = {
  id: string;
  code: string;
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  siteAddress: string;
  note: string | null;
  attachmentUrls: string[] | null;
  status: QuotationRequestStatus;
  assignedToId: number | null;
  createdAt: string;
  items: Array<{
    id: string;
    productId: number;
    productName: string;
    sku: string;
    unit: string | null;
    quantity: number | string;
  }>;
};

export type Quotation = {
  id: string;
  code: string;
  requestId: string;
  status: QuotationStatus;
  subtotal: number | string;
  discount: number | string;
  vatPercent: number;
  vat: number | string;
  shippingFee: number | string;
  total: number | string;
  validUntil: string;
  terms: string | null;
  note: string | null;
  sentAt: string | null;
  request: QuotationRequest;
  items: Array<{
    id: string;
    productId: number;
    productName: string;
    sku: string;
    unit: string | null;
    quantity: number | string;
    unitPrice: number | string;
    discount: number | string;
    lineTotal: number | string;
  }>;
  order: { id: string; status: string; createdAt: string } | null;
};

export function createQuotationRequest(input: {
  siteAddress: string;
  note?: string;
  attachmentUrls?: string[];
  items: Array<{ productId: number; quantity: number; unit?: string }>;
}) {
  return apiFetch<{ request: QuotationRequest }>("/quotation-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function getMyQuotationRequests() {
  return apiFetch<QuotationRequest[]>("/quotation-requests/me");
}

export function getMyQuotations() {
  return apiFetch<Quotation[]>("/quotations/me");
}

export function acceptQuotation(id: string) {
  return apiFetch<{ quotation: Quotation; order: { id: string } }>(
    `/quotations/me/${encodeURIComponent(id)}/accept`,
    { method: "POST" },
  );
}

export function rejectQuotation(id: string, reason?: string) {
  return apiFetch<{ quotation: Quotation }>(
    `/quotations/me/${encodeURIComponent(id)}/reject`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    },
  );
}

export function getAdminQuotationRequests(
  options: { search?: string; status?: QuotationRequestStatus | "" } = {},
) {
  const params = new URLSearchParams();
  if (options.search?.trim()) params.set("search", options.search.trim());
  if (options.status) params.set("status", options.status);
  const query = params.toString();
  return apiFetch<QuotationRequest[]>(
    `/quotation-requests/admin${query ? `?${query}` : ""}`,
    {
      authScope: "admin",
    },
  );
}

export function updateAdminQuotationRequest(
  id: string,
  input: {
    status: QuotationRequestStatus;
    assignedToId?: number;
    note?: string;
  },
) {
  return apiFetch<{ request: QuotationRequest }>(
    `/quotation-requests/admin/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      authScope: "admin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export function getAdminQuotations() {
  return apiFetch<Quotation[]>("/quotations/admin", { authScope: "admin" });
}

export function createAdminQuotation(input: {
  requestId: string;
  validUntil: string;
  vatPercent?: number;
  shippingFee?: number;
  terms?: string;
  note?: string;
  items: Array<{
    productId: number;
    quantity: number;
    unit?: string;
    unitPrice: number;
    discount?: number;
  }>;
}) {
  return apiFetch<{ quotation: Quotation }>("/quotations/admin", {
    method: "POST",
    authScope: "admin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function sendAdminQuotation(id: string) {
  return apiFetch<{ quotation: Quotation }>(
    `/quotations/admin/${encodeURIComponent(id)}/send`,
    { method: "POST", authScope: "admin" },
  );
}
