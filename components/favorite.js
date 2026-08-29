/**
 * 찜 버튼을 켜고 끕니다.
 *
 *   <button class="btn …" data-favorite aria-label="찜하기">
 *     <svg class="btn__icon"><use href="#icon-favorite"></use></svg>
 *   </button>
 *
 *   import { initFavorites } from './components/favorite.js'
 *   initFavorites()
 *
 * 색만 바꾸지 않고 아이콘 자체를 빈 하트에서 채워진 하트로 갈아 끼웁니다.
 * 색 하나로만 알리면 흑백 화면이나 색을 구분하기 어려운 눈에는 아무 일도
 * 일어나지 않은 것처럼 보입니다.
 *
 * aria-pressed 로 눌린 상태를 알리고, 이름도 "찜하기"와 "찜 해제"로 바꿉니다 —
 * 버튼 이름이 그대로면 스크린 리더에는 아무것도 달라지지 않습니다.
 */

const ICON = { on: '#icon-favoriteFilled', off: '#icon-favorite' }
const LABEL = { on: '찜 해제', off: '찜하기' }

function apply(btn, on) {
  btn.classList.toggle('is-favorite', on)
  btn.setAttribute('aria-pressed', String(on))
  btn.setAttribute('aria-label', on ? LABEL.on : LABEL.off)
  btn.querySelector('use')?.setAttribute('href', on ? ICON.on : ICON.off)
}

export function initFavorites(scope = document) {
  for (const btn of scope.querySelectorAll('[data-favorite]')) {
    if (btn.dataset.favoriteReady) continue
    btn.dataset.favoriteReady = '1'
    apply(btn, btn.classList.contains('is-favorite'))
    btn.addEventListener('click', () => apply(btn, !btn.classList.contains('is-favorite')))
  }
}
