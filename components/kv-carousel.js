/**
 * KV 가 여러 장일 때 지금 몇 번째인지 알려주는 최소한의 스크립트.
 *
 *   import { initKvCarousels } from './components/kv-carousel.js'
 *   initKvCarousels()
 *
 * 넘기는 것 자체는 CSS 가 합니다 — overflow-x 와 scroll-snap 이면 손가락으로는
 * 충분합니다. 여기서는 세 가지만 합니다.
 *
 *   data-slides   장 수. 한 장이면 CSS 가 페이지네이션을 감춥니다.
 *   is-current    지금 보고 있는 장. 나머지는 작게 물러납니다.
 *   좌우 버튼     넓은 화면의 ‹ › 를 스크롤에 연결합니다.
 *
 * 스크롤 위치를 장 폭으로 나눠 반올림합니다. 눈에 보이는 비율을 재는 방법도 있지만,
 * 장이 스냅으로 멈추므로 나눗셈이면 충분하고 결과가 흔들리지 않습니다.
 */

function step(track) {
  const first = track.querySelector('.kv')
  if (!first) return 0
  const gap = parseFloat(getComputedStyle(track).columnGap) || 0
  return first.getBoundingClientRect().width + gap
}

export function initKvCarousel(group) {
  if (group.dataset.kvReady) return
  group.dataset.kvReady = '1'

  const track = group.querySelector('.kv-group__track')
  const slides = [...group.querySelectorAll('.kv')]
  if (!track || !slides.length) return

  group.dataset.slides = String(slides.length)

  let current = -1
  let queued = false

  const mark = () => {
    queued = false
    const size = step(track)
    const next = size ? Math.round(track.scrollLeft / size) : 0
    if (next === current) return
    current = next
    slides.forEach((el, i) => el.classList.toggle('is-current', i === next))
  }

  track.addEventListener(
    'scroll',
    () => {
      if (queued) return
      queued = true
      requestAnimationFrame(mark)
    },
    { passive: true },
  )

  // 좌우 버튼은 장마다 들어 있습니다. 어느 것을 눌러도 트랙을 한 장씩 옮깁니다.
  group.addEventListener('click', (e) => {
    const nav = e.target.closest('.kv__nav')
    if (!nav || !group.contains(nav)) return
    const back = nav.getAttribute('aria-label')?.includes('이전')
    track.scrollBy({ left: back ? -step(track) : step(track), behavior: 'smooth' })
  })

  new ResizeObserver(mark).observe(track)
  mark()
}

export function initKvCarousels(scope = document) {
  for (const el of scope.querySelectorAll('.kv-group')) initKvCarousel(el)
}
