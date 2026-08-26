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

const EMPTY_SESSION_ID = "00000000-0000-0000-0000-000000000000";
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
  const settings = trpc.wallify.accountSettings.useQuery({ sessionId: session?.sessionId ?? EMPTY_SESSION_ID }, { enabled: Boolean(session) });
  const updateProfile = trpc.wallify.updateProfile.useMutation();
  const updateAvatar = trpc.wallify.updateAvatar.useMutation();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<SelectedAvatar | null>(null);
  const [avatarRevision, setAvatarRevision] = useState(() => session?.profile.avatarRevision ?? 0);

  useEffect(() => {
    if (!settings.data) return;
    setUsername(settings.data.username);
    setEmail(settings.data.email);
    setBio(settings.data.bio);
  }, [settings.data]);

  const avatarSource = useMemo(
    () => selectedAvatar?.uri ?? avatarProxy(session?.profile.avatarUrl, avatarRevision || session?.profile.avatarRevision || 0),
    [avatarRevision, selectedAvatar?.uri, session?.profile.avatarRevision, session?.profile.avatarUrl],
  );
  const isSaving = updateProfile.isPending || updateAvatar.isPending;

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
    try {
      let nextProfile = await updateProfile.mutateAsync({ sessionId: session.sessionId, username, email, bio });
      let nextAvatarRevision: number | undefined;
      if (selectedAvatar) {
        const fileBase64 = await FileSystem.readAsStringAsync(selectedAvatar.uri, { encoding: FileSystem.EncodingType.Base64 });
        nextProfile = await updateAvatar.mutateAsync({
          sessionId: session.sessionId,
          fileName: selectedAvatar.fileName,
          mimeType: selectedAvatar.mimeType,
          fileBase64,
        });
        setSelectedAvatar(null);
        nextAvatarRevision = Date.now();
        setAvatarRevision(nextAvatarRevision);
      }
      const persistedProfile: LinkedWallifyProfile = {
        ...(nextProfile as LinkedWallifyProfile),
        ...(nextAvatarRevision ? { avatarRevision: nextAvatarRevision } : {}),
      };
      await saveSession({ sessionId: session.sessionId, profile: persistedProfile });
      await saveProfile(persistedProfile);
      Alert.alert("已保存", "你的 Wallify 个人资料和头像已更新。", [{ text: "完成", onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert("保存失败", error instanceof Error ? error.message : "请稍后再试。 ");
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
          <Text style={styles.lead}>资料和头像会直接同步到你的 Wallify 账户与公开主页。</Text>
          {settings.isLoading || isSessionLoading ? <View style={styles.loading}><ActivityIndicator color="#7D9EFF" /></View> : <View style={styles.form}>
            <Text style={styles.label}>头像</Text>
            <Pressable onPress={() => void chooseAvatar()} disabled={isSaving} style={({ pressed }) => [styles.avatarPicker, (pressed || isSaving) && styles.pressed]} accessibilityLabel="选择头像">
              {avatarSource ? <Image source={{ uri: avatarSource }} style={styles.avatar} contentFit="cover" cachePolicy="none" /> : <View style={styles.avatarFallback}><IconSymbol name="person.crop.circle.fill" size={44} color="#B8B7C7" /></View>}
              <View style={styles.avatarCopy}><Text style={styles.avatarTitle}>{selectedAvatar ? "新头像待保存" : "更换头像"}</Text><Text style={styles.avatarHint}>从相册选择方形头像 · 最大 5MB</Text></View>
              <View style={styles.avatarAction}><IconSymbol name="photo.on.rectangle" size={19} color="#C9D7FF" /></View>
            </Pressable>
            <Text style={styles.label}>用户名</Text><TextInput value={username} onChangeText={setUsername} autoCapitalize="none" maxLength={40} placeholder="用户名" placeholderTextColor="#727181" style={styles.input} returnKeyType="next" />
            <Text style={styles.label}>邮箱</Text><TextInput value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" maxLength={320} placeholder="邮箱" placeholderTextColor="#727181" style={styles.input} returnKeyType="next" />
            <Text style={styles.label}>个人简介</Text><TextInput value={bio} onChangeText={setBio} maxLength={500} multiline textAlignVertical="top" placeholder="介绍一下自己" placeholderTextColor="#727181" style={[styles.input, styles.bioInput]} /><Text style={styles.counter}>{bio.length}/500</Text>
            <Pressable onPress={() => void handleSave()} disabled={isSaving || !settings.data} style={({ pressed }) => [styles.saveButton, (pressed || isSaving || !settings.data) && styles.pressed]}>{isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>保存资料</Text>}</Pressable>
          </View>}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, content: { flexGrow: 1, padding: 16, paddingBottom: 42 }, nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, back: { alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 22, backgroundColor: "#171722" }, navTitle: { color: "#F6F6FB", fontSize: 17, fontWeight: "800" }, navSpacer: { width: 44 }, lead: { marginTop: 18, color: "#A6A5B5", fontSize: 13, lineHeight: 19 }, form: { marginTop: 22, padding: 17, borderRadius: 19, backgroundColor: "#171722" }, loading: { alignItems: "center", justifyContent: "center", minHeight: 200 }, label: { marginTop: 10, marginBottom: 8, color: "#DAD9E5", fontSize: 13, fontWeight: "800" }, avatarPicker: { flexDirection: "row", alignItems: "center", minHeight: 84, borderRadius: 16, backgroundColor: "#292838", padding: 11 }, avatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: "#3B3A4A" }, avatarFallback: { alignItems: "center", justifyContent: "center", width: 62, height: 62, borderRadius: 31, backgroundColor: "#3B3A4A" }, avatarCopy: { flex: 1, marginLeft: 12 }, avatarTitle: { color: "#F6F6FB", fontSize: 14, fontWeight: "800" }, avatarHint: { marginTop: 4, color: "#A6A5B5", fontSize: 11, lineHeight: 16 }, avatarAction: { alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 11, backgroundColor: "#4C83FF33" }, input: { minHeight: 52, borderRadius: 14, backgroundColor: "#292838", color: "#F6F6FB", paddingHorizontal: 14, fontSize: 15 }, bioInput: { minHeight: 112, paddingTop: 13 }, counter: { alignSelf: "flex-end", marginTop: 6, color: "#777686", fontSize: 11 }, saveButton: { alignItems: "center", justifyContent: "center", minHeight: 51, marginTop: 20, borderRadius: 15, backgroundColor: "#4C83FF" }, saveText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" }, pressed: { opacity: 0.74, transform: [{ scale: 0.98 }] }, emptyTitle: { marginTop: 13, color: "#F6F6FB", fontSize: 20, fontWeight: "800" }, emptyCopy: { marginTop: 6, color: "#A6A5B5", fontSize: 13, textAlign: "center", lineHeight: 19 },
});
