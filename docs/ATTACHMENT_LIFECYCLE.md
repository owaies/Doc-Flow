# DocFlow Attachment Lifecycle

DocFlow allows users to import text and markdown and store supported attachments in a private Supabase Storage bucket.

## Flow

1. The browser validates the extension and file size.
2. Text and markdown content is read locally and converted to editor-safe HTML.
3. Authenticated users can upload the original file to the attachments bucket.
4. An attachment record stores the document relationship and uploader identity.
5. The editor displays the resulting attachment metadata.

## Safety

Keep imported text escaped before converting it into TipTap-compatible HTML. Preserve the private storage boundary and avoid treating a generated URL as a permission check.
