import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAdmin: false,
  loading: true,
  signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    let isMounted = true;

    const fetchRole = async (userId: string) => {
      try {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();
        if (isMounted) setIsAdmin(!!data);
      } catch {
        if (isMounted) setIsAdmin(false);
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
            if (sess?.user) await fetchRole(sess.user.id);
            if (isMounted) setLoading(false);
          }, 0);
        } else if (_event === 'SIGNED_OUT') {
          setIsAdmin(false);
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
          await fetchRole(sess.user.id);
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
    <AuthContext.Provider value={{ user, session, isAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
