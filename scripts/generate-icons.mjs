import { mkdirSync, writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const BG = [8, 9, 12]
const ACCENT = [255, 122, 69]
const OUT = 'public'

function roundRect(x, y, w, h, r) {
  return { x, y, w, h, r }
}

function insideRoundedRect(px, py, rect) {
  const { x, y, w, h, r } = rect
  if (px < x || py < y || px > x + w || py > y + h) return false
  const cx = Math.min(Math.max(px, x + r), x + w - r)
  const cy = Math.min(Math.max(py, y + r), y + h - r)
  return (px - cx) ** 2 + (py - cy) ** 2 <= r * r
}

function render(size, { radius = 0.22, bleed = false } = {}) {
  const scale = 4
  const S = size * scale
  const buf = Buffer.alloc(size * size * 4)

  const bgRect = bleed
    ? roundRect(0, 0, S, S, 0)
    : roundRect(0, 0, S, S, S * radius)

  const unit = S * 0.32
  const gap = S * 0.062
  const margin = (S - (unit * 2 + gap)) / 2
  const squares = [
    { x: margin, y: margin, alpha: 1 },
    { x: margin + unit + gap, y: margin, alpha: 0.62 },
    { x: margin, y: margin + unit + gap, alpha: 0.62 },
    { x: margin + unit + gap, y: margin + unit + gap, alpha: 0.3 },
  ].map((sq) => ({ ...sq, rect: roundRect(sq.x, sq.y, unit, unit, unit * 0.16) }))

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      let samples = 0

      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const px = x * scale + sx + 0.5
          const py = y * scale + sy + 0.5
          samples++
          if (!insideRoundedRect(px, py, bgRect)) continue
          let cr = BG[0]
          let cg = BG[1]
          let cb = BG[2]
          for (const sq of squares) {
            if (insideRoundedRect(px, py, sq.rect)) {
              cr += (ACCENT[0] - cr) * sq.alpha
              cg += (ACCENT[1] - cg) * sq.alpha
              cb += (ACCENT[2] - cb) * sq.alpha
            }
          }
          r += cr
          g += cg
          b += cb
          a += 255
        }
      }

      const i = (y * size + x) * 4
      if (!a) continue
      buf[i] = Math.round(r / samples)
      buf[i + 1] = Math.round(g / samples)
      buf[i + 2] = Math.round(b / samples)
      buf[i + 3] = Math.round(a / samples)
    }
  }

  return buf
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buf) {
  let c = 0xffffffff
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

function png(buf, size) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    buf.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function ico(pngs) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(pngs.length, 4)
  let offset = 6 + pngs.length * 16
  const entries = pngs.map(({ size, data }) => {
    const entry = Buffer.alloc(16)
    entry[0] = size >= 256 ? 0 : size
    entry[1] = size >= 256 ? 0 : size
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(data.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += data.length
    return entry
  })
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)])
}

mkdirSync(OUT, { recursive: true })

const sizes = [
  [32, 'icon-32.png', { bleed: true }],
  [180, 'apple-touch-icon.png', { bleed: true }],
  [192, 'icon-192.png', {}],
  [512, 'icon-512.png', {}],
]

const pngs = []
for (const [size, name, opts] of sizes) {
  const data = png(render(size, opts), size)
  writeFileSync(`${OUT}/${name}`, data)
  pngs.push({ size, data })
}

writeFileSync(`${OUT}/favicon.ico`, ico(pngs.filter((p) => p.size <= 32)))

writeFileSync(
  `${OUT}/favicon.svg`,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#08090c"/>
  <rect x="10" y="10" width="20" height="20" rx="3.4" fill="#ff7a45"/>
  <rect x="34" y="10" width="20" height="20" rx="3.4" fill="#ff7a45" opacity=".62"/>
  <rect x="10" y="34" width="20" height="20" rx="3.4" fill="#ff7a45" opacity=".62"/>
  <rect x="34" y="34" width="20" height="20" rx="3.4" fill="#ff7a45" opacity=".3"/>
</svg>
`,
)

writeFileSync(
  `${OUT}/site.webmanifest`,
  JSON.stringify(
    {
      name: 'InstaBox',
      short_name: 'InstaBox',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      theme_color: '#08090c',
      background_color: '#08090c',
      display: 'standalone',
      start_url: '/',
    },
    null,
    2,
  ) + '\n',
)

console.log('icons written to public/')
