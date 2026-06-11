import { Feather } from "@expo/vector-icons";
import { useUpdateTask, type Task } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";
import {
  WEEKDAY_LABELS,
  formatISODate,
  isSameDay,
  parseDueDate,
  relativeLabel,
  startOfDay,
} from "@/lib/dates";
import { useBottomInset } from "@/components/ui";

type Rect = { x: number; y: number; w: number; h: number };

const COLS = 7;
const ROWS = 2;
const DAYS = COLS * ROWS;

/**
 * Drag-to-reschedule bottom sheet for mobile.
 *
 * The user long-presses a task card to open this sheet, then drags the task
 * token onto a day in a two-week grid. On drop the due date is written via the
 * same update-task API the web uses, in the same "YYYY-MM-DD" format
 * (formatISODate), so reschedules agree across clients.
 */
export function RescheduleSheet({
  task,
  onClose,
  onRescheduled,
}: {
  task: Task | null;
  onClose: () => void;
  onRescheduled: () => void;
}) {
  const colors = useColors();
  const bottomInset = useBottomInset();
  const updateTask = useUpdateTask();

  // Absolute (window) rect of every day cell, used for hit-testing the drag.
  const cellRects = useRef<Array<Rect | null>>([]);
  const cellRefs = useRef<Array<View | null>>([]);

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  // How many two-week pages away from the current week we are showing.
  // 0 = the fortnight containing today; negative = past, positive = future.
  const [pageOffset, setPageOffset] = useState(0);

  const today = useMemo(() => startOfDay(new Date()), []);

  // Two weeks starting from the Sunday of the current week, shifted by
  // pageOffset fortnights so the user can navigate beyond the next two weeks.
  const days = useMemo(() => {
    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay() + pageOffset * DAYS);
    return Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [today, pageOffset]);

  // Label for the visible date range, shown in the navigation header.
  const rangeLabel = useMemo(() => {
    const first = days[0];
    const last = days[days.length - 1];
    const sameMonth = first.getMonth() === last.getMonth();
    const firstStr = first.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    const lastStr = last.toLocaleDateString(
      undefined,
      sameMonth ? { day: "numeric" } : { month: "short", day: "numeric" },
    );
    return `${firstStr} – ${lastStr}`;
  }, [days]);

  const currentDue = useMemo(
    () => (task ? parseDueDate(task.dueDate) : null),
    [task],
  );

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const dragging = useSharedValue(0);

  // Re-measure cells whenever the sheet opens (after the modal animates in).
  useEffect(() => {
    if (!task) {
      setHoverIndex(null);
      setSaving(false);
      setPageOffset(0);
      return;
    }
    const t = setTimeout(measureCells, 220);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);

  const measureCells = () => {
    cellRefs.current.forEach((ref, i) => {
      if (!ref) return;
      ref.measureInWindow((x, y, w, h) => {
        cellRects.current[i] = { x, y, w, h };
      });
    });
  };

  const indexAt = (ax: number, ay: number): number => {
    for (let i = 0; i < cellRects.current.length; i++) {
      const r = cellRects.current[i];
      if (!r) continue;
      if (ax >= r.x && ax <= r.x + r.w && ay >= r.y && ay <= r.y + r.h) {
        return i;
      }
    }
    return -1;
  };

  const onHover = (ax: number, ay: number) => {
    const idx = indexAt(ax, ay);
    setHoverIndex((prev) => {
      const next = idx >= 0 ? idx : null;
      if (next !== prev && next !== null) {
        Haptics.selectionAsync();
      }
      return next;
    });
  };

  const commit = (ax: number, ay: number) => {
    setHoverIndex(null);
    const idx = indexAt(ax, ay);
    if (idx < 0 || !task) return;
    const date = days[idx];
    const dueDate = formatISODate(date);
    if (task.dueDate === dueDate) {
      onClose();
      return;
    }
    setSaving(true);
    updateTask.mutate(
      { id: task.id, data: { dueDate } },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setSaving(false);
          onRescheduled();
          onClose();
        },
        onError: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setSaving(false);
        },
      },
    );
  };

  const pan = Gesture.Pan()
    .onStart(() => {
      dragging.value = 1;
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
      runOnJS(onHover)(e.absoluteX, e.absoluteY);
    })
    .onEnd((e) => {
      runOnJS(commit)(e.absoluteX, e.absoluteY);
      dragging.value = 0;
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    })
    .onFinalize(() => {
      dragging.value = 0;
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  const tokenStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: withSpring(dragging.value ? 1.05 : 1) },
    ],
    zIndex: dragging.value ? 50 : 1,
  }));

  let lastMonth = -1;

  return (
    <Modal
      visible={!!task}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.backdrop}>
          <View
            style={[
              styles.sheet,
              { backgroundColor: colors.card, paddingBottom: bottomInset / 2 + 16 },
            ]}
          >
            <View style={styles.handle} />
            {task ? (
              <>
                <Text
                  style={[styles.title, { color: colors.foreground }]}
                  numberOfLines={2}
                >
                  Reschedule
                </Text>
                <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                  Drag the task onto a day to set its due date.
                </Text>

                {/* Draggable task token */}
                <GestureDetector gesture={pan}>
                  <Animated.View
                    style={[
                      styles.token,
                      {
                        backgroundColor: colors.brand50,
                        borderColor: colors.primary,
                      },
                      tokenStyle,
                    ]}
                  >
                    <Feather name="move" size={15} color={colors.primary} />
                    <Text
                      style={[styles.tokenText, { color: colors.primary }]}
                      numberOfLines={1}
                    >
                      {task.title}
                    </Text>
                  </Animated.View>
                </GestureDetector>

                {/* Fortnight navigation */}
                <View style={styles.navRow}>
                  <TouchableOpacity
                    accessibilityLabel="Previous two weeks"
                    activeOpacity={0.7}
                    onPress={() => {
                      setHoverIndex(null);
                      setPageOffset((p) => p - 1);
                    }}
                    style={[styles.navBtn, { borderColor: colors.border }]}
                  >
                    <Feather
                      name="chevron-left"
                      size={18}
                      color={colors.foreground}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityLabel="Jump to current week"
                    activeOpacity={0.7}
                    onPress={() => {
                      setHoverIndex(null);
                      setPageOffset(0);
                    }}
                    style={styles.navLabelBtn}
                  >
                    <Text
                      style={[styles.navLabel, { color: colors.foreground }]}
                    >
                      {rangeLabel}
                    </Text>
                    {pageOffset !== 0 ? (
                      <Text
                        style={[styles.navToday, { color: colors.primary }]}
                      >
                        Back to today
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityLabel="Next two weeks"
                    activeOpacity={0.7}
                    onPress={() => {
                      setHoverIndex(null);
                      setPageOffset((p) => p + 1);
                    }}
                    style={[styles.navBtn, { borderColor: colors.border }]}
                  >
                    <Feather
                      name="chevron-right"
                      size={18}
                      color={colors.foreground}
                    />
                  </TouchableOpacity>
                </View>

                {/* Weekday header */}
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

                {/* Two-week grid */}
                <View style={styles.grid} onLayout={measureCells}>
                  {days.map((d, i) => {
                    const isToday = isSameDay(d, today);
                    const isDue = !!currentDue && isSameDay(d, currentDue);
                    const isHover = hoverIndex === i;
                    const showMonth = d.getMonth() !== lastMonth;
                    lastMonth = d.getMonth();
                    return (
                      <View
                        key={i}
                        ref={(r) => {
                          cellRefs.current[i] = r;
                        }}
                        style={[
                          styles.cell,
                          {
                            borderColor: isHover ? colors.primary : colors.border,
                            backgroundColor: isHover
                              ? colors.brand50
                              : isDue
                                ? colors.muted
                                : colors.card,
                            borderStyle: isHover ? "dashed" : "solid",
                            borderWidth: isHover || isDue ? 2 : 1,
                          },
                        ]}
                      >
                        {showMonth ? (
                          <Text
                            style={[styles.cellMonth, { color: colors.mutedForeground }]}
                          >
                            {d.toLocaleDateString(undefined, { month: "short" })}
                          </Text>
                        ) : null}
                        <View
                          style={[
                            styles.dayBubble,
                            isToday && { backgroundColor: colors.primary },
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayNum,
                              {
                                color: isToday ? "#fff" : colors.foreground,
                              },
                            ]}
                          >
                            {d.getDate()}
                          </Text>
                        </View>
                        {isDue ? (
                          <View
                            style={[styles.dueDot, { backgroundColor: colors.primary }]}
                          />
                        ) : null}
                      </View>
                    );
                  })}
                </View>

                <Text style={[styles.current, { color: colors.mutedForeground }]}>
                  {currentDue
                    ? `Currently due ${relativeLabel(currentDue)}`
                    : "Currently unscheduled"}
                </Text>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onClose}
                  disabled={saving}
                  style={[styles.closeBtn, { borderColor: colors.border }]}
                >
                  <Text style={[styles.closeText, { color: colors.inkSoft }]}>
                    {saving ? "Saving..." : "Close"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(17,19,42,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#cdd0e0",
    alignSelf: "center",
    marginBottom: 16,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 19 },
  hint: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 18,
  },
  token: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    maxWidth: "100%",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 18,
  },
  tokenText: { fontFamily: "Inter_600SemiBold", fontSize: 14, flexShrink: 1 },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabelBtn: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  navLabel: { fontFamily: "Inter_700Bold", fontSize: 15 },
  navToday: { fontFamily: "Inter_600SemiBold", fontSize: 11, marginTop: 2 },
  weekRow: { flexDirection: "row", marginBottom: 6 },
  weekLabel: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
    fontSize: 11,
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: `${100 / COLS}%`,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    marginBottom: 6,
  },
  cellMonth: {
    position: "absolute",
    top: 4,
    fontFamily: "Inter_600SemiBold",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  dayBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNum: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  dueDot: {
    position: "absolute",
    bottom: 6,
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  current: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },
  closeBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 16,
  },
  closeText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
