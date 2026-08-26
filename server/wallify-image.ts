import type { Express } from "express";
import axios from "axios";

import { WALLIFY_ORIGIN } from "./wallify-client";

const ALLOWED_IMAGE_PATH = /^\/(?:uploads\/wallpapers\/(?:thumbs\/)?[A-Za-z0-9._-]+\.(?:jpg|jpeg|png|webp|gif)|UserAvatar\/\d+\/avatar\.(?:jpg|jpeg|png|webp))$/i;

export function registerWallifyImageRoutes(app: Express) {
  app.get("/api/wallify/image", async (req, res) => {
    const imagePath = typeof req.query.path === "string" ? req.query.path : "";
    if (!ALLOWED_IMAGE_PATH.test(imagePath)) {
      res.status(400).json({ message: "不支持的图片地址" });
      return;
    }

    try {
      const remote = await axios.get<ArrayBuffer>(`${WALLIFY_ORIGIN}${imagePath}`, {
        responseType: "arraybuffer",
        timeout: 20_000,
        headers: { "User-Agent": "Wallify-Mobile/1.0" },
      });

      res.setHeader("Content-Type", String(remote.headers["content-type"] || "image/jpeg"));
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(Buffer.from(remote.data));
    } catch {
      res.status(502).json({ message: "Wallify 图片暂时不可用" });
    }
  });
}
