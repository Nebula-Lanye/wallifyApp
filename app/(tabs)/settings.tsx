import * as WebBrowser from "expo-web-browser";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { siteUrl } from "@/data/wallpapers";

const accountEntries = [
  {
    label: "登录 Wallify 账号",
    description: "使用邮箱或用户名登录你的现有账号",
    url: `${siteUrl}/pages/login.php`,
    icon: "person.crop.circle.fill" as const,
  },
  {
    label: "注册新账号",
    description: "在 Wallify 中创建并管理新账户",
    url: `${siteUrl}/pages/register.php`,
    icon: "person.badge.plus" as const,
  },
];

const websiteEntries = [
  {
    label: "访问 Wallify 网站",
    description: "浏览社区内容、上传作品和管理账户",
    url: siteUrl,
    icon: "safari.fill" as const,
  },
  {
    label: "关于 Wallify",
    description: "了解这个非官方粉丝社区",
    url: `${siteUrl}/pages/about.php`,
    icon: "info.circle.fill" as const,
  },
  {
    label: "隐私政策",
    description: "在原站查看服务与隐私说明",
    url: `${siteUrl}/pages/privacy.php`,
    icon: "lock.fill" as const,
  },
];

type SettingsEntry = (typeof accountEntries)[number] | (typeof websiteEntries)[number];

export default function SettingsScreen() {
  const openUrl = (url: string) => {
    void WebBrowser.openBrowserAsync(url, {
      toolbarColor: "#171722",
      controlsColor: "#7D9EFF",
      enableDefaultShareMenuItem: true,
      enableBarCollapsing: true,
    });
  };

  const renderEntry = (entry: SettingsEntry, index: number, total: number) => (
    <Pressable
      key={entry.label}
      onPress={() => openUrl(entry.url)}
      style={({ pressed }) => [styles.row, index !== total - 1 && styles.divided, pressed && styles.rowPressed]}
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
      <View style={styles.header}>
        <Text style={styles.title}>设置</Text>
        <Text style={styles.subtitle}>登录后可在 Wallify 网站中管理个人内容与社区互动。</Text>
      </View>

      <Text style={styles.groupLabel}>账户</Text>
      <View style={styles.group}>{accountEntries.map((entry, index) => renderEntry(entry, index, accountEntries.length))}</View>

      <View style={styles.note}>
        <IconSymbol name="lock.fill" size={16} color="#FFB86B" />
        <Text style={styles.noteText}>为保护账号安全，密码仅在 Wallify 官方网页中输入和处理；本应用不会读取或保存你的密码。</Text>
      </View>

      <Text style={styles.groupLabel}>网站与帮助</Text>
      <View style={styles.group}>{websiteEntries.map((entry, index) => renderEntry(entry, index, websiteEntries.length))}</View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 13, paddingBottom: 22 },
  title: { color: "#F6F6FB", fontSize: 29, lineHeight: 37, fontWeight: "800" },
  subtitle: { marginTop: 6, color: "#A6A5B5", fontSize: 13, lineHeight: 19 },
  groupLabel: { marginLeft: 16, marginBottom: 8, color: "#A6A5B5", fontSize: 12, lineHeight: 17, fontWeight: "800" },
  group: { marginHorizontal: 16, marginBottom: 18, overflow: "hidden", borderRadius: 18, backgroundColor: "#171722" },
  row: { flexDirection: "row", alignItems: "center", minHeight: 78, paddingHorizontal: 14 },
  divided: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#292838" },
  rowPressed: { opacity: 0.62 },
  iconBox: { alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 13, backgroundColor: "#A777FF1F" },
  rowContent: { flex: 1, marginLeft: 12, marginRight: 8 },
  rowTitle: { color: "#F6F6FB", fontSize: 15, lineHeight: 20, fontWeight: "700" },
  rowDescription: { marginTop: 3, color: "#A6A5B5", fontSize: 12, lineHeight: 17 },
  note: { flexDirection: "row", alignItems: "flex-start", gap: 9, marginHorizontal: 16, marginBottom: 22, borderRadius: 15, backgroundColor: "#171722", padding: 14 },
  noteText: { flex: 1, color: "#A6A5B5", fontSize: 12, lineHeight: 18 },
});

