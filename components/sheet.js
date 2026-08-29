/**
 * 아래에서 올라오는 시트를 열고 닫습니다.
 *
 *   <button data-sheet-open="apply-sheet">신청하기</button>
 *   <dialog class="sheet" id="apply-sheet"> … </dialog>
 *
 *   import { initSheets } from './components/sheet.js'
 *   initSheets()
 *
 * 시트 안에서 무엇을 고르는지는 여기서 알 바가 아닙니다 — 상세 화면에서는 라디오
 * 버튼 목록이 들어 있고, 그 상태는 브라우저가 알아서 들고 있습니다. 이 파일은 여는
 * 것과 닫는 것만 합니다.
 *
 * 961 부터는 <dialog> 가 display:contents 로 자리에서 빠져 시트가 아닙니다. 그
 * 폭에서 열라는 요청이 들어오면 무시합니다 — 감싼 것이 없는 것처럼 보이는 요소를
 * showModal() 로 띄우면 화면 한가운데에 목록만 덩그러니 뜹니다.
 */

import { lockScroll, unlockScroll } from './scroll-lock.js'

/**
 * 지금 이 요소가 시트로 동작하는지.
 *
 * --inline 은 961 부터 display:contents 로 자리에서 빠지므로 그 폭에서는 시트가
 * 아닙니다. 그때 showModal() 을 부르면 화면 한가운데에 목록만 덩그러니 뜹니다.
 * --inline 이 아닌 시트는 어느 폭에서든 시트입니다.
 */
const isSheet = (el) =>
  !el.classList.contains('sheet--inline') || matchMedia('(max-width: 960px)').matches

export function initSheet(dialog) {
  if (dialog.dataset.sheetReady) return
  dialog.dataset.sheetReady = '1'

  const open = () => {
    if (!isSheet(dialog) || dialog.open) return
    dialog.showModal()
    lockScroll()
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest(`[data-sheet-open="${dialog.id}"]`)
    if (trigger) {
      e.preventDefault()
      open()
      return
    }
    if (e.target.closest(`[data-sheet-close="${dialog.id}"]`)) dialog.close()
  })

  // 판 바깥(어두워진 자리)을 누르면 닫습니다. 시트에는 닫기 버튼이 없어서, 뒤로
  // 물러나는 길은 Esc 와 여기뿐입니다.
  dialog.addEventListener('click', (e) => {
    if (!e.target.closest('.sheet__panel')) dialog.close()
  })

  /* ---- 잘린 자리 알리기 --------------------------------------------------
     머리글과 버튼은 고정되어 있어 목록이 그 밑으로 이어지는지 보이지 않습니다.
     남은 쪽에만 선을 긋도록 두 가지를 표시합니다 — 위로 더 있으면 is-above,
     아래로 더 있으면 is-below. 넘치지 않으면 둘 다 붙지 않습니다.

     1 을 빼고 재는 것은 확대·축소나 기기 화소 비율 때문에 끝까지 내려도 소수점
     하나가 남는 일이 있어서입니다. 그 하나 때문에 선이 지워지지 않습니다. */

  const scroller = dialog.querySelector('[data-sheet-scroll]')
  const panel = dialog.querySelector('.sheet__panel')

  if (scroller && panel) {
    const edges = () => {
      const over = scroller.scrollHeight - scroller.clientHeight
      panel.classList.toggle('is-above', over > 1 && scroller.scrollTop > 1)
      panel.classList.toggle('is-below', over > 1 && scroller.scrollTop < over - 1)
    }
    scroller.addEventListener('scroll', edges, { passive: true })
    // 열려서 크기가 생기는 순간에도, 창 폭이 바뀌어 목록이 길어지거나 짧아질 때도
    // 다시 잽니다.
    new ResizeObserver(edges).observe(scroller)
  }

  // Esc 로 닫는 것은 <dialog> 가 합니다. 뒤처리만 합니다.
  dialog.addEventListener('close', () => unlockScroll())

  // 시트가 열린 채로 넓은 화면이 되면 목록이 제자리로 돌아가야 합니다. 열어둔 채
  // 두면 화면 가운데에 목록만 남고 본문에서는 사라집니다.
  matchMedia('(min-width: 961px)').addEventListener('change', (e) => {
    if (e.matches && dialog.open && dialog.classList.contains('sheet--inline')) dialog.close()
  })
}

export function initSheets(scope = document) {
  for (const el of scope.querySelectorAll('.sheet')) initSheet(el)
}
