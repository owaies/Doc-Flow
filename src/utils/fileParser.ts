/**
 * Escapes user-supplied text before placing it inside TipTap-compatible HTML.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Parses raw text or markdown lines and converts them into structured HTML paragraphs
 * suitable for the TipTap editor.
 */
export function parseTxtOrMdToHtml(text: string): string {
  if (!text) return '';
  // UTF-8 text files may start with a BOM; it is metadata, not visible document text.
  const normalizedText = text.replace(/^\uFEFF/, '');
  if (!normalizedText) return '';

  return normalizedText
    .split(/\r\n|\n|\r/)
    .map(line => line.trim() ? `<p>${escapeHtml(line)}</p>` : '<p><br></p>')
    .join('');
}

/**
 * Read a browser File asynchronously and convert its contents for the editor.
 * Keeping the read in a promise lets callers await completion and handle errors.
 */
export async function parseTextFileToHtml(file: Pick<Blob, 'text'>): Promise<string> {
  return parseTxtOrMdToHtml(await file.text());
}
