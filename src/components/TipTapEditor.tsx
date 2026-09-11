'use client';

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExtension from '@tiptap/extension-underline';
import { 
  Bold, Italic, Underline, Heading1, Heading2, 
  List, ListOrdered, Undo, Redo 
} from 'lucide-react';

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  readOnly: boolean;
}

export default function TipTapEditor({ content, onChange, readOnly }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
    ],
    content: content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Keep content and editable state in sync with parent props
  useEffect(() => {
    if (editor) {
        if (editor.getHTML() !== content) {
          editor.commands.setContent(content, { emitUpdate: false });
        }
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [readOnly, editor]);

  if (!editor) {
    return null;
  }

  const MenuButton = ({ 
    onClick, 
    active, 
    disabled = false, 
    children, 
    title 
  }: { 
    onClick: () => void; 
    active?: boolean; 
    disabled?: boolean; 
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || readOnly}
      title={title}
      className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
        active ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-600 dark:text-slate-400'
      } disabled:opacity-35`}
    >
      {children}
    </button>
  );

  return (
    <div className="w-full flex-1 flex flex-col border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all duration-300">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
            title="Underline"
          >
            <Underline className="h-4 w-4" />
          </MenuButton>

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </MenuButton>

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </MenuButton>

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </MenuButton>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 min-h-[400px] outline-none">
        <EditorContent 
          editor={editor} 
          className="prose dark:prose-invert max-w-none focus:outline-none min-h-[380px]"
        />
      </div>

      {/* Embedded styling override for ProseMirror inside EditorContent */}
      <style jsx global>{`
        .ProseMirror {
          outline: none;
          min-height: 385px;
        }
        .ProseMirror p {
          margin-bottom: 1em;
          line-height: 1.6;
        }
        .ProseMirror h1 {
          font-size: 2.25rem;
          font-weight: 800;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          line-height: 1.25;
        }
        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .ProseMirror li {
          margin-bottom: 0.25rem;
        }
      `}</style>
    </div>
  );
}
