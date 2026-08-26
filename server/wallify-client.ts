import crypto from "node:crypto";

import axios from "axios";
import { imageSize } from "image-size";

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

export type WallifyAccountSettings = {
  username: string;
  email: string;
  bio: string;
};

export type WallifyTermsSection = {
  title: string;
  paragraphs: string[];
  bullets: string[];
};

function extractNamedInputValue(html: string, name: string) {
  const tagMatch = html.match(new RegExp(`<input[^>]+name=["']${name}["'][^>]*>`, "i"))?.[0] ?? "";
  return decodeHtml(tagMatch.match(/value=["']([^"']*)["']/i)?.[1] ?? "");
}

export function parseWallifyAccountSettings(html: string): WallifyAccountSettings | null {
  const username = extractNamedInputValue(html, "username");
  const email = extractNamedInputValue(html, "email");
  const bio = decodeHtml(html.match(/<textarea[^>]+name=["']bio["'][^>]*>([\s\S]*?)<\/textarea>/i)?.[1] ?? "");
  if (!username || !email) return null;
  return { username, email, bio };
}

export function parseWallifyTerms(html: string): WallifyTermsSection[] {
  const sections: WallifyTermsSection[] = [];
  const mainContent = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
  const matches = mainContent.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2[^>]*>|$)/gi);
  for (const match of matches) {
    const title = cleanText(match[1] ?? "");
    const body = match[2] ?? "";
    if (!title) continue;
    const paragraphs = [...body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((item) => cleanText(item[1] ?? "")).filter(Boolean);
    const bullets = [...body.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((item) => cleanText(item[1] ?? "")).filter(Boolean);
    sections.push({ title, paragraphs, bullets });
  }
  return sections;
}

async function getSettingsPage(session: RemoteSession) {
  const page = await originFetch("/pages/settings.php", {}, session.cookie);
  if (!page.ok) throw new Error("无法读取账户设置，请重新登录后再试");
  const nextCookie = setCookieHeader(page);
  if (nextCookie) session.cookie = mergeCookie(session.cookie, nextCookie);
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  return page.body;
}

export async function getWallifyAccountSettings(sessionId: string) {
  const session = requireSession(sessionId);
  const settings = parseWallifyAccountSettings(await getSettingsPage(session));
  if (!settings) throw new Error("无法读取当前账户资料");
  return settings;
}

export async function updateWallifyProfile(input: { sessionId: string; username: string; email: string; bio: string }) {
  const session = requireSession(input.sessionId);
  const body = new URLSearchParams({ username: input.username, email: input.email, bio: input.bio });
  const response = await originFetch("/api/auth.php?action=update_profile", { method: "POST", body }, session.cookie);
  const result = readJson<{ success?: boolean; message?: string }>(response);
  if (!response.ok || !result?.success) throw new Error(result?.message || "资料保存失败");
  const profile = await fetchWallifyProfile(session.profile.profileId);
  session.profile = profile;
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  return profile;
}

export async function fetchWallifyTerms() {
  const response = await originFetch("/pages/terms.php");
  if (!response.ok) throw new Error("暂时无法读取用户协议");
  const sections = parseWallifyTerms(response.body);
  if (!sections.length) throw new Error("用户协议内容暂不可用");
  return { title: "使用条款", sections };
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

export type WallifyImageMetadata = {
  width: number | null;
  height: number | null;
  byteSize: number | null;
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

export async function fetchWallpaperImageMetadata(imagePath: string): Promise<WallifyImageMetadata | null> {
  if (!/^\/uploads\/wallpapers\/[A-Za-z0-9._-]+\.(?:jpg|jpeg|png|webp|gif)$/i.test(imagePath)) return null;
  try {
    const response = await axios.get<ArrayBuffer>(`${WALLIFY_ORIGIN}${imagePath}`, {
      responseType: "arraybuffer",
      timeout: 20_000,
      headers: { "User-Agent": "Wallify-Mobile/1.0" },
    });
    const bytes = Buffer.from(response.data);
    const dimensions = imageSize(bytes);
    return {
      width: dimensions.width ?? null,
      height: dimensions.height ?? null,
      byteSize: bytes.byteLength || null,
    };
  } catch {
    return null;
  }
}

export function parseWallpaperCards(html: string): WallifyWallpaper[] {
  const cards = html.split(/<div\s+class=["']wallpaper-card["'][^>]*>/i).slice(1);
  const seen = new Set<string>();

  return cards.flatMap((card) => {
    const id = card.match(/\/pages\/wallpaper\.php\?id=(\d+)/i)?.[1];
    const thumbnailPath = card.match(/<img\s+src=["'](\/uploads\/wallpapers\/thumbs\/[^"']+\.(?:jpg|jpeg|png|webp))/i)?.[1];
    const title = cleanText(card.match(/class=["']card-title["'][\s\S]*?<a[^>]*>\s*([\s\S]*?)\s*<\/a>/i)?.[1] ?? "");
    const author = cleanText(card.match(/class=["']card-author["'][\s\S]*?<span>\s*([\s\S]*?)\s*<\/span>/i)?.[1] ?? "Wallify 用户");
    const categoryLabel = cleanText(card.match(/class=["']card-category["'][\s\S]*?<\/i>\s*([\s\S]*?)\s*<\/span>/i)?.[1] ?? "原神");
    if (!id || !thumbnailPath || !title || seen.has(id)) return [];
    seen.add(id);
    const fileName = thumbnailPath.split("/").pop() ?? "";
    return [{
      id,
      title,
      category: categoryFromTitle(categoryLabel),
      author,
      thumbnailPath,
      fullImagePath: `/uploads/wallpapers/${fileName}`,
      featured: /featured-badge/.test(card),
    }];
  });
}

export async function fetchLatestWallpapers(limit = 20) {
  const response = await originFetch(`/?_=${Date.now()}`);
  if (!response.ok) throw new Error("暂时无法读取 Wallify 最新上传");
  const sectionStart = response.body.indexOf("最新上传");
  const sectionEnd = response.body.indexOf("热门壁纸", sectionStart);
  const latestSection = sectionStart >= 0 ? response.body.slice(sectionStart, sectionEnd >= 0 ? sectionEnd : undefined) : response.body;
  return parseWallpaperCards(latestSection).slice(0, limit);
}

const WALLIFY_CATEGORY_SLUGS = new Set(["genshin", "starrail", "honkai3", "zzz"]);

export async function fetchCategoryWallpapers(slug: string, limit = 60) {
  if (!WALLIFY_CATEGORY_SLUGS.has(slug)) throw new Error("无效的游戏分类");
  const response = await originFetch(`/pages/category.php?slug=${encodeURIComponent(slug)}&_=${Date.now()}`);
  if (!response.ok) throw new Error("暂时无法读取该分类的 Wallify 壁纸");
  return parseWallpaperCards(response.body).slice(0, limit);
}

export type RandomWallpaper = {
  url: string;
  name: string;
  type: "image" | "video";
  source: string;
  category: string;
};

const RANDOM_SOURCE_CATEGORIES: Record<string, ReadonlySet<string>> = {
  alcy: new Set(["ycy", "moez", "ai", "ysz", "pc", "moe", "fj", "bd", "ys", "mp", "moemp", "ysmp", "aimp", "tx", "lai", "xhl", "acg"]),
  furina: new Set(["furina"]),
  uapipro: new Set(["acg", "anime", "pc_wallpaper", "pc_wallpaper_4k", "pc_wallpaper_s4k", "mobile_wallpaper", "mobile_wallpaper_4k", "mobile_wallpaper_s4k", "general_anime", "general_anime_4k", "general_anime_s4k", "furry", "furry_4k", "furry_s4k"]),
};

export async function fetchRandomWallpaper(source: string, category: string) {
  if (!RANDOM_SOURCE_CATEGORIES[source]?.has(category)) throw new Error("无效的随机壁纸来源或分类");

  try {
    const response = await originFetch(`/api/random_image.php?mode=json&source=${encodeURIComponent(source)}&category=${encodeURIComponent(category)}&_t=${Date.now()}`);
    const data = readJson<{ url?: string; name?: string; type?: string }>(response);
    if (response.ok && data?.url && /^https?:\/\//i.test(data.url)) {
      return {
        url: data.url,
        name: data.name?.trim() || "随机二次元壁纸",
        type: data.type === "video" ? "video" : "image",
        source,
        category,
      } satisfies RandomWallpaper;
    }
  } catch {
    // 栗次元的直接分类入口会在下方作为同源随机接口的网络降级方案。
  }

  // 栗次元偶发空响应时沿用网站同源分类入口，保证默认随机页仍可使用。
  if (source === "alcy") {
    return {
      url: `https://t.alcy.cc/${category}/?t=${Date.now()}`,
      name: "随机二次元壁纸",
      type: "image",
      source,
      category,
    } satisfies RandomWallpaper;
  }

  throw new Error("随机二次元服务暂未返回图片，请换一个分类后再试。");
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
