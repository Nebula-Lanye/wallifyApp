export const WALLIFY_ORIGIN_ERROR_PREFIX = "WALLIFY_ORIGIN_UNAVAILABLE";

export function isWallifyOriginUnavailableStatus(status: number) {
  return status === 521 || status === 520 || status === 522 || status === 523 || status === 524 || status === 502 || status === 503 || status === 504;
}

export function createWallifyOriginUnavailableError(status?: number) {
  const code = status ? String(status) : "NETWORK";
  return new Error(`${WALLIFY_ORIGIN_ERROR_PREFIX}:${code}`);
}

export function isWallifyOriginUnavailableError(error: unknown) {
  return error instanceof Error && error.message.includes(WALLIFY_ORIGIN_ERROR_PREFIX);
}
