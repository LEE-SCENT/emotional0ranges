/**
 * HTML 이 참조하는 로컬 CSS·JS 링크에 내용 해시를 붙인다.
 *
 * GitHub Pages 는 정적 파일에 캐시 헤더를 붙여 내보내서, 파일을 고쳐 배포해도
 * 브라우저가 한동안 옛 파일을 계속 씁니다. 이름이 그대로라 새 파일인 줄 모르기 때문입니다.
 * 그래서 내용이 바뀌면 URL 도 바뀌도록 ?v=<해시> 를 붙입니다.
 *
 * 타임스탬프가 아니라 내용 해시인 이유는, 바뀐 게 없으면 URL 도 그대로여야
 * 매 빌드마다 git diff 가 생기지 않기 때문입니다.
 *
 * 실행: node scripts/stamp-assets.mjs   (npm run build 에 포함)
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LINK = /(href|src)="\.\/((?:build|components|fonts)\/[^"?]+\.(?:css|js))(?:\?v=[^"]*)?"/g

const hash = (path) =>
  createHash('sha256').update(readFileSync(path)).digest('hex').slice(0, 8)

let stamped = 0
for (const file of readdirSync(ROOT).filter((f) => f.endsWith('.html'))) {
  const abs = resolve(ROOT, file)
  const before = readFileSync(abs, 'utf8')
  const after = before.replace(LINK, (whole, attr, path) => {
    const target = resolve(ROOT, path)
    if (!existsSync(target)) throw new Error(`${file} 가 없는 파일을 참조합니다: ${path}`)
    stamped++
    return `${attr}="./${path}?v=${hash(target)}"`
  })
  if (after !== before) writeFileSync(abs, after)
}
console.log(`에셋 링크 ${stamped}개에 내용 해시를 붙였습니다`)
