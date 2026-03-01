import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo-bluelake.png';

const AuthPage: React.FC = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (authLoading) return (
    <div className="min-h-screen bg-primary-deep flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (user && isAdmin) return <Navigate to="/admin" replace />;
  if (user && !isAdmin) return <Navigate to="/" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (err) {
      setError(err.message);
    } else {
      setSuccess('Cuenta creada. Ahora pide al administrador del sistema que te asigne el rol admin desde el backend.');
      setEmail('');
      setPassword('');
      setFullName('');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-primary-deep flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mb-6 flex justify-center">
            <img
              src={logo}
              alt="Bluelake Logo"
              className="h-16 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-white">Bluelake Admin</h1>
          <p className="text-white/50 text-sm mt-1">Acceso al panel de administración</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-white/10 rounded-xl p-1 mb-4">
          <button
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'login' ? 'bg-white text-primary' : 'text-white/70 hover:text-white'}`}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'register' ? 'bg-white text-primary' : 'text-white/70 hover:text-white'}`}
          >
            Crear cuenta
          </button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="bg-white rounded-2xl p-8 space-y-4 shadow-lg">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@bluelake.com" required />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Contraseña</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-dark py-3 rounded-xl font-semibold">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Iniciar sesión
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="bg-white rounded-2xl p-8 space-y-4 shadow-lg">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Nombre completo</label>
              <Input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Tu nombre" required />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Contraseña</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && (
              <div className="flex items-start gap-2 bg-green-50 text-green-700 rounded-lg p-3 text-sm">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>{success}</p>
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-dark py-3 rounded-xl font-semibold">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Crear cuenta
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
