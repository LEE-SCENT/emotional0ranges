/**
 * 프로필을 고치는 두 화면(기본·상세)이 함께 쓰는 것들.
 *
 *   import { initProfileForm } from './components/profile-form.js'
 *   initProfileForm({ form, part: 'basic', saved: '기본 프로필을 저장했어요', render })
 *
 * 두 화면은 담는 것이 다를 뿐 하는 일이 같습니다 — 고치면 카드가 따라 바뀌고,
 * 저장하면 알리고, 저장하지 않은 채 나가려 하면 한 번 묻습니다. 그 일들을 여기
 * 한 곳에 둡니다. 화면마다 따로 들고 있으면 한쪽만 묻지 않고 나가는 날이 옵니다.
 *
 * ⚠️ 보낼 곳이 없습니다. 저장은 이 기기(localStorage)에 적어둘 뿐입니다 — 그래야
 *    기본 프로필에서 고친 것이 상세 프로필의 카드에도 보이고, "상세 프로필을 아직
 *    쓰지 않았다"는 것도 알 수 있습니다. 서버가 붙으면 load · store 둘만 갈아 끼웁니다.
 */
import { showToast } from './toast.js?v=ccb77a07'
import { openConfirm } from './confirm.js?v=f516d2db'
import { lockScroll, unlockScroll } from './scroll-lock.js?v=40a2cd35'

const KEY = 'eo:profile'

/**
 * ⚠️ 로그인한 회원의 프로필이 들어올 자리입니다. 지금은 Figma 의 예시 값입니다
 *    (my-menu.js 의 DEMO 와 같은 자리).
 *
 * 이름·출생연도·성별은 본인인증으로 들어온 것이라 폼에서 고칠 수 없습니다.
 * verified 는 서류로 확인이 끝난 것들입니다.
 */
const SAMPLE = {
  me: { name: '김땡땡', birthYear: 1991, gender: '남성' },
  verified: { company: true, family: false, school: false },
  basic: {
    height: '175',
    'home-sido': '서울',
    'home-gugun': '강남구',
    // 직업은 검색으로 고른 것이거나 분류로 고른 것, 둘 가운데 하나입니다. 어느 탭이
    // 열릴지는 값이 든 쪽이 정합니다(profile.js).
    // 기본 프로필은 전부 채워야 저장되므로, 이미 가입한 사람의 예시도 빈 칸이 없습니다.
    'job-search': '개발자',
    'job-major': '',
    'job-minor': '',
    'work-sido': '서울',
    'work-gugun': '강남구',
    'work-none': false,
    company: 'MUSINSA',
    'company-public': true,
    married: 'none',
    cohabited: false,
    kids: 'none',
  },
  /* null 이면 아직 한 번도 쓰지 않은 것입니다. */
  detail: null,
  /* 상세 프로필을 권하는 창은 한 번만 뜹니다. */
  promoShown: false,
}

export function load() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY))
    if (stored) return { ...SAMPLE, ...stored }
  } catch { /* 저장소를 못 쓰는 환경에서는 예시 값으로 시작합니다. */ }
  return structuredClone(SAMPLE)
}

export function store(profile) {
  try { localStorage.setItem(KEY, JSON.stringify(profile)) } catch { /* 위와 같습니다. */ }
}

/** "1991년생 · 36세". 나이는 Figma 의 예시(1991 → 36세)와 같이 세는 나이입니다. */
export const birthOf = (me) =>
  `${me.birthYear}년생 · ${new Date().getFullYear() - me.birthYear + 1}세`

/* ---- 폼 읽고 쓰기 -------------------------------------------------------
   이름이 붙은 칸을 전부 한 객체로 읽습니다. 체크박스 묶음(같은 이름이 여럿)은
   배열로, 혼자 선 체크박스는 참·거짓으로 읽습니다. */

const controls = (form) => [...form.elements].filter((el) => el.name)

export function read(form) {
  const data = {}
  for (const el of controls(form)) {
    if (el.type === 'radio') {
      if (el.checked) data[el.name] = el.value
      else data[el.name] ??= ''
    } else if (el.type === 'checkbox') {
      if (el.hasAttribute('value')) {
        data[el.name] ??= []
        if (el.checked) data[el.name].push(el.value)
      } else data[el.name] = el.checked
    } else data[el.name] = el.value
  }
  return data
}

export function write(form, data = {}) {
  for (const el of controls(form)) {
    const value = data[el.name]
    if (value === undefined) continue
    if (el.type === 'radio') el.checked = el.value === value
    else if (el.type === 'checkbox') {
      el.checked = el.hasAttribute('value') ? value.includes(el.value) : Boolean(value)
    } else el.value = value
  }
}

/* ---- 카드의 조각들 ------------------------------------------------------ */

export const el = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

const VERIFIED_TAGS = [
  ['company', '회사 인증'],
  ['family', '혼인·가족 인증'],
]

/** 카드의 머리 — 이름, 나이, 인증 표시, 심볼. 두 화면의 카드가 같은 머리를 씁니다. */
export function cardHeader(profile) {
  const header = el('header', 'profile-card__header')
  const who = el('div', 'profile-card__who')
  who.append(
    el('h2', 'profile-card__name', profile.me.name),
    el('p', 'profile-card__birth', birthOf(profile.me)),
  )
  const tags = el('div', 'profile-card__tags')
  for (const [key, label] of VERIFIED_TAGS) {
    if (!profile.verified[key]) continue
    const tag = el('span', 'tag tag--accent-pri')
    tag.innerHTML = '<svg aria-hidden="true"><use href="#icon-verifiedUserFilled"></use></svg>'
    tag.append(label)
    tags.append(tag)
  }
  const symbol = el('img', 'profile-card__symbol')
  symbol.src = './images/profile-card-symbol.svg'
  symbol.alt = ''
  symbol.width = 52
  symbol.height = 44
  header.append(who, tags, symbol)
  return header
}

/** 이름표 아래 값 한 칸. 값이 비면 칸째 그리지 않습니다 — 이름표만 남으면 빠뜨린
    것처럼 보이는데, 고르지 않는 것도 고를 수 있는 것이기 때문입니다. */
export function cardRow(label, value, { wide = false } = {}) {
  const empty = Array.isArray(value) ? !value.length : !value
  if (empty) return null
  const row = el('div', wide ? 'is-wide' : '')
  const body = el('dd')
  if (Array.isArray(value)) {
    const chips = el('span', 'profile-card__chips')
    for (const text of value) chips.append(el('span', 'tag', text))
    body.append(chips)
  } else if (value instanceof Node) body.append(value)
  else body.textContent = value
  row.append(el('dt', '', label), body)
  return row
}

export function cardGrid(rows) {
  const grid = el('dl', 'profile-card__grid')
  grid.append(...rows.filter(Boolean))
  return grid
}

/**
 * 카드의 내용을 갈아 끼웁니다. 키가 달라지면 그 사이를 미끄러져 갑니다.
 *
 * 카드는 내용만큼 자라는데, 고른 것이 한 줄 늘거나 구획이 바뀌면 키가 그 자리에서
 * 뚝 바뀝니다. 옆에서 폼을 고치는 동안 시야 끝에서 무엇이 튀면 눈이 그리로 끌려갑니다.
 *
 * 갈아 끼우기 전과 후의 키를 재서 그 사이만 움직입니다(height 를 auto 로는 전환할 수
 * 없어 CSS 만으로는 되지 않습니다). 움직이는 동안 넘치는 내용은 잘라, 새 내용이 카드
 * 밖으로 먼저 삐져나오지 않습니다.
 *
 * @param {Element} card
 * @param {Node[]} nodes
 * @param {{ fade?: boolean }} [options]  내용이 통째로 바뀔 때(구획이 바뀔 때) 새 내용이
 *   떠오르듯 나타나게 합니다. 한 글자 고칠 때마다 깜빡이면 안 되므로 기본은 꺼져 있습니다.
 */
export function swap(card, nodes, { fade = false } = {}) {
  const from = card.getBoundingClientRect().height
  for (const animation of card.getAnimations()) animation.cancel()
  card.replaceChildren(...nodes)
  if (!from || matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const root = getComputedStyle(document.documentElement)
  /* 빠름(120)과 보통(240)의 가운데, 180 입니다. 보통은 폼을 고치는 손보다 한 박자 늦어
     카드가 뒤따라오는 것처럼 보였고, 빠름은 미끄러지는 것이 보이기 전에 끝납니다.
     ⚠️ 그 사이의 duration 토큰이 없어 두 토큰의 가운데로 냅니다. */
  const ms = (name) => parseFloat(root.getPropertyValue(name))
  const timing = {
    duration: (ms('--_duration-fast') + ms('--_duration-base')) / 2 || 180,
    easing: root.getPropertyValue('--_easing-standard').trim() || 'ease',
  }
  const to = card.getBoundingClientRect().height
  if (Math.abs(to - from) > 0.5) {
    card.animate(
      [{ blockSize: `${from}px`, minBlockSize: 0, overflow: 'clip' },
        { blockSize: `${to}px`, minBlockSize: 0, overflow: 'clip' }],
      timing,
    )
  }
  if (fade) {
    // 머리(이름·인증)는 그대로라 건너뜁니다. 바뀐 것은 그 아래입니다.
    for (const node of nodes.slice(1)) node.animate?.([{ opacity: 0 }, { opacity: 1 }], timing)
  }
}

/* ---- 화면 --------------------------------------------------------------- */

/**
 * @param {object} options
 * @param {HTMLFormElement} options.form
 * @param {'basic' | 'detail'} options.part   저장할 때 프로필의 어느 쪽에 적을지.
 * @param {string} options.saved              저장했을 때의 알림 문구.
 * @param {(profile: object, draft: object) => void} options.render
 *   카드를 다시 그립니다. draft 는 아직 저장하지 않은 지금의 폼 값입니다.
 * @param {(profile: object) => void} [options.afterSave]
 * @param {(draft: object) => Array<{ field: Element, message: string }>} [options.validate]
 *   저장하기 전에 빠진 것을 찾습니다. 돌려준 것마다 그 칸 아래에 말이 섭니다.
 * @param {(values: object) => void} [options.prepare]
 *   값을 써넣기 직전에 돕니다. 그 값이 들어갈 자리를 먼저 만들어두는 곳입니다.
 */
export function initProfileForm({ form, part, saved, render, afterSave, validate, prepare }) {
  const profile = load()
  // 값을 써넣기 전에 화면이 먼저 준비합니다(앞 칸에 따라 달라지는 뒤 칸의 목록 같은 것).
  const fill = (values) => {
    prepare?.(values)
    write(form, values)
  }
  fill(profile[part] ?? {})

  let clean = JSON.stringify(read(form))
  const dirty = () => JSON.stringify(read(form)) !== clean

  /* ---- 쓰던 것 ----------------------------------------------------------
     저장하지 않은 채 새로고침해도 쓰던 것이 남습니다. 고친 것이 생기면 이 탭에
     (sessionStorage) 적어두었다가 다시 열릴 때 그대로 써넣습니다 — 저장된 것은
     아니어서 저장 버튼은 켜진 채로 돌아옵니다.

     탭을 닫으면 사라집니다. 다른 날 다시 열었을 때 며칠 전에 쓰다 만 것이 저장된
     것처럼 서 있으면 안 됩니다. */
  const draftKey = `${KEY}:draft:${part}`
  const keep = () => {
    try {
      if (dirty()) sessionStorage.setItem(draftKey, JSON.stringify(read(form)))
      else sessionStorage.removeItem(draftKey)
    } catch { /* 저장소를 못 쓰는 환경에서는 남기지 않습니다. */ }
  }
  try {
    const draft = JSON.parse(sessionStorage.getItem(draftKey))
    if (draft) fill(draft)
  } catch { /* 위와 같습니다. */ }
  const saves = document.querySelectorAll('[data-profile-save]')

  /* 한도를 채운 묶음은 고르지 않은 나머지를 잠급니다. 하나를 빼면 다시 풀립니다. */
  function limit() {
    for (const group of form.querySelectorAll('[data-max]')) {
      const boxes = [...group.querySelectorAll('input[type="checkbox"]')]
      const full = boxes.filter((box) => box.checked).length >= Number(group.dataset.max)
      for (const box of boxes) box.disabled = full && !box.checked
    }
  }

  function refresh() {
    limit()
    render(profile, read(form))
    /* 고친 것이 없으면 저장할 것도 없습니다. 흐리게 두는 것은 저장이 어디 있는지는
       처음부터 보여야 하기 때문입니다. */
    for (const button of saves) button.disabled = !dirty()
    keep()
  }

  function save() {
    profile[part] = read(form)
    store(profile)
    clean = JSON.stringify(profile[part])
    refresh()
  }

  /* ---- 빠진 것 ----------------------------------------------------------
     저장을 누르기 전에는 아무 말도 하지 않습니다. 아직 쓰는 중인 칸에 대고 비었다고
     하면, 채우려던 참인 사람을 재촉하는 것이 됩니다. 한 번 저장을 눌러 빠진 것을
     본 뒤에는, 고치는 대로 그 자리의 말이 사라집니다. */
  let warned = false
  function check({ jump = false } = {}) {
    for (const node of form.querySelectorAll('.field__error')) node.remove()
    for (const node of form.querySelectorAll('.field--error')) node.classList.remove('field--error')
    const missing = validate?.(read(form)) ?? []
    for (const { field, message } of missing) {
      field.classList.add('field--error')
      const note = el('p', 'field__error', message)
      // 읽어주는 쪽에도 들립니다. 눈으로만 붉어지면 무엇이 빠졌는지 알 수 없습니다.
      note.setAttribute('role', 'alert')
      field.append(note)
    }
    warned = missing.length > 0
    if (jump && warned) {
      const first = missing[0].field
      // 미끄러지지 않고 바로 갑니다. 방금 누른 저장에 대한 대답이라, 가는 동안을 보여줄
      // 것이 아니라 어디가 빠졌는지가 곧장 보여야 합니다.
      // 칸에서 눈에 보이는 첫 것으로 초점이 갑니다(감춰진 탭의 것은 건너뜁니다).
      const target = [...first.querySelectorAll('input:not([type="hidden"]), select, textarea')]
        .find((control) => control.offsetParent !== null)
      target?.focus({ preventScroll: true })
      first.scrollIntoView({ block: 'center' })
    }
    return !warned
  }

  /** 빠진 것이 없을 때만 저장합니다. */
  function trySave() {
    if (!check({ jump: true })) return false
    save()
    return true
  }

  const edited = () => {
    refresh()
    if (warned) check()
  }
  form.addEventListener('input', edited)
  form.addEventListener('change', edited)
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    if (!dirty() || !trySave()) return
    showToast(saved, { icon: '#icon-check', tone: 'success' })
    afterSave?.(profile)
  })
  // 저장 버튼이 폼 밖(화면 아래 띠)에도 있습니다.
  for (const button of saves) {
    if (!button.form) button.addEventListener('click', () => form.requestSubmit())
  }

  /* ---- 나가는 길 --------------------------------------------------------
     고친 것이 남아 있으면 한 번 묻습니다. 버리고 나가는 길은 없습니다 — 물음이
     "저장하고 나갈까요?" 하나라, 답은 계속 쓰거나 저장하고 나가거나입니다. */
  let leaving = null
  const go = {
    back() {
      if (history.length > 1) history.back()
      else location.href = './my.html'
    },
    detail() { location.href = './profile-detail.html' },
  }

  // back.js 보다 먼저 받아야 합니다(capture) — 그쪽이 먼저 받으면 묻기 전에 이미 떠납니다.
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-profile-leave]')
    if (!trigger || !dirty()) return
    e.preventDefault()
    e.stopImmediatePropagation()
    leaving = trigger.dataset.profileLeave
    openConfirm(leaving === 'detail' ? 'profile-move' : 'profile-leave')
  }, true)

  document.addEventListener('confirm:accept', (e) => {
    if (e.target.id === 'profile-promo') return go.detail()
    if (!leaving) return
    // 빠진 것이 있으면 나가지 않습니다. 창은 이미 닫혔고, 빠진 칸으로 데려갑니다.
    if (!trySave()) return
    go[leaving]()
  })

  initPreview(() => render(profile, read(form)))
  refresh()

  return { profile, refresh, dirty }
}

/**
 * 좁은 화면의 "프로필 미리보기".
 *
 * 창 안의 카드는 옆 단의 카드와 같은 render 가 그립니다 — 열 때마다 다시 그려,
 * 저장하지 않은 지금의 값이 그대로 보입니다.
 */
function initPreview(render) {
  const dialog = document.getElementById('profile-preview')
  if (!dialog) return

  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-profile-preview-open]')) return
    render()
    dialog.showModal()
    lockScroll()
    dialog.dispatchEvent(new CustomEvent('profile-preview:open'))
  })
  dialog.addEventListener('click', (e) => {
    // 닫기, 또는 카드 바깥(어두워진 자리).
    if (e.target.closest('[data-profile-preview-close]') || !e.target.closest('.profile-card')) {
      dialog.close()
    }
  })
  dialog.addEventListener('close', () => unlockScroll())
}
