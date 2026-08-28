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
 * 지금 화면의 양 끝에 오는 카드를 정합니다.
 *
 * "뷰포트 경계를 넘어선 첫 카드" 같은 조건으로 고르면, 스크롤이 시작되는 순간
 * 조건이 만족돼 아직 띠 한가운데 있는 카드에 모서리가 붙었다 떨어집니다.
 * 그래서 스크롤 위치를 카드 한 칸으로 나눠 반올림합니다 — 한 칸 이동에 정확히
 * 한 번, 절반을 지날 때만 바뀝니다.
 */
function updateEdges(track) {
  const cards = [...track.querySelectorAll('.product-card')]
  if (!cards.length) return

  const gap = parseFloat(getComputedStyle(track).columnGap) || 0
  const step = cards[0].offsetWidth + gap
  if (!step) return

  const first = Math.round(track.scrollLeft / step)
  const perView = Math.max(1, Math.round((track.clientWidth + gap) / step))
  const startIndex = Math.min(first, cards.length - 1)
  const endIndex = Math.min(startIndex + perView - 1, cards.length - 1)

  cards.forEach((card, i) => {
    card.classList.toggle('is-edge-start', i === startIndex)
    card.classList.toggle('is-edge-end', i === endIndex)
  })
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
