import { describe, expect, it } from "vitest";

import { categories, getCategory, getWallpaper, siteUrl, wallpapers } from "../data/wallpapers";

describe("Wallify wallpaper data", () => {
  it("provides the four public game categories from the source site", () => {
    expect(categories.map((category) => category.slug)).toEqual(["genshin", "starrail", "honkai3", "zzz"]);
  });

  it("resolves a wallpaper and keeps its public source link", () => {
    const wallpaper = getWallpaper("34");

    expect(wallpaper?.title).toBe("遐蝶：雨夜霓虹");
    expect(wallpaper?.sourceUrl).toBe(`${siteUrl}/pages/wallpaper.php?id=34`);
    expect(wallpaper?.imageUrl.startsWith(siteUrl)).toBe(true);
  });

  it("maps every wallpaper to a known category", () => {
    for (const wallpaper of wallpapers) {
      expect(getCategory(wallpaper.category)).toBeDefined();
    }
  });
});
