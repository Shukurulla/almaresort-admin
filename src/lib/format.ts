export function formatPrice(price: number): string {
  return price.toLocaleString("ru-RU") + " ₸";
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1$/, "") ||
  "http://localhost:7891";

export function imgSrc(path: string | undefined | null): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return API_BASE + path;
}
