import { Stack, router, useLocalSearchParams } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { WallpaperCard } from "@/components/wallpaper-card";
import { GameSlug, getCategory, wallpapers } from "@/data/wallpapers";

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const category = getCategory(slug);
  const items = slug === "random" ? [...wallpapers].sort((a, b) => b.id.localeCompare(a.id)) : wallpapers.filter((item) => item.category === (slug as GameSlug));
  const title = slug === "random" ? "随机发现" : category?.title ?? "壁纸浏览";

  return (
    <ScreenContainer>
      <Stack.Screen options={{ headerShown: false }} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => <WallpaperCard wallpaper={item} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.backPressed]} accessibilityLabel="返回">
              <IconSymbol name="chevron.left" size={22} color="#F6F6FB" />
            </Pressable>
            <View style={styles.headingArea}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{slug === "random" ? "从 Wallify 的公开壁纸中随意发现灵感。" : "正在浏览此游戏分类的公开壁纸。"}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={<EmptyState title="该分类暂时没有壁纸" description="可在 Wallify 网站中继续浏览或稍后再来看看。" />}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 30, flexGrow: 1 },
  row: { gap: 12, marginBottom: 12 },
  header: { paddingTop: 13, paddingBottom: 20 },
  backButton: { alignItems: "center", justifyContent: "center", width: 42, height: 42, marginBottom: 12, borderRadius: 21, backgroundColor: "#171722" },
  backPressed: { opacity: 0.6 },
  headingArea: { paddingRight: 12 },
  title: { color: "#F6F6FB", fontSize: 29, lineHeight: 37, fontWeight: "800" },
  subtitle: { marginTop: 6, color: "#A6A5B5", fontSize: 13, lineHeight: 19 },
});

