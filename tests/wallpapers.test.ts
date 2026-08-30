import { describe, expect, it } from "vitest";

import { categories, getCategory, siteUrl } from "../data/wallpapers";

describe("Wallify beta presentation metadata", () => {
  it("keeps the four official game categories for native navigation", () => {
    expect(categories.map((category) => category.slug)).toEqual(["genshin", "starrail", "honkai3", "zzz"]);
    expect(getCategory("starrail")?.title).toBe("崩坏：星穹铁道");
  });

  it("keeps the official site origin for sharing and update links", () => {
    expect(siteUrl).toBe("https://lkr2312.dpdns.org");
  });
});
