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

/**
 * 아이콘마다 원본 색과 크기가 다르다 (UI 아이콘은 24px #424242, Notice 아이콘은
 * 32px 브랜드색). 그래서 색은 하드코딩하지 않고 "단색이면 그 색"을 찾아 치환하고,
 * 크기는 viewBox 에서 읽는다. 두 가지 색이 섞여 있으면 어느 쪽을 currentColor 로
 * 만들지 정할 수 없으므로 멈춘다.
 */
const DEFAULT_SIZE = 24

function extract(file) {
  const name = basename(file, '.svg')
  const raw = readFileSync(resolve(SRC, file), 'utf8')

  const m = raw.match(/<g id="icon\/([^"]+)">([\s\S]*?)\n<\/g>/)
  if (!m) throw new Error(`${file}: <g id="icon/…"> 를 찾지 못했습니다.`)
  if (m[1] !== name) throw new Error(`${file}: 파일명과 Figma 레이어명이 다릅니다 (${m[1]}).`)

  // 크기는 원본 viewBox 를 따른다. 정사각이 아니면 스프라이트에서 어긋난다.
  const vb = raw.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/)
  const size = vb ? Number(vb[1]) : DEFAULT_SIZE
  if (vb && vb[1] !== vb[2]) throw new Error(`${name}: 정사각형이 아닙니다 (${vb[1]}×${vb[2]}).`)

  let body = m[2]

  // 좌표를 옮기는 <g transform> 이 있으면 평탄화가 위험하므로 멈춘다.
  if (/<g[^>]*\stransform=/.test(body)) {
    throw new Error(`${name}: transform 이 있는 <g> 는 자동 평탄화할 수 없습니다.`)
  }

  const colors = [...new Set(
    [...body.matchAll(/fill="([^"]+)"/g)].map((f) => f[1]).filter((f) => f !== 'none'),
  )]
  if (colors.length > 1) {
    throw new Error(
      `${name}: 색이 ${colors.join(', ')} 로 여러 개입니다. ` +
        `어느 쪽을 currentColor 로 둘지 정할 수 없으니 직접 처리하세요.`,
    )
  }

  body = body
    .replace(/<\/?g[^>]*>/g, '')            // 의미 없는 래퍼 그룹 제거
    .replace(/\s*id="[^"]*"/g, '')          // Figma 레이어 id 제거
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n  ')

  if (colors.length === 1) {
    body = body.replaceAll(`fill="${colors[0]}"`, 'fill="currentColor"')
  }

  return { name, body, size }
}

const icons = readdirSync(SRC)
  .filter((f) => f.endsWith('.svg'))
  .sort()
  .map(extract)

rmSync(OUT_DIR, { recursive: true, force: true })
mkdirSync(OUT_DIR, { recursive: true })

/* 1. 개별 SVG — currentColor 라서 부모의 color 를 따라간다. */
for (const { name, body, size } of icons) {
  writeFileSync(
    resolve(OUT_DIR, `${name}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" aria-hidden="true">\n  ${body}\n</svg>\n`,
  )
}

/* 2. 스프라이트 — <svg><use href="#icon-close" /></svg> 로 참조. */
const sprite =
  `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n` +
  icons
    .map(({ name, body, size }) => `<symbol id="icon-${name}" viewBox="0 0 ${size} ${size}" fill="none">\n  ${body}\n</symbol>`)
    .join('\n') +
  `\n</svg>\n`
writeFileSync(resolve(ROOT, 'build/icons.svg'), sprite)

/* 3. TS 모듈 — 마크업 문자열이라 프레임워크에 묶이지 않는다. */
const entries = icons
  .map(({ name, body, size }) => `  ${name}: { size: ${size}, inner: ${JSON.stringify(body)} },`)
  .join('\n')
writeFileSync(
  resolve(ROOT, 'build/icons.ts'),
  `// 자동 생성 파일입니다. icons/figma-export/ 를 갱신한 뒤 \`node scripts/build-icons.mjs\` 를 실행하세요.

/** 아이콘 이름 -> 원본 크기와 <svg> 안쪽 마크업. 색은 currentColor 를 따릅니다. */
export const icons = {
${entries}
} as const

export type IconName = keyof typeof icons

/** 바로 쓸 수 있는 <svg> 문자열을 만듭니다. size 를 생략하면 원본 크기입니다. */
export function iconSvg(name: IconName, size?: number): string {
  const icon = icons[name]
  const px = size ?? icon.size
  return \`<svg xmlns="http://www.w3.org/2000/svg" width="\${px}" height="\${px}" viewBox="0 0 \${icon.size} \${icon.size}" fill="none" aria-hidden="true">\${icon.inner}</svg>\`
}
`,
)

console.log(`아이콘 ${icons.length}개 -> build/icons/*.svg, build/icons.svg, build/icons.ts`)
console.log(icons.map((i) => i.name).join(', '))
