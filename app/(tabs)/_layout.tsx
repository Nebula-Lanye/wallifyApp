import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { router, Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.muted,
        tabBarButton: HapticTab,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: {
          height: 57 + bottomPadding,
          paddingTop: 7,
          paddingBottom: bottomPadding,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "发现", tabBarIcon: ({ color }) => <IconSymbol size={24} name="sparkles" color={color} /> }} />
      <Tabs.Screen name="search" options={{ title: "搜索", tabBarIcon: ({ color }) => <IconSymbol size={24} name="magnifyingglass" color={color} /> }} />
      <Tabs.Screen
        name="upload"
        options={{
          title: "上传",
          tabBarButton: UploadTabButton,
        }}
      />
      <Tabs.Screen name="favorites" options={{ title: "收藏", tabBarIcon: ({ color }) => <IconSymbol size={24} name="heart" color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: "设置", tabBarIcon: ({ color }) => <IconSymbol size={24} name="gearshape" color={color} /> }} />
    </Tabs>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function UploadTabButton() {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const animate = (value: number, duration: number) => {
    if (reducedMotion) return;
    scale.value = withTiming(value, { duration, easing: Easing.bezier(0.16, 1, 0.3, 1), reduceMotion: ReduceMotion.System });
  };

  return (
    <AnimatedPressable
      onPress={() => router.navigate("/upload" as never)}
      onPressIn={() => animate(0.94, 85)}
      onPressOut={() => animate(1, 190)}
      style={[styles.uploadTab, animatedStyle]}
      accessibilityRole="button"
      accessibilityLabel="上传壁纸"
    >
      <View style={styles.uploadCircle}><IconSymbol size={27} name="plus" color="#FFFFFF" weight="bold" /></View>
      <Text style={styles.uploadLabel}>上传</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  uploadTab: { flex: 1, alignItems: "center", justifyContent: "flex-start", paddingTop: 0 },
  uploadCircle: { alignItems: "center", justifyContent: "center", width: 52, height: 52, marginTop: -21, borderWidth: 4, borderColor: "#0B0B12", borderRadius: 26, backgroundColor: "#0D6EFD" },
  uploadLabel: { marginTop: 2, color: "#DAD9E5", fontSize: 11, fontWeight: "700" },
});
