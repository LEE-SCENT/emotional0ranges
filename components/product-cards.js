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
 */

import { PRODUCTS } from './products.js'
import { dateAfter, dayText } from './schedule.js'

const won = (n) => `${n.toLocaleString('ko-KR')}원`

/** 카드가 가리키는 상품. 제목 링크의 ?product= 가 곧 이름입니다. */
function slugOf(card) {
  const href = card.querySelector('.product-card__title a')?.getAttribute('href')
  if (!href) return null
  return new URL(href, location.href).searchParams.get('product')
}

/** 목록이 말하는 "다음 일정" — 가장 이른 것 하나입니다. */
const soonest = (schedule) => [...schedule].sort((a, b) => a.in - b.in)[0]

/**
 * 일정이 열리는 자리에서 지역만.
 *
 * 자리에는 특집 이름이 함께 적히기도 합니다("서울 한남 · 생활운동인 특집"). 목록에서
 * 세는 것은 지역이므로 가운뎃점 앞까지만 봅니다.
 */
const areaOf = (s) => s.place.split(' · ')[0]

/**
 * 지역 한 줄: 여는 곳이 여럿이면 다음 일정의 자리와 나머지 수를 함께 적습니다.
 * 한 곳뿐이면 "외 0개 지역"이 될 자리라 그 말을 빼둡니다.
 */
function areaText(schedule, next) {
  const rest = new Set(schedule.map(areaOf)).size - 1
  return rest > 0 ? `${areaOf(next)} 외 ${rest}개 지역` : areaOf(next)
}

function fill(card, product) {
  const schedule = product.schedule ?? []
  if (!schedule.length) return
  const next = soonest(schedule)

  const tags = card.querySelector('.product-card__tags')
  if (tags) {
    // 태그는 다시 그립니다. 마크업에 남아 있던 잔여석 태그가 지워지지 않으면 새로
    // 그린 것 옆에 옛 숫자가 그대로 붙어 있습니다.
    tags.textContent = ''
    const when = document.createElement('span')
    when.className = 'tag'
    when.textContent = `${dayText(dateAfter(next.in))} ${next.label}`
    tags.append(when)
    if (next.seats) {
      const seats = document.createElement('span')
      seats.className = 'tag tag--accent-pri'
      seats.textContent = next.seats
      tags.append(seats)
    }
  }

  const status = card.querySelector('.product-card__status')
  if (status) {
    status.textContent = ''
    if (next.seats) {
      const seats = document.createElement('span')
      seats.className = 'is-remaining'
      seats.textContent = next.seats
      status.append(seats)
    }
  }

  const desc = card.querySelector('.product-card__desc')
  if (desc) desc.textContent = `${areaText(schedule, next)} · 일정 ${schedule.length}개`

  // 값이 여럿이면 가장 싼 것을 앞세우고 "~"로 그 위가 있다는 것을 알립니다.
  const price = card.querySelector('.product-card__price')
  if (price) {
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
