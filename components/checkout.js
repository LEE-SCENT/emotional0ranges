/**
 * 신청·결제 화면의 계산과 상태를 맞춥니다.
 *
 *   import { initCheckout } from './components/checkout.js'
 *   initCheckout()
 *
 * 하는 일은 다섯입니다.
 *
 *   일정      고른 일정에 따라 요약의 날짜·장소·금액을 다시 씁니다. 상세 화면에서
 *             고르고 온 일정(?schedule=)이 있으면 그것으로 시작합니다.
 *   당일 배너 고른 일정이 오늘이면 환불되지 않는다는 줄을 카드 맨 위에 올립니다.
 *   금액      상품 금액 − 할인 + 추가 옵션. 총액과 버튼 글자는 언제나 같은 수입니다.
 *   동의      필수 동의를 켜야 결제 버튼이 눌립니다.
 *   미리보기  직장 등록 여부에 따라 요약이 달라지는 두 경우를 눈으로 견줍니다.
 *
 * 값은 전부 마크업이 들고 있습니다. 일정 카드에 금액과 날짜가 적혀 있고 여기서는
 * 고른 것을 읽어 더하기만 합니다. 스크립트 안에 금액을 적어두면 화면에 보이는 값과
 * 계산에 쓰이는 값이 서로 다른 곳에 살게 되고, 한쪽만 고쳐지는 날이 옵니다.
 *
 * 총액과 버튼 글자를 각각 계산하지 않고 한 번 구한 수를 두 곳에 넣습니다. 정책에서
 * 둘을 늘 같게 두라는 것은, 다르게 만들 방법이 있으면 언젠가 달라지기 때문입니다.
 */

import { dateOf, isToday, dateText } from './schedule.js'
import { roll } from './roll.js'

const won = (n) => `${n.toLocaleString('ko-KR')}원`

/** 굴릴 것은 숫자뿐입니다. "원"과 그 뒤 글자는 그대로 둡니다. */
const digits = (n) => n.toLocaleString('ko-KR')

export function initCheckout(scope = document) {
  const root = scope.querySelector('.checkout')
  if (!root) return

  const summary = root.querySelector('.summary-card')
  const options = [...scope.querySelectorAll('[name="schedule"]')]
  if (!summary || !options.length) return

  /**
   * 당일 환불 불가 띠. 요약 카드와 시트에 하나씩 있습니다.
   *
   * 요약 쪽은 적용된 일정을, 시트 쪽은 지금 고르고 있는 일정을 따릅니다 — 시트에서
   * 오늘 일정에 손을 얹는 순간 알아야 하지, 적용하고 나서 알면 늦습니다.
   */
  const summaryBanner = summary.querySelector('[data-today-banner]')
  const when = summary.querySelector('.summary-card__when')
  const where = summary.querySelector('.summary-card__where')
  const extra = summary.querySelector('[data-extra-option]')
  const price = summary.querySelector('.summary-card__price')
  const agree = scope.querySelector('[data-agree]')
  const agreeRow = scope.querySelector('.checkout__agree')
  const terms = scope.querySelector('.checkout__terms')
  const toggle = scope.querySelector('.checkout__terms-toggle')
  const buttons = [...scope.querySelectorAll('[data-pay]')]

  /** 지금 결제될 금액. render 가 구하고 lock 이 버튼에 적습니다. */
  let due = 0

  /**
   * 지금 적용된 일정. 시트 안에서 고른 것과 다릅니다 — 고르는 것과 바꾸는 것을
   * 갈라두어야 "고르기만 하고 닫으면 그대로"가 성립합니다.
   */
  let applied = options.find((el) => el.checked)?.value ?? options[0]?.value

  const sheet = scope.querySelector('#schedule-sheet')
  const apply = scope.querySelector('[data-apply-schedule]')

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
    const card = options.find((el) => el.value === applied)?.closest('.option-card')
    if (!card) return

    const at = dateOf(card)

    /* ---- 일정 --------------------------------------------------------- */
    if (at && when) when.textContent = `${dateText(at)} ${card.dataset.time || ''}`.trim()
    if (where) where.textContent = card.dataset.where || ''

    /* ---- 당일 배너 ----------------------------------------------------
       일정을 바꿀 때마다 다시 판단합니다. 한 번 붙인 뒤 그대로 두면, 당일 일정에서
       다른 날로 옮긴 사람이 환불되지 않는다는 말을 계속 보게 됩니다. */
    if (summaryBanner) summaryBanner.hidden = !(at && isToday(at))

    /* ---- 금액 ---------------------------------------------------------- */
    const base = Number(card.dataset.price) || 0
    const off = Number(card.dataset.discount) || 0
    const add = extra?.checked ? Number(extra.dataset.extraOption) || 0 : 0
    const total = base - off + add

    setRow('base', won(base), true)
    setRow('discount', `-${won(off)}`, off > 0)
    setRow('extra', `+${won(add)}`, add > 0)
    setRow('total', won(total), true)

    due = total
    lock()
  }

  /**
   * 동의 여부에 따라 버튼을 잠그고 글자를 정합니다.
   *
   * 잠긴 동안에는 금액을 적지 않습니다. 버튼의 금액은 "이 값이 지금 빠져나간다"는
   * 말인데, 눌리지 않는 버튼에 적혀 있으면 무엇을 말하는지 알 수 없습니다. 동의를
   * 마쳐 실제로 결제할 수 있게 된 순간에 금액이 붙습니다.
   *
   * 금액은 render 가 구해둔 값을 그대로 씁니다 — 총액과 버튼이 같은 수여야 한다는
   * 것은, 두 번 계산할 방법을 남겨두지 않는 것으로 지킵니다.
   */
  const lock = () => {
    const ok = !!agree?.checked
    for (const btn of buttons) {
      btn.disabled = !ok
      // 굴러가는 칸에는 0~9 가 세 벌씩 들어 있습니다. 화면을 읽어주는 쪽에는 그
      // 서른 글자가 아니라 지금 값 하나가 가야 합니다.
      btn.setAttribute('aria-label', ok ? `${won(due)} 결제하기` : '결제하기')
      const amount = btn.querySelector('[data-amount]')
      if (!amount) continue
      // 잠겨 있는 동안에는 금액 자리를 비웁니다. 굴릴 것도 없습니다.
      if (!ok) {
        amount.replaceChildren()
        amount.nextSibling && (amount.nextSibling.textContent = '결제하기')
        continue
      }
      roll(amount, digits(due))
      if (amount.nextSibling) amount.nextSibling.textContent = '원 결제하기'
    }
  }

  /* ---- 상세에서 고르고 온 일정 -----------------------------------------
     ?schedule=s2 처럼 붙어 옵니다. 상세 화면에서 고른 일정 그대로 시작해야, 여기서
     한 번 더 고르게 하지 않습니다. 목록에 없는 값이면 마크업의 기본 선택을 둡니다. */
  const wanted = new URLSearchParams(location.search).get('schedule')
  if (wanted && options.some((el) => el.value === wanted)) applied = wanted
  for (const el of options) el.checked = el.value === applied

  extra?.addEventListener('change', render)
  agree?.addEventListener('change', lock)

  // 보고 있는 사이에 시간제한 할인이 끝날 수 있습니다. 카드가 정상가로 돌아가면
  // 요약의 금액도 같이 돌아가야 합니다 — 둘이 갈린 채로 결제 버튼을 누르게 두면
  // 안 됩니다.
  scope.addEventListener('discount:expired', render)

  /* ---- 일정 변경 --------------------------------------------------------
     시트 안에서 고르는 것은 아직 정해진 것이 아닙니다. 테두리만 옮겨 다니고,
     아래 버튼을 눌러야 적용됩니다 — 목록을 훑다 손이 스친 카드로 금액이 바뀌어
     있으면, 무엇을 결제하는지 다시 확인해야 합니다.

     지금 일정 그대로면 버튼은 잠겨 있습니다. 아무것도 달라지지 않는 버튼이
     눌리면 눌러본 사람은 무슨 일이 있었는지 알 수 없습니다. */

  const draft = () => options.find((el) => el.checked)?.value ?? applied

  const sheetBanner = sheet?.querySelector('[data-today-banner]')

  /** 고르고 있는 일정이 오늘인지. 시트 안의 띠는 이것만 봅니다. */
  const paintSheetBanner = () => {
    if (!sheetBanner) return
    const card = options.find((el) => el.value === draft())?.closest('.option-card')
    const at = card && dateOf(card)
    sheetBanner.hidden = !(at && isToday(at))
  }

  const markDraft = () => {
    if (apply) apply.disabled = draft() === applied
    paintSheetBanner()
  }

  for (const el of options) el.addEventListener('change', markDraft)

  apply?.addEventListener('click', () => {
    if (apply.disabled) return
    const next = draft()
    if (next === applied) return
    applied = next

    // 날짜가 달라지면 환불 조건도 달라집니다. 이전 일정 기준으로 읽고 누른 동의를
    // 그대로 들고 가면, 동의한 적 없는 조건에 동의한 것이 됩니다.
    if (agree?.checked) {
      agree.checked = false
      agree.dispatchEvent(new Event('change', { bubbles: true }))
    }

    render()
    sheet?.close()
  })

  /* ---- 시트에는 신청 가능한 일정만 -------------------------------------
     대기·마감은 여기서 뺍니다. 고르는 자리에 고를 수 없는 것이 섞여 있으면, 눌러본
     뒤에야 안 된다는 것을 알게 됩니다. 대기는 상세 화면의 그 일정에서 따로 겁니다.

     상세 화면의 목록은 그대로입니다 — 거기서는 대기 가능도 보여주어야 대기를 걸
     수 있습니다. 감추는 것은 이 화면의 변경 목록뿐입니다. */

  const bookable = (el) => {
    const card = el.closest('.option-card')
    return (
      !card.classList.contains('option-card--wait') &&
      !card.classList.contains('option-card--soldout')
    )
  }

  if (sheet) {
    for (const el of sheet.querySelectorAll('[name="schedule"]')) {
      if (bookable(el)) continue
      el.disabled = true
      const item = el.closest('li')
      if (item) item.hidden = true
    }
    // 한 항목도 남지 않은 날짜는 머리글만 남습니다.
    for (const group of sheet.querySelectorAll('.schedule__group')) {
      const alive = [...group.querySelectorAll('li')].some((li) => !li.hidden)
      group.hidden = !alive
    }
    const empty = sheet.querySelector('.schedule__empty')
    const none = ![...sheet.querySelectorAll('[name="schedule"]')].some(bookable)
    if (empty) empty.hidden = !none
    if (none && apply) apply.hidden = true
  }

  /* 시트를 그냥 닫으면 고르던 것은 없던 일이 됩니다. 열 때마다 지금 일정에서
     다시 시작하고, 그 카드가 보이는 자리로 목록을 옮겨둡니다 — 다섯 번째 일정을
     쓰고 있는데 목록이 첫 줄에서 시작하면 지금 무엇이 골라져 있는지 안 보입니다. */
  const syncSheet = () => {
    for (const el of options) el.checked = el.value === applied
    markDraft()
    options
      .find((el) => el.value === applied)
      ?.closest('.option-card')
      ?.scrollIntoView({ block: 'center' })
  }

  if (sheet) {
    new MutationObserver(() => {
      if (sheet.open) syncSheet()
    }).observe(sheet, { attributes: true, attributeFilter: ['open'] })
    sheet.addEventListener('close', syncSheet)
  }

  /* ---- 미리보기 전환 ----------------------------------------------------
     이 화면에만 있습니다. 실제로는 회원의 직장 등록 여부가 상태를 정합니다.

     미등록으로 바꾸면 유료 옵션이 사라지므로 선택도 함께 풀어야 합니다. 보이지 않는
     체크가 남아 총액에 10,000 이 얹혀 있으면 어디서 온 돈인지 알 길이 없습니다. */
  const cases = [...scope.querySelectorAll('[data-case]')]
  for (const btn of cases) {
    btn.addEventListener('click', () => {
      const name = btn.dataset.case
      summary.dataset.workplace = name
      for (const el of cases) {
        const on = el === btn
        // 고른 쪽은 채운 버튼, 나머지는 테두리만. outlined 의 is-on 은 글자를 흰색으로
        // 바꾸는데 배경은 그대로 흰색이라 이 자리에서는 글자가 사라집니다.
        el.classList.toggle('btn--filled', on)
        el.classList.toggle('btn--outlined', !on)
        el.setAttribute('aria-pressed', String(on))
      }
      if (name !== 'verified' && extra) extra.checked = false
      render()
    })
  }

  /* ---- 규정 펼치기 ------------------------------------------------------
     마크업에는 펼쳐진 채로 들어 있고 여기서 접습니다. 반대로 하면 스크립트가 오지
     않았을 때 규정을 읽을 방법이 없습니다. */
  if (agreeRow && terms && toggle) {
    let open = false
    const paint = () => {
      agreeRow.classList.toggle('is-collapsed', !open)
      toggle.setAttribute('aria-expanded', String(open))
      // 화살표만 있는 버튼이라 이름은 aria-label 이 전합니다. 방향이 바뀌는 것은
      // 눈으로만 알 수 있고, 화면을 읽어주는 쪽에는 이 글자가 전부입니다.
      toggle.setAttribute('aria-label', open ? '규정 접기' : '규정 자세히 보기')
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
}
