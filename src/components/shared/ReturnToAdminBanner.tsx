import React, { useEffect, useState } from 'react';
import { XCircle, EyeOff } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const ReturnToAdminBanner: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [returnUrl, setReturnUrl] = useState<string | null>(null);

    useEffect(() => {
        // Al cargar el componente o cambiar de ruta, verificamos si existe un returnUrl
        const url = sessionStorage.getItem('adminReturnUrl');

        // Solo mostrar el banner en las vistas públicas (rutas que no son /admin o /client)
        if (url && !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/client')) {
            setReturnUrl(url);
        } else {
            setReturnUrl(null);
        }
    }, [location.pathname]);

    const handleReturn = () => {
        if (returnUrl) {
            sessionStorage.removeItem('adminReturnUrl');
            navigate(returnUrl);
        }
    };

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        sessionStorage.removeItem('adminReturnUrl');
        setReturnUrl(null);
    };

    if (!returnUrl) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="bg-slate-900 border border-slate-700/50 shadow-2xl rounded-xl p-1 flex items-center gap-1 backdrop-blur-md">
                <button
                    onClick={handleReturn}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg transition-colors group"
                >
                    <EyeOff className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Cerrar vista y volver
                </button>
                <div className="w-px h-6 bg-slate-700/50 mx-1"></div>
                <button
                    onClick={handleClose}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="Ocultar este botón"
                >
                    <XCircle className="w-4 h-4" />
                </button>
            </div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mr-2 bg-slate-900/60 px-2 py-0.5 rounded backdrop-blur-sm">
                Modo Previsualización Admin
            </div>
        </div>
    );
};
