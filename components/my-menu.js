/**
 * GNB 의 메뉴 버튼 아래로 열리는 내 메뉴.
 *
 *   import { initMyMenu } from './components/my-menu.js'
 *   initMyMenu()
 *
 * 항목은 아래 ITEMS 한 곳에 있습니다. 마크업에 적어두면 이 메뉴를 다는 화면마다
 * 같은 목록이 한 벌씩 생겨, 항목이 하나 늘 때 네 군데를 고치게 됩니다.
 *
 * 아직 갈 곳이 없는 항목은 href 를 비워둡니다 — 화면이 생기면 여기만 채우면 됩니다.
 * 비워둔 항목도 눌리기는 해야 합니다. 눌러도 아무 일이 없는 것과, 누를 수조차 없는
 * 것은 다릅니다 — 앞의 것은 "아직 준비 중"이고 뒤의 것은 "당신에게는 없는 기능"으로
 * 읽힙니다.
 *
 * ⚠️ 폰에서는 이 판이 아니라 별도 화면으로 갈 예정입니다(my-menu.css 의 메모).
 *    그 화면이 생기면 좁은 폭에서 initMyMenu 가 판을 열지 않고 그 주소로 보냅니다.
 *
 * ⚠️ 이름·등급·알림 여부는 로그인한 회원 정보가 들어올 자리입니다. 지금은 Figma 의
 *    예시 값을 그대로 두었습니다(find.js 의 ME 와 같은 자리입니다).
 */

/**
 * ⚠️ 로그인한 회원 정보가 들어올 자리입니다.
 *
 * 등급은 글자로 들고 있지 않고 `black` 하나에서 나옵니다 — 글자와 표시를 따로
 * 두면 "일반 회원"이라고 적힌 옆에 블랙회원 표시가 붙는 화면이 생깁니다.
 *
 * null 이면 로그인하지 않은 것입니다. 로그인한 모습을 보려면 아래 한 줄을
 * 되돌리면 됩니다:
 *
 *   const ME = { name: '정우진', black: true, hasNotice: true }
 *
 * 로그인 여부를 다른 화면도 봅니다(matching.js) — 화면마다 제 것을 들고 있으면
 * 한쪽만 로그인한 모습이 되는 날이 옵니다. 그래서 여기 하나만 둡니다.
 */
export const ME = null

/** 등급 이름과 이름 앞 표시는 한 값에서 함께 나옵니다. */
const gradeOf = (me) => (me.black ? '블랙 회원' : '일반 회원')

/**
 * 메뉴에 서는 것들. `null` 은 구분선입니다.
 *
 * 차례에 뜻이 있습니다 — 알림처럼 지금 확인할 것이 맨 위, 그 다음이 나를 보여주는
 * 것(프로필·인증), 그 다음이 내가 한 것(찜·결제·리뷰·쿠폰), 그 다음이 설정,
 * 마지막이 서비스에 대한 것과 로그아웃입니다.
 */
const ITEMS = [
  /* 알림은 판에서만 나옵니다. 폰에서는 GNB 오른쪽 위에 알림 아이콘이 이미 서 있어
     (gnb.css), 마이 화면에 한 줄을 더 두면 같은 곳으로 가는 길이 한 화면에 둘이
     됩니다 — 넓은 화면에서는 그 아이콘이 medium 폭에서 접히므로 판이 유일한
     길입니다. */
  { label: '알림', icon: 'notifications', badge: true, href: '', auth: true, panelOnly: true },
  null,
  { label: '기본 프로필', href: '', auth: true },
  { label: '상세 프로필', desc: '작성할수록 매칭 가능성이 높아져요', href: '', auth: true },
  { label: '블랙회원 인증', href: '', auth: true },
  null,
  { label: '찜한 모임', href: '', auth: true },
  { label: '결제 내역', href: '', auth: true },
  { label: '내가 작성한 리뷰', href: '', auth: true },
  { label: '쿠폰함', href: '', auth: true },
  { label: '아는 사람 피하기', href: '', auth: true },
  null,
  { label: '초대 코드', href: '', auth: true },
  { label: '계정 설정', href: '', auth: true },
  null,
  { label: '공지사항', href: '' },
  { label: '문의·의견 보내기', href: '' },
  null,
  { label: '로그아웃', quiet: true, href: '', auth: true },
]

const el = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

const arrow = () =>
  '<svg class="my-menu__arrow" aria-hidden="true"><use href="#icon-chevronRight"></use></svg>'

/**
 * 항목 하나.
 *
 * 갈 곳이 있으면 <a>, 없으면 <button> 입니다 — 링크로 두면 새 탭으로 열거나 주소를
 * 복사할 수 있어야 하는데, href 가 비어 있으면 그 약속을 지키지 못합니다.
 */
function item({ label, desc, icon, badge, href, quiet }) {
  const node = href ? el('a', 'my-menu__item') : el('button', 'my-menu__item')
  if (href) node.href = href
  else node.type = 'button'
  if (quiet) node.classList.add('my-menu__item--quiet')
  node.setAttribute('role', 'menuitem')

  if (icon) {
    node.insertAdjacentHTML(
      'beforeend',
      `<svg aria-hidden="true"><use href="#icon-${icon}"></use></svg>`,
    )
  }

  const text = el('span', 'my-menu__label')
  text.append(el('span', null, label))
  if (desc) text.append(el('span', 'my-menu__desc', desc))
  node.append(text)

  // 점에는 글자가 없어 화면을 읽어주는 쪽에는 들리지 않습니다 — 이름 뒤에 붙입니다.
  if (badge) {
    const dot = el('span', 'badge')
    dot.append(el('span', 'sr-only', '새 알림 있음'))
    node.append(dot)
  }

  node.insertAdjacentHTML('beforeend', arrow())
  return node
}

function profile() {
  const box = el('div', 'my-menu__profile')

  const who = el('p', 'my-menu__who')
  const named = el('span', 'my-menu__badge-name')
  // 블랙회원에게만 붙는 표시입니다. 등급 글자가 옆에서 이미 말하고 있어, 없는
  // 사람에게 흐린 자리로 남겨두지 않고 아예 그리지 않습니다.
  if (ME.black) {
    named.insertAdjacentHTML('beforeend', '<svg aria-hidden="true"><use href="#icon-memberBlack"></use></svg>')
  }
  named.append(el('b', 'my-menu__name', `${ME.name} 님`))
  who.append(named, el('span', 'my-menu__grade', gradeOf(ME)))

  /* 프로필 카드는 상대에게 보이는 내 모습이라, 목록의 한 줄이 아니라 배너입니다 —
     내가 어떻게 보이는지는 스스로 열어보기 전에는 알 수 없는 것이라 권해야 합니다. */
  const card = el('a', 'my-menu__card')
  card.href = '#'
  card.setAttribute('role', 'menuitem')
  card.innerHTML = '<img src="./images/my-profile-card.png" alt="">'
  const text = el('span', 'my-menu__card-text')
  text.append(
    el('span', 'my-menu__card-label', '프로필 카드 보기'),
    el('span', 'my-menu__card-desc', '상대에게 보이는 첫인상'),
  )
  card.append(text)
  card.insertAdjacentHTML('beforeend', '<svg aria-hidden="true"><use href="#icon-chevronRight"></use></svg>')

  box.append(who, card)
  return box
}

/**
 * 로그인하지 않았을 때의 머리(Figma 67:86252).
 *
 * 없는 이름 자리를 비워두는 대신 권하는 말과 로그인 하나를 둡니다 — 빈 자리는
 * 불러오는 중인지 없는 것인지 알 수 없고, 이 판을 처음 연 사람에게 가장 먼저
 * 필요한 것은 로그인입니다.
 *
 * 로그인한 쪽의 프로필 카드가 배너(누를 수 있는 줄)인 것과 달리 이쪽은 채운
 * 버튼입니다. 여기서 할 수 있는 일이 하나뿐이라, 고를 것이 아니라 눌러야 할
 * 것으로 서야 합니다.
 */
function signedOut() {
  const box = el('div', 'my-menu__profile my-menu__profile--out')

  const intro = el('div', 'my-menu__intro')
  intro.append(
    el('p', 'my-menu__intro-title', '로그인하고 시작하기'),
    el('p', 'my-menu__intro-desc', '취향이 맞는 새로운 인연을 만나보세요'),
  )

  /* 아직 로그인 화면이 없어 <button> 입니다 — 주소가 없는 <a> 는 키보드가 지나가지
     못하고, 눌러도 아무 일이 없다는 것을 미리 말해주지도 못합니다. */
  const login = el('button', 'btn btn--filled btn--medium my-menu__login')
  login.type = 'button'
  login.setAttribute('role', 'menuitem')
  login.append(el('span', 'btn__label', '로그인'))

  box.append(intro, login)
  return box
}

/**
 * 내 메뉴의 내용을 그립니다 — 누구인지, 프로필 카드, 그리고 열넷.
 *
 * 넓은 화면의 판(GNB 아래 팝오버)과 폰의 마이 화면(my.html)이 이것을 함께
 * 씁니다. 담기는 자리가 달라도 담기는 것은 같아야 합니다 — 항목이 하나 늘 때
 * 두 곳을 고치게 두지 않습니다.
 */
export function renderMyMenu(box, { page = false } = {}) {
  if (!box) return

  /* 로그인해야 쓸 수 있는 것은 로그인하기 전에는 아예 두지 않습니다 — 눌러서
     로그인 화면으로 튕겨 나오는 것보다, 지금 할 수 있는 것만 보이는 편이 짧습니다.
     화면(폰)에만 없는 것도 여기서 빠집니다. 그러고 나면 구분선이 잇달아 남거나
     맨 앞뒤에 서게 되므로 함께 걷어냅니다. */
  const shown = ITEMS.filter(
    (entry) => !entry || ((ME || !entry.auth) && !(page && entry.panelOnly)),
  )

  /* 잇달아 남은 구분선은 하나로 합치고 끝에 남은 것은 버립니다. 맨 앞의 것은
     남깁니다 — 위에 늘 프로필 블록이 서 있어, 그 선이 나눌 것이 있습니다
     (Figma: 로그인 전에는 로그인 버튼과 공지사항 사이에 선이 하나 섭니다). */
  const lines = []
  for (const entry of shown) {
    if (entry) lines.push(entry)
    else if (!lines.length || lines.at(-1)) lines.push(null)
  }
  while (lines.length && !lines.at(-1)) lines.pop()

  box.replaceChildren(
    ME ? profile() : signedOut(),
    ...lines.map((entry) => (entry ? item(entry) : el('hr', 'my-menu__divider'))),
  )

  /* GNB 의 로그인 버튼과 같은 사실을 말합니다 — 로그인한 사람에게 로그인 버튼이
     남아 있으면 둘 중 어느 것이 참인지 알 수 없습니다. */
  if (ME) document.querySelector('.gnb__login')?.remove()
}

export function initMyMenu(root = document.querySelector('[data-my-menu]')) {
  if (!root || root.dataset.myMenuReady) return
  root.dataset.myMenuReady = '1'

  const opener = root.querySelector('[data-my-menu-open]')
  const panel = root.querySelector('.my-menu__panel')
  if (!opener || !panel) return

  renderMyMenu(panel)

  const focusables = () =>
    [...panel.querySelectorAll('a, button')].filter((node) => !node.disabled)

  function close({ restore = true } = {}) {
    if (panel.hidden) return
    // 판 안에 초점이 있을 때만 되돌립니다. 다른 곳을 눌러 닫은 사람의 초점을
    // 빼앗아 버튼으로 끌어오면, 누른 자리에서 하려던 일이 끊깁니다.
    const inside = panel.contains(document.activeElement)
    panel.hidden = true
    opener.setAttribute('aria-expanded', 'false')
    if (restore && inside) opener.focus()
  }

  function open() {
    if (!panel.hidden) return close()
    panel.hidden = false
    opener.setAttribute('aria-expanded', 'true')
    panel.scrollTop = 0
    panel.focus()
  }

  opener.addEventListener('click', open)

  // 판과 버튼 밖을 누르면 닫습니다.
  document.addEventListener('click', (e) => {
    if (panel.hidden) return
    if (!e.target.isConnected) return
    if (root.contains(e.target)) return
    close({ restore: false })
  })

  document.addEventListener('keydown', (e) => {
    if (panel.hidden) return
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
      return
    }
    /* Tab 은 판 안에 가둡니다. 화면을 덮는 판은 아니지만, 열어둔 채 뒤로 빠져나가면
       판이 열려 있다는 것을 잊은 채 목록을 읽게 됩니다 — 닫고 나가는 길(Esc·바깥
       누르기)이 이미 있습니다. */
    if (e.key !== 'Tab') return
    const stops = focusables()
    if (!stops.length) return
    const first = stops[0]
    const last = stops[stops.length - 1]
    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    } else if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
      e.preventDefault()
      last.focus()
    }
  })

  /* 스크롤해 내려가면 닫습니다. 판은 버튼 아래에 붙어 있고 GNB 는 화면에 붙어
     따라오는데, 화면이 움직이는 동안 열린 채로 두면 목록을 가린 채 함께 미끄러집니다. */
  addEventListener('scroll', () => close({ restore: false }), { passive: true })
}

export function initMyMenus(scope = document) {
  for (const root of scope.querySelectorAll('[data-my-menu]')) initMyMenu(root)
}

/** 폰의 마이 화면. 판이 아니라 화면이라 여닫을 것이 없고, 내용만 그립니다. */
export function initMyPage(el = document.querySelector('[data-my-page]')) {
  renderMyMenu(el, { page: true })
}
