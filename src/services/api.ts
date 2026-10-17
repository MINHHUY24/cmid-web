/*
 * Vai trò: HTTP client dùng chung; gắn base URL/header/token, parse lỗi và cung cấp `ApiError`.
 */
/* Token đang dùng và cơ chế refresh được Provider đăng ký theo từng scope. */
import {
  getAccessToken,
  refreshAccessToken,
  type AuthTokenScope,
} from "./auth-token";

/* Base URL chỉ có ở biến môi trường để không hard-code server trong source. */
const apiUrl = import.meta.env.VITE_API_URL;

/* Lỗi chuẩn hoá để View/Controller có thể đọc message và HTTP status. */
export class ApiError extends Error {
  public readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/* Mở rộng RequestInit bằng tuỳ chọn bỏ token hoặc chọn scope khách/Admin. */
type ApiFetchOptions = RequestInit & {
  skipAuth?: boolean;
  authScope?: AuthTokenScope;
};

/* Ghép base URL với path và báo lỗi cấu hình sớm nếu thiếu biến môi trường. */
function getApiUrl(path: string): string {
  if (!apiUrl) {
    throw new ApiError("Thiếu biến môi trường VITE_API_URL.");
  }

  const baseUrl = apiUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}

/* Ưu tiên thông báo backend; có fallback rõ ràng cho lỗi upload và HTTP chung. */
function getErrorMessage(payload: unknown, status: number): string {
  if (status === 413) {
    return "Dữ liệu gửi lên vượt giới hạn máy chủ. Hãy giảm dung lượng ảnh hoặc số ảnh rồi thử lại.";
  }

  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const { message } = payload;

    if (typeof message === "string") {
      return message;
    }

    if (
      Array.isArray(message) &&
      message.every((item) => typeof item === "string")
    ) {
      return message.join(", ");
    }
  }

  return `Yêu cầu API thất bại (${status}).`;
}

/* HTTP client trung tâm: gắn auth, tự refresh token một lần, parse response và chuẩn hoá lỗi. */
export async function apiFetch<T>(
  path: string,
  options?: ApiFetchOptions,
): Promise<T> {
  let response: Response;

  /* Tách tuỳ chọn nội bộ ra khỏi RequestInit sẽ truyền nguyên vẹn vào `fetch`. */
  const {
    skipAuth = false,
    authScope = "customer",
    ...requestOptions
  } = options ?? {};
  const accessToken = skipAuth ? null : getAccessToken(authScope);
  const requestUrl = getApiUrl(path);

  /* Tạo request với header mặc định nhưng không ghi đè header caller đã truyền. */
  const sendRequest = async (token: string | null) => {
    const providedHeaders = toHeaderRecord(requestOptions.headers);
    const headerNames = new Set(
      Object.keys(providedHeaders).map((name) =>
        name.toLocaleLowerCase("en-US"),
      ),
    );
    const headers = {
      ...(headerNames.has("accept") ? {} : { Accept: "application/json" }),
      ...(token && !headerNames.has("authorization")
        ? { Authorization: "Bearer " + token }
        : {}),
      ...providedHeaders,
    };

    return fetch(requestUrl, {
      ...requestOptions,
      credentials: requestOptions.credentials ?? "include",
      headers,
    });
  };

  /* Gửi request ban đầu; nếu token memory đã hết hạn thì refresh một lần rồi gửi lại. */
  try {
    response = await sendRequest(accessToken);

    /* Access token chỉ sống trong memory; refresh cookie HttpOnly giữ tab mở lâu vẫn dùng được. */
    if (response.status === 401 && !skipAuth && accessToken) {
      const refreshedAccessToken = await refreshAccessToken(authScope).catch(
        () => null,
      );
      if (refreshedAccessToken) {
        response = await sendRequest(refreshedAccessToken);
      }
    }
  } catch {
    throw new ApiError("Không thể kết nối đến máy chủ API.");
  }

  /* Response lỗi được chuyển thành ApiError để Controller xử lý thống nhất. */
  if (!response.ok) {
    let payload: unknown = null;

    try {
      payload = await response.json();
    } catch {
      /* Response lỗi không phải JSON vẫn nhận được thông báo fallback theo status. */
    }

    throw new ApiError(
      getErrorMessage(payload, response.status),
      response.status,
    );
  }

  /* Endpoint DELETE/204 hoặc response không body không cần parse JSON. */
  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return undefined as T;
  }

  /* Chỉ parse khi server thực sự trả JSON, tránh lỗi với content khác. */
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/* Chuẩn hoá mọi dạng HeadersInit thành object để merge header không mất dữ liệu. */
function toHeaderRecord(
  headers: HeadersInit | undefined,
): Record<string, string> {
  if (!headers) return {};
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  if (headers instanceof Headers) return Object.fromEntries(headers.entries());
  return { ...headers };
}
