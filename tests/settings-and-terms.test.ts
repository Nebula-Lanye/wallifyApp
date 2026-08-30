import { describe, expect, it } from "vitest";

import { fetchWallifyTerms, updateWallifyAvatar, updateWallifyProfile } from "../server/wallify-client";

const validToken = "a".repeat(48);

describe("Wallify AppAPI settings boundaries", () => {
  it("does not fall back to website HTML for terms", async () => {
    await expect(fetchWallifyTerms()).rejects.toThrow("terms action");
  });

  it("reports profile and avatar actions that are not defined by AppAPI", async () => {
    await expect(updateWallifyProfile({ token: validToken, username: "admin", email: "admin@example.com", bio: "" })).rejects.toThrow("update_profile action");
    await expect(updateWallifyAvatar({ token: validToken, fileName: "avatar.jpg", mimeType: "image/jpeg", fileBase64: "AA==" })).rejects.toThrow("upload_avatar action");
  });
});
