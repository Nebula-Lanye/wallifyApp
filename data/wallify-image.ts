const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

function getImageApiBaseUrl() {
  if (configuredApiBaseUrl) return configuredApiBaseUrl.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location) {
    const hostname = window.location.hostname.replace(/^8081-/, "3000-");
    return `${window.location.protocol}//${hostname}`;
  }
  return "";
}

export function wallifyImageUrl(imagePath: string) {
  const baseUrl = getImageApiBaseUrl();
  return `${baseUrl}/api/wallify/image?path=${encodeURIComponent(imagePath)}`;
}
