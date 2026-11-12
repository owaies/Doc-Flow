import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { parseTxtOrMdToHtml } from '@/utils/fileParser';
import { AuthProvider, useAuth } from '@/context/AuthContext';

const authMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
}));

vi.mock('@/utils/supabaseClient', () => ({
  supabase: { auth: authMocks },
}));

function AuthStateProbe() {
  const { user, loading } = useAuth();
  return React.createElement('output', { 'data-testid': 'auth-state' }, loading ? 'loading' : user?.id ?? 'signed-out');
}

// Simulation of DB authorization helper functions
function isDocumentOwner(doc: { owner_id: string }, userId: string): boolean {
  return doc.owner_id === userId;
}

function hasDocumentAccess(
  doc: { owner_id: string; id: string },
  userId: string,
  shares: { document_id: string; user_id: string; permission: string }[]
): boolean {
  if (doc.owner_id === userId) return true;
  return shares.some(s => s.document_id === doc.id && s.user_id === userId);
}

function canEditDocument(
  doc: { owner_id: string; id: string },
  userId: string,
  shares: { document_id: string; user_id: string; permission: string }[]
): boolean {
  if (doc.owner_id === userId) return true;
  return shares.some(s => s.document_id === doc.id && s.user_id === userId && s.permission === 'editor');
}

describe('DocFlow Core Logic & Upload Parsing Tests', () => {
  describe('TXT/MD File Upload Parsing', () => {
    test('converts plain text lines to HTML paragraphs', () => {
      const rawText = "Hello World\n\nThis is line 2.\nLine 3.";
      const html = parseTxtOrMdToHtml(rawText);
      expect(html).toBe('<p>Hello World</p><p><br></p><p>This is line 2.</p><p>Line 3.</p>');
    });

    test('handles empty files gracefully', () => {
      expect(parseTxtOrMdToHtml('')).toBe('');
    });

    test('escapes HTML-sensitive characters in imported text', () => {
      const html = parseTxtOrMdToHtml(`A & B <tag> "quoted" 'text'`);
      expect(html).toBe('<p>A &amp; B &lt;tag&gt; &quot;quoted&quot; &#39;text&#39;</p>');
    });
  });

  describe('Document Permissions & Authorization Rules', () => {
    const mockDocument = {
      id: 'doc-123',
      owner_id: 'user-owner',
      title: 'Secret Plans',
      content: 'Top secret content'
    };

    const mockShares = [
      { id: 's1', document_id: 'doc-123', user_id: 'user-editor', permission: 'editor' },
      { id: 's2', document_id: 'doc-123', user_id: 'user-viewer', permission: 'viewer' },
    ];

    test('Owner has full access (read, update, delete)', () => {
      const userId = 'user-owner';
      expect(isDocumentOwner(mockDocument, userId)).toBe(true);
      expect(hasDocumentAccess(mockDocument, userId, mockShares)).toBe(true);
      expect(canEditDocument(mockDocument, userId, mockShares)).toBe(true);
    });

    test('Editor can read and edit, but is not owner (cannot delete)', () => {
      const userId = 'user-editor';
      expect(isDocumentOwner(mockDocument, userId)).toBe(false);
      expect(hasDocumentAccess(mockDocument, userId, mockShares)).toBe(true);
      expect(canEditDocument(mockDocument, userId, mockShares)).toBe(true);
    });

    test('Viewer can read, but cannot edit or delete', () => {
      const userId = 'user-viewer';
      expect(isDocumentOwner(mockDocument, userId)).toBe(false);
      expect(hasDocumentAccess(mockDocument, userId, mockShares)).toBe(true);
      expect(canEditDocument(mockDocument, userId, mockShares)).toBe(false);
    });

    test('Unrelated user has zero access', () => {
      const userId = 'user-intruder';
      expect(isDocumentOwner(mockDocument, userId)).toBe(false);
      expect(hasDocumentAccess(mockDocument, userId, mockShares)).toBe(false);
      expect(canEditDocument(mockDocument, userId, mockShares)).toBe(false);
    });
  });

  describe('Document Save / Persistence State Mock', () => {
    test('transitions states from Saving to Saved on successful mock operation', async () => {
      let saveStatus = '';
      const saveFunction = vi.fn().mockImplementation(async () => {
        saveStatus = 'Saving...';
        await new Promise(resolve => setTimeout(resolve, 10));
        saveStatus = 'Saved';
      });

      await saveFunction();
      expect(saveFunction).toHaveBeenCalled();
      expect(saveStatus).toBe('Saved');
    });

    test('transitions states to Save failed on mock database error', async () => {
      let saveStatus = '';
      const saveFunction = vi.fn().mockImplementation(async () => {
        saveStatus = 'Saving...';
        await new Promise((_, reject) => setTimeout(() => reject(new Error('DB connection failed')), 10));
      });

      try {
        await saveFunction();
      } catch {
        saveStatus = 'Save failed';
      }
      expect(saveStatus).toBe('Save failed');
    });
  });

  describe('Authentication session initialization', () => {
    test('keeps a newer auth event when the initial session read resolves later', async () => {
      let resolveSession!: (value: { data: { session: { user: { id: string } } } }) => void;
      let authListener: ((event: string, session: { user: { id: string } } | null) => void) | undefined;
      const unsubscribe = vi.fn();

      authMocks.getSession.mockImplementation(() => new Promise(resolve => {
        resolveSession = resolve;
      }));
      authMocks.onAuthStateChange.mockImplementation((callback: typeof authListener) => {
        authListener = callback;
        return { data: { subscription: { unsubscribe } } };
      });

      render(React.createElement(AuthProvider, null, React.createElement(AuthStateProbe)));
      expect(screen.getByTestId('auth-state').textContent).toBe('loading');

      act(() => {
        authListener?.('SIGNED_IN', { user: { id: 'new-user' } });
      });
      expect(screen.getByTestId('auth-state').textContent).toBe('new-user');

      await act(async () => {
        resolveSession({ data: { session: { user: { id: 'stale-user' } } } });
        await Promise.resolve();
      });

      expect(screen.getByTestId('auth-state').textContent).toBe('new-user');
      expect(unsubscribe).not.toHaveBeenCalled();
    });
  });
});
