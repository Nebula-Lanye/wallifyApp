import { Pressable, StyleSheet, Text, View } from "react-native";

import { getWallifyServiceIssue } from "@/lib/wallify-service-error";
import { IconSymbol } from "./ui/icon-symbol";

export function WallifyServiceErrorState({ error, onRetry, compact = false }: { error: unknown; onRetry?: () => void; compact?: boolean }) {
  const issue = getWallifyServiceIssue(error) ?? {
    title: "Wallify 内容暂时无法加载",
    description: "请检查网络，或在官网服务恢复后重试。",
  };

  return (
    <View style={[styles.container, compact && styles.compact]} accessibilityRole="alert">
      <View style={styles.iconWrap}><IconSymbol name="info.circle.fill" size={21} color="#FFB86B" /></View>
      <View style={styles.copy}>
        <Text style={styles.title}>{issue.title}</Text>
        <Text style={styles.description}>{issue.description}</Text>
        {onRetry ? <Pressable onPress={onRetry} style={({ pressed }) => [styles.retry, pressed && styles.pressed]} accessibilityLabel="重新连接 Wallify"><IconSymbol name="arrow.clockwise" size={16} color="#FFE0B8" /><Text style={styles.retryText}>重新连接</Text></Pressable> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "flex-start", gap: 11, marginTop: 16, borderWidth: 1, borderColor: "#FFB86B45", borderRadius: 16, backgroundColor: "#3D2D1E", padding: 14 },
  compact: { marginHorizontal: 16, marginBottom: 12 },
  iconWrap: { alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 14, backgroundColor: "#FFB86B1F" },
  copy: { flex: 1 },
  title: { color: "#FFE7C6", fontSize: 14, lineHeight: 19, fontWeight: "800" },
  description: { marginTop: 4, color: "#E5C9A4", fontSize: 12, lineHeight: 18 },
  retry: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, minHeight: 33, marginTop: 9, borderRadius: 10, backgroundColor: "#FFB86B22", paddingHorizontal: 10 },
  retryText: { color: "#FFE0B8", fontSize: 12, fontWeight: "800" },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
});
