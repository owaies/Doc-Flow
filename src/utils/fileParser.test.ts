import { describe, expect, it } from 'vitest';
import { parseTxtOrMdToHtml } from './fileParser';

describe('parseTxtOrMdToHtml', () => {
  it('escapes HTML-sensitive characters in imported text', () => {
    expect(parseTxtOrMdToHtml('<img src=x onerror=alert(1)>')).toBe(
      '<p>&lt;img src=x onerror=alert(1)&gt;</p>',
    );
  });

  it('preserves blank lines as editable paragraphs', () => {
    expect(parseTxtOrMdToHtml('First\n\nSecond')).toBe(
      '<p>First</p><p><br></p><p>Second</p>',
    );
  });
});
