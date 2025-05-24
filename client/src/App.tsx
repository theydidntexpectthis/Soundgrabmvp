import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import SearchPage from "@/pages/search";
import RecentPage from "@/pages/recent";
import DownloadsPage from "@/pages/downloads";
import SettingsPage from "@/pages/settings";
import LyricsSearchPage from "@/pages/lyrics-search";
import VoiceSearchPage from "@/pages/voice-search";
import { Layout } from "@/components/Layout";

function Router() {
  return (
    <Layout>
      <Switch>
        {/* Main routes */}
        <Route path="/" component={Home} />
        <Route path="/search" component={SearchPage} />
        <Route path="/lyrics-search" component={LyricsSearchPage} />
        <Route path="/recent" component={RecentPage} />
        <Route path="/downloads" component={DownloadsPage} />
        <Route path="/settings" component={SettingsPage} />
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
