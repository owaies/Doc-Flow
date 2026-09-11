'use client';

import React, { useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { Mail, Lock, Loader2, ArrowRight, Sparkles } from 'lucide-react';

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : undefined,
          },
        });
        if (signUpError) throw signUpError;
        setSuccessMessage('Account created successfully! Check your email to confirm registration or log in directly if auto-confirmed.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Dynamic colorful blobs behind the card */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center space-x-2">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
            <Sparkles className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            DocFlow
          </span>
        </div>
        <h1 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {isSignUp ? 'Create your account' : 'Sign in to DocFlow'}
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Or{' '}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setSuccessMessage(null);
            }}
            className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            {isSignUp ? 'log in to your existing account' : 'create a new account'}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow-xl border border-slate-200/50 dark:border-slate-800/80 sm:rounded-2xl sm:px-10 transition-colors duration-300">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-sm text-emerald-600 dark:text-emerald-400">
                {successMessage}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Email address
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all dark:text-white"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all dark:text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200 transform active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    <span>{isSignUp ? 'Register Account' : 'Sign In'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick instructions / Help */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
              MVP Quick Testing Tip
            </span>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 text-center leading-relaxed">
              Use a standard email like <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-mono">user1@example.com</code> and password <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-mono">password123</code> to quickly create accounts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
