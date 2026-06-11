---
name: Gesture handlers inside a React Native Modal
description: Why drag/pan gestures need their own GestureHandlerRootView when rendered inside an RN Modal.
---

react-native-gesture-handler gestures (Pan, etc.) do NOT fire inside a React
Native `<Modal>` even though the app root already wraps everything in a
`GestureHandlerRootView` (in `app/_layout.tsx`). RN `Modal` renders into a
separate native view hierarchy that is outside that root.

**Fix:** wrap the modal's content in its own `<GestureHandlerRootView style={{flex:1}}>`.

**Why:** the root provider does not propagate into the Modal's detached view
tree, so without a nested root the GestureDetector silently receives no touches
(especially on Android).

**How to apply:** any sheet/modal that uses `GestureDetector` (e.g. the
drag-to-reschedule sheet) must nest its own `GestureHandlerRootView`.

For drag-to-drop hit-testing on mobile, measuring each drop cell with
`ref.measureInWindow(...)` into a rect array and comparing against the pan
gesture's `absoluteX/absoluteY` (re-measure on the grid's `onLayout` and shortly
after the modal animates in) is reliable and avoids container-relative math.
