
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any | null; data: any | null }>;
  signIn: (email: string, password: string) => Promise<{ error: any | null; data: any | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  signUp: async () => ({ error: null, data: null }),
  signIn: async () => ({ error: null, data: null }),
  signOut: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check if user is admin (for demo, we'll use email check)
        if (session?.user) {
          // In a real application, you would check against a database role
          // This is just a simple example using email
          const email = session.user.email;
          setIsAdmin(email === 'admin@printease.com');

          // If this is a new sign in, ensure the user record exists in public.users table
          if (event === 'SIGNED_IN') {
            setTimeout(() => {
              supabase
                .from('users')
                .upsert({
                  id: session.user.id,
                  email: session.user.email,
                  name: session.user.user_metadata?.name || null
                })
                .select()
                .then(({ error }) => {
                  if (error) {
                    console.error('Error creating/updating user record:', error);
                  } else {
                    console.log('User record created/updated successfully');
                  }
                });
            }, 0);
          }
        } else {
          setIsAdmin(false);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Existing session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      // Check if user is admin and create/update user record if logged in
      if (session?.user) {
        const email = session.user.email;
        setIsAdmin(email === 'admin@printease.com');

        // Ensure user record exists in public.users table
        setTimeout(() => {
          supabase
            .from('users')
            .upsert({
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name || null
            })
            .select()
            .then(({ error }) => {
              if (error) {
                console.error('Error creating/updating user record:', error);
              } else {
                console.log('User record created/updated successfully on session check');
              }
            });
        }, 0);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    console.log('Signing up user:', email);
    return await supabase.auth.signUp({
      email,
      password,
    });
  };

  const signIn = async (email: string, password: string) => {
    console.log('Signing in user:', email);
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  };

  const signOut = async () => {
    console.log('Signing out user');
    try {
      // First explicitly clear user data before signing out
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      
      // Clear cache by removing auth tokens from localStorage
      localStorage.removeItem('supabase.auth.token');
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut({
        scope: 'local' // Only sign out locally to avoid session conflicts
      });
      
      if (error) {
        console.error('Error during sign out:', error);
        throw error;
      }
      
      console.log('User successfully signed out');
      
      // Force a reload to clear any cached state in React components
      window.location.href = '/';
      
    } catch (err) {
      console.error('Exception during sign out:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
