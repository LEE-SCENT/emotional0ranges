/**
 * 찾기 화면의 목록 — 고른 조건에 맞는 회차를 격자로 그립니다.
 *
 *   import { initFind } from './components/find.js'
 *   initFind()
 *
 * 카드 한 장은 상품이 아니라 **일정 하나**입니다. 9월 5일 저녁 7시 서울 강남에서 열리는
 * 티키타카 한 회차가 한 장입니다. 홈의 카드가 상품 하나를 대표 일정으로 말하는 것과
 * 다릅니다 — 여기는 날짜·지역으로 걸러 고르는 자리라, 상품 단위로 두면 고른 날짜가
 * 아닌 회차까지 딸려 있는 카드가 남습니다(policy.html: 찾기 화면).
 *
 * 조건은 find-bar.js 가 들고 있고 `find:change` 로 넘어옵니다. 이 파일은 거른 다음
 * 차례를 정해 그리는 일만 합니다.
 *
 * 무엇을 카드에 적을지는 policy.html 을 따릅니다 — 태그 노출 조건과 가격 표기는 홈
 * 목록과 같은 규칙이고, 값이 대표 일정이 아니라 그 회차에서 나오는 것만 다릅니다.
 */

import { openMeetups, areaOf, cityOf, regionOf, seatTags } from './products.js'
import { dateAfter, dateKey, dayText } from './schedule.js'

const won = (n) => `${n.toLocaleString('ko-KR')}원`

/**
 * 지금 보고 있는 사람의 나이.
 *
 * ⚠️ 로그인한 회원 정보가 들어올 자리입니다. 지금은 값을 하나 박아두었습니다.
 *    계정이 없으면 걸 조건이 없으므로 "내 나이" 알약은 화면에서 지웁니다 — 눌러도
 *    아무것도 걸러지지 않는 알약을 남겨두면 조건이 걸린 줄 알고 목록을 믿게 됩니다.
 */
export const ME = { age: 33 }

/** `27-38세` 안에 그 나이가 드는지. */
function fitsAge(range, age) {
  const [, low, high] = range.match(/(\d+)\s*-\s*(\d+)/) ?? []
  if (!low) return true
  return age >= Number(low) && age <= Number(high)
}

/** 한 성별에 두 자리 이상 남았는지 — 친구와 나란히 신청할 수 있는 회차입니다. */
const hasPair = (o) => Object.values(o.seats ?? {}).some((n) => n >= 2)

/** 자리가 급한 회차인지. 목록의 잔여석 태그가 붙는 기준과 같습니다(1~2자리). */
const isClosing = (o) => seatTags(o).some((t) => !t.closed)

/** 남은 자리를 다 더한 수. "마감 임박 순"이 이것을 오름차순으로 봅니다. */
const seatsLeft = (o) => Object.values(o.seats ?? {}).reduce((sum, n) => sum + n, 0)

const PICKS = {
  // 시간이 걸린 할인이 아니라, 할인이 걸려 있다는 사실만 봅니다.
  promo: (o) => (o.off ?? 0) > 0,
  closing: (o) => isClosing(o),
  myage: (o) => (ME ? fitsAge(o.age, ME.age) : true),
  // "친구 동반" 은 남은자리 조건과 같은 것을 말합니다(find-bar.js: syncFriend).
  // 그쪽에서 이미 걸러지므로 여기서는 통과시킵니다.
  friend: () => true,
}

const SORTS = {
  soon: (a, b) => a.s.in - b.s.in || net(a.s) - net(b.s),
  price: (a, b) => net(a.s) - net(b.s) || a.s.in - b.s.in,
  urgent: (a, b) => seatsLeft(a.s) - seatsLeft(b.s) || a.s.in - b.s.in,
}

const net = (o) => o.price - (o.off ?? 0)

function matches(m, cond) {
  if (cond.areas.length) {
    /* 고른 것은 동네 이름이거나, 도시 이름이거나, 큰 갈래입니다 — "서울"을 고르면
       서울 안의 동네가 모두, 탭 안의 "어디서든"(수도권·비수도권)을 고르면 그 묶음이
       통째로 걸립니다(products.js: cityOf · regionOf). */
    const area = areaOf(m.s.place)
    if (!cond.areas.some((a) => a === area || a === cityOf(area) || a === regionOf(area))) return false
  }
  if (cond.kinds.length && !cond.kinds.includes(m.slug)) return false
  if (cond.dates.length) {
    // 담긴 것 중 어느 하나에라도 걸리면 통과입니다(find-bar.js: OR).
    const day = dateKey(dateAfter(m.s.in))
    if (!cond.dates.some((d) => day >= d.from && day <= d.to)) return false
  }
  if (cond.seats === 'two' && !hasPair(m.s)) return false
  return cond.picks.every((pick) => PICKS[pick]?.(m.s) ?? true)
}

/**
 * 카드 한 장.
 *
 * 태그는 policy.html 의 "Tag 노출 조건" 그대로입니다 — 전용 상품이면 상시 태그가
 * 먼저, 그 다음 날짜·시각, 그 다음 급한 차례의 잔여석입니다. 다른 것은 하나뿐입니다:
 * 여기서는 값이 대표 일정이 아니라 이 회차에서 나옵니다.
 *
 * 가격에 `~` 를 붙이지 않는 것도 그래서입니다. 상품 카드는 여러 일정의 최저가를
 * 말하지만 이 카드는 그 회차의 값 하나를 말합니다 — `~` 를 붙이면 더 싼 것이 어딘가
 * 있다는 뜻이 됩니다. 기존가는 여전히 적지 않습니다.
 */
function card({ slug, product, s, photo }) {
  const seats = seatTags(s)
  const tags = []
  if (product.locked) {
    tags.push(
      '<span class="tag tag--black"><svg aria-hidden="true"><use href="#icon-memberBlack"></use></svg>블랙회원 전용</span>',
    )
  }
  tags.push(`<span class="tag">${dayText(dateAfter(s.in))} ${s.label}</span>`)
  for (const t of seats) {
    tags.push(`<span class="tag ${t.closed ? 'tag--accent-sec' : 'tag--accent-pri'}">${t.text}</span>`)
  }

  const price = product.locked
    ? product.locked
    : s.off
      ? `<b>할인가</b> ${won(net(s))}`
      : won(s.price)

  return `<article class="product-card${product.locked ? ' is-locked' : ''}">
      <div class="product-card__media">
        <img src="${photo.src}" alt="" loading="lazy">
        <div class="product-card__tags">${tags.join('')}</div>
        <p class="product-card__status">${seats
          .map((t) => `<span class="${t.closed ? 'is-closed' : 'is-remaining'}">${t.text}</span>`)
          .join('')}</p>
      </div>
      <div class="product-card__info">
        <h3 class="product-card__title">
          <a href="./detail.html?product=${slug}&amp;schedule=${s.v}">${product.title}</a>
        </h3>
        <p class="product-card__desc">${s.place} · ${s.age}</p>
        <p class="product-card__price">${price}</p>
      </div>
    </article>`
}

export function initFind(root = document.querySelector('[data-find]')) {
  const grid = document.querySelector('[data-find-grid]')
  const count = document.querySelector('[data-find-count]')
  const empty = document.querySelector('[data-find-empty]')
  if (!root || !grid) return

  if (!ME) document.querySelector('[data-find-pick="myage"]')?.remove()

  const meetups = openMeetups()

  function render(cond) {
    const list = meetups.filter((m) => matches(m, cond)).sort(SORTS[cond.sort] ?? SORTS.soon)

    grid.innerHTML = list.map(card).join('')
    if (count) count.textContent = String(list.length)
    // 격자와 안내는 함께 뒤바뀝니다. 빈 격자를 남겨두면 안내 아래에 빈 자리가 남습니다.
    grid.hidden = list.length === 0
    if (empty) empty.hidden = list.length > 0
  }

  root.addEventListener('find:change', (e) => render(e.detail))

  /* 빈 목록의 "조건 모두 지우기". 조건을 들고 있는 것은 find-bar 라 이 자리에서
     직접 지우지 않고, 그쪽이 듣고 있는 신호를 올립니다 — 지우는 규칙이 두 곳에
     있으면 한쪽만 고쳐지는 날이 옵니다. */
  empty?.addEventListener('click', (e) => {
    if (!e.target.closest('[data-find-clear-all]')) return
    document.dispatchEvent(new CustomEvent('find:clear'))
  })
}
