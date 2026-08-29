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

/** 시트가 열려 있는 동안 뒤 페이지가 스크롤되지 않게 합니다. */
const lock = (on) => {
  document.documentElement.style.overflow = on ? 'hidden' : ''
}

/** 이 폭에서 시트로 동작하는지. CSS 의 미디어 쿼리와 같은 경계입니다. */
const isSheet = () => matchMedia('(max-width: 960px)').matches

export function initSheet(dialog) {
  if (dialog.dataset.sheetReady) return
  dialog.dataset.sheetReady = '1'

  const open = () => {
    if (!isSheet() || dialog.open) return
    dialog.showModal()
    lock(true)
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

  // Esc 로 닫는 것은 <dialog> 가 합니다. 뒤처리만 합니다.
  dialog.addEventListener('close', () => lock(false))

  // 시트가 열린 채로 넓은 화면이 되면 목록이 제자리로 돌아가야 합니다. 열어둔 채
  // 두면 화면 가운데에 목록만 남고 본문에서는 사라집니다.
  matchMedia('(min-width: 961px)').addEventListener('change', (e) => {
    if (e.matches && dialog.open) dialog.close()
  })
}

export function initSheets(scope = document) {
  for (const el of scope.querySelectorAll('.sheet')) initSheet(el)
}
