import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { ChatProvider } from "@/context/chat";

import Home from "@/pages/home";
import Analyze from "@/pages/analyze";
import Replies from "@/pages/replies";
import Mood from "@/pages/mood";
import Flags from "@/pages/flags";
import Rate from "@/pages/rate";
import DamageControl from "@/pages/damage-control";
import NextMove from "@/pages/next-move";
import Predict from "@/pages/predict";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/analyze" component={Analyze} />
      <Route path="/replies" component={Replies} />
      <Route path="/mood" component={Mood} />
      <Route path="/flags" component={Flags} />
      <Route path="/rate" component={Rate} />
      <Route path="/damage-control" component={DamageControl} />
      <Route path="/next-move" component={NextMove} />
      <Route path="/predict" component={Predict} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <ChatProvider>
            <Router />
          </ChatProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
