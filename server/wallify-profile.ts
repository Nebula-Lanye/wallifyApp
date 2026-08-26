const WALLIFY_ORIGIN = "https://lkr2312.dpdns.org";

export type WallifyProfile = {
  profileId: number;
  nickname: string;
  avatarUrl: string;
  profileUrl: string;
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
  };
}

export async function fetchWallifyProfile(profileId: number): Promise<WallifyProfile> {
  const profileUrl = `${WALLIFY_ORIGIN}/pages/profile.php?id=${profileId}`;
  const response = await fetch(profileUrl, {
    headers: { "User-Agent": "Wallify-Mobile/1.0" },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error("无法读取该 Wallify 公开资料");
  }

  const profile = parseWallifyProfile(await response.text(), profileId);
  if (!profile) {
    throw new Error("未找到该用户的公开资料");
  }

  return profile;
}

