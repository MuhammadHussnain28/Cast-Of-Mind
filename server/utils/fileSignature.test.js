import { describe, expect, it } from '@jest/globals';
import { detectFileType, isLegacyOfficeFile } from './fileSignature.js';
import { buildZip, docx } from '../test/zipFixture.js';
import { FILE_TYPES } from '../constants/uploads.js';

// Real leading bytes for each format, followed by filler so the buffers have
// a realistic length.
const headers = {
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  jpeg: [0xff, 0xd8, 0xff, 0xe0],
  webp: [0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50],
  pdf: [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34],
};

function buf(bytes, padding = 32) {
  return Buffer.concat([Buffer.from(bytes), Buffer.alloc(padding)]);
}

describe('detectFileType', () => {
  it('identifies PNG', () => {
    expect(detectFileType(buf(headers.png))).toBe(FILE_TYPES.PNG);
  });

  it('identifies JPEG', () => {
    expect(detectFileType(buf(headers.jpeg))).toBe(FILE_TYPES.JPEG);
  });

  it('identifies WebP, skipping the four size bytes between RIFF and WEBP', () => {
    expect(detectFileType(buf(headers.webp))).toBe(FILE_TYPES.WEBP);
  });

  it('identifies PDF', () => {
    expect(detectFileType(buf(headers.pdf))).toBe(FILE_TYPES.PDF);
  });

  // The reason this module exists.
  it('rejects a Windows executable (MZ header)', () => {
    expect(detectFileType(buf([0x4d, 0x5a, 0x90, 0x00]))).toBeNull();
  });

  it('rejects an ELF binary', () => {
    expect(detectFileType(buf([0x7f, 0x45, 0x4c, 0x46]))).toBeNull();
  });

  it('rejects a bare ZIP header with no directory', () => {
    expect(detectFileType(buf([0x50, 0x4b, 0x03, 0x04]))).toBeNull();
  });

  it('rejects a plain text file', () => {
    expect(detectFileType(Buffer.from('hello, this is not a document'))).toBeNull();
  });

  it('rejects an SVG, which can carry script', () => {
    expect(detectFileType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBeNull();
  });

  it('rejects an empty buffer', () => {
    expect(detectFileType(Buffer.alloc(0))).toBeNull();
  });

  it('rejects anything that is not a buffer', () => {
    expect(detectFileType(null)).toBeNull();
    expect(detectFileType(undefined)).toBeNull();
    expect(detectFileType('%PDF-1.4')).toBeNull();
  });

  it('rejects a buffer too short to hold a signature', () => {
    expect(detectFileType(Buffer.from([0x89, 0x50]))).toBeNull();
  });

  it('reads only the leading bytes — a PDF marker further in does not count', () => {
    const disguised = Buffer.concat([Buffer.from([0x4d, 0x5a]), Buffer.from('%PDF-1.4')]);
    expect(detectFileType(disguised)).toBeNull();
  });

  it('does not mistake RIFF alone for WebP', () => {
    // A WAV file is also RIFF, but carries "WAVE" at offset 8.
    const wav = buf([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45]);
    expect(detectFileType(wav)).toBeNull();
  });
});

describe('detectFileType — Word documents (8.4)', () => {
  it('identifies a real .docx', () => {
    expect(detectFileType(docx())).toBe(FILE_TYPES.DOCX);
  });

  it('refuses a .docm — Word with macros', () => {
    expect(detectFileType(docx({ 'word/vbaProject.bin': 'macro' }))).toBeNull();
  });

  it('refuses macros whatever the case of the name', () => {
    expect(detectFileType(docx({ 'word/VBAProject.BIN': 'macro' }))).toBeNull();
  });

  it('refuses an ordinary ZIP of other files', () => {
    expect(detectFileType(buildZip({ 'notes.txt': 'hi', 'photo.jpg': 'x' }))).toBeNull();
  });

  it('refuses an Excel workbook (.xlsx) — a ZIP, but not Word', () => {
    const xlsx = buildZip({ '[Content_Types].xml': '<x/>', 'xl/workbook.xml': '<x/>' });
    expect(detectFileType(xlsx)).toBeNull();
  });

  it('refuses a ZIP with word/document.xml but no content-types part', () => {
    expect(detectFileType(buildZip({ 'word/document.xml': '<x/>' }))).toBeNull();
  });

  it('refuses a ZIP whose directory is cut off', () => {
    const whole = docx();
    expect(detectFileType(whole.subarray(0, whole.length - 30))).toBeNull();
  });

  it('refuses a ZIP whose directory points past the end of the file', () => {
    const broken = Buffer.from(docx());
    broken.writeUInt32LE(0x7fffffff, broken.length - 6);
    expect(detectFileType(broken)).toBeNull();
  });

  it('refuses an executable renamed to .docx', () => {
    expect(detectFileType(buf([0x4d, 0x5a, 0x90, 0x00]))).toBeNull();
  });

  it('never accepts an old binary .doc', () => {
    const doc = buf([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    expect(detectFileType(doc)).toBeNull();
    expect(isLegacyOfficeFile(doc)).toBe(true);
  });

  it('does not call a PDF an old Office file', () => {
    expect(isLegacyOfficeFile(buf(headers.pdf))).toBe(false);
  });
});
