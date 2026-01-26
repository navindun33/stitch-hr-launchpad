import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import Index from "./pages/Index";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import TasksPage from "./pages/TasksPage";
import LeavePage from "./pages/LeavePage";
import PayrollPage from "./pages/PayrollPage";
import AttendancePage from "./pages/AttendancePage";
import DirectoryPage from "./pages/DirectoryPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import AuthPage from "./pages/AuthPage";
import AdminDashboard from "./pages/AdminDashboard";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="hira-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route path="/home" element={<Index />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/super-admin-login" element={<SuperAdminLogin />} />
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/dashboard" element={<EmployeeDashboard />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/leave" element={<LeavePage />} />
            <Route path="/payroll" element={<PayrollPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/directory" element={<DirectoryPage />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
