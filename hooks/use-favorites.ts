import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

const FAVORITES_KEY = "wallify.favorite-wallpaper-ids";

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  const loadFavorites = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      setFavoriteIds(stored ? (JSON.parse(stored) as string[]) : []);
    } catch {
      setFavoriteIds([]);
    } finally {
      setIsReady(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadFavorites();
    }, [loadFavorites]),
  );

  const toggleFavorite = useCallback(async (wallpaperId: string) => {
    const stored = await AsyncStorage.getItem(FAVORITES_KEY);
    const current = stored ? (JSON.parse(stored) as string[]) : [];
    const next = current.includes(wallpaperId)
      ? current.filter((id) => id !== wallpaperId)
      : [wallpaperId, ...current];

    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    setFavoriteIds(next);
    return next.includes(wallpaperId);
  }, []);

  return {
    favoriteIds,
    isReady,
    isFavorite: (wallpaperId: string) => favoriteIds.includes(wallpaperId),
    toggleFavorite,
  };
}

