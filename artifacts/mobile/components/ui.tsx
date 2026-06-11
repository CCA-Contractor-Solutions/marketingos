import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export function useTopInset() {
  const insets = useSafeAreaInsets();
  return Platform.OS === "web" ? 67 : insets.top;
}

export function useBottomInset() {
  const insets = useSafeAreaInsets();
  return Platform.OS === "web" ? 100 : insets.bottom + 76;
}

export type AccentKey =
  | "primary"
  | "emerald"
  | "amber"
  | "sky"
  | "violet"
  | "rose"
  | "coral"
  | "mutedForeground";

const STATUS_PALETTE: Record<string, AccentKey> = {
  brand: "primary",
  indigo: "primary",
  emerald: "emerald",
  green: "emerald",
  amber: "amber",
  yellow: "amber",
  orange: "amber",
  blue: "sky",
  sky: "sky",
  violet: "violet",
  purple: "violet",
  red: "rose",
  rose: "rose",
  pink: "rose",
  coral: "coral",
};

const HEX_PALETTE: Record<string, AccentKey> = {
  "#4f46e5": "primary",
  "#4338ca": "primary",
  "#7c3aed": "violet",
  "#fb6f5a": "coral",
  "#18b386": "emerald",
  "#f5a524": "amber",
  "#f43f6b": "rose",
  "#2f9bf2": "sky",
};

export function resolveAccent(token: string | undefined): AccentKey {
  if (!token) return "mutedForeground";
  const raw = token.trim().toLowerCase();
  // CSS custom property form, e.g. "var(--c-emerald)"
  const varMatch = raw.match(/--c-([a-z]+)/);
  if (varMatch) return STATUS_PALETTE[varMatch[1]] ?? "mutedForeground";
  // Hex form, e.g. "#4f46e5"
  if (raw.startsWith("#")) return HEX_PALETTE[raw] ?? "primary";
  return STATUS_PALETTE[raw] ?? "mutedForeground";
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}) {
  const colors = useColors();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 16,
          padding: 16,
        },
        styles.shadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Badge({
  label,
  accent = "mutedForeground",
}: {
  label: string;
  accent?: AccentKey;
}) {
  const colors = useColors();
  const color = colors[accent] ?? colors.mutedForeground;
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: color + "1f" },
      ]}
    >
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({
  value,
  accent = "primary",
}: {
  value: number;
  accent?: AccentKey;
}) {
  const colors = useColors();
  const color =
    accent === "mutedForeground" ? colors.primary : colors[accent] ?? colors.primary;
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
      <View
        style={{
          width: `${clamped}%`,
          height: "100%",
          backgroundColor: color,
          borderRadius: 999,
        }}
      />
    </View>
  );
}

export function Avatar({
  initials,
  accent = "primary",
  size = 30,
}: {
  initials: string;
  accent?: AccentKey;
  size?: number;
}) {
  const colors = useColors();
  const color = colors[accent] ?? colors.primary;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: "#fff",
          fontFamily: "Inter_600SemiBold",
          fontSize: size * 0.38,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}

export function Sparkline({
  data,
  accent = "primary",
}: {
  data: number[];
  accent?: "primary" | "emerald" | "rose";
}) {
  const colors = useColors();
  const color = colors[accent] ?? colors.primary;
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  return (
    <View style={styles.sparkRow}>
      {data.map((d, i) => {
        const h = 6 + ((d - min) / range) * 22;
        return (
          <View
            key={i}
            style={{
              flex: 1,
              height: h,
              backgroundColor: color + (i === data.length - 1 ? "ff" : "55"),
              borderRadius: 2,
            }}
          />
        );
      })}
    </View>
  );
}

export function SectionHeader({
  title,
  caption,
}: {
  title: string;
  caption?: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        {title}
      </Text>
      {caption ? (
        <Text style={[styles.sectionCaption, { color: colors.mutedForeground }]}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

export function LoadingView() {
  const colors = useColors();
  return (
    <View style={styles.centerFill}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

export function ErrorView({ onRetry }: { onRetry: () => void }) {
  const colors = useColors();
  return (
    <View style={styles.centerFill}>
      <Feather name="alert-triangle" size={32} color={colors.rose} />
      <Text style={[styles.stateTitle, { color: colors.foreground }]}>
        Something went wrong
      </Text>
      <Text style={[styles.stateBody, { color: colors.mutedForeground }]}>
        We couldn't load this data. Check your connection and try again.
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        activeOpacity={0.85}
        style={[styles.retryBtn, { backgroundColor: colors.primary }]}
      >
        <Feather name="refresh-cw" size={15} color="#fff" />
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

export function EmptyView({
  icon = "inbox",
  title,
  body,
}: {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  body?: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.centerFill}>
      <Feather name={icon} size={30} color={colors.mutedForeground} />
      <Text style={[styles.stateTitle, { color: colors.foreground }]}>
        {title}
      </Text>
      {body ? (
        <Text style={[styles.stateBody, { color: colors.mutedForeground }]}>
          {body}
        </Text>
      ) : null}
    </View>
  );
}

export function ScreenTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.titleRow}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.screenSubtitle, { color: colors.mutedForeground }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export const textStyles = StyleSheet.create({
  body: { fontFamily: "Inter_400Regular", fontSize: 14 },
  medium: { fontFamily: "Inter_500Medium", fontSize: 14 },
  semibold: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  bold: { fontFamily: "Inter_700Bold", fontSize: 14 },
});

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#1b1f3b",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.2,
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    overflow: "hidden",
    width: "100%",
  },
  sparkRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    height: 28,
  },
  sectionHeader: { marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  sectionCaption: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  centerFill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 10,
    minHeight: 240,
  },
  stateTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, marginTop: 4 },
  stateBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  retryText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 26, letterSpacing: -0.5 },
  screenSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    marginTop: 3,
  },
});

export type TextStyleExport = TextStyle;
