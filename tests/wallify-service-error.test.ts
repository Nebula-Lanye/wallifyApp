import { describe, expect, it } from "vitest";

import { getWallifyServiceIssue } from "../lib/wallify-service-error";
import { createWallifyOriginUnavailableError } from "../server/wallify-origin-error";

describe("Wallify service availability errors", () => {
  it("turns the Cloudflare 521 marker into a clear server outage message", () => {
    const issue = getWallifyServiceIssue(createWallifyOriginUnavailableError(521));
    expect(issue?.title).toBe("Wallify 服务器暂时不可用");
    expect(issue?.description).toContain("521");
  });

  it("turns connection failures into a clear network message", () => {
    const issue = getWallifyServiceIssue(createWallifyOriginUnavailableError());
    expect(issue?.title).toBe("网络连接异常");
  });
});

