import { Switch, Route, Router as WouterRouter } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
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
import { RoleProvider } from "@/lib/roles";
import IntelligenceDashboard from "@/pages/intel/IntelligenceDashboard";
import Leads from "@/pages/intel/Leads";
import LeadDetail from "@/pages/intel/LeadDetail";
import CampaignOps from "@/pages/intel/CampaignOps";
import CampaignOpsDetail from "@/pages/intel/CampaignOpsDetail";
import Opportunities from "@/pages/intel/Opportunities";
import Integrations from "@/pages/intel/Integrations";

// Attach the shared app token to mutating API requests. This token is bundled
// with the client by design and is not a per-user secret.
const API_ACCESS_TOKEN =
  (import.meta.env as Record<string, string | undefined>)
    .VITE_API_ACCESS_TOKEN ?? null;
setAuthTokenGetter(() => API_ACCESS_TOKEN);

const queryClient = new QueryClient();

// Vite's BASE_URL is used for asset loading. For client-side routing we want an
// empty base unless a real absolute sub-path was configured. A relative asset
// base ("." / "./") must map to "" so wouter matches routes from the root.
const RAW_BASE = import.meta.env.BASE_URL;
const ROUTER_BASE =
  !RAW_BASE || RAW_BASE === "/" || RAW_BASE === "." || RAW_BASE === "./"
    ? ""
    : RAW_BASE.replace(/\/$/, "");

// In the static demo build (VITE_DEMO_MODE), there is no backend for the
// Phase 1 Command Center, so the landing route is the Phase 3 Executive
// Intelligence Dashboard instead. Live builds keep the original Command Center.
const DEMO_MODE =
  (import.meta.env as Record<string, string | undefined>).VITE_DEMO_MODE === "1";

function Router() {
  return (
    <Switch>
      <Route path="/" component={DEMO_MODE ? IntelligenceDashboard : Dashboard} />
      <Route path="/welcome" component={Welcome} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/campaigns/:id" component={CampaignDetail} />
      <Route path="/tasks" component={TaskBoard} />
      <Route path="/assistant" component={AIAssistant} />
      <Route path="/collaboration" component={Collaboration} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/brand" component={BrandMemory} />
      <Route path="/intelligence" component={IntelligenceDashboard} />
      <Route path="/leads" component={Leads} />
      <Route path="/leads/:id" component={LeadDetail} />
      <Route path="/campaign-ops" component={CampaignOps} />
      <Route path="/campaign-ops/:campaignId" component={CampaignOpsDetail} />
      <Route path="/opportunities" component={Opportunities} />
      <Route path="/integrations" component={Integrations} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RoleProvider>
        <TooltipProvider>
          {/* The static demo build (no server, arbitrary mount path) uses hash
              routing so deep links work regardless of where it is served.
              Live builds use normal path-based routing at ROUTER_BASE. */}
          {DEMO_MODE ? (
            <WouterRouter hook={useHashLocation}>
              <Router />
            </WouterRouter>
          ) : (
            <WouterRouter base={ROUTER_BASE}>
              <Router />
            </WouterRouter>
          )}
          <Toaster />
        </TooltipProvider>
      </RoleProvider>
    </QueryClientProvider>
  );
}

export default App;
