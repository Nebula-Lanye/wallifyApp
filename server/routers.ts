import { COOKIE_NAME } from "../shared/const.js";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { fetchLatestWallpapers, fetchRandomWallpaper, fetchWallpaper, getSessionProfile, signInWallify, signOutWallify, uploadWallpaper } from "./wallify-client";
import { fetchWallifyProfile } from "./wallify-profile";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  wallifyProfile: router({
    resolve: publicProcedure
      .input(z.object({ profileId: z.number().int().positive().max(99_999_999) }))
      .mutation(({ input }) => fetchWallifyProfile(input.profileId)),
  }),
  wallify: router({
    latest: publicProcedure
      .input(z.object({ limit: z.number().int().min(1).max(40).default(20) }))
      .query(({ input }) => fetchLatestWallpapers(input.limit)),
    random: publicProcedure
      .input(z.object({ source: z.string().min(1).max(32), category: z.string().min(1).max(32) }))
      .query(({ input }) => fetchRandomWallpaper(input.source, input.category)),
    detail: publicProcedure
      .input(z.object({ id: z.string().regex(/^\d+$/) }))
      .query(({ input }) => fetchWallpaper(input.id)),
    login: publicProcedure
      .input(z.object({ account: z.string().min(3).max(320), password: z.string().min(6).max(128) }))
      .mutation(({ input }) => signInWallify(input.account, input.password)),
    sessionProfile: publicProcedure
      .input(z.object({ sessionId: z.string().uuid() }))
      .query(({ input }) => getSessionProfile(input.sessionId)),
    logout: publicProcedure
      .input(z.object({ sessionId: z.string().uuid() }))
      .mutation(({ input }) => signOutWallify(input.sessionId)),
    upload: publicProcedure
      .input(z.object({
        sessionId: z.string().uuid(),
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

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
