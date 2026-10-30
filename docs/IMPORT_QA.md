# DocFlow import regression plan

Test imports for supported text and document formats.

## Valid files
Import small plain-text and Markdown files with both lowercase and uppercase extensions, plus the supported document formats. Confirm leading/trailing spaces on non-empty lines are preserved and a BOM-only file creates an empty document.

## Invalid files
Reject unsupported extensions and oversized payloads with a clear error.

## Editor state
After a text import, keep the upload indicator active until the file has been read and the document save has completed. Verify read failures produce an error instead of silently finishing. Confirm the editor shows the imported content and autosave persists the result.

## Security
Treat imported filenames and contents as untrusted input and keep storage permissions aligned with the document owner.
