import React from 'react';
import { Settings, CreditCard, Key, Mail } from 'lucide-react';
import { ViewLiveSiteButton } from '@/components/admin/ViewLiveSiteButton';

const AdminSettings: React.FC = () => {
    return (
        <div className="p-8 max-w-[1400px] mx-auto min-h-screen bg-slate-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Ajustes Técnicos</h1>
                    <p className="text-sm text-slate-500 mt-1">Configuración interna, APIs y credenciales de la plataforma.</p>
                </div>
                <div className="flex items-center gap-3">
                    <ViewLiveSiteButton />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-[#0055ff]/50 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-[#0055ff]/10 group-hover:text-[#0055ff] transition-colors mb-4">
                        <CreditCard className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Pasarela de Pagos</h3>
                    <p className="text-sm text-slate-500">Configura tus credenciales de Stripe o PayPal para procesar las reservas online.</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-[#0055ff]/50 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-[#0055ff]/10 group-hover:text-[#0055ff] transition-colors mb-4">
                        <Mail className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Correos Automáticos</h3>
                    <p className="text-sm text-slate-500">Plantillas y configuración del servidor SMTP para notificaciones de reservas.</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-[#0055ff]/50 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-[#0055ff]/10 group-hover:text-[#0055ff] transition-colors mb-4">
                        <Key className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">APIs Externas</h3>
                    <p className="text-sm text-slate-500">Credenciales de Google Maps, Analytics y otros servicios conectados.</p>
                </div>
            </div>

            <div className="mt-8 p-6 bg-[#0055ff]/5 border border-[#0055ff]/20 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 bg-[#0055ff]/20 rounded-full flex items-center justify-center text-[#0055ff] shrink-0 mt-1">
                    <Settings className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-base font-bold text-[#0055ff] mb-1">Migración Exitosa</h4>
                    <p className="text-sm text-slate-600">
                        La configuración visual del "Carrusel Principal" y "Experiencia Destacada" ha sido trasladada al módulo de <strong>Contenido Web</strong>. Este espacio ahora está dedicado exclusivamente a configuraciones técnicas de backend.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
