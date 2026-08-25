import * as WebBrowser from "expo-web-browser";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { siteUrl } from "@/data/wallpapers";

const entries = [
  { label: "访问 Wallify 网站", description: "登录、上传和查看更多社区内容", url: siteUrl, icon: "safari.fill" as const },
  { label: "关于 Wallify", description: "了解这个非官方粉丝社区", url: `${siteUrl}/pages/about.php`, icon: "info.circle.fill" as const },
  { label: "隐私政策", description: "在原站查看服务与隐私说明", url: `${siteUrl}/pages/privacy.php`, icon: "lock.fill" as const },
];

export default function SettingsScreen() {
  const openUrl = (url: string) => {
    void WebBrowser.openBrowserAsync(url, {
      toolbarColor: "#171722",
      controlsColor: "#7D9EFF",
      enableDefaultShareMenuItem: true,
    });
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>设置</Text>
        <Text style={styles.subtitle}>本应用帮助你更便捷地浏览 Wallify 的公开内容。</Text>
      </View>
      <View style={styles.group}>
        {entries.map((entry, index) => (
          <Pressable
            key={entry.label}
            onPress={() => openUrl(entry.url)}
            style={({ pressed }) => [styles.row, index !== entries.length - 1 && styles.divided, pressed && styles.rowPressed]}
          >
            <View style={styles.iconBox}><IconSymbol name={entry.icon} size={20} color="#A777FF" /></View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>{entry.label}</Text>
              <Text style={styles.rowDescription}>{entry.description}</Text>
            </View>
            <IconSymbol name="chevron.right" size={17} color="#777686" />
          </Pressable>
        ))}
      </View>
      <View style={styles.note}>
        <IconSymbol name="heart.fill" size={16} color="#FF8ECB" />
        <Text style={styles.noteText}>收藏仅存储在当前设备中；账户与上传内容请在 Wallify 网站中管理。</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 13, paddingBottom: 22 },
  title: { color: "#F6F6FB", fontSize: 29, lineHeight: 37, fontWeight: "800" },
  subtitle: { marginTop: 6, color: "#A6A5B5", fontSize: 13, lineHeight: 19 },
  group: { marginHorizontal: 16, overflow: "hidden", borderRadius: 18, backgroundColor: "#171722" },
  row: { flexDirection: "row", alignItems: "center", minHeight: 78, paddingHorizontal: 14 },
  divided: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#292838" },
  rowPressed: { opacity: 0.62 },
  iconBox: { alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 13, backgroundColor: "#A777FF1F" },
  rowContent: { flex: 1, marginLeft: 12, marginRight: 8 },
  rowTitle: { color: "#F6F6FB", fontSize: 15, lineHeight: 20, fontWeight: "700" },
  rowDescription: { marginTop: 3, color: "#A6A5B5", fontSize: 12, lineHeight: 17 },
  note: { flexDirection: "row", alignItems: "flex-start", gap: 9, margin: 16, borderRadius: 15, backgroundColor: "#171722", padding: 14 },
  noteText: { flex: 1, color: "#A6A5B5", fontSize: 12, lineHeight: 18 },
});

