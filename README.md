# Design System — Tokens

Figma `Foundation` 컬렉션을 코드 토큰으로 옮긴 저장소입니다. 현재 **Typography** 와 **Color(primitive)** 가 들어있습니다.

## 구조

```
tokens/                        ← 손으로 고치는 곳 (DTCG 포맷)
  primitive.typography.json
  primitive.color.json
  primitive.rounded.json
  primitive.dimension.json
  primitive.motion.json
  semantic.typography.json
  semantic.color.json
  semantic.spacing.json
  semantic.layout.json
  components.badge.json
  components.button.json
  components.tooltip.json
  components.segmentedControl.json
  components.gnb.json
  components.kv.json
  components.footer.json
icons/figma-export/            ← Figma에서 내려받은 원본 SVG (그대로 보존)
logo/figma-export/             ← 로고 원본 SVG
logo/sns/                      ← SNS 아이콘 PNG
fonts/pretendard/              ← Pretendard Variable 자체 호스팅 (OFL 1.1)
components/                    ← 손으로 쓰는 컴포넌트 CSS
  container.css
  badge.css  button.css  button-group.css
  kv.css  kv.js
  segmented-control.css  segmented-control.js
  tooltip.css  gnb.css  footer.css
scripts/
  build-tokens.mjs             ← tokens/*.json 전체를 깊게 병합해 CSS·TS 생성
  build-icons.mjs              ← 원본 SVG 정리 -> 개별 SVG·스프라이트·TS
  build-logo.mjs               ← 로고 원본 정리 -> variant별 SVG·스프라이트·TS
  serve.mjs                    ← preview.html 용 정적 서버
build/                         ← 전부 자동 생성. 직접 고치지 마세요
  tokens.css  tokens.ts
  icons.svg   icons.ts   icons/*.svg
  logo.svg    logo.ts    logo/*.svg
preview.html                   ← 토큰·아이콘 렌더링 확인용
components.html                ← 컴포넌트 렌더링 확인용
home.html                      ← 서비스 홈 화면 (GNB + KV)
```

```bash
npm run build      # 토큰 + 아이콘 + 로고 전체
npm run preview    # http://localhost:4321/preview.html
```

토큰 이름이 두 파일에서 겹치면 빌드가 에러로 멈춥니다.

---

## 레이어 규칙 — 무엇을 쓸 수 있나

| 레이어 | 공개 | CSS 변수 |
| --- | --- | --- |
| **semantic** | ✅ 화면 작업에서 쓰는 유일한 레이어 | `--colors-fg`, `--spacing-400`, `--typography-*` |
| primitive | ❌ 내부용 | `--_colors-serious-gray-900`, `--_dimension`, `--_rounded-m` |
| components | ❌ 내부용 | `--_badge-bg`, `--_badge-size-m` |

내부용 토큰은 이름이 **`--_` 로 시작**합니다. 문서로만 적어두면 지켜지지 않으니 이름으로 드러냈고,
이렇게 하면 위반을 기계적으로 잡을 수 있습니다.

```bash
grep -rn -- '--_' src/          # 내부 토큰을 직접 쓴 곳 찾기
```

primitive 를 직접 쓰면 당장은 같은 색이 나오지만, 나중에 다크모드를 넣거나 팔레트를 바꿀 때
semantic 만 갈아끼우는 방식이 통하지 않게 됩니다. 그래서 막습니다.

---

## Typography

### primitive

화면 작업에서 직접 쓰지 마세요. Figma에 등록된 원시값입니다.

| 그룹 | 값 |
| --- | --- |
| `fontFamily` | Pretendard (+ 웹 폴백 스택) |
| `fontSize` | 100=10 · 150=12 · 250=14 · 350=16 · 500=20 · 700=24 · 750=28 · 900=36 · 1050=44 · 1150=52 (px) |
| `fontWeight` | regular-400=400 · medium-500=500 · semibold-600=600 |
| `lineHeight` | 110=110% · 130=130% · 140=140% · 150=150% |
| `letterSpacing` | 0=0% · n2=-2% · n3=-3% |

### semantic

Figma 텍스트 스타일과 1:1 대응합니다. 실제 화면 작업에서는 이쪽만 씁니다.

| 토큰 | size | line-height | weight | tracking |
| --- | --- | --- | --- | --- |
| `display-xl-semibold` | 52 | 130% | 600 | -2% |
| `display-m-semibold` | 44 | 130% | 600 | -2% |
| `heading-l-semibold` | 36 | 110% | 600 | 0 |
| `heading-m-semibold` | 28 | 130% | 600 | 0 |
| `heading-s-semibold` | 24 | 140% | 600 | 0 |
| `heading-xs-semibold` | 20 | 140% | 600 | 0 |
| `body-l-{semibold,medium,regular}` | 16 | 150% | 600/500/400 | 0 |
| `body-m-{semibold,medium,regular}` | 14 | 140% | 600/500/400 | 0 |
| `body-s-{semibold,medium,regular}` | 12 | 130% | 600/500/400 | 0 |
| `body-xs-{semibold,medium,regular}` | 10 | 130% | 600/500/400 | 0 |

`body` 는 크기별로 semibold / medium / regular 3단을 모두 갖습니다 (총 18개).

### letter-spacing 은 em 으로 변환됩니다

토큰은 Figma와 같은 퍼센트(`-2%`)로 정의하지만, **CSS `letter-spacing` 은 퍼센트를 받지 않습니다.**
그래서 빌드 시 `em` 으로 바꿉니다 — `-2%` → `-0.02em`. `em` 은 자기 font-size 기준이라
Figma 퍼센트와 계산 결과가 정확히 같습니다. `tokens/*.json` 은 `%`, `build/*` 는 `em` 입니다.

### line-height 퍼센트 주의점

CSS에서 `line-height: 150%` 는 **계산된 px 값이 자식에게 상속**됩니다. 배수(`1.5`)는 비율 그대로
상속되어 자식이 자기 font-size 기준으로 다시 계산하지만, 퍼센트는 그렇지 않습니다.

```html
<div class="typography-body-l-regular">              <!-- 16px × 150% -> 24px로 확정 -->
  <span class="typography-body-xs-regular">…</span>  <!-- 10px인데 줄간격 24px를 물려받음 -->
</div>
```

유틸리티 클래스는 항상 5개 프로퍼티를 모두 지정하므로 클래스를 붙이면 이 문제는 생기지 않습니다.
변수를 개별 참조할 때만 주의하세요.

---

## Color

### semantic (공개)

화면 작업에서 쓰는 유일한 컬러 레이어입니다. `bg-*` 는 배경, `fg-*` 는 전경(텍스트·아이콘),
`border` 는 테두리이고 접미사 없는 것이 기본값입니다.

| 토큰 | 참조 | CSS 변수 |
| --- | --- | --- |
| `bg` | white | `--colors-bg` |
| `bg-low` | seriousGray 100 | `--colors-bg-low` |
| `bg-disabled` | seriousGray 50 | `--colors-bg-disabled` |
| `bg-transparent` | seriousGray alpha 900/8 | `--colors-bg-transparent` |
| `bg-brand` | twistOrange 500 | `--colors-bg-brand` |
| `bg-contrast` | black | `--colors-bg-contrast` |
| `bg-critical` | accentRed 50 | `--colors-bg-critical` |
| `fg` | black | `--colors-fg` |
| `fg-low` | seriousGray 700 | `--colors-fg-low` |
| `fg-lower` | seriousGray 600 | `--colors-fg-lower` |
| `fg-lowest` | seriousGray 500 | `--colors-fg-lowest` |
| `fg-disabled` | seriousGray 400 | `--colors-fg-disabled` |
| `fg-brand` | twistOrange 500 | `--colors-fg-brand` |
| `fg-contrast` | white | `--colors-fg-contrast` |
| `fg-success` | accentGreen 400 | `--colors-fg-success` |
| `fg-critical` | accentRed 500 | `--colors-fg-critical` |
| `border` | seriousGray 300 | `--colors-border` |
| `divider` | seriousGray 300 | `--colors-divider` |

`border` 와 `divider` 는 지금 값이 같지만 역할이 달라 별도 토큰입니다 — 테두리와 구분선의
농도를 따로 조정하고 싶어지는 순간, semantic 레이어가 있어서 컴포넌트를 안 건드리고 바꿀 수 있습니다.

`low` → `lower` → `lowest` 순으로 대비가 낮아집니다. `-contrast` 는 반전 배경 위에 올릴 때 쓰며
`bg-contrast` 위에는 `fg-contrast` 가 짝입니다. `-brand` 는 강조가 필요한 자리(선택된 탭, 뱃지)에 씁니다.

```css
.card        { background: var(--colors-bg); color: var(--colors-fg); }
.card__meta  { color: var(--colors-fg-lower); }
.card--error { background: var(--colors-bg-critical); color: var(--colors-fg-critical); }
.divider     { border-top: 1px solid var(--colors-divider); }
.tab--active { background: var(--colors-bg-brand); color: var(--colors-fg-contrast); }
```

### primitive (내부용)

semantic 이 참조하는 팔레트입니다. 화면 작업에서 직접 쓰지 마세요.

| 그룹 | 스케일 | 용도 |
| --- | --- | --- |
| `black` / `white` | — | #000000 / #FFFFFF |
| `whiteAlpha` | 15 | 어두운 배경 위 밝은 오버레이 |
| `twistOrange` | 50 → 900 (10단계) | 브랜드 주조색 |
| `seriousGray` | 50 → 900 (10단계) + `alpha` | 텍스트·보더·배경 중립색 |
| `casualNeutral` | 50 / 100 / 200 | 따뜻한 톤의 중립색 |
| `accentRed` | 50 / 500 | 경고·오류·할인 |
| `accentGreen` | 50 / 400 / 500 | 성공·완료 |

### alpha (반투명)

| 토큰 | 값 | CSS 변수 |
| --- | --- | --- |
| `seriousGray.alpha900.4` | `#2726250A` — 900을 4% | `--_colors-serious-gray-alpha900-4` |
| `seriousGray.alpha900.8` | `#27262514` — 900을 8% | `--_colors-serious-gray-alpha900-8` |
| `seriousGray.alpha900.25` | `#27262540` — 900을 25% | `--_colors-serious-gray-alpha900-25` |
| `twistOrange.alpha500.85` | `#F75D15D9` — 500을 85% | `--_colors-twist-orange-alpha500-85` |
| `whiteAlpha.15` | `#FFFFFF26` — white를 15% | `--_colors-white-alpha-15` |
| `whiteAlpha.85` | `#FFFFFFD9` — white를 85% | `--_colors-white-alpha-85` |

불투명 색과 달리 **아래 배경이 비쳐야 하는 곳**에 씁니다 — hover/press 오버레이, 딤 레이어처럼
같은 위젯이 어떤 배경 위에 놓이든 자연스럽게 어두워지거나 밝아져야 하는 경우입니다.
`alpha900/8` 은 semantic `bg-transparent` 로 공개돼 있습니다.

8자리 hex 의 마지막 두 자리가 알파입니다. 퍼센트를 255 스케일로 바꾸면서 약간 반올림됩니다 —
4% → `0A`(3.92%), 8% → `14`(7.84%), 15% → `26`(14.9%), 25% → `40`(25.1%), 85% → `D9`(85.1%). Figma가 8자리 hex 로 export 할 때와
같은 값이라 왕복해도 어긋나지 않습니다.

`whiteAlpha` 만 그룹 이름이 Figma 경로(`colors/white/alpha/15`)와 다릅니다. DTCG 에서 토큰은 자식을
가질 수 없는데 `white` 가 이미 토큰이라 형제 그룹으로 뺐습니다. 토큰 아래에 그룹을 중첩하면
조용히 무시되는 대신 빌드가 에러로 멈춥니다.

---

## Breakpoint & Container

화면 티어는 넷입니다. 가장 좁은 쪽이 기본이고 위로 올라가며 덮어씁니다(mobile first).

| 티어 | 폭 | 좌우 여백 | 최대폭 |
| --- | --- | --- | --- |
| — | ~440 | 20 | — |
| `sm` | 441~960 | 20 | — |
| `md` | 961~1600 | 24 | 1200 |
| `lg` | 1601~ | 24 | 1440 (`--wide` 는 1600) |

```css
@import "./components/container.css";
```

```html
<div class="container"> … </div>
```

`.container` 는 `max-inline-size` 에 여백을 더해 잡습니다(`1200 + 24×2 = 1248`). 그래야 최대폭에
도달한 뒤에도 콘텐츠가 실제로 1200 이 되고, 여백이 콘텐츠를 파고들지 않습니다.

검증한 값 — 960 에서 여백 20 · 최대폭 none, **961** 에서 24 · 1248, 1600 까지 유지, **1601**
에서 1488 로 전환. 두 경계 모두 1px 단위로 확인했습니다.

`.container--wide` 는 `1601~` 에서만 한 단계 넓은 1600 을 씁니다. KV 처럼 화면을 크게 쓰는
영역용이며, 본문 기본 폭까지 함께 넓히면 글줄이 너무 길어지므로 분리했습니다.

441 경계에는 `.container` 규칙이 없습니다. 여백이 `~440` 과 같기 때문이며, 티어가 나뉜 이유는
그 안에서 다른 요소의 레이아웃이 달라지기 때문입니다.

⚠️ **미디어 쿼리는 `var()` 를 받지 못합니다.** 조건에 `--breakpoint-*` 토큰을 쓸 수 없어
숫자가 CSS 에 박혀 있습니다(`container.css` 2 곳, `gnb.css` 2 곳). 값을 바꿀 때는
`tokens/semantic.layout.json` 과 함께 고쳐야 합니다.

---

## Motion (primitive)

| 그룹 | 값 |
| --- | --- |
| `duration` | fast 120ms · base 240ms · slow 400ms |
| `easing` | standard `cubic-bezier(0.2, 0, 0, 1)` · decelerate · accelerate |

`standard` 는 빠르게 출발해 부드럽게 멈춥니다 — 사용자 조작에 대한 반응의 기본값입니다.

⚠️ Figma 에 변수로 없습니다. SegmentedControl 모션이 필요해져 코드에서 신규 정의했습니다.
Figma 에도 같은 이름/값으로 추가해야 양쪽이 일치합니다.

---

## Rounded (primitive)

| 토큰 | 값 | CSS 변수 |
| --- | --- | --- |
| `xs` | 4px | `--rounded-xs` |
| `s` | 6px | `--rounded-s` |
| `m` | 8px | `--rounded-m` |
| `l` | 12px | `--rounded-l` |
| `xl` | 16px | `--rounded-xl` |
| `full` | 9999px | `--rounded-full` |

```css
.chip   { border-radius: var(--rounded-s); }
.card   { border-radius: var(--rounded-l); }
.avatar { border-radius: var(--rounded-full); }
```

`full` 은 실제 반지름이 아니라 "한계까지 둥글게"를 뜻하는 관용값입니다. 알약 버튼·아바타·뱃지처럼
높이에 상관없이 완전히 둥근 모서리가 필요할 때 씁니다. 나머지 스케일과 성격이 달라 xs~xl 사이의
연속선상에 있지 않습니다.

---

## Spacing (semantic)

`primitive/dimension` 이라는 **기준 단위 하나(4px)** 를 두고, spacing 은 전부 그 배수입니다.

```
배수 = 토큰 이름 ÷ 100        50 → ×0.5 → 2px      400 → ×4 → 16px      4500 → ×45 → 180px
```

| 토큰 | ×n | px | | 토큰 | ×n | px | | 토큰 | ×n | px |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `50` | 0.5 | 2 | | `600` | 6 | 24 | | `2000` | 20 | 80 |
| `100` | 1 | 4 | | `700` | 7 | 28 | | `2200` | 22 | 88 |
| `150` | 1.5 | 6 | | `800` | 8 | 32 | | `2400` | 24 | 96 |
| `200` | 2 | 8 | | `900` | 9 | 36 | | `3000` | 30 | 120 |
| `250` | 2.5 | 10 | | `1000` | 10 | 40 | | `3200` | 32 | 128 |
| `300` | 3 | 12 | | `1200` | 12 | 48 | | `4000` | 40 | 160 |
| `400` | 4 | 16 | | `1500` | 15 | 60 | | `4500` | 45 | 180 |
| `500` | 5 | 20 | | `1800` | 18 | 72 | |  |  |  |

연속적인 스케일이 아니라 실제 쓰이는 배수만 있습니다 — ×11·×13·×14 자리는 비어 있습니다.

### 관계를 값으로 굳히지 않습니다

DTCG 에는 연산이 없어서 배수를 `$extensions.scale` 에 싣고, CSS 는 `calc()` 로 냅니다.

```css
--dimension:   4px;
--spacing-50:  calc(var(--dimension) * 0.5);
--spacing-100: var(--dimension);              /* ×1 은 calc 없이 */
--spacing-400: calc(var(--dimension) * 4);
```

덕분에 **`--dimension` 하나만 바꾸면 spacing 23개가 전부 따라 움직입니다.** 브라우저에서
`--dimension` 을 5px 로 바꿔 확인한 결과 2→2.5, 16→20, 180→225 로 전부 비례해 변합니다.

TypeScript 는 `calc` 를 쓸 수 없어 빌드 시점에 계산된 값이 들어갑니다.

```ts
import { primitive, semantic } from "./build/tokens"

primitive.dimension        // "4px"
semantic.spacing["400"]    // "16px"
```

```css
.card         { padding: var(--spacing-400); }      /* 16px */
.card + .card { margin-top: var(--spacing-300); }   /* 12px */
```

---

## Icons

Figma `UI Icons` 섹션(node `3:595`)에서 가져온 24×24 아이콘 16개입니다.

| 그룹 | 아이콘 |
| --- | --- |
| Default (13) | `menu` `chevronLeft` `chevronRight` `arrowBack` `close` `window` `share` `notifications` `favorite` `asterisk` `schedule` `calendarClosed` `payments` |
| Filled (3) | `scheduleFilled` `memberBlack` `windowFilled` |

Figma export 는 아이콘이 놓인 부모 프레임 배경(`#F5F5F5` rect 등)까지 함께 나옵니다.
`build-icons.mjs` 가 `<g id="icon/…">` 서브트리만 뽑아 24×24 좌표계 그대로 재포장하고,
원본 단색 `#424242` 를 `currentColor` 로 바꿉니다. 따라서 **아이콘 색은 부모의 `color` 를 따릅니다.**

원본에 없던 색이 섞여 있거나 `<g transform>` 이 있으면 빌드가 에러로 멈춥니다 —
조용히 잘못 변환되는 대신 눈에 띄게 하려는 의도입니다.

### 스프라이트로 쓰기

```html
<!-- 문서에 한 번만 인라인 -->
<div hidden id="sprite"></div>
<script type="module">
  document.getElementById('sprite').innerHTML = await (await fetch('/build/icons.svg')).text()
</script>

<button style="color: var(--colors-serious-gray-800)">
  <svg width="24" height="24"><use href="#icon-close"></use></svg>
</button>
```

### TypeScript

```ts
import { icons, iconSvg, ICON_SIZE } from "./build/icons"
import type { IconName } from "./build/icons"

iconSvg("chevronRight")        // <svg …>…</svg> 문자열
iconSvg("close", 16)           // 16px로
Object.keys(icons)             // 전체 이름 목록
```

React 등에서 쓸 때는 `icons[name]` 을 `dangerouslySetInnerHTML` 로 넣거나,
`build/icons/*.svg` 를 SVGR 같은 로더로 컴포넌트화하면 됩니다.

---

## Font

Pretendard Variable v1.3.9 를 **자체 호스팅**합니다 (`fonts/pretendard/`). CDN 을 쓰지 않는 이유는
디자인 시스템이 외부 도메인의 가용성·프라이버시에 런타임으로 묶이지 않게 하려는 것입니다.

```css
@import "./fonts/pretendard/pretendard.css";   /* tokens.css 보다 먼저 */
@import "./build/tokens.css";
```

**동적 서브셋 방식입니다.** 92 개 청크가 `unicode-range` 로 쪼개져 있어 브라우저가 실제로 쓰인
글자의 청크만 받습니다. 저장소에는 2.9MB 가 들어있지만 이 프리뷰 페이지 기준 실제 다운로드는
**92 개 중 8 개**였습니다. 단일 파일(2MB)이나 static weight 3 종(2.2MB)을 쓰면 방문자가 전부
받아야 합니다.

Variable 폰트 하나가 45–920 전 구간을 담당하므로 `regular-400` `medium-500` `semibold-600` 이
모두 한 파일에서 나오고, 나중에 weight 를 늘려도 추가 다운로드가 없습니다.

**폰트 스택 순서가 중요합니다.**

```
"Pretendard Variable", Pretendard, -apple-system, …
```

우리가 배포하는 웹폰트가 맨 앞이어야 합니다. `Pretendard` 가 앞에 오면 로컬에 static Pretendard
가 설치된 기기에서만 그쪽이 잡혀 **기기마다 렌더링이 달라집니다.** 실제로 처음엔 그 순서였고,
청크가 하나도 안 받아지는 것을 브라우저에서 확인하고 고쳤습니다.

라이선스는 SIL OFL 1.1 이며 [fonts/pretendard/LICENSE.txt](fonts/pretendard/LICENSE.txt) 에 함께
배포합니다 — 폰트 파일을 재배포할 때 라이선스 동봉이 요구됩니다.

---

## Logo

126 × 40, 워드마크 + 브랜드 심볼로 이루어져 있습니다. 두 variant 는 **기하가 완전히 동일하고
워드마크 색만 다릅니다** — 빌드가 매번 이걸 검증하고, 어긋나면 멈춥니다.

| 파일 | 용도 |
| --- | --- |
| `build/logo/original.svg` | 밝은 배경. 워드마크 `#000000` + 심볼 브랜드색 |
| `build/logo/white.svg` | 어두운 배경. 워드마크 `#FFFFFF` + 심볼 브랜드색 |
| `build/logo.svg` | 인라인·`<use>` 용. 워드마크가 `currentColor` 를 따릅니다 |

```html
<!-- 색이 박혀 있어 <img> 로 바로 쓸 수 있습니다 -->
<img src="./build/logo/original.svg" alt="emotional oranges" height="40">

<!-- 부모 color 를 따라가야 할 때는 스프라이트를 인라인하고 <use> -->
<span style="color: var(--colors-fg)">
  <svg width="126" height="40" role="img" aria-label="emotional oranges"><use href="#logo-eo"/></svg>
</span>
```

브랜드 심볼(주황)은 세 형태 모두에서 색이 고정됩니다 — 워드마크만 색을 따릅니다.
`logoSvg(height)` 로 비율을 유지한 문자열을 얻을 수도 있습니다.

---

## Components

컴포넌트 토큰은 대부분 primitive 를 참조하고, 컴포넌트 CSS 는 그 토큰만 씁니다. 둘 다 내부용이라
쓰는 쪽은 클래스 이름만 알면 됩니다.

의미가 semantic 과 같은 자리는 semantic 을 참조합니다 — `button/filled/fg-on` → `semantic/fg`,
`gnb/fg` → `semantic/fg`. "반전 배경 위의 기본 글자색"은 버튼만의 결정이 아니라 시스템 전체의
결정이므로, 나중에 `fg` 가 바뀌면 함께 움직여야 맞습니다.

```css
@import "./build/tokens.css";
@import "./components/button.css";     /* 필요한 것만 */
```

`npm run preview` 로 [components.html](components.html) 에서 전부 확인할 수 있습니다.

### 공통 규칙 두 가지

**테두리는 `box-shadow` 로 그립니다.** Figma 의 stroke 는 안쪽 정렬이라 높이에 영향을 주지
않습니다. `border` 를 쓰면 40px 버튼이 42px 이 되므로 `inset 0 0 0 1px` 을 씁니다.
badge 만 예외로 테두리가 바깥이라 `inset` 없이 씁니다.

**높이를 고정하지 않습니다.** padding + line-height 로 계산되게 두면 폰트가 바뀌어도
비율이 유지됩니다. 검증된 결과값은 각 항목에 적어뒀습니다.

### Badge

```html
<span class="badge"></span>                 <!-- 기본: 채움 8px  + 테두리 1px → 전체 10px -->
<span class="badge badge--medium"></span>   <!-- 채움 10px + 테두리 2px → 전체 14px -->
```

테두리가 채움 **바깥**에 그려져 레이아웃 박스는 `size` 그대로입니다.

| 토큰 | 값 | 참조 |
| --- | --- | --- |
| `badge/bg` | #F75D15 | twistOrange 500 |
| `badge/border` | #FFFFFF | white |
| `badge/size/m` `l` | 8px · 10px | `dimension × 2` · `× 2.5` |
| `badge/borderWidth/m` `l` | 1px · 2px | ⚠️ Figma 에 없음 |

### Button

```html
<!-- 기본형: 아이콘도 badge 도 없습니다 -->
<button class="btn btn--filled btn--medium">
  <span class="btn__label">Button</span>
</button>

<!-- 뒤따르는 아이콘 -->
<button class="btn btn--outlined btn--large">
  <span class="btn__label">Button</span>
  <svg class="btn__icon" aria-hidden="true"><use href="#icon-chevronRight"/></svg>
</button>

<!-- 아이콘만. 기본은 badge 없음 -->
<button class="btn btn--ghost btn--medium btn--icon-only" aria-label="다음">
  <svg class="btn__icon" aria-hidden="true"><use href="#icon-chevronRight"/></svg>
</button>

<!-- badge 는 기본이 아닙니다. 필요할 때만 붙입니다 -->
<button class="btn btn--ghost btn--medium btn--icon-only" aria-label="알림 3건">
  <svg class="btn__icon" aria-hidden="true"><use href="#icon-notifications"/></svg>
  <span class="badge btn__badge"></span>
</button>
```

| 축 | 값 |
| --- | --- |
| type | `--filled` `--outlined` `--ghost` `--blur` |
| size | `--s` = small (32) · `--m` = medium (40) · `--l` = large (48) |
| 변형 | `--icon-only` — 세 size 모두 지원 |
| 상태 | `.is-on` — 반전 배경 위. 각 type 의 `-on` 토큰으로 바뀝니다 |

`filled.is-on` 은 흰 배경 + `semantic/fg`(검정) 입니다. 이전에는 글자가 seriousGray 700 이라
흰 배경 대비 **2.32:1** 로 WCAG AA(본문 4.5:1)에 미달했는데, `fg` 로 바뀌며 **21:1** 이 됐습니다.

**아이콘 크기가 size 만 따라가지 않습니다.** 텍스트 버튼과 iconOnly 가 서로 다릅니다.

| size | 박스 (text / iconOnly) | 아이콘 (text / iconOnly) |
| --- | --- | --- |
| `small` | 높이 32 / **44×32** | 16 (`iconSize/xs`) / **20 (`iconSize/s`)** |
| `medium` | 높이 40 / 56×40 | 24 (`iconSize/m`) / 24 |
| `large` | 높이 48 / 60×48 | 24 (`iconSize/m`) / 28 (`iconSize/l`) |

`medium` 만 둘이 같고 `small` 과 `large` 는 iconOnly 쪽이 한 단계 큽니다. Figma 원본이 그렇습니다.

`--blur` 는 `backdrop-filter` 를 쓰므로 이미지·영상 위에서만 의미가 있습니다.
`aria-label` 은 `--icon-only` 에서 필수입니다.

### ButtonGroup

```html
<div class="btn-group btn-group--vertical">
  <button class="btn btn--filled btn--medium"><span class="btn__label">확인</span></button>
  <button class="btn btn--ghost btn--medium"><span class="btn__label">취소</span></button>
</div>
```

방향 `--vertical`(버튼이 폭을 꽉 채움) / `--horizontal`(균등 분할), 간격 기본 medium(6px) / `--gap-large`(8px).

Figma 는 gap variant 가 버튼 크기까지 함께 바꾸지만, 간격과 크기는 별개 축이라 분리했습니다 —
버튼 크기는 버튼 쪽 클래스로 정하세요.

### SegmentedControl

```html
<div class="segmented" role="tablist">
  <span class="segmented__thumb" aria-hidden="true"></span>
  <button class="segmented__item is-selected" role="tab" aria-selected="true">온라인</button>
  <button class="segmented__item" role="tab" aria-selected="false">오프라인</button>
</div>
```

```js
import { initSegmentedControls } from './components/segmented-control.js'
initSegmentedControls()
```

`--medium` 으로 높이 40 → 56. 선택된 항목만 `.is-selected` 로 브랜드 색이 채워집니다.

**선택 표시는 항목의 배경이 아니라 별도의 `__thumb` 이 맡습니다.** 배경을 켜고 끄면 즉시
점프하지만, thumb 은 위치와 폭을 함께 전환할 수 있어 미끄러지듯 이동합니다. 실제 측정값:

| 경과 | translate | width |
| --- | --- | --- |
| ~10ms | 10.3px | 72.2 |
| 60ms | 120.5px | 63.3 |
| 120ms | 146.3px | 61.2 |
| 완료 | 161px | 60 |

항목 폭이 글자 수에 따라 달라 CSS 만으로는 위치를 알 수 없어, `segmented-control.js` 가
측정해 `--segmented-thumb-x / -w` 로 넘깁니다. 전환 자체는 CSS 가 합니다.

**JS 없이도 컴포넌트는 동작합니다** — `.is-ready` 가 붙기 전에는 선택된 항목이 스스로 배경을
그려서, 미끄러지지 않을 뿐 모습은 같습니다. 스크립트가 하는 일은 이게 전부입니다:

- 클릭·화살표 키로 선택 이동 (`role="tablist"` 의 기대 동작), `aria-selected` 와 `tabindex` 갱신
- 폰트 로딩 완료 후 재측정 — 폰트가 늦게 뜨면 글자 폭이 달라져 thumb 이 어긋납니다
- `ResizeObserver` 로 재측정 — GNB 안처럼 `display:none` 이었다가 breakpoint 로 드러나는 경우,
  숨어 있는 동안 폭이 0 이라 복구가 필요합니다

`prefers-reduced-motion: reduce` 에서는 전환이 꺼집니다.

### GNB

전역 내비게이션입니다. 로고·segmentedControl·버튼·badge 를 조합하며 자체 색 토큰은 거의 없습니다.

```html
<header class="gnb">
  <div class="gnb__inner">
    <div class="gnb__start">
      <a class="gnb__logo" href="/" aria-label="emotional oranges">…</a>
      <div class="gnb__segmented">…segmentedControl…</div>
    </div>
    <div class="gnb__end">
      <nav class="gnb__menu">…ghost 버튼들…</nav>
      <div class="gnb__actions">…icon-only 버튼들…</div>
    </div>
  </div>
</header>
```

**Figma 의 width variant 를 미디어 쿼리로 옮겼습니다.** variant 마다 다른 DOM 을 쓰면 같은 내용이
중복되고 접근성·SSR 이 나빠지므로, 마크업은 하나이고 CSS 가 breakpoint 마다 배치와 표시를 바꿉니다.

| | 폭 | 패딩 | 보이는 것 |
| --- | --- | --- | --- |
| small | ~960 | 12 / 우12 좌20 | 로고 + 액션 1개 (아이콘 32px) |
| medium | 961~1600 | 16 / 24 | 로고 + segmented(간격 32) · 메뉴 + 액션(간격 16) |
| large | 1601~ | 16 / 24 | 가운데 1200px 안에 segmented + 메뉴, 로고·액션은 화면 가장자리 고정 |

GNB 컴포넌트의 Figma variant 는 자체 min-width(1025)를 갖고 있지만, 화면 전체
브레이크포인트(961)를 따르도록 맞췄습니다. Breakpoint 프레임에서도 961~1600 구간에
medium GNB 를 1025px 폭으로 넣어 1px 넘치게 배치한 흔적이 있어, 961 이 맞는 값으로 보입니다.

높이는 세 단계 모두 72px 입니다.

large 에서 로고와 액션만 흐름에서 빼내 절대 배치합니다 — `space-between` 으로는 가운데 콘텐츠를
정확히 1200px 로 고정할 수 없기 때문입니다.

**메뉴는 ghost 버튼을 그대로 쓰되 글자색만 올립니다.** 패딩·radius·타이포가 ghost 버튼과 같고,
앞으로 hover/focus 가 추가되면 그것도 따라와야 하므로 별도 컴포넌트를 만들지 않았습니다.
대신 `.btn` 셀렉터를 덮어쓰지 않고 **버튼이 읽는 변수를 이 범위에서만 재지정**합니다.

```css
.gnb__menu { --_button-ghost-fg: var(--_gnb-fg); }
```

버튼이 자기 스타일의 주인으로 남고, 특정도 싸움도 없으며, GNB 밖의 ghost 버튼은 영향받지 않습니다.
컴포넌트가 값을 박아두지 않고 변수를 읽게 만든 덕이 여기서 드러납니다.

⚠️ **breakpoint 값이 CSS 에 박혀 있습니다.** 미디어 쿼리는 `var()` 를 받지 못해
`--_gnb-breakpoint-*` 토큰을 쓸 수 없습니다. 토큰과 CSS 를 함께 고쳐야 합니다.

### Footer

```html
<footer class="footer">
  <div class="footer__info">
    <p class="footer__links">
      <span>Ⓒ 2026 Emotional 0ranges</span>
      <a class="is-strong" href="/privacy">개인정보 처리방침</a>
      <a href="/terms">이용약관</a>
    </p>
    <p class="footer__meta"><span>(주)감정적인오렌지들</span> …</p>
  </div>
  <ul class="footer__sns"><li><a href="…" aria-label="인스타그램"><img src="…" alt=""></a></li></ul>
</footer>
```

| | 크기 | 색 | 간격 |
| --- | --- | --- | --- |
| `__links` | body-s (12px) | `fg` | 4px |
| `__meta` | body-xs (10px) | `fg-lower` | 2px |

상단 구분선 1px `border`, 패딩 위 20 / 아래 48, 좌우 블록 간격 24. `.is-strong` 만 semibold 입니다.

**가운뎃점은 마크업이 아니라 `::before` 로 넣습니다.** Figma 는 `·` 를 개별 텍스트 노드로 두는데,
그러면 줄바꿈 시 점만 다음 줄 맨 앞에 남을 수 있습니다. `::before` 는 항상 뒤따르는 항목에 붙어
다녀 그 문제가 없고, 스크린리더가 항목마다 "가운뎃점"을 읽지도 않습니다.

### KV (홈 키비주얼)

배경 영상 위에 흰 텍스트와 CTA 가 올라가는 홈 최상단 영역입니다. [home.html](home.html) 에서
GNB 와 함께 조립한 결과를 볼 수 있습니다.

폭은 `.container` 규칙을 씁니다. `~1600` 까지는 Figma 의 KV 폭(400·920·976·1200)이 컨테이너
계산과 정확히 일치하고, `1601~` 에서만 `.container--wide` 로 한 단계 넓은 1600 을 씁니다.

| viewport | KV | headline | sub | 화살표 | 페이저 | radius |
| --- | --- | --- | --- | --- | --- | --- |
| 1920 | 1600×518 | 52 | 16 | 보임 | 숨김 | 20 |
| 1600 | 1200×518 | 52 | 16 | 보임 | 숨김 | 20 |
| 1024 | 976×518 | 44 | 16 | 보임 | 숨김 | 20 |
| 960 | 920×616 | 32 | 14 | 숨김 | 보임 | 12 |

**좌우 인디케이터는 버튼 컴포넌트를 그대로 씁니다** —
`btn btn--blur btn--medium btn--icon-only is-on`. 영상 위에 놓이므로 blur 타입이고
어두운 화면 위라 반전 상태입니다. 배경(whiteAlpha 15%)·글자색·`backdrop-filter` 를 버튼이
이미 갖고 있어 KV 쪽에서 색을 덮어쓰지 않습니다.

평소에는 `opacity: 0` 으로 숨어 있다가 KV 에 마우스를 올리면 120ms 에 걸쳐 나타납니다.
`display` 를 껐다 켜면 가운데 텍스트 폭이 흔들리므로 자리는 항상 차지하게 두었고,
`:focus-within` 을 함께 걸어 키보드 탭 이동에서도 보이게 했습니다.

**배경 영상은 YouTube 임베드입니다** (`9fRsFJAS1-Y`). `<video>` 가 아니라 iframe 이라
`object-fit` 이 통하지 않아, 컨테이너 쿼리 단위로 cover 를 직접 계산합니다.

```css
inline-size: calc(max(100cqw, 100cqh * 16 / 9) * var(--kv-media-overscale, 1.6));
```

`1.6` 배는 cover 를 넘어선 확대입니다. YouTube 는 채널명(좌상단)과 로고(우하단)를 플레이어
가장자리에 붙여 그려서, 딱 맞게 채우면 그 브랜딩이 그대로 노출됩니다. 넉넉히 키워 밖으로
밀어냅니다. 래퍼와 iframe 모두 `pointer-events: none` 이라 조작도 막힙니다.

### YouTube 를 다룰 때 걸린 것들

iframe 을 마크업이 아니라 `kv.js` 에서 만듭니다. `enablejsapi=1` 은 **`origin` 파라미터가
현재 페이지와 정확히 일치할 때만** 상태 메시지를 돌려주는데, 그 값은 배포 환경마다 달라
정적 HTML 에 박아둘 수 없습니다.

```html
<div class="kv__media" data-youtube="9fRsFJAS1-Y" data-title="…"></div>
```

- **일시정지 아이콘이 잠깐 보이는 문제** — 재생 시작 전 YouTube 가 띄우는 오버레이이고
  `controls=0` 으로 지워지지 않습니다. 실제 재생(state 1)이 감지될 때까지 영상을 가려두고
  그때 드러냅니다. 상태 메시지가 끝내 안 오면 2.5 초 뒤 그냥 드러냅니다.
- **리플레이 버튼이 보이는 문제** — 영상이 끝난 채 멈춰 있었다는 뜻입니다. `loop=1` 은
  `playlist=` 를 함께 요구하는데 그러면 플레이어가 재생목록으로 인식해 **이전/다음 버튼까지
  그립니다.** 그래서 loop 대신 종료(state 0)를 감지해 다시 트는 방식으로 반복합니다.
- **상태 메시지 형태** — YouTube 스크립트를 불러오지 않고 postMessage 만 들으면 상태가
  `onStateChange` 가 아니라 `infoDelivery.info.playerState` 로 옵니다. 두 형태를 모두 받습니다.

이 두 가지를 고치기 전에는 메시지가 하나도 오지 않아 영상이 2.2 초 뒤 폴백으로 나타나고
반복도 되지 않았습니다. 고친 뒤에는 602ms 에 실제 재생을 감지해 드러냅니다.

**961~1600 구간의 헤드라인은 유동입니다.** Figma 가 같은 티어의 1024 프레임과 1600 프레임에
각각 44 / 52 를 그려두어 유동 스케일로 읽었습니다. `clamp()` 로 구현했고 두 지점에서 정확히
44.0 / 52 를 찍는 것을 확인했습니다.
⚠️ 단계 전환이 의도였다면 이 `clamp` 를 고정값으로 바꿔야 합니다.

⚠️ **어둠(scrim)은 Figma 에 없습니다.** 영상 위 흰 텍스트의 대비를 위해 추가했습니다.
실제 서비스도 어두운 그라디언트를 깔고 있습니다.

### Tooltip

```html
<div class="tooltip tooltip--bottom">
  <span class="tooltip__label">온라인 매칭 지금 보러 가기</span>
</div>
```

`--bottom`(앵커 아래 → 꼬리가 위) / `--top`(앵커 위 → 꼬리가 아래), 선택 `--has-close`.

꼬리는 Figma 가 내보낸 SVG path 를 `mask-image` 로 씁니다. 꼭짓점이 둥글게 깎여 있어
CSS 삼각형(border trick)으로는 재현되지 않고, mask 라서 색은 `--_tooltip-bg` 를 따라갑니다.

위치 지정은 포함하지 않습니다 — 앵커에 `position: relative` 를 주고 배치하세요.

---

## 사용법

### CSS

```css
@import "./build/tokens.css";
```

```html
<h1 class="typography-heading-l-semibold">주문 내역</h1>
<p class="typography-body-l-regular">배송이 완료되었습니다.</p>
```

개별 프로퍼티만 쓰고 싶으면 변수를 직접 참조합니다.

```css
.custom {
  font-size: var(--typography-body-l-regular-font-size);
  line-height: var(--typography-body-l-regular-line-height);
  color: var(--colors-serious-gray-900);
}
```

### TypeScript

```ts
import { typo, typography, primitive } from "./build/tokens"

typo("body-l-regular")
// { fontFamily: "Pretendard, …", fontSize: "16px", fontWeight: 400, lineHeight: "150%", letterSpacing: "0em" }

primitive.colors.twistOrange["500"]   // "#F75D15"
```

`TypographyToken` 타입으로 컴포넌트 prop을 제한할 수 있습니다.

```ts
import type { TypographyToken } from "./build/tokens"

interface TextProps {
  variant: TypographyToken   // "body-l-regular" | "heading-m-semibold" | …
}
```

---

## 확인 필요 / 다음 단계

### Figma 원본에서 확인이 필요한 것

1. **`heading-l-semibold` 의 line-height 110% 가 스케일에서 튑니다.** 위아래(display 130%,
   heading-m 130%)와 달리 36px만 110%입니다.
2. **텍스트 스타일 이름 오타** — `dislplay-xl-semibold`(→ display), `body-l-regualr` /
   `body-s-regualr`(→ regular). 코드에는 올바른 철자로 넣었습니다.
3. **badge 의 variant 이름과 토큰 이름이 어긋납니다.** variant 는 `size=small`(8) / `size=medium`(10)
   인데 토큰은 `size/m` / `size/l` 입니다. **클래스는 Figma variant 를, 내부 토큰은 Figma 토큰명을**
   따르고 있어 `.badge--medium` 이 `--_badge-size-l` 을 참조하는 상태입니다. Figma 에서 한쪽을
   맞춰야 풀립니다.
4. **button `--blur` 의 backdrop-blur 가 상태마다 다릅니다** — 기본 7.5px, `isOn` 7px.
   의도한 차이인지 확인이 필요합니다. 코드는 7.5px 하나로 뒀습니다.
5. **iconOnly 버튼의 badge 위치가 variant 마다 다릅니다** — filled/blur medium 은 버튼 모서리,
   ghost medium 은 아이콘 모서리, large 는 또 다른 값입니다. 코드는 일관된 규칙 하나로 통일했습니다.
6. **`memberBlack` 아이콘만 네이밍 규칙이 다릅니다.** 나머지 filled 는 `scheduleFilled` /
   `windowFilled` 인데 이것만 `Black` 입니다.

### GNB 에서 발견한 것

- **메뉴 텍스트가 `#212121` 입니다** — 팔레트에 없는 값이라 `--colors-fg` 로 정리했습니다.
  같은 ghost 버튼인데 GNB 안에서만 글자색이 진한 셈이라, ghost 기본값(seriousGray 700)이 옅은 것인지
  GNB 메뉴가 애초에 ghost 가 아닌 것인지는 디자인 쪽에서 정리가 필요합니다.
- **small 의 액션 아이콘이 32px 입니다** — `iconSize` 토큰(16·24·28)에 없어 CSS 에서 예외 처리했습니다.
- **small 은 흰색 로고를 씁니다** — 배경이 지정돼 있지 않아 흰 배경에서는 로고가 보이지 않습니다.
  어두운 히어로 위에 얹는 전제라면 그 배경도 함께 정의돼야 합니다.
- small 의 `rounded: 999px`, `gap: 2px` 등이 토큰이 아닌 원시값으로 들어가 있습니다.

### Footer — SNS 아이콘

**세 아이콘 모두 흑백입니다** (`filter: grayscale(1)`). 원본 PNG 에는 브랜드 색이 그대로
들어있고 CSS 에서 걷어냅니다 — 컬러 원본을 유지해야 나중에 컬러가 필요해질 때 되돌릴 수 있습니다.

박스는 20×20 이고 `object-fit: contain` 을 씁니다. 소스 비율이 제각각(instagram 1:1,
naverBlog 0.925:1, somoim 1:1)이라 기본값 `fill` 이면 브랜드 마크가 눌립니다.

**naverBlog 만 CSS 에서 75% 로 줄입니다.** 원본 PNG 마다 여백이 다르게 구워져 있어서,
같은 박스에 넣으면 글리프 크기가 제각각으로 보입니다.

| | 잉크 영역 / 캔버스 | 20px 박스에서 글리프 (보정 전 → 후) |
| --- | --- | --- |
| instagram | 89% × 89% | 14.3 → 14.5 |
| naverBlog | **100% × 100%** | 20.0 → **15.0** |
| somoim | 74% × 72% | 14.4 → 14.5 |

naverBlog 는 글리프가 캔버스 네 변에 붙어 있어 혼자 30% 커 보였습니다.
⚠️ 근본 해결은 다른 아이콘과 같은 여백을 가진 에셋으로 다시 내보내는 것입니다.

**인스타그램만 80% 크기 + 35% 투명도인 것은 의도된 보정입니다.** 원본이 진한 아웃라인
글리프라 100% 로 두면 나머지 둘보다 훨씬 무겁게 보입니다. 흑백 변환 후 획 밝기를 재보면:

| | 현재 | 셋 다 35% 로 통일하면 |
| --- | --- | --- |
| instagram | 177 | 177 |
| naverBlog | 156 | 219 |
| somoim | 146 | 216 |

현재 편차(146–177)가 가장 좁습니다. 건드리지 마세요.

**세 이미지 모두 흰 배경이 구워져 있습니다** (투명 영역 없음). 지금 푸터 배경이 흰색이라
문제가 없지만, 어두운 배경에 푸터를 올리면 흰 사각형이 드러납니다.

> **Figma 에셋 내보내기 주의.** 푸터 노드(9:2211)에서 받은 naverBlog·somoim PNG 는 전체
> 픽셀의 알파가 0 인 빈 파일이었습니다. **개별 아이콘 노드**(9:2237, 9:2238)에서 다시 받으니
> 정상이었습니다. 깨진 둘은 알파 채널이 있는 RGBA 였고 멀쩡했던 instagram 은 RGB(알파 없음)
> 입니다 — 부모 노드 export 가 알파 채널을 0 으로 날립니다. 래스터가 비어 보이면 자식 노드에서
> 직접 받으세요.

### 아직 토큰이 아닌 값

7. `badge/borderWidth`, `button/borderWidth`, `button/blurRadius`,
   `segmentedControl/borderWidth`, `tooltip/arrow` 크기 — 전부 내보낸 SVG·stroke 에서 읽어
   코드에서 정의했습니다. Figma 에도 추가해야 양쪽이 일치합니다.
8. `segmentedControl` 선택 항목의 그림자 `0 2px 10px rgb(0 0 0 / 0.06)` 이 CSS 에 박혀 있습니다.
   그림자 토큰 체계가 아직 없습니다.

### 다음 단계

9. **딤 레이어용 진한 alpha 가 없습니다.** `seriousGray/900` 은 4·8, `whiteAlpha` 는 15 뿐입니다.
    모달 배경처럼 40·60 대가 필요해지면 추가하세요.
10. **`rounded` 에는 semantic 레이어가 없습니다.** 컴포넌트가 primitive 를 직접 참조합니다.
11. **hover / focus / disabled 상태가 디자인에 없습니다.** `.btn:disabled` 만 임시로 넣어뒀고
    나머지는 정의되지 않았습니다.
12. **`letterSpacing.n3`, `casualNeutral` 이 아직 아무데서도 쓰이지 않습니다.**
