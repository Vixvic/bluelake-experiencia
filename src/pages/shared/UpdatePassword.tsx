import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import logo from '@/assets/logo-bluelake.png';

const UpdatePassword: React.FC = () => {
    const { user, isAdmin, loading: authLoading } = useAuth();
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

        try {
        // Actualizar mediante el servicio de autenticación, nunca mediante SQL.
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
            .update({ requires_password_change: false })
            .eq('id', user.id);

        if (dbError) {
              toast({ variant: "destructive", title: "Contraseña actualizada", description: "No pudimos completar la actualización de tu perfil. Vuelve a iniciar sesión con tu nueva contraseña." });
              return;
        }
        
        // Finalizamos
        setLoading(false);
        toast({
            title: "¡Todo Listo!",
            description: "Tu contraseña ha sido actualizada por seguridad.",
        });

        window.location.assign(`${import.meta.env.BASE_URL}${isAdmin ? 'admin' : 'client/dashboard'}`);
        } catch {
            toast({ variant: "destructive", title: "No se pudo completar el cambio", description: "Comprueba tu conexión e inténtalo nuevamente." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-primary-deep flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                
                <div className="text-center mb-8">
                    <div className="inline-block mb-6 flex items-center justify-center">
                        <img
                            src={logo}
                            alt="Bluelake Logo"
                            className="h-16 w-auto object-contain"
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-primary-foreground">
                        Cambiar contraseña
                    </h1>
                    <p className="text-primary-foreground/70 text-sm mt-2">
                        Establece una nueva contraseña para tu cuenta Bluelake.
                    </p>
                </div>

                <div className="bg-card rounded-2xl p-8 shadow-lg">
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div>
                            <label htmlFor="new-password" className="text-sm font-semibold text-foreground mb-1.5 block">Nueva Contraseña</label>
                            <div className="relative">
                                <Input
                                    id="new-password"
                                    autoComplete="new-password"
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="pr-10"
                                    disabled={loading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirm-password" className="text-sm font-semibold text-foreground mb-1.5 block">Confirmar Contraseña</label>
                            <Input
                                id="confirm-password"
                                autoComplete="new-password"
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
