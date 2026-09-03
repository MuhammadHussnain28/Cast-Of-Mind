import { FILE_TYPES } from '../constants/uploads.js';

// Identify a file by its actual leading bytes, not by its name or the MIME type
// the browser claimed.
//
// Both of those are attacker-controlled: a Windows executable renamed to
// "certificate.pdf" and sent as application/pdf passes every check that trusts
// the label. The bytes are the only part the sender cannot lie about while
// still producing a working file.
//
// Hand-rolled rather than pulling in `file-type`: four formats, and the whole
// thing is directly unit-testable.

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

/**
 * Sniff a buffer and return one of FILE_TYPES, or null if it is not a format we
 * accept. Anything unrecognised — including executables, archives and office
 * documents — returns null.
 *
 * @param {Buffer} buffer
 * @returns {string|null}
 */
export function detectFileType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return null;

  const header = buffer.subarray(0, HEADER_BYTES);
  const match = SIGNATURES.find((signature) => signature.test(header));

  return match ? match.type : null;
}

export default detectFileType;
