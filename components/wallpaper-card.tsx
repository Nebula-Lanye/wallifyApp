import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect } from "react";
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

import { Wallpaper, getCategory } from "@/data/wallpapers";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const entranceEasing = Easing.bezier(0.22, 0.61, 0.36, 1);
const pressEasing = Easing.bezier(0.16, 1, 0.3, 1);

export function WallpaperCard({ wallpaper, index = 0 }: { wallpaper: Wallpaper; index?: number }) {
  const category = getCategory(wallpaper.category);
  const reducedMotion = useReducedMotion();
  const entrance = useSharedValue(reducedMotion ? 1 : 0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      entrance.value = 1;
      return;
    }
    entrance.value = 0;
    entrance.value = withDelay(Math.min(index, 7) * 36, withTiming(1, { duration: 300, easing: entranceEasing, reduceMotion: ReduceMotion.System }));
  }, [entrance, index, reducedMotion]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: (1 - entrance.value) * 12 }],
  }));
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }));

  const animatePress = (value: number, duration: number) => {
    if (reducedMotion) return;
    pressScale.value = withTiming(value, { duration, easing: pressEasing, reduceMotion: ReduceMotion.System });
  };

  return (
    <Animated.View style={[styles.shell, entranceStyle]}>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={`查看壁纸 ${wallpaper.title}`}
        onPress={() => router.push(`/wallpaper/${wallpaper.id}` as never)}
        onPressIn={() => animatePress(0.985, 90)}
        onPressOut={() => animatePress(1, 210)}
        style={[styles.card, pressStyle]}
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
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  card: {
    flex: 1,
    minHeight: 236,
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "#171722",
  },
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
