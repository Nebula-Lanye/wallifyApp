import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

/**
 * iOS uses the Photos picker. Android deliberately uses ACTION_OPEN_DOCUMENT
 * through the device file providers, which lets MIUI show Security Access and
 * other system-managed image sources while restricting selection to image/*.
 */
export const WALLPAPER_IOS_IMAGE_PICKER_OPTIONS = {
  mediaTypes: ["images"] as ImagePicker.MediaType[],
  allowsEditing: false,
  quality: 1,
  selectionLimit: 1,
  legacy: false,
};

export const WALLPAPER_ANDROID_DOCUMENT_PICKER_OPTIONS: DocumentPicker.DocumentPickerOptions = {
  type: "image/*",
  multiple: false,
  copyToCacheDirectory: true,
};
