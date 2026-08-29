/**
 * GNB 가 화면 위에 붙었는지 알려주는 최소한의 스크립트.
 *
 *   import { initStickyGnb } from './components/gnb.js'
 *   initStickyGnb()
 *
 * position: sticky 는 "붙어 있는 중"이라는 상태를 CSS 로 노출하지 않습니다.
 * 여기서 is-sticky 를 붙이고 모양은 CSS 가 정합니다.
 *
 * 스크롤 이벤트마다 클래스를 만지지 않도록 값이 바뀔 때만 씁니다.
 */
export function initStickyGnb(root = document.querySelector('.gnb')) {
  if (!root || root.dataset.stickyReady) return
  root.dataset.stickyReady = '1'

  let stuck = null
  const update = () => {
    const next = window.scrollY > 0
    if (next === stuck) return
    stuck = next
    root.classList.toggle('is-sticky', next)
  }

  addEventListener('scroll', update, { passive: true })
  update()
}
