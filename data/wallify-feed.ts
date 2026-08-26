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

export const randomCategories = [
  { code: "ycy", label: "二次元" },
  { code: "moez", label: "萌图" },
  { code: "ai", label: "AI绘图" },
  { code: "ysz", label: "原神" },
  { code: "pc", label: "PC横图" },
  { code: "mp", label: "手机竖图" },
  { code: "acg", label: "ACG动图" },
] as const;
