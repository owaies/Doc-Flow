# DocFlow

DocFlow is a polished, lightweight, collaborative document workspace built as an intentionally scoped Full-Stack MVP for the AI-Native Full Stack Developer assessment.

🔗 **Live Demo**: [https://docflow-lyart-omega.vercel.app/](https://docflow-lyart-omega.vercel.app/)

---

## 🚀 Overview
DocFlow provides a clean, focused, distraction-free writing experience. Users can manage their own documents, import local content files (.txt, .md), and securely share access with specific collaborators (as either Editors or Viewers).

---

## ✨ Features
- **Authentication**: Secure Sign-up, Sign-in, and Sign-out flow powered by Supabase Auth with persistence.
- **Document CRUD**: Create, read, rename, and delete documents with clean confirmation dialogs.
- **Rich-Text Editing**: Writing interface powered by TipTap, supporting Bold, Italic, Underline, Headings (H1/H2), bulleted lists, numbered lists, and undo/redo operations.
- **Autosave**: Debounced client-side auto-saving with visible status indication (`Saving...`, `Saved`, `Save failed`).
- **Persistence**: Content survives browser refresh, backed by a relational PostgreSQL database.
- **Sharing**: Share documents by entering a collaborator's email. Supports Viewer (read-only) and Editor permissions.
- **Owner/Editor/Viewer Permissions**: Security-definer policies enforce that viewers cannot edit, editors cannot delete, and only owners can manage sharing.
- **TXT/MD Import**: Upload `.txt` and `.md` files directly into the editor.
- **Private File Storage**: Backs up imported attachments to a secure private Supabase Storage bucket.
- **Responsive UI**: Optimized viewport breaks ensuring layout displays correctly on Desktop, Tablet, and Mobile.
- **Automated Testing**: Unit tests verifying core business logic.

---

## 🛠️ Tech Stack
- **Next.js**: Framework for pages and logic
- **TypeScript**: Typed safety
- **Tailwind CSS**: Visual layout styling
- **Supabase**: Backend-as-a-service (Auth & Storage client)
- **PostgreSQL**: Relational database storage
- **TipTap**: WYSIWYG editor engine
- **Vercel**: Deployment hosting platform
- **Vitest**: JavaScript testing library

---

## 📐 Architecture
```text
Browser
   ↓
Next.js
   ↓
Supabase
   ├── Auth
   ├── PostgreSQL
   ├── RLS
   └── Storage
```

---

## 🗄5 Database Schema

The database is built on four core tables in the `public` schema:
* **`profiles`**: Stores user email mapping. Populated automatically via a trigger on `auth.users` creation.
* **`documents`**: Main document details, featuring `owner_id`, auto-updated timestamps, and the document HTML content.
* **`document_shares`**: Enforces relational permissions mapping user IDs to permissions (`editor` or `viewer`) on documents.
* **`attachments`**: Metadata of files uploaded under the document workspace.

---

## ⚙️ Local Setup

### Prerequisites
- Node.js (v18+)
- A Supabase Project

### Installation
1. **Clone the repository and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env.local` file at the root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. **Supabase Database Setup**:
   - Open your Supabase Project Dashboard.
   - Navigate to the **SQL Editor** ➔ Click **New Query**.
   - Paste the contents of `db.sql`.
   - Execute the script.

4. **Supabase Storage Setup**:
   - Navigate to **Storage** ➔ Click **New Bucket**.
   - Name it exactly `attachments`.
   - Keep the bucket **Private** and click **Create**.

5. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Testing

To run the unit test suite:
```bash
npm test
```

---

## 📦 Production Build

To test building the application for production:
```bash
npm run build
```

---

## 🌐 Deployment to Vercel

The application is deployed and live at:
🔗 **[https://docflow-lyart-omega.vercel.app/](https://docflow-lyart-omega.vercel.app/)**

To deploy to production using Vercel CLI:
1. Initialize project setup:
   ```bash
   npx vercel
   ```
2. Configure the production environment variables:
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy to production:
   ```bash
   npx vercel --prod
   ```

---

## 🧠 AI Workflow Documentation
AI was utilized for the following aspects of development:
* **Architecture**: Designed database relationship logic and mapped out recursion-free Row-Level Security policies.
* **Code Scaffolding**: Initialized Next.js components, TipTap extensions, and Supabase client structures.
* **Component Development**: Tailored Dashboard grids, responsive viewport styling, and Auth forms.
* **Debugging**: Resolved TypeScript type mismatch warnings on TipTap `setContent` commands.
* **Testing**: Set up Vitest mocks for authentication context and permission testing.
* **Security & Review**: Handled storage RLS policy design and secure collaborator email lookup checks.

*Validation Note*: All AI-generated configurations, layouts, and logic scripts were manually reviewed, compiled, and validated using automated tests.

---

## 🛡️ Scope Decisions
The following features were intentionally deferred to prioritize MVP core stability:
* **Real-time collaboration**: Focus placed on solid debounced autosaves.
* **Comments & Mentions**: Kept layout focused on distraction-free writing space.
* **Version History**: Deferred to avoid complex document diffing algorithms.
* **Advanced Permissions / File Conversion**: Kept to core Editor/Viewer levels and direct TXT/MD reading.

---

## ⚠️ Known Limitations
* **Pre-Registration Share Constraint**: A document can only be shared with users who have already registered their accounts in the public `profiles` table. If the email is unknown, lookups will fail with a "User not found" message.
