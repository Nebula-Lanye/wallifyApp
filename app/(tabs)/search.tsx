import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { WallpaperCard } from "@/components/wallpaper-card";
import { WallifyServiceErrorState } from "@/components/wallify-service-error-state";
import { toWallpaper } from "@/data/wallify-feed";
import { trpc } from "@/lib/trpc";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim();
  const search = trpc.wallify.search.useQuery(
    { keyword: normalizedQuery || "wallify", page: 1, pageSize: 40 },
    { enabled: Boolean(normalizedQuery), staleTime: 0, refetchOnMount: "always", retry: 1 },
  );
  const results = useMemo(() => search.data?.map(toWallpaper) ?? [], [search.data]);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>搜索</Text>
        <Text style={styles.subtitle}>按角色、标题或游戏分类查找公开壁纸。</Text>
      </View>
      <View style={styles.searchBox}>
        <IconSymbol name="magnifyingglass" size={20} color="#A6A5B5" />
        <TextInput
          accessibilityLabel="搜索壁纸"
          autoCorrect={false}
          autoCapitalize="none"
          value={query}
          onChangeText={setQuery}
          placeholder="例如：遐蝶、原神"
          placeholderTextColor="#727181"
          returnKeyType="search"
          style={styles.input}
        />
        {query ? (
          <Pressable onPress={() => setQuery("")} style={({ pressed }) => [styles.clearButton, pressed && styles.clearPressed]} accessibilityLabel="清除搜索">
            <IconSymbol name="xmark.circle.fill" size={19} color="#A6A5B5" />
          </Pressable>
        ) : null}
      </View>
      {normalizedQuery ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => <WallpaperCard wallpaper={item} index={index} />}
          ListHeaderComponent={<Text style={styles.resultLabel}>{search.isLoading ? "正在搜索…" : results.length ? `找到 ${results.length} 张壁纸` : ""}</Text>}
          ListEmptyComponent={search.isLoading ? <View style={styles.loading}><ActivityIndicator color="#7D9EFF" /><Text style={styles.loadingText}>正在搜索 Wallify…</Text></View> : search.isError ? <WallifyServiceErrorState error={search.error} onRetry={() => void search.refetch()} /> : <EmptyState title="没有找到匹配壁纸" description="换一个角色名或游戏分类再试试。" />}
        />
      ) : (
        <View style={styles.tip}>
          <IconSymbol name="sparkles" size={19} color="#A777FF" />
          <Text style={styles.tipText}>试试搜索“原神”、“星穹铁道”或角色名称。</Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 13, paddingBottom: 18 },
  title: { color: "#F6F6FB", fontSize: 29, lineHeight: 37, fontWeight: "800" },
  subtitle: { marginTop: 6, color: "#A6A5B5", fontSize: 13, lineHeight: 19 },
  searchBox: { flexDirection: "row", alignItems: "center", minHeight: 51, marginHorizontal: 16, borderRadius: 15, backgroundColor: "#171722", paddingHorizontal: 15 },
  input: { flex: 1, marginLeft: 10, color: "#F6F6FB", fontSize: 15, lineHeight: 22, paddingVertical: 12 },
  clearButton: { padding: 5 },
  clearPressed: { opacity: 0.5 },
  list: { paddingHorizontal: 16, paddingBottom: 30 },
  row: { gap: 12, marginBottom: 12 },
  resultLabel: { marginTop: 21, marginBottom: 12, color: "#A6A5B5", fontSize: 13, lineHeight: 18 },
  tip: { flexDirection: "row", alignItems: "center", gap: 10, margin: 16, borderRadius: 15, backgroundColor: "#171722", padding: 15 },
  tipText: { flex: 1, color: "#DAD9E5", fontSize: 13, lineHeight: 19 },
  loading: { alignItems: "center", gap: 8, paddingVertical: 42 },
  loadingText: { color: "#A6A5B5", fontSize: 12 },
});
