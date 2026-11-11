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

import { showToast } from './toast.js?v=ccb77a07'

const SELECTED = 'is-selected'

/** 로컬 미리보기인지. 아직 배포하지 않은 화면(data-local-only)은 여기서만 엽니다. */
const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$/.test(location.hostname)

/** 시간은 CSS 가 정합니다 — 두 곳에 적어두면 언젠가 갈립니다. */
const cssMs = (name) => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value.endsWith('ms') ? parseFloat(value) : parseFloat(value) * 1000 || 0
}

/** 비활성 항목은 고를 수 없습니다. disabled 속성과 aria-disabled 둘 다 받습니다. */
const isDisabled = (el) => el.disabled || el.getAttribute('aria-disabled') === 'true'

/**
 * animate 가 false 면 전환을 잠깐 끄고 값을 바꿉니다.
 *
 * 폰트가 늦게 오거나 창이 바뀌면 항목 폭이 달라지는데, 그때도 전환이 살아 있으면
 * thumb 이 스스로 늘어나는 것처럼 보입니다 — 처음 화면에 뜰 때 오렌지 배경이
 * 왼쪽에서 오른쪽으로 채워지던 게 이것입니다. 사용자가 탭을 누른 게 아니라면
 * 미끄러질 이유가 없습니다.
 */
function moveThumb(root, animate = true) {
  const selected = root.querySelector('.' + SELECTED)
  const thumb = root.querySelector('.segmented__thumb')
  if (!thumb || !selected) return
  if (!animate) root.classList.remove('is-ready')
  // offsetLeft 는 컨테이너 기준이라 스크롤·변형에 영향을 받지 않습니다.
  root.style.setProperty('--segmented-thumb-x', `${selected.offsetLeft}px`)
  root.style.setProperty('--segmented-thumb-w', `${selected.offsetWidth}px`)
  if (!animate) {
    // 전환이 꺼진 상태에서 새 값을 확정시킨 뒤 다시 켭니다.
    void root.offsetWidth
    root.classList.add('is-ready')
  }
}

function select(root, item) {
  for (const el of root.querySelectorAll('.segmented__item')) {
    const on = el === item
    el.classList.toggle(SELECTED, on)
    // 탭 목록 안에서는 선택된 항목만 Tab 으로 닿고, 나머지는 화살표로 이동합니다.
    // 링크로 된 전환(GNB 의 로테이션/프라이빗)은 탭 목록이 아니라 둘 다 Tab 으로 닿습니다.
    if (el.hasAttribute('role')) {
      el.setAttribute('aria-selected', String(on))
      el.tabIndex = on ? 0 : -1
    }
  }
  moveThumb(root)
}

/** 화살표 키로 좌우 이동. role="tablist" 의 기대 동작입니다. */
function onKeydown(root, e) {
  // 링크 전환은 화살표로 고르지 않습니다 — 고르는 순간 다른 화면으로 가야 하는데,
  // 화살표는 칠만 옮기고 아무 데도 가지 않습니다.
  if (root.getAttribute('role') !== 'tablist') return
  const items = [...root.querySelectorAll('.segmented__item')].filter((el) => !isDisabled(el))
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
    if (!item || !root.contains(item) || isDisabled(item)) return
    // 아직 배포하지 않은 칸(GNB 의 프라이빗)은 배포된 사이트에서 고르지 않고 "준비 중"이라고만
    // 말합니다. 잠가 두면(disabled) 눌린 줄 모르고, 칠이 넘어가면 열린 줄 압니다.
    // 로컬 미리보기에서는 보통 링크처럼 엽니다.
    if (item.hasAttribute('data-local-only') && !isLocal) {
      e.preventDefault()
      showToast('아직 준비 중이에요', { icon: '#icon-infoCircle' })
      return
    }
    // 링크 전환(GNB 의 로테이션/프라이빗)은 누르자마자 화면이 바뀌어 thumb 이 미끄러질
    // 틈이 없습니다. thumb 이 다 건너간 뒤에 넘어갑니다. 새 탭으로 열 때(⌘·Ctrl·가운데
    // 버튼)나 이미 고른 칸을 다시 누를 때는 기다리지 않습니다.
    const slideFirst =
      item.href && !item.classList.contains(SELECTED) &&
      !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches
    select(root, item)
    if (!slideFirst) return
    e.preventDefault()
    setTimeout(() => location.assign(item.href), cssMs('--_segmented-control-transition-duration'))
  })
  root.addEventListener('keydown', (e) => onKeydown(root, e))

  // 폰트가 늦게 로드되면 글자 폭이 달라져 thumb 이 어긋납니다. 다시 재는 것뿐이니
  // 움직임 없이 값만 갈아끼웁니다.
  document.fonts?.ready.then(() => moveThumb(root, false))
  new ResizeObserver(() => moveThumb(root, false)).observe(root)

  select(root, root.querySelector('.' + SELECTED) ?? root.querySelector('.segmented__item'))
  // 첫 위치를 잡은 뒤에 전환을 켭니다.
  requestAnimationFrame(() => root.classList.add('is-ready'))
}

export function initSegmentedControls(scope = document) {
  for (const el of scope.querySelectorAll('.segmented')) initSegmentedControl(el)
}
