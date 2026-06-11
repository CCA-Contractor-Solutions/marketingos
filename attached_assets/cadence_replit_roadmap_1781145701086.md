# Cadence Web App Roadmap (Replit-Ready)

## Goal
Turn the static mockups into a fully functional Cadence web app in **stages**, starting with navigation and shared state.

---

## Stage 1: Core Structure
- Set up a new Replit React project (Node.js + React).
- Install dependencies: react, react-dom, react-router-dom, uuid, date-fns.
- Import all 6 screen components: Command Center, Campaign Detail, Tasks, AI Assistant, Collaboration, Analytics.
- Wrap the app in `BrowserRouter` for routing.

## Stage 2: Sidebar Navigation
- Map each sidebar item to its corresponding route.
- Implement basic navigation using `<Link>` or `<NavLink>` components.
- Ensure switching screens updates the browser view without errors.

## Stage 3: Shared State Setup
- Choose a state management approach: React Context, Zustand, or Redux.
- Create a global store for tasks, campaigns, and collaboration threads.
- Ensure all screens read/write from the shared state.

## Stage 4: Tasks Tab Placeholder Wiring
- Add state for selected Tasks tab (`Board`, `Calendar`, `Timeline`, `List`, `Workload`).
- Render the Board view (existing Kanban) and placeholder views for other tabs.
- Ensure clicking tabs updates the view without errors.

## Stage 5: Interactivity (Stage Review Optional)
- Wire up interactivity per screen incrementally:
    - Tasks: adding, editing, deleting tasks (local state or mock API)
    - Campaign Detail: Approve/Reject buttons
    - Collaboration: switching threads and replying
    - AI Assistant: inputs and responses
- Test each interactive component before proceeding to the next screen.

## Stage 6: Optional Mock API / JSON Data
- Introduce a mock data layer for realistic task/campaign/thread data.
- Replace placeholder content with data-driven components.
- Verify consistency across screens using the shared state.

## Stage 7: Responsive Layout & QA
- Test mobile and desktop layouts.
- Verify single-column behavior on narrow screens.
- Check console for errors and ensure typecheck/build passes.

## Stage 8: Review & Next Development
- Conduct review after Stage 3 or Stage 5 depending on progress.
- Adjust state or routing as needed before full interactivity implementation.
- Prepare for eventual real backend integration in a later phase.

---

**Notes:**  
- This roadmap is designed to build incrementally, reducing risk and allowing for review at multiple stages.  
- Stage 4 ensures Tasks tab behavior is stable before full interactivity.  
- Stage 6 is optional at first; mock API can be added after basic functionality works.
