import crypto from "node:crypto";

import axios from "axios";

import type { WallifyProfile } from "./wallify-profile";
import { fetchWallifyProfile } from "./wallify-profile";

export const WALLIFY_ORIGIN = "https://lkr2312.dpdns.org";

type RemoteSession = {
  cookie: string;
  profile: WallifyProfile;
  expiresAt: number;
};

const sessions = new Map<string, RemoteSession>();
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function cleanText(value: string) {
  return decodeHtml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
}

type OriginResponse = {
  status: number;
  ok: boolean;
  body: string;
  cookies: string[];
};

function setCookieHeader(response: OriginResponse) {
  return response.cookies.map((item) => item.split(";")[0]).filter(Boolean).join("; ");
}

function mergeCookie(existing: string, incoming: string) {
  const cookieMap = new Map<string, string>();
  [...existing.split(";"), ...incoming.split(";")].forEach((entry) => {
    const [name, ...value] = entry.trim().split("=");
    if (name && value.length) cookieMap.set(name, `${name}=${value.join("=")}`);
  });
  return [...cookieMap.values()].join("; ");
}

async function originFetch(path: string, options: RequestInit = {}, cookie?: string): Promise<OriginResponse> {
  const headers = Object.fromEntries(new Headers(options.headers).entries());
  headers["User-Agent"] = "Wallify-Mobile/1.0";
  if (cookie) headers.Cookie = cookie;
  const response = await axios.request<string>({
    url: `${WALLIFY_ORIGIN}${path}`,
    method: options.method || "GET",
    data: options.body,
    headers,
    timeout: 15_000,
    maxRedirects: 0,
    responseType: "text",
    transformResponse: [(data) => data],
    validateStatus: () => true,
  });
  const rawCookie = response.headers["set-cookie"];
  return {
    status: response.status,
    ok: response.status >= 200 && response.status < 300,
    body: response.data,
    cookies: Array.isArray(rawCookie) ? rawCookie : rawCookie ? [String(rawCookie)] : [],
  };
}

function readJson<T>(response: OriginResponse): T | null {
  try {
    return JSON.parse(response.body) as T;
  } catch {
    return null;
  }
}

function extractCsrf(html: string) {
  const token = html.match(/name=["']csrf_token["']\s+value=["']([^"']+)["']/i)?.[1];
  if (!token) throw new Error("Wallify 登录页未返回安全令牌");
  return token;
}

function extractProfileId(html: string) {
  const profileMatch = html.match(/\/UserAvatar\/(\d+)\/avatar\.(?:jpg|png|webp)/i) ?? html.match(/profile\.php\?id=(\d+)/i);
  if (!profileMatch?.[1]) throw new Error("无法读取登录后的 Wallify 用户资料");
  return Number(profileMatch[1]);
}

export async function signInWallify(account: string, password: string) {
  const loginPage = await originFetch("/pages/login.php");
  if (!loginPage.ok) throw new Error("无法打开 Wallify 登录服务");

  let cookie = setCookieHeader(loginPage);
  const csrfToken = extractCsrf(loginPage.body);
  const body = new URLSearchParams({ action: "login", csrf_token: csrfToken, account, password });
  const loginResponse = await originFetch("/api/auth.php?action=login", { method: "POST", body }, cookie);
  cookie = mergeCookie(cookie, setCookieHeader(loginResponse));
  const result = readJson<{ success?: boolean; message?: string }>(loginResponse);

  if (!loginResponse.ok || !result?.success || !cookie) {
    throw new Error(result?.message || "账号或密码错误");
  }

  const home = await originFetch("/", {}, cookie);
  if (!home.ok) throw new Error("登录后无法读取账户资料");
  const profile = await fetchWallifyProfile(extractProfileId(home.body));
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, { cookie, profile, expiresAt: Date.now() + SESSION_TTL_MS });
  return { sessionId, profile };
}

function requireSession(sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(sessionId);
    throw new Error("登录会话已过期，请重新登录");
  }
  return session;
}

export async function getSessionProfile(sessionId: string) {
  const session = requireSession(sessionId);
  const refreshed = await fetchWallifyProfile(session.profile.profileId);
  session.profile = refreshed;
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  return refreshed;
}

export function signOutWallify(sessionId: string) {
  sessions.delete(sessionId);
  return { success: true } as const;
}

export type WallifyWallpaper = {
  id: string;
  title: string;
  category: "genshin" | "starrail" | "honkai3" | "zzz";
  author: string;
  thumbnailPath: string;
  fullImagePath: string;
  featured: boolean;
};

function categoryFromTitle(value: string): WallifyWallpaper["category"] {
  if (value.includes("星穹")) return "starrail";
  if (value.includes("崩坏3")) return "honkai3";
  if (value.includes("绝区")) return "zzz";
  return "genshin";
}

export function parseWallpaperDetail(html: string, id: string): WallifyWallpaper | null {
  const title = cleanText(html.match(/<h1[^>]*>\s*([\s\S]*?)\s*<\/h1>/i)?.[1] ?? "");
  const fullImagePath = html.match(/(?:src|href)=["'](\/uploads\/wallpapers\/(?!thumbs\/)[^"']+\.(?:jpg|jpeg|png|webp))["']/i)?.[1] ?? "";
  const author = cleanText(html.match(/profile\.php\?id=\d+[^>]*>\s*([\s\S]*?)\s*<\/a>/i)?.[1] ?? "Wallify 用户");
  const categoryLabel = cleanText(html.match(/href=["']\/pages\/category\.php\?slug=[^"']+["'][^>]*>\s*([\s\S]*?)\s*<\/a>/i)?.[1] ?? "原神");
  if (!title || !fullImagePath) return null;

  const fileName = fullImagePath.split("/").pop() ?? "";
  return {
    id,
    title,
    category: categoryFromTitle(categoryLabel),
    author,
    thumbnailPath: `/uploads/wallpapers/thumbs/${fileName}`,
    fullImagePath,
    featured: /精选/.test(html),
  };
}

export async function fetchWallpaper(id: string) {
  if (!/^\d+$/.test(id)) throw new Error("无效的壁纸编号");
  const response = await originFetch(`/pages/wallpaper.php?id=${id}`);
  if (!response.ok) throw new Error("无法读取壁纸详情");
  const wallpaper = parseWallpaperDetail(response.body, id);
  if (!wallpaper) throw new Error("未找到这张壁纸");
  return wallpaper;
}

async function getUploadCsrf(session: RemoteSession) {
  const uploadPage = await originFetch("/pages/upload.php", {}, session.cookie);
  if (!uploadPage.ok) throw new Error("当前账号没有上传权限");
  const nextCookie = setCookieHeader(uploadPage);
  if (nextCookie) session.cookie = mergeCookie(session.cookie, nextCookie);
  return extractCsrf(uploadPage.body);
}

export async function uploadWallpaper(input: {
  sessionId: string;
  title: string;
  categoryId: number;
  description: string;
  tags: string;
  fileName: string;
  mimeType: string;
  fileBase64: string;
}) {
  const session = requireSession(input.sessionId);
  const csrfToken = await getUploadCsrf(session);
  const bytes = Buffer.from(input.fileBase64, "base64");
  if (!bytes.length || bytes.length > 10 * 1024 * 1024) throw new Error("图片文件必须在 10MB 以内");
  if (!/^image\/(jpeg|png|webp|gif)$/.test(input.mimeType)) throw new Error("仅支持 JPG、PNG、WebP 或 GIF 图片");

  const uploadId = crypto.randomUUID().replace(/-/g, "");
  const chunk = new FormData();
  chunk.append("action", "chunk");
  chunk.append("upload_id", uploadId);
  chunk.append("index", "0");
  chunk.append("total", "1");
  chunk.append("file_name", input.fileName);
  chunk.append("file_type", input.mimeType);
  chunk.append("file_size", String(bytes.length));
  chunk.append("csrf_token", csrfToken);
  chunk.append("chunk", new Blob([bytes], { type: input.mimeType }), input.fileName);
  const chunkResponse = await originFetch("/api/upload_chunk.php", { method: "POST", body: chunk }, session.cookie);
  const chunkData = readJson<{ success?: boolean; message?: string }>(chunkResponse);
  if (!chunkResponse.ok || !chunkData?.success) throw new Error(chunkData?.message || "图片上传失败");

  const merge = new URLSearchParams({
    action: "merge",
    upload_id: uploadId,
    total: "1",
    file_name: input.fileName,
    file_type: input.mimeType,
    file_size: String(bytes.length),
    csrf_token: csrfToken,
    title: input.title,
    description: input.description,
    category_id: String(input.categoryId),
    tags: input.tags,
  });
  const mergeResponse = await originFetch("/api/upload_chunk.php", { method: "POST", body: merge }, session.cookie);
  const mergeData = readJson<{ success?: boolean; message?: string; redirect?: string }>(mergeResponse);
  if (!mergeResponse.ok || !mergeData?.success) throw new Error(mergeData?.message || "壁纸发布失败");
  const id = mergeData.redirect?.match(/id=(\d+)/)?.[1];
  return { id: id ?? null, redirect: mergeData.redirect ?? null };
}
