import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  nextTaskId,
  seedCampaigns,
  seedTasks,
  seedThreads,
  type Campaign,
  type Task,
  type TaskStatus,
  type Thread,
} from "./data";

interface AppStateValue {
  tasks: Task[];
  setTasks: Dispatch<SetStateAction<Task[]>>;
  campaigns: Campaign[];
  setCampaigns: Dispatch<SetStateAction<Campaign[]>>;
  threads: Thread[];
  setThreads: Dispatch<SetStateAction<Thread[]>>;
  addTask: (input: Partial<Task> & { title: string; status: TaskStatus }) => void;
  moveTask: (id: string, status: TaskStatus) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addCampaign: (
    input: Partial<Campaign> & { name: string },
  ) => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [campaigns, setCampaigns] = useState<Campaign[]>(seedCampaigns);
  const [threads, setThreads] = useState<Thread[]>(seedThreads);

  const addTask: AppStateValue["addTask"] = (input) => {
    setTasks((prev) => [
      {
        id: nextTaskId(prev),
        priority: "medium",
        assignees: [],
        ...input,
      },
      ...prev,
    ]);
  };

  const moveTask: AppStateValue["moveTask"] = (id, status) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t)),
    );
  };

  const updateTask: AppStateValue["updateTask"] = (id, patch) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );
  };

  const deleteTask: AppStateValue["deleteTask"] = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const addCampaign: AppStateValue["addCampaign"] = (input) => {
    setCampaigns((prev) => [
      {
        id: `cmp-${prev.length + 1}-${Date.now()}`,
        owner: "You",
        ownerColor: "#4f46e5",
        status: "On Track",
        statusColor: "var(--c-emerald)",
        progress: 0,
        budget: "$0",
        spent: "$0",
        channels: [],
        ...input,
      },
      ...prev,
    ]);
  };

  return (
    <AppStateContext.Provider
      value={{
        tasks,
        setTasks,
        campaigns,
        setCampaigns,
        threads,
        setThreads,
        addTask,
        moveTask,
        updateTask,
        deleteTask,
        addCampaign,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return ctx;
}
