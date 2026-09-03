/**
 * 사진 확대보기 팝업을 열고, 목록 ↔ 개별 사진을 오갑니다.
 *
 *   <button data-viewer-open="detail-photos">사진 모두 보기</button>
 *   <button data-viewer-open="detail-photos" data-viewer-index="2">…</button>
 *
 *   <dialog class="image-viewer" id="detail-photos" data-view="list"> … </dialog>
 *
 *   import { initImageViewers } from './components/image-viewer.js'
 *   initImageViewers()
 *
 * data-viewer-index 가 있으면 그 사진 한 장으로, 없으면 목록으로 엽니다. 상세 화면의
 * 2×2 그리드에서 사진을 고르면 그 사진이, 우측 아래 버튼을 누르면 전체 목록이 열리는
 * 것이 이 차이입니다.
 *
 * 사진 목록은 HTML 에 이미 다 들어 있습니다. 여기서 만들어 넣지 않는 이유는 스크립트가
 * 실패하거나 늦게 도착해도 사진이 문서에 남아 있어야 하기 때문입니다 — 검색 로봇과
 * 스크린 리더가 읽는 것도 그 마크업입니다.
 *
 * 개별 화면의 사진은 다섯 장이 옆으로 나란히 서 있고, 넘기는 것은 스크롤입니다.
 * 한 장을 두고 src 만 갈아끼우던 때에는 넘기는 동안 볼 것이 없어 한 번 깜빡였고,
 * 손가락을 따라오지도 않았습니다. 여기서 하는 일은 어디로 세울지 정하는 것과, 지금
 * 몇 번째인지 읽는 것뿐입니다 — 미끄러지는 것은 브라우저가 합니다.
 *
 * 줄이라서 끝에서 멈춥니다. 마지막 다음이 처음으로 이어지지 않는 것은, 손가락으로
 * 미는 자리에서 줄이 스스로 다시 짜이면 방금 지나온 사진이 어디 있는지 알 수 없게
 * 되기 때문입니다. 끝에 닿으면 그쪽 버튼이 꺼집니다.
 */

import { lockScroll, unlockScroll } from './scroll-lock.js?v=40a2cd35'
import { initDialogFocus } from './dialog-focus.js?v=a4704637'

const wantsLessMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

export function initImageViewer(dialog) {
  if (dialog.dataset.viewerReady) return
  dialog.dataset.viewerReady = '1'

  const thumbs = [...dialog.querySelectorAll('.image-viewer__thumb')]
  if (!thumbs.length) return

  const photos = thumbs.map((btn) => btn.querySelector('img'))
  const strip = dialog.querySelector('.image-viewer__strip')
  const shots = strip ? [...strip.querySelectorAll('.image-viewer__frame img')] : []
  const count = dialog.querySelector('.image-viewer__count')
  const toList = dialog.querySelector('.image-viewer__to-list')
  const prev = dialog.querySelector('.image-viewer__nav--prev')
  const next = dialog.querySelector('.image-viewer__nav--next')

  dialog.dataset.count = String(photos.length)

  // 열자마자 닫기에 테가 둘리지 않도록 초점은 본문이 받습니다.
  initDialogFocus(dialog, dialog.querySelector('.image-viewer__body'))

  let at = 0
  /** 목록에서 어느 사진으로 들어왔는지. 돌아갈 때 그 자리에 초점을 되돌립니다. */
  let cameFrom = null
  let queued = false

  /** 한 장을 넘기는 데 필요한 스크롤 거리. 사진 한 장이 줄의 폭을 그대로 씁니다. */
  const span = () => strip?.clientWidth || 0

  /** 지금 몇 번째인지를 화면에 옮겨 적습니다. 끝에 닿으면 그쪽 버튼을 끕니다. */
  const mark = () => {
    if (count) count.textContent = `${at + 1} / ${photos.length}`
    if (prev) prev.disabled = at === 0
    if (next) next.disabled = at === photos.length - 1
  }

  /**
   * i 번째 사진을 보여줍니다.
   *
   * 줄이라서 끝에서 멈춥니다 — 없는 자리를 부르면 있는 자리 중 가까운 쪽입니다.
   * instant 는 목록에서 막 들어왔을 때처럼 미끄러질 이유가 없는 경우입니다.
   */
  const show = (i, instant = false) => {
    at = Math.max(0, Math.min(photos.length - 1, i))
    mark()
    if (!strip) return
    strip.scrollTo({
      left: at * span(),
      behavior: instant || wantsLessMotion() ? 'auto' : 'smooth',
    })
  }

  // 손가락으로 밀어 넘긴 것도 여기서 읽습니다 — 어디에 섰는지는 스크롤만 압니다.
  strip?.addEventListener(
    'scroll',
    () => {
      if (queued) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        const w = span()
        const now = w ? Math.round(strip.scrollLeft / w) : 0
        if (now === at) return
        at = now
        mark()
      })
    },
    { passive: true },
  )

  // 화면이 돌아가면 한 장의 폭이 달라집니다. 보던 사진이 그대로 남아야 합니다.
  if (strip) new ResizeObserver(() => (strip.scrollLeft = at * span())).observe(strip)

  const view = (name) => {
    dialog.dataset.view = name
    if (toList) toList.hidden = name === 'list'
  }

  /**
   * 목록의 사진과 개별 화면의 사진을 한 장면으로 이어 붙입니다.
   *
   * 두 요소에 같은 view-transition-name 을 주면 브라우저가 바뀌기 전후를 각각 찍어
   * 두 자리 사이를 이어 그립니다. 목록으로 물러날 때 보던 사진이 제자리로 줄어들고,
   * 목록에서 고를 때는 그 자리에서 커집니다 — 어느 사진을 보고 있었는지 놓치지
   * 않습니다.
   *
   * 이름이 겹쳐도 되는 것은 두 요소가 동시에 그려지지 않기 때문입니다. 개별 화면일
   * 때 목록은 display:none 이고, 목록일 때 개별 화면이 그렇습니다. 장면마다 이름을
   * 가진 요소는 언제나 하나뿐입니다.
   *
   * 지원하지 않는 브라우저에서는 바뀌는 것만 그대로 일어납니다.
   */
  const morph = (index, update) => {
    const canMorph =
      typeof document.startViewTransition === 'function' &&
      !wantsLessMotion() &&
      photos[index] &&
      shots[index]
    if (!canMorph) return update()

    const pair = [shots[index], photos[index]]
    for (const el of pair) el.style.viewTransitionName = 'viewer-photo'
    // 찍히기 전에 붙어야 합니다. 첫 장면은 startViewTransition 을 부르는 그 자리에서
    // 바로 찍히므로, 한 줄이라도 뒤에 두면 모서리가 그림에 그려진 채로 남습니다.
    dialog.classList.add('is-morphing')
    const done = () => {
      // 이름을 남겨두면 다음 전환에서 엉뚱한 요소끼리 이어집니다.
      for (const el of pair) el.style.viewTransitionName = ''
      dialog.classList.remove('is-morphing')
    }
    document.startViewTransition(update).finished.then(done, done)
  }

  const openList = () => {
    morph(at, () => {
      view('list')
      // 방금 보던 사진이 화면 밖이면 목록이 엉뚱한 자리에서 시작합니다.
      thumbs[at]?.scrollIntoView({ block: 'nearest' })
    })
  }

  /* ---- 여는 쪽 --------------------------------------------------------- */

  const open = (index) => {
    // 줄을 세우려면 폭을 알아야 하고, 폭은 화면에 올라온 뒤에야 생깁니다.
    if (!dialog.open) {
      dialog.showModal()
      lockScroll()
    }
    if (index == null) {
      view('list')
      return
    }
    view('single')
    show(index, true)
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest(`[data-viewer-open="${dialog.id}"]`)
    if (!trigger) return
    e.preventDefault()
    const raw = trigger.dataset.viewerIndex
    open(raw == null || raw === '' ? null : Number(raw))
  })

  /* ---- 팝업 안 ---------------------------------------------------------- */

  dialog.addEventListener('click', (e) => {
    const thumb = e.target.closest('.image-viewer__thumb')
    if (thumb) {
      cameFrom = thumb
      const i = thumbs.indexOf(thumb)
      morph(i, () => {
        view('single')
        show(i, true)
      })
      // 사진이 바뀌었으니 다음 사진 버튼에 초점을 둡니다. 계속 넘겨 보게 됩니다.
      dialog.querySelector('.image-viewer__nav--next')?.focus()
      return
    }

    const nav = e.target.closest('.image-viewer__nav')
    if (nav) {
      show(at + (nav.classList.contains('image-viewer__nav--prev') ? -1 : 1))
      return
    }

    if (e.target.closest('.image-viewer__to-list')) {
      openList()
      // 들어올 때 눌렀던 사진으로 돌아갑니다. 어디에 있었는지 잃지 않습니다.
      ;(cameFrom ?? thumbs[at])?.focus()
      return
    }

    if (e.target.closest('.image-viewer__close')) dialog.close()
  })

  /* ---- 아래로 끌어 목록으로 ----------------------------------------------
     좌우로 미는 것은 줄이 알아서 합니다(위 참고). 여기서는 아래로 끄는 것만 봅니다 —
     사진을 내려놓으면 사진을 고르던 자리로 돌아갑니다. 위로 미는 것에는 아무 뜻도
     두지 않았습니다: 목록은 아래에 있지 않고, 닫기는 왼쪽 위에 있습니다.

     가로가 더 길면 넘기려던 손입니다. 그쪽은 줄이 이미 처리했으므로 여기서는
     아무 일도 하지 않습니다.

     40 은 눌렀다 뗄 때 손가락이 저절로 미끄러지는 거리보다 넉넉히 길어, 누르기와
     끌기가 섞이지 않는 값으로 잡았습니다. */

  const SWIPE = 40
  let held = null

  dialog.addEventListener(
    'touchstart',
    (e) => {
      held =
        dialog.dataset.view === 'single' && e.touches.length === 1
          ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
          : null
    },
    { passive: true },
  )

  dialog.addEventListener(
    'touchend',
    (e) => {
      if (!held) return
      const { clientX, clientY } = e.changedTouches[0]
      const x = clientX - held.x
      const y = clientY - held.y
      held = null
      // 어느 쪽으로 그었는지는 더 길게 간 축이 정합니다.
      if (Math.abs(x) > Math.abs(y)) return
      if (y >= SWIPE) openList()
    },
    { passive: true },
  )

  dialog.addEventListener('touchcancel', () => {
    held = null
  })

  dialog.addEventListener('keydown', (e) => {
    if (dialog.dataset.view !== 'single') return
    if (e.key === 'ArrowRight') show(at + 1)
    else if (e.key === 'ArrowLeft') show(at - 1)
    else return
    e.preventDefault()
  })

  // Esc 로 닫는 것은 <dialog> 가 알아서 합니다. 뒤처리만 합니다.
  dialog.addEventListener('close', () => unlockScroll())

  view(dialog.dataset.view || 'list')
  mark()
}

export function initImageViewers(scope = document) {
  for (const el of scope.querySelectorAll('.image-viewer')) initImageViewer(el)
}
