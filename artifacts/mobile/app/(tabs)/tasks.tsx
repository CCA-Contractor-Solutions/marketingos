import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListTasksQueryKey,
  useCreateTask,
  useListTasks,
  useUpdateTask,
  type Task,
  type TaskInput,
} from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { useColors } from "@/hooks/useColors";

const STATUS_ORDER: Task["status"][] = [
  "backlog",
  "in_progress",
  "in_review",
  "done",
];

const STATUS_LABEL: Record<Task["status"], string> = {
  backlog: "Backlog",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

const STATUS_ACCENT: Record<
  Task["status"],
  "mutedForeground" | "sky" | "amber" | "emerald"
> = {
  backlog: "mutedForeground",
  in_progress: "sky",
  in_review: "amber",
  done: "emerald",
};

const PRIORITY_ACCENT: Record<Task["priority"], "rose" | "amber" | "sky"> = {
  high: "rose",
  medium: "amber",
  low: "sky",
};

export default function TasksScreen() {
  const colors = useColors();
  const topInset = useTopInset();
  const bottomInset = useBottomInset();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useListTasks();

  const [addOpen, setAddOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });

  const grouped = useMemo(() => {
    const map: Record<Task["status"], Task[]> = {
      backlog: [],
      in_progress: [],
      in_review: [],
      done: [],
    };
    (data ?? []).forEach((t) => map[t.status].push(t));
    return map;
  }, [data]);

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
          title="Tasks"
          subtitle={`${data.length} across the board`}
          right={
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAddOpen(true);
              }}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
            >
              <Feather name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          }
        />

        {data.length === 0 ? (
          <EmptyView
            icon="check-square"
            title="No tasks yet"
            body="Create your first task to get the board moving."
          />
        ) : (
          STATUS_ORDER.map((status) => {
            const tasks = grouped[status];
            if (tasks.length === 0) return null;
            return (
              <View key={status} style={{ marginBottom: 22 }}>
                <View style={styles.colHead}>
                  <View
                    style={[
                      styles.colDot,
                      { backgroundColor: colors[STATUS_ACCENT[status]] },
                    ]}
                  />
                  <Text style={[styles.colTitle, { color: colors.foreground }]}>
                    {STATUS_LABEL[status]}
                  </Text>
                  <Text style={[styles.colCount, { color: colors.mutedForeground }]}>
                    {tasks.length}
                  </Text>
                </View>
                <View style={{ gap: 10 }}>
                  {tasks.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      activeOpacity={0.85}
                      onPress={() => setEditTask(t)}
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
                          {t.aiGenerated ? (
                            <View
                              style={[
                                styles.aiTag,
                                { backgroundColor: colors.brand50 },
                              ]}
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
                              <View
                                key={i}
                                style={{ marginLeft: i === 0 ? 0 : -8 }}
                              >
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
              </View>
            );
          })
        )}
      </ScrollView>

      <AddTaskModal
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={invalidate}
      />
      <EditTaskModal
        task={editTask}
        onClose={() => setEditTask(null)}
        onUpdated={invalidate}
      />
    </View>
  );
}

function AddTaskModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const colors = useColors();
  const bottomInset = useBottomInset();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const createTask = useCreateTask();

  const reset = () => {
    setTitle("");
    setPriority("medium");
  };

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const payload: TaskInput = {
      title: trimmed,
      status: "backlog",
      priority,
    };
    createTask.mutate(
      { data: payload },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          reset();
          onClose();
          onCreated();
        },
      },
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ width: "100%" }}
        >
          <View
            style={[
              styles.sheet,
              { backgroundColor: colors.card, paddingBottom: bottomInset / 2 + 16 },
            ]}
          >
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
              New task
            </Text>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
              Title
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="What needs to get done?"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  backgroundColor: colors.surface2,
                },
              ]}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={submit}
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
              Priority
            </Text>
            <View style={styles.segment}>
              {(["high", "medium", "low"] as const).map((p) => {
                const active = priority === p;
                return (
                  <TouchableOpacity
                    key={p}
                    activeOpacity={0.85}
                    onPress={() => setPriority(p)}
                    style={[
                      styles.segmentBtn,
                      {
                        backgroundColor: active ? colors.primary : colors.muted,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: active ? "#fff" : colors.inkSoft },
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.sheetActions}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onClose}
                style={[styles.ghostBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.ghostText, { color: colors.inkSoft }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={!title.trim() || createTask.isPending}
                onPress={submit}
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: !title.trim() || createTask.isPending ? 0.5 : 1,
                  },
                ]}
              >
                <Text style={styles.primaryText}>
                  {createTask.isPending ? "Adding..." : "Add task"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function EditTaskModal({
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
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onClose}
                style={[styles.ghostBtn, { borderColor: colors.border, marginTop: 16 }]}
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
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  colHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  colDot: { width: 9, height: 9, borderRadius: 5 },
  colTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  colCount: { fontFamily: "Inter_500Medium", fontSize: 13 },
  taskTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  taskTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, flex: 1, lineHeight: 21 },
  taskCampaign: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 5 },
  taskMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
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
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  segment: { flexDirection: "row", gap: 8 },
  segmentBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
  },
  segmentText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    textTransform: "capitalize",
  },
  sheetActions: { flexDirection: "row", gap: 10, marginTop: 22 },
  ghostBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  ghostText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  primaryBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
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
