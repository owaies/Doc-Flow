import { describe, expect, it } from 'vitest';
import { parseTextFileToHtml, parseTxtOrMdToHtml } from './fileParser';

describe('parseTxtOrMdToHtml', () => {
  it('escapes HTML-sensitive characters in imported text', () => {
    expect(parseTxtOrMdToHtml('<img src=x onerror=alert(1)>')).toBe(
      '<p>&lt;img src=x onerror=alert(1)&gt;</p>',
    );
  });

  it('strips a leading UTF-8 BOM from imported text', () => {
    expect(parseTxtOrMdToHtml('\uFEFFFirst line')).toBe('<p>First line</p>');
  });

  it('preserves blank lines as editable paragraphs', () => {
    expect(parseTxtOrMdToHtml('First\n\nSecond')).toBe(
      '<p>First</p><p><br></p><p>Second</p>',
    );
  });

  it('supports classic Mac carriage-return line endings', () => {
    expect(parseTxtOrMdToHtml('First\rSecond')).toBe('<p>First</p><p>Second</p>');
  });
  it('returns an empty document for empty input', () => {
    expect(parseTxtOrMdToHtml('')).toBe('');
  });

  it('treats a BOM-only text file as an empty document', () => {
    expect(parseTxtOrMdToHtml('\\uFEFF')).toBe('');
  });

  it('preserves leading and trailing spaces on non-empty lines', () => {
    expect(parseTxtOrMdToHtml('  First line  \\n\\tSecond')).toBe(
      '<p>  First line  </p><p>\\tSecond</p>',
    );
  });

  it('awaits browser text-file reads before returning editor HTML', async () => {
    const file = { text: async () => '\\uFEFFImported text' } as Pick<Blob, 'text'>;

    await expect(parseTextFileToHtml(file)).resolves.toBe('<p>Imported text</p>');
  });

  it('propagates text-file read failures to the import handler', async () => {
    const file = {
      text: async () => {
        throw new Error('read failed');
      },
    } as Pick<Blob, 'text'>;

    await expect(parseTextFileToHtml(file)).rejects.toThrow('read failed');
  });

});