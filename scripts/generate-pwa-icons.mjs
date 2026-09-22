#!/usr/bin/env node
// Rasterizes public/favicon.svg into the PNG sizes the PWA manifest needs
// (see vite.config.ts's manifest.icons). Re-run this after changing the
// favicon so the installable app icon and offline-mode manifest icon stay
// in sync with it.
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC_DIR = join(ROOT, 'public')

// The favicon's own tile mark, at the size/weight it's drawn at -- kept in
// sync by hand with public/favicon.svg rather than read from it, since the
// maskable variant below needs its own scaled-down, full-bleed rendering
// (see makeMaskableSvg) that isn't just a resize of the plain favicon.
const TILE_MARK = `
  <g font-family="Oswald, Impact, 'Arial Narrow', Arial, sans-serif" font-weight="700" font-size="24" text-anchor="middle" fill="#fff">
    <rect x="7" y="7" width="22" height="22" rx="5" fill="#a78bfa"/>
    <text x="18" y="25">S</text>
    <rect x="35" y="7" width="22" height="22" rx="5" fill="#fbbf24"/>
    <text x="46" y="25">A</text>
    <rect x="7" y="35" width="22" height="22" rx="5" fill="#34d399"/>
    <text x="18" y="53">N</text>
    <rect x="35" y="35" width="22" height="22" rx="5" fill="#38bdf8"/>
    <text x="46" y="53">A</text>
  </g>
`

const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#1b2a41"/>
  ${TILE_MARK}
</svg>`

// Maskable icons must be fully opaque with no rounded/transparent corners --
// the OS applies its own mask shape -- and keep their content within the
// centered ~80% "safe zone" circle, since corners can be clipped by that
// mask. Scaling the tile mark down and centering it on a plain, full-bleed
// background achieves both, rather than padding the favicon's own (already
// rounded, alpha-cornered) artwork.
const MASKABLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#1b2a41"/>
  <g transform="translate(32,32) scale(0.62) translate(-32,-32)">${TILE_MARK}</g>
</svg>`

async function renderPng(svg, size, outPath, { opaque = false } = {}) {
  let pipeline = sharp(Buffer.from(svg), { density: 384 }).resize(size, size)
  // Only the maskable icon needs a flattened, fully opaque background (see
  // the note on MASKABLE_SVG above) -- the regular icons keep the
  // favicon's own rounded corners transparent, same as the favicon itself.
  if (opaque) pipeline = pipeline.flatten({ background: '#1b2a41' })
  await writeFile(outPath, await pipeline.png().toBuffer())
  console.log(`wrote ${outPath}`)
}

await renderPng(FAVICON_SVG, 192, join(PUBLIC_DIR, 'pwa-192.png'))
await renderPng(FAVICON_SVG, 512, join(PUBLIC_DIR, 'pwa-512.png'))
await renderPng(MASKABLE_SVG, 512, join(PUBLIC_DIR, 'pwa-512-maskable.png'), { opaque: true })
