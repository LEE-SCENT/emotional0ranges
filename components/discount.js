/**
 * 시간제한 할인이 걸린 일정 카드의 마감을 표시하고, 끝나면 정상가로 되돌립니다.
 *
 *   <label class="option-card" data-discount-until="2026-09-02T23:59:59+09:00">
 *     …
 *     <span class="option-card__price"><b>35,000원~</b> <s>45,000원</s></span>
 *     …
 *     <span class="option-card__deadline">
 *       <svg aria-hidden="true"><use href="#icon-scheduleFilled"></use></svg>
 *       <time class="countdown">02:30:24</time>
 *     </span>
 *
 *   import { initDiscounts } from './components/discount.js'
 *   initDiscounts()
 *
 * 표시는 남은 시간에 따라 셋 중 하나입니다.
 *
 *   24 시간 미만   02:30:24 — 초까지 세는 칩. 지금 결정할 일이 됩니다.
 *   24 시간 이상   칩 없음. 할인가와 정가 취소선만 남습니다.
 *   지났을 때      할인가를 정상가로 되돌립니다.
 *
 * 칩은 급하다는 말입니다. 하루 넘게 남은 할인에 칩을 붙이면 급하지 않은 것이
 * 급해 보이고, 목록에서 칩이 붙은 카드와 붙지 않은 카드를 견주는 눈에는 그것이
 * 곧 차이로 읽힙니다. 할인 자체는 가격이 이미 말하고 있습니다 — 할인가와 그 옆의
 * 취소선이면 충분합니다.
 *
 * 마감된 카드에서 태그만 지우고 할인가를 남기면, 그 값으로 신청하려다 결제 화면에서
 * 다른 금액을 보게 됩니다. 둘은 언제나 함께 사라져야 합니다.
 *
 * 이 표시는 시간제한 할인·프로모션에만 씁니다. 상시 할인이나 잔여석 부족은 마감
 * 시각이 없으므로 여기서 다루지 않습니다 — 남은 자리는 카드 오른쪽 아래가 말합니다.
 *
 * 같은 프로모션이 여러 일정에 걸려 있어도 카드마다 제 마감 시각을 읽습니다. 프로모션
 * 하나에 하나의 시계를 두면, 먼저 끝나는 일정과 나중에 끝나는 일정이 같은 숫자를
 * 보게 됩니다.
 *
 * 타이머 하나에 setInterval 하나를 두지 않고 전체를 1 초에 한 번 훑습니다. 카드가
 * 여러 장이면 각자 도는 타이머가 서로 다른 순간에 깨어나 초가 어긋나 보입니다.
 *
 * 초 단위로 바뀌는 글자에는 aria-live 를 걸지 않습니다. 스크린 리더가 1 초마다
 * 읽어 다른 내용을 덮습니다. 남은 시간이 궁금하면 그 자리에서 다시 읽으면 됩니다.
 */

/** 카운트다운으로 바뀌는 경계. */
const DAY_MS = 24 * 60 * 60 * 1000

const pad = (n) => String(n).padStart(2, '0')

/** 남은 밀리초를 HH:MM:SS 로. 24 시간 밑에서만 부르므로 시간 자리는 두 자리입니다. */
function clock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map(pad).join(':')
}

/** <time> 의 datetime 은 기계가 읽는 자리라 ISO 기간으로 적습니다. */
function duration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `PT${Math.floor(s / 3600)}H${Math.floor((s % 3600) / 60)}M${s % 60}S`
}

/**
 * 마감 시각을 읽습니다.
 *
 * data-discount-until 이 실제 값입니다. 정적인 이 화면에는 내려줄 서버가 없어
 * data-discount-in(지금부터 남은 초)도 받습니다 — 어느 날 열어도 세 가지 상태가
 * 그대로 보여야 하기 때문입니다. 실제 서비스에서는 앞의 것만 쓰면 됩니다.
 */
function deadlineOf(el) {
  const until = el.dataset.discountUntil
  if (until) {
    const at = new Date(until)
    return Number.isNaN(at.getTime()) ? null : at
  }
  const left = Number(el.dataset.discountIn)
  return Number.isFinite(left) ? new Date(Date.now() + left * 1000) : null
}

/**
 * 할인이 끝난 카드를 정상가로 되돌립니다.
 *
 * 보이는 값만 고치지 않고 data-discount 도 0 으로 내립니다. 이 카드를 읽어 금액을
 * 세는 쪽(신청·결제 화면)이 있는데, 화면에는 정상가가 적혀 있고 계산에는 할인이
 * 남아 있으면 결제 직전에 두 숫자가 갈립니다.
 *
 * 그리고 끝났다는 것을 알립니다 — 지금 그 일정을 고른 채로 보고 있었다면 요약의
 * 금액도 다시 그려져야 합니다.
 */
function expire(item) {
  item.tag?.remove()
  const was = item.price?.querySelector('s')
  const now = item.price?.querySelector('b')
  if (was && now) {
    now.textContent = was.textContent
    was.remove()
  }
  item.card.dataset.discount = '0'
  item.card.classList.add('is-discount-over')
  item.card.dispatchEvent(new CustomEvent('discount:expired', { bubbles: true }))
}

/** 남은 시간에 맞는 모습으로 고칩니다. 바뀐 것이 없으면 손대지 않습니다. */
function paint(item, left) {
  const soon = left < DAY_MS
  if (item.soon !== soon) {
    item.soon = soon
    // 하루 안쪽으로 들어와야 칩이 붙습니다. 그 전에는 자리도 차지하지 않습니다.
    item.tag.hidden = !soon
  }
  if (!soon) return

  item.text.textContent = clock(left)
  item.text.dateTime = duration(left)
}

export function initDiscounts(scope = document) {
  const items = []

  for (const card of scope.querySelectorAll('[data-discount-until], [data-discount-in]')) {
    const deadline = deadlineOf(card)
    const tag = card.querySelector('.option-card__deadline')
    const text = tag?.querySelector('time')
    if (!deadline || !tag || !text) continue
    items.push({
      card,
      tag,
      text,
      price: card.querySelector('.option-card__price'),
      deadline,
      soon: null,
    })
  }

  if (!items.length) return

  const tick = () => {
    const now = Date.now()
    let running = false
    for (let i = items.length - 1; i >= 0; i -= 1) {
      const item = items[i]
      const left = item.deadline.getTime() - now
      if (left <= 0) {
        expire(item)
        // 끝난 카드는 더 볼 것이 없습니다.
        items.splice(i, 1)
        continue
      }
      paint(item, left)
      running = true
    }
    return running
  }

  tick()

  const id = setInterval(() => {
    // 남은 것이 없으면 더 돌 이유가 없습니다.
    if (!tick()) clearInterval(id)
  }, 1000)
}
