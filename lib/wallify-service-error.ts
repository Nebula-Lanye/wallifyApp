const WALLIFY_ORIGIN_ERROR_PREFIX = "WALLIFY_ORIGIN_UNAVAILABLE";

export type WallifyServiceIssue = {
  title: string;
  description: string;
  status?: number;
};

function readMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error ?? "");
}

/** Converts server error markers and common native network errors into safe user-facing copy. */
export function getWallifyServiceIssue(error: unknown): WallifyServiceIssue | null {
  const message = readMessage(error);
  const marker = message.match(new RegExp(`${WALLIFY_ORIGIN_ERROR_PREFIX}:(NETWORK|\\d{3})`));
  if (marker) {
    const status = marker[1] === "NETWORK" ? undefined : Number(marker[1]);
    if (status === 521) {
      return { title: "Wallify 服务器暂时不可用", description: "官网服务器当前没有响应（错误 521）。这不是你的设备问题，请稍后重试。", status };
    }
    if (status) {
      return { title: "Wallify 服务暂时不可用", description: `官网服务暂时无法响应（错误 ${status}）。请稍后重试。`, status };
    }
    return { title: "网络连接异常", description: "暂时无法连接 Wallify 官网。请检查网络后重试。" };
  }

  if (/network request failed|failed to fetch|network error|timeout|timed out|econn|enotfound/i.test(message)) {
    return { title: "网络连接异常", description: "暂时无法连接 Wallify 官网。请检查网络后重试。" };
  }
  return null;
}
