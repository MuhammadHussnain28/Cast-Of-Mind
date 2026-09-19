import zlib from 'node:zlib';

// A real, minimal ZIP (stored, no compression) for file-type tests.
// Enough structure for any unzip tool to read it back.

const crc32 = (data) => (typeof zlib.crc32 === 'function' ? zlib.crc32(data) >>> 0 : 0);

export function buildZip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const [name, content = ''] of Object.entries(entries)) {
    const nameBuf = Buffer.from(name, 'utf8');
    const data = Buffer.from(content);
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    locals.push(local, nameBuf, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);

    offset += local.length + nameBuf.length + data.length;
  }

  const directory = Buffer.concat(centrals);
  const count = Object.keys(entries).length;
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(count, 8);
  eocd.writeUInt16LE(count, 10);
  eocd.writeUInt32LE(directory.length, 12);
  eocd.writeUInt32LE(offset, 16);

  return Buffer.concat([...locals, directory, eocd]);
}

// The parts Word itself writes for the smallest possible .docx.
export const DOCX_PARTS = {
  '[Content_Types].xml': '<?xml version="1.0"?><Types/>',
  '_rels/.rels': '<?xml version="1.0"?><Relationships/>',
  'word/document.xml': '<?xml version="1.0"?><w:document/>',
};

export const docx = (extra = {}) => buildZip({ ...DOCX_PARTS, ...extra });
