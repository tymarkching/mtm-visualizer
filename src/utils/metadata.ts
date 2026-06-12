/**
 * Utility functions for native container metadata encoding in MP4 audio-video streams.
 * Packages standard MP4 atoms like '©art', 'cprt', and 'auth' inside the 'moov.udta.meta.ilst' container.
 */

function createMetadataItemBytes(tag: number[], value: string): Uint8Array {
  const encoder = new TextEncoder();
  const valueBytes = encoder.encode(value);
  
  // Data box has size (4 bytes), type 'data' (4 bytes), type/flags (for string, usually 0x00000001) (4 bytes), locale (00 00 00 00) (4 bytes) + valueBytes
  const dataSize = 16 + valueBytes.length;
  const dataBox = new Uint8Array(dataSize);
  const dataView = new DataView(dataBox.buffer);
  
  dataView.setUint32(0, dataSize); // size
  dataBox[4] = 100; // 'd'
  dataBox[5] = 97;  // 'a'
  dataBox[6] = 116; // 't'
  dataBox[7] = 97;  // 'a'
  dataView.setUint32(8, 1); // flag: 1 (text / UTF-8)
  dataView.setUint32(12, 0); // locale: 0
  dataBox.set(valueBytes, 16);
  
  // Parent item box (length + tag + data box payload)
  const itemSize = 8 + dataSize;
  const itemBox = new Uint8Array(itemSize);
  const itemView = new DataView(itemBox.buffer);
  
  itemView.setUint32(0, itemSize); // size
  itemBox[4] = tag[0];
  itemBox[5] = tag[1];
  itemBox[6] = tag[2];
  itemBox[7] = tag[3];
  itemBox.set(dataBox, 8);
  
  return itemBox;
}

function createIlstBox(items: { tag: number[], value: string }[]): Uint8Array {
  const itemBoxes: Uint8Array[] = [];
  let totalLength = 0;
  
  for (const item of items) {
    const box = createMetadataItemBytes(item.tag, item.value);
    itemBoxes.push(box);
    totalLength += box.length;
  }
  
  // ilst box: size (4 bytes), type 'ilst' (4 bytes) + payload
  const ilstSize = 8 + totalLength;
  const ilstBox = new Uint8Array(ilstSize);
  const ilstView = new DataView(ilstBox.buffer);
  
  ilstView.setUint32(0, ilstSize);
  ilstBox[4] = 105; // 'i'
  ilstBox[5] = 108; // 'l'
  ilstBox[6] = 115; // 's'
  ilstBox[7] = 116; // 't'
  
  let offset = 8;
  for (const box of itemBoxes) {
    ilstBox.set(box, offset);
    offset += box.length;
  }
  
  return ilstBox;
}

function createMetaBox(ilstBox: Uint8Array): Uint8Array {
  // meta: size (4 bytes), type 'meta' (4 bytes), version/flags (4 bytes - all 0) + sub-atoms
  const metaSize = 12 + ilstBox.length;
  const metaBox = new Uint8Array(metaSize);
  const metaView = new DataView(metaBox.buffer);
  
  metaView.setUint32(0, metaSize);
  metaBox[4] = 109; // 'm'
  metaBox[5] = 101; // 'e'
  metaBox[6] = 116; // 't'
  metaBox[7] = 97;  // 'a'
  metaView.setUint32(8, 0); // version & flags = 0
  metaBox.set(ilstBox, 12);
  
  return metaBox;
}

function createUdtaBox(metaBox: Uint8Array): Uint8Array {
  // udta: size (4 bytes), type 'udta' (4 bytes) + subbox
  const udtaSize = 8 + metaBox.length;
  const udtaBox = new Uint8Array(udtaSize);
  const udtaView = new DataView(udtaBox.buffer);
  
  udtaView.setUint32(0, udtaSize);
  udtaBox[4] = 117; // 'u'
  udtaBox[5] = 100; // 'd'
  udtaBox[6] = 116; // 't'
  udtaBox[7] = 97;  // 'a'
  udtaBox.set(metaBox, 8);
  
  return udtaBox;
}

/**
 * Searches for 'moov' atom in standard MP4, appends formatted udta metadata atom,
 * and updates moov parent sizes so they are correctly parsed by explorer environments.
 */
export function injectMP4Metadata(buffer: ArrayBuffer, artist: string, copyright: string): ArrayBuffer {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let offset = 0;
  
  let moovOffset = -1;
  let moovSize = 0;
  
  while (offset < buffer.byteLength - 8) {
    const size = view.getUint32(offset);
    if (size === 0 || offset + size > buffer.byteLength) break;
    
    const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
    
    if (type === 'moov') {
      moovOffset = offset;
      moovSize = size;
      break;
    }
    
    offset += size;
  }
  
  if (moovOffset === -1) {
    return buffer; // Fallback to original buffer if not standard MP4 layout
  }
  
  // Create tags array including standard artist, copyright, and author atom structures
  const items = [
    { tag: [0xA9, 97, 114, 116], value: artist },     // ©art -> Contributing Artist
    { tag: [99, 112, 114, 116], value: copyright },   // cprt -> Copyright
    { tag: [97, 117, 116, 104], value: artist }       // auth -> Author / Composer
  ];
  
  const ilst = createIlstBox(items);
  const meta = createMetaBox(ilst);
  const udta = createUdtaBox(meta);
  
  const newMoovSize = moovSize + udta.length;
  
  // Reconstruct completely with brand new binary sizing bounds
  const newBuffer = new ArrayBuffer(buffer.byteLength + udta.length);
  const newBytes = new Uint8Array(newBuffer);
  const newView = new DataView(newBuffer);
  
  // 1. Copy starting up to back-end of moov
  newBytes.set(bytes.subarray(0, moovOffset + moovSize), 0);
  
  // 2. Override moov length
  newView.setUint32(moovOffset, newMoovSize);
  
  // 3. Inject new parent box payloads
  newBytes.set(udta, moovOffset + moovSize);
  
  // 4. Copy tail bytes
  if (bytes.length > moovOffset + moovSize) {
    newBytes.set(bytes.subarray(moovOffset + moovSize), moovOffset + moovSize + udta.length);
  }
  
  return newBuffer;
}
