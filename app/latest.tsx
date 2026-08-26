import { Stack, router } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { WallpaperCard } from "@/components/wallpaper-card";
import { toWallpaper } from "@/data/wallify-feed";
import { trpc } from "@/lib/trpc";

export default function LatestWallpapersScreen() {
  const latest = trpc.wallify.latest.useQuery({ limit: 40 }, { staleTime: 0, refetchOnMount: "always" });
  const items = latest.data?.map(toWallpaper) ?? [];

  return <ScreenContainer><Stack.Screen options={{ headerShown: false }} /><FlatList data={items} keyExtractor={(item) => item.id} numColumns={2} columnWrapperStyle={styles.row} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={latest.isFetching && !latest.isLoading} onRefresh={() => void latest.refetch()} tintColor="#7D9EFF" colors={["#7D9EFF"]} />} renderItem={({ item }) => <WallpaperCard wallpaper={item} />} ListHeaderComponent={<View style={styles.header}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><IconSymbol name="chevron.left" size={22} color="#F6F6FB" /></Pressable><Text style={styles.title}>最新上传</Text><Text style={styles.subtitle}>下拉页面即可从 Wallify 官网同步新壁纸。</Text></View>} ListEmptyComponent={latest.isLoading ? <View style={styles.loading}><ActivityIndicator color="#7D9EFF" /><Text style={styles.loadingText}>正在同步最新上传…</Text></View> : <EmptyState title="暂时没有可显示的壁纸" description="请下拉刷新后再试。" />} /></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 30 }, row: { gap: 12, marginBottom: 12 }, header: { paddingTop: 13, paddingBottom: 20 }, back: { width: 42, height: 42, alignItems: "center", justifyContent: "center", marginBottom: 12, borderRadius: 21, backgroundColor: "#171722" }, pressed: { opacity: 0.68, transform: [{ scale: 0.97 }] }, title: { color: "#F6F6FB", fontSize: 29, fontWeight: "800" }, subtitle: { marginTop: 6, color: "#A6A5B5", fontSize: 13, lineHeight: 19 }, loading: { alignItems: "center", gap: 9, paddingTop: 80 }, loadingText: { color: "#A6A5B5", fontSize: 13 } });
