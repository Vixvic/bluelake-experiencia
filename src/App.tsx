import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SeasonalProvider } from "@/contexts/SeasonalContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import "@/i18n";
import Index from "./pages/Index";
import AboutPage from "./pages/AboutPage";
import NotFound from "./pages/NotFound";
import TourDetailPage from "./pages/TourDetailPage";
import AuthPage from "./pages/AuthPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTours from "./pages/admin/AdminTours";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminSeasons from "./pages/admin/AdminSeasons";
import AdminContenido from "./pages/admin/AdminContenido";
import AdminSettings from "./pages/admin/AdminSettings";
import ClientLogin from "./pages/client/ClientLogin";
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientProfile from "./pages/client/ClientProfile";
import ItineraryVoucher from "./pages/client/ItineraryVoucher";
import { ReturnToAdminBanner } from "@/components/shared/ReturnToAdminBanner";

const queryClient = new QueryClient();

function ProtectedAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!isAdmin) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function ProtectedClient({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/client/login" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename="/bluelake-experiencia">
        <AuthProvider>
          <CurrencyProvider>
            <SeasonalProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/nosotros" element={<AboutPage />} />
                <Route path="/tours-iquitos/:slug" element={<TourDetailPage />} />
                <Route path="/auth" element={<AuthPage />} />

                {/* Client Portal */}
                <Route path="/client/login" element={<ClientLogin />} />
                <Route path="/client/dashboard" element={<ProtectedClient><ClientDashboard /></ProtectedClient>} />
                <Route path="/client/profile" element={<ProtectedClient><ClientProfile /></ProtectedClient>} />
                <Route path="/client/itinerary/:id" element={<ItineraryVoucher />} />

                {/* Admin */}
                <Route path="/admin" element={
                  <ProtectedAdmin>
                    <AdminLayout />
                  </ProtectedAdmin>
                }>
                  <Route index element={<AdminDashboard />} />
                  <Route path="tours" element={<AdminTours />} />
                  <Route path="bookings" element={<AdminBookings />} />
                  <Route path="seasons" element={<AdminSeasons />} />
                  <Route path="contenido" element={<AdminContenido />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
              {/* Banner global de previsualización para administradores */}
              <ReturnToAdminBanner />
            </SeasonalProvider>
          </CurrencyProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
