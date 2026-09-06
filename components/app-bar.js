/**
 * 앱바를 누르는 동안 아이콘이 잠깐 움츠립니다.
 *
 *   import { initAppBarPress } from './components/app-bar.js'
 *   initAppBarPress()
 *
 * 탭을 눌러 화면이 바뀌기까지는 한 박자가 있습니다. 그 사이에 아무 일도 일어나지
 * 않으면 눌린 줄 모르고 한 번 더 누르게 됩니다 — 손끝에서 무언가 일어났다는 신호가
 * 필요합니다. 크기만 잠깐 줄었다 돌아오고, 색은 건드리지 않습니다: 색이 바뀌면
 * 지금 보고 있는 탭(is-active)과 헷갈립니다.
 *
 * `:active` 만으로는 손가락에 반응하지 않습니다. 사파리는 터치에서 그 상태를 잘
 * 주지 않아, 마우스로는 움츠리던 아이콘이 폰에서는 아무 일도 하지 않습니다 —
 * 하필 앱바는 폰에만 있는 줄입니다(찜 버튼도 같은 이유로 이 방식을 씁니다).
 */

const PRESSING = 'is-pressing'

/**
 * 지금 보고 있는 탭의 아이콘이 아래에서부터 오렌지로 차오릅니다.
 *
 * 마크업에는 아이콘이 하나뿐입니다 — 켜진 탭은 채운 아이콘, 나머지는 선 아이콘.
 * 차오르게 하려면 두 겹이 필요해서, 선 아이콘을 바닥에 깔고 그 위에 채운 아이콘을
 * 오렌지 면으로 덮은 뒤 아래에서 위로 걷어 올립니다. 면은 아이콘 모양으로
 * 잘라냅니다(mask) — 스프라이트의 <use> 는 그렇게 자를 수 없어 개별 파일을 씁니다
 * (필터바의 돋보기, 빈 결과의 심벌과 같은 방법입니다).
 *
 * 화면이 바뀌며 새 문서가 뜨므로, 이 모션은 누른 화면이 아니라 도착한 화면에서
 * 재생됩니다 — 누른 손에는 아이콘이 움츠리는 것으로 답하고(is-pressing), 도착한
 * 자리에서 그 탭이 차오릅니다.
 */
function fill(item) {
  const svg = item.querySelector('.app-bar__icon')
  const use = svg?.querySelector('use')
  const name = use?.getAttribute('href')?.replace('#icon-', '')
  if (!name) return

  const base = name.replace(/Filled$/, '')

  /* 바닥은 늘 선 아이콘입니다. 켜진 탭도 채운 것을 그대로 두면 차오를 자리가
     없습니다 — 채운 모습은 위에 덮이는 면이 만듭니다. */
  use.setAttribute('href', `#icon-${base}`)

  const glyph = document.createElement('span')
  glyph.className = 'app-bar__glyph'
  svg.replaceWith(glyph)
  glyph.append(svg)

  const layer = document.createElement('span')
  layer.className = 'app-bar__fill'
  /* 이 값이 마크업이 아니라 코드에서 오는 것은 탭마다 아이콘이 달라 CSS 한 줄로는
     정할 수 없기 때문이고, 절대 주소로 적는 것은 상대 주소가 어디를 기준으로
     풀리는지가 브라우저마다 다르기 때문입니다 — 크롬은 이 변수를 쓰는 스타일시트
     (components/)를, 표준은 값을 적어둔 자리(문서)를 봅니다. 이 파일을 기준으로
     한 번에 절대 주소를 만들면 어느 쪽이든 같은 곳을 가리킵니다. */
  const src = new URL(`../build/icons/${base}Filled.svg`, import.meta.url).href
  layer.style.setProperty('--app-bar-fill', `url('${src}')`)
  glyph.append(layer)

  /* 켜진 탭만 차오릅니다. 한 프레임 뒤에 켜는 것은, 걷히기 전 모습이 한 번은
     그려져야 전환이 일어나기 때문입니다 — 처음부터 걷혀 있으면 그냥 채워진 채로
     떠서 아무것도 오르지 않습니다. */
  if (item.classList.contains('is-active')) {
    requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.add('is-on')))
  }
}

export function initAppBarPress(scope = document) {
  for (const bar of scope.querySelectorAll('.app-bar')) {
    if (bar.dataset.pressReady) continue
    bar.dataset.pressReady = '1'

    for (const item of bar.querySelectorAll('.app-bar__item')) fill(item)

    const press = (e, on) => {
      const item = e.target.closest('.app-bar__item')
      if (item) item.classList.toggle(PRESSING, on)
    }

    bar.addEventListener('pointerdown', (e) => press(e, true))
    /* 떼는 것뿐 아니라 손가락이 미끄러져 나가는 것(cancel·leave)도 함께 풉니다 —
       그러지 않으면 누르다 만 아이콘이 줄어든 채로 남습니다. */
    for (const type of ['pointerup', 'pointercancel', 'pointerleave']) {
      bar.addEventListener(type, (e) => press(e, false))
    }
    /* 화면이 바뀌지 않고 돌아오는 경우(뒤로가기로 되돌아온 페이지)에도 남지 않게. */
    addEventListener('pageshow', () => {
      for (const item of bar.querySelectorAll('.' + PRESSING)) item.classList.remove(PRESSING)
    })
  }
}
