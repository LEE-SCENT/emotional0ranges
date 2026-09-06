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

export function initAppBarPress(scope = document) {
  for (const bar of scope.querySelectorAll('.app-bar')) {
    if (bar.dataset.pressReady) continue
    bar.dataset.pressReady = '1'

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
