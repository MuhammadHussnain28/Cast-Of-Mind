import { FILE_TYPES } from '../constants/uploads.js';

// Identify a file by its actual leading bytes, not by its name or the MIME type
// the browser claimed.
//
// Both of those are attacker-controlled: a Windows executable renamed to
// "certificate.pdf" and sent as application/pdf passes every check that trusts
// the label. The bytes are the only part the sender cannot lie about while
// still producing a working file.
//
// Hand-rolled rather than pulling in `file-type`: a few formats, directly unit-testable.

// Longest signature we need to see (WebP needs 12 bytes).
const HEADER_BYTES = 12;

function startsWith(buffer, bytes, offset = 0) {
  if (buffer.length < offset + bytes.length) return false;
  return bytes.every((byte, i) => buffer[offset + i] === byte);
}

const SIGNATURES = [
  {
    type: FILE_TYPES.PNG,
    // \x89 P N G \r \n \x1a \n
    test: (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  },
  {
    type: FILE_TYPES.JPEG,
    // SOI marker, then any JPEG segment marker.
    test: (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  },
  {
    type: FILE_TYPES.WEBP,
    // "RIFF" .... "WEBP" — the four size bytes in between are skipped.
    test: (b) =>
      startsWith(b, [0x52, 0x49, 0x46, 0x46]) && startsWith(b, [0x57, 0x45, 0x42, 0x50], 8),
  },
  {
    type: FILE_TYPES.PDF,
    // "%PDF-"
    test: (b) => startsWith(b, [0x25, 0x50, 0x44, 0x46, 0x2d]),
  },
];

const ZIP_LOCAL = [0x50, 0x4b, 0x03, 0x04];
const OLE2 = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const MAX_ZIP_ENTRIES = 2000;

// Names of every entry in a ZIP, read from the central directory only.
// Nothing is decompressed, so a zip bomb costs nothing. Null if malformed.
function zipEntryNames(buffer) {
  const searchFrom = Math.max(0, buffer.length - 22 - 0xffff);
  let eocd = -1;
  for (let i = buffer.length - 22; i >= searchFrom; i -= 1) {
    if (buffer.readUInt32LE(i) === EOCD_SIGNATURE) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) return null;

  const count = buffer.readUInt16LE(eocd + 10);
  const dirOffset = buffer.readUInt32LE(eocd + 16);
  // ZIP64 markers or an absurd count: not a worksheet.
  if (count === 0xffff || dirOffset === 0xffffffff || count > MAX_ZIP_ENTRIES) return null;

  const names = [];
  let at = dirOffset;
  for (let n = 0; n < count; n += 1) {
    if (at + 46 > buffer.length || buffer.readUInt32LE(at) !== CENTRAL_SIGNATURE) return null;
    const nameLength = buffer.readUInt16LE(at + 28);
    const extraLength = buffer.readUInt16LE(at + 30);
    const commentLength = buffer.readUInt16LE(at + 32);
    if (at + 46 + nameLength > buffer.length) return null;
    names.push(buffer.toString('utf8', at + 46, at + 46 + nameLength));
    at += 46 + nameLength + extraLength + commentLength;
  }
  return names;
}

// A real Word document, and one with no macros (.docm carries vbaProject.bin).
function isMacroFreeDocx(buffer) {
  const names = zipEntryNames(buffer);
  if (!names) return false;
  const has = (name) => names.includes(name);
  const hasMacros = names.some((name) => name.toLowerCase().endsWith('vbaproject.bin'));
  return has('[Content_Types].xml') && has('word/document.xml') && !hasMacros;
}

/**
 * Sniff a buffer and return one of FILE_TYPES, or null if it is not a format we
 * accept. A ZIP is accepted only as a macro-free .docx; every other archive is null.
 *
 * @param {Buffer} buffer
 * @returns {string|null}
 */
export function detectFileType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return null;

  const header = buffer.subarray(0, HEADER_BYTES);
  if (startsWith(header, ZIP_LOCAL)) return isMacroFreeDocx(buffer) ? FILE_TYPES.DOCX : null;

  const match = SIGNATURES.find((signature) => signature.test(header));
  return match ? match.type : null;
}

// Old binary Office (.doc/.xls/.ppt) — never accepted; lets us say how to fix it.
export function isLegacyOfficeFile(buffer) {
  return Buffer.isBuffer(buffer) && startsWith(buffer, OLE2);
}

export default detectFileType;
