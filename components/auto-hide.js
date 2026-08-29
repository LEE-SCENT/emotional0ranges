/**
 * 스크롤 방향에 따라 화면에 붙어 있는 것들을 감췄다 보여줍니다.
 *
 *   <header class="gnb" data-auto-hide="up">
 *   <nav class="app-bar app-bar--fixed" data-auto-hide="down">
 *
 *   import { initAutoHide } from './components/auto-hide.js'
 *   initAutoHide()
 *
 * 값(up/down)은 어느 쪽으로 물러나는지를 뜻하고, 실제 거리는 CSS 가 정합니다.
 * 여기서는 `is-hidden` 만 붙였다 뗍니다.
 *
 * 방향만 보고 바로 반응하면 손가락을 뗄 때의 미세한 흔들림이나 고무줄 스크롤에도
 * 상단바가 깜빡입니다. 그래서 두 가지를 둡니다 —
 *
 *   THRESHOLD  한 방향으로 이만큼은 움직여야 방향이 바뀐 것으로 봅니다.
 *   TOP_ZONE   맨 위 근처에서는 무조건 보입니다. 페이지를 막 열었을 때 헤더가
 *              사라져 있으면 어디에 있는지 알 수 없습니다.
 *
 * ⚠️ 두 값 모두 Figma 에 없어 코드에서 정했습니다.
 */

const THRESHOLD = 8
const TOP_ZONE = 80

export function initAutoHide(scope = document) {
  const targets = [...scope.querySelectorAll('[data-auto-hide]')]
  if (!targets.length) return

  let lastY = Math.max(0, window.scrollY)
  let hidden = false
  let queued = false

  const apply = () => {
    for (const el of targets) el.classList.toggle('is-hidden', hidden)
  }

  const measure = () => {
    queued = false
    const y = Math.max(0, window.scrollY)
    const dy = y - lastY
    if (Math.abs(dy) < THRESHOLD) return
    lastY = y

    const next = y > TOP_ZONE && dy > 0
    if (next === hidden) return
    hidden = next
    apply()
  }

  addEventListener(
    'scroll',
    () => {
      if (queued) return
      queued = true
      requestAnimationFrame(measure)
    },
    { passive: true },
  )
}
