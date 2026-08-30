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
 * 개별 화면의 <img> 는 한 장뿐이고 src 만 갈아끼웁니다. 다섯 장을 미리 깔아두고
 * 감췄다 보였다 하면 브라우저가 다섯 장을 모두 디코딩해 들고 있어야 합니다. 목록에서
 * 이미 받아둔 파일과 주소가 같아 갈아끼우는 순간 그대로 나타납니다.
 */

import { lockScroll, unlockScroll } from './scroll-lock.js'
import { initDialogFocus } from './dialog-focus.js'

const wantsLessMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** 사진이 흐려지는 시간. 숫자를 여기 다시 적으면 CSS 와 어긋납니다. */
const fadeMs = () =>
  parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--_duration-fast')) || 0

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

export function initImageViewer(dialog) {
  if (dialog.dataset.viewerReady) return
  dialog.dataset.viewerReady = '1'

  const thumbs = [...dialog.querySelectorAll('.image-viewer__thumb')]
  if (!thumbs.length) return

  const photos = thumbs.map((btn) => btn.querySelector('img'))
  const single = dialog.querySelector('.image-viewer__single img')
  const count = dialog.querySelector('.image-viewer__count')
  const toList = dialog.querySelector('.image-viewer__to-list')

  dialog.dataset.count = String(photos.length)

  // 열자마자 닫기에 테가 둘리지 않도록 초점은 본문이 받습니다.
  initDialogFocus(dialog, dialog.querySelector('.image-viewer__body'))

  let at = 0
  /** 목록에서 어느 사진으로 들어왔는지. 돌아갈 때 그 자리에 초점을 되돌립니다. */
  let cameFrom = null
  /**
   * 마지막으로 시작한 교체가 몇 번째인지. 화살표를 연달아 누르면 앞선 교체가 아직
   * 흐려지는 중일 수 있는데, 그 뒤늦은 결과가 나중 사진을 덮어쓰면 안 됩니다.
   */
  let turn = 0

  const show = (i, instant = false) => {
    at = (i + photos.length) % photos.length
    if (count) count.textContent = `${at + 1} / ${photos.length}`
    if (!single) return

    const from = photos[at]
    const src = from.currentSrc || from.src
    const mine = ++turn

    if (instant || wantsLessMotion()) {
      single.classList.remove('is-swapping')
      single.src = src
      single.alt = from.alt
      return
    }

    // 흐려진 다음에 갈아끼웁니다. 같은 프레임에 바꾸면 옛 사진은 사라진 적이 없고
    // 새 사진만 슬며시 나타나, 넘긴 것이 아니라 늦게 뜬 것처럼 보입니다.
    single.classList.add('is-swapping')
    wait(fadeMs())
      .then(() => {
        if (mine !== turn) return
        single.src = src
        single.alt = from.alt
        // 디코딩이 끝나기 전에 보이면 첫 프레임이 빈칸으로 지나갑니다.
        return single.decode().catch(() => {})
      })
      .then(() => {
        if (mine !== turn) return
        single.classList.remove('is-swapping')
      })
  }

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
      typeof document.startViewTransition === 'function' && !wantsLessMotion() && photos[index]
    if (!canMorph) return update()

    const pair = [single, photos[index]]
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
    if (index == null) {
      view('list')
    } else {
      show(index, true)
      view('single')
    }
    if (!dialog.open) {
      dialog.showModal()
      lockScroll()
    }
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
        show(i, true)
        view('single')
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

  /* ---- 손가락으로 넘기기 -------------------------------------------------
     좁은 화면에는 좌우 버튼이 없습니다(image-viewer.css). 사진이 화면을 다 쓰는
     자리라 버튼을 얹으면 넘기려다 사진을 가립니다. 대신 밀어서 넘깁니다.

     가로가 세로보다 길 때만 넘깁니다 — 세로로 그은 손은 넘기려는 것이 아니라
     화면을 훑는 손입니다. 40 은 눌렀다 뗄 때 손가락이 저절로 미끄러지는 거리보다
     넉넉히 길어, 누르기와 밀기가 섞이지 않는 값으로 잡았습니다. */

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
      if (Math.abs(x) < SWIPE || Math.abs(x) <= Math.abs(y)) return
      // 왼쪽으로 밀면 다음 사진이 따라 들어옵니다.
      show(at + (x < 0 ? 1 : -1))
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
  show(0, true)
}

export function initImageViewers(scope = document) {
  for (const el of scope.querySelectorAll('.image-viewer')) initImageViewer(el)
}
