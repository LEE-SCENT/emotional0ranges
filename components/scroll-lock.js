/**
 * 팝업이 떠 있는 동안 뒤 페이지가 스크롤되지 않게 합니다.
 *
 *   import { lockScroll, unlockScroll } from './components/scroll-lock.js'
 *
 * 겹쳐 뜨는 것들이 있어 수를 셉니다. 시트 위에 묻는 창이 뜨면 둘 다 잠그는데,
 * 창이 닫힐 때 그냥 풀어버리면 아직 열려 있는 시트 뒤로 페이지가 다시 흐릅니다 —
 * 닫히는 중이던 창이 그 순간 위로 튑니다. 마지막 하나가 닫힐 때만 풉니다.
 */

let depth = 0

export function lockScroll() {
  depth += 1
  if (depth === 1) document.documentElement.style.overflow = 'hidden'
}

export function unlockScroll() {
  depth = Math.max(0, depth - 1)
  if (depth === 0) document.documentElement.style.overflow = ''
}
