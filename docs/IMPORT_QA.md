# DocFlow import regression plan

Test imports for supported text and document formats.

## Valid files
Import a small plain-text file, a Markdown file, and the supported document formats.

## Invalid files
Reject unsupported extensions and oversized payloads with a clear error.

## Editor state
After an import, verify the editor shows the imported content and autosave persists the result.

## Security
Treat imported filenames and contents as untrusted input and keep storage permissions aligned with the document owner.
