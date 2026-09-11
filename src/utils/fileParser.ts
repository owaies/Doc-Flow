/**
 * Parses raw text or markdown lines and converts them into structured HTML paragraphs
 * suitable for the TipTap editor.
 */
export function parseTxtOrMdToHtml(text: string): string {
  if (!text) return '';
  return text
    .split(/\r?\n/)
    .map(line => line.trim() ? `<p>${line}</p>` : '<p><br></p>')
    .join('');
}
