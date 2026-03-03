import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, LogIn, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';

const ClientLogin: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (authError) {
            setError('Credenciales incorrectas. Verifica el email y la contraseña que recibiste.');
        } else {
            navigate('/client/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block">
                        <img
                            src="/bluelake-experiencia/logo-bluelake.png"
                            alt="Bluelake"
                            className="h-12 mx-auto mb-3"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                    </Link>
                    <h1 className="text-2xl font-black text-foreground">Portal de Cliente</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Accede con las credenciales recibidas por WhatsApp
                    </p>
                </div>

                <form onSubmit={handleLogin} className="bg-card border border-border rounded-2xl p-6 shadow-bluelake space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-foreground mb-1.5 block">Correo electrónico</label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-foreground mb-1.5 block">Contraseña temporal</label>
                        <div className="relative">
                            <Input
                                type={showPass ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Contraseña recibida"
                                required
                                autoComplete="current-password"
                                className="pr-10"
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

                    {error && (
                        <p className="text-sm text-destructive bg-destructive/5 rounded-lg p-3">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                        Ingresar
                    </button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-4">
                    ¿No hiciste una reserva?{' '}
                    <Link to="/#experiencias" className="text-primary hover:underline font-semibold">
                        Ver experiencias
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ClientLogin;
