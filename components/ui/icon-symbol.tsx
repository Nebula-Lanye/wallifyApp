import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "arrow.right": "arrow-forward",
  "arrow.up.right": "north-east",
  "arrow.down.to.line": "file-download",
  "sparkles": "auto-awesome",
  "magnifyingglass": "search",
  "heart": "favorite-border",
  "heart.fill": "favorite",
  "gearshape": "settings",
  "moon.stars.fill": "nightlight-round",
  "bolt.fill": "bolt",
  "circle.hexagongrid.fill": "hub",
  "shuffle": "shuffle",
  "xmark.circle.fill": "cancel",
  "safari.fill": "language",
  "person.crop.circle.fill": "account-circle",
  "person.badge.plus": "person-add",
  "arrow.clockwise": "refresh",
  "info.circle.fill": "info",
  "lock.fill": "lock",
  "square.and.arrow.up": "ios-share",
  "quote.opening": "format-quote",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
