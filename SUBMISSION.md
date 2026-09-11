# DocFlow Assessment Submission

## Live Demo
* Deployed URL: https://docflow-lyart-omega.vercel.app

## Summary
DocFlow is a polished, lightweight, collaborative document editor designed as a highly reliable Full-Stack MVP. It allows users to write rich-text documents, safely upload source materials (.txt, .md), and collaborate with other users by sharing access with Viewer (read-only) or Editor permissions.

## Core Features
* **Authentication**: Seamless Signup, Login, Logout, and Session persistence upon refresh.
* **Workspace Dashboard**: Distinct sections for owned ("My Documents") and shared ("Shared with Me") files with instant search filters and inline title rename/deletion actions.
* **Rich-Text TipTap Editor**: A professional toolbar with Bold, Italic, Underline, Headings (H1/H2), Bullet Lists, and Numbered Lists.
* **Debounced Autosave**: Status monitoring triggers (`Saving...`, `Saved`, `Save failed`) based on Supabase database synchronization.
* **Email-Based Sharing**: Look up other registered users via their exact email and assign Viewer or Editor permissions.
* **File & Attachment Handling**: Extract content from uploaded `.txt` and `.md` files directly into the editor pane. Support `.pdf` and `.docx` as raw file attachments.
* **File Preview Modal**: Seamlessly view `.pdf` and `.docx` attachments directly in the browser via native renderers and Microsoft Office Online Viewer integrations, complete with secure download functionality.
## Technical Architecture
* **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS, Lucide icons, TipTap.
* **Backend**: Supabase Auth (session management) and Supabase Storage (attachments).
* **Database**: PostgreSQL (Supabase database) with custom functions, triggers, and Row-Level Security policies.

## Security & Access Control
* Enforced recursion-free **Row-Level Security (RLS)** using `SECURITY DEFINER` PostgreSQL helper functions:
  * `is_document_owner`
  * `has_document_access`
  * `can_edit_document`
* Secure lookup RPC `get_profile_by_email` to allow email-based sharing lookup without exposing the entire user directory to the client.
* Private Supabase Storage bucket policy verifying document access on the `storage.objects` table using path-extracted document UUIDs.
* Trigger-based automatic `updated_at` timestamps on update.

## Testing & Build Verification
* **8/8 automated tests passed** (covers TXT/MD paragraph parsing, permission levels, and autosave state transitions).
* **Production build compiled successfully** without TypeScript, lint, or layout compilation errors.

## AI Workflow
* **Architecture**: Designing clean database layout, avoiding RLS recursion, and structuring Next.js Client Components.
* **Code Scaffolding & Component Development**: Bootstrapping state management, TipTap configs, and Tailwind CSS.
* **Debugging**: Resolved TypeScript setContent parameter errors during production build optimization.
* **Security & Documentation**: Assisted with RLS script reviews and walkthrough summaries.

## Scope Decisions
The following were deliberately deferred due to time constraints:
* Real-time collaboration (OT/CRDT)
* Comments & Mentions
* Document Version History
* Advanced enterprise RBAC/conversion options

## Known Limitations
* **First-time Share Lookup**: Sharing requires the collaborator's email to be registered in the public profiles table. If they have not signed up, lookups will fail with a "User not found" error.
