/**
 * 모달이 열릴 때 초점을 판이 받게 합니다.
 *
 *   import { initDialogFocus } from './components/dialog-focus.js'
 *   initDialogFocus(dialog, dialog.querySelector('.confirm__panel'))
 *
 * showModal() 은 창 안에서 처음 만나는 누를 수 있는 것으로 초점을 옮깁니다. 손가락으로
 * 연 사람에게는 누른 적 없는 버튼 하나가 테를 두른 채 나타나, 그 창에서 해야 할 일이
 * 그것인 양 보입니다 — 닫기에 테가 둘리면 더 그렇습니다.
 *
 * 대신 판에 초점을 둡니다. autofocus 가 붙은 것이 있으면 브라우저는 그것을 먼저
 * 찾으므로, 판을 초점 받을 수 있게(tabindex=-1) 만들고 그 표시를 답니다. 초점은
 * 여전히 창 안에 갇히고 Esc·Tab 도 그대로인데, 어느 버튼도 미리 골라두지 않습니다.
 * 키보드로 연 사람은 Tab 한 번이면 첫 버튼입니다.
 *
 * 판에 테가 그려지지 않도록 하는 것은 각 컴포넌트의 CSS 가 합니다(:focus 에 outline:none).
 * 탭 순서에서 빠져 있어 사람이 그 자리로 돌아올 길은 없습니다.
 */

export function initDialogFocus(dialog, panel = dialog.firstElementChild) {
  if (!panel || panel.dataset.dialogFocus) return
  panel.dataset.dialogFocus = '1'
  panel.tabIndex = -1
  panel.autofocus = true
}
