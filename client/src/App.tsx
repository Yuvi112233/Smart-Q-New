import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Home from "@/pages/home";
import SalonProfile from "@/pages/salon-profile";
import WaitingArea from "@/pages/waiting-area";
import UserProfile from "@/pages/user-profile";
import SalonDashboard from "@/pages/salon-dashboard";
import QueueManagement from "@/pages/queue-management";
import Analytics from "@/pages/analytics";
import EditProfile from "@/pages/edit-profile";
import ManageOffers from "@/pages/manage-offers";


function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/waiting-area/:salonId" component={WaitingArea} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/salon/:id" component={SalonProfile} />
          <Route path="/waiting-area/:salonId" component={WaitingArea} />
          <Route path="/profile" component={UserProfile} />
          <Route path="/salon-dashboard" component={SalonDashboard} />
          <Route path="/queue-management/:salonId" component={QueueManagement} />
          <Route path="/analytics/:salonId" component={Analytics} />
          <Route path="/edit-profile/:salonId" component={EditProfile} />
          <Route path="/manage-offers/:salonId" component={ManageOffers} />
         
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;