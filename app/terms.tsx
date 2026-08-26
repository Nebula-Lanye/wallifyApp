import { Stack, router } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";

export default function TermsScreen() {
  const terms = trpc.wallify.terms.useQuery();
  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.nav}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]} accessibilityLabel="返回"><IconSymbol name="chevron.left" size={23} color="#FFFFFF" /></Pressable><Text style={styles.navTitle}>用户协议</Text><View style={styles.navSpacer} /></View>
        <Text style={styles.lead}>内容同步自 Wallify 官网使用条款。</Text>
        {terms.isLoading ? <View style={styles.loading}><ActivityIndicator color="#7D9EFF" /></View> : terms.data ? <View style={styles.document}>{terms.data.sections.map((section) => <View key={section.title} style={styles.section}><Text style={styles.sectionTitle}>{section.title}</Text>{section.paragraphs.map((paragraph, index) => <Text key={`${section.title}-p-${index}`} style={styles.paragraph}>{paragraph}</Text>)}{section.bullets.map((bullet, index) => <View key={`${section.title}-b-${index}`} style={styles.bulletLine}><Text style={styles.bullet}>•</Text><Text style={styles.bulletText}>{bullet}</Text></View>)}</View>)}</View> : <View style={styles.error}><Text style={styles.errorTitle}>暂时无法读取用户协议</Text><Pressable onPress={() => void terms.refetch()} style={({ pressed }) => [styles.retry, pressed && styles.pressed]}><Text style={styles.retryText}>重新加载</Text></Pressable></View>}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 42 }, nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, back: { alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 22, backgroundColor: "#171722" }, navTitle: { color: "#F6F6FB", fontSize: 17, fontWeight: "800" }, navSpacer: { width: 44 }, lead: { marginTop: 18, color: "#A6A5B5", fontSize: 13, lineHeight: 19 }, loading: { alignItems: "center", justifyContent: "center", minHeight: 260 }, document: { marginTop: 20, overflow: "hidden", borderRadius: 19, backgroundColor: "#171722" }, section: { padding: 17, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#292838" }, sectionTitle: { color: "#F6F6FB", fontSize: 17, fontWeight: "800" }, paragraph: { marginTop: 11, color: "#C9C8D5", fontSize: 13, lineHeight: 20 }, bulletLine: { flexDirection: "row", marginTop: 9 }, bullet: { width: 18, color: "#7D9EFF", fontSize: 16, lineHeight: 20 }, bulletText: { flex: 1, color: "#C9C8D5", fontSize: 13, lineHeight: 20 }, error: { alignItems: "center", marginTop: 60 }, errorTitle: { color: "#C9C8D5", fontSize: 14 }, retry: { alignItems: "center", justifyContent: "center", minHeight: 44, marginTop: 16, paddingHorizontal: 18, borderRadius: 13, backgroundColor: "#292838" }, retryText: { color: "#FFFFFF", fontWeight: "800" }, pressed: { opacity: 0.74, transform: [{ scale: 0.98 }] },
});
