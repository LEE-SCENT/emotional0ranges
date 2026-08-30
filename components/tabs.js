/**
 * 탭의 밑줄을 옮깁니다.
 *
 *   import { initTabs } from './components/tabs.js'
 *   initTabs()
 *
 * 항목 폭이 글자 수에 따라 달라 CSS 만으로는 밑줄 자리를 알 수 없어, 여기서 재서
 * --tabs-thumb-x / --tabs-thumb-w 로 넘깁니다. 미끄러지는 것은 CSS 가 합니다.
 *
 * segmented-control.js 와 같은 방식이고, 같은 함정도 있습니다 — 폰트가 늦게 오면
 * 글자 폭이 달라지는데 그때도 전환이 살아 있으면 밑줄이 저 혼자 자랍니다. 다시
 * 재는 경우에는 전환을 잠깐 끄고 값만 갈아끼웁니다.
 */

const ACTIVE = 'is-active'

function move(root, animate = true) {
  const thumb = root.querySelector('.tabs__thumb')
  const active = root.querySelector('.' + ACTIVE)
  if (!thumb || !active) return
  if (!animate) root.classList.remove('is-ready')
  root.style.setProperty('--tabs-thumb-x', `${active.offsetLeft}px`)
  root.style.setProperty('--tabs-thumb-w', `${active.offsetWidth}px`)
  if (!animate) {
    void root.offsetWidth
    root.classList.add('is-ready')
  }
}

function select(root, item) {
  for (const el of root.querySelectorAll('.tabs__item')) {
    const on = el === item
    el.classList.toggle(ACTIVE, on)
    if (on) el.setAttribute('aria-current', 'true')
    else el.removeAttribute('aria-current')
  }
  move(root)
}

export function initTabs(scope = document) {
  for (const root of scope.querySelectorAll('.tabs')) {
    if (root.dataset.tabsReady) continue
    root.dataset.tabsReady = '1'

    root.addEventListener('click', (e) => {
      const item = e.target.closest('.tabs__item')
      if (!item || !root.contains(item)) return
      select(root, item)

      /* 브라우저에 맡기지 않고 여기서 옮깁니다.
         탭이 화면 위에 붙어 있어, 그냥 두면 섹션의 첫 줄이 탭 뒤로 들어갑니다.
         붙는 자리(--detail-sticky-top)와 탭 높이를 합한 만큼 위를 비웁니다.

         갈 곳이 없는 탭도 있습니다. href 가 없으면 아무 데도 가지 않습니다 —
         빈 href("#")를 두면 누를 때마다 문서 맨 위로 튑니다. */
      const id = item.getAttribute('href')
      if (!id || !id.startsWith('#') || id === '#') return
      const target = document.querySelector(id)
      if (!target) return

      e.preventDefault()
      const tabs = getComputedStyle(root)
      const stuck = root.getBoundingClientRect().height
      const top =
        parseFloat(tabs.getPropertyValue('top')) ||
        parseFloat(tabs.getPropertyValue('inset-block-start')) ||
        0
      /* 섹션이 평소 앞 내용과 두는 만큼은 남겨둡니다. 탭 바로 밑에 딱 붙여 세우면
         사진이 탭에 얹힌 것처럼 보이고, 눌러서 온 자리가 원래 그 자리와 달라집니다.

         자기 위 여백(margin)을 가진 섹션은 그만큼, 없는 섹션은 탭이 아래로 비워둔
         만큼입니다 — 소개는 탭이 띄워주고 리뷰는 스스로 띄웁니다(detail.css). */
      const own = parseFloat(getComputedStyle(target).marginBlockStart) || 0
      const room = own || parseFloat(tabs.marginBlockEnd) || 0
      const y = target.getBoundingClientRect().top + window.scrollY - stuck - top - room
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
    })

    document.fonts?.ready.then(() => move(root, false))
    new ResizeObserver(() => move(root, false)).observe(root)

    move(root, false)
  }
}
