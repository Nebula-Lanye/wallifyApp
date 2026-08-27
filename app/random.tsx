import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import * as MediaLibrary from "expo-media-library";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { Stack, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { WallifyServiceErrorState } from "@/components/wallify-service-error-state";
import { getRandomSource, randomSources } from "@/data/wallify-feed";
import { trpc } from "@/lib/trpc";

type RandomItem = {
  url: string;
  name: string;
  type: "image" | "video";
  source: string;
  category: string;
};

function RandomVideo({ url }: { url: string }) {
  const player = useVideoPlayer(url, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.play();
  });

  return (
    <View style={styles.videoWrap}>
      <VideoView style={styles.video} player={player} contentFit="contain" nativeControls playsInline surfaceType="textureView" />
    </View>
  );
}

export default function RandomWallpapersScreen() {
  const [source, setSource] = useState("alcy");
  const [category, setCategory] = useState("ycy");
  const [current, setCurrent] = useState<RandomItem | null>(null);
  const [history, setHistory] = useState<RandomItem[]>([]);
  const [showingHistory, setShowingHistory] = useState(false);
  const selectedSource = useMemo(() => getRandomSource(source), [source]);
  const selectedCategory = useMemo(
    () => selectedSource.categories.find((item) => item.code === category) ?? selectedSource.categories[0],
    [category, selectedSource],
  );
  const random = trpc.wallify.random.useQuery(
    { source, category },
    { enabled: !showingHistory, staleTime: 0, refetchOnMount: "always", retry: 1 },
  );

  useEffect(() => {
    if (!random.data || showingHistory) return;
    setCurrent((previous) => {
      if (previous && previous.url !== random.data.url) {
        setHistory((items) => [...items.filter((item) => item.url !== previous.url), previous].slice(-50));
      }
      return random.data;
    });
  }, [random.data, showingHistory]);

  const requestNext = () => {
    setShowingHistory(false);
    void random.refetch({ cancelRefetch: true });
  };

  const changeSource = (nextSource: string) => {
    const next = getRandomSource(nextSource);
    setSource(next.code);
    setCategory(next.categories[0].code);
    setShowingHistory(false);
  };

  const changeCategory = (nextCategory: string) => {
    setCategory(nextCategory);
    setShowingHistory(false);
  };

  const showPrevious = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory((items) => items.slice(0, -1));
    setCurrent(previous);
    setSource(previous.source);
    setCategory(previous.category);
    setShowingHistory(true);
  };

  const save = async () => {
    if (!current?.url) return;
    if (Platform.OS === "web") {
      Alert.alert("请在移动设备中保存", "原图与动图保存功能会在 iOS 或 Android 中写入系统相册。");
      return;
    }
    try {
      const permission = await MediaLibrary.requestPermissionsAsync(true, ["photo", "video"]);
      if (!permission.granted) {
        Alert.alert("需要相册权限", "允许后才能保存随机壁纸。\n");
        return;
      }
      const extension = current.type === "video" ? "mp4" : "jpg";
      const uri = `${FileSystem.cacheDirectory}wallify-random-${Date.now()}.${extension}`;
      const downloaded = await FileSystem.downloadAsync(current.url, uri);
      await MediaLibrary.saveToLibraryAsync(downloaded.uri);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("已保存到相册", current.type === "video" ? "随机动图已保存。" : "随机壁纸已保存。");
    } catch {
      Alert.alert("保存失败", "这张随机内容暂时无法下载，请换一张后重试。");
    }
  };

  const isLoadingFirstItem = !current && (random.isLoading || random.isFetching);
  const activeItem = current;
  const sourceForItem = getRandomSource(activeItem?.source ?? source);
  const categoryForItem = sourceForItem.categories.find((item) => item.code === (activeItem?.category ?? category)) ?? selectedCategory;

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <IconSymbol name="chevron.left" size={22} color="#F6F6FB" />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>随机二次元</Text>
            <Text style={styles.subtitle}>多来源、多分类，始终在应用内浏览。</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sourceRow}>
          {randomSources.map((item) => (
            <Pressable key={item.code} onPress={() => changeSource(item.code)} style={[styles.sourceChip, source === item.code && styles.sourceChipActive]}>
              <Text style={[styles.sourceText, source === item.code && styles.sourceTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {selectedSource.categories.map((item) => (
            <Pressable key={`${source}-${item.code}`} onPress={() => changeCategory(item.code)} style={[styles.categoryChip, category === item.code && styles.categoryChipActive]}>
              <Text style={[styles.categoryText, category === item.code && styles.categoryTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.media}>
          {isLoadingFirstItem ? <View style={styles.center}><ActivityIndicator color="#7D9EFF" size="large" /><Text style={styles.loadingText}>正在获取随机壁纸…</Text></View> : activeItem?.type === "video" ? <RandomVideo url={activeItem.url} /> : activeItem?.url ? <Image source={{ uri: activeItem.url }} style={styles.image} contentFit="contain" transition={220} /> : <View style={styles.center}><Text style={styles.loadingText}>暂时没有获取到随机壁纸。</Text></View>}
          {activeItem && random.isFetching && !showingHistory ? <View style={styles.refreshing}><ActivityIndicator color="#FFFFFF" size="small" /><Text style={styles.refreshingText}>正在换一张…</Text></View> : null}
        </View>

        {random.isError ? <WallifyServiceErrorState error={random.error} onRetry={requestNext} /> : null}

        <View style={styles.meta}>
          <Text style={styles.metaLabel}>{sourceForItem.label} · {categoryForItem.label}</Text>
          <Text style={styles.metaTitle}>{activeItem?.name || selectedCategory.label}</Text>
          <Text style={styles.metaDescription}>图片来自 {sourceForItem.hint}，仅供个人收藏使用。</Text>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={showPrevious} disabled={!history.length} style={({ pressed }) => [styles.secondary, !history.length && styles.disabled, pressed && styles.pressed]}>
            <IconSymbol name="chevron.left" size={19} color="#DAD9E5" /><Text style={styles.secondaryText}>上一张</Text>
          </Pressable>
          <Pressable onPress={requestNext} disabled={random.isFetching} style={({ pressed }) => [styles.secondary, random.isFetching && styles.disabled, pressed && styles.pressed]}>
            <IconSymbol name="arrow.clockwise" size={19} color="#DAD9E5" /><Text style={styles.secondaryText}>换一张</Text>
          </Pressable>
          <Pressable onPress={() => void save()} disabled={!activeItem?.url} style={({ pressed }) => [styles.primary, !activeItem?.url && styles.disabled, pressed && styles.pressed]}>
            <IconSymbol name="arrow.down.to.line" size={19} color="#FFFFFF" /><Text style={styles.primaryText}>保存</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  headerCopy: { flex: 1 },
  back: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, backgroundColor: "#171722" },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
  title: { color: "#F6F6FB", fontSize: 25, fontWeight: "800" },
  subtitle: { marginTop: 3, color: "#A6A5B5", fontSize: 12 },
  sourceRow: { gap: 8, paddingBottom: 11 },
  sourceChip: { borderRadius: 999, borderWidth: 1, borderColor: "#292838", backgroundColor: "#171722", paddingHorizontal: 15, paddingVertical: 9 },
  sourceChipActive: { backgroundColor: "#4C83FF", borderColor: "#4C83FF" },
  sourceText: { color: "#C9C8D5", fontSize: 13, fontWeight: "800" },
  sourceTextActive: { color: "#FFFFFF" },
  categoryRow: { gap: 8, paddingBottom: 15 },
  categoryChip: { borderRadius: 999, backgroundColor: "#171722", paddingHorizontal: 13, paddingVertical: 9 },
  categoryChipActive: { backgroundColor: "#332E63" },
  categoryText: { color: "#C9C8D5", fontSize: 12, fontWeight: "700" },
  categoryTextActive: { color: "#C8C0FF" },
  media: { overflow: "hidden", aspectRatio: 0.78, borderRadius: 22, backgroundColor: "#171722" },
  image: { width: "100%", height: "100%" },
  videoWrap: { flex: 1, backgroundColor: "#111118" },
  video: { width: "100%", height: "100%" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 25 },
  loadingText: { color: "#A6A5B5", fontSize: 13, lineHeight: 19, textAlign: "center" },
  refreshing: { position: "absolute", top: 14, right: 14, flexDirection: "row", gap: 6, alignItems: "center", borderRadius: 999, backgroundColor: "rgba(11,11,18,0.76)", paddingHorizontal: 10, paddingVertical: 7 },
  refreshingText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  meta: { marginTop: 17 },
  metaLabel: { color: "#A777FF", fontSize: 11, fontWeight: "800" },
  metaTitle: { marginTop: 6, color: "#F6F6FB", fontSize: 21, fontWeight: "800" },
  metaDescription: { marginTop: 7, color: "#A6A5B5", fontSize: 12, lineHeight: 18 },
  actions: { flexDirection: "row", gap: 8, marginTop: 20 },
  secondary: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, minHeight: 51, borderRadius: 15, backgroundColor: "#292838" },
  primary: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, minHeight: 51, borderRadius: 15, backgroundColor: "#4C83FF" },
  disabled: { opacity: 0.4 },
  secondaryText: { color: "#DAD9E5", fontSize: 13, fontWeight: "800" },
  primaryText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
});
