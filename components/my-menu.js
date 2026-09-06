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
 *
 * 주소에 `?me=1` 을 붙이면 로그인한 모습으로 봅니다. 아직 로그인이 붙지 않은
 * 동안 그 화면을 확인하려면 이 파일을 고쳐 다시 배포해야 했는데, 시안을 맞춰
 * 보는 자리에서는 링크 하나로 오갈 수 있어야 합니다 — 진짜 로그인이 붙으면
 * 이 줄만 지우면 됩니다.
 */
const DEMO = { name: '정우진', black: true, hasNotice: true }
export const ME = new URLSearchParams(location.search).get('me') === '1' ? DEMO : null

/**
 * 로그인한 모습으로 갈아입습니다(또는 벗습니다).
 *
 * 진짜 로그인이 붙기 전까지는 주소의 `?me=1` 이 그 자리입니다 — 눌러도 아무 일이
 * 없는 버튼보다, 눌리면 화면이 실제로 바뀌는 편이 시안을 맞춰 보는 데 낫습니다.
 * 주소가 상태를 들고 있으므로 새로고침해도, 링크를 복사해 가도 그대로입니다.
 *
 * ⚠️ 인증은 없습니다. 번호도 인증번호도 확인하지 않습니다.
 */
function setDemo(on) {
  const url = new URL(location.href)
  if (on) url.searchParams.set('me', '1')
  else url.searchParams.delete('me')
  location.href = `${url.pathname.split('/').pop()}${url.search}`
}

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
  /* 폰의 마이 화면에도 섭니다(Figma 67:87010). GNB 오른쪽 위에 알림 아이콘이
     따로 있지만, 그것은 어느 화면에서나 있는 것이고 이 줄은 목록의 첫 칸에서
     "읽지 않은 것이 있다"를 점으로 말합니다. */
  { label: '알림', icon: 'notifications', badge: true, href: '', auth: true },
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
  { label: '로그아웃', quiet: true, href: '', auth: true, action: 'logout' },
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
function item({ label, desc, icon, badge, href, quiet, action }) {
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

  /* 점에는 글자가 없어 화면을 읽어주는 쪽에는 들리지 않습니다 — 이름 뒤에 붙입니다.
     읽지 않은 것이 있을 때만 붙습니다(ME.hasNotice). 늘 붙여두면 다 읽은 뒤에도
     빨간 점이 남아, 점이 무엇을 뜻하는지가 곧 뜻을 잃습니다. */
  if (badge && ME?.hasNotice) {
    const dot = el('span', 'badge')
    dot.append(el('span', 'sr-only', '새 알림 있음'))
    node.append(dot)
  }

  node.insertAdjacentHTML('beforeend', arrow())
  if (action === 'logout') node.addEventListener('click', () => setDemo(false))
  return node
}

function profile(page) {
  const box = el('div', `my-menu__profile${page ? ' my-menu__profile--page' : ''}`)

  const who = el('p', 'my-menu__who')

  /* 폰에서는 이름이 이 화면의 제목입니다 — 28 semibold 한 줄로 서고, 등급도
     블랙회원 표시도 붙지 않습니다(Figma 67:88608). 판에서는 GNB 아래 떠 있는
     것이라 제목이 될 수 없어, 이름 옆에 등급을 달아 누구인지를 한 줄로 말합니다. */
  if (page) {
    who.append(el('b', 'my-menu__name', `${ME.name} 님`))
  } else {
    const named = el('span', 'my-menu__badge-name')
    // 블랙회원에게만 붙는 표시입니다. 등급 글자가 옆에서 이미 말하고 있어, 없는
    // 사람에게 흐린 자리로 남겨두지 않고 아예 그리지 않습니다.
    if (ME.black) {
      named.insertAdjacentHTML('beforeend', '<svg aria-hidden="true"><use href="#icon-memberBlack"></use></svg>')
    }
    named.append(el('b', 'my-menu__name', `${ME.name} 님`))
    who.append(named, el('span', 'my-menu__grade', gradeOf(ME)))
  }

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
/** 계정 정보를 받는 칸 하나. 라벨은 칸 위에 섭니다 — 안에 넣으면 쓰기 시작하는
    순간 무엇을 쓰는 칸이었는지가 사라집니다. */
function field({ id, label, type, autocomplete, inputmode, maxLength, placeholder }) {
  const box = el('div', 'my-login__field')
  const tag = el('label', 'my-login__label', label)
  tag.htmlFor = id

  const input = document.createElement('input')
  input.className = 'my-login__input'
  input.id = id
  input.type = type
  input.name = id.replace('login-', '')
  input.autocomplete = autocomplete
  if (inputmode) input.inputMode = inputmode
  if (maxLength) input.maxLength = maxLength
  if (placeholder) input.placeholder = placeholder

  box.append(tag, input)
  return box
}

/**
 * 휴대폰 번호와 인증번호를 받는 폼.
 *
 * 인증번호 칸은 번호를 보내기 전에는 나오지 않습니다 — 아직 받을 수 없는 것을
 * 받는 칸이 비어 있으면, 무엇부터 해야 하는지가 두 칸 사이에서 흐려집니다.
 * 보내고 나서야 나오고, 그때 초점도 그리로 갑니다.
 *
 * ⚠️ 보낼 곳이 없습니다. `인증번호 받기` 는 칸을 열 뿐이고 `로그인` 은 아무 데도
 *    가지 않습니다. 다시 받기까지의 시간(보통 3분)도 세지 않습니다 — 세는 시늉만
 *    하는 숫자보다 없는 편이 낫습니다.
 */
function loginForm(login, signup) {
  const form = el('form', 'my-login')
  form.noValidate = true

  const phone = field({
    id: 'login-phone',
    label: '휴대폰 번호',
    type: 'tel',
    autocomplete: 'tel',
    inputmode: 'numeric',
    maxLength: 13,
    placeholder: '010-0000-0000',
  })
  const phoneInput = phone.querySelector('input')

  /* 번호 칸과 한 줄에 섭니다. 아래에 두면 폼이 한 칸 더 길어지는데, 이 버튼은
     번호에 딸린 것이라 그 옆이 제 자리입니다. */
  const send = el('button', 'btn btn--outlined btn--medium my-login__send')
  send.type = 'button'
  send.disabled = true
  send.append(el('span', 'btn__label', '인증번호 받기'))

  const row = el('div', 'my-login__row')
  row.append(phone, send)

  const code = field({
    id: 'login-code',
    label: '인증번호',
    type: 'text',
    autocomplete: 'one-time-code',
    inputmode: 'numeric',
    maxLength: 6,
  })
  code.hidden = true
  const codeInput = code.querySelector('input')

  /* 010-1234-5678 로 끊어 적습니다 — 열한 자리가 한 덩어리로 붙어 있으면 다시
     읽어 세어야 하고, 고칠 자리를 찾기도 어렵습니다. */
  phoneInput.addEventListener('input', () => {
    const n = phoneInput.value.replace(/\D/g, '').slice(0, 11)
    phoneInput.value = n.length > 7 ? `${n.slice(0, 3)}-${n.slice(3, 7)}-${n.slice(7)}`
      : n.length > 3 ? `${n.slice(0, 3)}-${n.slice(3)}` : n
    send.disabled = n.length < 10
  })

  codeInput.addEventListener('input', () => {
    codeInput.value = codeInput.value.replace(/\D/g, '')
    login.disabled = !codeInput.value
  })

  send.addEventListener('click', () => {
    code.hidden = false
    send.querySelector('.btn__label').textContent = '다시 받기'
    codeInput.focus()
  })

  login.disabled = true
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    setDemo(true)
  })
  form.append(row, code, login, signup)
  return form
}

function signedOut(page) {
  const box = el('div', 'my-menu__profile my-menu__profile--out')

  const intro = el('div', 'my-menu__intro')
  intro.append(
    el('p', 'my-menu__intro-title', '로그인하고 시작하기'),
    el('p', 'my-menu__intro-desc', '취향이 맞는 새로운 인연을 만나보세요'),
  )

  /* 아직 로그인 화면이 없어 <button> 입니다 — 주소가 없는 <a> 는 키보드가 지나가지
     못하고, 눌러도 아무 일이 없다는 것을 미리 말해주지도 못합니다. */
  const login = el('button', 'btn btn--filled btn--medium my-menu__login')
  login.type = page ? 'submit' : 'button'
  if (!page) {
    login.setAttribute('role', 'menuitem')
    login.addEventListener('click', () => setDemo(true))
  }
  login.append(el('span', 'btn__label', '로그인'))

  /* 로그인 아래 한 줄. 아직 계정이 없는 사람에게는 위 버튼이 막다른 길이라,
     그 자리에서 바로 다른 길을 냅니다(Figma 67:88130). 버튼 안에 두 길을 담지
     않는 것은 눌러야 할 것이 하나로 보여야 하기 때문입니다. */
  const signup = el('p', 'my-menu__signup')
  signup.append(el('span', null, '아직 회원이 아니신가요?'))
  const link = el('button', 'my-menu__signup-link', '회원가입')
  link.type = 'button'
  link.setAttribute('role', 'menuitem')
  signup.append(link)

  /* 폰에서는 이 화면이 곧 로그인 화면입니다 — 판처럼 다른 화면으로 넘길 자리가
     아니라, 260 이 아닌 한 화면을 통째로 쓰고 있어 여기서 바로 받습니다.
     넓은 화면의 판은 버튼 하나로 남습니다.

     진짜 <form> 인 것은 그래야 인증번호 칸에서 엔터를 쳐도 눌리고, 기기가 문자로
     온 인증번호를 그 칸에 채워주기 때문입니다(autocomplete: one-time-code). */
  if (page) {
    box.append(intro, loginForm(login, signup))
    return box
  }

  box.append(intro, login, signup)
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
     그러고 나면 구분선이 잇달아 남거나 맨 앞뒤에 서게 되므로 함께 걷어냅니다. */
  const shown = ITEMS.filter((entry) => !entry || ME || !entry.auth)

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
    ME ? profile(page) : signedOut(page),
    ...lines.map((entry) => (entry ? item(entry) : el('hr', 'my-menu__divider'))),
  )

  /* GNB 의 로그인 버튼과 같은 사실을 말합니다 — 로그인한 사람에게 로그인 버튼이
     남아 있으면 둘 중 어느 것이 참인지 알 수 없습니다. */
  if (ME) document.querySelector('.gnb__login')?.remove()

  syncNoticeDot()
  keepDemoFlag()

  /* GNB 의 로그인 버튼도 같은 자리로 갑니다 — 화면에 로그인이라 적힌 것이 둘인데
     하나만 눌린다면 눌리지 않는 쪽이 고장 난 것으로 보입니다. */
  const gnbLogin = document.querySelector('.gnb__login')
  if (gnbLogin && !gnbLogin.dataset.demoReady) {
    gnbLogin.dataset.demoReady = '1'
    gnbLogin.addEventListener('click', () => setDemo(true))
  }
}

/**
 * `?me=1` 을 이 화면 안의 링크에 함께 실어 보냅니다.
 *
 * 그러지 않으면 앱바로 다른 탭에 갔다 오는 순간 로그인한 모습이 풀립니다 —
 * 볼 때마다 주소창에 다시 적어야 하는 것은 확인하는 자리가 아닙니다.
 * 밖으로 나가는 링크와 앵커는 건드리지 않습니다.
 */
function keepDemoFlag() {
  if (!ME) return
  for (const link of document.querySelectorAll('a[href]')) {
    const href = link.getAttribute('href')
    if (!href.startsWith('./') && !href.startsWith('/')) continue
    const url = new URL(href, location.href)
    if (url.searchParams.get('me') === '1') continue
    url.searchParams.set('me', '1')
    link.setAttribute('href', `${url.pathname.split('/').pop()}${url.search}${url.hash}`)
  }
}

/**
 * GNB 종의 점.
 *
 * 목록의 알림 줄과 같은 값(ME.hasNotice)에서 나옵니다. 마크업에 박아두면 한쪽만
 * 꺼지는 날이 오는데, 같은 화면에 있는 두 점이 서로를 반박하면 어느 쪽도 믿을 수
 * 없게 됩니다 — 종은 어느 화면에나 있는 자리이고 줄은 마이 안의 항목이지만,
 * 가리키는 것은 하나입니다.
 *
 * 판과 화면이 각자 renderMyMenu 를 부르므로 두 번 지나갈 수 있습니다. 있는지
 * 보고 없을 때만 붙입니다.
 */
function syncNoticeDot() {
  for (const bell of document.querySelectorAll('.gnb__notify')) {
    const dot = bell.querySelector('.badge')
    if (ME?.hasNotice && !dot) {
      bell.insertAdjacentHTML(
        'beforeend',
        '<span class="badge btn__badge"><span class="sr-only">새 알림 있음</span></span>',
      )
    } else if (!ME?.hasNotice && dot) {
      dot.remove()
    }
  }
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
