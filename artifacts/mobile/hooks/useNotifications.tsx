import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useListCampaigns,
  useListTasks,
  type CampaignSummary,
  type Task,
} from "@workspace/api-client-react";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";

const OPT_IN_KEY = "cadence.notifications.optIn";
const DELIVERED_KEY = "cadence.notifications.delivered";

// How far ahead of a task's due date we remind the user.
const TASK_LEAD_MS = 24 * 60 * 60 * 1000;
// Small delay used when a notification should fire "now" so the OS has a moment
// to register the scheduled trigger.
const SOON_MS = 5 * 1000;

const isSupported = Platform.OS !== "web";

type NotificationData = {
  type: "task" | "campaign";
  key: string;
  taskId?: string;
  campaignId?: string;
};

type NotificationsContextValue = {
  optedIn: boolean;
  /** True while a permission request / toggle is in flight. */
  busy: boolean;
  /** Set when the user enabled reminders but the OS denied permission. */
  permissionDenied: boolean;
  setOptedIn: (next: boolean) => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

// Foreground presentation: show the banner + list entry even when the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function loadDelivered(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(DELIVERED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

async function saveDelivered(keys: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(DELIVERED_KEY, JSON.stringify([...keys]));
  } catch {
    // Non-fatal: dedup is best-effort.
  }
}

function routeForData(data: NotificationData | undefined): void {
  if (!data) return;
  if (data.type === "campaign" && data.campaignId) {
    router.push(`/campaign/${data.campaignId}`);
  } else if (data.type === "task") {
    router.push("/(tabs)/tasks");
  }
}

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [optedIn, setOptedInState] = useState(false);
  const [busy, setBusy] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const reconcilingRef = useRef(false);

  const tasksQuery = useListTasks();
  const campaignsQuery = useListCampaigns();
  const tasks = tasksQuery.data;
  const campaigns = campaignsQuery.data;

  // Restore the persisted opt-in choice on mount.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(OPT_IN_KEY);
        if (active && raw === "true") setOptedInState(true);
      } catch {
        // ignore
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Configure the Android notification channel once.
  useEffect(() => {
    if (!isSupported || Platform.OS !== "android") return;
    Notifications.setNotificationChannelAsync("reminders", {
      name: "Reminders",
      importance: Notifications.AndroidImportance.HIGH,
    }).catch(() => {});
  }, []);

  // Deep-link handling: taps while the app is running, plus a cold-start check.
  useEffect(() => {
    if (!isSupported) return;
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        routeForData(
          response.notification.request.content.data as
            | NotificationData
            | undefined,
        );
      },
    );
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) {
          routeForData(
            response.notification.request.content.data as
              | NotificationData
              | undefined,
          );
        }
      })
      .catch(() => {});
    return () => sub.remove();
  }, []);

  const reconcile = useCallback(async () => {
    if (!isSupported || !optedIn) return;
    if (!tasks || !campaigns) return;
    if (reconcilingRef.current) return;
    reconcilingRef.current = true;
    try {
      const now = Date.now();
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const existingKeys = new Set(
        scheduled
          .map(
            (s) =>
              (s.content.data as NotificationData | undefined)?.key ??
              undefined,
          )
          .filter((k): k is string => Boolean(k)),
      );
      const delivered = await loadDelivered();
      let deliveredChanged = false;

      const ensure = async (
        key: string,
        title: string,
        body: string,
        data: NotificationData,
        fireAt: number,
      ) => {
        if (existingKeys.has(key) || delivered.has(key)) return;
        await Notifications.scheduleNotificationAsync({
          content: { title, body, data },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(fireAt),
          },
        });
        existingKeys.add(key);
        delivered.add(key);
        deliveredChanged = true;
      };

      for (const task of tasks as Task[]) {
        if (task.status === "done" || !task.dueAt) continue;
        const due = new Date(task.dueAt).getTime();
        if (Number.isNaN(due) || due <= now) continue;
        const key = `task:${task.id}:${task.dueAt}`;
        const leadTime = due - TASK_LEAD_MS;
        const fireAt = leadTime > now ? leadTime : now + SOON_MS;
        await ensure(
          key,
          "Task due soon",
          `"${task.title}" is approaching its due date.`,
          { type: "task", key, taskId: task.id },
          fireAt,
        );
      }

      for (const campaign of campaigns as CampaignSummary[]) {
        if (!/pending/i.test(campaign.status)) continue;
        const key = `campaign:${campaign.id}:${campaign.status}`;
        await ensure(
          key,
          "Campaign awaiting approval",
          `"${campaign.name}" is waiting for your approval.`,
          { type: "campaign", key, campaignId: campaign.id },
          now + SOON_MS,
        );
      }

      if (deliveredChanged) await saveDelivered(delivered);
    } catch {
      // Scheduling is best-effort; failures should not crash the app.
    } finally {
      reconcilingRef.current = false;
    }
  }, [optedIn, tasks, campaigns]);

  // Re-run reconciliation whenever opt-in state or the underlying data changes.
  useEffect(() => {
    void reconcile();
  }, [reconcile]);

  const setOptedIn = useCallback(async (next: boolean) => {
    setBusy(true);
    try {
      if (next) {
        if (isSupported) {
          const current = await Notifications.getPermissionsAsync();
          let granted = current.granted;
          if (!granted && current.canAskAgain) {
            const requested = await Notifications.requestPermissionsAsync();
            granted = requested.granted;
          }
          if (!granted) {
            setPermissionDenied(true);
            setOptedInState(false);
            await AsyncStorage.setItem(OPT_IN_KEY, "false");
            return;
          }
        }
        setPermissionDenied(false);
        setOptedInState(true);
        await AsyncStorage.setItem(OPT_IN_KEY, "true");
      } else {
        setOptedInState(false);
        await AsyncStorage.setItem(OPT_IN_KEY, "false");
        if (isSupported) {
          await Notifications.cancelAllScheduledNotificationsAsync().catch(
            () => {},
          );
        }
        // Clearing delivered keys lets reminders re-schedule if re-enabled.
        await AsyncStorage.removeItem(DELIVERED_KEY).catch(() => {});
      }
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <NotificationsContext.Provider
      value={{ optedIn, busy, permissionDenied, setOptedIn }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider",
    );
  }
  return ctx;
}
