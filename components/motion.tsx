import { useEffect } from "react";
import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

const entranceEasing = Easing.bezier(0.22, 0.61, 0.36, 1);

export function MotionView({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      progress.value = 1;
      return;
    }
    progress.value = 0;
    progress.value = withDelay(delay, withTiming(1, { duration: 280, easing: entranceEasing, reduceMotion: ReduceMotion.System }));
  }, [delay, progress, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 10 }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
