import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Welcome from "@/pages/Welcome";
import Dashboard from "@/pages/Dashboard";
import Campaigns from "@/pages/Campaigns";
import CampaignDetail from "@/pages/CampaignDetail";
import TaskBoard from "@/pages/TaskBoard";
import AIAssistant from "@/pages/AIAssistant";
import Collaboration from "@/pages/Collaboration";
import Analytics from "@/pages/Analytics";
import BrandMemory from "@/pages/BrandMemory";

// Attach the shared app token to mutating API requests. This token is bundled
// with the client by design and is not a per-user secret.
const API_ACCESS_TOKEN =
  (import.meta.env as Record<string, string | undefined>)
    .VITE_API_ACCESS_TOKEN ?? null;
setAuthTokenGetter(() => API_ACCESS_TOKEN);

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/welcome" component={Welcome} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/campaigns/:id" component={CampaignDetail} />
      <Route path="/tasks" component={TaskBoard} />
      <Route path="/assistant" component={AIAssistant} />
      <Route path="/collaboration" component={Collaboration} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/brand" component={BrandMemory} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
