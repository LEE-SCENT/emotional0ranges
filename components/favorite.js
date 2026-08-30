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
 *
 * 누르는 동안 하트가 움츠리는 것은 CSS 가 그리지만, 그 "누르는 동안"을 여기서
 * 알려줍니다. 사파리는 터치에 :active 를 잘 주지 않아, 마우스로는 움츠리던 하트가
 * 폰에서는 색만 바뀌었습니다.
 *
 * 같은 것을 가리키는 버튼이 화면에 둘 있을 수 있습니다. 상세 화면은 넓을 때 제목
 * 아래에, 좁을 때 상단 줄에 하트를 두는데 둘 다 문서에는 남아 있습니다. 하나를
 * 누르면 나머지도 함께 바뀌어야 합니다 — 폭을 넘나드는 순간 찜한 적 없는 하트가
 * 나타나면 눌렀던 것이 없던 일이 됩니다. data-favorite 값이 같으면 한 짝입니다.
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

    // 손이나 마우스가 닿는 동안. 떼는 자리를 셋 다 듣는 것은, 누른 채 버튼 밖으로
    // 끌고 나가면 up 이 오지 않아 움츠린 채로 남기 때문입니다.
    const press = (on) => btn.classList.toggle('is-pressing', on)
    btn.addEventListener('pointerdown', () => press(true))
    for (const type of ['pointerup', 'pointercancel', 'pointerleave']) {
      btn.addEventListener(type, () => press(false))
    }

    btn.addEventListener('click', () => {
      const on = !btn.classList.contains('is-favorite')
      // 값이 비어 있으면 짝이 없는 버튼입니다. 그때는 자기 자신만 바꿉니다.
      const name = btn.dataset.favorite
      const pair = name
        ? document.querySelectorAll(`[data-favorite="${name}"]`)
        : [btn]
      for (const el of pair) apply(el, on)
    })
  }
}
