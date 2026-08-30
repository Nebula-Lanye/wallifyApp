import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

import type { LinkedWallifyProfile } from "./use-wallify-profile";

export type WallifySession = {
  token: string;
  expiresAt: string;
  profile: LinkedWallifyProfile;
};

type SessionMeta = Omit<WallifySession, "token">;

const TOKEN_KEY = "wallify.appapi-token";
const SESSION_META_KEY = "wallify.appapi-session-meta";
const LEGACY_SESSION_KEY = "wallify.native-session";

async function getSecureValue(key: string) {
  if (Platform.OS === "web") return sessionStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function setSecureValue(key: string, value: string) {
  if (Platform.OS === "web") {
    sessionStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function removeSecureValue(key: string) {
  if (Platform.OS === "web") {
    sessionStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

function isSessionMeta(value: unknown): value is SessionMeta {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SessionMeta>;
  return typeof candidate.expiresAt === "string" && Boolean(candidate.profile && typeof candidate.profile === "object");
}

export function useWallifySession() {
  const [session, setSession] = useState<WallifySession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getSecureValue(TOKEN_KEY), AsyncStorage.getItem(SESSION_META_KEY)])
      .then(async ([token, storedMeta]) => {
        if (token && /^[a-f0-9]{48}$/i.test(token) && storedMeta) {
          try {
            const meta = JSON.parse(storedMeta) as unknown;
            if (isSessionMeta(meta) && isMounted) setSession({ token, ...meta });
          } catch {
            await removeSecureValue(TOKEN_KEY);
            await AsyncStorage.removeItem(SESSION_META_KEY);
          }
        }
        // A previous beta build stored an opaque UUID and server-side cookie. It cannot authenticate AppAPI.
        await AsyncStorage.removeItem(LEGACY_SESSION_KEY);
      })
      .catch(() => {
        if (isMounted) setSession(null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const saveSession = useCallback(async (nextSession: WallifySession) => {
    if (!/^[a-f0-9]{48}$/i.test(nextSession.token)) throw new Error("登录令牌格式异常");
    const { token, ...meta } = nextSession;
    await setSecureValue(TOKEN_KEY, token);
    await AsyncStorage.setItem(SESSION_META_KEY, JSON.stringify(meta));
    await AsyncStorage.removeItem(LEGACY_SESSION_KEY);
    setSession(nextSession);
  }, []);

  const updateSessionExpiry = useCallback(async (expiresAt: string | null | undefined) => {
    if (!expiresAt || !session || session.expiresAt === expiresAt) return;
    await saveSession({ ...session, expiresAt });
  }, [saveSession, session]);

  const clearSession = useCallback(async () => {
    await removeSecureValue(TOKEN_KEY);
    await AsyncStorage.multiRemove([SESSION_META_KEY, LEGACY_SESSION_KEY]);
    setSession(null);
  }, []);

  return { session, isLoading, saveSession, updateSessionExpiry, clearSession };
}
