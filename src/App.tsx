
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { PrintJobProvider } from "./contexts/PrintJobContext";
import { initPrintJobService } from "./services/PrintJobService";
import { initWebSocketService } from "./services/WebSocketService";
import { appConfig } from "./config/appConfig";

// Initialize services
try {
  initPrintJobService(appConfig.apiBaseUrl);
  initWebSocketService(appConfig.wsUrl);
} catch (error) {
  console.error('Failed to initialize services:', error);
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PrintJobProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </PrintJobProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
