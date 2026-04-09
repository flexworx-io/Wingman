import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Discovery from "./pages/Discovery";
import TrustLadder from "./pages/TrustLadder";
import SocialLounge from "./pages/SocialLounge";
import Travel from "./pages/Travel";
import Events from "./pages/Events";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import WingmanTV from "./pages/WingmanTV";
import DreamBoard from "./pages/DreamBoard";
import Auth from "./pages/Auth";
import SuperAdmin from "./pages/SuperAdmin";
import MaestroShowcase from "./pages/MaestroShowcase";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/discovery" component={Discovery} />
      <Route path="/trust" component={TrustLadder} />
      <Route path="/lounge" component={SocialLounge} />
      <Route path="/travel" component={Travel} />
      <Route path="/events" component={Events} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/profile" component={Profile} />
      <Route path="/wingman-tv" component={WingmanTV} />
      <Route path="/dream-board" component={DreamBoard} />
      <Route path="/admin" component={Admin} />
      <Route path="/super-admin" component={SuperAdmin} />
      <Route path="/maestro" component={MaestroShowcase} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "oklch(0.11 0.018 265 / 0.9)",
                border: "1px solid oklch(0.30 0.025 265 / 0.3)",
                color: "oklch(0.96 0.008 265)",
                backdropFilter: "blur(20px)",
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
