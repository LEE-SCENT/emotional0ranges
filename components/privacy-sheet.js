/**
 * 개인정보 처리방침을 시트로 엽니다.
 *
 *   <a href="https://emotional0ranges.com/privacy" data-sheet-open="privacy-sheet">개인정보처리방침</a>
 *
 *   import { initPrivacySheet } from './components/privacy-sheet.js'
 *   initPrivacySheet()
 *
 * 일정 변경과 같은 --modal 시트입니다. 좁은 화면에서는 아래에서 올라오고, 넓은
 * 화면에서는 가운데에 뜹니다. 읽던 화면을 떠나지 않고 읽고 닫을 수 있어야, 쿠키
 * 카드에서 "자세히 보기"를 눌렀다가 돌아와 고를 수 있습니다.
 *
 * 링크의 href 는 남겨 둡니다. 스크립트가 없거나 실패하면 서비스의 처리방침 화면으로
 * 그대로 갑니다.
 *
 * 시트는 처음 부를 때 한 번만 만들어 <body> 끝에 붙입니다. 화면마다 긴 본문을
 * 적어둘 필요가 없습니다.
 */

import { initSheet } from './sheet.js?v=30835160'
import { PRIVACY_POLICY } from './privacy-policy.js?v=871a602f'

const ID = 'privacy-sheet'

export function initPrivacySheet() {
  if (document.getElementById(ID)) return

  const { version, effective, articles } = PRIVACY_POLICY
  const empty = articles.every((a) => !a.body)

  const dialog = document.createElement('dialog')
  dialog.className = 'sheet sheet--modal privacy-sheet'
  dialog.id = ID
  dialog.setAttribute('aria-labelledby', `${ID}-title`)
  dialog.innerHTML = `
    <div class="sheet__panel">
      <div class="sheet__head">
        <h2 id="${ID}-title">개인정보처리방침</h2>
        <button class="btn btn--ghost btn--medium btn--icon-only" type="button"
                data-sheet-close="${ID}" aria-label="닫기">
          <svg class="btn__icon" aria-hidden="true"><use href="#icon-close"></use></svg>
        </button>
      </div>
      <div class="privacy-sheet__body" data-sheet-scroll>
        <p class="privacy-sheet__meta">${version} · 시행 ${effective}</p>
        ${empty ? '<p class="privacy-sheet__empty">본문을 준비하고 있어요.</p>' : ''}
        ${articles
          .map(
            (a) => `
        <section class="privacy-sheet__article">
          <h3>${a.title}</h3>
          ${a.body}
        </section>`,
          )
          .join('')}
      </div>
    </div>`

  document.body.append(dialog)
  initSheet(dialog)
  showScrollbarWhileScrolling(dialog.querySelector('.privacy-sheet__body'))
}

/** 멈추고 나서 스크롤바가 사라지기까지. 손을 떼자마자 지우면 어디까지 왔는지 볼 틈이 없습니다. */
const SCROLLBAR_LINGER_MS = 800

/** 굴리는 동안에만 스크롤바를 보이게 합니다. 색은 CSS(.is-scrolling)가 정합니다. */
function showScrollbarWhileScrolling(scroller) {
  let timer
  scroller.addEventListener(
    'scroll',
    () => {
      scroller.classList.add('is-scrolling')
      clearTimeout(timer)
      timer = setTimeout(() => scroller.classList.remove('is-scrolling'), SCROLLBAR_LINGER_MS)
    },
    { passive: true },
  )
}
