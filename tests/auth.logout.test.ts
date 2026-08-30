import { describe, expect, it } from "vitest";

import { signOutWallify } from "../server/wallify-client";

describe("Wallify beta token logout", () => {
  it("rejects the legacy opaque session identifier before making a request", async () => {
    await expect(signOutWallify("legacy-session-id")).rejects.toThrow("令牌格式异常");
  });
});
