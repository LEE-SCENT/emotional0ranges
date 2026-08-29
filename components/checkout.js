/**
 * 신청·결제 화면의 계산과 상태를 맞춥니다.
 *
 *   import { initCheckout } from './components/checkout.js'
 *   initCheckout()
 *
 * 하는 일은 넷입니다.
 *
 *   일정      고른 일정에 따라 요약의 날짜·장소·금액을 다시 씁니다.
 *   당일 배너 고른 일정이 오늘이면 환불되지 않는다는 줄을 카드 맨 위에 올립니다.
 *   금액      상품 금액 − 할인 + 추가 옵션. 총액과 버튼 글자는 언제나 같은 수입니다.
 *   동의      필수 동의를 켜야 결제 버튼이 눌립니다.
 *
 * 값은 전부 마크업이 들고 있습니다. 일정 카드에 금액과 날짜가 적혀 있고 여기서는
 * 고른 것을 읽어 더하기만 합니다. 스크립트 안에 금액을 적어두면 화면에 보이는 값과
 * 계산에 쓰이는 값이 서로 다른 곳에 살게 되고, 한쪽만 고쳐지는 날이 옵니다.
 *
 * 총액과 버튼 글자를 각각 계산하지 않고 한 번 구한 수를 두 곳에 넣습니다. 정책에서
 * 둘을 늘 같게 두라는 것은, 다르게 만들 방법이 있으면 언젠가 달라지기 때문입니다.
 */

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']

const won = (n) => `${n.toLocaleString('ko-KR')}원`

/**
 * 오늘(한국 시간)의 날짜.
 *
 * 기기 시계가 어느 지역에 맞춰져 있든 서비스 운영 기준으로 판단해야 합니다. 해외에
 * 있는 사람이 "오늘"이 아니라고 안내받고 결제한 뒤, 서버는 당일로 보고 환불을
 * 막는 일이 생깁니다.
 */
function todayInSeoul() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  const [y, m, d] = parts.split('-').map(Number)
  return { y, m, d }
}

/**
 * 일정 카드가 가리키는 날짜.
 *
 * data-date(YYYY-MM-DD)가 실제 값입니다. 서버가 없는 이 화면에서는 data-date-in
 * (오늘부터 며칠 뒤)도 받습니다 — 어느 날 열어도 당일 배너가 붙은 카드와 붙지 않은
 * 카드를 함께 볼 수 있어야 하기 때문입니다.
 */
function dateOf(el) {
  const raw = el.dataset.date
  if (raw) {
    const [y, m, d] = raw.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const days = Number(el.dataset.dateIn)
  if (!Number.isFinite(days)) return null
  const t = todayInSeoul()
  return new Date(t.y, t.m - 1, t.d + days)
}

const isToday = (at) => {
  const t = todayInSeoul()
  return at.getFullYear() === t.y && at.getMonth() + 1 === t.m && at.getDate() === t.d
}

const dateText = (at) =>
  `${at.getFullYear()}년 ${at.getMonth() + 1}월 ${at.getDate()}일 (${WEEKDAY[at.getDay()]})`

export function initCheckout(scope = document) {
  const root = scope.querySelector('.checkout')
  if (!root) return

  const summary = root.querySelector('.summary-card')
  const options = [...scope.querySelectorAll('[name="schedule"]')]
  if (!summary || !options.length) return

  const banner = summary.querySelector('.summary-card__banner')
  const when = summary.querySelector('.summary-card__when')
  const where = summary.querySelector('.summary-card__where')
  const extra = summary.querySelector('[data-extra-option]')
  const price = summary.querySelector('.summary-card__price')
  const agree = scope.querySelector('[data-agree]')
  const agreeRow = scope.querySelector('.checkout__agree')
  const terms = scope.querySelector('.checkout__terms')
  const toggle = scope.querySelector('.checkout__terms-toggle')
  const buttons = [...scope.querySelectorAll('[data-pay]')]

  /** 금액 줄 하나. 없으면 만들지 않고, 있던 것이 필요 없어지면 지웁니다. */
  const row = (key) => price?.querySelector(`[data-price="${key}"]`)

  const setRow = (key, text, on) => {
    const dd = row(key)
    const dt = price?.querySelector(`[data-price-label="${key}"]`)
    if (!dd || !dt) return
    // 고르지 않은 옵션의 금액 줄은 자리도 비우지 않습니다. 0원짜리 줄이 남아
    // 있으면 무엇을 더 냈는지 세는 눈이 한 번 더 멈춥니다.
    dd.hidden = !on
    dt.hidden = !on
    if (on) dd.textContent = text
  }

  const render = () => {
    const card = options.find((el) => el.checked)?.closest('.option-card')
    if (!card) return

    const at = dateOf(card)

    /* ---- 일정 --------------------------------------------------------- */
    if (at && when) when.textContent = `${dateText(at)} ${card.dataset.time || ''}`.trim()
    if (where) where.textContent = card.dataset.where || ''

    /* ---- 당일 배너 ----------------------------------------------------
       일정을 바꿀 때마다 다시 판단합니다. 한 번 붙인 뒤 그대로 두면, 당일 일정에서
       다른 날로 옮긴 사람이 환불되지 않는다는 말을 계속 보게 됩니다. */
    if (banner) banner.hidden = !(at && isToday(at))

    /* ---- 금액 ---------------------------------------------------------- */
    const base = Number(card.dataset.price) || 0
    const off = Number(card.dataset.discount) || 0
    const add = extra?.checked ? Number(extra.dataset.extraOption) || 0 : 0
    const total = base - off + add

    setRow('base', won(base), true)
    setRow('discount', `-${won(off)}`, off > 0)
    setRow('extra', `+${won(add)}`, add > 0)
    setRow('total', won(total), true)

    // 버튼 글자는 총액에서 바로 만듭니다. 두 곳에서 따로 계산하면 언젠가 갈립니다.
    for (const btn of buttons) {
      const label = btn.querySelector('.btn__label')
      if (label) label.textContent = `${won(total)} 결제하기`
    }
  }

  const lock = () => {
    const ok = !!agree?.checked
    for (const btn of buttons) btn.disabled = !ok
  }

  for (const el of options) el.addEventListener('change', render)
  extra?.addEventListener('change', render)
  agree?.addEventListener('change', lock)

  /* ---- 규정 펼치기 ------------------------------------------------------
     마크업에는 펼쳐진 채로 들어 있고 여기서 접습니다. 반대로 하면 스크립트가 오지
     않았을 때 규정을 읽을 방법이 없습니다. */
  if (agreeRow && terms && toggle) {
    let open = false
    const paint = () => {
      agreeRow.classList.toggle('is-collapsed', !open)
      toggle.setAttribute('aria-expanded', String(open))
      toggle.textContent = open ? '규정 접기' : '규정 자세히 보기'
    }
    toggle.addEventListener('click', () => {
      open = !open
      paint()
    })
    paint()
  }

  /* ---- 결제 ------------------------------------------------------------
     실제로는 여기서 일정 마감·가격·당일 여부를 서버에 다시 물어야 합니다. 이 화면에는
     물어볼 곳이 없어 버튼을 잠그는 데까지만 합니다 — 두 번 눌러 두 번 결제되는 일을
     막는 부분은 서버가 있든 없든 똑같이 필요합니다. */
  for (const btn of buttons) {
    btn.addEventListener('click', () => {
      if (btn.disabled) return
      for (const el of buttons) el.disabled = true
      const label = btn.querySelector('.btn__label')
      if (label) label.textContent = '결제 중…'
    })
  }

  render()
  lock()
}
