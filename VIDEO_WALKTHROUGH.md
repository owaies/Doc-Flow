# DocFlow Video Walkthrough Plan (3-5 Minutes)

This guide outlines a screen-recording and narration walkthrough structure for presenting the DocFlow MVP.

---

## ⏱️ Video Timeline Outline

### 1. Introduction & Authentication (30s)
* **Action**: Start at the clean login/signup page. Explain what DocFlow is.
* **Action**: Log in using `user1@example.com` and show that the session successfully redirects to the dashboard.
* **Narration**: Explain that auth is persistent across refreshes.

### 2. Workspace Dashboard Overview (45s)
* **Action**: Point out "My Documents" (owned) and "Shared With Me" sections.
* **Action**: Search for a document, rename an existing document, and show the delete confirmation dialog (cancel/proceed).
* **Narration**: Explain the clear owner badges and collaborator view privileges.

### 3. Document Editing & Autosave (1m)
* **Action**: Click **+ New Document** ➔ Open the editor ➔ Type a title and paragraph.
* **Action**: Demo formatting: select text and apply **Bold**, *Italic*, <u>Underline</u>, a Heading 2, and a Bullet List.
* **Action**: Highlight the autosave status at the top shifting from `Saving...` to `Saved`.
* **Action**: Refresh the page to demonstrate that the text and formatting are fully persistent.

### 4. File Import / Upload (30s)
* **Action**: Click **Import File** ➔ Upload a `.txt` or `.md` file.
* **Action**: Show that the contents instantly load into the TipTap workspace and auto-saves.
* **Narration**: Mention that the files are backed up in a private Supabase Storage bucket.

### 5. Document Sharing & Permissions (1m)
* **Action**: Click **Share** ➔ Enter `user2@example.com` ➔ Grant **Viewer** access.
* **Action**: Log out of User 1 ➔ Log in as User 2.
* **Action**: Open the document from "Shared With Me". Attempt to edit (show that keyboard inputs are ignored and the toolbar is hidden).
* **Action**: Log back in as User 1 ➔ Open the share modal ➔ Update User 2's role to **Editor**.
* **Action**: Log back in as User 2 ➔ Open the document and make edits ➔ Show that autosave successfully runs.

### 6. Architecture & Scope Summary (30s)
* **Action**: Show the `db.sql` layout or describe the RLS policies briefly.
* **Narration**: Sum up the recursion-free database permissions, the Vercel-ready build status, and the scope decisions (deferring real-time collaboration/comments for MVP reliability).
