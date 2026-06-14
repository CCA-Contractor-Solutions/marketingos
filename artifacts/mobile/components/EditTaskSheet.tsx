import { Feather } from "@expo/vector-icons";
import { useUpdateTask, type Task } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { parseDueDate, relativeLabel } from "@/lib/dates";
import { useBottomInset } from "@/components/ui";

export const STATUS_ORDER: Task["status"][] = [
  "backlog",
  "in_progress",
  "in_review",
  "done",
];

export const STATUS_LABEL: Record<Task["status"], string> = {
  backlog: "Backlog",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

export const STATUS_ACCENT: Record<
  Task["status"],
  "mutedForeground" | "sky" | "amber" | "emerald"
> = {
  backlog: "mutedForeground",
  in_progress: "sky",
  in_review: "amber",
  done: "emerald",
};

/**
 * Shared task detail / status sheet.
 *
 * Opened from both the status board (tasks.tsx) and the calendar view by
 * tapping a task. Lets the user move the task between board columns via the
 * same update-task API. Long-press on a card opens the RescheduleSheet instead.
 */
export function EditTaskSheet({
  task,
  onClose,
  onUpdated,
}: {
  task: Task | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const colors = useColors();
  const bottomInset = useBottomInset();
  const updateTask = useUpdateTask();

  const move = (status: Task["status"]) => {
    if (!task) return;
    updateTask.mutate(
      { id: task.id, data: { status } },
      {
        onSuccess: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onClose();
          onUpdated();
        },
      },
    );
  };

  const clearDueDate = () => {
    if (!task || updateTask.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateTask.mutate(
      { id: task.id, data: { dueDate: null } },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onClose();
          onUpdated();
        },
        onError: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        },
      },
    );
  };

  const due = task ? parseDueDate(task.dueDate) : null;

  return (
    <Modal
      visible={!!task}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.card, paddingBottom: bottomInset / 2 + 16 },
          ]}
        >
          <View style={styles.sheetHandle} />
          {task ? (
            <>
              <Text
                style={[styles.sheetTitle, { color: colors.foreground }]}
                numberOfLines={2}
              >
                {task.title}
              </Text>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Move to
              </Text>
              <View style={{ gap: 10 }}>
                {STATUS_ORDER.map((status) => {
                  const active = task.status === status;
                  return (
                    <TouchableOpacity
                      key={status}
                      activeOpacity={0.85}
                      disabled={active || updateTask.isPending}
                      onPress={() => move(status)}
                      style={[
                        styles.statusRow,
                        {
                          borderColor: active ? colors.primary : colors.border,
                          backgroundColor: active ? colors.brand50 : colors.card,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.colDot,
                          { backgroundColor: colors[STATUS_ACCENT[status]] },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusRowText,
                          { color: colors.foreground },
                        ]}
                      >
                        {STATUS_LABEL[status]}
                      </Text>
                      {active ? (
                        <Feather name="check" size={18} color={colors.primary} />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Due date
              </Text>
              {due ? (
                <TouchableOpacity
                  accessibilityLabel="Clear due date"
                  activeOpacity={0.8}
                  onPress={clearDueDate}
                  disabled={updateTask.isPending}
                  style={[styles.clearBtn, { borderColor: colors.rose }]}
                >
                  <Feather name="calendar" size={15} color={colors.rose} />
                  <Text style={[styles.clearText, { color: colors.rose }]}>
                    Clear due date · {relativeLabel(due)}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.unscheduledRow, { borderColor: colors.border }]}>
                  <Feather
                    name="calendar"
                    size={15}
                    color={colors.mutedForeground}
                  />
                  <Text
                    style={[styles.unscheduledText, { color: colors.mutedForeground }]}
                  >
                    Unscheduled
                  </Text>
                </View>
              )}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onClose}
                style={[styles.ghostBtn, { borderColor: colors.border, marginTop: 10 }]}
              >
                <Text style={[styles.ghostText, { color: colors.inkSoft }]}>
                  Close
                </Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  colDot: { width: 9, height: 9, borderRadius: 5 },
  modalBackdrop: {
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
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#cdd0e0",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: { fontFamily: "Inter_700Bold", fontSize: 19, marginBottom: 8 },
  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    marginTop: 14,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ghostBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  ghostText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 13,
  },
  clearText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  unscheduledRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 13,
  },
  unscheduledText: { fontFamily: "Inter_500Medium", fontSize: 15 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  statusRowText: { fontFamily: "Inter_600SemiBold", fontSize: 15, flex: 1 },
});
