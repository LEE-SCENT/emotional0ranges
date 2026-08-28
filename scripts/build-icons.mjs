/**
 * Figma에서 내려받은 원본 SVG(icons/figma-export/*.svg)를 정리해
 * 개별 SVG · 스프라이트 · TS 모듈을 만든다. 의존성 없음.
 *
 * 원본 export 는 아이콘이 놓인 부모 프레임 배경까지 함께 들어있어 그대로 쓸 수 없다.
 * 여기서 `<g id="icon/…">` 서브트리만 뽑아 24×24 좌표계 그대로 재포장한다.
 *
 * 실행: node scripts/build-icons.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { dirname, resolve, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = resolve(ROOT, 'icons/figma-export')
const OUT_DIR = resolve(ROOT, 'build/icons')

/** Figma 아이콘의 단일 원본 색. 이 값만 currentColor 로 치환한다. */
const SOURCE_FILL = '#424242'
const SIZE = 24

function extract(file) {
  const name = basename(file, '.svg')
  const raw = readFileSync(resolve(SRC, file), 'utf8')

  const m = raw.match(/<g id="icon\/([^"]+)">([\s\S]*?)\n<\/g>/)
  if (!m) throw new Error(`${file}: <g id="icon/…"> 를 찾지 못했습니다.`)
  if (m[1] !== name) throw new Error(`${file}: 파일명과 Figma 레이어명이 다릅니다 (${m[1]}).`)

  let body = m[2]

  // 좌표를 옮기는 <g transform> 이 있으면 평탄화가 위험하므로 멈춘다.
  const transformed = body.match(/<g[^>]*\stransform=/)
  if (transformed) throw new Error(`${name}: transform 이 있는 <g> 는 자동 평탄화할 수 없습니다.`)

  const otherFills = [...body.matchAll(/fill="([^"]+)"/g)]
    .map((f) => f[1])
    .filter((f) => f.toUpperCase() !== SOURCE_FILL && f !== 'none')
  if (otherFills.length) {
    throw new Error(`${name}: 예상 밖의 색 ${[...new Set(otherFills)].join(', ')} — 확인이 필요합니다.`)
  }

  body = body
    .replace(/<\/?g[^>]*>/g, '')            // 의미 없는 래퍼 그룹 제거
    .replace(/\s*id="[^"]*"/g, '')          // Figma 레이어 id 제거
    .replace(new RegExp(`fill="${SOURCE_FILL}"`, 'gi'), 'fill="currentColor"')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n  ')

  return { name, body }
}

const icons = readdirSync(SRC)
  .filter((f) => f.endsWith('.svg'))
  .sort()
  .map(extract)

rmSync(OUT_DIR, { recursive: true, force: true })
mkdirSync(OUT_DIR, { recursive: true })

/* 1. 개별 SVG — currentColor 라서 부모의 color 를 따라간다. */
for (const { name, body } of icons) {
  writeFileSync(
    resolve(OUT_DIR, `${name}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" fill="none" aria-hidden="true">\n  ${body}\n</svg>\n`,
  )
}

/* 2. 스프라이트 — <svg><use href="#icon-close" /></svg> 로 참조. */
const sprite =
  `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n` +
  icons
    .map(({ name, body }) => `<symbol id="icon-${name}" viewBox="0 0 ${SIZE} ${SIZE}" fill="none">\n  ${body}\n</symbol>`)
    .join('\n') +
  `\n</svg>\n`
writeFileSync(resolve(ROOT, 'build/icons.svg'), sprite)

/* 3. TS 모듈 — 마크업 문자열이라 프레임워크에 묶이지 않는다. */
const entries = icons.map(({ name, body }) => `  ${name}: ${JSON.stringify(body)},`).join('\n')
writeFileSync(
  resolve(ROOT, 'build/icons.ts'),
  `// 자동 생성 파일입니다. icons/figma-export/ 를 갱신한 뒤 \`node scripts/build-icons.mjs\` 를 실행하세요.

export const ICON_SIZE = ${SIZE}

/** 아이콘 이름 -> <svg> 안쪽 마크업. 색은 currentColor 를 따릅니다. */
export const icons = {
${entries}
} as const

export type IconName = keyof typeof icons

/** 바로 쓸 수 있는 <svg> 문자열을 만듭니다. size 는 px. */
export function iconSvg(name: IconName, size: number = ICON_SIZE): string {
  return \`<svg xmlns="http://www.w3.org/2000/svg" width="\${size}" height="\${size}" viewBox="0 0 ${SIZE} ${SIZE}" fill="none" aria-hidden="true">\${icons[name]}</svg>\`
}
`,
)

console.log(`아이콘 ${icons.length}개 -> build/icons/*.svg, build/icons.svg, build/icons.ts`)
console.log(icons.map((i) => i.name).join(', '))
