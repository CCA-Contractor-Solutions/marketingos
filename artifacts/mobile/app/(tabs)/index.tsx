import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetDashboardSummaryQueryKey,
  getListTasksQueryKey,
  useGetDashboardSummary,
  useListTasks,
  type Task,
} from "@workspace/api-client-react";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  Avatar,
  Badge,
  Card,
  ErrorView,
  LoadingView,
  ProgressBar,
  SectionHeader,
  Sparkline,
  resolveAccent,
  useBottomInset,
  useTopInset,
} from "@/components/ui";
import { EditTaskSheet } from "@/components/EditTaskSheet";
import { RescheduleSheet } from "@/components/RescheduleSheet";
import { useColors } from "@/hooks/useColors";
import { useNotifications } from "@/hooks/useNotifications";
import { dayDiff, isOverdue, isSameDay, parseDueDate, relativeLabel } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";

const SEVERITY_ACCENT = {
  warning: "amber",
  alert: "rose",
  info: "sky",
} as const;

const MILESTONE_ICON = {
  review: "check-circle",
  launch: "zap",
  meeting: "users",
  deadline: "flag",
} as const;

export default function DashboardScreen() {
  const colors = useColors();
  const topInset = useTopInset();
  const bottomInset = useBottomInset();
  const { optedIn, busy, permissionDenied, setOptedIn } = useNotifications();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch, isRefetching } =
    useGetDashboardSummary();
  const { data: tasks } = useListTasks();

  const [rescheduleTask, setRescheduleTask] = useState<Task | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);

  // Surface the most time-sensitive tasks (overdue first, then due soon) so the
  // user can reschedule them without leaving the home screen.
  const pulseTasks = useMemo(() => {
    const withDates = (tasks ?? [])
      .filter((t) => t.status !== "done")
      .map((t) => ({ task: t, date: parseDueDate(t.dueDate) }))
      .filter(
        (e): e is { task: Task; date: Date } =>
          e.date !== null && dayDiff(e.date, new Date()) <= 3,
      );
    withDates.sort((a, b) => a.date.getTime() - b.date.getTime());
    return withDates.slice(0, 4).map((e) => e.task);
  }, [tasks]);

  const onRescheduled = () => {
    queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
    queryClient.invalidateQueries({
      queryKey: getGetDashboardSummaryQueryKey(),
    });
  };

  if (isLoading) return <LoadingView />;
  if (isError || !data) return <ErrorView onRetry={() => refetch()} />;

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const rollup = [
    { label: "To Do", value: data.taskRollup.todo, accent: "mutedForeground" },
    { label: "In Progress", value: data.taskRollup.inProgress, accent: "sky" },
    { label: "In Review", value: data.taskRollup.inReview, accent: "amber" },
    { label: "Done", value: data.taskRollup.done, accent: "emerald" },
  ] as const;

  return (
    <>
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: topInset + 12,
        paddingHorizontal: 16,
        paddingBottom: bottomInset,
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
      }
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.kicker, { color: colors.primary }]}>
            COMMAND CENTER
          </Text>
          <Text style={[styles.greeting, { color: colors.foreground }]}>
            Good {greeting()}
          </Text>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>
            {today}
          </Text>
        </View>
        <LinearGradient
          colors={[colors.primary, colors.violet]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.brandMark}
        >
          <Feather name="activity" size={22} color="#fff" />
        </LinearGradient>
      </View>

      {/* Reminders opt-in */}
      <Card style={{ marginBottom: 22 }}>
        <View style={styles.reminderRow}>
          <View
            style={[styles.reminderIcon, { backgroundColor: colors.brand50 }]}
          >
            <Feather name="bell" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.reminderTitle, { color: colors.foreground }]}>
              Reminders
            </Text>
            <Text
              style={[styles.reminderBody, { color: colors.mutedForeground }]}
            >
              {permissionDenied
                ? "Enable notifications in Settings to get reminders."
                : "Get notified about due tasks and approvals."}
            </Text>
          </View>
          <Switch
            value={optedIn}
            disabled={busy}
            onValueChange={(next) => {
              void setOptedIn(next);
            }}
            trackColor={{ true: colors.primary }}
          />
        </View>
      </Card>

      {/* KPIs */}
      <View style={styles.kpiGrid}>
        {data.kpis.map((kpi) => (
          <Card key={kpi.title} style={styles.kpiCard}>
            <Text style={[styles.kpiTitle, { color: colors.mutedForeground }]}>
              {kpi.title}
            </Text>
            <Text style={[styles.kpiValue, { color: colors.foreground }]}>
              {kpi.value}
            </Text>
            <View style={styles.kpiDeltaRow}>
              <Feather
                name={kpi.isPositive ? "trending-up" : "trending-down"}
                size={13}
                color={kpi.isPositive ? colors.emerald : colors.rose}
              />
              <Text
                style={[
                  styles.kpiDelta,
                  { color: kpi.isPositive ? colors.emerald : colors.rose },
                ]}
              >
                {kpi.delta}
              </Text>
            </View>
            <View style={{ marginTop: 10 }}>
              <Sparkline
                data={kpi.sparkline}
                accent={kpi.isPositive ? "emerald" : "rose"}
              />
            </View>
          </Card>
        ))}
      </View>

      {/* Task rollup */}
      <SectionHeader title="Task pulse" />
      <Card style={{ marginBottom: 22 }}>
        <View style={styles.rollupRow}>
          {rollup.map((r) => (
            <View key={r.label} style={styles.rollupItem}>
              <Text
                style={[
                  styles.rollupValue,
                  { color: colors[r.accent] ?? colors.foreground },
                ]}
              >
                {r.value}
              </Text>
              <Text style={[styles.rollupLabel, { color: colors.mutedForeground }]}>
                {r.label}
              </Text>
            </View>
          ))}
        </View>
        <View style={[styles.rollupFooter, { borderTopColor: colors.border }]}>
          <View style={styles.rollupChip}>
            <Feather name="alert-circle" size={13} color={colors.rose} />
            <Text style={[styles.rollupChipText, { color: colors.inkSoft }]}>
              {data.taskRollup.overdue} overdue
            </Text>
          </View>
          <View style={styles.rollupChip}>
            <Feather name="slash" size={13} color={colors.amber} />
            <Text style={[styles.rollupChipText, { color: colors.inkSoft }]}>
              {data.taskRollup.blocked} blocked
            </Text>
          </View>
        </View>

        {pulseTasks.length > 0 ? (
          <View style={[styles.pulseList, { borderTopColor: colors.border }]}>
            <Text style={[styles.pulseHint, { color: colors.mutedForeground }]}>
              Needs scheduling attention
            </Text>
            {pulseTasks.map((t, i) => {
              const due = parseDueDate(t.dueDate);
              const overdue = !!due && isOverdue(due);
              const isToday = !!due && isSameDay(due, new Date());
              const tone = overdue
                ? colors.rose
                : isToday
                  ? colors.primary
                  : colors.mutedForeground;
              return (
                <View
                  key={t.id}
                  style={[
                    styles.pulseRow,
                    i < pulseTasks.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <TouchableOpacity
                    accessibilityLabel={`Open ${t.title}`}
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setEditTask(t);
                    }}
                    style={{ flex: 1, paddingRight: 10 }}
                  >
                    <Text
                      style={[styles.pulseTitle, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {t.title}
                    </Text>
                    {due ? (
                      <View style={styles.pulseDueRow}>
                        <Feather name="calendar" size={11} color={tone} />
                        <Text style={[styles.pulseDue, { color: tone }]}>
                          {overdue ? "Overdue · " : ""}
                          {relativeLabel(due)}
                        </Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityLabel={`Reschedule ${t.title}`}
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setRescheduleTask(t);
                    }}
                    hitSlop={8}
                    style={[styles.pulseBtn, { borderColor: colors.border }]}
                  >
                    <Feather name="calendar" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : null}
      </Card>

      {/* Active campaigns */}
      <SectionHeader title="Active campaigns" caption="Tap to open the brief" />
      <View style={{ gap: 12, marginBottom: 22 }}>
        {data.campaigns.map((c) => {
          const spentPct = c.budgetTotal
            ? Math.round((c.budgetSpent / c.budgetTotal) * 100)
            : 0;
          return (
            <TouchableOpacity
              key={c.id}
              activeOpacity={0.85}
              onPress={() => router.push(`/campaign/${c.id}`)}
            >
              <Card>
                <View style={styles.campaignTop}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text
                      style={[styles.campaignName, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {c.name}
                    </Text>
                    <View style={styles.ownerRow}>
                      <Avatar
                        initials={initialsOf(c.owner)}
                        accent={resolveAccent(c.ownerColor)}
                        size={20}
                      />
                      <Text
                        style={[styles.ownerName, { color: colors.mutedForeground }]}
                      >
                        {c.owner}
                      </Text>
                    </View>
                  </View>
                  <Badge label={c.status} accent={resolveAccent(c.statusColor)} />
                </View>
                <View style={styles.progressRow}>
                  <ProgressBar value={c.progress} accent={resolveAccent(c.statusColor)} />
                  <Text style={[styles.progressPct, { color: colors.inkSoft }]}>
                    {c.progress}%
                  </Text>
                </View>
                <View style={styles.budgetRow}>
                  <Text style={[styles.budgetText, { color: colors.mutedForeground }]}>
                    {formatCurrency(c.budgetSpent)} / {formatCurrency(c.budgetTotal)}
                  </Text>
                  <Text style={[styles.budgetText, { color: colors.mutedForeground }]}>
                    {spentPct}% spent
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* AI insights */}
      {data.insights.length > 0 && (
        <>
          <SectionHeader title="AI insights" />
          <View style={{ gap: 12, marginBottom: 22 }}>
            {data.insights.map((ins) => {
              const accent = SEVERITY_ACCENT[ins.severity];
              return (
                <Card key={ins.id} style={{ padding: 0, overflow: "hidden" }}>
                  <View style={styles.insightInner}>
                    <View
                      style={[
                        styles.insightBar,
                        { backgroundColor: colors[accent] },
                      ]}
                    />
                    <View style={{ flex: 1, padding: 14 }}>
                      <View style={styles.insightHead}>
                        <Feather
                          name="zap"
                          size={14}
                          color={colors[accent]}
                        />
                        <Text
                          style={[styles.insightTitle, { color: colors.foreground }]}
                        >
                          {ins.title}
                        </Text>
                      </View>
                      <Text
                        style={[styles.insightBody, { color: colors.mutedForeground }]}
                      >
                        {ins.body}
                      </Text>
                      {ins.action ? (
                        <Text style={[styles.insightAction, { color: colors.primary }]}>
                          {ins.action}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        </>
      )}

      {/* Needs attention */}
      {data.attention.length > 0 && (
        <>
          <SectionHeader title="Needs attention" />
          <Card style={{ marginBottom: 22, paddingVertical: 6 }}>
            {data.attention.map((a, i) => (
              <View
                key={a.id}
                style={[
                  styles.attentionRow,
                  i < data.attention.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        a.severity === "high" ? colors.rose : colors.amber,
                    },
                  ]}
                />
                <Text
                  style={[styles.attentionTitle, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {a.title}
                </Text>
                <Text style={[styles.attentionTime, { color: colors.mutedForeground }]}>
                  {a.time}
                </Text>
              </View>
            ))}
          </Card>
        </>
      )}

      {/* Milestones */}
      {data.milestones.length > 0 && (
        <>
          <SectionHeader title="Upcoming milestones" />
          <Card style={{ paddingVertical: 6 }}>
            {data.milestones.map((m, i) => (
              <View
                key={m.id}
                style={[
                  styles.milestoneRow,
                  i < data.milestones.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[styles.milestoneIcon, { backgroundColor: colors.brand50 }]}
                >
                  <Feather
                    name={MILESTONE_ICON[m.type]}
                    size={15}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.milestoneTitle, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {m.title}
                  </Text>
                  <Text
                    style={[styles.milestoneDate, { color: colors.mutedForeground }]}
                  >
                    {m.date}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </>
      )}
    </ScrollView>
    <RescheduleSheet
      task={rescheduleTask}
      onClose={() => setRescheduleTask(null)}
      onRescheduled={onRescheduled}
    />
    <EditTaskSheet
      task={editTask}
      onClose={() => setEditTask(null)}
      onUpdated={onRescheduled}
    />
    </>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  kicker: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.4,
  },
  greeting: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  date: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  brandMark: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  reminderRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  reminderIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  reminderTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  reminderBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 22,
  },
  kpiCard: { width: "47.6%", flexGrow: 1, padding: 14 },
  kpiTitle: { fontFamily: "Inter_500Medium", fontSize: 12 },
  kpiValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  kpiDeltaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  kpiDelta: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  rollupRow: { flexDirection: "row", justifyContent: "space-between" },
  rollupItem: { alignItems: "center", flex: 1 },
  rollupValue: { fontFamily: "Inter_700Bold", fontSize: 22 },
  rollupLabel: { fontFamily: "Inter_500Medium", fontSize: 11, marginTop: 2 },
  rollupFooter: {
    flexDirection: "row",
    gap: 18,
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 12,
  },
  rollupChip: { flexDirection: "row", alignItems: "center", gap: 6 },
  rollupChipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  pulseList: {
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 6,
  },
  pulseHint: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 6,
    marginBottom: 2,
  },
  pulseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  pulseTitle: { fontFamily: "Inter_500Medium", fontSize: 14 },
  pulseDueRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  pulseDue: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  pulseBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  campaignTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  campaignName: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  ownerRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 7 },
  ownerName: { fontFamily: "Inter_400Regular", fontSize: 13 },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  progressPct: { fontFamily: "Inter_600SemiBold", fontSize: 12, width: 36, textAlign: "right" },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  budgetText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  insightInner: { flexDirection: "row" },
  insightBar: { width: 4 },
  insightHead: { flexDirection: "row", alignItems: "center", gap: 7 },
  insightTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, flex: 1 },
  insightBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  insightAction: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    marginTop: 8,
  },
  attentionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 13,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  attentionTitle: { fontFamily: "Inter_500Medium", fontSize: 14, flex: 1 },
  attentionTime: { fontFamily: "Inter_400Regular", fontSize: 12 },
  milestoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  milestoneIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneTitle: { fontFamily: "Inter_500Medium", fontSize: 14 },
  milestoneDate: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
});
