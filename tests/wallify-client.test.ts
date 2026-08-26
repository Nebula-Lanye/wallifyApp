import { describe, expect, it } from "vitest";

import { parseWallpaperCards, parseWallpaperDetail } from "../server/wallify-client";

describe("Wallify 原生详情解析", () => {
  it("从公开详情页面提取可供应用内图片代理使用的原图路径", () => {
    const html = `
      <h1>遐蝶：雨夜霓虹</h1>
      <a href="/pages/category.php?slug=starrail">崩坏：星穹铁道</a>
      <a href="/pages/profile.php?id=2">admin</a>
      <img src="/uploads/wallpapers/wp_6a886be625b882.64680580.jpg" />
    `;

    expect(parseWallpaperDetail(html, "34")).toMatchObject({
      id: "34",
      title: "遐蝶：雨夜霓虹",
      category: "starrail",
      author: "admin",
      fullImagePath: "/uploads/wallpapers/wp_6a886be625b882.64680580.jpg",
      thumbnailPath: "/uploads/wallpapers/thumbs/wp_6a886be625b882.64680580.jpg",
    });
  });

  it("按首页顺序解析新上传壁纸卡片", () => {
    const cards = parseWallpaperCards(`
      <div class="wallpaper-card"><a href="/pages/wallpaper.php?id=35" class="card-image"><img src="/uploads/wallpapers/thumbs/new.webp"></a><div class="card-info"><h3 class="card-title"><a href="/pages/wallpaper.php?id=35">新上传壁纸</a></h3><a class="card-author"><span>admin</span></a><span class="card-category"><i></i> 崩坏：星穹铁道</span></div></div>
    `);

    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      id: "35",
      title: "新上传壁纸",
      category: "starrail",
      thumbnailPath: "/uploads/wallpapers/thumbs/new.webp",
    });
  });
});
