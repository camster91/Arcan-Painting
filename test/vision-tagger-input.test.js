import { afterEach, describe, expect, test } from "vitest";
import { getTrustedGalleryImageUrl, ImageInputError } from "@/app/api/utils/vision-tagger";

const originalAppUrl = process.env.APP_URL;
const originalPublicAppUrl = process.env.PUBLIC_APP_URL;

afterEach(() => {
  if (originalAppUrl === undefined) delete process.env.APP_URL;
  else process.env.APP_URL = originalAppUrl;
  if (originalPublicAppUrl === undefined) delete process.env.PUBLIC_APP_URL;
  else process.env.PUBLIC_APP_URL = originalPublicAppUrl;
});

describe("gallery image URL boundary", () => {
  test("accepts only a configured-origin gallery image", () => {
    process.env.APP_URL = "https://arcanpainting.ca";

    expect(getTrustedGalleryImageUrl("https://arcanpainting.ca/gallery/project.webp").href)
      .toBe("https://arcanpainting.ca/gallery/project.webp");
  });

  test("rejects arbitrary hosts and non-gallery paths before a server fetch", () => {
    process.env.APP_URL = "https://arcanpainting.ca";

    expect(() => getTrustedGalleryImageUrl("http://127.0.0.1:3000/admin")).toThrow(ImageInputError);
    expect(() => getTrustedGalleryImageUrl("https://metadata.google.internal/computeMetadata/v1/")).toThrow(ImageInputError);
    expect(() => getTrustedGalleryImageUrl("https://arcanpainting.ca/api/health")).toThrow(ImageInputError);
  });
});
