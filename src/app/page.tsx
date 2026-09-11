'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import AuthScreen from '@/components/AuthScreen';
import Dashboard from '@/components/Dashboard';
import EditorPage from '@/components/EditorPage';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
        <span className="mt-4 text-slate-500 text-sm font-medium">Loading DocFlow...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Navbar />
      
      {!user ? (
        <AuthScreen />
      ) : activeDocumentId ? (
        <EditorPage 
          documentId={activeDocumentId} 
          onBack={() => setActiveDocumentId(null)} 
        />
      ) : (
        <Dashboard 
          onOpenDocument={(id) => setActiveDocumentId(id)} 
        />
      )}
    </div>
  );
}

