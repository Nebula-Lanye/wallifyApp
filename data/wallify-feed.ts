import { wallifyImageUrl } from "./wallify-image";
import type { Wallpaper } from "./wallpapers";

export type RemoteWallpaperCard = {
  id: string;
  title: string;
  category: Wallpaper["category"];
  author: string;
  thumbnailPath: string;
  fullImagePath: string;
  featured: boolean;
};

export function toWallpaper(card: RemoteWallpaperCard): Wallpaper {
  return {
    id: card.id,
    title: card.title,
    category: card.category,
    author: card.author,
    imageUrl: wallifyImageUrl(card.thumbnailPath),
    fullImageUrl: wallifyImageUrl(card.fullImagePath),
    sourceUrl: "",
    featured: card.featured,
  };
}

export type RandomCategoryDefinition = {
  code: string;
  label: string;
};

export type RandomSourceDefinition = {
  code: "alcy" | "furina" | "uapipro";
  label: string;
  hint: string;
  categories: readonly RandomCategoryDefinition[];
};

/** 与 Wallify pages/random.php 的来源与分类白名单保持一致。 */
export const randomSources = [
  {
    code: "alcy",
    label: "栗次元",
    hint: "t.alcy.cc",
    categories: [
      { code: "ycy", label: "二次元" },
      { code: "moez", label: "萌图" },
      { code: "ai", label: "AI绘图" },
      { code: "ysz", label: "原神" },
      { code: "pc", label: "PC横图" },
      { code: "moe", label: "萌版横图" },
      { code: "fj", label: "风景" },
      { code: "bd", label: "白底" },
      { code: "ys", label: "原神横图" },
      { code: "mp", label: "手机竖图" },
      { code: "moemp", label: "萌版竖图" },
      { code: "ysmp", label: "原神竖图" },
      { code: "aimp", label: "AI竖图" },
      { code: "tx", label: "头像" },
      { code: "lai", label: "七濑胡桃" },
      { code: "xhl", label: "小狐狸" },
      { code: "acg", label: "ACG动图" },
    ],
  },
  {
    code: "furina",
    label: "芙宁娜",
    hint: "furina.baigei.cc",
    categories: [{ code: "furina", label: "芙宁娜" }],
  },
  {
    code: "uapipro",
    label: "UApiPro",
    hint: "uapis.cn",
    categories: [
      { code: "acg", label: "二次元动漫" },
      { code: "anime", label: "混合动漫" },
      { code: "pc_wallpaper", label: "电脑壁纸" },
      { code: "pc_wallpaper_4k", label: "电脑壁纸·4K横屏" },
      { code: "pc_wallpaper_s4k", label: "电脑壁纸·4K竖屏" },
      { code: "mobile_wallpaper", label: "手机壁纸" },
      { code: "mobile_wallpaper_4k", label: "手机壁纸·4K横屏" },
      { code: "mobile_wallpaper_s4k", label: "手机壁纸·4K竖屏" },
      { code: "general_anime", label: "动漫图" },
      { code: "general_anime_4k", label: "动漫图·4K横屏" },
      { code: "general_anime_s4k", label: "动漫图·4K竖屏" },
      { code: "furry", label: "福瑞" },
      { code: "furry_4k", label: "福瑞·4K横屏" },
      { code: "furry_s4k", label: "福瑞·4K竖屏" },
    ],
  },
] satisfies readonly RandomSourceDefinition[];

export const randomCategories = randomSources[0].categories;

export function getRandomSource(code: string) {
  return randomSources.find((source) => source.code === code) ?? randomSources[0];
}
