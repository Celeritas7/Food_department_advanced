import React, { useEffect, useState } from 'react';
import supabase from '../config/supabase.js';

/**
 * AuthGate — renders children only with a Supabase session.
 * Google OAuth, same account as the other hub apps.
 */
export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    setError(null);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + import.meta.env.BASE_URL },
    });
    if (err) setError(err.message);
  };

  if (session === undefined) {
    return <div className="min-h-screen flex items-center justify-center text-warm-gray text-sm">Loading…</div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="text-4xl">🍳</div>
        <h1 className="text-xl font-bold text-charcoal">Food Department</h1>
        <p className="text-sm text-warm-gray">Sign in to see your kitchen.</p>
        <button onClick={signIn} className="px-5 py-2.5 rounded-xl bg-terracotta text-white font-semibold">
          Sign in with Google
        </button>
        {error && <p className="text-sm text-tomato">{error}</p>}
      </div>
    );
  }

  return children;
}

export const signOut = () => supabase.auth.signOut();
