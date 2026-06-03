#!/usr/bin/env node
// Generates assets/icon.png — 512×512 Dynatrace-blue solid square.
// Replace with a proper rocket-emoji render once `canvas` is available:
//   npm install canvas
//   const { createCanvas } = require('canvas');
//   const canvas = createCanvas(512, 512);
//   const ctx = canvas.getContext('2d');
//   ctx.fillStyle = '#1e2b5e'; ctx.fillRect(0, 0, 512, 512);
//   ctx.font = '320px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
//   ctx.fillText('🚀', 256, 256);
//   require('fs').writeFileSync('assets/icon.png', canvas.toBuffer('image/png'));

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const SIZE = 512;
const R = 0x1e, G = 0x2b, B = 0x5e, A = 0xff; // Dynatrace navy

const rows = [];
for (let y = 0; y < SIZE; y++) {
  const row = Buffer.alloc(1 + SIZE * 4);
  row[0] = 0;
  for (let x = 0; x < SIZE; x++) {
    row[1 + x * 4 + 0] = R;
    row[1 + x * 4 + 1] = G;
    row[1 + x * 4 + 2] = B;
    row[1 + x * 4 + 3] = A;
  }
  rows.push(row);
}
const compressed = zlib.deflateSync(Buffer.concat(rows));

const crcTable = (() => {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([len, typeBytes, data, crcBuf]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA

const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const png = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);

const outPath = path.join(__dirname, '..', 'assets', 'icon.png');
fs.writeFileSync(outPath, png);
console.log(`Generated ${outPath} (${png.length} bytes) — placeholder navy square.`);
console.log('To render a real rocket emoji, install canvas and use the snippet at the top of this file.');
