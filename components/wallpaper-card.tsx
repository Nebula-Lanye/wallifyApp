import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Wallpaper, getCategory } from "@/data/wallpapers";

export function WallpaperCard({ wallpaper }: { wallpaper: Wallpaper }) {
  const category = getCategory(wallpaper.category);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`查看壁纸 ${wallpaper.title}`}
      onPress={() => router.push(`/wallpaper/${wallpaper.id}` as never)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <Image
        source={{ uri: wallpaper.imageUrl }}
        style={styles.image}
        contentFit="cover"
        transition={180}
        accessibilityLabel={wallpaper.title}
      />
      <View style={styles.overlay} />
      <View style={styles.meta}>
        {wallpaper.featured ? <Text style={styles.featured}>精选</Text> : null}
        <Text numberOfLines={2} style={styles.title}>{wallpaper.title}</Text>
        <Text numberOfLines={1} style={styles.category}>{category?.title ?? "Wallify"}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 236,
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "#171722",
  },
  cardPressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  image: { width: "100%", height: "100%", position: "absolute" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8, 8, 16, 0.15)",
  },
  meta: { flex: 1, justifyContent: "flex-end", padding: 13 },
  featured: {
    alignSelf: "flex-start",
    marginBottom: 6,
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 3,
    color: "#FFFFFF",
    backgroundColor: "#785AFB",
    fontSize: 11,
    fontWeight: "700",
  },
  title: { color: "#FFFFFF", fontSize: 15, fontWeight: "800", lineHeight: 20 },
  category: { marginTop: 3, color: "#E5E3F2", fontSize: 12, lineHeight: 17 },
});

