import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { MotionView } from "@/components/motion";
import { WallpaperCard } from "@/components/wallpaper-card";
import { ScreenContainer } from "@/components/screen-container";
import { toWallpaper } from "@/data/wallify-feed";
import { categories, wallpapers } from "@/data/wallpapers";
import { trpc } from "@/lib/trpc";

export default function DiscoverScreen() {
  const latest = trpc.wallify.latest.useQuery({ limit: 20 }, { staleTime: 0, refetchOnMount: "always" });
  const [refreshing, setRefreshing] = useState(false);
  const liveWallpapers = latest.data?.map(toWallpaper) ?? [];
  const items = liveWallpapers.length ? liveWallpapers : wallpapers;
  const refreshLatest = useCallback(async () => {
    setRefreshing(true);
    try {
      await latest.refetch({ cancelRefetch: true });
    } finally {
      setRefreshing(false);
    }
  }, [latest]);

  return (
    <ScreenContainer>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refreshLatest()} tintColor="#7D9EFF" colors={["#7D9EFF"]} />}
        renderItem={({ item, index }) => <WallpaperCard wallpaper={item} index={index} />}
        ListHeaderComponent={
          <>
            <MotionView delay={20}>
              <View style={styles.header}>
                <View>
                  <Text style={styles.eyebrow}>WALLIFY</Text>
                  <Text style={styles.heading}>发现你的下一张壁纸</Text>
                  <Text style={styles.subheading}>米哈游游戏壁纸精选，适合手机浏览与收藏。</Text>
                </View>
                <Image source={{ uri: "https://lkr2312.dpdns.org/assets/images/logo-nav.png?v=2" }} style={styles.logo} contentFit="contain" />
              </View>
            </MotionView>

            <MotionView delay={65}><Pressable
                onPress={() => router.push("/search" as never)}
                style={({ pressed }) => [styles.searchShortcut, pressed && styles.shortcutPressed]}
              >
                <IconSymbol name="magnifyingglass" size={20} color="#A6A5B5" />
                <Text style={styles.searchPlaceholder}>搜索角色、标题或游戏</Text>
              </Pressable></MotionView>

            <MotionView delay={105}><View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>游戏分类</Text>
                <Pressable onPress={() => router.push("/random" as never)} style={({ pressed }) => [styles.textButton, pressed && styles.textButtonPressed]}>
                  <Text style={styles.textButtonLabel}>随机二次元</Text>
                  <IconSymbol name="arrow.right" size={15} color="#7D9EFF" />
                </Pressable>
              </View></MotionView>

            <MotionView delay={145}><View style={styles.categories}>
                {categories.map((category) => (
                  <Pressable
                    key={category.slug}
                    onPress={() => router.push(`/category/${category.slug}` as never)}
                    style={({ pressed }) => [styles.categoryCard, pressed && styles.categoryPressed]}
                  >
                    <View style={[styles.categoryIcon, { backgroundColor: `${category.tint}24` }]}>
                      <IconSymbol name={category.icon} size={20} color={category.tint} />
                    </View>
                    <Text numberOfLines={1} style={styles.categoryLabel}>{category.shortTitle}</Text>
                  </Pressable>
                ))}
              </View></MotionView>

            <MotionView delay={185}><View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>最近收录</Text>
                  <Text style={styles.sectionDescription}>来自 Wallify 的公开壁纸</Text>
                </View>
                <Pressable onPress={() => router.push("/latest" as never)} style={({ pressed }) => [styles.textButton, pressed && styles.textButtonPressed]}>
                  <Text style={styles.textButtonLabel}>查看全部</Text>
                  <IconSymbol name="arrow.right" size={15} color="#7D9EFF" />
                </Pressable>
              </View></MotionView>
          </>
        }
        ListFooterComponent={latest.isLoading ? <View style={styles.loading}><ActivityIndicator color="#7D9EFF" /><Text style={styles.loadingText}>正在同步 Wallify 最新上传…</Text></View> : latest.isError ? <Text style={styles.fallbackText}>当前展示本地缓存内容；下拉即可重试同步。</Text> : <Text style={styles.syncText}>已同步官网最新上传 · 下拉刷新以检查新壁纸</Text>}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 30 },
  row: { gap: 12, marginBottom: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingTop: 13, paddingBottom: 20 },
  eyebrow: { color: "#7D9EFF", fontSize: 11, fontWeight: "800", letterSpacing: 1.8 },
  heading: { marginTop: 6, maxWidth: 270, color: "#F6F6FB", fontSize: 29, lineHeight: 37, fontWeight: "800", letterSpacing: -0.6 },
  subheading: { marginTop: 8, maxWidth: 270, color: "#A6A5B5", fontSize: 13, lineHeight: 19 },
  logo: { width: 45, height: 45, marginTop: 4 },
  searchShortcut: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 49, borderRadius: 15, backgroundColor: "#171722", paddingHorizontal: 15 },
  shortcutPressed: { opacity: 0.68 },
  searchPlaceholder: { color: "#A6A5B5", fontSize: 14 },
  sectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 28, marginBottom: 13 },
  sectionTitle: { color: "#F6F6FB", fontSize: 20, lineHeight: 26, fontWeight: "800" },
  sectionDescription: { marginTop: 3, color: "#A6A5B5", fontSize: 12, lineHeight: 17 },
  textButton: { flexDirection: "row", alignItems: "center", gap: 2, paddingVertical: 6 },
  textButtonPressed: { opacity: 0.6 },
  textButtonLabel: { color: "#7D9EFF", fontSize: 13, fontWeight: "700" },
  categories: { flexDirection: "row", gap: 8 },
  categoryCard: { flex: 1, alignItems: "center", gap: 7, minWidth: 0, paddingVertical: 9 },
  categoryPressed: { opacity: 0.6, transform: [{ scale: 0.97 }] },
  categoryIcon: { width: 47, height: 47, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  categoryLabel: { width: "100%", color: "#DAD9E5", fontSize: 10, lineHeight: 14, fontWeight: "700", textAlign: "center" },
  loading: { alignItems: "center", gap: 8, paddingVertical: 26 },
  loadingText: { color: "#A6A5B5", fontSize: 12 },
  syncText: { paddingVertical: 20, color: "#737282", fontSize: 12, textAlign: "center" },
  fallbackText: { paddingVertical: 20, color: "#FFCB6B", fontSize: 12, textAlign: "center" },
});
