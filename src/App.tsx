import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SeasonalProvider } from "@/contexts/SeasonalContext";
import "@/i18n";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TourDetailPage from "./pages/TourDetailPage";
import AuthPage from "./pages/AuthPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTours from "./pages/admin/AdminTours";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminSeasons from "./pages/admin/AdminSeasons";
import AdminCorporate from "./pages/admin/AdminCorporate";
import AdminSettings from "./pages/admin/AdminSettings";

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename="/bluelake-experiencia">
        <AuthProvider>
          <SeasonalProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/tours-iquitos/:slug" element={<TourDetailPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/admin" element={
                <ProtectedAdmin>
                  <AdminLayout />
                </ProtectedAdmin>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="tours" element={<AdminTours />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="seasons" element={<AdminSeasons />} />
                <Route path="corporate" element={<AdminCorporate />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SeasonalProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
