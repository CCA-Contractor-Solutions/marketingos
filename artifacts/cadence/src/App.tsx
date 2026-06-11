import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppStateProvider } from "./marketing/state/AppState";
import { Dashboard } from "./marketing/Dashboard";
import { CampaignDetail } from "./marketing/CampaignDetail";
import { TaskBoard } from "./marketing/TaskBoard";
import { Collaboration } from "./marketing/Collaboration";
import { Analytics } from "./marketing/Analytics";
import { AIAssistant } from "./marketing/AIAssistant";
import { BrandMemory } from "./marketing/BrandMemory";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/campaigns" component={CampaignDetail} />
      <Route path="/tasks" component={TaskBoard} />
      <Route path="/collaboration" component={Collaboration} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/assistant" component={AIAssistant} />
      <Route path="/brand" component={BrandMemory} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppStateProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AppStateProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
