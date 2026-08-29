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
    })

    document.fonts?.ready.then(() => move(root, false))
    new ResizeObserver(() => move(root, false)).observe(root)

    move(root, false)
  }
}
