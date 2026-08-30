import axios, { type AxiosRequestConfig } from "axios";

import { createWallifyOriginUnavailableError, isWallifyOriginUnavailableStatus } from "./wallify-origin-error";

export const WALLIFY_ORIGIN = "https://lkr2312.dpdns.org";
export const WALLIFY_APPAPI_URL = `${WALLIFY_ORIGIN}/appapi/index.php`;
export const WALLIFY_APPAPI_ERROR_PREFIX = "WALLIFY_APPAPI";

export type AppApiEnvelope<T> = {
  success: boolean;
  code: number;
  message: string;
  data: T | null;
};

export type AppApiResponse<T> = {
  data: T;
  tokenExpiresAt: string | null;
};

export type AppApiUser = {
  id: number;
  username: string;
  email?: string | null;
  avatar?: string | null;
  bio?: string | null;
  coins?: number | null;
  created_at?: string | null;
  like_count?: number | null;
  favorite_count?: number | null;
  upload_count?: number | null;
  following_count?: number | null;
};

export type AppApiWallpaper = {
  id: number;
  category_id: number;
  category_name?: string | null;
  title: string;
  description?: string | null;
  file_path: string;
  thumbnail_path: string;
  width?: number | null;
  height?: number | null;
  file_size?: number | null;
  file_type?: string | null;
  tags?: string | null;
  tag_list?: string[];
  view_count?: number | null;
  like_count?: number | null;
  favorite_count?: number | null;
  coin_count?: number | null;
  is_featured?: number | boolean | null;
  created_at?: string | null;
};

export type AppApiWallpaperPage = {
  items: AppApiWallpaper[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
};

export type AppApiCategory = {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  sort_order?: number | null;
  wallpaper_count?: number | null;
};

export type AppApiHome = {
  site: { site_name: string; site_description: string };
  categories: AppApiCategory[];
  featured: AppApiWallpaper[];
  latest: AppApiWallpaper[];
};

export type AppApiAuthData = {
  token: string;
  expires_at: string;
  user: AppApiUser;
};

export type AppApiVersion = {
  latest_version: string;
  file_name: string;
  file_size: number;
  download_url: string;
  update_time: string;
};

export type AppApiLikeData = {
  liked: boolean;
  wallpaper_id: number;
  like_count: number;
};

export type AppApiFavoriteData = {
  is_favorite: boolean;
  wallpaper_id: number;
  favorite_count: number;
};

export type AppApiComment = {
  id: number;
  user_id: number;
  wallpaper_id: number;
  parent_id: number;
  content: string;
  like_count: number;
  created_at: string;
  username: string;
  avatar: string;
};

export type AppApiCommentPage = {
  items: AppApiComment[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
};

export class WallifyAppApiError extends Error {
  readonly code: number;

  constructor(code: number, message: string) {
    super(`${WALLIFY_APPAPI_ERROR_PREFIX}:${code}:${message}`);
    this.name = "WallifyAppApiError";
    this.code = code;
  }
}

function readHeader(headers: Record<string, unknown> | undefined, name: string) {
  if (!headers) return null;
  const value = headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseEnvelope<T>(body: unknown): AppApiEnvelope<T> | null {
  if (!isRecord(body) || typeof body.success !== "boolean" || typeof body.code !== "number") return null;
  return {
    success: body.success,
    code: body.code,
    message: typeof body.message === "string" ? body.message : "Wallify API 请求失败",
    data: (body.data as T | null) ?? null,
  };
}

export async function requestAppApi<T>(
  action: string,
  options: {
    method?: "GET" | "POST";
    params?: Record<string, string | number | undefined>;
    token?: string;
  } = {},
): Promise<AppApiResponse<T>> {
  const method = options.method ?? "GET";
  const payload = { ...(options.params ?? {}), ...(options.token ? { token: options.token } : {}) };
  const config: AxiosRequestConfig = {
    url: WALLIFY_APPAPI_URL,
    method,
    timeout: 20_000,
    validateStatus: () => true,
    headers: {
      "User-Agent": "Wallify-Mobile-AppAPI/1.0",
      Accept: "application/json",
      ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
    },
    ...(method === "GET" ? { params: { action, ...payload } } : { data: { action, ...payload } }),
  };

  let response;
  try {
    response = await axios.request<unknown>(config);
  } catch {
    throw createWallifyOriginUnavailableError();
  }

  if (isWallifyOriginUnavailableStatus(response.status)) {
    throw createWallifyOriginUnavailableError(response.status);
  }

  const envelope = parseEnvelope<T>(response.data);
  if (!envelope) {
    throw new Error("WALLIFY_APPAPI_INVALID:Wallify API 返回格式异常");
  }

  if (!envelope.success || envelope.code !== 0) {
    throw new WallifyAppApiError(envelope.code, envelope.message);
  }

  if (envelope.data === null || envelope.data === undefined) {
    throw new Error("WALLIFY_APPAPI_INVALID:Wallify API 成功响应缺少 data");
  }

  return {
    data: envelope.data,
    tokenExpiresAt: readHeader(response.headers as unknown as Record<string, unknown>, "X-Token-Expires-At"),
  };
}

export function absoluteWallifyUrl(value: string) {
  const normalized = value.trim();
  try {
    const parsed = new URL(normalized.startsWith("/") ? `${WALLIFY_ORIGIN}${normalized}` : normalized);
    if (parsed.protocol !== "https:" || parsed.origin !== WALLIFY_ORIGIN || !parsed.pathname.startsWith("/")) throw new Error("invalid origin");
    return parsed.toString();
  } catch {
    throw new Error("WALLIFY_APPAPI_INVALID:Wallify API 返回了无效图片地址");
  }
}

export function appApiWallpaperFileSize(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

export async function fetchAppApiVersion() {
  const response = await requestAppApi<AppApiVersion>("version");
  return response.data;
}
