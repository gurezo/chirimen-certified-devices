import { describe, expect, it } from "vitest";
import { IMAGE_BASE_URL, toImageUrl } from "./to-image-url.js";

describe("toImageUrl", () => {
  it("returns null for empty string", () => {
    expect(toImageUrl("")).toBeNull();
  });

  it("returns null for whitespace only", () => {
    expect(toImageUrl(" ")).toBeNull();
  });

  it("prepends base URL for relative path", () => {
    expect(toImageUrl("partsImgs/ADS1015.jpg")).toBe(
      `${IMAGE_BASE_URL}partsImgs/ADS1015.jpg`,
    );
  });

  it("returns as-is for absolute URL", () => {
    const url = "https://example.com/image.jpg";
    expect(toImageUrl(url)).toBe(url);
  });
});
