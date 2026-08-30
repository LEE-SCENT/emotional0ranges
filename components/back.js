/**
 * 뒤로 가는 버튼.
 *
 *   <a  data-back href="./detail.html"> ← </a>
 *   <button data-back="./index.html">   ← </button>
 *
 *   import { initBack } from './components/back.js'
 *   initBack()
 *
 * 왔던 자리로 돌아갑니다(history.back). 링크로 새 화면을 여는 것과 결과가 같아 보이지만
 * 히스토리에 남는 것이 다릅니다 — 링크는 왔던 화면을 한 벌 더 쌓습니다. 결제에서 상세로
 * 링크로 나오면 [홈 · 상세 · 결제 · 상세] 가 되고, 그 상세에서 다시 뒤로를 누르면 홈이
 * 아니라 방금 나온 결제로 돌아갑니다. 실제로 그랬습니다.
 *
 * 돌아갈 곳이 없을 때(주소를 직접 열었거나 새 탭에서 열었을 때)는 적어둔 길로 갑니다 —
 * <a> 는 제 href 로, <button> 은 data-back 에 적힌 곳으로. 그래서 스크립트가 없어도
 * 링크는 링크대로 동작합니다.
 */

export function initBack(scope = document) {
  for (const el of scope.querySelectorAll('[data-back]')) {
    if (el.dataset.backReady) continue
    el.dataset.backReady = '1'

    el.addEventListener('click', (e) => {
      if (history.length > 1) {
        e.preventDefault()
        history.back()
        return
      }
      // data-back 에 길이 적혀 있으면 그리로. <a> 는 적지 않아도 href 가 데려갑니다.
      const to = el.dataset.back
      if (!to) return
      e.preventDefault()
      location.href = to
    })
  }
}
