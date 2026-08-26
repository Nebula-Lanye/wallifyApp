import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

export type LinkedWallifyProfile = {
  profileId: number;
  nickname: string;
  avatarUrl: string;
  profileUrl: string;
  signature: string | null;
  uploadCount: number | null;
  followingCount: number | null;
};

const LINKED_PROFILE_KEY = "wallify.linked-public-profile";

export function useWallifyProfile() {
  const [profile, setProfile] = useState<LinkedWallifyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(LINKED_PROFILE_KEY)
      .then((stored) => {
        if (isMounted) setProfile(stored ? (JSON.parse(stored) as LinkedWallifyProfile) : null);
      })
      .catch(() => {
        if (isMounted) setProfile(null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const saveProfile = useCallback(async (nextProfile: LinkedWallifyProfile) => {
    await AsyncStorage.setItem(LINKED_PROFILE_KEY, JSON.stringify(nextProfile));
    setProfile(nextProfile);
  }, []);

  const clearProfile = useCallback(async () => {
    await AsyncStorage.removeItem(LINKED_PROFILE_KEY);
    setProfile(null);
  }, []);

  return { profile, isLoading, saveProfile, clearProfile };
}
