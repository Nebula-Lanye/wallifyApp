import { absoluteWallifyUrl, type AppApiUser } from "./appapi-client";

export type WallifyProfile = {
  profileId: number;
  nickname: string;
  avatarUrl: string;
  profileUrl: string;
  signature: string | null;
  uploadCount: number | null;
  followingCount: number | null;
  likeCount?: number | null;
  favoriteCount?: number | null;
  email?: string | null;
};

export function appApiUserToWallifyProfile(user: AppApiUser): WallifyProfile {
  const profileId = Number(user.id);
  const nickname = user.username?.trim() || "Wallify 用户";
  const avatarUrl = user.avatar?.trim() ? absoluteWallifyUrl(user.avatar) : "";
  return {
    profileId,
    nickname,
    avatarUrl,
    profileUrl: `${absoluteWallifyUrl(`/pages/profile.php?id=${profileId}`)}`,
    signature: user.bio?.trim() || null,
    uploadCount: typeof user.upload_count === "number" ? user.upload_count : null,
    followingCount: typeof user.following_count === "number" ? user.following_count : null,
    likeCount: typeof user.like_count === "number" ? user.like_count : null,
    favoriteCount: typeof user.favorite_count === "number" ? user.favorite_count : null,
    email: user.email ?? null,
  };
}
