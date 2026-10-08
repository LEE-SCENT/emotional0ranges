/**
 * 고르는 칸은 고르고 나면 초점을 내려놓습니다.
 *
 *   import { initFields } from './components/field.js'
 *   initFields()
 *
 * 셀렉트·달·날짜처럼 눌러서 고르는 칸은, 고른 뒤에도 초점이 남으면 여전히 쓰는 중인
 * 모습(흰 바탕과 테두리)으로 서 있습니다. 글자 칸은 다 썼는지 알 수 없어 초점이 남는
 * 것이 맞지만, 고르는 칸은 고른 순간이 끝입니다.
 *
 * 손가락·마우스로 고른 때만입니다. 키보드로 고르는 사람은 화살표를 누를 때마다 값이
 * 바뀌는데(change), 그때마다 초점을 빼면 다음 화살표가 갈 곳이 없습니다.
 *
 * 문서 하나에 한 번만 답니다. 나중에 그려지는 창(verify.js) 안의 칸도 함께 받습니다.
 */
const PICKERS = 'select, input[type="month"], input[type="date"]'

let ready = false

export function initFields() {
  if (ready) return
  ready = true

  // 마지막으로 칸을 건드린 것이 손가락·마우스였는지.
  let byPointer = false
  document.addEventListener('pointerdown', () => { byPointer = true }, true)
  document.addEventListener('keydown', () => { byPointer = false }, true)

  document.addEventListener('change', (e) => {
    if (byPointer && e.target.matches?.(PICKERS)) e.target.blur()
  })
}
