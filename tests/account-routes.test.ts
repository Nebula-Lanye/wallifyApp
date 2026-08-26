import { describe, expect, it } from "vitest";

import { siteUrl } from "../data/wallpapers";

describe("Wallify account routes", () => {
  it("uses the existing site login and registration pages", () => {
    expect(`${siteUrl}/pages/login.php`).toBe("https://lkr2312.dpdns.org/pages/login.php");
    expect(`${siteUrl}/pages/register.php`).toBe("https://lkr2312.dpdns.org/pages/register.php");
  });
});

