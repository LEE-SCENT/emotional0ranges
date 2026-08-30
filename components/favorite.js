/**
 * 찜 버튼을 켜고 끕니다.
 *
 *   <button class="btn …" data-favorite="meeting" aria-label="찜하기">
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
 *
 * 누른 뒤에는 띠로 한 번 더 알립니다. 하트는 손가락에 가려 있는 경우가 많아, 켜진
 * 것을 손을 떼고 나서야 확인하게 됩니다.
 */

import { showToast } from './toast.js'
import { openConfirm } from './confirm.js'

const ICON = { on: '#icon-favoriteFilled', off: '#icon-favorite' }
const LABEL = { on: '찜 해제', off: '찜하기' }
const TOAST = {
  on: { text: '찜한 모임에 저장했어요', icon: ICON.on, tone: 'accent' },
  // 해제에는 아이콘이 없습니다. 켜질 때만 하트를 보여야 무엇이 달라졌는지가
  // 아이콘의 있고 없음으로도 읽힙니다.
  off: { text: '찜을 해제했어요' },
}

/** 비로그인일 때 대신 뜨는 창. 화면에 없으면 그냥 찜이 되지 않습니다. */
const LOGIN_DIALOG = 'favorite-login'

/* 찜은 계정에 남는 것이라 로그인한 사람만 할 수 있습니다. 이 프로토타입에는 계정도
   로그인 화면도 없어 주소로 흉내 냅니다 — detail.html?login=guest 로 열면 비로그인
   상태가 됩니다. */
let loggedIn = new URLSearchParams(location.search).get('login') !== 'guest'

/** 로그인 안내를 띄우느라 미뤄둔 버튼. 로그인하고 돌아오면 이어서 눌린 셈이 됩니다. */
let pending = null

function apply(btn, on) {
  btn.classList.toggle('is-favorite', on)
  btn.setAttribute('aria-pressed', String(on))
  btn.setAttribute('aria-label', on ? LABEL.on : LABEL.off)
  btn.querySelector('use')?.setAttribute('href', on ? ICON.on : ICON.off)
}

function toggle(btn) {
  const on = !btn.classList.contains('is-favorite')
  // 값이 비어 있으면 짝이 없는 버튼입니다. 그때는 자기 자신만 바꿉니다.
  const name = btn.dataset.favorite
  const pair = name ? document.querySelectorAll(`[data-favorite="${name}"]`) : [btn]
  for (const el of pair) apply(el, on)

  const { text, icon, tone } = on ? TOAST.on : TOAST.off
  showToast(text, { icon, tone })
}

/* 안내창의 "로그인하기"를 누른 뒤. 실제 서비스는 로그인 화면으로 갔다가 돌아와
   누르려던 찜을 잇습니다 — 이 프로토타입에는 그 화면이 없어 로그인한 것으로 치고
   바로 잇습니다. */
function initLoginGuard() {
  const dialog = document.getElementById(LOGIN_DIALOG)
  if (!dialog || dialog.dataset.favoriteReady) return
  dialog.dataset.favoriteReady = '1'
  dialog.addEventListener('confirm:accept', () => {
    loggedIn = true
    const btn = pending
    pending = null
    if (btn) toggle(btn)
  })
}

export function initFavorites(scope = document) {
  initLoginGuard()
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
      if (!loggedIn && document.getElementById(LOGIN_DIALOG)) {
        pending = btn
        openConfirm(LOGIN_DIALOG)
        return
      }
      toggle(btn)
    })
  }
}
