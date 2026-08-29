/**
 * KV 가 여러 장일 때 지금 몇 번째인지 알려주는 최소한의 스크립트.
 *
 *   import { initKvCarousels } from './components/kv-carousel.js'
 *   initKvCarousels()
 *
 * 넘기는 것 자체는 CSS 가 합니다 — overflow-x 와 scroll-snap 이면 손가락으로는
 * 충분합니다. 여기서는 세 가지만 합니다.
 *
 *   data-slides   장 수.
 *   is-current    지금 보고 있는 장.
 *   --kv-slide-scale
 *                 장마다의 크기. 스크롤 위치에서 바로 계산해 매 프레임 넣습니다.
 *                 CSS 전환에 맡기면 스냅이 끝난 뒤 한 번에 커져 툭 튀어 보입니다.
 *
 * 넘기는 방법은 둘입니다. 좁은 화면에서는 손가락으로 끌고, 961 부터는 좌우 화살표를
 * 씁니다. 화살표는 마크업에 늘 있고 어느 폭에서 보일지는 CSS 가 정합니다.
 *
 * 자동 전환은 사진 장에만 겁니다 — 영상 장은 영상이 끝날 때 넘어갑니다. 마우스가
 * 올라가 있거나 키보드가 안에 들어와 있는 동안에는 멈춥니다. 읽고 있는 것이 눈앞에서
 * 사라지면 안 됩니다.
 *
 * 스크롤 위치를 장 폭으로 나눠 반올림합니다. 눈에 보이는 비율을 재는 방법도 있지만,
 * 장이 스냅으로 멈추므로 나눗셈이면 충분하고 결과가 흔들리지 않습니다.
 */

/**
 * 한 장을 넘기는 데 필요한 스크롤 거리.
 *
 * offsetWidth 를 쓰는 이유는 장이 scale 로 줄어 있기 때문입니다. 화면에 보이는
 * 폭(getBoundingClientRect)을 재면 줄어든 값이 나와, 그 값으로 다시 크기를
 * 계산하면 서로를 물고 조금씩 어긋납니다. offsetWidth 는 변형 전 폭입니다.
 *
 * 스크롤 중에는 부르지 않습니다 — offsetWidth 와 getComputedStyle 은 그 자리에서
 * 레이아웃을 다시 계산하게 만들어, 매 프레임 부르면 그만큼 프레임이 밀립니다.
 */
function step(track) {
  const first = track.querySelector('.kv')
  if (!first) return 0
  const gap = parseFloat(getComputedStyle(track).columnGap) || 0
  return first.offsetWidth + gap
}

/**
 * 사진 한 장을 보여주는 시간.
 * ⚠️ Figma 에 없어 코드에서 정했습니다. 헤드라인 두 줄을 읽고 CTA 를 훑기에
 * 5 초면 충분하다고 보았습니다.
 */
const IMAGE_DURATION = 5000

const wantsLessMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

export function initKvCarousel(group) {
  if (group.dataset.kvReady) return
  group.dataset.kvReady = '1'

  const track = group.querySelector('.kv-group__track')
  const slides = [...group.querySelectorAll('.kv')]
  if (!track || !slides.length) return

  group.dataset.slides = String(slides.length)

  // 줄어든 크기는 토큰이 갖고 있습니다. 여기서 숫자를 다시 적으면 둘이 어긋납니다.
  const idle =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--_kv-slide-scale-idle'),
    ) || 1

  // 크기는 스크롤을 곧바로 따르지 않고 천천히 뒤따라옵니다.
  //
  // 스냅이 걸려 있어 손을 떼면 스크롤이 순식간에 다음 장으로 넘어갑니다. 크기를
  // 스크롤 위치에 그대로 묶으면 그 짧은 시간에 0.882 에서 1 까지 다 가버려서
  // 팡 하고 튀어 오르는 것처럼 보입니다. 그래서 목표값과 현재값을 따로 두고,
  // 매 프레임 목표 쪽으로 조금씩(FOLLOW) 다가가게 합니다. 천천히 끄는 동안에는
  // 목표도 천천히 움직이므로 차이가 거의 없고, 튕겨 넘길 때만 부드럽게 늘어납니다.
  const FOLLOW = 0.12
  const DONE = 0.001

  let current = -1
  let queued = false
  let running = false
  let size = 0
  let settle = 0

  const targets = slides.map(() => 1)
  const values = slides.map(() => 1)

  const measure = () => {
    size = step(track)
  }

  const draw = () => {
    let moving = false
    slides.forEach((el, i) => {
      const gap = targets[i] - values[i]
      if (Math.abs(gap) < DONE) {
        values[i] = targets[i]
      } else {
        values[i] += gap * FOLLOW
        moving = true
      }
      el.style.setProperty('--kv-slide-scale', values[i].toFixed(4))
    })

    running = moving
    if (moving) requestAnimationFrame(draw)
  }

  const mark = () => {
    queued = false
    const pos = size ? track.scrollLeft / size : 0

    slides.forEach((el, i) => {
      // 지금 자리에서 한 장 이상 떨어지면 완전히 줄어든 크기입니다.
      const away = Math.min(1, Math.abs(pos - i))
      targets[i] = idle + (1 - idle) * (1 - away)
    })

    if (!running) {
      running = true
      requestAnimationFrame(draw)
    }

    const next = Math.round(pos)
    if (next === current) return
    current = next
    slides.forEach((el, i) => el.classList.toggle('is-current', i === next))
    plan()
  }

  track.addEventListener(
    'scroll',
    () => {
      // 스크롤이 시작되면 브라우저에 크기가 계속 바뀔 것이라고 미리 알립니다.
      // 그러면 장을 한 겹으로 따로 올려두고 그 겹만 늘였다 줄입니다 — 안에 든
      // 영상까지 매 프레임 다시 그리지 않아 끊김이 사라집니다. 계속 켜두면 그만큼
      // 메모리를 물고 있으므로 멈추면 바로 끕니다.
      if (!settle) track.classList.add('is-scrolling')
      clearTimeout(settle)
      settle = setTimeout(() => {
        settle = 0
        // 스크롤이 멈춰도 크기는 아직 뒤따라오는 중일 수 있습니다.
        if (!running) track.classList.remove('is-scrolling')
        else setTimeout(() => track.classList.remove('is-scrolling'), 400)
      }, 160)

      if (queued) return
      queued = true
      requestAnimationFrame(mark)
    },
    { passive: true },
  )

  // 폭은 창이 바뀔 때만 다시 잽니다.
  new ResizeObserver(() => {
    measure()
    mark()
  }).observe(track)

  /* ---- 자동 전환 --------------------------------------------------------
     사진 장은 정해진 시간이 지나면, 영상 장은 영상이 끝나면 다음으로 넘어갑니다.
     마지막 장 다음은 처음으로 돌아옵니다. */

  let timer = 0
  let paused = false

  const advance = () => {
    const next = (current + 1) % slides.length
    track.scrollTo({ left: next * size, behavior: 'smooth' })
  }

  const stop = () => {
    clearTimeout(timer)
    timer = 0
  }

  const plan = () => {
    stop()
    if (paused || slides.length < 2 || wantsLessMotion()) return
    const slide = slides[current]
    // 영상 장은 시간이 아니라 재생이 끝나는 때를 기다립니다.
    if (!slide || slide.querySelector('[data-youtube]')) return
    timer = setTimeout(advance, IMAGE_DURATION)
  }

  group.addEventListener('kv:ended', () => {
    if (!paused && slides.length > 1) advance()
  })

  // 보고 있는 동안에는 멈춥니다.
  const hold = () => {
    paused = true
    stop()
  }
  const release = () => {
    paused = false
    plan()
  }
  group.addEventListener('mouseenter', hold)
  group.addEventListener('mouseleave', release)
  group.addEventListener('focusin', hold)
  group.addEventListener('focusout', (e) => {
    if (!group.contains(e.relatedTarget)) release()
  })

  // 화살표는 마크업에 늘 있습니다. 어느 폭에서 보일지는 CSS 가 정합니다.
  group.addEventListener('click', (e) => {
    const nav = e.target.closest('.kv__nav')
    if (!nav || !group.contains(nav)) return
    const back = nav.getAttribute('aria-label')?.includes('이전')
    const next = (current + (back ? -1 : 1) + slides.length) % slides.length
    track.scrollTo({ left: next * size, behavior: 'smooth' })
  })

  measure()
  mark()
  // 처음 그릴 때는 뒤따라올 이유가 없습니다. 목표를 그대로 씁니다.
  slides.forEach((el, i) => {
    values[i] = targets[i]
    el.style.setProperty('--kv-slide-scale', values[i].toFixed(4))
  })
  plan()
}

export function initKvCarousels(scope = document) {
  for (const el of scope.querySelectorAll('.kv-group')) initKvCarousel(el)
}
