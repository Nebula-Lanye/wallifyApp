import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import * as MediaLibrary from "expo-media-library";
import { Image } from "expo-image";
import { Stack, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { randomCategories } from "@/data/wallify-feed";
import { trpc } from "@/lib/trpc";

export default function RandomWallpapersScreen() {
  const [category, setCategory] = useState("ycy");
  const [requestKey, setRequestKey] = useState(0);
  const random = trpc.wallify.random.useQuery({ source: "alcy", category }, { staleTime: 0, refetchOnMount: "always" });
  const label = useMemo(() => randomCategories.find((item) => item.code === category)?.label ?? "二次元", [category]);

  useEffect(() => { void random.refetch(); }, [category, requestKey]);

  const changeCategory = (next: string) => { setCategory(next); setRequestKey((value) => value + 1); };
  const next = () => { setRequestKey((value) => value + 1); void random.refetch(); };
  const save = async () => {
    if (!random.data?.url) return;
    if (Platform.OS === "web") { Alert.alert("请在移动设备中保存", "原图保存功能会在 iOS 或 Android 中写入系统相册。"); return; }
    try {
      const permission = await MediaLibrary.requestPermissionsAsync(true, ["photo"]);
      if (!permission.granted) { Alert.alert("需要相册权限", "允许后才能保存随机壁纸。"); return; }
      const uri = `${FileSystem.cacheDirectory}wallify-random-${Date.now()}.jpg`;
      const downloaded = await FileSystem.downloadAsync(random.data.url, uri);
      await MediaLibrary.saveToLibraryAsync(downloaded.uri);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("已保存到相册", "随机二次元壁纸已保存。 ");
    } catch { Alert.alert("保存失败", "这张随机壁纸暂时无法下载，请换一张后重试。"); }
  };

  return <ScreenContainer edges={["top", "bottom", "left", "right"]}><Stack.Screen options={{ headerShown: false }} /><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><View style={styles.header}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><IconSymbol name="chevron.left" size={22} color="#F6F6FB" /></Pressable><View><Text style={styles.title}>随机二次元</Text><Text style={styles.subtitle}>来源：栗次元 · 应用内换一张，不打开浏览器。</Text></View></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>{randomCategories.map((item) => <Pressable key={item.code} onPress={() => changeCategory(item.code)} style={[styles.categoryChip, category === item.code && styles.categoryChipActive]}><Text style={[styles.categoryText, category === item.code && styles.categoryTextActive]}>{item.label}</Text></Pressable>)}</ScrollView><View style={styles.media}>{random.isFetching ? <View style={styles.center}><ActivityIndicator color="#7D9EFF" size="large" /><Text style={styles.loadingText}>正在获取随机壁纸…</Text></View> : random.data?.type === "video" ? <View style={styles.center}><IconSymbol name="photo.on.rectangle" size={30} color="#A777FF" /><Text style={styles.loadingText}>当前内容是动图，请点击换一张继续探索。</Text></View> : random.data?.url ? <Image source={{ uri: random.data.url }} style={styles.image} contentFit="cover" transition={220} /> : <View style={styles.center}><Text style={styles.loadingText}>{random.error?.message ?? "暂时没有获取到随机壁纸。"}</Text></View>}</View><View style={styles.meta}><Text style={styles.metaLabel}>随机分类</Text><Text style={styles.metaTitle}>{random.data?.name || label}</Text><Text style={styles.metaDescription}>图片来自 Wallify 随机二次元来源，仅供个人收藏使用。</Text></View><View style={styles.actions}><Pressable onPress={next} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}><IconSymbol name="arrow.clockwise" size={19} color="#DAD9E5" /><Text style={styles.secondaryText}>换一张</Text></Pressable><Pressable onPress={() => void save()} disabled={!random.data?.url || random.data.type === "video"} style={({ pressed }) => [styles.primary, (!random.data?.url || random.data.type === "video") && styles.disabled, pressed && styles.pressed]}><IconSymbol name="arrow.down.to.line" size={19} color="#FFFFFF" /><Text style={styles.primaryText}>保存到相册</Text></Pressable></View></ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { padding: 16, paddingBottom: 32 }, header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 }, back: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, backgroundColor: "#171722" }, pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] }, title: { color: "#F6F6FB", fontSize: 25, fontWeight: "800" }, subtitle: { marginTop: 3, color: "#A6A5B5", fontSize: 12 }, categoryRow: { gap: 8, paddingBottom: 15 }, categoryChip: { borderRadius: 999, backgroundColor: "#171722", paddingHorizontal: 13, paddingVertical: 9 }, categoryChipActive: { backgroundColor: "#4C83FF" }, categoryText: { color: "#C9C8D5", fontSize: 12, fontWeight: "700" }, categoryTextActive: { color: "#FFFFFF" }, media: { overflow: "hidden", aspectRatio: 0.78, borderRadius: 22, backgroundColor: "#171722" }, image: { width: "100%", height: "100%" }, center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 25 }, loadingText: { color: "#A6A5B5", fontSize: 13, lineHeight: 19, textAlign: "center" }, meta: { marginTop: 17 }, metaLabel: { color: "#A777FF", fontSize: 11, fontWeight: "800" }, metaTitle: { marginTop: 6, color: "#F6F6FB", fontSize: 21, fontWeight: "800" }, metaDescription: { marginTop: 7, color: "#A6A5B5", fontSize: 12, lineHeight: 18 }, actions: { flexDirection: "row", gap: 10, marginTop: 20 }, secondary: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 51, borderRadius: 15, backgroundColor: "#292838" }, primary: { flex: 1.35, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 51, borderRadius: 15, backgroundColor: "#4C83FF" }, disabled: { opacity: 0.4 }, secondaryText: { color: "#DAD9E5", fontSize: 14, fontWeight: "800" }, primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" } });
