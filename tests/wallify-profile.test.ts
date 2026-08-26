import { describe, expect, it } from "vitest";

import { parseWallifyProfile } from "../server/wallify-profile";

describe("Wallify public profile parser", () => {
  it("extracts a nickname and returns constrained profile URLs", () => {
    const profile = parseWallifyProfile("<html><head><title>admin - Wallify壁纸站</title></head><body><h1>admin</h1><p class=\"profile-bio\">永远相信美好的事情即将发生</p><strong>6</strong> 上传 <strong>1</strong> 关注</body></html>", 2);

    expect(profile).toEqual({
      profileId: 2,
      nickname: "admin",
      avatarUrl: "https://lkr2312.dpdns.org/UserAvatar/2/avatar.jpg",
      profileUrl: "https://lkr2312.dpdns.org/pages/profile.php?id=2",
      signature: "永远相信美好的事情即将发生",
      uploadCount: 6,
      followingCount: 1,
    });
  });

  it("does not create a profile when the public page has no nickname", () => {
    expect(parseWallifyProfile("<html><body>not found</body></html>", 2)).toBeNull();
  });
});
