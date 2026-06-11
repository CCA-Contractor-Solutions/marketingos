---
name: Mobile local notifications (Cadence)
description: How reminders/notifications work in the Expo app and the data contract they depend on.
---

# Mobile reminders

Cadence mobile uses **local scheduled notifications** (`expo-notifications`), NOT remote push — remote push was removed from Expo Go SDK 53+. All scheduling logic lives client-side in `artifacts/mobile/hooks/useNotifications.tsx`.

**Why local-only:** Expo skill mandates frontend-only logic and Expo Go cannot receive remote push.

## Data contract
- Task reminders depend on `Task.dueAt` — a machine-readable nullable ISO timestamp, separate from the human display string `dueDate` ("Tomorrow", "Oct 12"). `dueDate` is NOT parseable; never schedule off it.
- `dueAt` column (`due_at`) lives on the tasks table; seeded relative to seed time so reminders stay meaningful. Reseed (truncate seeded tables) to pick up new seed values — `seedDatabase()` skips when campaigns table is non-empty.
- Campaign "awaiting approval" is detected via `status` matching `/pending/i` (seed uses "Pending Approval"; created campaigns use "pending").

## Scheduling rules
- Task: `status !== 'done'` and future `dueAt` → fire at `dueAt - 24h`, or `now + 5s` if already within the 24h window. Overdue/past `dueAt` is skipped.
- Dedup via `getAllScheduledNotificationsAsync` keyed by `content.data.key` plus a persisted `delivered` set in AsyncStorage; disabling clears the delivered set so re-enabling reschedules.
- SDK 54 `setNotificationHandler` uses `shouldShowBanner`/`shouldShowList` (NOT the old `shouldShowAlert`).
- Deep-link via `addNotificationResponseReceivedListener` + cold-start `getLastNotificationResponseAsync`: task → `/(tabs)/tasks`, campaign → `/campaign/${id}`.
- Guard everything on `Platform.OS !== 'web'`.
