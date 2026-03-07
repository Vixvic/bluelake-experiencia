import React from 'react';
import { Eye } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const ViewLiveSiteButton: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleNavigate = () => {
        // Guardar la URL actual del panel en sessionStorage
        sessionStorage.setItem('adminReturnUrl', location.pathname);
        // Redirigir a la vista pública en la misma pestaña
        navigate('/');
    };

    return (
        <Button
            variant="outline"
            onClick={handleNavigate}
            className="hidden md:flex gap-2 items-center bg-white hover:bg-slate-100 text-slate-700 font-medium shadow-sm border border-slate-200"
            title="Ver sitio público en vivo"
        >
            <Eye className="w-4 h-4" />
            Ver Sitio en Vivo
        </Button>
    );
};
