import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save, ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const ClientProfile: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [passChanged, setPassChanged] = useState(false);

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { navigate('/client/login'); return; }
            setEmail(user.email || '');
            const { data: profile } = await supabase.from('profiles').select('full_name, phone').eq('id', user.id).single();
            if (profile) {
                setFullName(profile.full_name || '');
                setPhone(profile.phone || '');
            }
            setLoading(false);
        };
        load();
    }, [navigate]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('profiles').update({ full_name: fullName, phone }).eq('id', user.id);
            toast.success('Perfil actualizado correctamente');
        }
        setSaving(false);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 8) {
            toast.error('La contraseña debe tener al menos 8 caracteres');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }
        setSaving(true);
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        setSaving(false);
        if (error) {
            toast.error('Error al cambiar contraseña: ' + error.message);
        } else {
            setPassChanged(true);
            setNewPassword('');
            setConfirmPassword('');
            toast.success('¡Contraseña actualizada! Ahora usa tu nueva contraseña al ingresar.');
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card sticky top-0 z-40">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
                    <Link to="/client/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="font-bold text-foreground">Mi Perfil</h1>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
                {/* Profile data */}
                <form onSubmit={handleSaveProfile} className="bg-card border border-border rounded-2xl p-6 space-y-4">
                    <h2 className="font-bold text-foreground text-lg">Datos personales</h2>

                    <div>
                        <label className="text-sm font-semibold text-foreground mb-1.5 block">Nombre completo</label>
                        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Tu nombre" />
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-foreground mb-1.5 block">Teléfono</label>
                        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+51 999 999 999" />
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-foreground mb-1.5 block">Correo electrónico</label>
                        <Input value={email} disabled className="bg-secondary/40 cursor-not-allowed" />
                        <p className="text-xs text-muted-foreground mt-1">El correo no puede cambiarse desde aquí.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/90 transition disabled:opacity-60"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar cambios
                    </button>
                </form>

                {/* Change password */}
                <form onSubmit={handleChangePassword} className="bg-card border border-border rounded-2xl p-6 space-y-4">
                    <div>
                        <h2 className="font-bold text-foreground text-lg">Cambiar contraseña</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Reemplaza tu contraseña temporal por una contraseña personal segura.
                        </p>
                    </div>

                    {passChanged && (
                        <div className="flex items-center gap-2 text-jungle bg-jungle/10 border border-jungle/30 rounded-lg p-3 text-sm font-semibold">
                            <CheckCircle2 className="w-4 h-4" />
                            Contraseña cambiada exitosamente
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-semibold text-foreground mb-1.5 block">Nueva contraseña</label>
                        <div className="relative">
                            <Input
                                type={showNew ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Mínimo 8 caracteres"
                                className="pr-10"
                            />
                            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-foreground mb-1.5 block">Confirmar nueva contraseña</label>
                        <div className="relative">
                            <Input
                                type={showConfirm ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repite tu contraseña"
                                className="pr-10"
                            />
                            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving || !newPassword}
                        className="flex items-center gap-2 px-5 py-2.5 bg-accent-orange text-white font-semibold rounded-xl text-sm hover:bg-accent-orange/90 transition disabled:opacity-60"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Cambiar contraseña
                    </button>
                </form>
            </main>
        </div>
    );
};

export default ClientProfile;
