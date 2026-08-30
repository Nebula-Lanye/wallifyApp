import { router } from "expo-router";
import { useEffect, useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { ScreenContainer } from "@/components/screen-container";
import { WallpaperCard } from "@/components/wallpaper-card";
import { WallifyServiceErrorState } from "@/components/wallify-service-error-state";
import { toWallpaper } from "@/data/wallify-feed";
import { useWallifySession } from "@/hooks/use-wallify-session";
import { trpc } from "@/lib/trpc";

export default function FavoritesScreen() {
  const { session, isLoading: sessionLoading, updateSessionExpiry } = useWallifySession();
  const favoritesQuery = trpc.wallify.favorites.useQuery({ token: session?.token ?? "000000000000000000000000000000000000000000000000", page: 1, pageSize: 50 }, { enabled: Boolean(session), staleTime: 0, refetchOnMount: "always", retry: 1 });
  const favorites = useMemo(() => favoritesQuery.data?.items.map(toWallpaper) ?? [], [favoritesQuery.data]);

  useEffect(() => {
    void updateSessionExpiry(favoritesQuery.data?.tokenExpiresAt);
  }, [favoritesQuery.data?.tokenExpiresAt, updateSessionExpiry]);

  return (
    <ScreenContainer>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        renderItem={({ item, index }) => <WallpaperCard wallpaper={item} index={index} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>收藏</Text>
            <Text style={styles.subtitle}>从 AppAPI 账户收藏中读取，随时回来继续浏览。</Text>
          </View>
        }
        ListEmptyComponent={sessionLoading || favoritesQuery.isLoading ? <View style={styles.loading}><ActivityIndicator color="#7D9EFF" /><Text style={styles.loadingText}>正在读取账户收藏…</Text></View> : favoritesQuery.isError ? <WallifyServiceErrorState error={favoritesQuery.error} onRetry={() => void favoritesQuery.refetch()} /> : !session ? <View style={styles.loginCard}><EmptyState title="登录后查看收藏" description="AppAPI 收藏与同步需要登录 Wallify 账户。" icon="heart" /><Pressable onPress={() => router.push("/login" as never)} style={styles.loginButton}><Text style={styles.loginButtonText}>前往登录</Text></Pressable></View> : <EmptyState title="还没有收藏" description="在壁纸详情页点按心形按钮，即可把喜欢的壁纸同步到这里。" icon="heart" />}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 30, flexGrow: 1 },
  header: { paddingTop: 13, paddingBottom: 20 },
  title: { color: "#F6F6FB", fontSize: 29, lineHeight: 37, fontWeight: "800" },
  subtitle: { marginTop: 6, color: "#A6A5B5", fontSize: 13, lineHeight: 19 },
  row: { gap: 12, marginBottom: 12 },
  loading: { alignItems: "center", gap: 8, paddingVertical: 48 },
  loadingText: { color: "#A6A5B5", fontSize: 12 },
  loginCard: { alignItems: "center" },
  loginButton: { minHeight: 44, marginHorizontal: 32, marginTop: 2, borderRadius: 13, backgroundColor: "#4C83FF", paddingHorizontal: 22, paddingVertical: 12 },
  loginButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
});
