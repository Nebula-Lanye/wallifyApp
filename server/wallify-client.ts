import {
  absoluteWallifyUrl,
  appApiWallpaperFileSize,
  type AppApiAuthData,
  type AppApiCategory,
  type AppApiCommentPage,
  type AppApiFavoriteData,
  type AppApiHome,
  type AppApiLikeData,
  type AppApiUser,
  type AppApiWallpaper,
  type AppApiWallpaperPage,
  requestAppApi,
  WallifyAppApiError,
} from "./appapi-client";
import { appApiUserToWallifyProfile, type WallifyProfile } from "./wallify-profile";

export { fetchAppApiVersion, WALLIFY_APPAPI_ERROR_PREFIX, WALLIFY_APPAPI_URL, WALLIFY_ORIGIN } from "./appapi-client";

const CATEGORY_IDS: Record<string, number> = {
  genshin: 1,
  starrail: 2,
  honkai3: 3,
  zzz: 4,
};

const CATEGORY_SLUGS: Record<number, WallifyWallpaper["category"]> = {
  1: "genshin",
  2: "starrail",
  3: "honkai3",
  4: "zzz",
};

export type WallifyWallpaper = {
  id: string;
  title: string;
  category: "genshin" | "starrail" | "honkai3" | "zzz";
  author: string;
  thumbnailPath: string;
  fullImagePath: string;
  featured: boolean;
  description: string;
  tags: string[];
  width: number | null;
  height: number | null;
  fileSize: number | null;
  fileType: string | null;
  viewCount: number | null;
  likeCount: number | null;
  favoriteCount: number | null;
  createdAt: string | null;
};

export type WallifyImageMetadata = {
  width: number | null;
  height: number | null;
  byteSize: number | null;
};

export type WallifyAccountSettings = {
  username: string;
  email: string;
  bio: string;
  tokenExpiresAt?: string | null;
};

export type WallifyTermsSection = {
  title: string;
  paragraphs: string[];
  bullets: string[];
};

export type RandomWallpaper = {
  url: string;
  name: string;
  type: "image";
  source: "appapi";
  category: string;
};

export type WallifyComment = {
  id: number;
  userId: number;
  wallpaperId: number;
  parentId: number;
  content: string;
  likeCount: number;
  createdAt: string;
  username: string;
  avatarUrl: string;
};

function numberOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function booleanFromApi(value: number | boolean | null | undefined) {
  return value === true || value === 1;
}

function categoryFromApi(item: Pick<AppApiWallpaper, "category_id" | "category_name">): WallifyWallpaper["category"] {
  return CATEGORY_SLUGS[item.category_id] ?? (item.category_name?.includes("星穹") ? "starrail" : item.category_name?.includes("崩坏3") ? "honkai3" : item.category_name?.includes("绝区") ? "zzz" : "genshin");
}

function tagsFromApi(item: AppApiWallpaper) {
  if (Array.isArray(item.tag_list)) return item.tag_list.filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim())).map((tag) => tag.trim());
  return (item.tags ?? "").split(/[,，]/).map((tag) => tag.trim()).filter(Boolean);
}

export function mapAppApiWallpaper(item: AppApiWallpaper): WallifyWallpaper {
  const id = String(item.id);
  return {
    id,
    title: item.title?.trim() || "未命名壁纸",
    category: categoryFromApi(item),
    author: "Wallify 用户",
    thumbnailPath: absoluteWallifyUrl(item.thumbnail_path),
    fullImagePath: absoluteWallifyUrl(item.file_path),
    featured: booleanFromApi(item.is_featured),
    description: item.description?.trim() ?? "",
    tags: tagsFromApi(item),
    width: numberOrNull(item.width),
    height: numberOrNull(item.height),
    fileSize: appApiWallpaperFileSize(item.file_size),
    fileType: item.file_type?.trim() || null,
    viewCount: numberOrNull(item.view_count),
    likeCount: numberOrNull(item.like_count),
    favoriteCount: numberOrNull(item.favorite_count),
    createdAt: item.created_at ?? null,
  };
}

function ensureToken(token: string) {
  if (!/^[a-f0-9]{48}$/i.test(token)) throw new Error("WALLIFY_APPAPI_INVALID:登录令牌格式异常");
}

function limitPageSize(limit: number, fallback: number) {
  const value = Number.isFinite(limit) ? Math.trunc(limit) : fallback;
  return Math.min(Math.max(value, 1), 50);
}

export async function signInWallify(account: string, password: string) {
  const response = await requestAppApi<AppApiAuthData>("login", {
    method: "POST",
    params: { username: account.trim(), password },
  });
  ensureToken(response.data.token);
  return {
    token: response.data.token,
    expiresAt: response.data.expires_at,
    profile: appApiUserToWallifyProfile(response.data.user),
  };
}

export async function refreshWallifyToken(token: string) {
  ensureToken(token);
  const response = await requestAppApi<AppApiAuthData>("refresh", { method: "POST", token });
  ensureToken(response.data.token);
  return {
    token: response.data.token,
    expiresAt: response.data.expires_at,
    profile: appApiUserToWallifyProfile(response.data.user),
  };
}

export async function getSessionProfile(token: string) {
  ensureToken(token);
  const response = await requestAppApi<AppApiUser>("me", { token });
  return {
    profile: appApiUserToWallifyProfile(response.data),
    tokenExpiresAt: response.tokenExpiresAt,
  };
}

export async function signOutWallify(token: string) {
  ensureToken(token);
  await requestAppApi<{ logout: boolean }>("logout", { method: "POST", token });
  return { success: true } as const;
}

export async function getWallifyAccountSettings(token: string) {
  ensureToken(token);
  const response = await requestAppApi<AppApiUser>("me", { token });
  return {
    username: response.data.username?.trim() || "",
    email: response.data.email?.trim() || "",
    bio: response.data.bio?.trim() || "",
    tokenExpiresAt: response.tokenExpiresAt,
  } satisfies WallifyAccountSettings;
}

export async function updateWallifyProfile(_input: { token: string; username: string; email: string; bio: string }): Promise<WallifyProfile> {
  return Promise.reject(new WallifyAppApiError(400, "AppAPI v1.4 暂未提供 update_profile action：资料修改接口尚未在文档中定义"));
}

export async function updateWallifyAvatar(_input: { token: string; fileName: string; mimeType: string; fileBase64: string }): Promise<WallifyProfile> {
  return Promise.reject(new WallifyAppApiError(400, "AppAPI v1.4 暂未提供 upload_avatar action：头像上传接口尚未在文档中定义"));
}

export async function fetchWallifyTerms(): Promise<{ title: string; sections: WallifyTermsSection[] }> {
  return Promise.reject(new WallifyAppApiError(400, "AppAPI v1.4 暂未提供 terms action：用户协议接口尚未在文档中定义"));
}

export async function fetchWallifyHome() {
  const response = await requestAppApi<AppApiHome>("home");
  return {
    ...response.data,
    featured: response.data.featured.map(mapAppApiWallpaper),
    latest: response.data.latest.map(mapAppApiWallpaper),
  };
}

export async function fetchLatestWallpapers(limit = 20) {
  const response = await requestAppApi<AppApiWallpaperPage>("wallpapers", {
    params: { page: 1, page_size: limitPageSize(limit, 20), sort: "new" },
  });
  return response.data.items.map(mapAppApiWallpaper);
}

export async function fetchCategoryWallpapers(slug: string, limit = 60) {
  const categoryId = CATEGORY_IDS[slug];
  if (!categoryId) throw new WallifyAppApiError(400, "无效的游戏分类");
  const response = await requestAppApi<AppApiWallpaperPage>("wallpapers", {
    params: { page: 1, page_size: limitPageSize(limit, 50), category_id: categoryId, sort: "new" },
  });
  return response.data.items.map(mapAppApiWallpaper);
}

export async function searchWallpapers(keyword: string, page = 1, pageSize = 20) {
  const normalizedKeyword = keyword.trim();
  if (!normalizedKeyword) return [];
  const response = await requestAppApi<AppApiWallpaperPage>("wallpapers", {
    params: { page: Math.max(1, Math.trunc(page)), page_size: limitPageSize(pageSize, 20), keyword: normalizedKeyword, sort: "new" },
  });
  return response.data.items.map(mapAppApiWallpaper);
}

export async function fetchWallpaper(id: string) {
  if (!/^\d+$/.test(id)) throw new WallifyAppApiError(400, "无效的壁纸编号");
  const response = await requestAppApi<AppApiWallpaper>("detail", { params: { id: Number(id) } });
  return mapAppApiWallpaper(response.data);
}

export async function fetchWallpaperImageMetadata(wallpaper: WallifyWallpaper): Promise<WallifyImageMetadata> {
  return { width: wallpaper.width, height: wallpaper.height, byteSize: wallpaper.fileSize };
}

export async function fetchRandomWallpaper(count = 1) {
  const response = await requestAppApi<AppApiWallpaper | AppApiWallpaper[]>("random", { params: { count: Math.min(Math.max(Math.trunc(count), 1), 20) } });
  const item = Array.isArray(response.data) ? response.data[0] : response.data;
  if (!item) throw new WallifyAppApiError(404, "随机接口暂未返回壁纸");
  const wallpaper = mapAppApiWallpaper(item);
  return {
    url: wallpaper.fullImagePath,
    name: wallpaper.title,
    type: "image",
    source: "appapi",
    category: wallpaper.category,
  } satisfies RandomWallpaper;
}

export async function fetchAppApiCategories() {
  const response = await requestAppApi<AppApiCategory[]>("categories");
  return response.data;
}

export async function toggleWallifyLike(token: string, wallpaperId: number) {
  ensureToken(token);
  const response = await requestAppApi<AppApiLikeData>("like", { method: "POST", token, params: { wallpaper_id: wallpaperId } });
  return { ...response.data, tokenExpiresAt: response.tokenExpiresAt };
}

export async function toggleWallifyFavorite(token: string, wallpaperId: number) {
  ensureToken(token);
  const response = await requestAppApi<AppApiFavoriteData>("favorite", { method: "POST", token, params: { wallpaper_id: wallpaperId } });
  return { ...response.data, tokenExpiresAt: response.tokenExpiresAt };
}

export async function fetchWallifyFavorites(token: string, page = 1, pageSize = 20) {
  ensureToken(token);
  const response = await requestAppApi<AppApiWallpaperPage>("favorites", { method: "GET", token, params: { page, page_size: limitPageSize(pageSize, 20) } });
  return { ...response.data, tokenExpiresAt: response.tokenExpiresAt, items: response.data.items.map(mapAppApiWallpaper) };
}

export async function fetchWallifyComments(wallpaperId: number, page = 1, pageSize = 20, parentId = 0) {
  const response = await requestAppApi<AppApiCommentPage>("comments", { params: { wallpaper_id: wallpaperId, page, page_size: limitPageSize(pageSize, 20), parent_id: parentId } });
  return {
    ...response.data,
    items: response.data.items.map((comment) => ({
      id: comment.id,
      userId: comment.user_id,
      wallpaperId: comment.wallpaper_id,
      parentId: comment.parent_id,
      content: comment.content,
      likeCount: comment.like_count,
      createdAt: comment.created_at,
      username: comment.username,
      avatarUrl: absoluteWallifyUrl(comment.avatar),
    } satisfies WallifyComment)),
  };
}

export async function postWallifyComment(input: { token: string; wallpaperId: number; content: string; parentId?: number }) {
  ensureToken(input.token);
  if (!input.content.trim() || input.content.length > 500) throw new WallifyAppApiError(400, "评论内容需为 1-500 个字符");
  const response = await requestAppApi<WallifyComment>("comment", {
    method: "POST",
    token: input.token,
    params: { wallpaper_id: input.wallpaperId, content: input.content.trim(), parent_id: input.parentId ?? 0 },
  });
  return { ...response.data, tokenExpiresAt: response.tokenExpiresAt };
}

export async function uploadWallpaper(_input: {
  token: string;
  title: string;
  categoryId: number;
  description: string;
  tags: string;
  fileName: string;
  mimeType: string;
  fileBase64: string;
}): Promise<{ id: string | null; redirect: string | null }> {
  return Promise.reject(new WallifyAppApiError(400, "AppAPI v1.4 暂未提供 upload action：壁纸上传接口尚未在文档中定义"));
}

export type { WallifyProfile };
