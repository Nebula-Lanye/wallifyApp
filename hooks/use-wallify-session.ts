import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

import type { LinkedWallifyProfile } from "./use-wallify-profile";

export type WallifySession = {
  sessionId: string;
  profile: LinkedWallifyProfile;
};

const SESSION_KEY = "wallify.native-session";

export function useWallifySession() {
  const [session, setSession] = useState<WallifySession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then((stored) => setSession(stored ? (JSON.parse(stored) as WallifySession) : null))
      .catch(() => setSession(null))
      .finally(() => setIsLoading(false));
  }, []);

  const saveSession = useCallback(async (nextSession: WallifySession) => {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  }, []);

  const clearSession = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  return { session, isLoading, saveSession, clearSession };
}

