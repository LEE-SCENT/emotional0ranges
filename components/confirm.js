/**
 * 묻는 창을 열고 닫습니다.
 *
 *   <button data-confirm-open="seat-alert-apply">빈자리 알림 받기</button>
 *
 *   <dialog class="confirm" id="seat-alert-apply">
 *     <div class="confirm__panel">
 *       …
 *       <button data-confirm-close>닫기</button>
 *       <button data-confirm-accept>빈자리 알림 받기</button>
 *
 *   import { initConfirms } from './components/confirm.js'
 *   initConfirms()
 *
 * 무엇을 물었는지는 여기서 알 바가 아닙니다. 오른쪽 버튼이 눌리면 confirm:accept 를
 * 올려보내고, 그 뜻을 아는 쪽이 받아서 처리합니다 — 창 하나에 처리 하나를 묶어두면
 * 같은 모양의 창을 다시 쓸 수 없습니다.
 */

import { lockScroll, unlockScroll } from './scroll-lock.js'
import { initDialogFocus } from './dialog-focus.js'

/**
 * 버튼을 거치지 않고 코드에서 여는 길입니다.
 *
 *   openConfirm('favorite-login')
 *
 * data-confirm-open 은 "이 버튼을 누르면 늘 이 창"이라는 뜻입니다. 찜하기처럼 눌린
 * 뒤에야 물을지 말지가 정해지는 자리에서는 그 표시를 쓸 수 없습니다.
 */
export function openConfirm(dialog) {
  const el = typeof dialog === 'string' ? document.getElementById(dialog) : dialog
  if (!el || el.open) return
  el.showModal()
  lockScroll()
}

export function initConfirm(dialog) {
  if (dialog.dataset.confirmReady) return
  dialog.dataset.confirmReady = '1'

  // 열자마자 닫기나 확인에 테가 둘리지 않도록 초점은 판이 받습니다.
  initDialogFocus(dialog, dialog.querySelector('.confirm__panel'))

  document.addEventListener('click', (e) => {
    if (!e.target.closest(`[data-confirm-open="${dialog.id}"]`)) return
    e.preventDefault()
    openConfirm(dialog)
  })

  dialog.addEventListener('click', (e) => {
    if (e.target.closest('[data-confirm-accept]')) {
      // 창을 먼저 닫습니다. 받는 쪽이 화면을 고치는 동안 창이 위에 떠 있으면
      // 무엇이 달라졌는지 보이지 않습니다.
      dialog.close()
      dialog.dispatchEvent(new CustomEvent('confirm:accept', { bubbles: true }))
      return
    }
    if (e.target.closest('[data-confirm-close]')) {
      dialog.close()
      return
    }
    // 판 바깥(어두워진 자리)을 누르면 닫기와 같습니다.
    if (!e.target.closest('.confirm__panel')) dialog.close()
  })

  dialog.addEventListener('close', () => unlockScroll())
}

export function initConfirms(scope = document) {
  for (const el of scope.querySelectorAll('.confirm')) initConfirm(el)
}
