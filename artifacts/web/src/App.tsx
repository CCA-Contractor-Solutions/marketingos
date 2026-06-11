import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Campaigns from "@/pages/Campaigns";
import CampaignDetail from "@/pages/CampaignDetail";
import TaskBoard from "@/pages/TaskBoard";
import AIAssistant from "@/pages/AIAssistant";
import Collaboration from "@/pages/Collaboration";
import Analytics from "@/pages/Analytics";
import BrandMemory from "@/pages/BrandMemory";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
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
