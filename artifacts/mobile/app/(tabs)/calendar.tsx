import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListTasksQueryKey,
  useListTasks,
  type Task,
} from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  Avatar,
  Badge,
  Card,
  EmptyView,
  ErrorView,
  LoadingView,
  ScreenTitle,
  resolveAccent,
  useBottomInset,
  useTopInset,
} from "@/components/ui";
import {
  EditTaskSheet,
  STATUS_ACCENT,
  STATUS_LABEL,
} from "@/components/EditTaskSheet";
import { RescheduleSheet } from "@/components/RescheduleSheet";
import { useColors } from "@/hooks/useColors";
import {
  WEEKDAY_LABELS,
  formatMonthYear,
  isSameDay,
  parseDueDate,
  relativeLabel,
  startOfDay,
} from "@/lib/dates";

const PRIORITY_ACCENT: Record<Task["priority"], "rose" | "amber" | "sky"> = {
  high: "rose",
  medium: "amber",
  low: "sky",
};

type DatedTask = { task: Task; date: Date };

export default function CalendarScreen() {
  const colors = useColors();
  const topInset = useTopInset();
  const bottomInset = useBottomInset();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useListTasks();

  const today = useMemo(() => startOfDay(new Date()), []);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [rescheduleTask, setRescheduleTask] = useState<Task | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });

  const dated = useMemo<DatedTask[]>(() => {
    return (data ?? [])
      .map((task) => ({ task, date: parseDueDate(task.dueDate) }))
      .filter((t): t is DatedTask => t.date !== null);
  }, [data]);

  const unscheduledCount = useMemo(
    () => (data ?? []).filter((t) => !parseDueDate(t.dueDate)).length,
    [data],
  );

  // Default to the month with the most scheduled tasks, else this month.
  const initialMonth = useMemo(() => {
    if (!dated.length) return new Date(today.getFullYear(), today.getMonth(), 1);
    const counts = new Map<string, { date: Date; n: number }>();
    for (const { date } of dated) {
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const entry = counts.get(key);
      if (entry) entry.n += 1;
      else
        counts.set(key, {
          date: new Date(date.getFullYear(), date.getMonth(), 1),
          n: 1,
        });
    }
    let best = { date: new Date(today.getFullYear(), today.getMonth(), 1), n: -1 };
    for (const entry of counts.values()) if (entry.n > best.n) best = entry;
    return best.date;
  }, [dated, today]);

  const [month, setMonth] = useState(initialMonth);
  const [selected, setSelected] = useState<Date>(today);

  const grid = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [month]);

  const tasksForDay = (day: Date) =>
    dated
      .filter((d) => isSameDay(d.date, day))
      .map((d) => d.task)
      .sort((a, b) => a.title.localeCompare(b.title));

  const goMonth = (delta: number) =>
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  const selectedTasks = tasksForDay(selected);

  if (isLoading) return <LoadingView />;
  if (isError || !data) return <ErrorView onRetry={() => refetch()} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topInset + 12,
          paddingHorizontal: 16,
          paddingBottom: bottomInset,
        }}
      >
        <ScreenTitle
          title="Calendar"
          subtitle={
            unscheduledCount > 0
              ? `${dated.length} scheduled · ${unscheduledCount} unscheduled`
              : `${dated.length} scheduled`
          }
        />

        {/* Month navigation */}
        <View style={styles.navRow}>
          <Text style={[styles.monthLabel, { color: colors.foreground }]}>
            {formatMonthYear(month)}
          </Text>
          <View style={styles.navBtns}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.selectionAsync();
                setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                setSelected(today);
              }}
              style={[styles.todayBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.todayText, { color: colors.inkSoft }]}>
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.selectionAsync();
                goMonth(-1);
              }}
              style={[styles.iconBtn, { borderColor: colors.border }]}
            >
              <Feather name="chevron-left" size={18} color={colors.inkSoft} />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.selectionAsync();
                goMonth(1);
              }}
              style={[styles.iconBtn, { borderColor: colors.border }]}
            >
              <Feather name="chevron-right" size={18} color={colors.inkSoft} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar grid */}
        <Card style={{ padding: 8 }}>
          <View style={styles.weekRow}>
            {WEEKDAY_LABELS.map((w) => (
              <Text
                key={w}
                style={[styles.weekLabel, { color: colors.mutedForeground }]}
              >
                {w[0]}
              </Text>
            ))}
          </View>
          <View style={styles.grid}>
            {grid.map((day, i) => {
              const inMonth = day.getMonth() === month.getMonth();
              const isToday = isSameDay(day, today);
              const isSelected = isSameDay(day, selected);
              const count = tasksForDay(day).length;
              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelected(day);
                  }}
                  style={styles.cell}
                >
                  <View
                    style={[
                      styles.dayBubble,
                      isSelected && { backgroundColor: colors.brand50 },
                      isToday && { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNum,
                        {
                          color: isToday
                            ? "#fff"
                            : inMonth
                              ? colors.foreground
                              : colors.mutedForeground,
                        },
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                  </View>
                  <View style={styles.dotRow}>
                    {count > 0 ? (
                      <View
                        style={[
                          styles.countDot,
                          {
                            backgroundColor: isToday
                              ? colors.primary
                              : colors.mutedForeground,
                          },
                        ]}
                      />
                    ) : (
                      <View style={styles.dotPlaceholder} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Selected day's tasks */}
        <View style={styles.dayHead}>
          <Text style={[styles.dayHeadTitle, { color: colors.foreground }]}>
            {isSameDay(selected, today)
              ? "Today"
              : relativeLabel(selected)}
          </Text>
          <Text style={[styles.dayHeadCount, { color: colors.mutedForeground }]}>
            {selectedTasks.length}{" "}
            {selectedTasks.length === 1 ? "task" : "tasks"}
          </Text>
        </View>

        {selectedTasks.length === 0 ? (
          <EmptyView
            icon="calendar"
            title="Nothing due this day"
            body="Tap a day with a dot to see what's scheduled, or long-press a task to reschedule it."
          />
        ) : (
          <View style={{ gap: 10 }}>
            {selectedTasks.map((t) => (
              <TouchableOpacity
                key={t.id}
                activeOpacity={0.85}
                onPress={() => setEditTask(t)}
                onLongPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setRescheduleTask(t);
                }}
                delayLongPress={250}
              >
                <Card style={{ padding: 14 }}>
                  <View style={styles.taskTop}>
                    <Text
                      style={[styles.taskTitle, { color: colors.foreground }]}
                    >
                      {t.title}
                    </Text>
                    {t.blocked ? (
                      <Feather name="slash" size={15} color={colors.rose} />
                    ) : null}
                  </View>

                  {t.campaign ? (
                    <Text
                      style={[styles.taskCampaign, { color: colors.mutedForeground }]}
                      numberOfLines={1}
                    >
                      {t.campaign}
                    </Text>
                  ) : null}

                  <View style={styles.taskMeta}>
                    <Badge
                      label={t.priority}
                      accent={PRIORITY_ACCENT[t.priority]}
                    />
                    <View style={styles.statusChip}>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: colors[STATUS_ACCENT[t.status]] },
                        ]}
                      />
                      <Text
                        style={[styles.statusText, { color: colors.mutedForeground }]}
                      >
                        {STATUS_LABEL[t.status]}
                      </Text>
                    </View>
                    {t.aiGenerated ? (
                      <View
                        style={[styles.aiTag, { backgroundColor: colors.brand50 }]}
                      >
                        <Feather name="zap" size={11} color={colors.primary} />
                        <Text style={[styles.aiText, { color: colors.primary }]}>
                          AI
                        </Text>
                      </View>
                    ) : null}
                    <View style={{ flex: 1 }} />
                    <View style={styles.avatarStack}>
                      {t.assignees.slice(0, 3).map((a, i) => (
                        <View key={i} style={{ marginLeft: i === 0 ? 0 : -8 }}>
                          <Avatar
                            initials={a.init}
                            accent={resolveAccent(a.color)}
                            size={24}
                          />
                        </View>
                      ))}
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <EditTaskSheet
        task={editTask}
        onClose={() => setEditTask(null)}
        onUpdated={invalidate}
      />
      <RescheduleSheet
        task={rescheduleTask}
        onClose={() => setRescheduleTask(null)}
        onRescheduled={invalidate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  monthLabel: { fontFamily: "Inter_700Bold", fontSize: 17 },
  navBtns: { flexDirection: "row", alignItems: "center", gap: 8 },
  todayBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  todayText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  weekRow: { flexDirection: "row", marginBottom: 4 },
  weekLabel: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    paddingVertical: 6,
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: `${100 / 7}%`,
    alignItems: "center",
    paddingVertical: 4,
  },
  dayBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNum: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  dotRow: { height: 8, justifyContent: "center", alignItems: "center" },
  countDot: { width: 5, height: 5, borderRadius: 3 },
  dotPlaceholder: { width: 5, height: 5 },
  dayHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 12,
  },
  dayHeadTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  dayHeadCount: { fontFamily: "Inter_500Medium", fontSize: 13 },
  taskTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  taskTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, flex: 1, lineHeight: 21 },
  taskCampaign: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 5 },
  taskMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  statusChip: { flexDirection: "row", alignItems: "center", gap: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  aiTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  aiText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  avatarStack: { flexDirection: "row", alignItems: "center" },
});
