import * as WebBrowser from "expo-web-browser";
import { Image } from "expo-image";
import { useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { siteUrl } from "@/data/wallpapers";
import { useWallifyProfile, type LinkedWallifyProfile } from "@/hooks/use-wallify-profile";
import { trpc } from "@/lib/trpc";

const websiteEntries = [
  { label: "访问 Wallify 网站", description: "浏览社区内容、上传作品和管理账户", url: siteUrl, icon: "safari.fill" as const },
  { label: "关于 Wallify", description: "了解这个非官方粉丝社区", url: `${siteUrl}/pages/about.php`, icon: "info.circle.fill" as const },
  { label: "隐私政策", description: "在原站查看服务与隐私说明", url: `${siteUrl}/pages/privacy.php`, icon: "lock.fill" as const },
];

function extractProfileId(value: string) {
  const normalized = value.trim();
  const profileUrlMatch = normalized.match(/[?&]id=(\d+)/i);
  const directIdMatch = normalized.match(/^\d+$/);
  return Number(profileUrlMatch?.[1] ?? directIdMatch?.[0] ?? 0);
}

export default function SettingsScreen() {
  const [isLinkSheetVisible, setIsLinkSheetVisible] = useState(false);
  const [profileIdInput, setProfileIdInput] = useState("");
  const { profile, isLoading, saveProfile, clearProfile } = useWallifyProfile();
  const resolveProfile = trpc.wallifyProfile.resolve.useMutation();

  const openUrl = async (url: string) => {
    await WebBrowser.openBrowserAsync(url, {
      toolbarColor: "#171722",
      controlsColor: "#7D9EFF",
      enableDefaultShareMenuItem: true,
      enableBarCollapsing: true,
    });
  };

  const handleLinkProfile = async () => {
    const profileId = extractProfileId(profileIdInput);
    if (!Number.isSafeInteger(profileId) || profileId <= 0) {
      Alert.alert("请输入有效的用户 ID", "请在 Wallify 个人主页链接中查找 id= 后面的数字。");
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

  const handleRefreshProfile = async () => {
    if (!profile) return;

    try {
      const resolved = await resolveProfile.mutateAsync({ profileId: profile.profileId });
      await saveProfile(resolved as LinkedWallifyProfile);
    } catch (error) {
      Alert.alert("刷新失败", error instanceof Error ? error.message : "暂时无法更新公开资料，请稍后再试。");
    }
  };

  const unlinkProfile = () => {
    Alert.alert("解除本机关联", "这不会退出 Wallify 网站，只会移除当前设备中的头像和昵称展示。", [
      { text: "取消", style: "cancel" },
      { text: "解除关联", style: "destructive", onPress: () => void clearProfile() },
    ]);
  };

  const renderWebsiteEntry = (entry: (typeof websiteEntries)[number], index: number) => (
    <Pressable
      key={entry.label}
      onPress={() => void openUrl(entry.url)}
      style={({ pressed }) => [styles.row, index !== websiteEntries.length - 1 && styles.divided, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={entry.label}
    >
      <View style={styles.iconBox}><IconSymbol name={entry.icon} size={20} color="#A777FF" /></View>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{entry.label}</Text>
        <Text style={styles.rowDescription}>{entry.description}</Text>
      </View>
      <IconSymbol name="chevron.right" size={17} color="#777686" />
    </Pressable>
  );

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>设置</Text>
          <Text style={styles.subtitle}>在这里管理 Wallify 账户展示与网站服务。</Text>
        </View>

        <Text style={styles.groupLabel}>账户</Text>
        {isLoading ? (
          <View style={styles.accountLoading}><ActivityIndicator color="#7D9EFF" /></View>
        ) : profile ? (
          <LinkedAccountCard profile={profile} isRefreshing={resolveProfile.isPending} onOpen={() => void openUrl(profile.profileUrl)} onRefresh={() => void handleRefreshProfile()} onUpload={() => void openUrl(`${siteUrl}/pages/upload.php`)} onUnlink={unlinkProfile} />
        ) : (
          <UnlinkedAccountCard onLogin={() => void openUrl(`${siteUrl}/pages/login.php`)} onRegister={() => void openUrl(`${siteUrl}/pages/register.php`)} onLink={() => setIsLinkSheetVisible(true)} />
        )}

        <View style={styles.note}>
          <IconSymbol name="lock.fill" size={16} color="#FFB86B" />
          <Text style={styles.noteText}>账户密码只在 Wallify 官方网页中输入和处理。关联公开资料仅在本机保存头像、昵称和个人主页链接。</Text>
        </View>

        <Text style={styles.groupLabel}>网站与帮助</Text>
        <View style={styles.group}>{websiteEntries.map(renderWebsiteEntry)}</View>
      </ScrollView>

      <Modal animationType="slide" transparent visible={isLinkSheetVisible} onRequestClose={() => setIsLinkSheetVisible(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>关联公开资料</Text>
            <Text style={styles.sheetDescription}>先在官网登录，再打开你的个人主页；粘贴完整主页链接，或填写链接中“id=”后的数字。</Text>
            <View style={styles.inputBox}>
              <IconSymbol name="person.crop.circle.fill" size={20} color="#A6A5B5" />
              <TextInput
                value={profileIdInput}
                onChangeText={setProfileIdInput}
                keyboardType="number-pad"
                placeholder="Wallify 用户 ID"
                placeholderTextColor="#727181"
                style={styles.input}
                returnKeyType="done"
                onSubmitEditing={() => void handleLinkProfile()}
              />
            </View>
            <Pressable onPress={() => void handleLinkProfile()} disabled={resolveProfile.isPending} style={({ pressed }) => [styles.primaryButton, (pressed || resolveProfile.isPending) && styles.primaryPressed]}>
              {resolveProfile.isPending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>查询并关联</Text>}
            </Pressable>
            <Pressable onPress={() => setIsLinkSheetVisible(false)} style={({ pressed }) => [styles.cancelButton, pressed && styles.rowPressed]}>
              <Text style={styles.cancelText}>暂不关联</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function UnlinkedAccountCard({ onLogin, onRegister, onLink }: { onLogin: () => void; onRegister: () => void; onLink: () => void }) {
  return (
    <View style={styles.accountCard}>
      <View style={styles.accountIcon}><IconSymbol name="person.crop.circle.fill" size={33} color="#A777FF" /></View>
      <View style={styles.accountCopy}>
        <Text style={styles.accountTitle}>登录你的 Wallify 账号</Text>
        <Text style={styles.accountDescription}>登录后关联公开主页，即可在这里展示头像与昵称。</Text>
      </View>
      <Pressable onPress={onLogin} style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryPressed]}><Text style={styles.primaryText}>登录官网</Text></Pressable>
      <View style={styles.accountActions}>
        <Pressable onPress={onLink} style={({ pressed }) => [styles.secondaryButton, pressed && styles.rowPressed]}><Text style={styles.secondaryText}>关联公开资料</Text></Pressable>
        <Pressable onPress={onRegister} style={({ pressed }) => [styles.linkButton, pressed && styles.rowPressed]}><Text style={styles.linkText}>注册账号</Text></Pressable>
      </View>
    </View>
  );
}

function LinkedAccountCard({ profile, isRefreshing, onOpen, onRefresh, onUpload, onUnlink }: { profile: LinkedWallifyProfile; isRefreshing: boolean; onOpen: () => void; onRefresh: () => void; onUpload: () => void; onUnlink: () => void }) {
  return (
    <View style={styles.accountCard}>
      <Pressable onPress={onOpen} style={({ pressed }) => [styles.profileTop, pressed && styles.rowPressed]}>
        <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} contentFit="cover" transition={180} />
        <View style={styles.accountCopy}>
          <View style={styles.statusLine}><View style={styles.statusDot} /><Text style={styles.statusText}>已关联公开资料</Text></View>
          <Text style={styles.nickname} numberOfLines={1}>{profile.nickname}</Text>
          <Text style={styles.profileMeta}>Wallify 用户 ID · {profile.profileId}</Text>
        </View>
        <IconSymbol name="chevron.right" size={18} color="#A6A5B5" />
      </Pressable>
      <View style={styles.profileStats}>
        <ProfileStat value={profile.uploadCount} label="公开上传" />
        <ProfileStat value={profile.followingCount} label="关注" />
      </View>
      <View style={styles.signatureBox}>
        <IconSymbol name="quote.opening" size={15} color="#A777FF" />
        <Text style={styles.signatureText} numberOfLines={2}>{profile.signature ?? "暂未填写公开个人签名"}</Text>
      </View>
      <Pressable onPress={onUpload} style={({ pressed }) => [styles.uploadButton, pressed && styles.primaryPressed]}>
        <IconSymbol name="square.and.arrow.up" size={18} color="#FFFFFF" />
        <Text style={styles.primaryText}>上传壁纸</Text>
      </Pressable>
      <View style={styles.accountActions}>
        <Pressable onPress={onRefresh} disabled={isRefreshing} style={({ pressed }) => [styles.secondaryButton, (pressed || isRefreshing) && styles.rowPressed]}>{isRefreshing ? <ActivityIndicator size="small" color="#DAD9E5" /> : <Text style={styles.secondaryText}>刷新资料</Text>}</Pressable>
        <Pressable onPress={onUnlink} style={({ pressed }) => [styles.linkButton, pressed && styles.rowPressed]}><Text style={styles.linkText}>解除关联</Text></Pressable>
      </View>
    </View>
  );
}

function ProfileStat({ value, label }: { value: number | null; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value === null ? "—" : value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 30 },
  header: { paddingHorizontal: 16, paddingTop: 13, paddingBottom: 22 },
  title: { color: "#F6F6FB", fontSize: 29, lineHeight: 37, fontWeight: "800" },
  subtitle: { marginTop: 6, color: "#A6A5B5", fontSize: 13, lineHeight: 19 },
  groupLabel: { marginLeft: 16, marginBottom: 8, color: "#A6A5B5", fontSize: 12, lineHeight: 17, fontWeight: "800" },
  group: { marginHorizontal: 16, marginBottom: 18, overflow: "hidden", borderRadius: 18, backgroundColor: "#171722" },
  accountLoading: { alignItems: "center", justifyContent: "center", height: 160, marginHorizontal: 16, marginBottom: 18, borderRadius: 18, backgroundColor: "#171722" },
  accountCard: { marginHorizontal: 16, marginBottom: 18, borderRadius: 18, backgroundColor: "#171722", padding: 16 },
  accountIcon: { alignItems: "center", justifyContent: "center", width: 62, height: 62, marginBottom: 14, borderRadius: 31, backgroundColor: "#A777FF1F" },
  profileTop: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: "#292838" },
  accountCopy: { flex: 1, marginLeft: 13, marginRight: 8 },
  accountTitle: { color: "#F6F6FB", fontSize: 17, lineHeight: 23, fontWeight: "800" },
  accountDescription: { marginTop: 5, color: "#A6A5B5", fontSize: 12, lineHeight: 18 },
  statusLine: { flexDirection: "row", alignItems: "center", gap: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#68D391" },
  statusText: { color: "#68D391", fontSize: 11, lineHeight: 15, fontWeight: "800" },
  nickname: { marginTop: 4, color: "#F6F6FB", fontSize: 18, lineHeight: 24, fontWeight: "800" },
  profileMeta: { marginTop: 2, color: "#A6A5B5", fontSize: 12, lineHeight: 17 },
  accountActions: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 15 },
  profileStats: { flexDirection: "row", marginTop: 17, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#292838", paddingVertical: 12 },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { color: "#F6F6FB", fontSize: 17, lineHeight: 22, fontWeight: "800" },
  statLabel: { marginTop: 3, color: "#A6A5B5", fontSize: 11, lineHeight: 15 },
  signatureBox: { flexDirection: "row", alignItems: "flex-start", gap: 7, marginTop: 13, paddingHorizontal: 2 },
  signatureText: { flex: 1, color: "#C9C8D5", fontSize: 12, lineHeight: 18 },
  uploadButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 45, marginTop: 14, borderRadius: 13, backgroundColor: "#4C83FF" },
  primaryButton: { alignItems: "center", justifyContent: "center", minHeight: 47, marginTop: 16, borderRadius: 14, backgroundColor: "#4C83FF", paddingHorizontal: 16 },
  primaryPressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  secondaryButton: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 42, borderRadius: 13, backgroundColor: "#292838", paddingHorizontal: 12 },
  secondaryText: { color: "#DAD9E5", fontSize: 13, fontWeight: "800" },
  linkButton: { alignItems: "center", justifyContent: "center", minHeight: 42, paddingHorizontal: 10 },
  linkText: { color: "#7D9EFF", fontSize: 13, fontWeight: "800" },
  note: { flexDirection: "row", alignItems: "flex-start", gap: 9, marginHorizontal: 16, marginBottom: 22, borderRadius: 15, backgroundColor: "#171722", padding: 14 },
  noteText: { flex: 1, color: "#A6A5B5", fontSize: 12, lineHeight: 18 },
  row: { flexDirection: "row", alignItems: "center", minHeight: 78, paddingHorizontal: 14 },
  divided: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#292838" },
  rowPressed: { opacity: 0.62 },
  iconBox: { alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 13, backgroundColor: "#A777FF1F" },
  rowContent: { flex: 1, marginLeft: 12, marginRight: 8 },
  rowTitle: { color: "#F6F6FB", fontSize: 15, lineHeight: 20, fontWeight: "700" },
  rowDescription: { marginTop: 3, color: "#A6A5B5", fontSize: 12, lineHeight: 17 },
  sheetBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0, 0, 0, 0.56)" },
  sheet: { borderTopLeftRadius: 27, borderTopRightRadius: 27, backgroundColor: "#171722", paddingHorizontal: 20, paddingTop: 11, paddingBottom: 30 },
  sheetHandle: { alignSelf: "center", width: 38, height: 4, marginBottom: 20, borderRadius: 2, backgroundColor: "#4A4959" },
  sheetTitle: { color: "#F6F6FB", fontSize: 21, lineHeight: 28, fontWeight: "800" },
  sheetDescription: { marginTop: 7, color: "#A6A5B5", fontSize: 13, lineHeight: 19 },
  inputBox: { flexDirection: "row", alignItems: "center", minHeight: 52, marginTop: 18, borderRadius: 14, backgroundColor: "#292838", paddingHorizontal: 14 },
  input: { flex: 1, marginLeft: 10, color: "#F6F6FB", fontSize: 15, lineHeight: 21, paddingVertical: 12 },
  cancelButton: { alignItems: "center", minHeight: 42, justifyContent: "center", marginTop: 6 },
  cancelText: { color: "#A6A5B5", fontSize: 14, fontWeight: "700" },
});
