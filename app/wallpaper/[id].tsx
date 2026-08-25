import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Alert, Platform, Pressable, Share, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getCategory, getWallpaper } from "@/data/wallpapers";
import { useFavorites } from "@/hooks/use-favorites";

export default function WallpaperDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const wallpaper = getWallpaper(id);
  const { isFavorite, toggleFavorite } = useFavorites();

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

  const openSource = () => {
    void WebBrowser.openBrowserAsync(wallpaper.sourceUrl, {
      toolbarColor: "#171722",
      controlsColor: "#7D9EFF",
      enableDefaultShareMenuItem: true,
    });
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.mediaArea}>
        <Image source={{ uri: wallpaper.imageUrl }} style={styles.image} contentFit="cover" transition={180} accessibilityLabel={wallpaper.title} />
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
        <Text style={styles.description}>该预览来自 Wallify 壁纸站。打开原站可查看完整内容并使用社区功能。</Text>
        <Pressable onPress={openSource} style={({ pressed }) => [styles.sourceButton, pressed && styles.primaryPressed]}>
          <Text style={styles.sourceText}>在 Wallify 中打开</Text>
          <IconSymbol name="arrow.up.right" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mediaArea: { flex: 1, minHeight: 330, backgroundColor: "#171722" },
  image: { width: "100%", height: "100%", position: "absolute" },
  imageShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(6, 6, 13, 0.16)" },
  topActions: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 10 },
  topRight: { flexDirection: "row", gap: 9 },
  roundButton: { alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(12, 12, 22, 0.62)" },
  favoritedButton: { backgroundColor: "#C95594" },
  roundPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  infoPanel: { marginTop: -26, minHeight: 274, borderTopLeftRadius: 27, borderTopRightRadius: 27, backgroundColor: "#0B0B12", padding: 22 },
  pill: { alignSelf: "flex-start", borderRadius: 999, backgroundColor: "#273865", paddingHorizontal: 10, paddingVertical: 5 },
  pillText: { color: "#BED0FF", fontSize: 11, fontWeight: "800" },
  title: { marginTop: 12, color: "#F6F6FB", fontSize: 26, lineHeight: 34, fontWeight: "800" },
  byline: { marginTop: 5, color: "#A6A5B5", fontSize: 13, lineHeight: 18 },
  description: { marginTop: 15, color: "#A6A5B5", fontSize: 13, lineHeight: 19 },
  sourceButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 51, marginTop: 20, borderRadius: 15, backgroundColor: "#4C83FF" },
  primaryButton: { marginTop: 18, borderRadius: 14, backgroundColor: "#4C83FF", paddingHorizontal: 20, paddingVertical: 13 },
  primaryPressed: { opacity: 0.76, transform: [{ scale: 0.98 }] },
  primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  sourceText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});

