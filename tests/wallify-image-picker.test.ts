import { describe, expect, it } from "vitest";

import { WALLPAPER_ANDROID_DOCUMENT_PICKER_OPTIONS, WALLPAPER_IOS_IMAGE_PICKER_OPTIONS } from "../lib/wallify-image-picker";

describe("Wallify system photo picker", () => {
  it("uses an Android system document provider restricted to one image", () => {
    expect(WALLPAPER_ANDROID_DOCUMENT_PICKER_OPTIONS.type).toBe("image/*");
    expect(WALLPAPER_ANDROID_DOCUMENT_PICKER_OPTIONS.multiple).toBe(false);
    expect(WALLPAPER_ANDROID_DOCUMENT_PICKER_OPTIONS.copyToCacheDirectory).toBe(true);
  });

  it("keeps iOS selection restricted to one original image", () => {
    expect(WALLPAPER_IOS_IMAGE_PICKER_OPTIONS.mediaTypes).toEqual(["images"]);
    expect(WALLPAPER_IOS_IMAGE_PICKER_OPTIONS.selectionLimit).toBe(1);
    expect(WALLPAPER_IOS_IMAGE_PICKER_OPTIONS.allowsEditing).toBe(false);
  });
});
