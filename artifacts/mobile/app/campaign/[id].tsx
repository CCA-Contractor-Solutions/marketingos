import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetCampaignQueryKey,
  getGetDashboardSummaryQueryKey,
  getListCampaignsQueryKey,
  useApproveCampaign,
  useGetCampaign,
} from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Avatar,
  Badge,
  Card,
  ErrorView,
  LoadingView,
  ProgressBar,
  SectionHeader,
  resolveAccent,
} from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { formatCurrency } from "@/lib/format";

const ASSET_ICON = {
  video: "video",
  design: "image",
  doc: "file-text",
  archive: "archive",
} as const;

const TASK_STATUS_ACCENT = {
  completed: "emerald",
  in_progress: "sky",
  pending: "mutedForeground",
} as const;

export default function CampaignDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useGetCampaign(id);
  const approve = useApproveCampaign();

  const bottomPad = Platform.OS === "web" ? 40 : insets.bottom + 24;

  const onApprove = () => {
    if (!data) return;
    approve.mutate(
      { id: data.id },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          queryClient.invalidateQueries({ queryKey: getGetCampaignQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
          queryClient.invalidateQueries({
            queryKey: getGetDashboardSummaryQueryKey(),
          });
        },
      },
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: data?.name ?? "Campaign",
          headerStyle: { backgroundColor: colors.card },
          headerTitleStyle: {
            fontFamily: "Inter_600SemiBold",
            color: colors.foreground,
          },
          headerTintColor: colors.primary,
        }}
      />
      {isLoading ? (
        <LoadingView />
      ) : isError || !data ? (
        <ErrorView onRetry={() => refetch()} />
      ) : (
        <ScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: bottomPad,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header card */}
          <Card>
            <View style={styles.detailTop}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  {data.name}
                </Text>
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                  {data.subtitle}
                </Text>
              </View>
              <Badge label={data.status} accent={resolveAccent(data.status)} />
            </View>

            <View style={[styles.ownerRow, { borderTopColor: colors.border }]}>
              <Avatar
                initials={data.ownerInitials}
                accent={resolveAccent(data.ownerColor)}
                size={32}
              />
              <View>
                <Text style={[styles.ownerName, { color: colors.foreground }]}>
                  {data.ownerName}
                </Text>
                <Text style={[styles.ownerLabel, { color: colors.mutedForeground }]}>
                  Campaign owner
                </Text>
              </View>
              <View style={{ flex: 1 }} />
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.dateRange, { color: colors.foreground }]}>
                  {data.startDate} – {data.endDate}
                </Text>
                <Text style={[styles.ownerLabel, { color: colors.mutedForeground }]}>
                  Timeline
                </Text>
              </View>
            </View>
          </Card>

          {/* Budget */}
          <View style={{ height: 12 }} />
          <Card>
            <View style={styles.budgetHead}>
              <Text style={[styles.budgetLabel, { color: colors.mutedForeground }]}>
                Budget
              </Text>
              <Text style={[styles.budgetValue, { color: colors.foreground }]}>
                {formatCurrency(data.budgetSpent)} / {formatCurrency(data.budgetTotal)}
              </Text>
            </View>
            <ProgressBar
              value={
                data.budgetTotal
                  ? Math.round((data.budgetSpent / data.budgetTotal) * 100)
                  : 0
              }
              accent="primary"
            />
          </Card>

          {/* Goals */}
          {data.goals.length > 0 && (
            <>
              <View style={{ height: 22 }} />
              <SectionHeader title="Goals" />
              <Card style={{ paddingVertical: 6 }}>
                {data.goals.map((g, i) => (
                  <View
                    key={i}
                    style={[
                      styles.goalRow,
                      i < data.goals.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <Feather name="target" size={15} color={colors.primary} />
                    <Text style={[styles.goalText, { color: colors.foreground }]}>
                      {g}
                    </Text>
                  </View>
                ))}
              </Card>
            </>
          )}

          {/* Channels */}
          {data.channels.length > 0 && (
            <>
              <View style={{ height: 22 }} />
              <SectionHeader title="Channels" />
              <View style={styles.chipWrap}>
                {data.channels.map((ch) => (
                  <View
                    key={ch}
                    style={[
                      styles.chip,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: colors.inkSoft }]}>
                      {ch}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* KPIs */}
          {data.kpis.length > 0 && (
            <>
              <View style={{ height: 22 }} />
              <SectionHeader title="Performance" />
              <View style={{ gap: 12 }}>
                {data.kpis.map((kpi, i) => (
                  <Card key={i}>
                    <View style={styles.kpiHead}>
                      <Text style={[styles.kpiLabel, { color: colors.foreground }]}>
                        {kpi.label}
                      </Text>
                      <Text style={[styles.kpiTrend, { color: colors.emerald }]}>
                        {kpi.trend}
                      </Text>
                    </View>
                    <View style={styles.kpiValues}>
                      <Text style={[styles.kpiCurrent, { color: colors.foreground }]}>
                        {kpi.current}
                      </Text>
                      <Text style={[styles.kpiTarget, { color: colors.mutedForeground }]}>
                        of {kpi.target}
                      </Text>
                    </View>
                    <View style={{ marginTop: 10 }}>
                      <ProgressBar value={kpi.progress} accent="emerald" />
                    </View>
                  </Card>
                ))}
              </View>
            </>
          )}

          {/* Tasks */}
          {data.tasks.length > 0 && (
            <>
              <View style={{ height: 22 }} />
              <SectionHeader title="Tasks" />
              <Card style={{ paddingVertical: 6 }}>
                {data.tasks.map((t, i) => (
                  <View
                    key={t.id}
                    style={[
                      styles.taskRow,
                      i < data.tasks.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <Feather
                      name={t.status === "completed" ? "check-circle" : "circle"}
                      size={17}
                      color={
                        colors[TASK_STATUS_ACCENT[t.status]] ?? colors.mutedForeground
                      }
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.taskRowTitle, { color: colors.foreground }]}
                      >
                        {t.title}
                      </Text>
                      <Text
                        style={[styles.taskRowMeta, { color: colors.mutedForeground }]}
                      >
                        {t.assignee}
                      </Text>
                    </View>
                  </View>
                ))}
              </Card>
            </>
          )}

          {/* Assets */}
          {data.assets.length > 0 && (
            <>
              <View style={{ height: 22 }} />
              <SectionHeader title="Assets" />
              <Card style={{ paddingVertical: 6 }}>
                {data.assets.map((a, i) => (
                  <View
                    key={a.id}
                    style={[
                      styles.taskRow,
                      i < data.assets.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[styles.assetIcon, { backgroundColor: colors.brand50 }]}
                    >
                      <Feather
                        name={ASSET_ICON[a.type]}
                        size={15}
                        color={colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.taskRowTitle, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {a.name}
                      </Text>
                      <Text
                        style={[styles.taskRowMeta, { color: colors.mutedForeground }]}
                      >
                        {a.size} · {a.date}
                      </Text>
                    </View>
                  </View>
                ))}
              </Card>
            </>
          )}

          {/* Insights */}
          {data.insights.length > 0 && (
            <>
              <View style={{ height: 22 }} />
              <SectionHeader title="AI insights" />
              <View style={{ gap: 12 }}>
                {data.insights.map((ins) => (
                  <Card key={ins.id}>
                    <View style={styles.insightHead}>
                      <Feather name="zap" size={14} color={colors.primary} />
                      <Text style={[styles.insightTitle, { color: colors.foreground }]}>
                        {ins.title}
                      </Text>
                    </View>
                    <Text style={[styles.insightBody, { color: colors.mutedForeground }]}>
                      {ins.body}
                    </Text>
                  </Card>
                ))}
              </View>
            </>
          )}

          {/* Approve */}
          <View style={{ height: 24 }} />
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={approve.isPending}
            onPress={onApprove}
            style={[
              styles.approveBtn,
              { backgroundColor: colors.primary, opacity: approve.isPending ? 0.6 : 1 },
            ]}
          >
            <Feather name="check-circle" size={18} color="#fff" />
            <Text style={styles.approveText}>
              {approve.isPending ? "Approving..." : "Approve campaign"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  detailTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 20, letterSpacing: -0.4 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 4, lineHeight: 19 },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 14,
  },
  ownerName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  ownerLabel: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  dateRange: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  budgetHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  budgetLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  budgetValue: { fontFamily: "Inter_700Bold", fontSize: 15 },
  goalRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13 },
  goalText: { fontFamily: "Inter_500Medium", fontSize: 14, flex: 1, lineHeight: 20 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  kpiHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  kpiLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  kpiTrend: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  kpiValues: { flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 8 },
  kpiCurrent: { fontFamily: "Inter_700Bold", fontSize: 22, letterSpacing: -0.5 },
  kpiTarget: { fontFamily: "Inter_400Regular", fontSize: 13 },
  taskRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  taskRowTitle: { fontFamily: "Inter_500Medium", fontSize: 14 },
  taskRowMeta: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  assetIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  insightHead: { flexDirection: "row", alignItems: "center", gap: 7 },
  insightTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, flex: 1 },
  insightBody: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginTop: 6 },
  approveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 15,
  },
  approveText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
