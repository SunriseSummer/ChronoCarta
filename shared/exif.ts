/**
 * 纯 EXIF 拍摄时间解析器（无平台依赖，接受 Uint8Array）
 * 优先级：DateTimeOriginal > DateTimeDigitized > DateTime
 */

/** 从原始字节中解析 EXIF 拍摄时间，失败返回 null */
export function extractExifDate(bytes: Uint8Array): number | null {
  if (bytes.length < 4) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes[0] === 0xFF && bytes[1] === 0xD8) return parseJpeg(view);
  if (bytes.length >= 8 && view.getUint32(0) === 0x89504E47) return parsePng(view, bytes);
  return null;
}

/* ── JPEG ── */

function parseJpeg(view: DataView): number | null {
  let offset = 2;
  while (offset < view.byteLength - 4) {
    const marker = view.getUint16(offset);
    if (marker === 0xFFE1) {
      const segLen = view.getUint16(offset + 2);
      return parseTiffExif(view, offset + 4, segLen - 2, true);
    }
    if ((marker & 0xFF00) !== 0xFF00) break;
    offset += 2 + view.getUint16(offset + 2);
  }
  return null;
}

/* ── PNG ── */

function parsePng(view: DataView, bytes: Uint8Array): number | null {
  let offset = 8;
  while (offset + 12 < view.byteLength) {
    const chunkLen = view.getUint32(offset);
    const ct = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
    if (ct === 'eXIf') return parseTiffExif(view, offset + 8, chunkLen, false);
    if (ct === 'tEXt') {
      const chunkData = offset + 8;
      let kwEnd = chunkData;
      while (kwEnd < chunkData + chunkLen && bytes[kwEnd] !== 0) kwEnd++;
      const kw = String.fromCharCode(...bytes.slice(chunkData, kwEnd));
      if (kw === 'date:create' || kw === 'date:modify' || kw === 'Creation Time') {
        const ts = Date.parse(String.fromCharCode(...bytes.slice(kwEnd + 1, chunkData + chunkLen)).trim());
        if (!isNaN(ts)) return ts;
      }
    }
    if (ct === 'IEND') break;
    offset += 12 + chunkLen;
  }
  return null;
}

/* ── TIFF / EXIF ── */

function parseTiffExif(view: DataView, start: number, _len: number, hasHeader: boolean): number | null {
  let ts = start;
  if (hasHeader) {
    if (start + 6 > view.byteLength) return null;
    const h = String.fromCharCode(view.getUint8(start), view.getUint8(start + 1), view.getUint8(start + 2), view.getUint8(start + 3));
    if (h !== 'Exif') return null;
    ts = start + 6;
  }
  if (ts + 8 > view.byteLength) return null;
  const le = view.getUint16(ts) === 0x4949;
  const u16 = (o: number) => view.getUint16(o, le);
  const u32 = (o: number) => view.getUint32(o, le);

  const ifd0 = u32(ts + 4);
  const d = dateFromIFD(view, ts, ifd0, u16, u32);
  if (d) return d;
  const exifPtr = findTag(view, ts, ifd0, u16, u32, 0x8769);
  if (exifPtr != null) { const d2 = dateFromIFD(view, ts, exifPtr, u16, u32); if (d2) return d2; }
  return null;
}

function dateFromIFD(view: DataView, ts: number, ifdOff: number, u16: (o: number) => number, u32: (o: number) => number): number | null {
  for (const tag of [0x9003, 0x9004, 0x0132]) {
    const v = readAscii(view, ts, ifdOff, u16, u32, tag);
    if (v) { const t = parseDate(v); if (t) return t; }
  }
  return null;
}

function findTag(view: DataView, ts: number, ifdOff: number, u16: (o: number) => number, u32: (o: number) => number, tag: number): number | null {
  const abs = ts + ifdOff;
  if (abs + 2 > view.byteLength) return null;
  const n = u16(abs);
  for (let i = 0; i < n; i++) { const e = abs + 2 + i * 12; if (e + 12 > view.byteLength) break; if (u16(e) === tag) return u32(e + 8); }
  return null;
}

function readAscii(view: DataView, ts: number, ifdOff: number, u16: (o: number) => number, u32: (o: number) => number, tag: number): string | null {
  const abs = ts + ifdOff;
  if (abs + 2 > view.byteLength) return null;
  const n = u16(abs);
  for (let i = 0; i < n; i++) {
    const e = abs + 2 + i * 12;
    if (e + 12 > view.byteLength) break;
    if (u16(e) !== tag) continue;
    const cnt = u32(e + 4);
    if (cnt > 100) continue;
    const off = cnt <= 4 ? e + 8 : ts + u32(e + 8);
    if (off + cnt > view.byteLength) continue;
    let s = '';
    for (let j = 0; j < cnt; j++) { const c = view.getUint8(off + j); if (c === 0) break; s += String.fromCharCode(c); }
    return s.trim();
  }
  return null;
}

function parseDate(s: string): number | null {
  const m = s.match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  return isNaN(d.getTime()) ? null : d.getTime();
}
