import { Image } from "expo-image";
import { router } from "expo-router";
import * as Application from "expo-application";
import Constants from "expo-constants";
import { useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { wallifyImageUrl } from "@/data/wallify-image";
import { useWallifyProfile, type LinkedWallifyProfile } from "@/hooks/use-wallify-profile";
import { useWallifySession } from "@/hooks/use-wallify-session";
import { trpc } from "@/lib/trpc";

function extractProfileId(value: string) {
  const normalized = value.trim();
  const profileUrlMatch = normalized.match(/[?&]id=(\d+)/i);
  const directIdMatch = normalized.match(/^\d+$/);
  return Number(profileUrlMatch?.[1] ?? directIdMatch?.[0] ?? 0);
}

function avatarProxy(url: string) {
  try {
    return wallifyImageUrl(new URL(url).pathname);
  } catch {
    return url;
  }
}

export default function SettingsScreen() {
  const [isLinkSheetVisible, setIsLinkSheetVisible] = useState(false);
  const [profileIdInput, setProfileIdInput] = useState("");
  const { profile, isLoading, saveProfile, clearProfile } = useWallifyProfile();
  const { session, isLoading: isSessionLoading, saveSession, clearSession } = useWallifySession();
  const resolveProfile = trpc.wallifyProfile.resolve.useMutation();
  const refreshSessionProfile = trpc.wallify.sessionProfile.useQuery({ sessionId: session?.sessionId ?? "00000000-0000-0000-0000-000000000000" }, { enabled: false });
  const logout = trpc.wallify.logout.useMutation();

  const handleLinkProfile = async () => {
    const profileId = extractProfileId(profileIdInput);
    if (!Number.isSafeInteger(profileId) || profileId <= 0) {
      Alert.alert("请输入有效的用户 ID", "公开资料关联只需要用户 ID，不需要密码。");
      return;
    }
    try {
      const resolved = await resolveProfile.mutateAsync({ profileId });
      await saveProfile(resolved as LinkedWallifyProfile);
      setIsLinkSheetVisible(false);
      setProfileIdInput("");
    } catch (error) {
      Alert.alert("关联失败", error instanceof Error ? error.message : "暂时无法读取该公开资料，请稍后再试。");
    }
  };

  const handleRefresh = async () => {
    try {
      if (session) {
        const refreshed = await refreshSessionProfile.refetch();
        if (refreshed.data) {
          const nextProfile = refreshed.data as LinkedWallifyProfile;
          await saveSession({ sessionId: session.sessionId, profile: nextProfile });
          await saveProfile(nextProfile);
          return;
        }
      }
      if (profile) {
        const resolved = await resolveProfile.mutateAsync({ profileId: profile.profileId });
        await saveProfile(resolved as LinkedWallifyProfile);
      }
    } catch (error) {
      Alert.alert("刷新失败", error instanceof Error ? error.message : "请稍后再试。");
    }
  };

  const handleSignOut = () => {
    Alert.alert("退出登录", "这只会清除本应用内的 Wallify 会话；公开资料关联会保留。", [
      { text: "取消", style: "cancel" },
      { text: "退出", style: "destructive", onPress: () => { if (session) void logout.mutateAsync({ sessionId: session.sessionId }).catch(() => undefined); void clearSession(); } },
    ]);
  };

  const handleUnlink = () => Alert.alert("解除公开资料", "这会移除当前设备显示的头像与昵称，不影响 Wallify 网站账户。", [
    { text: "取消", style: "cancel" },
    { text: "解除关联", style: "destructive", onPress: () => void clearProfile() },
  ]);

  const displayedProfile = session?.profile ?? profile;
  const loading = isLoading || isSessionLoading;
  const installedVersion = Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? "1.0.0";
  const installedBuild = Application.nativeBuildVersion;
  const checkForUpdates = () => Alert.alert("检查更新", `当前安装包版本为 v${installedVersion}${installedBuild ? `（构建 ${installedBuild}）` : ""}。如有新版安装包，可下载安装后完成更新。`);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><Text style={styles.title}>设置</Text><Text style={styles.subtitle}>账户、资料和壁纸管理均在应用内完成。</Text></View>
        <Text style={styles.groupLabel}>账户</Text>
        {loading ? <View style={styles.loading}><ActivityIndicator color="#7D9EFF" /></View> : displayedProfile ? (
          <ProfileCard profile={displayedProfile} isNativeSignedIn={Boolean(session)} isRefreshing={resolveProfile.isPending || refreshSessionProfile.isFetching} onRefresh={() => void handleRefresh()} onEdit={() => router.push("/profile-edit" as never)} onUpload={() => session ? router.push("/upload-wallpaper" as never) : router.push("/login" as never)} onSignOut={handleSignOut} onUnlink={handleUnlink} />
        ) : <GuestCard onLogin={() => router.push("/login" as never)} onLink={() => setIsLinkSheetVisible(true)} />}
        {!displayedProfile ? null : <View style={styles.note}><IconSymbol name="lock.fill" size={16} color="#FFB86B" /><Text style={styles.noteText}>公开资料关联只读取用户 ID 对应的公开信息，不需要填写密码。登录仅用于上传和账户权限操作。</Text></View>}
        <Text style={styles.groupLabel}>帮助与协议</Text>
        <Pressable onPress={() => router.push("/terms" as never)} style={({ pressed }) => [styles.agreementEntry, pressed && styles.pressed]}><View style={styles.infoIcon}><IconSymbol name="doc.text" size={19} color="#A777FF" /></View><View style={styles.infoCopy}><Text style={styles.infoTitle}>用户协议</Text><Text style={styles.infoText}>查看 Wallify 官网当前使用条款</Text></View><IconSymbol name="chevron.right" size={18} color="#777686" /></Pressable>
        <Text style={styles.groupLabel}>版本与更新</Text>
        <Pressable onPress={checkForUpdates} style={({ pressed }) => [styles.agreementEntry, pressed && styles.pressed]}><View style={styles.infoIcon}><IconSymbol name="arrow.clockwise" size={19} color="#A777FF" /></View><View style={styles.infoCopy}><Text style={styles.infoTitle}>检查更新</Text><Text style={styles.infoText}>当前版本 v{installedVersion}{installedBuild ? ` · 构建 ${installedBuild}` : ""}</Text></View><IconSymbol name="chevron.right" size={18} color="#777686" /></Pressable>
      </ScrollView>
      <Modal animationType="slide" transparent visible={isLinkSheetVisible} onRequestClose={() => setIsLinkSheetVisible(false)}><View style={styles.sheetBackdrop}><View style={styles.sheet}><View style={styles.sheetHandle} /><Text style={styles.sheetTitle}>关联公开资料</Text><Text style={styles.sheetDescription}>填写 Wallify 用户 ID 即可显示公开头像、昵称、签名和统计信息，无需密码。</Text><TextInput value={profileIdInput} onChangeText={setProfileIdInput} keyboardType="number-pad" placeholder="Wallify 用户 ID" placeholderTextColor="#727181" style={styles.input} returnKeyType="done" onSubmitEditing={() => void handleLinkProfile()} /><Pressable onPress={() => void handleLinkProfile()} disabled={resolveProfile.isPending} style={({ pressed }) => [styles.primaryButton, (pressed || resolveProfile.isPending) && styles.pressed]}>{resolveProfile.isPending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>查询并关联</Text>}</Pressable><Pressable onPress={() => setIsLinkSheetVisible(false)} style={styles.cancelButton}><Text style={styles.cancelText}>暂不关联</Text></Pressable></View></View></Modal>
    </ScreenContainer>
  );
}

function GuestCard({ onLogin, onLink }: { onLogin: () => void; onLink: () => void }) { return <View style={styles.accountCard}><View style={styles.accountIcon}><IconSymbol name="person.crop.circle.fill" size={34} color="#A777FF" /></View><Text style={styles.accountTitle}>登录或关联你的资料</Text><Text style={styles.accountDescription}>登录后可上传壁纸；只想展示公开资料时，填写用户 ID 即可。</Text><Pressable onPress={onLogin} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryText}>登录</Text></Pressable><Pressable onPress={onLink} style={styles.secondaryButton}><Text style={styles.secondaryText}>仅关联公开资料</Text></Pressable></View>; }
function ProfileCard({ profile, isNativeSignedIn, isRefreshing, onRefresh, onEdit, onUpload, onSignOut, onUnlink }: { profile: LinkedWallifyProfile; isNativeSignedIn: boolean; isRefreshing: boolean; onRefresh: () => void; onEdit: () => void; onUpload: () => void; onSignOut: () => void; onUnlink: () => void }) { return <View style={styles.accountCard}><View style={styles.profileTop}><Image source={{ uri: avatarProxy(profile.avatarUrl) }} style={styles.avatar} contentFit="cover" /><View style={styles.profileCopy}><View style={styles.statusLine}><View style={[styles.statusDot, !isNativeSignedIn && styles.publicDot]} /><Text style={styles.statusText}>{isNativeSignedIn ? "已登录" : "已关联公开资料"}</Text></View><Text style={styles.nickname}>{profile.nickname}</Text><Text style={styles.profileMeta}>Wallify 用户 ID · {profile.profileId}</Text></View></View><View style={styles.profileStats}><Stat value={profile.uploadCount} label="公开上传" /><Stat value={profile.followingCount} label="关注" /></View><View style={styles.signature}><IconSymbol name="quote.opening" size={15} color="#A777FF" /><Text style={styles.signatureText}>{profile.signature ?? "暂未填写公开个人签名"}</Text></View>{isNativeSignedIn ? <Pressable onPress={onEdit} style={({ pressed }) => [styles.editCardButton, pressed && styles.pressed]}><Text style={styles.editCardButtonText}>编辑个人资料</Text><IconSymbol name="chevron.right" size={18} color="#BFCFFF" /></Pressable> : null}<Pressable onPress={onUpload} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><IconSymbol name="square.and.arrow.up" size={18} color="#FFFFFF" /><Text style={styles.primaryText}>{isNativeSignedIn ? "上传壁纸" : "登录后上传壁纸"}</Text></Pressable><View style={styles.actions}><Pressable onPress={onRefresh} disabled={isRefreshing} style={styles.secondaryButton}>{isRefreshing ? <ActivityIndicator color="#DAD9E5" /> : <Text style={styles.secondaryText}>刷新资料</Text>}</Pressable><Pressable onPress={isNativeSignedIn ? onSignOut : onUnlink} style={styles.textButton}><Text style={styles.textButtonLabel}>{isNativeSignedIn ? "退出登录" : "解除关联"}</Text></Pressable></View></View>; }
function Stat({ value, label }: { value: number | null; label: string }) { return <View style={styles.stat}><Text style={styles.statValue}>{value ?? "—"}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
const styles = StyleSheet.create({ content: { paddingBottom: 34 }, header: { paddingHorizontal: 16, paddingTop: 13, paddingBottom: 22 }, title: { color: "#F6F6FB", fontSize: 29, lineHeight: 37, fontWeight: "800" }, subtitle: { marginTop: 6, color: "#A6A5B5", fontSize: 13, lineHeight: 19 }, groupLabel: { marginLeft: 16, marginTop: 4, marginBottom: 8, color: "#A6A5B5", fontSize: 12, fontWeight: "800" }, loading: { height: 160, alignItems: "center", justifyContent: "center", marginHorizontal: 16, borderRadius: 18, backgroundColor: "#171722" }, accountCard: { marginHorizontal: 16, marginBottom: 18, borderRadius: 18, backgroundColor: "#171722", padding: 16 }, accountIcon: { alignItems: "center", justifyContent: "center", width: 62, height: 62, marginBottom: 14, borderRadius: 31, backgroundColor: "#A777FF1F" }, accountTitle: { color: "#F6F6FB", fontSize: 17, fontWeight: "800" }, accountDescription: { marginTop: 5, color: "#A6A5B5", fontSize: 12, lineHeight: 18 }, primaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 47, marginTop: 16, borderRadius: 14, backgroundColor: "#4C83FF", paddingHorizontal: 16 }, primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" }, secondaryButton: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 42, marginTop: 10, borderRadius: 13, backgroundColor: "#292838", paddingHorizontal: 12 }, secondaryText: { color: "#DAD9E5", fontSize: 13, fontWeight: "800" }, pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] }, profileTop: { flexDirection: "row", alignItems: "center" }, avatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: "#292838" }, profileCopy: { flex: 1, marginLeft: 13 }, statusLine: { flexDirection: "row", alignItems: "center", gap: 5 }, statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#68D391" }, publicDot: { backgroundColor: "#A777FF" }, statusText: { color: "#A6A5B5", fontSize: 11, fontWeight: "800" }, nickname: { marginTop: 4, color: "#F6F6FB", fontSize: 18, fontWeight: "800" }, profileMeta: { marginTop: 2, color: "#A6A5B5", fontSize: 12 }, profileStats: { flexDirection: "row", marginTop: 17, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#292838" }, stat: { flex: 1, alignItems: "center" }, statValue: { color: "#F6F6FB", fontSize: 17, fontWeight: "800" }, statLabel: { marginTop: 3, color: "#A6A5B5", fontSize: 11 }, signature: { flexDirection: "row", gap: 7, marginTop: 13 }, signatureText: { flex: 1, color: "#C9C8D5", fontSize: 12, lineHeight: 18 }, editCardButton: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44, marginTop: 14, paddingHorizontal: 13, borderRadius: 13, backgroundColor: "#293B6B" }, editCardButtonText: { color: "#D6E1FF", fontSize: 13, fontWeight: "800" }, actions: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 10 }, textButton: { alignItems: "center", justifyContent: "center", minHeight: 42, paddingHorizontal: 10 }, textButtonLabel: { color: "#7D9EFF", fontSize: 13, fontWeight: "800" }, note: { flexDirection: "row", gap: 9, marginHorizontal: 16, marginBottom: 14, borderRadius: 15, backgroundColor: "#171722", padding: 14 }, noteText: { flex: 1, color: "#A6A5B5", fontSize: 12, lineHeight: 18 }, agreementEntry: { flexDirection: "row", alignItems: "center", minHeight: 82, marginHorizontal: 16, marginBottom: 20, borderRadius: 18, backgroundColor: "#171722", padding: 14 }, infoIcon: { alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 13, backgroundColor: "#A777FF1F" }, infoCopy: { flex: 1, marginLeft: 12 }, infoTitle: { color: "#F6F6FB", fontSize: 14, fontWeight: "800" }, infoText: { marginTop: 4, color: "#A6A5B5", fontSize: 12, lineHeight: 17 }, sheetBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.56)" }, sheet: { borderTopLeftRadius: 27, borderTopRightRadius: 27, backgroundColor: "#171722", paddingHorizontal: 20, paddingTop: 11, paddingBottom: 30 }, sheetHandle: { alignSelf: "center", width: 38, height: 4, marginBottom: 20, borderRadius: 2, backgroundColor: "#4A4959" }, sheetTitle: { color: "#F6F6FB", fontSize: 21, fontWeight: "800" }, sheetDescription: { marginTop: 7, color: "#A6A5B5", fontSize: 13, lineHeight: 19 }, input: { minHeight: 52, marginTop: 12, borderRadius: 14, backgroundColor: "#292838", color: "#F6F6FB", paddingHorizontal: 14, fontSize: 15 }, cancelButton: { alignItems: "center", justifyContent: "center", minHeight: 42, marginTop: 6 }, cancelText: { color: "#A6A5B5", fontSize: 14, fontWeight: "700" } });
