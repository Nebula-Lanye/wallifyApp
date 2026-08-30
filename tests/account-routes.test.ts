import { describe, expect, it } from "vitest";

import { WALLIFY_APPAPI_URL } from "../server/appapi-client";

describe("Wallify AppAPI account routes", () => {
  it("uses the dedicated JSON API endpoint", () => {
    expect(WALLIFY_APPAPI_URL).toBe("https://lkr2312.dpdns.org/appapi/index.php");
  });

  it("accepts only the documented 48-character hexadecimal token shape", () => {
    expect("a".repeat(48)).toMatch(/^[a-f0-9]{48}$/i);
    expect("session-id").not.toMatch(/^[a-f0-9]{48}$/i);
  });
});
