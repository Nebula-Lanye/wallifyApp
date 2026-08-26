import { FlatList, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { ScreenContainer } from "@/components/screen-container";
import { WallpaperCard } from "@/components/wallpaper-card";
import { wallpapers } from "@/data/wallpapers";
import { useFavorites } from "@/hooks/use-favorites";

export default function FavoritesScreen() {
  const { favoriteIds, isReady } = useFavorites();
  const favorites = wallpapers.filter((wallpaper) => favoriteIds.includes(wallpaper.id));

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
            <Text style={styles.subtitle}>保存在此设备上的壁纸，随时回来继续浏览。</Text>
          </View>
        }
        ListEmptyComponent={isReady ? <EmptyState title="还没有收藏" description="在壁纸详情页点按心形按钮，即可把喜欢的壁纸保存在这里。" icon="heart" /> : null}
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
});
