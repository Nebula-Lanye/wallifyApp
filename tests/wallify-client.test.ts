import { describe, expect, it } from "vitest";

import { absoluteWallifyUrl } from "../server/appapi-client";
import { mapAppApiWallpaper } from "../server/wallify-client";

const sample = {
  id: 34,
  category_id: 2,
  category_name: "崩坏：星穹铁道",
  title: "遐蝶：雨夜霓虹",
  description: "",
  file_path: "https://lkr2312.dpdns.org/uploads/wallpapers/wp_6a886be625b882.64680580.jpg",
  thumbnail_path: "https://lkr2312.dpdns.org/uploads/wallpapers/thumbs/wp_6a886be625b882.64680580.jpg",
  width: 1280,
  height: 720,
  file_size: 1472657,
  file_type: "image/jpeg",
  tags: "崩坏：星穹铁道，遐蝶，壁纸，720P",
  view_count: 21,
  like_count: 0,
  favorite_count: 0,
  is_featured: 1,
  created_at: "2026-08-21 23:16:54",
};

describe("Wallify AppAPI wallpaper mapping", () => {
  it("maps the documented detail payload without scraping HTML", () => {
    expect(mapAppApiWallpaper(sample)).toMatchObject({
      id: "34",
      title: "遐蝶：雨夜霓虹",
      category: "starrail",
      thumbnailPath: sample.thumbnail_path,
      fullImagePath: sample.file_path,
      width: 1280,
      height: 720,
      fileSize: 1472657,
      tags: ["崩坏：星穹铁道", "遐蝶", "壁纸", "720P"],
      featured: true,
    });
  });

  it("accepts absolute and relative official image paths, but rejects foreign URLs", () => {
    expect(absoluteWallifyUrl("/uploads/wallpapers/a.jpg")).toBe("https://lkr2312.dpdns.org/uploads/wallpapers/a.jpg");
    expect(absoluteWallifyUrl("https://lkr2312.dpdns.org/uploads/wallpapers/a.jpg")).toContain("lkr2312.dpdns.org");
    expect(() => absoluteWallifyUrl("javascript:alert(1)")).toThrow("无效图片地址");
  });
});
