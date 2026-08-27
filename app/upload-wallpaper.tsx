import * as FileSystem from "expo-file-system/legacy";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenContainer } from "@/components/screen-container";
import { categories } from "@/data/wallpapers";
import { useWallifySession } from "@/hooks/use-wallify-session";
import { trpc } from "@/lib/trpc";
import { WALLPAPER_ANDROID_DOCUMENT_PICKER_OPTIONS, WALLPAPER_IOS_IMAGE_PICKER_OPTIONS } from "@/lib/wallify-image-picker";

type PickedAsset = { uri: string; filename: string; mimeType: string; size: number };
type UploadSuccess = { id: string | null; title: string };
type SystemImageAsset = { uri: string; fileName?: string | null; mimeType?: string | null; fileSize?: number | null };

export default function UploadScreen() {
  const { session, isLoading: sessionLoading } = useWallifySession();
  const [asset, setAsset] = useState<PickedAsset | null>(null);
  const [isAssetsLoading, setIsAssetsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState<UploadSuccess | null>(null);
  const upload = trpc.wallify.upload.useMutation();
  const reducedMotion = useReducedMotion();
  const successProgress = useSharedValue(0);

  useEffect(() => {
    if (!uploadSuccess) {
      successProgress.value = 0;
      return;
    }
    if (Platform.OS !== "web") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    successProgress.value = 0;
    successProgress.value = withTiming(1, {
      duration: 320,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      reduceMotion: ReduceMotion.System,
    });
  }, [reducedMotion, successProgress, uploadSuccess]);

  const successCardStyle = useAnimatedStyle(() => ({
    opacity: successProgress.value,
    transform: [{ translateY: (1 - successProgress.value) * 18 }, { scale: 0.94 + successProgress.value * 0.06 }],
  }));
  const successIconStyle = useAnimatedStyle(() => ({ transform: [{ scale: 0.78 + successProgress.value * 0.22 }] }));

  const applySystemImage = async ({ uri, fileName, mimeType, fileSize }: SystemImageAsset) => {
    const details = await FileSystem.getInfoAsync(uri);
    const size = "size" in details && typeof details.size === "number" ? details.size : fileSize ?? 0;
    if (size > 10 * 1024 * 1024) {
      Alert.alert("图片过大", "Wallify 支持最大 10MB 的 JPG、PNG、GIF 或 WebP 图片。");
      return;
    }
    const filename = fileName?.trim() || `wallify-${Date.now()}.jpg`;
    const extension = filename.split(".").pop()?.toLowerCase();
    const normalizedMimeType = mimeType === "image/png" || extension === "png" ? "image/png" : mimeType === "image/webp" || extension === "webp" ? "image/webp" : mimeType === "image/gif" || extension === "gif" ? "image/gif" : "image/jpeg";
    setAsset({ uri, filename, mimeType: normalizedMimeType, size });
  };

  const openGallery = async () => {
    if (Platform.OS === "web") {
      Alert.alert("请在移动设备中选择图片", "原生上传的图片选择器仅在 iOS 和 Android 中可用。");
      return;
    }
    if (isAssetsLoading) return;
    setIsAssetsLoading(true);
    try {
      if (Platform.OS === "android") {
        const result = await DocumentPicker.getDocumentAsync(WALLPAPER_ANDROID_DOCUMENT_PICKER_OPTIONS);
        if (result.canceled || !result.assets[0]) return;
        const selected = result.assets[0];
        await applySystemImage({ uri: selected.uri, fileName: selected.name, mimeType: selected.mimeType, fileSize: selected.size });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync(WALLPAPER_IOS_IMAGE_PICKER_OPTIONS);
      if (result.canceled || !result.assets[0]) return;
      const selected = result.assets[0];
      await applySystemImage({ uri: selected.uri, fileName: selected.fileName, mimeType: selected.mimeType, fileSize: selected.fileSize });
    } catch (error) {
      Alert.alert("无法打开系统图片选择器", error instanceof Error ? error.message : "请检查系统文件访问权限后重试。");
    } finally {
      setIsAssetsLoading(false);
    }
  };

  const submit = async () => {
    if (!session) {
      Alert.alert("请先登录", "登录 Wallify 账号后才能上传壁纸。");
      return;
    }
    if (!asset || !title.trim() || !categoryId) {
      Alert.alert("信息不完整", "请选择图片，并填写标题和游戏分类。");
      return;
    }
    try {
      const fileBase64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
      const result = await upload.mutateAsync({
        sessionId: session.sessionId,
        title: title.trim(),
        categoryId: Number(categoryId),
        description: description.trim(),
        tags: tags.trim(),
        fileName: asset.filename,
        mimeType: asset.mimeType,
        fileBase64,
      });
      setUploadSuccess({ id: result.id, title: title.trim() });
    } catch (error) {
      Alert.alert("上传失败", error instanceof Error ? error.message : "请稍后重试。");
    }
  };

  const viewPublishedWallpaper = () => {
    const id = uploadSuccess?.id;
    setUploadSuccess(null);
    if (id) {
      router.replace(`/wallpaper/${id}` as never);
      return;
    }
    router.back();
  };

  if (!sessionLoading && !session) {
    return (
      <ScreenContainer className="items-center justify-center px-7">
        <Stack.Screen options={{ headerShown: false }} />
        <IconSymbol name="lock.fill" size={30} color="#A777FF" />
        <Text style={styles.emptyTitle}>请先登录 Wallify</Text>
        <Text style={styles.emptyCopy}>上传会使用当前应用内的 Wallify 登录会话。</Text>
        <Pressable onPress={() => router.replace({ pathname: "/login", params: { redirectTo: "/upload-wallpaper" } } as never)} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryText}>前往登录</Text></Pressable>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.nav}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><IconSymbol name="chevron.left" size={24} color="#FFFFFF" /></Pressable><Text style={styles.navTitle}>上传壁纸</Text><View style={styles.navSpacer} /></View>
        <Text style={styles.lead}>从设备相册选择壁纸，在 Wallify 原生发布。</Text>
        <Pressable onPress={() => void openGallery()} disabled={isAssetsLoading} style={({ pressed }) => [styles.pickArea, (pressed || isAssetsLoading) && styles.pressed]}>
          {asset ? <Image source={{ uri: asset.uri }} style={styles.preview} contentFit="cover" /> : <><IconSymbol name="photo.on.rectangle" size={31} color="#A777FF" /><Text style={styles.pickTitle}>{isAssetsLoading ? "正在读取相册…" : "从相册选择壁纸"}</Text><Text style={styles.pickCopy}>JPG、PNG、GIF、WebP · 最大 10MB</Text></>}
        </Pressable>
        {asset ? <Pressable onPress={() => void openGallery()} disabled={isAssetsLoading} style={({ pressed }) => [styles.changePhoto, (pressed || isAssetsLoading) && styles.pressed]}><Text style={styles.changePhotoText}>更换图片</Text></Pressable> : null}
        <Text style={styles.label}>标题</Text><TextInput value={title} onChangeText={setTitle} placeholder="给壁纸起个名字" placeholderTextColor="#727181" style={styles.input} returnKeyType="next" />
        <Text style={styles.label}>游戏分类</Text><View style={styles.categoryGrid}>{categories.map((category, index) => <Pressable key={category.slug} onPress={() => setCategoryId(String(index + 1))} style={({ pressed }) => [styles.categoryButton, categoryId === String(index + 1) && styles.categorySelected, pressed && styles.pressed]}><Text style={[styles.categoryText, categoryId === String(index + 1) && styles.categoryTextSelected]}>{category.shortTitle}</Text></Pressable>)}</View>
        <Text style={styles.label}>描述 <Text style={styles.optional}>（选填）</Text></Text><TextInput value={description} onChangeText={setDescription} placeholder="描述一下这张壁纸" placeholderTextColor="#727181" style={[styles.input, styles.textarea]} multiline />
        <Text style={styles.label}>标签 <Text style={styles.optional}>（选填）</Text></Text><TextInput value={tags} onChangeText={setTags} placeholder="用逗号分隔，如：原神, 风景" placeholderTextColor="#727181" style={styles.input} />
        <Pressable onPress={() => void submit()} disabled={upload.isPending} style={({ pressed }) => [styles.primaryButton, (pressed || upload.isPending) && styles.pressed]}>{upload.isPending ? <ActivityIndicator color="#FFFFFF" /> : <><IconSymbol name="square.and.arrow.up" size={18} color="#FFFFFF" /><Text style={styles.primaryText}>发布到 Wallify</Text></>}</Pressable>
      </ScrollView>
      <Modal transparent visible={Boolean(uploadSuccess)} animationType="none" onRequestClose={() => setUploadSuccess(null)}><View style={styles.successBackdrop}><Animated.View style={[styles.successCard, successCardStyle]}><Animated.View style={[styles.successIcon, successIconStyle]}><IconSymbol name="checkmark.circle.fill" size={33} color="#FFFFFF" /></Animated.View><Text style={styles.successTitle}>壁纸发布成功</Text><Text style={styles.successCopy}>“{uploadSuccess?.title}”已发布到 Wallify。</Text><Pressable onPress={viewPublishedWallpaper} style={({ pressed }) => [styles.successPrimary, pressed && styles.pressed]}><Text style={styles.successPrimaryText}>{uploadSuccess?.id ? "查看壁纸详情" : "完成"}</Text></Pressable><Pressable onPress={() => setUploadSuccess(null)} style={({ pressed }) => [styles.successSecondary, pressed && styles.pressed]}><Text style={styles.successSecondaryText}>继续编辑</Text></Pressable></Animated.View></View></Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 34 }, nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, back: { alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 22, backgroundColor: "#171722" }, navTitle: { color: "#F6F6FB", fontSize: 17, fontWeight: "800" }, navSpacer: { width: 44 }, lead: { marginTop: 16, color: "#A6A5B5", fontSize: 13, lineHeight: 19 }, pickArea: { alignItems: "center", justifyContent: "center", minHeight: 220, marginTop: 22, overflow: "hidden", borderWidth: 1, borderStyle: "dashed", borderColor: "#5B4E8B", borderRadius: 18, backgroundColor: "#171722" }, preview: { width: "100%", height: 260 }, pickTitle: { marginTop: 12, color: "#F6F6FB", fontSize: 16, fontWeight: "800" }, pickCopy: { marginTop: 5, color: "#A6A5B5", fontSize: 12 }, changePhoto: { alignItems: "center", minHeight: 38, justifyContent: "center" }, changePhotoText: { color: "#7D9EFF", fontWeight: "800", fontSize: 13 }, label: { marginTop: 18, marginBottom: 8, color: "#DAD9E5", fontSize: 13, fontWeight: "800" }, optional: { color: "#777686", fontWeight: "500" }, input: { minHeight: 50, borderRadius: 14, backgroundColor: "#171722", color: "#F6F6FB", paddingHorizontal: 14, fontSize: 14 }, textarea: { minHeight: 92, paddingTop: 13, textAlignVertical: "top" }, categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, categoryButton: { width: "48%", alignItems: "center", minHeight: 43, justifyContent: "center", borderRadius: 13, backgroundColor: "#171722" }, categorySelected: { backgroundColor: "#4C83FF" }, categoryText: { color: "#C9C8D5", fontSize: 13, fontWeight: "700" }, categoryTextSelected: { color: "#FFFFFF" }, primaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 51, marginTop: 25, borderRadius: 15, backgroundColor: "#4C83FF" }, primaryText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" }, pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] }, emptyTitle: { marginTop: 13, color: "#F6F6FB", fontSize: 20, fontWeight: "800" }, emptyCopy: { marginTop: 6, color: "#A6A5B5", fontSize: 13, textAlign: "center", lineHeight: 19 }, sheetBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.62)" }, sheet: { height: "72%", borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: "#171722", paddingTop: 10 }, sheetHandle: { alignSelf: "center", width: 38, height: 4, borderRadius: 3, backgroundColor: "#555466" }, sheetTitle: { marginTop: 18, marginHorizontal: 16, color: "#F6F6FB", fontSize: 19, fontWeight: "800" }, assetGrid: { padding: 8, gap: 6 }, assetTile: { width: "33.333%", aspectRatio: 1, padding: 3 }, assetImage: { flex: 1, borderRadius: 8, backgroundColor: "#292838" }, successBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, backgroundColor: "rgba(5, 5, 12, 0.68)" }, successCard: { width: "100%", maxWidth: 360, alignItems: "center", borderWidth: 1, borderColor: "#6F9CFF66", borderRadius: 24, backgroundColor: "#1B1B29", paddingHorizontal: 22, paddingTop: 26, paddingBottom: 18 }, successIcon: { alignItems: "center", justifyContent: "center", width: 66, height: 66, borderRadius: 33, backgroundColor: "#3A73F0" }, successTitle: { marginTop: 16, color: "#F6F6FB", fontSize: 20, fontWeight: "800" }, successCopy: { marginTop: 7, color: "#B5B4C2", fontSize: 13, lineHeight: 19, textAlign: "center" }, successPrimary: { alignItems: "center", justifyContent: "center", alignSelf: "stretch", minHeight: 48, marginTop: 22, borderRadius: 14, backgroundColor: "#4C83FF" }, successPrimaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" }, successSecondary: { alignItems: "center", justifyContent: "center", minHeight: 42, marginTop: 5 }, successSecondaryText: { color: "#AABEFF", fontSize: 13, fontWeight: "800" },
});
