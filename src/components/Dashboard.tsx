'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabaseClient';
import { 
  Plus, FileText, Share2, Trash2, Edit3, Loader2, 
  ExternalLink, Search, Clock, Shield, Users 
} from 'lucide-react';

interface Document {
  id: string;
  title: string;
  content: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  owner_email?: string;
  permission?: 'editor' | 'viewer';
}

interface DashboardProps {
  onOpenDocument: (id: string) => void;
}

export default function Dashboard({ onOpenDocument }: DashboardProps) {
  const { user } = useAuth();
  const [myDocs, setMyDocs] = useState<Document[]>([]);
  const [sharedDocs, setSharedDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals / Actions states
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (!user) return;

      // 1. Fetch owned documents
      const { data: myData, error: myError } = await supabase
        .from('documents')
        .select('*')
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false });

      if (myError) throw myError;

      // 2. Fetch shared documents (joining documents and profiles)
      // Since relationships might need resolving, we do a clean two-step retrieval
      const { data: shareData, error: shareError } = await supabase
        .from('document_shares')
        .select('permission, document_id')
        .eq('user_id', user.id);

      if (shareError) throw shareError;

      let sharedList: Document[] = [];
      if (shareData && shareData.length > 0) {
        const docIds = shareData.map(s => s.document_id);
        const { data: docsData, error: docsError } = await supabase
          .from('documents')
          .select('*')
          .in('id', docIds);

        if (docsError) throw docsError;

        // Fetch owner profiles for email display
        const ownerIds = docsData ? Array.from(new Set(docsData.map(d => d.owner_id))) : [];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', ownerIds);

        if (profilesError) console.error('Could not load owner profiles:', profilesError);

        const profileMap = new Map(profilesData?.map(p => [p.id, p.email]));

        sharedList = (docsData || []).map(doc => {
          const shareInfo = shareData.find(s => s.document_id === doc.id);
          return {
            ...doc,
            permission: shareInfo?.permission,
            owner_email: profileMap.get(doc.owner_id) || 'Unknown Owner',
          };
        });
      }

      setMyDocs(myData || []);
      setSharedDocs(sharedList);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      setErrorMsg(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async () => {
    setActionLoading(true);
    try {
      if (!user) return;
      const newDoc = {
        title: 'Untitled Document',
        content: '<p>Start writing here...</p>',
        owner_id: user.id,
      };

      const { data, error } = await supabase
        .from('documents')
        .insert(newDoc)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        onOpenDocument(data.id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create document');
      setActionLoading(false);
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !renameValue.trim()) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('documents')
        .update({ title: renameValue })
        .eq('id', selectedDoc.id);

      if (error) throw error;
      
      // Update local state
      setMyDocs(prev => prev.map(d => d.id === selectedDoc.id ? { ...d, title: renameValue } : d));
      setIsRenameOpen(false);
      setSelectedDoc(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to rename document');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDoc) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', selectedDoc.id);

      if (error) throw error;

      // Update local state
      setMyDocs(prev => prev.filter(d => d.id !== selectedDoc.id));
      setIsDeleteOpen(false);
      setSelectedDoc(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete document');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const filteredMyDocs = myDocs.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSharedDocs = sharedDocs.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
      {/* Header section */}
      <div className="md:flex md:items-center md:justify-between mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Workspace</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create, edit, and collaborate on your rich-text documents.
          </p>
        </div>
        <button
          onClick={handleCreateDocument}
          disabled={actionLoading}
          className="inline-flex items-center space-x-2 px-5 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-200 dark:shadow-none hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all duration-200"
        >
          {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          <span>New Document</span>
        </button>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-sm text-red-600 dark:text-red-400 flex justify-between items-center">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="font-semibold underline">Dismiss</button>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6 max-w-md">
        <div className="relative rounded-xl shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
          <span className="mt-4 text-slate-500 text-sm font-medium">Loading documents...</span>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Section: My Documents */}
          <section aria-labelledby="my-documents-title">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-5 w-5 text-indigo-500" />
              <h2 id="my-documents-title" className="text-xl font-bold text-slate-900 dark:text-white">My Documents</h2>
            </div>
            
            {filteredMyDocs.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <FileText className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
                <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">No documents</h3>
                <p className="mt-1 text-sm text-slate-500">Get started by creating a new document.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredMyDocs.map((doc) => (
                  <div key={doc.id} className="relative group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-200 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                          <FileText className="h-5 w-5" />
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                          Owner
                        </span>
                      </div>
                      <h3 className="mt-4 font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        {doc.title}
                      </h3>
                      <div className="mt-2 flex items-center text-xs text-slate-400 dark:text-slate-500 space-x-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Updated {formatDate(doc.updated_at)}</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between space-x-2">
                      <button
                        onClick={() => onOpenDocument(doc.id)}
                        className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-150"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Open</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedDoc(doc);
                          setRenameValue(doc.title);
                          setIsRenameOpen(true);
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                        title="Rename"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedDoc(doc);
                          setIsDeleteOpen(true);
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section: Shared With Me */}
          <section aria-labelledby="shared-with-me-title">
            <div className="flex items-center space-x-2 mb-4">
              <Users className="h-5 w-5 text-purple-500" />
              <h2 id="shared-with-me-title" className="text-xl font-bold text-slate-900 dark:text-white">Shared With Me</h2>
            </div>

            {filteredSharedDocs.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <Share2 className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
                <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">No shared documents</h3>
                <p className="mt-1 text-sm text-slate-500">Documents shared with you by others will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredSharedDocs.map((doc) => (
                  <div key={doc.id} className="relative group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-purple-200 dark:hover:border-purple-900/50 transition-all duration-200 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                          <FileText className="h-5 w-5" />
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          doc.permission === 'editor' 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' 
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}>
                          {doc.permission === 'editor' ? 'Can Edit' : 'Can View'}
                        </span>
                      </div>
                      <h3 className="mt-4 font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                        {doc.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 truncate">
                        Owned by: {doc.owner_email}
                      </p>
                      <div className="mt-2 flex items-center text-xs text-slate-400 dark:text-slate-500 space-x-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Updated {formatDate(doc.updated_at)}</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-2">
                      <button
                        onClick={() => onOpenDocument(doc.id)}
                        className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-150"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Open</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* RENAME MODAL */}
      {isRenameOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Rename Document</h3>
            <form onSubmit={handleRename} className="mt-4">
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all"
                placeholder="Enter new title..."
              />
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsRenameOpen(false);
                    setSelectedDoc(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !renameValue.trim()}
                  className="px-4 py-2 text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Document</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to delete <strong className="font-semibold text-slate-700 dark:text-slate-350">"{selectedDoc.title}"</strong>? This action is permanent and cannot be undone.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteOpen(false);
                  setSelectedDoc(null);
                }}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-semibold rounded-xl text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-1.5"
              >
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
