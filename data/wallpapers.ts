import { wallifyImageUrl } from "./wallify-image";

export type GameSlug = "genshin" | "starrail" | "honkai3" | "zzz" | "random";

export type GameCategory = {
  slug: GameSlug;
  title: string;
  shortTitle: string;
  icon: "sparkles" | "moon.stars.fill" | "bolt.fill" | "circle.hexagongrid.fill" | "shuffle";
  tint: string;
};

export type Wallpaper = {
  id: string;
  title: string;
  category: Exclude<GameSlug, "random">;
  imageUrl: string;
  fullImageUrl: string;
  sourceUrl: string;
  author: string;
  featured?: boolean;
};

export const siteUrl = "https://lkr2312.dpdns.org";

export const categories: GameCategory[] = [
  { slug: "genshin", title: "原神", shortTitle: "原神", icon: "sparkles", tint: "#75C8FF" },
  { slug: "starrail", title: "崩坏：星穹铁道", shortTitle: "星穹铁道", icon: "moon.stars.fill", tint: "#B993FF" },
  { slug: "honkai3", title: "崩坏3", shortTitle: "崩坏3", icon: "bolt.fill", tint: "#FF8ECB" },
  { slug: "zzz", title: "绝区零", shortTitle: "绝区零", icon: "circle.hexagongrid.fill", tint: "#FFB86B" },
];

export const wallpapers: Wallpaper[] = [
  {
    id: "34",
    title: "遐蝶：雨夜霓虹",
    category: "starrail",
    imageUrl: wallifyImageUrl("/uploads/wallpapers/thumbs/wp_6a886be625b882.64680580.jpg"),
    fullImageUrl: wallifyImageUrl("/uploads/wallpapers/wp_6a886be625b882.64680580.jpg"),
    sourceUrl: `${siteUrl}/pages/wallpaper.php?id=34`,
    author: "admin",
    featured: true,
  },
  {
    id: "33",
    title: "芙宁娜",
    category: "genshin",
    imageUrl: wallifyImageUrl("/uploads/wallpapers/thumbs/wp_6a843d296d0651.72833260.jpg"),
    fullImageUrl: wallifyImageUrl("/uploads/wallpapers/wp_6a843d296d0651.72833260.jpg"),
    sourceUrl: `${siteUrl}/pages/wallpaper.php?id=33`,
    author: "admin",
  },
  {
    id: "32",
    title: "哥伦比娅",
    category: "genshin",
    imageUrl: wallifyImageUrl("/uploads/wallpapers/thumbs/wp_6a82e31f0faa67.50498496.jpg"),
    fullImageUrl: wallifyImageUrl("/uploads/wallpapers/wp_6a82e31f0faa67.50498496.jpg"),
    sourceUrl: `${siteUrl}/pages/wallpaper.php?id=32`,
    author: "admin",
  },
  {
    id: "29",
    title: "遐蝶",
    category: "starrail",
    imageUrl: wallifyImageUrl("/uploads/wallpapers/thumbs/wp_6a76acd7d085b3.60065831.webp"),
    fullImageUrl: wallifyImageUrl("/uploads/wallpapers/wp_6a76acd7d085b3.60065831.webp"),
    sourceUrl: `${siteUrl}/pages/wallpaper.php?id=29`,
    author: "admin",
  },
  {
    id: "28",
    title: "原神7.0版本前瞻特别节目封面",
    category: "genshin",
    imageUrl: wallifyImageUrl("/uploads/wallpapers/thumbs/wp_6a70aa0d17bb43.83235140.jpg"),
    fullImageUrl: wallifyImageUrl("/uploads/wallpapers/wp_6a70aa0d17bb43.83235140.jpg"),
    sourceUrl: `${siteUrl}/pages/wallpaper.php?id=28`,
    author: "admin",
  },
  {
    id: "1",
    title: "木偶",
    category: "genshin",
    imageUrl: wallifyImageUrl("/uploads/wallpapers/thumbs/wp_6a6fe5b17e60d0.95537778.jpg"),
    fullImageUrl: wallifyImageUrl("/uploads/wallpapers/wp_6a6fe5b17e60d0.95537778.jpg"),
    sourceUrl: `${siteUrl}/pages/wallpaper.php?id=1`,
    author: "admin",
  },
];

export function getCategory(slug: GameSlug | string) {
  return categories.find((category) => category.slug === slug);
}

export function getWallpaper(id: string | string[] | undefined) {
  const wallpaperId = Array.isArray(id) ? id[0] : id;
  return wallpapers.find((wallpaper) => wallpaper.id === wallpaperId);
}
