import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Stack, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { wallifyImageUrl } from "@/data/wallify-image";
import { type LinkedWallifyProfile, useWallifyProfile } from "@/hooks/use-wallify-profile";
import { useWallifySession } from "@/hooks/use-wallify-session";
import { trpc } from "@/lib/trpc";
import { getWallifyServiceIssue } from "@/lib/wallify-service-error";

const EMPTY_TOKEN = "000000000000000000000000000000000000000000000000";
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

type SelectedAvatar = {
  uri: string;
  fileName: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
};

function avatarProxy(url: string | undefined, revision: number) {
  if (!url) return undefined;
  try {
    return `${wallifyImageUrl(new URL(url).pathname)}&v=${revision}`;
  } catch {
    return url;
  }
}

function avatarMimeType(mimeType: string | null | undefined, fileName: string) {
  if (mimeType === "image/png" || mimeType === "image/webp" || mimeType === "image/gif" || mimeType === "image/jpeg") return mimeType;
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";
  return "image/jpeg";
}

export default function ProfileEditScreen() {
  const { session, isLoading: isSessionLoading, saveSession } = useWallifySession();
  const { saveProfile } = useWallifyProfile();
  const settings = trpc.wallify.accountSettings.useQuery({ token: session?.token ?? EMPTY_TOKEN }, { enabled: Boolean(session) });
  const updateProfile = trpc.wallify.updateProfile.useMutation();
  const updateAvatar = trpc.wallify.updateAvatar.useMutation();
  const appApiProfileWriteUnavailable = true;
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<SelectedAvatar | null>(null);
  const [avatarRevision, setAvatarRevision] = useState(() => session?.profile.avatarRevision ?? 0);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);

  useEffect(() => {
    if (!settings.data) return;
    setUsername(settings.data.username);
    setEmail(settings.data.email);
    setBio(settings.data.bio);
  }, [settings.data]);

  useEffect(() => {
    const expiresAt = settings.data?.tokenExpiresAt;
    if (!session || !expiresAt || session.expiresAt === expiresAt) return;
    void saveSession({ ...session, expiresAt });
  }, [saveSession, session, settings.data?.tokenExpiresAt]);

  const avatarSource = useMemo(
    () => selectedAvatar?.uri ?? avatarProxy(session?.profile.avatarUrl, avatarRevision || session?.profile.avatarRevision || 0),
    [avatarRevision, selectedAvatar?.uri, session?.profile.avatarRevision, session?.profile.avatarUrl],
  );
  const isSaving = updateProfile.isPending || updateAvatar.isPending;
  const isAvatarUploadInProgress = isAvatarUploading || updateAvatar.isPending;

  const chooseAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.86 });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const info = await FileSystem.getInfoAsync(asset.uri);
      const bytes = "size" in info && typeof info.size === "number" ? info.size : null;
      if (bytes !== null && bytes > MAX_AVATAR_BYTES) {
        Alert.alert("图片过大", "头像图片请控制在 5MB 以内。");
        return;
      }
      const fileName = asset.fileName?.trim() || `wallify-avatar-${Date.now()}.jpg`;
      setSelectedAvatar({ uri: asset.uri, fileName, mimeType: avatarMimeType(asset.mimeType, fileName) });
    } catch (error) {
      Alert.alert("无法选择头像", error instanceof Error ? error.message : "请检查相册权限后重试。");
    }
  };

  const handleSave = async () => {
    if (!session) return;
    if (appApiProfileWriteUnavailable) {
      Alert.alert("暂不支持编辑", "当前 AppAPI v1.4 只提供登录用户资料读取（me），尚未提供资料或头像写入 action。待接口开放后，beta 版会恢复保存功能。", [{ text: "知道了" }]);
      return;
    }
    try {
      let nextProfile = await updateProfile.mutateAsync({ token: session.token, username, email, bio });
      let nextAvatarRevision: number | undefined;
      if (selectedAvatar) {
        setIsAvatarUploading(true);
        try {
          const fileBase64 = await FileSystem.readAsStringAsync(selectedAvatar.uri, { encoding: FileSystem.EncodingType.Base64 });
          nextProfile = await updateAvatar.mutateAsync({
            token: session.token,
            fileName: selectedAvatar.fileName,
            mimeType: selectedAvatar.mimeType,
            fileBase64,
          });
          setSelectedAvatar(null);
          nextAvatarRevision = Date.now();
          setAvatarRevision(nextAvatarRevision);
        } finally {
          setIsAvatarUploading(false);
        }
      }
      const persistedProfile: LinkedWallifyProfile = {
        ...(nextProfile as LinkedWallifyProfile),
        ...(nextAvatarRevision ? { avatarRevision: nextAvatarRevision } : {}),
      };
      await saveSession({ token: session.token, expiresAt: session.expiresAt, profile: persistedProfile });
      await saveProfile(persistedProfile);
      Alert.alert("已保存", "你的 Wallify 个人资料和头像已更新。", [{ text: "完成", onPress: () => router.back() }]);
    } catch (error) {
      const issue = getWallifyServiceIssue(error);
      Alert.alert(issue?.title ?? "保存失败", issue?.description ?? (error instanceof Error ? error.message : "请稍后再试。"));
    }
  };

  if (!isSessionLoading && !session) {
    return <ScreenContainer className="items-center justify-center px-7"><Stack.Screen options={{ headerShown: false }} /><IconSymbol name="lock.fill" size={30} color="#A777FF" /><Text style={styles.emptyTitle}>请先登录</Text><Text style={styles.emptyCopy}>登录 Wallify 账号后才能修改个人资料。</Text><Pressable onPress={() => router.replace("/login" as never)} style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}><Text style={styles.saveText}>前往登录</Text></Pressable></ScreenContainer>;
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.nav}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]} accessibilityLabel="返回"><IconSymbol name="chevron.left" size={23} color="#FFFFFF" /></Pressable><Text style={styles.navTitle}>编辑个人资料</Text><View style={styles.navSpacer} /></View>
          <Text style={styles.lead}>当前显示 AppAPI 返回的账户资料。</Text>
          {appApiProfileWriteUnavailable ? <View style={styles.apiNotice}><IconSymbol name="info.circle" size={18} color="#FFCB6B" /><Text style={styles.apiNoticeText}>AppAPI v1.4 暂未提供资料和头像写入接口。当前页面为只读预览，保存功能将在接口开放后启用。</Text></View> : null}
          {settings.isLoading || isSessionLoading ? <View style={styles.loading}><ActivityIndicator color="#7D9EFF" /></View> : <View style={styles.form}>
            <Text style={styles.label}>头像</Text>
            <Pressable onPress={() => void chooseAvatar()} disabled={isSaving || appApiProfileWriteUnavailable} style={({ pressed }) => [styles.avatarPicker, (pressed || isSaving || appApiProfileWriteUnavailable) && styles.pressed]} accessibilityLabel="选择头像" accessibilityState={{ busy: isAvatarUploadInProgress, disabled: appApiProfileWriteUnavailable }}>
              <View style={styles.avatarVisual}>
                {avatarSource ? <Image source={{ uri: avatarSource }} style={styles.avatar} contentFit="cover" cachePolicy="none" /> : <View style={styles.avatarFallback}><IconSymbol name="person.crop.circle.fill" size={44} color="#B8B7C7" /></View>}
                {isAvatarUploadInProgress ? <View style={styles.avatarProgressOverlay}><ActivityIndicator size="small" color="#FFFFFF" /></View> : null}
              </View>
              <View style={styles.avatarCopy}><Text style={styles.avatarTitle}>{isAvatarUploadInProgress ? "正在上传头像…" : selectedAvatar ? "新头像待保存" : "更换头像"}</Text><Text style={styles.avatarHint}>{isAvatarUploadInProgress ? "请保持应用开启，完成后会自动刷新头像" : "从相册选择方形头像 · 最大 5MB"}</Text></View>
              <View style={styles.avatarAction}>{isAvatarUploadInProgress ? <ActivityIndicator size="small" color="#C9D7FF" /> : <IconSymbol name="photo.on.rectangle" size={19} color="#C9D7FF" />}</View>
            </Pressable>
            <Text style={styles.label}>用户名</Text><TextInput value={username} onChangeText={setUsername} editable={!appApiProfileWriteUnavailable} autoCapitalize="none" maxLength={40} placeholder="用户名" placeholderTextColor="#727181" style={styles.input} returnKeyType="next" />
            <Text style={styles.label}>邮箱</Text><TextInput value={email} onChangeText={setEmail} editable={!appApiProfileWriteUnavailable} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" maxLength={320} placeholder="邮箱" placeholderTextColor="#727181" style={styles.input} returnKeyType="next" />
            <Text style={styles.label}>个人简介</Text><TextInput value={bio} onChangeText={setBio} editable={!appApiProfileWriteUnavailable} maxLength={500} multiline textAlignVertical="top" placeholder="介绍一下自己" placeholderTextColor="#727181" style={[styles.input, styles.bioInput]} /><Text style={styles.counter}>{bio.length}/500</Text>
            <Pressable onPress={() => void handleSave()} disabled={isSaving || !settings.data || appApiProfileWriteUnavailable} style={({ pressed }) => [styles.saveButton, (pressed || isSaving || !settings.data || appApiProfileWriteUnavailable) && styles.pressed]}>{isSaving ? <View style={styles.savingButtonContent}><ActivityIndicator color="#FFFFFF" /><Text style={styles.saveText}>{isAvatarUploadInProgress ? "正在上传头像…" : "正在保存资料…"}</Text></View> : <Text style={styles.saveText}>{appApiProfileWriteUnavailable ? "等待接口开放" : "保存资料"}</Text>}</Pressable>
          </View>}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
    flex: { flex: 1 }, content: { flexGrow: 1, padding: 16, paddingBottom: 42 }, apiNotice: { flexDirection: "row", gap: 9, marginTop: 16, borderRadius: 14, backgroundColor: "#3A301C", padding: 13 }, apiNoticeText: { flex: 1, color: "#F2D58B", fontSize: 12, lineHeight: 18 },
 nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, back: { alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 22, backgroundColor: "#171722" }, navTitle: { color: "#F6F6FB", fontSize: 17, fontWeight: "800" }, navSpacer: { width: 44 }, lead: { marginTop: 18, color: "#A6A5B5", fontSize: 13, lineHeight: 19 }, form: { marginTop: 22, padding: 17, borderRadius: 19, backgroundColor: "#171722" }, loading: { alignItems: "center", justifyContent: "center", minHeight: 200 }, label: { marginTop: 10, marginBottom: 8, color: "#DAD9E5", fontSize: 13, fontWeight: "800" }, avatarPicker: { flexDirection: "row", alignItems: "center", minHeight: 84, borderRadius: 16, backgroundColor: "#292838", padding: 11 }, avatarVisual: { width: 62, height: 62 }, avatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: "#3B3A4A" }, avatarFallback: { alignItems: "center", justifyContent: "center", width: 62, height: 62, borderRadius: 31, backgroundColor: "#3B3A4A" }, avatarProgressOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", borderRadius: 31, backgroundColor: "rgba(12, 12, 20, 0.66)" }, avatarCopy: { flex: 1, marginLeft: 12 }, avatarTitle: { color: "#F6F6FB", fontSize: 14, fontWeight: "800" }, avatarHint: { marginTop: 4, color: "#A6A5B5", fontSize: 11, lineHeight: 16 }, avatarAction: { alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 11, backgroundColor: "#4C83FF33" }, input: { minHeight: 52, borderRadius: 14, backgroundColor: "#292838", color: "#F6F6FB", paddingHorizontal: 14, fontSize: 15 }, bioInput: { minHeight: 112, paddingTop: 13 }, counter: { alignSelf: "flex-end", marginTop: 6, color: "#777686", fontSize: 11 }, saveButton: { alignItems: "center", justifyContent: "center", minHeight: 51, marginTop: 20, borderRadius: 15, backgroundColor: "#4C83FF" }, savingButtonContent: { flexDirection: "row", alignItems: "center", gap: 9 }, saveText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" }, pressed: { opacity: 0.74, transform: [{ scale: 0.98 }] }, emptyTitle: { marginTop: 13, color: "#F6F6FB", fontSize: 20, fontWeight: "800" }, emptyCopy: { marginTop: 6, color: "#A6A5B5", fontSize: 13, textAlign: "center", lineHeight: 19 },
});
