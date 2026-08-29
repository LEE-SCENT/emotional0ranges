/**
 * 묻는 창을 열고 닫습니다.
 *
 *   <button data-confirm-open="waitlist-apply">대기 신청하기</button>
 *
 *   <dialog class="confirm" id="waitlist-apply">
 *     <div class="confirm__panel">
 *       …
 *       <button data-confirm-close>닫기</button>
 *       <button data-confirm-accept>대기 신청하기</button>
 *
 *   import { initConfirms } from './components/confirm.js'
 *   initConfirms()
 *
 * 무엇을 물었는지는 여기서 알 바가 아닙니다. 오른쪽 버튼이 눌리면 confirm:accept 를
 * 올려보내고, 그 뜻을 아는 쪽이 받아서 처리합니다 — 창 하나에 처리 하나를 묶어두면
 * 같은 모양의 창을 다시 쓸 수 없습니다.
 */

const lock = (on) => {
  document.documentElement.style.overflow = on ? 'hidden' : ''
}

export function initConfirm(dialog) {
  if (dialog.dataset.confirmReady) return
  dialog.dataset.confirmReady = '1'

  document.addEventListener('click', (e) => {
    if (!e.target.closest(`[data-confirm-open="${dialog.id}"]`)) return
    e.preventDefault()
    if (dialog.open) return
    dialog.showModal()
    lock(true)
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

  dialog.addEventListener('close', () => lock(false))
}

export function initConfirms(scope = document) {
  for (const el of scope.querySelectorAll('.confirm')) initConfirm(el)
}
