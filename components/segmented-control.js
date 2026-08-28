/**
 * SegmentedControl 의 선택 표시(thumb)를 움직이는 최소한의 스크립트.
 *
 * 항목 폭이 글자 수에 따라 달라 CSS 만으로는 위치를 알 수 없어, 여기서 측정해
 * --segmented-thumb-x / --segmented-thumb-w 로 넘깁니다. 전환 자체는 CSS 가 합니다.
 *
 *   import { initSegmentedControls } from './components/segmented-control.js'
 *   initSegmentedControls()
 *
 * 이 스크립트가 없어도 컴포넌트는 정상 동작합니다 — thumb 이 미끄러지지 않고
 * 선택된 항목이 즉시 칠해질 뿐입니다.
 */

const SELECTED = 'is-selected'

function moveThumb(root) {
  const selected = root.querySelector('.' + SELECTED)
  const thumb = root.querySelector('.segmented__thumb')
  if (!thumb || !selected) return
  // offsetLeft 는 컨테이너 기준이라 스크롤·변형에 영향을 받지 않습니다.
  root.style.setProperty('--segmented-thumb-x', `${selected.offsetLeft}px`)
  root.style.setProperty('--segmented-thumb-w', `${selected.offsetWidth}px`)
}

function select(root, item) {
  for (const el of root.querySelectorAll('.segmented__item')) {
    const on = el === item
    el.classList.toggle(SELECTED, on)
    if (el.hasAttribute('role')) el.setAttribute('aria-selected', String(on))
    // 탭 목록 안에서는 선택된 항목만 Tab 으로 닿고, 나머지는 화살표로 이동합니다.
    el.tabIndex = on ? 0 : -1
  }
  moveThumb(root)
}

/** 화살표 키로 좌우 이동. role="tablist" 의 기대 동작입니다. */
function onKeydown(root, e) {
  const items = [...root.querySelectorAll('.segmented__item')]
  const i = items.indexOf(document.activeElement)
  if (i < 0) return
  const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
  if (!delta) return
  e.preventDefault()
  const next = items[(i + delta + items.length) % items.length]
  next.focus()
  select(root, next)
}

export function initSegmentedControl(root) {
  if (root.dataset.segmentedReady) return
  root.dataset.segmentedReady = '1'

  root.addEventListener('click', (e) => {
    const item = e.target.closest('.segmented__item')
    if (item && root.contains(item)) select(root, item)
  })
  root.addEventListener('keydown', (e) => onKeydown(root, e))

  // 폰트가 늦게 로드되면 글자 폭이 달라져 thumb 이 어긋납니다.
  document.fonts?.ready.then(() => moveThumb(root))
  new ResizeObserver(() => moveThumb(root)).observe(root)

  select(root, root.querySelector('.' + SELECTED) ?? root.querySelector('.segmented__item'))
  // 첫 위치를 잡은 뒤에 전환을 켭니다.
  requestAnimationFrame(() => root.classList.add('is-ready'))
}

export function initSegmentedControls(scope = document) {
  for (const el of scope.querySelectorAll('.segmented')) initSegmentedControl(el)
}
