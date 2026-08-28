/**
 * DTCG 토큰 JSON -> CSS 커스텀 프로퍼티 + TypeScript 상수 생성.
 * 의존성 없음.  실행:  node scripts/build-tokens.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => JSON.parse(readFileSync(resolvePath(ROOT, p), 'utf8'))

/** tokens/ 의 모든 JSON을 깊게 병합한다 — 여러 파일이 같은 `primitive` 루트를 나눠 갖는다. */
function deepMerge(target, source, path = []) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value) &&
        target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
      deepMerge(target[key], value, [...path, key])
    } else {
      if (key in target && !key.startsWith('$')) {
        throw new Error(`토큰이 중복 정의되었습니다: ${[...path, key].join('.')}`)
      }
      target[key] = value
    }
  }
  return target
}

const sources = readdirSync(resolvePath(ROOT, 'tokens'))
  .filter((f) => f.endsWith('.json'))
  .sort()
const tree = sources.reduce((acc, f) => deepMerge(acc, read(`tokens/${f}`)), {})

/* ---------- 참조 해석 ---------- */

const REF = /^\{([^{}]+)\}$/
const lookup = (path) => path.split('.').reduce((node, key) => node?.[key], tree)

function deref(value, depth = 0) {
  if (depth > 20) throw new Error(`참조가 순환합니다: ${value}`)
  if (typeof value === 'string') {
    const m = REF.exec(value)
    if (!m) return value
    const target = lookup(m[1])
    if (!target || !('$value' in target)) throw new Error(`해석할 수 없는 참조: ${value}`)
    return deref(target.$value, depth + 1)
  }
  if (Array.isArray(value)) return value.map((v) => deref(v, depth))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, deref(v, depth)]))
  }
  return value
}

/* ---------- 토큰 수집 ---------- */

const tokens = []
;(function walk(node, path, inheritedType) {
  const type = node.$type ?? inheritedType
  if ('$value' in node) {
    // 토큰은 자식을 가질 수 없다. 중첩되어 있으면 조용히 무시되므로 여기서 멈춘다.
    const nested = Object.keys(node).filter((k) => !k.startsWith('$'))
    if (nested.length) {
      throw new Error(
        `${path.join('.')} 는 $value 를 가진 토큰인데 하위에 ${nested.join(', ')} 가 있습니다. ` +
          `형제 그룹으로 분리하세요.`,
      )
    }
    tokens.push({
      path,
      type,
      raw: node.$value,
      value: deref(node.$value),
      scale: node.$extensions?.scale,
      description: node.$description,
    })
    return
  }
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$') || child === null || typeof child !== 'object') continue
    walk(child, [...path, key], type)
  }
})(tree, [], undefined)

/* ---------- 이름 변환 ---------- */

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
/**
 * primitive 와 components 는 디자인 시스템 내부용이라 `_` 를 붙여 비공개임을 드러낸다.
 * 화면 작업에서 쓰는 semantic 만 접두사 없는 이름을 갖는다 — grep 으로 위반을 잡을 수 있다.
 * 첫 세그먼트(primitive / semantic / components)는 이름에서 제외한다.
 */
const PRIVATE_ROOTS = new Set(['primitive', 'components'])
const cssName = (path) =>
  '--' + (PRIVATE_ROOTS.has(path[0]) ? '_' : '') + path.slice(1).map(kebab).join('-')
const quoteFamily = (list) =>
  list.map((f) => (/[^a-zA-Z0-9-]/.test(f) ? `"${f}"` : f)).join(', ')

/**
 * CSS letter-spacing 은 퍼센트를 받지 않는다. 토큰은 Figma와 같은 퍼센트로 두고
 * 여기서 em 으로 바꾼다 — em 은 자기 font-size 기준이라 퍼센트와 의미가 같다.
 */
const normalize = (value, type) =>
  type === 'letterSpacing' && typeof value === 'string' && value.endsWith('%')
    ? `${parseFloat(value) / 100}em`
    : value

const cssValue = (value) => (Array.isArray(value) ? quoteFamily(value) : String(value))

/**
 * DTCG 에는 연산이 없어 $extensions.scale 로 배수를 싣는다.
 * spacing 처럼 "기준 단위의 N배" 인 토큰이 기준값과의 관계를 잃지 않게 하려는 것.
 */
function applyScale(value, scale) {
  if (scale === undefined) return value
  const m = /^(-?[\d.]+)(px|rem|em|%)$/.exec(String(value))
  if (!m) throw new Error(`scale 은 숫자+단위 값에만 쓸 수 있습니다: ${value}`)
  return `${+(Number(m[1]) * scale).toFixed(4)}${m[2]}`
}

/** 원본이 다른 토큰을 가리키면 값을 복제하지 않고 var(...) 참조를 유지한다. */
const cssRef = (raw, resolved, scale) => {
  const m = typeof raw === 'string' ? REF.exec(raw) : null
  if (!m) return cssValue(applyScale(resolved, scale))
  const ref = `var(${cssName(m[1].split('.'))})`
  // 배수가 있으면 calc 로 남겨 기준 토큰이 바뀌면 따라 움직이게 한다.
  return scale === undefined || scale === 1 ? ref : `calc(${ref} * ${scale})`
}

const COMPOSITE_PROPS = {
  fontFamily: 'font-family',
  fontSize: 'font-size',
  fontWeight: 'font-weight',
  lineHeight: 'line-height',
  letterSpacing: 'letter-spacing',
}

/* ---------- CSS ---------- */

/** 레이어 순서 = CSS 출력 순서. 참조는 항상 위 레이어를 향한다. */
const LAYERS = [
  { root: 'primitive', label: 'primitive (내부용)' },
  { root: 'semantic', label: 'semantic (공개)' },
  { root: 'components', label: 'components (내부용)' },
]
for (const t of tokens) {
  if (!LAYERS.some((l) => l.root === t.path[0])) {
    throw new Error(
      `${t.path.join('.')}: 최상위는 ${LAYERS.map((l) => l.root).join(' / ')} 중 하나여야 합니다.`,
    )
  }
}

/** typography composite 은 하위 프로퍼티로 펼치고, 나머지는 값 하나짜리 변수로 낸다. */
const composites = tokens.filter((t) => t.type === 'typography')
const flat = tokens.filter((t) => t.type !== 'typography')
const byLayer = (root) => flat.filter((t) => t.path[0] === root)
const primitives = byLayer('primitive')
const semanticFlat = byLayer('semantic')
const componentFlat = byLayer('components')

const cssLines = [
  '/* 자동 생성 파일입니다. 직접 수정하지 말고 tokens/*.json 을 고친 뒤 `node scripts/build-tokens.mjs` 를 실행하세요. */',
  '/*',
  ' * `--_` 로 시작하는 변수는 디자인 시스템 내부용입니다. 화면 작업에서 직접 쓰지 마세요.',
  ' * 공개 토큰은 접두사가 없습니다 — --bg, --fg-low, --spacing-400, --typography-*.',
  ' */',
  '',
  ':root {',
  '  /* ---- primitive (내부용) ---- */',
]
for (const t of primitives) cssLines.push(`  ${cssName(t.path)}: ${cssValue(normalize(t.value, t.type))};`)

if (semanticFlat.length) {
  cssLines.push('', '  /* ---- semantic ---- */')
  for (const t of semanticFlat) {
    cssLines.push(`  ${cssName(t.path)}: ${cssRef(t.raw, normalize(t.value, t.type), t.scale)};`)
  }
}

if (componentFlat.length) {
  cssLines.push('', '  /* ---- components (내부용) ---- */')
  for (const t of componentFlat) {
    cssLines.push(`  ${cssName(t.path)}: ${cssRef(t.raw, normalize(t.value, t.type), t.scale)};`)
  }
}

cssLines.push('', '  /* ---- semantic typography composite (공개) ---- */')
for (const t of composites) {
  const base = cssName(t.path)
  for (const key of Object.keys(COMPOSITE_PROPS)) {
    cssLines.push(`  ${base}-${kebab(key)}: ${cssRef(t.raw[key], t.value[key])};`)
  }
}
cssLines.push('}', '')

cssLines.push('/* ---- 유틸리티 클래스 ---- */')
for (const t of composites) {
  const base = cssName(t.path)
  const cls = '.' + base.slice(2)
  cssLines.push(`${cls} {`)
  for (const key of Object.keys(COMPOSITE_PROPS)) {
    cssLines.push(`  ${COMPOSITE_PROPS[key]}: var(${base}-${kebab(key)});`)
  }
  cssLines.push('}')
}

mkdirSync(resolvePath(ROOT, 'build'), { recursive: true })
writeFileSync(resolvePath(ROOT, 'build/tokens.css'), cssLines.join('\n') + '\n')

/* ---------- TypeScript ---------- */

const camelPath = (path) => path.slice(1)
const setDeep = (obj, path, value) => {
  let cur = obj
  for (const key of path.slice(0, -1)) cur = cur[key] ??= {}
  cur[path.at(-1)] = value
}

const primitiveObj = {}
for (const t of primitives) setDeep(primitiveObj, camelPath(t.path), normalize(t.value, t.type))

const semanticObj = {}
for (const t of semanticFlat)
  setDeep(semanticObj, camelPath(t.path), applyScale(normalize(t.value, t.type), t.scale))

const componentObj = {}
for (const t of componentFlat)
  setDeep(componentObj, camelPath(t.path), applyScale(normalize(t.value, t.type), t.scale))

const typographyObj = {}
for (const t of composites) {
  // semantic.typography.body.l-regular -> "body-l-regular"
  const key = t.path.slice(2).join('-')
  typographyObj[key] = {
    fontFamily: quoteFamily(t.value.fontFamily),
    fontSize: t.value.fontSize,
    fontWeight: t.value.fontWeight,
    lineHeight: t.value.lineHeight,
    letterSpacing: normalize(t.value.letterSpacing, 'letterSpacing'),
  }
}

const ts = `// 자동 생성 파일입니다. 직접 수정하지 말고 tokens/*.json 을 고친 뒤 \`node scripts/build-tokens.mjs\` 를 실행하세요.

/**
 * @internal 디자인 시스템 내부용입니다. 화면 작업에서는 semantic / typography 를 쓰세요.
 */
export const primitive = ${JSON.stringify(primitiveObj, null, 2)} as const

/** typography 를 제외한 semantic 토큰 (spacing 등). */
export const semantic = ${JSON.stringify(semanticObj, null, 2)} as const

export const typography = ${JSON.stringify(typographyObj, null, 2)} as const

/**
 * @internal 컴포넌트 구현 전용입니다. 화면 작업에서는 semantic / typography 를 쓰세요.
 */
export const components = ${JSON.stringify(componentObj, null, 2)} as const

export type TypographyToken = keyof typeof typography
export type TypographyStyle = (typeof typography)[TypographyToken]

/** CSS-in-JS 스타일 객체를 돌려줍니다. 예: css(typo('body/1')) */
export function typo(token: TypographyToken): TypographyStyle {
  return typography[token]
}
`
writeFileSync(resolvePath(ROOT, 'build/tokens.ts'), ts)

console.log(
  `생성 완료: primitive ${primitives.length}개, semantic ${semanticFlat.length}개, ` +
    `components ${componentFlat.length}개, typography ${composites.length}개 -> build/tokens.css, build/tokens.ts`,
)
