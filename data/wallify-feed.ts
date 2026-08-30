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
  code: "appapi";
  label: string;
  hint: string;
  categories: readonly RandomCategoryDefinition[];
};

/** beta 仅使用 AppAPI 定义的 random action。 */
export const randomSources = [
  {
    code: "appapi",
    label: "Wallify",
    hint: "lkr2312.dpdns.org/appapi/index.php",
    categories: [{ code: "random", label: "随机壁纸" }],
  },
] satisfies readonly RandomSourceDefinition[];

export const randomCategories = randomSources[0].categories;

export function getRandomSource(code: string) {
  return randomSources.find((source) => source.code === code) ?? randomSources[0];
}
