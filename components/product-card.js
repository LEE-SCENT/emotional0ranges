/**
 * 상품 카드 캐러셀.
 *
 * 스크롤 자체는 CSS(scroll-snap)가 합니다. 이 스크립트가 하는 일은 둘뿐입니다.
 *   1. 목록을 한 벌 복제해 레일을 잇고, 이동 버튼을 스크롤에 연결
 *   2. 멈췄을 때 양 끝 카드에 is-edge-start / is-edge-end 를 붙이기
 *
 * 복제하는 이유는 방향 때문입니다. 복제 없이 끝에서 처음으로 돌아가려면 레일을
 * 왼쪽으로 되감아야 하는데, 마지막 다음은 1번이 오른쪽에서 이어져 나와야 합니다.
 * 같은 목록이 한 벌 더 붙어 있으면 계속 오른쪽으로 밀다가, 한 바퀴를 넘어선 순간
 * 스크롤 위치만 한 바퀴만큼 조용히 되돌리면 됩니다 — 내용이 같아 티가 나지 않습니다.
 *
 * 2번이 없으면 둥근 모서리가 DOM 상 첫·마지막 카드에 묶여, 캐러셀이 넘어가도
 * 화면 가운데 카드가 둥글게 남습니다.
 */

const EDGE_TOLERANCE = 2 // 스크롤 위치는 소수점으로 떨어져 정확히 0 이 되지 않습니다.

/**
 * 스크롤을 직접 애니메이션합니다.
 *
 * CSS `scroll-behavior: smooth` 에 맡기지 않는 이유는, 그 조합에서 프로그램으로 건
 * 스크롤이 아예 적용되지 않는 환경을 확인했기 때문입니다. 직접 그리면 어디서나
 * 같은 결과가 나오고, 시간·가속도도 모션 토큰에 맞출 수 있습니다.
 */
function animateScrollTo(el, to, ms, onFrame = () => {}) {
  const from = el.scrollLeft
  const distance = to - from
  if (!distance) return

  // 애니메이션을 그릴 수 없거나 그릴 이유가 없으면 바로 옮깁니다.
  // 탭이 숨겨져 있으면 requestAnimationFrame 이 멈춰 있어, 이 분기가 없으면
  // 스크롤이 영영 목적지에 닿지 않습니다.
  const cannotAnimate =
    !ms ||
    document.visibilityState === 'hidden' ||
    matchMedia('(prefers-reduced-motion: reduce)').matches
  if (cannotAnimate) {
    el.scrollLeft = to
    onFrame()
    return
  }

  // 매 프레임 scrollLeft 를 옮기는 동안 scroll-snap 이 켜져 있으면 브라우저가
  // 프레임마다 스냅 지점으로 당겨 애니메이션과 싸웁니다. 손으로 스크롤할 때만
  // 필요한 기능이라 그리는 동안은 꺼둡니다.
  const snap = el.style.scrollSnapType
  el.style.scrollSnapType = 'none'

  const start = performance.now()
  // --_easing-standard 와 같은 곡선: 빠르게 출발해 부드럽게 멈춥니다.
  const ease = (t) => 1 - Math.pow(1 - t, 3)
  const step = (now) => {
    const t = Math.min(1, (now - start) / ms)
    el.scrollLeft = from + distance * ease(t)
    onFrame()
    if (t < 1) {
      requestAnimationFrame(step)
    } else {
      el.style.scrollSnapType = snap
    }
  }
  requestAnimationFrame(step)
}

/**
 * 미끄러지는 시간. 카드 한 장이 눈에 보이게 이동해야 해서 기본값(240ms)보다
 * 긴 --_duration-slow 를 씁니다.
 */
function scrollDuration(el) {
  const raw = getComputedStyle(el).getPropertyValue('--_duration-slow').trim()
  const ms = parseFloat(raw)
  return Number.isFinite(ms) ? (raw.endsWith('ms') ? ms : ms * 1000) : 400
}

/**
 * 멈춰 있을 때 양 끝에 오는 카드에 모서리를 줍니다.
 *
 * 움직이는 동안에는 모서리를 아예 걷어냅니다(clearEdges). 레일이 미끄러지는 중에는
 * 보이는 경계가 카드 경계와 어긋나서, 어느 카드를 고르든 둥근 모서리가 띠 한가운데
 * 떠 보이기 때문입니다. 잘린 레일은 각진 게 맞고, 멈춰야 양 끝이 둥글어집니다.
 */
function clearEdges(track) {
  for (const card of track.querySelectorAll('.product-card')) {
    card.classList.remove('is-edge-start', 'is-edge-end')
  }
}

function updateEdges(track) {
  const cards = [...track.querySelectorAll('.product-card')]
  if (!cards.length) return

  const gap = parseFloat(getComputedStyle(track).columnGap) || 0
  const step = cards[0].offsetWidth + gap
  if (!step) return

  const first = Math.min(Math.round(track.scrollLeft / step), cards.length - 1)
  const perView = Math.max(1, Math.round((track.clientWidth + gap) / step))
  const last = Math.min(first + perView - 1, cards.length - 1)

  cards.forEach((card, i) => {
    card.classList.toggle('is-edge-start', i === first)
    card.classList.toggle('is-edge-end', i === last)
  })
}

/** 목록을 한 벌 복제합니다. 복제본은 보조기기와 탭 이동에서 감춥니다. */
function cloneList(track) {
  const originals = [...track.querySelectorAll('.product-card')]
  for (const card of originals) {
    const clone = card.cloneNode(true)
    clone.dataset.clone = '1'
    clone.setAttribute('aria-hidden', 'true')
    for (const f of clone.querySelectorAll('a, button, input')) f.tabIndex = -1
    track.append(clone)
  }
  return originals.length
}

export function initProductCarousel(scope = document) {
  for (const section of scope.querySelectorAll('.product-card-section')) {
    const track = section.querySelector('.product-card-group')
    if (!track || track.dataset.carouselReady) continue
    track.dataset.carouselReady = '1'
    const originalCount = cloneList(track)

    const [prev, next] = section.querySelectorAll('.section-title__nav .btn')
    // 손으로 스크롤할 때도 멈춘 뒤에 모서리를 붙입니다.
    let settleTimer
    const settle = () => {
      clearTimeout(settleTimer)
      settleTimer = setTimeout(() => updateEdges(track), 120)
    }
    const onScroll = () => { clearEdges(track); settle() }
    const step = () => {
      const card = track.querySelector('.product-card')
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0
      return card ? card.offsetWidth + gap : track.clientWidth
    }

    /** 목록 한 바퀴의 길이. 이만큼 넘어가면 조용히 되돌립니다. */
    const lapWidth = () => originalCount * step()

    /** 한 바퀴를 넘어섰으면 위치만 되돌립니다. 내용이 같아 화면은 그대로입니다. */
    const normalize = () => {
      const lap = lapWidth()
      if (!lap) return
      if (track.scrollLeft >= lap - EDGE_TOLERANCE) track.scrollLeft -= lap
      else if (track.scrollLeft < -EDGE_TOLERANCE) track.scrollLeft += lap
    }

    const move = (dir) => {
      // 왼쪽으로 갈 자리가 없으면 한 바퀴 뒤로 순간이동해 둡니다. 그래야
      // 화면은 계속 왼쪽으로 미끄러지면서 마지막 상품이 나옵니다.
      if (dir < 0 && track.scrollLeft < step() - EDGE_TOLERANCE) {
        track.scrollLeft += lapWidth()
      }
      clearEdges(track)
      // 도착한 뒤에만 모서리를 다시 줍니다. scroll 이벤트에 기대지 않는 이유는
      // 탭이 숨겨져 있으면 그 이벤트가 발생하지 않기 때문입니다.
      animateScrollTo(track, track.scrollLeft + dir * step(), scrollDuration(track), () => {
        normalize()
        settle()
      })
    }
    prev?.addEventListener('click', () => move(-1))
    next?.addEventListener('click', () => move(1))

    track.addEventListener('scroll', onScroll, { passive: true })
    new ResizeObserver(() => updateEdges(track)).observe(track)
    document.fonts?.ready.then(() => updateEdges(track))

    track.classList.add('is-ready')
    updateEdges(track)
  }
}
