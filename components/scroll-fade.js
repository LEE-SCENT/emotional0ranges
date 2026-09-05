/**
 * 옆으로 흐르는 줄의 양 끝을 옅게 합니다.
 *
 *   <div class="…" data-scroll-fade> … </div>
 *
 *   import { initScrollFades } from './components/scroll-fade.js'
 *   initScrollFades()
 *
 * 옅어지는 것은 "이쪽에 더 있다"는 표시입니다. 그래서 더 없는 쪽은 옅어지지
 * 않습니다 — 마지막 알약까지 흘러왔는데도 오른쪽 끝이 계속 흐리면, 아직 남은
 * 것이 있는 줄 알고 한 번 더 밀어보게 됩니다. 왼쪽도 같습니다: 처음으로 되돌아갈
 * 것이 있는 동안에만 그쪽이 옅어집니다.
 *
 * 실제로 옅게 하는 것은 CSS 의 mask 이고(find.css · find-bar.css), 여기서는
 * 지금 어느 쪽에 더 있는지만 `data-fade` 로 적어둡니다 — none · start · end · both.
 *
 * 넓은 화면처럼 줄이 흐르지 않고 여러 줄로 접히는 곳에서는 넘치는 것이 없어
 * 저절로 none 이 되므로, 폭마다 따로 끄지 않아도 됩니다.
 */

/** 소수점 한 자리쯤의 어긋남은 끝에 닿은 것으로 봅니다 — 브라우저마다 1px 이 남습니다. */
const EDGE = 1

export function initScrollFade(el) {
  if (!el || el.dataset.scrollFadeReady) return
  el.dataset.scrollFadeReady = '1'

  const update = () => {
    const more = el.scrollWidth - el.clientWidth
    const start = el.scrollLeft > EDGE
    const end = more > EDGE && el.scrollLeft < more - EDGE
    el.dataset.fade = start && end ? 'both' : start ? 'start' : end ? 'end' : 'none'
  }

  el.addEventListener('scroll', update, { passive: true })
  // 폭이 바뀌면(화면 회전·펼침) 넘치는지도 달라집니다.
  new ResizeObserver(update).observe(el)
  // 알약이 새로 그려지면 길이가 달라집니다 — 크기는 그대로라 ResizeObserver 로는
  // 알 수 없습니다(하위 필터·담은 날짜가 통째로 다시 그려집니다).
  new MutationObserver(update).observe(el, { childList: true })

  update()
}

export function initScrollFades(scope = document) {
  for (const el of scope.querySelectorAll('[data-scroll-fade]')) initScrollFade(el)
}
