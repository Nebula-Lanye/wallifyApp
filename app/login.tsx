import { Stack, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { type LinkedWallifyProfile, useWallifyProfile } from "@/hooks/use-wallify-profile";
import { useWallifySession } from "@/hooks/use-wallify-session";
import { trpc } from "@/lib/trpc";

export default function LoginScreen() {
  const { redirectTo } = useLocalSearchParams<{ redirectTo?: string }>();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const { saveProfile } = useWallifyProfile();
  const { saveSession } = useWallifySession();
  const login = trpc.wallify.login.useMutation();
  const destination = redirectTo === "/upload" ? "/upload" : "/settings";

  const handleLogin = async () => {
    if (!account.trim() || !password) {
      Alert.alert("请填写账号与密码", "账号密码只用于本次加密登录请求，不会保存在设备中。");
      return;
    }
    try {
      const result = await login.mutateAsync({ account: account.trim(), password });
      const profile = result.profile as LinkedWallifyProfile;
      await saveSession({ sessionId: result.sessionId, profile });
      await saveProfile(profile);
      setPassword("");
      router.replace(destination as never);
    } catch (error) {
      Alert.alert("登录失败", error instanceof Error ? error.message : "请稍后再试。 ");
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.nav}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]} accessibilityLabel="返回"><IconSymbol name="chevron.left" size={23} color="#FFFFFF" /></Pressable></View>
          <View style={styles.hero}><View style={styles.heroIcon}><IconSymbol name="lock.fill" size={28} color="#FF8D58" /></View><Text style={styles.title}>登录 Wallify</Text><Text style={styles.subtitle}>登录后即可上传壁纸和使用账户权限。密码仅用于本次安全请求，不会保存在设备中。</Text></View>
          <View style={styles.form}><Text style={styles.label}>账号</Text><TextInput value={account} onChangeText={setAccount} autoCapitalize="none" autoCorrect={false} autoComplete="username" keyboardType="email-address" placeholder="邮箱或用户名" placeholderTextColor="#727181" style={styles.input} returnKeyType="next" /><Text style={styles.label}>密码</Text><TextInput value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" placeholder="密码" placeholderTextColor="#727181" style={styles.input} returnKeyType="done" onSubmitEditing={() => void handleLogin()} /><Pressable onPress={() => void handleLogin()} disabled={login.isPending} style={({ pressed }) => [styles.loginButton, (pressed || login.isPending) && styles.pressed]}>{login.isPending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.loginText}>登录</Text>}</Pressable></View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, content: { flexGrow: 1, padding: 20, paddingBottom: 44 }, nav: { minHeight: 44 }, back: { alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 22, backgroundColor: "#171722" }, hero: { marginTop: 36 }, heroIcon: { alignItems: "center", justifyContent: "center", width: 60, height: 60, borderRadius: 20, backgroundColor: "#FF6B2C1F" }, title: { marginTop: 18, color: "#F6F6FB", fontSize: 31, fontWeight: "800" }, subtitle: { marginTop: 9, color: "#A6A5B5", fontSize: 14, lineHeight: 21 }, form: { marginTop: 34, padding: 18, borderRadius: 20, backgroundColor: "#171722" }, label: { marginTop: 10, marginBottom: 8, color: "#DAD9E5", fontSize: 13, fontWeight: "800" }, input: { minHeight: 54, borderRadius: 14, backgroundColor: "#292838", color: "#F6F6FB", paddingHorizontal: 15, fontSize: 16 }, loginButton: { alignItems: "center", justifyContent: "center", minHeight: 52, marginTop: 26, borderRadius: 15, backgroundColor: "#4C83FF" }, loginText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" }, pressed: { opacity: 0.74, transform: [{ scale: 0.98 }] },
});
