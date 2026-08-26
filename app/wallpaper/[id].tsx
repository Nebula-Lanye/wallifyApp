import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { wallifyImageUrl } from "@/data/wallify-image";
import { getCategory, getWallpaper } from "@/data/wallpapers";
import { useFavorites } from "@/hooks/use-favorites";
import { trpc } from "@/lib/trpc";

function formatFileSize(bytes: number | null | undefined) {
  if (!bytes || bytes <= 0) return "暂不可用";
  if (bytes < 1024 * 1024) return `${Math.max(bytes / 1024, 0.1).toFixed(bytes < 100 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

export default function WallpaperDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const wallpaperId = Array.isArray(id) ? id[0] : id;
  const remoteDetail = trpc.wallify.detail.useQuery({ id: wallpaperId ?? "0" }, { enabled: Boolean(wallpaperId) });
  const remoteWallpaper = remoteDetail.data ? {
    ...remoteDetail.data,
    imageUrl: wallifyImageUrl(remoteDetail.data.thumbnailPath),
    fullImageUrl: wallifyImageUrl(remoteDetail.data.fullImagePath),
    sourceUrl: "",
  } : null;
  const wallpaper = remoteWallpaper ?? getWallpaper(id);
  const { isFavorite, toggleFavorite } = useFavorites();
  const [imageAspectRatio, setImageAspectRatio] = useState(1);
  const imageMetadata = remoteDetail.data?.imageMetadata;

  if (remoteDetail.isLoading && !wallpaper) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.loadingText}>正在加载原图…</Text>
      </ScreenContainer>
    );
  }

  if (!wallpaper) {
    return (
      <ScreenContainer className="items-center justify-center px-8">
        <Stack.Screen options={{ headerShown: false }} />
        <Text className="text-center text-xl font-bold text-foreground">没有找到这张壁纸</Text>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryPressed]}>
          <Text style={styles.primaryText}>返回浏览</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  const category = getCategory(wallpaper.category);
  const favorite = isFavorite(wallpaper.id);

  const handleFavorite = async () => {
    try {
      const nowFavorite = await toggleFavorite(wallpaper.id);
      if (Platform.OS !== "web") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (nowFavorite && Platform.OS === "web") Alert.alert("已收藏", "这张壁纸已保存在当前浏览器中。");
    } catch {
      Alert.alert("暂时无法保存", "请稍后再试一次。");
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `我在 Wallify 发现了「${wallpaper.title}」\n${wallpaper.sourceUrl}`, url: wallpaper.sourceUrl, title: wallpaper.title });
    } catch {
      Alert.alert("暂时无法分享", "请复制原站链接后再试。 ");
    }
  };

  const saveWallpaper = async () => {
    if (Platform.OS === "web") {
      Alert.alert("请在移动设备中保存", "原图保存功能会在 iOS 或 Android 中直接写入系统相册。");
      return;
    }

    try {
      const permission = await MediaLibrary.requestPermissionsAsync(true, ["photo"]);
      if (!permission.granted) {
        Alert.alert("需要相册权限", "允许后才能将壁纸保存到设备相册。");
        return;
      }

      const extension = wallpaper.fullImageUrl.split(".").pop()?.split("?")[0] || "jpg";
      const localUri = `${FileSystem.cacheDirectory}wallify-${wallpaper.id}.${extension}`;
      const downloaded = await FileSystem.downloadAsync(wallpaper.fullImageUrl, localUri);
      await MediaLibrary.saveToLibraryAsync(downloaded.uri);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("已保存到相册", "壁纸原图已保存到你的设备相册。");
    } catch {
      Alert.alert("保存失败", "暂时无法下载这张壁纸，请稍后再试。");
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        <View style={[styles.mediaArea, { aspectRatio: imageAspectRatio }]}>
          <Image
            source={{ uri: wallpaper.fullImageUrl }}
            style={styles.image}
            contentFit="contain"
            transition={180}
            accessibilityLabel={wallpaper.title}
            onLoad={({ source }) => {
              if (source.width && source.height) {
                setImageAspectRatio(Math.min(Math.max(source.width / source.height, 0.52), 2.15));
              }
            }}
          />
          <View style={styles.imageShade} />
          <View style={styles.topActions}>
            <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.roundButton, pressed && styles.roundPressed]} accessibilityLabel="返回">
              <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
            </Pressable>
            <View style={styles.topRight}>
              <Pressable onPress={handleShare} style={({ pressed }) => [styles.roundButton, pressed && styles.roundPressed]} accessibilityLabel="分享壁纸链接">
                <IconSymbol name="square.and.arrow.up" size={21} color="#FFFFFF" />
              </Pressable>
              <Pressable onPress={() => void handleFavorite()} style={({ pressed }) => [styles.roundButton, favorite && styles.favoritedButton, pressed && styles.roundPressed]} accessibilityLabel={favorite ? "取消收藏" : "收藏壁纸"}>
                <IconSymbol name={favorite ? "heart.fill" : "heart"} size={21} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>
        <View style={styles.infoPanel}>
          <View style={styles.pill}><Text style={styles.pillText}>{category?.title ?? "Wallify"}</Text></View>
          <Text style={styles.title}>{wallpaper.title}</Text>
          <Text style={styles.byline}>发布者 · {wallpaper.author}</Text>
          <Text style={styles.description}>正在展示 Wallify 的原图预览。可直接保存至相册，并在应用内完成收藏与分享。</Text>
          <View style={styles.fileInfo}>
            <View style={styles.fileInfoItem}>
              <Text style={styles.fileInfoLabel}>原图分辨率</Text>
              <Text style={styles.fileInfoValue}>{imageMetadata?.width && imageMetadata.height ? `${imageMetadata.width} × ${imageMetadata.height}` : remoteDetail.isLoading ? "正在读取…" : "暂不可用"}</Text>
            </View>
            <View style={styles.fileInfoDivider} />
            <View style={styles.fileInfoItem}>
              <Text style={styles.fileInfoLabel}>文件大小</Text>
              <Text style={styles.fileInfoValue}>{remoteDetail.isLoading ? "正在读取…" : formatFileSize(imageMetadata?.byteSize)}</Text>
            </View>
          </View>
          <Pressable onPress={() => void saveWallpaper()} style={({ pressed }) => [styles.sourceButton, pressed && styles.primaryPressed]}>
            <IconSymbol name="arrow.down.to.line" size={19} color="#FFFFFF" />
            <Text style={styles.sourceText}>保存原图到相册</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
  mediaArea: { width: "100%", minHeight: 220, backgroundColor: "#171722" },
  image: { width: "100%", height: "100%" },
  imageShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(6, 6, 13, 0.08)", pointerEvents: "none" },
  topActions: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 10 },
  topRight: { flexDirection: "row", gap: 9 },
  roundButton: { alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(12, 12, 22, 0.62)" },
  favoritedButton: { backgroundColor: "#C95594" },
  roundPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  infoPanel: { minHeight: 274, borderTopLeftRadius: 27, borderTopRightRadius: 27, backgroundColor: "#0B0B12", padding: 22 },
  pill: { alignSelf: "flex-start", borderRadius: 999, backgroundColor: "#273865", paddingHorizontal: 10, paddingVertical: 5 },
  pillText: { color: "#BED0FF", fontSize: 11, fontWeight: "800" },
  title: { marginTop: 12, color: "#F6F6FB", fontSize: 26, lineHeight: 34, fontWeight: "800" },
  byline: { marginTop: 5, color: "#A6A5B5", fontSize: 13, lineHeight: 18 },
  description: { marginTop: 15, color: "#A6A5B5", fontSize: 13, lineHeight: 19 },
  fileInfo: { flexDirection: "row", alignItems: "stretch", marginTop: 18, overflow: "hidden", borderRadius: 15, backgroundColor: "#171722" },
  fileInfoItem: { flex: 1, paddingHorizontal: 14, paddingVertical: 12 },
  fileInfoDivider: { width: StyleSheet.hairlineWidth, backgroundColor: "#292838" },
  fileInfoLabel: { color: "#A6A5B5", fontSize: 11, fontWeight: "700" },
  fileInfoValue: { marginTop: 4, color: "#F6F6FB", fontSize: 14, fontWeight: "800" },
  sourceButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 51, marginTop: 20, borderRadius: 15, backgroundColor: "#4C83FF" },
  primaryButton: { marginTop: 18, borderRadius: 14, backgroundColor: "#4C83FF", paddingHorizontal: 20, paddingVertical: 13 },
  primaryPressed: { opacity: 0.76, transform: [{ scale: 0.98 }] },
  primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  sourceText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  loadingText: { color: "#A6A5B5", fontSize: 14 },
});
