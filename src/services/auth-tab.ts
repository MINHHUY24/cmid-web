/*
 * Vai trò: Tạo ID riêng cho tab trình duyệt và header phân biệt phiên auth giữa các tab.
 */
/* Header nói cho backend biết request đang thuộc tab nào. */
export const AUTH_TAB_HEADER_NAME = "X-CMID-Auth-Tab";

/* Khoá sessionStorage và cache trong memory cho vòng đời riêng của một tab. */
const AUTH_TAB_STORAGE_KEY = "cmid.auth.tab-id.v1";
let inMemoryTabId: string | null = null;

/* Sinh ID ngẫu nhiên; ưu tiên crypto.randomUUID khi trình duyệt hỗ trợ. */
function createTabId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

/* ID ổn định theo tab chỉ giúp backend chọn cookie HttpOnly, không phải thông tin xác thực. */
export function getAuthTabId() {
  if (inMemoryTabId) return inMemoryTabId;

  try {
    const savedTabId = window.sessionStorage.getItem(AUTH_TAB_STORAGE_KEY);
    if (savedTabId) {
      inMemoryTabId = savedTabId;
      return savedTabId;
    }

    const nextTabId = createTabId();
    window.sessionStorage.setItem(AUTH_TAB_STORAGE_KEY, nextTabId);
    inMemoryTabId = nextTabId;
    return nextTabId;
  } catch {
    inMemoryTabId = createTabId();
    return inMemoryTabId;
  }
}

/* Đóng gói header tab để apiFetch gắn vào từng request xác thực. */
export function getAuthTabHeaders() {
  return { [AUTH_TAB_HEADER_NAME]: getAuthTabId() };
}
