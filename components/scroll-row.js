/**
 * 옆으로 흐르는 알약 줄 — 양 끝을 옅게 하고, 고른 것을 가운데로 데려옵니다.
 *
 *   <div class="…" data-scroll-row> … 알약 … </div>
 *
 *   import { initScrollRows } from './components/scroll-row.js'
 *   initScrollRows()
 *
 * 모임 유형·하위 필터·담은 날짜처럼 한 줄에 다 서지 못하고 옆으로 흐르는 줄들이
 * 같은 규칙을 씁니다. 줄마다 따로 만들지 않는 것은, 규칙이 하나뿐인데 자리가
 * 셋이면 한 곳만 고쳐지는 날이 오기 때문입니다.
 *
 * ---- 양 끝 옅어짐 --------------------------------------------------------
 * 옅어지는 것은 "이쪽에 더 있다"는 표시입니다. 그래서 더 없는 쪽은 옅어지지
 * 않습니다 — 마지막 알약까지 흘러왔는데도 오른쪽 끝이 계속 흐리면, 아직 남은
 * 것이 있는 줄 알고 한 번 더 밀어보게 됩니다. 왼쪽도 같습니다: 처음으로 되돌아갈
 * 것이 있는 동안에만 그쪽이 옅어집니다.
 *
 * 실제로 옅게 하는 것은 CSS 의 mask 이고(find.css), 여기서는 지금 어느 쪽에 더
 * 있는지만 `data-fade` 로 적어둡니다 — none · start · end · both.
 *
 * ---- 고른 것을 가운데로 ---------------------------------------------------
 * 줄의 끝에 있던 알약을 고르면 그것이 반쯤 잘린 채로 남습니다. 방금 고른 것이
 * 화면 밖에 반쯤 걸쳐 있으면 무엇을 골랐는지 다시 확인할 수가 없어, 고른 알약을
 * 줄 가운데로 데려옵니다. 줄이 흐르지 않는 폭(알약이 여러 줄로 접히는 넓은 화면)
 * 에서는 옮길 자리가 없어 저절로 아무 일도 일어나지 않습니다.
 */

/** 소수점 한 자리쯤의 어긋남은 끝에 닿은 것으로 봅니다 — 브라우저마다 1px 이 남습니다. */
const EDGE = 1

export function initScrollRow(el) {
  if (!el || el.dataset.scrollRowReady) return
  el.dataset.scrollRowReady = '1'

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)')

  const update = () => {
    const more = el.scrollWidth - el.clientWidth
    const start = el.scrollLeft > EDGE
    const end = more > EDGE && el.scrollLeft < more - EDGE
    el.dataset.fade = start && end ? 'both' : start ? 'start' : end ? 'end' : 'none'
  }

  /**
   * 알약 하나를 줄 가운데로.
   *
   * 왼쪽 끝·오른쪽 끝의 알약은 가운데까지 오지 못합니다 — 그만큼 흐를 자리가
   * 없어 브라우저가 알아서 끝에서 멈춥니다. 그 편이 낫습니다: 첫 알약을 고르려고
   * 줄이 오른쪽으로 밀려 앞이 비는 것보다, 처음은 처음에 서 있는 것이 자연스럽습니다.
   */
  function center(item, smooth = true) {
    if (el.scrollWidth - el.clientWidth <= EDGE) return
    const box = el.getBoundingClientRect()
    const at = item.getBoundingClientRect()
    const left = el.scrollLeft + (at.left - box.left) - (el.clientWidth - at.width) / 2
    el.scrollTo({ left, behavior: smooth && !reduceMotion.matches ? 'smooth' : 'auto' })
  }

  /** 지금 켜져 있는 알약 — 라디오든 체크박스든 입력을 감싼 것이 알약입니다. */
  const checkedItem = () => el.querySelector(':scope > :has(> input:checked)')

  el.addEventListener('change', (e) => {
    if (!(e.target instanceof HTMLInputElement) || !e.target.checked) return
    const item = e.target.closest(':scope > *')
    if (item) center(item)
  })

  el.addEventListener('scroll', update, { passive: true })
  // 폭이 바뀌면(화면 회전·펼침) 넘치는지도 달라집니다.
  new ResizeObserver(update).observe(el)
  /* 알약이 새로 그려지면 길이가 달라집니다 — 크기는 그대로라 ResizeObserver 로는
     알 수 없습니다(하위 필터·담은 날짜가 통째로 다시 그려집니다). 주소에 조건을
     달고 들어온 경우에는 그때 켜져 있는 알약을 가운데로 데려옵니다. */
  new MutationObserver(() => {
    update()
    const item = checkedItem()
    if (item) center(item, false)
  }).observe(el, { childList: true })

  update()
  const item = checkedItem()
  if (item) center(item, false)
}

export function initScrollRows(scope = document) {
  for (const el of scope.querySelectorAll('[data-scroll-row]')) initScrollRow(el)
}
