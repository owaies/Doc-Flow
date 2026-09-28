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
  return text
    .split(/\r?\n/)
    .map(line => line.trim() ? `<p>${escapeHtml(line)}</p>` : '<p><br></p>')
    .join('');
}
