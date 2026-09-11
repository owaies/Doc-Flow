'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabaseClient';
import TipTapEditor from './TipTapEditor';
import { parseTxtOrMdToHtml } from '@/utils/fileParser';
import { 
  ArrowLeft, Share2, Upload, FileText, Loader2, 
  Check, AlertCircle, Users, Plus, Trash2, Paperclip, X, Download
} from 'lucide-react';

interface EditorPageProps {
  documentId: string;
  onBack: () => void;
}

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  created_at: string;
}

interface ShareInfo {
  id: string;
  user_id: string;
  permission: 'editor' | 'viewer';
  profiles: {
    email: string;
  };
}

export default function EditorPage({ documentId, onBack }: EditorPageProps) {
  const { user } = useAuth();
  
  // Document states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [permission, setPermission] = useState<'editor' | 'viewer' | null>(null);
  
  // App States
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'Saving...' | 'Saved' | 'Save failed' | ''>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<Attachment | null>(null);

  // Sharing states
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<'editor' | 'viewer'>('viewer');
  const [collaborators, setCollaborators] = useState<ShareInfo[]>([]);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  // Refs for tracking changes and debounce
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);

  // 1. Fetch document and permissions
  useEffect(() => {
    if (user && documentId) {
      loadDocument();
    }
  }, [user, documentId]);

  const loadDocument = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (!user) return;

      // Fetch document
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (docError) {
        if (docError.code === 'PGRST116') {
          throw new Error('Document not found or you do not have permission to view it.');
        }
        throw docError;
      }

      const owned = doc.owner_id === user.id;
      setIsOwner(owned);
      setOwnerId(doc.owner_id);
      setTitle(doc.title);
      setContent(doc.content);

      // Determine permission if not owner
      if (!owned) {
        const { data: share, error: shareError } = await supabase
          .from('document_shares')
          .select('permission')
          .eq('document_id', documentId)
          .eq('user_id', user.id)
          .single();

        if (shareError) {
          throw new Error('You do not have access to this document.');
        }
        setPermission(share?.permission as 'editor' | 'viewer');
      } else {
        setPermission(null);
      }

      // Fetch attachments
      const { data: attachData, error: attachError } = await supabase
        .from('attachments')
        .select('*')
        .eq('document_id', documentId);

      if (!attachError) {
        setAttachments(attachData || []);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Collaborators (only for owner)
  const fetchCollaborators = async () => {
    setShareLoading(true);
    setShareError(null);
    try {
      // In Supabase, to fetch profiles through a join, we can select:
      // permission, user_id, id, profiles(email)
      const { data, error } = await supabase
        .from('document_shares')
        .select(`
          id,
          user_id,
          permission,
          profiles:user_id (
            email
          )
        `)
        .eq('document_id', documentId);

      if (error) throw error;
      setCollaborators((data || []) as unknown as ShareInfo[]);
    } catch (err: any) {
      console.error(err);
      setShareError('Failed to load collaborators.');
    } finally {
      setShareLoading(false);
    }
  };

  useEffect(() => {
    if (isShareOpen && isOwner) {
      fetchCollaborators();
    }
  }, [isShareOpen, isOwner]);

  // 3. Document Save Function
  const saveDocument = useCallback(async (updatedTitle: string, updatedContent: string) => {
    if (!user || (!isOwner && permission !== 'editor')) return;
    setSaveStatus('Saving...');
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          title: updatedTitle,
          content: updatedContent,
        })
        .eq('id', documentId);

      if (error) throw error;
      setSaveStatus('Saved');
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('Save failed');
    }
  }, [user, isOwner, permission, documentId]);

  // 4. Autosave Debouncing
  const handleContentChange = (newContent: string) => {
    setContent(newContent);

    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveDocument(title, newContent);
    }, 1200);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveDocument(newTitle, content);
    }, 1200);
  };

  // Clean timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // 5. File Upload Handler (TXT / MD)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);

    // Validations
    const isTextFile = file.name.endsWith('.txt') || file.name.endsWith('.md');
    const isDocFile = file.name.endsWith('.pdf') || file.name.endsWith('.docx');

    if (!isTextFile && !isDocFile) {
      setErrorMsg('Unsupported file type. Please upload a .txt, .md, .pdf, or .docx file.');
      return;
    }

    const sizeLimit = isTextFile ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > sizeLimit) {
      setErrorMsg(`File is too large. Maximum size allowed is ${isTextFile ? '2MB' : '5MB'}.`);
      return;
    }

    if (file.size === 0) {
      setErrorMsg('The uploaded file is empty.');
      return;
    }

    setUploading(true);

    try {
      // Step A: Read text and update editor content if it is a text/markdown file
      if (isTextFile) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const text = event.target?.result as string;
          const formattedHtml = parseTxtOrMdToHtml(text);
          
          // Load into editor and immediately save
          setContent(formattedHtml);
          await saveDocument(title, formattedHtml);
        };
        reader.readAsText(file);
      }

      // Step B: Attempt storage and attachments table insertion
      if (user) {
        const filePath = `${documentId}/${Date.now()}_${file.name}`;
        
        // Upload file to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Failed storage bucket upload:', uploadError);
          setErrorMsg(`Upload failed: ${uploadError.message || 'Storage bucket missing or permission denied'}`);
        } else {
          // Resolve public URL or direct resource URL
          const { data: { publicUrl } } = supabase.storage
            .from('attachments')
            .getPublicUrl(filePath);

          // Insert metadata in database
          const { data: attachRecord, error: attachTableError } = await supabase
            .from('attachments')
            .insert({
              document_id: documentId,
              file_name: file.name,
              file_url: publicUrl,
              uploaded_by: user.id,
            })
            .select()
            .single();

          if (attachTableError) throw attachTableError;
          if (attachRecord) {
            setAttachments(prev => [...prev, attachRecord]);
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'File upload failed');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  // 6. Grant/Add Collaborator Share
  const handleAddShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail.trim()) return;
    setShareLoading(true);
    setShareError(null);

    try {
      // Look up profile by exact email using the RPC function
      const { data: profile, error: rpcError } = await supabase
        .rpc('get_profile_by_email', { email_addr: shareEmail.trim() });

      if (rpcError) throw rpcError;

      if (!profile || profile.length === 0) {
        throw new Error('User not found. Ensure they have signed up first.');
      }

      const colabUserId = profile[0].id;

      if (colabUserId === user?.id) {
        throw new Error('You cannot share a document with yourself.');
      }

      // Insert share into database
      const { error: insertError } = await supabase
        .from('document_shares')
        .insert({
          document_id: documentId,
          user_id: colabUserId,
          permission: sharePermission,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('This user already has access to this document.');
        }
        throw insertError;
      }

      setShareEmail('');
      await fetchCollaborators();
    } catch (err: any) {
      console.error(err);
      setShareError(err.message || 'Failed to share document');
    } finally {
      setShareLoading(false);
    }
  };

  // 7. Revoke share
  const handleRemoveShare = async (shareId: string) => {
    setShareLoading(true);
    try {
      const { error } = await supabase
        .from('document_shares')
        .delete()
        .eq('id', shareId);

      if (error) throw error;
      setCollaborators(prev => prev.filter(c => c.id !== shareId));
    } catch (err: any) {
      console.error(err);
      setShareError('Failed to remove collaborator.');
    } finally {
      setShareLoading(false);
    }
  };

  const handleRemoveAttachment = async (attach: Attachment) => {
    try {
      // Delete metadata record
      const { error: dbError } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attach.id);

      if (dbError) throw dbError;

      // Extract storage path from url
      const pathParts = attach.file_url.split('/attachments/public/');
      const path = pathParts[1] ? decodeURIComponent(pathParts[1]) : '';
      if (path) {
        await supabase.storage.from('attachments').remove([path]);
      }

      setAttachments(prev => prev.filter(a => a.id !== attach.id));
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to remove attachment');
    }
  };

  const isEditable = isOwner || permission === 'editor';

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
        <span className="mt-4 text-slate-500 text-sm font-medium">Loading editor...</span>
      </div>
    );
  }

  if (errorMsg && !title) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Access Denied</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">{errorMsg}</p>
        <button
          onClick={onBack}
          className="mt-6 inline-flex items-center space-x-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 h-full relative">
      
      {/* Editor Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800 mb-6">
        <div className="flex items-center space-x-4 flex-1">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="flex-1 max-w-lg">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              disabled={!isEditable}
              className="w-full text-xl font-bold bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none transition-all py-1"
              placeholder="Untitled Document"
            />
            {/* Save Status Indicators */}
            <div className="flex items-center space-x-1.5 mt-1 text-xs text-slate-400">
              {saveStatus === 'Saving...' && (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />
                  <span>Saving...</span>
                </>
              )}
              {saveStatus === 'Saved' && (
                <>
                  <Check className="h-3 w-3 text-emerald-500" />
                  <span>Saved</span>
                </>
              )}
              {saveStatus === 'Save failed' && (
                <>
                  <AlertCircle className="h-3 w-3 text-red-500" />
                  <span className="text-red-500 font-medium">Save failed</span>
                </>
              )}
              {!saveStatus && <span>Loaded</span>}
            </div>
          </div>
        </div>

        {/* Action Panel Buttons */}
        <div className="flex items-center space-x-3">
          {/* File Upload (TXT/MD) */}
          {isEditable && (
            <label className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-sm font-semibold text-slate-750 dark:text-slate-300 cursor-pointer shadow-sm transition-all">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>Import File</span>
              <input
                type="file"
                accept=".txt,.md,.pdf,.docx"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}

          {/* Share Button (Only Document Owners can manage sharing) */}
          {isOwner && (
            <button
              onClick={() => setIsShareOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-sm transition-all"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-sm text-red-600 dark:text-red-400 flex justify-between items-center">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="font-semibold underline">Dismiss</button>
        </div>
      )}

      {/* Main Editing & Sidebar Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Editor (takes 3 cols) */}
        <div className="lg:col-span-3 flex flex-col h-full">
          <TipTapEditor 
            content={content} 
            onChange={handleContentChange} 
            readOnly={!isEditable} 
          />
        </div>

        {/* Sidebar (Attachments) - takes 1 col */}
        <div className="lg:col-span-1 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-slate-50/50 dark:bg-slate-900/20 shadow-sm flex flex-col space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-200 dark:border-slate-800">
            <Paperclip className="h-4.5 w-4.5 text-slate-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Attachments</h3>
          </div>

          {attachments.length === 0 ? (
            <div className="text-center py-6 select-none cursor-default">
              <span className="text-xs text-slate-400">No attachment files uploaded yet.</span>
            </div>
          ) : (
            <ul className="space-y-2">
              {attachments.map((file) => (
                <li 
                  key={file.id} 
                  className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800/80 rounded-xl text-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <button 
                    onClick={() => setPreviewFile(file)}
                    className="flex items-center space-x-2 text-indigo-600 hover:underline truncate mr-2 text-left"
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate max-w-[120px]">{file.file_name}</span>
                  </button>
                  
                  {isEditable && (
                    <button
                      onClick={() => handleRemoveAttachment(file)}
                      className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      title="Remove Attachment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* SHARING MODAL */}
      {isShareOpen && isOwner && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Share Document</h3>
              </div>
              <button
                onClick={() => setIsShareOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {shareError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400">
                {shareError}
              </div>
            )}

            {/* Grant access form */}
            <form onSubmit={handleAddShare} className="mt-4 flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                placeholder="collaborator@example.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all"
              />
              <div className="flex gap-2">
                <select
                  value={sharePermission}
                  onChange={(e) => setSharePermission(e.target.value as 'editor' | 'viewer')}
                  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                >
                  <option value="viewer">Can view</option>
                  <option value="editor">Can edit</option>
                </select>
                <button
                  type="submit"
                  disabled={shareLoading}
                  className="px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center space-x-1.5 text-sm"
                >
                  {shareLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Share</span>
                </button>
              </div>
            </form>

            {/* List of collaborators */}
            <div className="mt-6 flex-1 overflow-y-auto">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">People with access</h4>
              {shareLoading && collaborators.length === 0 ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                </div>
              ) : (
                <ul className="space-y-3">
                  {/* Show Owner (current user) */}
                  <li className="flex justify-between items-center py-2 px-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-transparent">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">You</span>
                      <span className="text-xs text-slate-400">Owner</span>
                    </div>
                  </li>
                  {/* Collaborators list */}
                  {collaborators.map((colab) => (
                    <li key={colab.id} className="flex justify-between items-center py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800/80 rounded-xl">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate pr-2">
                          {colab.profiles?.email || 'Unknown collaborator'}
                        </span>
                        <span className="text-xs text-slate-400 capitalize">{colab.permission}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveShare(colab.id)}
                        disabled={shareLoading}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        title="Remove Access"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate max-w-md">{previewFile.file_name}</h3>
              </div>
              <div className="flex items-center space-x-2">
                <a 
                  href={previewFile.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center space-x-1 text-sm font-medium"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-4 relative">
              {previewFile.file_name.endsWith('.pdf') ? (
                <iframe src={previewFile.file_url} className="w-full h-full rounded-xl border border-slate-200 dark:border-slate-800" title="PDF Preview" />
              ) : previewFile.file_name.endsWith('.docx') ? (
                <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewFile.file_url)}`} className="w-full h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white" title="DOCX Preview" />
              ) : (
                <iframe src={previewFile.file_url} className="w-full h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white" title="File Preview" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
