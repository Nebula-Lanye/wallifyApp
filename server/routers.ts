import { z } from "zod";

import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  fetchAppApiCategories,
  fetchAppApiVersion,
  fetchCategoryWallpapers,
  fetchWallifyHome,
  fetchLatestWallpapers,
  fetchRandomWallpaper,
  fetchWallpaper,
  fetchWallpaperImageMetadata,
  fetchWallifyComments,
  fetchWallifyFavorites,
  fetchWallifyTerms,
  getSessionProfile,
  getWallifyAccountSettings,
  postWallifyComment,
  refreshWallifyToken,
  searchWallpapers,
  signInWallify,
  signOutWallify,
  toggleWallifyFavorite,
  toggleWallifyLike,
  updateWallifyAvatar,
  updateWallifyProfile,
  uploadWallpaper,
} from "./wallify-client";

const tokenSchema = z.string().regex(/^[a-f0-9]{48}$/i, "登录令牌格式无效");
const wallpaperIdSchema = z.number().int().positive();

export const appRouter = router({
  system: systemRouter,
  wallify: router({
    home: publicProcedure.query(() => fetchWallifyHome()),
    categories: publicProcedure.query(() => fetchAppApiCategories()),
    latest: publicProcedure
      .input(z.object({ limit: z.number().int().min(1).max(40).default(20) }))
      .query(({ input }) => fetchLatestWallpapers(input.limit)),
    category: publicProcedure
      .input(z.object({ slug: z.string().regex(/^(genshin|starrail|honkai3|zzz)$/), limit: z.number().int().min(1).max(80).default(60) }))
      .query(({ input }) => fetchCategoryWallpapers(input.slug, input.limit)),
    search: publicProcedure
      .input(z.object({ keyword: z.string().trim().min(1).max(100), page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(50).default(20) }))
      .query(({ input }) => searchWallpapers(input.keyword, input.page, input.pageSize)),
    random: publicProcedure
      .input(z.object({ count: z.number().int().min(1).max(20).default(1) }))
      .query(({ input }) => fetchRandomWallpaper(input.count)),
    detail: publicProcedure
      .input(z.object({ id: z.string().regex(/^\d+$/) }))
      .query(async ({ input }) => {
        const wallpaper = await fetchWallpaper(input.id);
        const imageMetadata = await fetchWallpaperImageMetadata(wallpaper);
        return { ...wallpaper, imageMetadata };
      }),
    version: publicProcedure.query(() => fetchAppApiVersion()),
    login: publicProcedure
      .input(z.object({ account: z.string().min(3).max(320), password: z.string().min(6).max(128) }))
      .mutation(({ input }) => signInWallify(input.account, input.password)),
    refresh: publicProcedure
      .input(z.object({ token: tokenSchema }))
      .mutation(({ input }) => refreshWallifyToken(input.token)),
    sessionProfile: publicProcedure
      .input(z.object({ token: tokenSchema }))
      .query(({ input }) => getSessionProfile(input.token)),
    accountSettings: publicProcedure
      .input(z.object({ token: tokenSchema }))
      .query(({ input }) => getWallifyAccountSettings(input.token)),
    updateProfile: publicProcedure
      .input(z.object({
        token: tokenSchema,
        username: z.string().trim().min(2).max(40),
        email: z.string().trim().email().max(320),
        bio: z.string().trim().max(500),
      }))
      .mutation(({ input }) => updateWallifyProfile(input)),
    updateAvatar: publicProcedure
      .input(z.object({
        token: tokenSchema,
        fileName: z.string().trim().min(1).max(180),
        mimeType: z.string().regex(/^image\/(jpeg|png|webp|gif)$/),
        fileBase64: z.string().min(1).max(7_000_000),
      }))
      .mutation(({ input }) => updateWallifyAvatar(input)),
    terms: publicProcedure.query(() => fetchWallifyTerms()),
    logout: publicProcedure
      .input(z.object({ token: tokenSchema }))
      .mutation(({ input }) => signOutWallify(input.token)),
    like: publicProcedure
      .input(z.object({ token: tokenSchema, wallpaperId: wallpaperIdSchema }))
      .mutation(({ input }) => toggleWallifyLike(input.token, input.wallpaperId)),
    favorite: publicProcedure
      .input(z.object({ token: tokenSchema, wallpaperId: wallpaperIdSchema }))
      .mutation(({ input }) => toggleWallifyFavorite(input.token, input.wallpaperId)),
    favorites: publicProcedure
      .input(z.object({ token: tokenSchema, page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(50).default(20) }))
      .query(({ input }) => fetchWallifyFavorites(input.token, input.page, input.pageSize)),
    comments: publicProcedure
      .input(z.object({ wallpaperId: wallpaperIdSchema, page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(50).default(20), parentId: z.number().int().min(0).default(0) }))
      .query(({ input }) => fetchWallifyComments(input.wallpaperId, input.page, input.pageSize, input.parentId)),
    comment: publicProcedure
      .input(z.object({ token: tokenSchema, wallpaperId: wallpaperIdSchema, content: z.string().trim().min(1).max(500), parentId: z.number().int().min(0).optional() }))
      .mutation(({ input }) => postWallifyComment(input)),
    upload: publicProcedure
      .input(z.object({
        token: tokenSchema,
        title: z.string().min(1).max(100),
        categoryId: z.number().int().min(1).max(4),
        description: z.string().max(1000),
        tags: z.string().max(300),
        fileName: z.string().min(1).max(180),
        mimeType: z.string().regex(/^image\/(jpeg|png|webp|gif)$/),
        fileBase64: z.string().min(1).max(16_000_000),
      }))
      .mutation(({ input }) => uploadWallpaper(input)),
  }),

  // The Manus template router remains available for the app shell; Wallify data is isolated above.
});

export type AppRouter = typeof appRouter;
