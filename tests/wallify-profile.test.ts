import { describe, expect, it } from "vitest";

import { appApiUserToWallifyProfile } from "../server/wallify-profile";

describe("Wallify AppAPI user mapping", () => {
  it("maps the documented user object to the native profile model", () => {
    expect(appApiUserToWallifyProfile({
      id: 2,
      username: "admin",
      email: "admin@example.com",
      avatar: "/UserAvatar/2/avatar.jpg",
      bio: "保持热爱",
      like_count: 6,
      favorite_count: 3,
      upload_count: 8,
      following_count: 1,
    })).toEqual({
      profileId: 2,
      nickname: "admin",
      avatarUrl: "https://lkr2312.dpdns.org/UserAvatar/2/avatar.jpg",
      profileUrl: "https://lkr2312.dpdns.org/pages/profile.php?id=2",
      signature: "保持热爱",
      uploadCount: 8,
      followingCount: 1,
      likeCount: 6,
      favoriteCount: 3,
      email: "admin@example.com",
    });
  });

  it("does not invent an avatar when AppAPI omits one", () => {
    expect(appApiUserToWallifyProfile({ id: 3, username: "reader", avatar: null, bio: null })).toMatchObject({
      profileId: 3,
      nickname: "reader",
      avatarUrl: "",
      signature: null,
    });
  });
});
