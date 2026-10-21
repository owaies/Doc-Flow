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
  return normalizedText
    .split(/\r\n|\n|\r/)
    .map(line => line.trim() ? `<p>${escapeHtml(line)}</p>` : '<p><br></p>')
    .join('');
}
