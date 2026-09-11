'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogOut, FileText } from 'lucide-react';

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo / Brand */}
          <div className="flex items-center space-x-2.5 group">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-200 dark:shadow-none group-hover:scale-105 transition-transform duration-200">
              <FileText className="h-5 w-5" />
            </div>
            <span className="font-semibold text-xl tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              DocFlow
            </span>
          </div>

          {/* User Section */}
          {user && (
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs text-slate-400 dark:text-slate-500">Signed in as</span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{user.email}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
