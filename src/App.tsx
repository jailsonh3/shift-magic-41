import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import EscalasPage from "@/pages/EscalasPage";
import FuncionariosPage from "@/pages/FuncionariosPage";
import SolicitacoesPage from "@/pages/SolicitacoesPage";
import MetasPage from "@/pages/MetasPage";
import NotificacoesPage from "@/pages/NotificacoesPage";
import RegrasPage from "@/pages/RegrasPage";
import PausasPage from "@/pages/PausasPage";
import ExportarPage from "@/pages/ExportarPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <LoginPage />;

  const isSupervisor = user?.role === 'supervisor';

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/escalas" element={<EscalasPage />} />
        {isSupervisor && <Route path="/funcionarios" element={<FuncionariosPage />} />}
        <Route path="/solicitacoes" element={<SolicitacoesPage />} />
        <Route path="/metas" element={<MetasPage />} />
        <Route path="/notificacoes" element={<NotificacoesPage />} />
        {isSupervisor && <Route path="/regras" element={<RegrasPage />} />}
        {isSupervisor && <Route path="/pausas" element={<PausasPage />} />}
        {isSupervisor && <Route path="/exportar" element={<ExportarPage />} />}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
