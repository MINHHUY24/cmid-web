/*
 * Vai trò: API tạo/poll/lưu/hủy mô hình 3D TRELLIS cùng các preset chất lượng.
 */
export interface TrellisJob {
  id: string;
  state: "loading" | "generating" | "completed" | "failed" | "cancelled";
  message: string;
  previewUrl: string | null;
  savedUrl: string | null;
  progress?: number;
  elapsedSeconds?: number;
  estimatedSecondsRemaining?: number;
  vertices?: number;
  triangles?: number;
}

export type TrellisQualityPresetKey = "fast" | "balanced" | "studio";

export interface TrellisQualityPreset {
  key: TrellisQualityPresetKey;
  label: string;
  pipeline: "512" | "1024" | "1024_cascade";
  textureSize: 1024 | 2048;
  steps: 8 | 12;
  maxFaces: 200000 | 400000 | 600000;
  estimatedSeconds: number;
  purpose: string;
}

export const TRELLIS_QUALITY_PRESETS: Record<
  TrellisQualityPresetKey,
  TrellisQualityPreset
> = {
  fast: {
    key: "fast",
    label: "Nhanh",
    pipeline: "512",
    textureSize: 1024,
    steps: 8,
    maxFaces: 200000,
    estimatedSeconds: 140,
    purpose: "Test nhanh, xem trước",
  },
  balanced: {
    key: "balanced",
    label: "Cân bằng",
    pipeline: "1024",
    textureSize: 2048,
    steps: 12,
    maxFaces: 400000,
    estimatedSeconds: 17 * 60,
    purpose: "Mặc định cho sản phẩm",
  },
  studio: {
    key: "studio",
    label: "Studio",
    pipeline: "1024_cascade",
    textureSize: 2048,
    steps: 12,
    maxFaces: 600000,
    estimatedSeconds: 19 * 60,
    purpose: "Asset final, cần chi tiết cao",
  },
};

export interface SavedTrellisModel {
  modelUrl: string;
  fileName: string;
  fileSize: number;
}

export class TrellisApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const remoteTrellisUrl = import.meta.env.VITE_TRELLIS_API_URL?.trim().replace(
  /\/$/,
  "",
);

function trellisUrl(path: string) {
  return remoteTrellisUrl
    ? `${remoteTrellisUrl}${path}`
    : `/trellis-api${path}`;
}

function assetUrl(value: string | null) {
  if (!value || !remoteTrellisUrl || /^https?:\/\//.test(value)) return value;
  return `${remoteTrellisUrl}${value.startsWith("/") ? "" : "/"}${value}`;
}

function previewUrl(value: string | null) {
  if (!value || /^https?:\/\//.test(value)) return value;
  // Older bridges include Vite's proxy prefix in the API response.
  const path = `/${value.replace(/^\/+/, "")}`.replace(
    /^\/trellis-api(?=\/)/,
    "",
  );
  return trellisUrl(path);
}

function jobWithAssetUrls(job: TrellisJob): TrellisJob {
  return {
    ...job,
    previewUrl: previewUrl(job.previewUrl),
    savedUrl: assetUrl(job.savedUrl),
  };
}

async function trellisFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(trellisUrl(path), {
      ...options,
      signal: options?.signal ?? AbortSignal.timeout(30_000),
    });
  } catch (error) {
    if (options?.signal?.aborted) throw error;
    throw new Error(
      "Chưa kết nối được TRELLIS. Hãy kiểm tra dịch vụ và thử lại.",
      { cause: error },
    );
  }
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      detail?: unknown;
    } | null;
    throw new TrellisApiError(
      typeof payload?.detail === "string"
        ? payload.detail
        : "TRELLIS chưa xử lý được yêu cầu. Vui lòng thử lại.",
      response.status,
    );
  }
  return response.json() as Promise<T>;
}

export function getTrellisHealth() {
  return trellisFetch<{ service: string; ready: boolean }>("/health");
}

export async function createTrellisJob(
  images: string[],
  preset: TrellisQualityPresetKey,
  signal: AbortSignal,
) {
  const formData = new FormData();
  const views = ["front", "left", "right", "back"];
  await Promise.all(
    images.slice(0, 4).map(async (url, index) => {
      if (!url) return;
      const response = await fetch(url, { signal });
      if (!response.ok)
        throw new Error(
          `Không đọc được ảnh ${index + 1}. Hãy tải lại ảnh này.`,
        );
      const blob = await response.blob();
      if (!blob.type.startsWith("image/"))
        throw new Error(`Ảnh ${index + 1} không hợp lệ.`);
      formData.set(views[index], blob, `${views[index]}.png`);
    }),
  );
  formData.set("preset", preset);
  return jobWithAssetUrls(
    await trellisFetch<TrellisJob>("/jobs", {
      method: "POST",
      body: formData,
      signal,
    }),
  );
}

export function getTrellisJob(id: string, signal?: AbortSignal) {
  return trellisFetch<TrellisJob>(`/jobs/${encodeURIComponent(id)}`, {
    signal,
  }).then(jobWithAssetUrls);
}

export function cancelTrellisJob(id: string) {
  return trellisFetch<TrellisJob>(`/jobs/${encodeURIComponent(id)}`, {
    method: "DELETE",
  }).then(jobWithAssetUrls);
}

export async function saveTrellisModel(id: string) {
  const saved = await trellisFetch<SavedTrellisModel>(
    `/jobs/${encodeURIComponent(id)}/save`,
    { method: "POST" },
  );
  return { ...saved, modelUrl: assetUrl(saved.modelUrl) ?? saved.modelUrl };
}
