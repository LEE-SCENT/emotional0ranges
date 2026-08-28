/**
 * 상품 카드 캐러셀.
 *
 * 스크롤 자체는 CSS(scroll-snap)가 합니다. 이 스크립트가 하는 일은 둘뿐입니다.
 *   1. sectionTitle 의 이동 버튼을 스크롤에 연결 — 끝에 닿으면 반대편으로 넘어갑니다
 *   2. 지금 보이는 양 끝 카드에 is-edge-start / is-edge-end 를 붙이기
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
  const start = performance.now()
  // --_easing-standard 와 같은 곡선: 빠르게 출발해 부드럽게 멈춥니다.
  const ease = (t) => 1 - Math.pow(1 - t, 3)
  const step = (now) => {
    const t = Math.min(1, (now - start) / ms)
    el.scrollLeft = from + distance * ease(t)
    onFrame()
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

/** 모션 토큰에서 전환 시간을 읽습니다. 없으면 240ms. */
function scrollDuration(el) {
  const raw = getComputedStyle(el).getPropertyValue('--_duration-base').trim()
  const ms = parseFloat(raw)
  return Number.isFinite(ms) ? (raw.endsWith('ms') ? ms : ms * 1000) : 240
}

function updateEdges(track) {
  const cards = [...track.querySelectorAll('.product-card')]
  if (!cards.length) return
  // offsetLeft 는 위치가 잡힌 조상 기준이라 트랙 기준이 아닙니다. 트랙의 rect 와
  // 비교해야 스크롤 상태와 무관하게 "지금 보이는 양 끝" 을 정확히 집습니다.
  const view = track.getBoundingClientRect()

  let start = cards[0]
  let end = cards[cards.length - 1]
  for (const card of cards) {
    const r = card.getBoundingClientRect()
    if (r.left >= view.left - EDGE_TOLERANCE) { start = card; break }
  }
  for (const card of cards) {
    const r = card.getBoundingClientRect()
    if (r.right <= view.right + EDGE_TOLERANCE) end = card
  }

  for (const card of cards) {
    card.classList.toggle('is-edge-start', card === start)
    card.classList.toggle('is-edge-end', card === end)
  }
}

export function initProductCarousel(scope = document) {
  for (const section of scope.querySelectorAll('.product-card-section')) {
    const track = section.querySelector('.product-card-group')
    if (!track || track.dataset.carouselReady) continue
    track.dataset.carouselReady = '1'

    const [prev, next] = section.querySelectorAll('.section-title__nav .btn')
    const sync = () => updateEdges(track)
    const step = () => {
      const card = track.querySelector('.product-card')
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0
      return card ? card.offsetWidth + gap : track.clientWidth
    }

    const move = (dir) => {
      const max = track.scrollWidth - track.clientWidth
      const next = track.scrollLeft + dir * step()
      // 끝에서 막지 않고 반대편으로 넘어갑니다. 첫 상품에서 왼쪽을 누르면
      // 마지막 상품이 나옵니다.
      const to =
        next < -EDGE_TOLERANCE ? max
        : next > max + EDGE_TOLERANCE ? 0
        : Math.max(0, Math.min(max, next))
      // scroll 이벤트에만 기대지 않고 이동 중에도 직접 동기화합니다.
      // 탭이 숨겨져 있으면 scroll 이벤트가 발생하지 않아 상태가 멈춰버립니다.
      animateScrollTo(track, to, scrollDuration(track), () => sync())
    }
    prev?.addEventListener('click', () => move(-1))
    next?.addEventListener('click', () => move(1))

    track.addEventListener('scroll', sync, { passive: true })
    new ResizeObserver(sync).observe(track)
    document.fonts?.ready.then(sync)

    track.classList.add('is-ready')
    sync()
  }
}
