export const IMAGE_BASE_URL =
  "https://raw.githubusercontent.com/chirimen-oh/chirimen.org/master/";

export function toImageUrl(imageUrl: string): string | null {
  const trimmed = imageUrl?.trim() ?? "";
  if (!trimmed) return null;
  if (trimmed.startsWith("http")) return trimmed;
  return `${IMAGE_BASE_URL}${trimmed}`;
}
