import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import AdminDb from "@/pages/admin-db";
import NotFound from "@/pages/not-found";
import { LanguageProvider } from "@/contexts/language-context";
import { performanceMonitor } from "@/lib/performance-monitor";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin-db" component={AdminDb} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize performance monitoring in development
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    performanceMonitor.startMonitoring();
  }

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
