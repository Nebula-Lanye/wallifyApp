import { Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";

export function EmptyState({
  title,
  description,
  icon = "magnifyingglass",
}: {
  title: string;
  description: string;
  icon?: "magnifyingglass" | "heart";
}) {
  return (
    <View className="items-center justify-center px-8 py-20">
      <View className="mb-5 h-14 w-14 items-center justify-center rounded-full bg-surface">
        <IconSymbol name={icon} size={25} color="#A6A5B5" />
      </View>
      <Text className="text-center text-lg font-bold leading-6 text-foreground">{title}</Text>
      <Text className="mt-2 text-center text-sm leading-5 text-muted">{description}</Text>
    </View>
  );
}

