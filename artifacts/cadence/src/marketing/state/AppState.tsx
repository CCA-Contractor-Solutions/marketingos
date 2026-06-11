import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  seedCampaigns,
  seedTasks,
  seedThreads,
  type Campaign,
  type Task,
  type Thread,
} from "./data";

interface AppStateValue {
  tasks: Task[];
  setTasks: Dispatch<SetStateAction<Task[]>>;
  campaigns: Campaign[];
  setCampaigns: Dispatch<SetStateAction<Campaign[]>>;
  threads: Thread[];
  setThreads: Dispatch<SetStateAction<Thread[]>>;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [campaigns, setCampaigns] = useState<Campaign[]>(seedCampaigns);
  const [threads, setThreads] = useState<Thread[]>(seedThreads);

  return (
    <AppStateContext.Provider
      value={{ tasks, setTasks, campaigns, setCampaigns, threads, setThreads }}
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
