import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Image } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import Animated, { Easing, ReduceMotion, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Platform } from "react-native";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";

SplashScreen.setOptions({
  duration: 300,
  fade: true,
});
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);
  const [isLaunchVisible, setIsLaunchVisible] = useState(true);
  const nativeSplashHidden = useRef(false);

  const handleRootLayout = useCallback(() => {
    if (nativeSplashHidden.current) return;
    nativeSplashHidden.current = true;
    // Keep the native splash over the first committed frame so there is no blank flash.
    setTimeout(() => void SplashScreen.hideAsync(), 140);
  }, []);

  // Initialize Manus runtime for cookie injection from parent container
  useEffect(() => {
    initManusRuntime();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // Create clients once and reuse them
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Disable automatic refetching on window focus for mobile
            refetchOnWindowFocus: false,
            // Retry failed requests once
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  // Ensure minimum 8px padding for top and bottom on mobile
  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {/* Default to hiding native headers so raw route segments don't appear (e.g. "(tabs)", "products/[id]"). */}
          {/* If a screen needs the native header, explicitly enable it and set a human title via Stack.Screen options. */}
          {/* in order for ios apps tab switching to work properly, use presentation: "fullScreenModal" for login page, whenever you decide to use presentation: "modal*/}
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" options={{ presentation: "card" }} />
            <Stack.Screen name="profile-edit" options={{ presentation: "card" }} />
            <Stack.Screen name="terms" options={{ presentation: "card" }} />
            <Stack.Screen name="oauth/callback" />
          </Stack>
          <StatusBar style="light" />
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <ThemeProvider>
          <SafeAreaProvider initialMetrics={providerInitialMetrics}>
            <SafeAreaFrameContext.Provider value={frame}>
              <SafeAreaInsetsContext.Provider value={insets}>
                <View style={styles.root} onLayout={handleRootLayout}>{content}{isLaunchVisible ? <LaunchOverlay onFinish={() => setIsLaunchVisible(false)} /> : null}</View>
              </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}><View style={styles.root} onLayout={handleRootLayout}>{content}{isLaunchVisible ? <LaunchOverlay onFinish={() => setIsLaunchVisible(false)} /> : null}</View></SafeAreaProvider>
    </ThemeProvider>
  );
}

function LaunchOverlay({ onFinish }: { onFinish: () => void }) {
  const progress = useSharedValue(1);
  useEffect(() => {
    const timer = setTimeout(() => {
      progress.value = withTiming(0, { duration: 300, easing: Easing.bezier(0.22, 0.61, 0.36, 1), reduceMotion: ReduceMotion.System }, (finished) => {
        if (finished) runOnJS(onFinish)();
      });
    }, 1600);
    return () => clearTimeout(timer);
  }, [onFinish, progress]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  return <Animated.View style={[styles.launchOverlay, animatedStyle]}><Image source={require("../assets/images/wallify-launch-lower-third.png")} style={styles.launchImage} resizeMode="cover" /></Animated.View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  launchOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 100, backgroundColor: "#3C3C3B", pointerEvents: "none" },
  launchImage: { flex: 1, width: "100%", height: "100%" },
});
