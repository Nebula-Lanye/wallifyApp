import { describe, expect, it } from "vitest";

import { getRandomSource, randomSources } from "../data/wallify-feed";

describe("random wallpaper source matrix", () => {
  it("matches the three sources and default category from Wallify random.php", () => {
    expect(randomSources.map((source) => source.code)).toEqual(["alcy", "furina", "uapipro"]);
    expect(randomSources[0].categories[0]).toEqual({ code: "ycy", label: "二次元" });
  });

  it("includes the complete Alcy and UApiPro category sets", () => {
    expect(getRandomSource("alcy").categories).toHaveLength(17);
    expect(getRandomSource("uapipro").categories).toHaveLength(14);
    expect(getRandomSource("uapipro").categories.map((category) => category.code)).toContain("mobile_wallpaper_s4k");
  });
});
