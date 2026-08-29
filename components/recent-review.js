/**
 * 상품 정보의 "최근 게스트 후기"를 후기 목록에서 가져옵니다.
 *
 *   <li class="detail-info__fact" data-latest-review> … </li>
 *   <li class="review__item" data-days-ago="3"> … </li>
 *
 *   import { initRecentReview } from './components/recent-review.js'
 *   initRecentReview()
 *
 * 두 자리에 같은 후기가 나옵니다. 각자 글을 적어두면 언젠가 갈립니다 — 실제로
 * 갈려 있었습니다. 한쪽은 "자리 배치", 다른 쪽은 "자리배치" 였고, 날짜는 7월 31일과
 * 3일 전으로 넉 주가 벌어져 있었습니다. 같은 후기가 화면 두 곳에서 다른 날 쓰인 것이
 * 되어 있었던 겁니다.
 *
 * 그래서 후기 목록을 하나뿐인 출처로 두고, 상품 정보 쪽은 그 첫 항목을 옮겨 적습니다.
 * 고칠 곳이 하나면 갈릴 일이 없습니다.
 *
 * 날짜도 마찬가지입니다. 목록은 "3일 전", 상품 정보는 "2026년 8월 27일" 로 모습이
 * 다르지만 세는 수는 하나(data-days-ago)입니다. 어느 날 열어도 둘이 같은 날을
 * 가리킵니다 — 적어둔 날짜는 하루만 지나도 어긋납니다.
 */

import { todayInSeoul } from './schedule.js'

/** 며칠 전을 실제 날짜로. */
function dayBefore(days) {
  const t = todayInSeoul()
  return new Date(t.y, t.m - 1, t.d - days)
}

const dateText = (at) => `${at.getFullYear()}년 ${at.getMonth() + 1}월 ${at.getDate()}일`

const agoText = (days) => (days === 0 ? '오늘' : `${days}일 전`)

const iso = (at) =>
  `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`

export function initRecentReview(scope = document) {
  const items = [...scope.querySelectorAll('.review__item[data-days-ago]')]
  if (!items.length) return

  for (const item of items) {
    const days = Number(item.dataset.daysAgo)
    if (!Number.isFinite(days)) continue
    const at = dayBefore(days)
    const when = item.querySelector('.review__ago')
    if (when) {
      when.textContent = agoText(days)
      when.dateTime = iso(at)
    }
  }

  /* ---- 상품 정보로 옮겨 적기 ------------------------------------------ */

  const fact = scope.querySelector('[data-latest-review]')
  if (!fact) return

  const first = items[0]
  const body = first.querySelector('.review__body')?.textContent?.trim()
  const days = Number(first.dataset.daysAgo)
  if (!body || !Number.isFinite(days)) return

  const quote = fact.querySelector('[data-latest-review-body]')
  const when = fact.querySelector('[data-latest-review-date]')
  // 목록에는 따옴표가 없습니다. 인용하는 자리에서만 붙입니다.
  if (quote) quote.textContent = `“${body}”`
  if (when) {
    const at = dayBefore(days)
    when.textContent = dateText(at)
    when.dateTime = iso(at)
  }
}
