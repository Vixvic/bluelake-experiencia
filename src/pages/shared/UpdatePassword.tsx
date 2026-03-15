import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";

const UpdatePassword: React.FC = () => {
    const navigate = useNavigate();
    const { user, requiresPasswordChange, loading: authLoading } = useAuth();
    const { toast } = useToast();
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    // Si no está logueado o si no requiere cambio de password, que se vaya de aquí.
    if (authLoading) {
        return <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            </div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!requiresPasswordChange && !loading) {
         // Si por error entró acá y no necesita cambiar clave, mandarlo al inicio.
         return <Navigate to="/" replace />;
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            toast({
                variant: "destructive",
                title: "Las contraseñas no coinciden",
                description: "Por favor, verifica que escribiste la misma contraseña en ambos campos.",
            });
            return;
        }

        if (password.length < 6) {
             toast({
                variant: "destructive",
                title: "Contraseña muy corta",
                description: "Por favor usa al menos 6 caracteres para tu nueva contraseña.",
            });
            return;
        }

        setLoading(true);

        // 1. Actualizar contraseña en Auth
        const { error: updateError } = await supabase.auth.updateUser({ password });

        if (updateError) {
             setLoading(false);
             toast({
                variant: "destructive",
                title: "Error al actualizar",
                description: updateError.message,
            });
            return;
        }

        // 2. Apagar la bandera en la tabla profiles
        const { error: dbError } = await supabase
            .from('profiles')
            .update({ requires_password_change: false } as any)
            .eq('id', user.id);

        if (dbError) {
             console.error("Error quitando el flag:", dbError);
             // No interrumpimos la UX si falla el flag, pero lo ideal es documentarlo
        }
        
        // Finalizamos
        setLoading(false);
        toast({
            title: "¡Todo Listo!",
            description: "Tu contraseña ha sido actualizada por seguridad.",
        });

        // 3. Redirigir al panel final y refrescar estado local (en la vida real AuthContext tomará unos ms en refrescar)
        // Usamos un reload suave o navigate a una vista que revalide.
        // Simularemos mandarlo al dashboard, o forzar una actualización del contexto si fuera posible.
        // Dado que el componente no puede forzar mutate de Supabase, lo mejor es redirigir y que cargue de nuevo
        window.location.href = '/bluelake-experiencia/client/dashboard';
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                
                <div className="text-center mb-8">
                    <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-primary" />
                    <h1 className="text-2xl font-black text-foreground">
                        Actualiza tu Seguridad
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Como usaste una contraseña temporal enviada por WhatsApp, te pedimos que la cambies por una propia antes de continuar.
                    </p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 shadow-bluelake">
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-foreground mb-1.5 block">Nueva Contraseña</label>
                            <div className="relative">
                                <Input
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="pr-10"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-foreground mb-1.5 block">Confirmar Contraseña</label>
                            <Input
                                type={showPass ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                disabled={loading}
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full py-6 mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar y Continuar'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UpdatePassword;
