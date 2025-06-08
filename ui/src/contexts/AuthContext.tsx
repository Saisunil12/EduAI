
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
  }>;
  signUp: (email: string, password: string) => Promise<{
    error: Error | null;
  }>;
  signOut: () => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<{
    error: Error | null;
    data: { user: User | null; session: Session | null } | null;
  }>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;

    const initializeAuth = async () => {
      try {
        // First, check for existing session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
          setIsLoading(false);
          return;
        }
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Set up auth state listener with error handling
        try {
          const { data } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              if (!mounted) return;
              
              setSession(session);
              setUser(session?.user ?? null);
              
              if (event === 'SIGNED_IN') {
                navigate('/dashboard');
              } else if (event === 'SIGNED_OUT') {
                cleanupAuthState();
                navigate('/auth');
              }
            }
          );
          
          authListener = data;
        } catch (listenerError) {
          console.error('Error setting up auth listener:', listenerError);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [navigate]);

  const cleanupAuthState = () => {
    // Remove standard auth tokens
    localStorage.removeItem("supabase.auth.token");
    // Remove all Supabase auth keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("supabase.auth.") || key.includes("sb-")) {
        localStorage.removeItem(key);
      }
    });
    // Remove from sessionStorage if in use
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith("supabase.auth.") || key.includes("sb-")) {
        sessionStorage.removeItem(key);
      }
    });
  };

  const signIn = async (email: string, password: string) => {
    if (!email || !password) {
      return { 
        error: new Error('Please enter both email and password') 
      };
    }

    // Clean up any existing auth state first
    cleanupAuthState();
    
    setIsLoading(true);
    
    try {
      // Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      
      if (error) {
        console.error('Login error:', error);
        
        let errorMessage = 'Invalid email or password';
        
        if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please verify your email before signing in. Check your inbox for a verification link.';
          setShowResendVerification(true);
        } else if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'The email or password you entered is incorrect.';
        } else if (error.message.includes('Email rate limit exceeded') || 
                  error.message.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please wait a few minutes and try again.';
        } else if (error.message.includes('Network error')) {
          errorMessage = 'Unable to connect to the server. Please check your internet connection.';
        }
        
        console.log('Login failed:', errorMessage);
        
        return { 
          error: new Error(errorMessage) 
        };
      }
      
      // If we get here, login was successful
      // The auth state listener will handle the navigation
      console.log('Login successful, user:', data.user?.email);
      return { error: null };
      
    } catch (error) {
      console.error('Unexpected error during login:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred during login';
      
      return { 
        error: new Error(errorMessage)
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      // Clean up existing state
      cleanupAuthState();
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (!error) {
        toast({
          title: "Welcome!",
          description: "Please check your email for a confirmation link to complete your registration.",
        });
      }
      
      return { error };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error("Unknown error") };
    }
  };

  const resendConfirmationEmail = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });

      if (error) {
        console.error('Error resending confirmation email:', error);
        return { error, data: null };
      }

      toast({
        title: 'Verification email sent',
        description: 'Please check your inbox for the verification link.',
      });

      return { error: null, data };
    } catch (error) {
      console.error('Failed to resend confirmation email:', error);
      return {
        error: error instanceof Error ? error : new Error('Failed to resend confirmation email'),
        data: null
      };
    }
  };

  const signOut = async () => {
    // Clean up auth state
    cleanupAuthState();
    
    // Attempt global sign out
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch (err) {
      // Ignore errors
    }
    
    // Force page reload for a clean state
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
        resendConfirmationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
