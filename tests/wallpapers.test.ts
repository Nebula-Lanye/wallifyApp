import { describe, expect, it } from "vitest";

import { categories, getCategory, getWallpaper, siteUrl, wallpapers } from "../data/wallpapers";

describe("Wallify wallpaper data", () => {
  it("provides the four public game categories from the source site", () => {
    expect(categories.map((category) => category.slug)).toEqual(["genshin", "starrail", "honkai3", "zzz"]);
  });

  it("resolves a wallpaper and routes image loading through the native proxy", () => {
    const wallpaper = getWallpaper("34");

    expect(wallpaper?.title).toBe("遐蝶：雨夜霓虹");
    expect(wallpaper?.sourceUrl).toBe(`${siteUrl}/pages/wallpaper.php?id=34`);
    expect(wallpaper?.imageUrl).toContain("/api/wallify/image?path=");
    expect(wallpaper?.fullImageUrl).toContain("wp_6a886be625b882.64680580.jpg");
  });

  it("maps every wallpaper to a known category", () => {
    for (const wallpaper of wallpapers) {
      expect(getCategory(wallpaper.category)).toBeDefined();
    }
  });
});
