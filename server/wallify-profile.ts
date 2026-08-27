import axios from "axios";

import { createWallifyOriginUnavailableError, isWallifyOriginUnavailableStatus } from "./wallify-origin-error";

const WALLIFY_ORIGIN = "https://lkr2312.dpdns.org";

export type WallifyProfile = {
  profileId: number;
  nickname: string;
  avatarUrl: string;
  profileUrl: string;
  signature: string | null;
  uploadCount: number | null;
  followingCount: number | null;
};

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractStatistic(html: string, label: string) {
  const text = decodeHtml(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
  const match = text.match(new RegExp(`(\\d+)\\s*${escapeRegExp(label)}`, "i"));
  return match?.[1] ? Number(match[1]) : null;
}

function extractSignature(html: string) {
  const classMatch = html.match(/class=["'][^"']*(?:profile-bio|profile-signature|user-bio|user-signature)[^"']*["'][^>]*>([\s\S]*?)<\//i);
  const fallbackMatch = html.match(/<h1[^>]*>[\s\S]*?<\/h1>\s*<p[^>]*>([\s\S]*?)<\/p>/i);
  const raw = classMatch?.[1] ?? fallbackMatch?.[1] ?? "";
  const signature = decodeHtml(raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
  return signature || null;
}

export function parseWallifyProfile(html: string, profileId: number): WallifyProfile | null {
  const headingMatch = html.match(/<h1[^>]*>\s*([^<]+?)\s*<\/h1>/i);
  const titleMatch = html.match(/<title>\s*([^<]+?)\s*-\s*Wallify壁纸站\s*<\/title>/i);
  const nickname = decodeHtml(headingMatch?.[1] ?? titleMatch?.[1] ?? "");

  if (!nickname) return null;

  return {
    profileId,
    nickname,
    avatarUrl: `${WALLIFY_ORIGIN}/UserAvatar/${profileId}/avatar.jpg`,
    profileUrl: `${WALLIFY_ORIGIN}/pages/profile.php?id=${profileId}`,
    signature: extractSignature(html),
    uploadCount: extractStatistic(html, "上传"),
    followingCount: extractStatistic(html, "关注"),
  };
}

export async function fetchWallifyProfile(profileId: number): Promise<WallifyProfile> {
  const profileUrl = `${WALLIFY_ORIGIN}/pages/profile.php?id=${profileId}`;
  let response;
  try {
    response = await axios.get<string>(profileUrl, {
      headers: { "User-Agent": "Wallify-Mobile/1.0" },
      timeout: 10_000,
      responseType: "text",
      transformResponse: [(data) => data],
      validateStatus: () => true,
    });
  } catch {
    throw createWallifyOriginUnavailableError();
  }

  if (isWallifyOriginUnavailableStatus(response.status)) throw createWallifyOriginUnavailableError(response.status);

  if (response.status < 200 || response.status >= 300) {
    throw new Error("无法读取该 Wallify 公开资料");
  }

  const profile = parseWallifyProfile(response.data, profileId);
  if (!profile) {
    throw new Error("未找到该用户的公开资料");
  }

  return profile;
}
