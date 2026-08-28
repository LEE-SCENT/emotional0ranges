/**
 * 브랜드 로고 원본(logo/figma-export/*.svg)을 정리해 배포용 파일을 만든다.
 *
 * 두 variant 는 기하가 완전히 같고 워드마크 색만 다릅니다. 그래서 기하는 한 번만 읽고
 * 색을 갈아끼워 내보냅니다 — 원본이 바뀌어도 두 파일이 어긋날 일이 없습니다.
 *
 *   build/logo/original.svg  워드마크 검정 + 심볼 브랜드색 (<img> 용, 색이 박혀 있음)
 *   build/logo/white.svg     워드마크 흰색  + 심볼 브랜드색 (<img> 용)
 *   build/logo.svg           워드마크 currentColor (인라인/<use> 용)
 *   build/logo.ts            마크업 문자열
 *
 * 실행: node scripts/build-logo.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = resolve(ROOT, 'logo/figma-export')
const OUT = resolve(ROOT, 'build/logo')

const BRAND = '#F75D15'      // primitive.colors.twistOrange.500
const WIDTH = 126
const HEIGHT = 40

function extract(file, variant) {
  const raw = readFileSync(resolve(SRC, file), 'utf8')
  const m = raw.match(new RegExp(`<g id="type=${variant}">([\\s\\S]*?)\\n</g>`))
  if (!m) throw new Error(`${file}: <g id="type=${variant}"> 를 찾지 못했습니다.`)
  if (/<g[^>]*\stransform=/.test(m[1])) {
    throw new Error(`${file}: transform 이 있는 <g> 는 자동 평탄화할 수 없습니다.`)
  }
  return m[1]
    .replace(/<\/?g[^>]*>/g, '')
    .replace(/\s*id="[^"]*"/g, '')
    .split('\n').map((l) => l.trim()).filter(Boolean).join('\n  ')
}

const original = extract('original.svg', 'original')
const white = extract('white.svg', 'white')

// 기하가 같은지 매번 확인한다. 어긋나면 색 치환 전략이 성립하지 않는다.
const strip = (s) => s.replace(/fill="[^"]*"/g, '')
if (strip(original) !== strip(white)) {
  throw new Error('두 variant 의 기하가 다릅니다. 색 치환으로 처리할 수 없으니 스크립트를 손봐야 합니다.')
}

/** 워드마크 색만 바꾼다. 브랜드 심볼은 두 variant 모두 그대로 둔다. */
const recolor = (body, wordmark) =>
  body.replace(/fill="(?!#F75D15")[^"]*"/gi, `fill="${wordmark}"`)

const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none" role="img" aria-label="emotional oranges">\n  ${body}\n</svg>\n`

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
writeFileSync(resolve(OUT, 'original.svg'), svg(recolor(original, '#000000')))
writeFileSync(resolve(OUT, 'white.svg'), svg(recolor(original, '#FFFFFF')))

/* 인라인용: 워드마크는 부모 color 를, 심볼은 토큰을 따른다. */
const inlineBody = recolor(original, 'currentColor')
  .replace(new RegExp(`fill="${BRAND}"`, 'gi'), `fill="var(--_colors-twist-orange-500, ${BRAND})"`)

writeFileSync(
  resolve(ROOT, 'build/logo.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n<symbol id="logo-eo" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none">\n  ${inlineBody}\n</symbol>\n</svg>\n`,
)

writeFileSync(
  resolve(ROOT, 'build/logo.ts'),
  `// 자동 생성 파일입니다. logo/figma-export/ 를 갱신한 뒤 \`node scripts/build-logo.mjs\` 를 실행하세요.

export const LOGO_WIDTH = ${WIDTH}
export const LOGO_HEIGHT = ${HEIGHT}
export const LOGO_ASPECT = ${+(WIDTH / HEIGHT).toFixed(4)}

/** 워드마크는 currentColor, 브랜드 심볼은 고정색을 따릅니다. */
export const logoInner = ${JSON.stringify(inlineBody)}

export function logoSvg(height = LOGO_HEIGHT): string {
  const w = Math.round(height * LOGO_ASPECT)
  return \`<svg xmlns="http://www.w3.org/2000/svg" width="\${w}" height="\${height}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none" role="img" aria-label="emotional oranges">\${logoInner}</svg>\`
}
`,
)

console.log(`로고 -> build/logo/original.svg, build/logo/white.svg, build/logo.svg, build/logo.ts`)
