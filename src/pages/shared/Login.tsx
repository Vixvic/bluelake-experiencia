import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, LogIn, Eye, EyeOff, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";

const Login: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAdmin, requiresPasswordChange, loading: authLoading } = useAuth();
    const { toast } = useToast();
    
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    // Magic Routing: If user is logged in, where should they go?
    useEffect(() => {
        if (!authLoading && user) {
            if (requiresPasswordChange) {
                navigate('/update-password', { replace: true });
            } else if (isAdmin) {
                navigate('/admin', { replace: true });
            } else {
                // If they came from a specific page, respect it, otherwise dashboard
                const from = (location.state as any)?.from?.pathname || '/client/dashboard';
                navigate(from, { replace: true });
            }
        }
    }, [user, isAdmin, requiresPasswordChange, authLoading, navigate, location.state]);

    if (authLoading || user) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-muted-foreground font-medium">Validando sesión...</p>
            </div>
        );
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) {
            toast({
                variant: "destructive",
                title: "Error de acceso",
                description: "Correo o contraseña incorrectos. Verifica tus credenciales.",
            });
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Signup call
        const { error: signUpErr } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } },
        });

        setLoading(false);

        if (signUpErr) {
             toast({
                variant: "destructive",
                title: "Error de Registro",
                description: signUpErr.message,
            });
        } else {
             toast({
                title: "Cuenta creada",
                description: "¡Bienvenido a Bluelake! Ya puedes reservar tus experiencias.",
            });
            // El useEffect de arriba los redirigirá automáticamente ya que `user` cambiará.
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo and Intro */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block">
                        <img
                            src="/bluelake-experiencia/logo-bluelake.png"
                            alt="Bluelake"
                            className="h-12 mx-auto mb-3"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                    </Link>
                    <h1 className="text-2xl font-black text-foreground">
                        {mode === 'login' ? 'Bienvenido a Bluelake' : 'Únete a la Aventura'}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {mode === 'login' 
                            ? 'Accede para ver tus reservas y panel administrativo' 
                            : 'Crea tu cuenta gratis para gestionar tus experiencias'}
                    </p>
                </div>

                {/* Tabs / Switcher */}
                <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
                    <button
                        onClick={() => setMode('login')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Iniciar Sesión
                    </button>
                    <button
                        onClick={() => setMode('register')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Crear Cuenta
                    </button>
                </div>

                {/* Form Wrapper */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-bluelake">
                    {mode === 'login' ? (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-foreground mb-1.5 block">Correo electrónico</label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@email.com"
                                    required
                                    autoComplete="email"
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-foreground mb-1.5 block">Contraseña</label>
                                <div className="relative">
                                    <Input
                                        type={showPass ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        autoComplete="current-password"
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
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full py-6 mt-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                                Ingresar
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-foreground mb-1.5 block">Nombre Completo</label>
                                <Input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Juan Pérez"
                                    required
                                    disabled={loading}
                                    minLength={3}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-foreground mb-1.5 block">Correo electrónico</label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@email.com"
                                    required
                                    autoComplete="email"
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-foreground mb-1.5 block">Crear Contraseña</label>
                                <div className="relative">
                                    <Input
                                        type={showPass ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Mínimo 6 caracteres"
                                        required
                                        minLength={6}
                                        autoComplete="new-password"
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
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full py-6 mt-2 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                                Crear Mi Cuenta
                            </Button>
                        </form>
                    )}
                </div>

                <p className="text-center text-sm text-muted-foreground mt-6">
                    <Link to="/#experiencias" className="hover:text-primary transition-colors hover:underline">
                        Volver al inicio y ver tours
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
