import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  requiresPasswordChange: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAdmin: false,
  requiresPasswordChange: false,
  loading: true,
  signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    let isMounted = true;

    const fetchUserFlags = async (userId: string) => {
      try {
        // Ejecutar promesas en paralelo para Admin y Profile Flags
        const rolePromise = supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();
          
        const profilePromise = supabase
          .from('profiles')
          .select('requires_password_change')
          .eq('id', userId)
          .maybeSingle();

        const [roleRes, profileRes] = await Promise.all([rolePromise, profilePromise]);
        
        if (isMounted) {
            setIsAdmin(!!roleRes.data);
            setRequiresPasswordChange((profileRes.data as any)?.requires_password_change === true);
        }
      } catch (e) {
        console.error("Error fetching user flags", e);
        if (isMounted) {
            setIsAdmin(false);
            setRequiresPasswordChange(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, sess) => {
        if (!isMounted) return;
        setSession(sess);
        setUser(sess?.user ?? null);

        // Solo volvemos a bloquear la UI y pedir permisos si es un LOGIN limpio explícito.
        // Ignoramos eventos como 'TOKEN_REFRESHED' que ocurren al cambiar el foco de la ventana.
        if (_event === 'SIGNED_IN') {
          setLoading(true);
          setTimeout(async () => {
            if (sess?.user) await fetchUserFlags(sess.user.id);
            if (isMounted) setLoading(false);
          }, 0);
        } else if (_event === 'SIGNED_OUT') {
          setIsAdmin(false);
          setRequiresPasswordChange(false);
          setLoading(false);
        }
      }
    );

    const initializeAuth = async () => {
      try {
        const { data: { session: sess } } = await supabase.auth.getSession();
        if (!isMounted) return;
        setSession(sess);
        setUser(sess?.user ?? null);
        if (sess?.user) {
          await fetchUserFlags(sess.user.id);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, requiresPasswordChange, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
