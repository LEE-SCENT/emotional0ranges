/**
 * 목록의 상품 카드를 상품 데이터로 채웁니다.
 *
 *   <article class="product-card">
 *     <div class="product-card__media">
 *       <div class="product-card__tags"> 날짜 · 잔여석 </div>
 *       <p class="product-card__status"> 잔여석 </p>
 *     <div class="product-card__info">
 *       <h3 class="product-card__title"><a href="./detail.html?product=tikitaka"> … </a></h3>
 *       <p class="product-card__desc">   지역 · 일정 수 </p>
 *       <p class="product-card__price">  최저가 </p>
 *
 *   import { initProductCards } from './components/product-cards.js'
 *   initProductCards()
 *
 * 어느 상품인지는 제목의 링크가 알려줍니다 — 카드에 따로 적어두면 링크와 내용이
 * 어긋날 수 있고, 그때는 목록에서 본 것과 들어가서 보는 것이 다른 모임이 됩니다.
 *
 * 날짜·잔여석·가격을 마크업에 적어두지 않는 이유는 상세 화면과 같습니다. 적어둔
 * 날짜는 하루만 지나도 지난 날이 되고, 적어둔 잔여석은 상세에서 세는 것과 어긋납니다 —
 * 실제로 목록에는 닷새 전 날짜와 상세에 없는 잔여석이 남아 있었습니다.
 *
 * 데이터에 없는 상품(아직 준비 중인 카드)은 마크업에 적힌 것을 그대로 둡니다.
 *
 * 무엇을 언제 보여줄지는 policy.html 이 정합니다 — 대표 일정, Tag 노출 조건, 장소·일정
 * 문구, 가격. 이 파일은 그것을 옮긴 것이므로, 규칙이 바뀌면 그 문서가 먼저입니다.
 */

import { PRODUCTS, isOpen, seatTags } from './products.js'
import { dateAfter, dayText } from './schedule.js'

const won = (n) => `${n.toLocaleString('ko-KR')}원`

/** 카드가 가리키는 상품. 제목 링크의 ?product= 가 곧 이름입니다. */
function slugOf(card) {
  const href = card.querySelector('.product-card__title a')?.getAttribute('href')
  if (!href) return null
  return new URL(href, location.href).searchParams.get('product')
}

/**
 * 카드가 대신 말하는 일정 하나 — 신청할 수 있는 것 중 가장 가까운 일정입니다.
 *
 * 카드에 적히는 날짜와 잔여석은 모두 여기서 나옵니다. 여러 일정에서 하나씩 골라
 * 섞으면, 이 날짜를 보고 저 일정의 자리를 믿게 됩니다(policy.html: 대표 일정).
 */
const represents = (schedule) =>
  [...schedule].filter(isOpen).sort((a, b) => a.in - b.in)[0] ?? null

/**
 * 일정이 열리는 자리에서 지역만.
 *
 * 자리에는 특집 이름이 함께 적히기도 합니다("서울 한남 · 생활운동인 특집"). 목록에서
 * 세는 것은 지역이므로 가운뎃점 앞까지만 봅니다.
 */
const areaOf = (s) => s.place.split(' · ')[0]

/**
 * 지역과 일정 수 한 줄. policy.html 의 "장소 · 일정 문구"를 그대로 옮겼습니다.
 *
 *   한 곳    서울 강남
 *   두 곳    서울 강남 · 수원 광교      — 둘까지는 이름을 다 부릅니다.
 *   세 곳~   서울 강남 외 4개 지역      — 그 위로는 세어서 줄입니다.
 *
 * 일정이 하나뿐이면 개수를 적지 않습니다. "일정 1개"는 세어줄 것이 없다는 말입니다.
 */
function placeText(schedule) {
  const areas = [...new Set(schedule.map(areaOf))]
  const where =
    areas.length <= 2 ? areas.join(' · ') : `${areas[0]} 외 ${areas.length - 1}개 지역`
  return schedule.length > 1 ? `${where} · 일정 ${schedule.length}개` : where
}

const el = (tag, className, text) => {
  const node = document.createElement(tag)
  node.className = className
  node.textContent = text
  return node
}

function fill(card, product) {
  const schedule = product.schedule ?? []
  if (!schedule.length) return
  const next = represents(schedule)
  const seats = next ? seatTags(next) : []

  const tags = card.querySelector('.product-card__tags')
  if (tags) {
    // 일정과 잔여석은 다시 그립니다 — 마크업에 남아 있던 것이 지워지지 않으면 새로
    // 그린 것 옆에 옛 숫자가 그대로 붙어 있습니다. 전용 태그(블랙회원 전용)만은
    // 남깁니다. 그것은 일정마다 달라지는 현황이 아니라 이 상품의 조건이라 늘 붙어
    // 있어야 하고(policy.html), 아이콘까지 달고 있어 마크업이 들고 있는 편이 낫습니다.
    for (const old of tags.querySelectorAll('.tag:not(.tag--black)')) old.remove()
    // 신청할 수 있는 일정이 하나도 없으면 날짜 자리를 이 말이 대신합니다.
    if (!next) tags.append(el('span', 'tag', '모든 일정 마감'))
    else {
      tags.append(el('span', 'tag', `${dayText(dateAfter(next.in))} ${next.label}`))
      for (const s of seats) {
        tags.append(el('span', `tag ${s.closed ? 'tag--accent-sec' : 'tag--accent-pri'}`, s.text))
      }
    }
  }

  // 좁은 화면에서 태그 대신 나오는 사진 아래 띠입니다. 같은 것을 말하므로 같은
  // 기준으로 그립니다 — 어느 폭에서 보든 카드가 같은 말을 해야 합니다.
  const status = card.querySelector('.product-card__status')
  if (status) {
    status.textContent = ''
    for (const s of seats) status.append(el('span', s.closed ? 'is-closed' : 'is-remaining', s.text))
  }

  const desc = card.querySelector('.product-card__desc')
  if (desc) desc.textContent = placeText(schedule)

  // 값이 여럿이면 가장 싼 것을 앞세우고 "~"로 그 위가 있다는 것을 알립니다.
  // 기존가는 적지 않습니다 — 목록에서 두 값을 나란히 두면 비교로 읽힙니다.
  const price = card.querySelector('.product-card__price')
  if (price && product.locked) price.textContent = product.locked
  else if (price) {
    const cheapest = schedule.reduce(
      (low, s) => Math.min(low, s.price - (s.off ?? 0)),
      Infinity,
    )
    const discounted = schedule.some((s) => s.price - (s.off ?? 0) === cheapest && s.off > 0)
    price.textContent = ''
    if (discounted) {
      const badge = document.createElement('b')
      badge.textContent = '할인가'
      price.append(badge, ' ')
    }
    price.append(`${won(cheapest)}~`)
  }
}

export function initProductCards(scope = document) {
  // 카테고리 카드는 상품 하나가 아니라 갈래를 가리킵니다 — 거기 적힌 "모임 3개"는
  // 이 상품의 일정 수가 아니므로 건드리지 않습니다.
  for (const card of scope.querySelectorAll('.product-card:not(.product-card--category)')) {
    if (card.dataset.cardReady) continue
    const product = PRODUCTS[slugOf(card)]
    if (!product) continue
    card.dataset.cardReady = '1'
    fill(card, product)
  }
}
