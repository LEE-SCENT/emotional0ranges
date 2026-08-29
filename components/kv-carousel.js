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
 *   --kv-slide-origin
 *                 줄어드는 축. 왼쪽에 있는 장은 오른쪽 변을, 오른쪽에 있는 장은
 *                 왼쪽 변을 붙듭니다 — 화면을 향한 변이 제자리라야 그만큼 보입니다.
 *
 * 넘기는 방법은 둘입니다. 좁은 화면에서는 손가락으로 끌고, 961 부터는 좌우 화살표를
 * 씁니다. 화살표는 마크업에 늘 있고 어느 폭에서 보일지는 CSS 가 정합니다.
 *
 * 자동 전환은 사진 장에만 겁니다. 영상 장은 반복 재생하며 그 자리에 머뭅니다.
 * 마우스가 올라가 있거나 키보드가 안에 들어와 있는 동안에는 멈춥니다 — 읽고 있는
 * 것이 눈앞에서 사라지면 안 됩니다.
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
  if (!track || !track.querySelector('.kv')) return

  /** 줄 순서가 바뀌므로 그때그때 DOM 에서 읽습니다. */
  const list = () => [...track.querySelectorAll('.kv')]
  const count = list().length

  group.dataset.slides = String(count)

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

  // 순서가 바뀌어도 값이 따라다니도록 번호가 아니라 요소로 기억합니다.
  const target = new Map()
  const value = new Map()

  const measure = () => {
    size = step(track)
  }

  const draw = () => {
    let moving = false
    for (const el of list()) {
      const to = target.get(el) ?? 1
      const from = value.get(el) ?? to
      const gap = to - from
      const next = Math.abs(gap) < DONE ? to : from + gap * FOLLOW
      if (next !== to) moving = true
      value.set(el, next)
      el.style.setProperty('--kv-slide-scale', next.toFixed(4))
    }

    running = moving
    if (moving) requestAnimationFrame(draw)
  }

  const mark = () => {
    queued = false
    const items = list()
    const pos = size ? track.scrollLeft / size : 0

    items.forEach((el, i) => {
      // 지금 자리에서 한 장 이상 떨어지면 완전히 줄어든 크기입니다.
      const away = Math.min(1, Math.abs(pos - i))
      target.set(el, idle + (1 - idle) * (1 - away))
      // 화면 쪽을 향한 변을 붙들어야 줄어든 장이 그만큼 보입니다. 왼쪽에 있는 장은
      // 오른쪽 변을, 오른쪽에 있는 장은 왼쪽 변을 축으로 삼습니다.
      el.style.setProperty('--kv-slide-origin', i < pos ? 'right' : 'left')
    })

    if (!running) {
      running = true
      requestAnimationFrame(draw)
    }

    const next = Math.round(pos)
    if (next === current) return
    current = next
    items.forEach((el, i) => el.classList.toggle('is-current', i === next))
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
     사진 장만 정해진 시간이 지나면 넘어갑니다. 마지막 장 다음은 처음으로
     돌아옵니다.

     영상 장은 스스로 넘어가지 않습니다 — 영상은 끝나면 다시 재생되고, 다음으로
     가는 것은 보는 사람이 정합니다. 영상을 중간에 끊고 넘기면 하려던 말이 잘립니다. */

  let timer = 0
  let paused = false

  /**
   * 한 장 옮깁니다. dir 는 1(다음) 또는 -1(이전).
   *
   * 줄 끝에서 다음을 누르면 첫 장을 줄 끝으로 옮기고 스크롤을 한 칸 당깁니다. 둘이
   * 같은 프레임 안에서 일어나 화면은 조금도 움직이지 않고, 갈 곳만 오른쪽에
   * 생깁니다. 되감듯 왼쪽으로 돌아가면 "다음"이라는 말과 어긋납니다.
   * 처음에서 이전을 누를 때는 반대로 합니다.
   */
  const move = (dir) => {
    const items = list()
    const n = items.length
    if (n < 2 || !size) return

    // 앞선 이동이 아직 흐르는 중일 수 있습니다. 그 상태에서 자리를 계산하면 어긋나므로
    // 먼저 가장 가까운 장에 딱 맞춰 세웁니다. scrollLeft 를 직접 쓰면 진행 중이던
    // 부드러운 스크롤도 함께 끊깁니다.
    const at = Math.round(track.scrollLeft / size)
    track.scrollLeft = at * size

    if (dir > 0 && at === n - 1) {
      track.append(items[0])
      track.scrollLeft -= size
    } else if (dir < 0 && at === 0) {
      track.prepend(items[n - 1])
      track.scrollLeft += size
    }

    const from = Math.round(track.scrollLeft / size)
    // 줄을 옮긴 직후에는 스냅이 자리를 다시 잡습니다. 같은 프레임에 스크롤을 걸면
    // 그 재조정에 밀려 사라지므로 한 프레임 뒤에 겁니다.
    requestAnimationFrame(() => {
      track.scrollTo({ left: (from + dir) * size, behavior: 'smooth' })
    })
  }

  const stop = () => {
    clearTimeout(timer)
    timer = 0
  }

  const plan = () => {
    stop()
    if (paused || count < 2 || wantsLessMotion()) return
    const slide = list()[current]
    // 영상 장은 반복 재생하며 머뭅니다. 넘기는 것은 사람이 합니다.
    if (!slide || slide.querySelector('[data-youtube]')) return
    timer = setTimeout(() => move(1), IMAGE_DURATION)
  }

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
    move(nav.getAttribute('aria-label')?.includes('이전') ? -1 : 1)
  })

  measure()
  mark()
  // 처음 그릴 때는 뒤따라올 이유가 없습니다. 목표를 그대로 씁니다.
  for (const el of list()) {
    const to = target.get(el) ?? 1
    value.set(el, to)
    el.style.setProperty('--kv-slide-scale', to.toFixed(4))
  }
  plan()
}

export function initKvCarousels(scope = document) {
  for (const el of scope.querySelectorAll('.kv-group')) initKvCarousel(el)
}
