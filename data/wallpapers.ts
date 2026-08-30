export type GameSlug = "genshin" | "starrail" | "honkai3" | "zzz";

export type GameCategory = {
  slug: GameSlug;
  title: string;
  shortTitle: string;
  icon: "sparkles" | "star.fill" | "flame.fill" | "bolt.fill";
  tint: string;
};

export type Wallpaper = {
  id: string;
  title: string;
  category: GameSlug;
  imageUrl: string;
  fullImageUrl: string;
  sourceUrl: string;
  author: string;
  featured?: boolean;
};

export const siteUrl = "https://lkr2312.dpdns.org";

/**
 * Static presentation metadata only. Wallpaper records are never seeded locally in beta;
 * all content comes from AppAPI action responses.
 */
export const categories: GameCategory[] = [
  { slug: "genshin", title: "原神", shortTitle: "原神", icon: "sparkles", tint: "#75C8FF" },
  { slug: "starrail", title: "崩坏：星穹铁道", shortTitle: "星穹铁道", icon: "star.fill", tint: "#A777FF" },
  { slug: "honkai3", title: "崩坏3", shortTitle: "崩坏3", icon: "flame.fill", tint: "#FF8B76" },
  { slug: "zzz", title: "绝区零", shortTitle: "绝区零", icon: "bolt.fill", tint: "#FFCB6B" },
];

export function getCategory(slug: string | undefined) {
  return categories.find((category) => category.slug === slug);
}
