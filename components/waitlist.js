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
 *
 * 묻는 창에서 확인을 눌렀다고 그 일이 된 것은 아닙니다. 어긋날 수 있습니다.
 *
 *   신청 실패   네트워크·서버 오류. 아무것도 달라지지 않았으니 그대로 두고 알리기만
 *               합니다 — 다시 누르면 됩니다.
 *   신청 마감   그 사이에 그 일정의 대기가 닫혔습니다. 이건 다시 눌러도 같은 결과라,
 *               카드를 마감으로 돌리고 선택을 다음 일정으로 옮깁니다.
 *   취소 실패   같은 네트워크·서버 오류. 대기는 걸린 채로 남습니다 — 취소된 것처럼
 *               보였다가 되살아나면 어느 쪽이 사실인지 알 수 없습니다.
 *
 * 취소에는 "마감" 짝이 없습니다. 대기가 닫히는 것은 새로 걸 수 없다는 뜻이지, 이미
 * 걸어둔 순서를 놓을 수 없다는 뜻이 아닙니다.
 */

import { stampScheduleLinks } from './schedule.js'
import { showToast } from './toast.js'

const LABEL = {
  apply: '신청하기',
  wait: '대기 신청하기',
  cancel: '대기 취소',
}

const ERROR = {
  apply: '대기 신청에 실패했어요. 잠시 후 다시 시도해 주세요.',
  closed: '대기 신청이 마감되었어요. 다른 일정을 확인해 주세요.',
  cancel: '대기 취소에 실패했어요. 잠시 후 다시 시도해 주세요.',
}

const warn = (text) => showToast(text, { icon: '#icon-error', tone: 'critical' })

/* 어긋나는 순간은 서버가 만듭니다. 이 프로토타입에는 서버가 없어 주소로 흉내 냅니다 —
   detail.html?waitlist=fail · =closed · =cancel-fail

   취소 실패를 따로 둔 것은, 신청이 늘 실패하면 취소할 대기 자체가 생기지 않기
   때문입니다. cancel-fail 에서는 신청은 되고 취소만 어긋납니다. */
const trouble = () => new URLSearchParams(location.search).get('waitlist')

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

  /**
   * 대기가 닫힌 카드. 목록에서 지우지 않고 마감으로 돌립니다 — 그 시간대가 있었다는
   * 사실은 남아야 다음 일정을 고를 때 판단이 됩니다. 다시 고를 수는 없습니다.
   */
  const closeWait = (el) => {
    const card = cardOf(el)
    const seats = card?.querySelector('.option-card__seats')
    const label = seats && labelNode(seats)
    if (!card || !label) return
    card.classList.remove('option-card--wait')
    card.classList.add('option-card--soldout')
    label.textContent = '대기 마감'
    el.checked = false
    el.disabled = true
  }

  /**
   * 고를 수 있는 첫 일정으로 선택을 옮깁니다. 아무것도 고르지 않은 채로 두면 CTA 가
   * 어느 일정을 가리키는지 알 수 없는데, 그 버튼은 결제 화면으로 갑니다.
   *
   * change 를 함께 올립니다 — 가격·안내 띠를 그리는 쪽들이 그 사건을 듣고 있습니다.
   */
  const pickNext = (from) => {
    const next = options.find((el) => el !== from && !el.disabled)
    if (!next) return
    next.checked = true
    next.dispatchEvent(new Event('change', { bubbles: true }))
  }

  for (const el of options) el.addEventListener('change', paint)

  document.addEventListener('confirm:accept', (e) => {
    const id = e.target.id
    const el = picked()
    if (!el) return
    if (id === 'waitlist-apply') {
      const wrong = trouble()
      if (wrong === 'fail') {
        // 달라진 것이 없습니다. 카드도 CTA 도 그대로라 그 자리에서 다시 누릅니다.
        warn(ERROR.apply)
        return
      }
      if (wrong === 'closed') {
        closeWait(el)
        pickNext(el)
        warn(ERROR.closed)
        paint()
        return
      }
      waiting = el.value
      mark(el, true)
    } else if (id === 'waitlist-cancel') {
      if (trouble() === 'cancel-fail') {
        // 대기는 걸린 채로 남습니다. 카드도 CTA(대기 취소)도 그대로입니다.
        warn(ERROR.cancel)
        return
      }
      mark(el, false)
      waiting = null
    } else {
      return
    }
    paint()
  })

  paint()
}
