import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Map, Calendar, Cloud, FileText, LogOut, Settings, Menu, X } from 'lucide-react';
import logo from '@/assets/logo-bluelake.png';

const AdminLayout: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const links = [
    { to: '/admin', label: 'Dashboard Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/bookings', label: 'Gestión de Reservas', icon: Calendar },
    { to: '/admin/tours', label: 'Catálogo de Tours', icon: Map },
    { to: '/admin/seasons', label: 'Lógica Estacional', icon: Cloud },
    { to: '/admin/contenido', label: 'Contenido Web', icon: FileText },
    { to: '/admin/settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-muted/30 relative">
      
      {/* ===== MOBILE HEADER ===== */}
      <div className="md:hidden flex items-center justify-between p-4 bg-sidebar border-b border-sidebar-border sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="Bluelake" className="h-8 w-auto" />
          <span className="font-bold text-sidebar-foreground text-sm">Bluelake Admin</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="text-sidebar-foreground/80 hover:text-white p-1"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* ===== OVERLAY ===== */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-64 bg-sidebar flex flex-col z-40 
        transition-transform duration-300 ease-in-out shrink-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
      `}>
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="Bluelake Admin Logo" className="h-8 w-auto" />
            <div>
              <span className="font-bold text-sidebar-foreground block text-sm">Bluelake Admin</span>
              <span className="text-xs text-sidebar-foreground/60">Panel de Control</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1" onClick={() => setIsMobileMenuOpen(false)}>
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        
        {/* Footer Area */}
        <div className="p-3 border-t border-sidebar-border space-y-2 mt-auto">
          <div className="flex items-center gap-2 px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-jungle animate-pulse" />
            <span className="text-xs font-medium text-sidebar-foreground">En línea</span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 w-full md:w-auto h-[calc(100vh-64px)] md:h-screen overflow-auto relative z-0">
        <div className="container mx-auto pb-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
