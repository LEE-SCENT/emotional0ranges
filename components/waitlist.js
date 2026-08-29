/**
 * 대기 가능한 일정을 고르면 신청이 아니라 대기가 되도록 합니다.
 *
 *   import { initWaitlist } from './components/waitlist.js'
 *   initWaitlist()
 *
 * 일정 목록의 버튼 하나가 세 가지 일을 합니다.
 *
 *   보통 일정        신청하기 — 결제 화면으로 갑니다.
 *   대기 가능        대기 신청하기 — 묻는 창을 띄웁니다. 결제하지 않습니다.
 *   대기 신청 완료   대기 취소 — 묻는 창을 띄웁니다.
 *
 * 버튼을 세 개 두고 감췄다 보였다 하지 않는 것은, 그 자리에 있는 것이 언제나 "지금
 * 고른 일정으로 할 수 있는 일" 하나여야 하기 때문입니다. 무엇을 하는 버튼인지는
 * 고른 일정이 정합니다.
 *
 * 대기 신청은 자리를 잡아주지 않습니다. 그래서 신청을 마쳐도 카드는 선택된 채로
 * 남고, 잔여석 자리의 글자만 "대기 신청 완료"로 바뀝니다 — 참여가 확정된 것처럼
 * 보이는 표시를 여기에 두면 안 됩니다.
 */

import { stampScheduleLinks } from './schedule.js'

const LABEL = {
  apply: '신청하기',
  wait: '대기 신청하기',
  cancel: '대기 취소',
}

export function initWaitlist(scope = document) {
  const actions = scope.querySelector('.schedule__actions')
  const link = actions?.querySelector('a.btn')
  const options = [...scope.querySelectorAll('[name="schedule"]')]
  if (!actions || !link || !options.length) return

  /** 대기를 걸어둔 일정. 이 화면에서는 하나만 걸 수 있습니다. */
  let waiting = null

  const cardOf = (el) => el.closest('.option-card')
  const picked = () => options.find((el) => el.checked)
  const isWait = (el) => cardOf(el)?.classList.contains('option-card--wait')

  /** 지금 고른 일정으로 할 수 있는 일. */
  const mode = () => {
    const el = picked()
    if (!el) return 'apply'
    if (waiting && el.value === waiting) return 'cancel'
    return isWait(el) ? 'wait' : 'apply'
  }

  const paint = () => {
    const now = mode()
    const label = link.querySelector('.btn__label')
    if (label) label.textContent = LABEL[now]

    // 대기는 결제 화면으로 가지 않습니다. 링크를 그대로 두면 새 탭으로 열어 결제
    // 화면에 닿을 수 있는데, 그 화면에는 이 일정이 아예 없습니다.
    if (now === 'apply') {
      link.removeAttribute('data-confirm-open')
      link.removeAttribute('role')
      if (!link.hasAttribute('href')) {
        link.setAttribute('href', link.dataset.href || './checkout.html')
        // 어느 일정인지는 schedule 쪽이 붙입니다. 여기서 다시 계산하면 같은 규칙이
        // 두 곳에 살게 됩니다.
        stampScheduleLinks(scope)
      }
    } else {
      // 돌아올 때 쓸 주소만 남기고 뺍니다. 일정은 붙어 있지 않은 맨 주소입니다.
      const href = link.getAttribute('href')
      if (href) link.dataset.href = href.split('?')[0]
      link.removeAttribute('href')
      link.setAttribute('role', 'button')
      link.setAttribute('data-confirm-open', now === 'wait' ? 'waitlist-apply' : 'waitlist-cancel')
    }
  }

  /**
   * 대기 상태를 카드에 씁니다.
   *
   * textContent 로 통째로 갈아끼우지 않습니다. 그 자리에는 상태 아이콘이 함께 들어
   * 있어서, 글자만 바꾼다는 것이 아이콘까지 지우는 일이 됩니다 — 실제로 지워졌습니다.
   * 글자가 들어 있는 텍스트 노드만 찾아 그것만 고칩니다.
   */
  const labelNode = (seats) =>
    [...seats.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim())

  const mark = (el, on) => {
    const card = cardOf(el)
    const seats = card?.querySelector('.option-card__seats')
    const label = seats && labelNode(seats)
    if (!card || !label) return
    card.classList.toggle('option-card--waiting', on)
    if (on) {
      seats.dataset.seats = seats.dataset.seats || label.textContent
      label.textContent = '대기 신청 완료'
    } else if (seats.dataset.seats) {
      label.textContent = seats.dataset.seats
    }
  }

  for (const el of options) el.addEventListener('change', paint)

  document.addEventListener('confirm:accept', (e) => {
    const id = e.target.id
    const el = picked()
    if (!el) return
    if (id === 'waitlist-apply') {
      waiting = el.value
      mark(el, true)
    } else if (id === 'waitlist-cancel') {
      mark(el, false)
      waiting = null
    } else {
      return
    }
    paint()
  })

  paint()
}
