import { describe, expect, it } from "vitest";

import { getRandomSource, randomCategories, randomSources } from "../data/wallify-feed";

describe("beta random wallpaper source matrix", () => {
  it("uses AppAPI as the only random source", () => {
    expect(randomSources.map((source) => source.code)).toEqual(["appapi"]);
    expect(randomCategories[0]).toEqual({ code: "random", label: "随机壁纸" });
    expect(getRandomSource("legacy-source").code).toBe("appapi");
  });
});
