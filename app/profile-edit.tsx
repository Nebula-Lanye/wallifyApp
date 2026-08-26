import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { type LinkedWallifyProfile, useWallifyProfile } from "@/hooks/use-wallify-profile";
import { useWallifySession } from "@/hooks/use-wallify-session";
import { trpc } from "@/lib/trpc";

const EMPTY_SESSION_ID = "00000000-0000-0000-0000-000000000000";

export default function ProfileEditScreen() {
  const { session, isLoading: isSessionLoading, saveSession } = useWallifySession();
  const { saveProfile } = useWallifyProfile();
  const settings = trpc.wallify.accountSettings.useQuery({ sessionId: session?.sessionId ?? EMPTY_SESSION_ID }, { enabled: Boolean(session) });
  const updateProfile = trpc.wallify.updateProfile.useMutation();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (!settings.data) return;
    setUsername(settings.data.username);
    setEmail(settings.data.email);
    setBio(settings.data.bio);
  }, [settings.data]);

  const handleSave = async () => {
    if (!session) return;
    try {
      const nextProfile = await updateProfile.mutateAsync({ sessionId: session.sessionId, username, email, bio });
      await saveSession({ sessionId: session.sessionId, profile: nextProfile as LinkedWallifyProfile });
      await saveProfile(nextProfile as LinkedWallifyProfile);
      Alert.alert("已保存", "你的 Wallify 个人资料已更新。", [{ text: "完成", onPress: () => router.back() }]);
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
          <Text style={styles.lead}>资料会直接同步到你的 Wallify 账户和公开主页。</Text>
          {settings.isLoading || isSessionLoading ? <View style={styles.loading}><ActivityIndicator color="#7D9EFF" /></View> : <View style={styles.form}><Text style={styles.label}>用户名</Text><TextInput value={username} onChangeText={setUsername} autoCapitalize="none" maxLength={40} placeholder="用户名" placeholderTextColor="#727181" style={styles.input} returnKeyType="next" /><Text style={styles.label}>邮箱</Text><TextInput value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" maxLength={320} placeholder="邮箱" placeholderTextColor="#727181" style={styles.input} returnKeyType="next" /><Text style={styles.label}>个人简介</Text><TextInput value={bio} onChangeText={setBio} maxLength={500} multiline textAlignVertical="top" placeholder="介绍一下自己" placeholderTextColor="#727181" style={[styles.input, styles.bioInput]} /><Text style={styles.counter}>{bio.length}/500</Text><Pressable onPress={() => void handleSave()} disabled={updateProfile.isPending || !settings.data} style={({ pressed }) => [styles.saveButton, (pressed || updateProfile.isPending || !settings.data) && styles.pressed]}>{updateProfile.isPending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>保存资料</Text>}</Pressable></View>}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, content: { flexGrow: 1, padding: 16, paddingBottom: 42 }, nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, back: { alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 22, backgroundColor: "#171722" }, navTitle: { color: "#F6F6FB", fontSize: 17, fontWeight: "800" }, navSpacer: { width: 44 }, lead: { marginTop: 18, color: "#A6A5B5", fontSize: 13, lineHeight: 19 }, form: { marginTop: 22, padding: 17, borderRadius: 19, backgroundColor: "#171722" }, loading: { alignItems: "center", justifyContent: "center", minHeight: 200 }, label: { marginTop: 10, marginBottom: 8, color: "#DAD9E5", fontSize: 13, fontWeight: "800" }, input: { minHeight: 52, borderRadius: 14, backgroundColor: "#292838", color: "#F6F6FB", paddingHorizontal: 14, fontSize: 15 }, bioInput: { minHeight: 112, paddingTop: 13 }, counter: { alignSelf: "flex-end", marginTop: 6, color: "#777686", fontSize: 11 }, saveButton: { alignItems: "center", justifyContent: "center", minHeight: 51, marginTop: 20, borderRadius: 15, backgroundColor: "#4C83FF" }, saveText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" }, pressed: { opacity: 0.74, transform: [{ scale: 0.98 }] }, emptyTitle: { marginTop: 13, color: "#F6F6FB", fontSize: 20, fontWeight: "800" }, emptyCopy: { marginTop: 6, color: "#A6A5B5", fontSize: 13, textAlign: "center", lineHeight: 19 },
});
