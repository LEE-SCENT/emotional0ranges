/**
 * 어느 상품을 눌러 들어왔는지를 화면에 반영합니다.
 *
 *   <a href="./detail.html?product=dolsing">…</a>
 *
 *   import { initProduct } from './components/product.js'
 *   initProduct()   // 다른 스크립트보다 먼저
 *
 * 목록에서 무엇을 눌렀든 늘 같은 화면이 나오면, 눌린 것이 맞는지부터 의심하게 됩니다.
 * 주소에 붙어 온 상품을 읽어 제목·소개·사진·일정·후기를 그 상품의 것으로 갈아끼웁니다.
 *
 * 기본 상품(티키타카)의 내용은 detail.html 에 그대로 적혀 있고, 다른 상품일 때만
 * 여기서 다시 그립니다. 스크립트가 오지 않아도 한 상품은 온전히 읽힙니다.
 *
 * 일정과 후기를 읽는 다른 스크립트(schedule·discount·seat-alert·recent-review)보다
 * 먼저 돌아야 합니다. 그들이 세어둔 뒤에 목록을 갈아끼우면 서로 다른 것을 보게 됩니다.
 */

import { PRODUCTS, seatsText, startTime } from './products.js'

export const currentProduct = () => {
  const slug = new URLSearchParams(location.search).get('product')
  return slug && PRODUCTS[slug] ? slug : null
}

const won = (n) => `${n.toLocaleString('ko-KR')}원`

/** 있는 요소만 채웁니다 — 화면마다 있는 자리가 다릅니다. */
const fill = (scope, sel, text) => {
  for (const el of scope.querySelectorAll(sel)) el.textContent = text
}

function renderGallery(scope, photos) {
  const items = [...scope.querySelectorAll('.detail-gallery__item img')]
  items.forEach((img, i) => {
    const p = photos[i]
    if (!p) return
    img.src = p.src
    img.alt = p.alt
  })
}

function renderViewer(scope, photos) {
  const list = scope.querySelector('.image-viewer__list')
  const single = scope.querySelector('.image-viewer__single img')
  if (!list) return
  list.replaceChildren(
    ...photos.map((p, i) => {
      const li = document.createElement('li')
      li.innerHTML = `<button class="image-viewer__thumb" aria-label="${i + 1}번째 사진 크게 보기">
            <img src="${p.src}" alt="${p.alt}" width="${p.w}" height="${p.h}" loading="lazy">
          </button>`
      return li
    }),
  )
  if (single && photos[0]) {
    single.src = photos[0].src
    single.alt = photos[0].alt
  }
}

/** 날짜가 같은 일정끼리 묶습니다. 목록은 날짜별로 나뉘어 보입니다. */
function groupByDay(schedule) {
  const days = []
  for (const item of schedule) {
    const last = days[days.length - 1]
    if (last && last.in === item.in) last.items.push(item)
    else days.push({ in: item.in, items: [item] })
  }
  return days
}

function renderSchedule(scope, schedule) {
  const list = scope.querySelector('.schedule__list')
  if (!list) return
  const keep = list.querySelector('.schedule__empty')
  const groups = groupByDay(schedule).map((day) => {
    const group = document.createElement('div')
    group.className = 'schedule__group'
    const rows = day.items
      .map((o) => {
        const price = o.off
          ? `<b>${won(o.price - o.off)}</b> <s>${won(o.price)}</s>`
          : `<b>${won(o.price)}</b>`
        // 24 시간 안쪽에 끝나는 할인만 칩을 답니다. 나머지는 자리째 비워둡니다.
        const tag = o.deadline
          ? `<span class="tag tag--accent-pri option-card__deadline"${o.deadline < 86400 ? '' : ' hidden'}>
                <svg aria-hidden="true"><use href="#icon-scheduleFilled"></use></svg>
                <time class="countdown">02:30:24</time>
              </span>`
          : ''
        const icon = o.alert ? '<svg aria-hidden="true"><use href="#icon-notifications"></use></svg>' : ''
        return `<li>
          <label class="option-card${o.alert ? ' option-card--alert' : ''}" data-date-in="${o.in}"${
            o.deadline ? ` data-discount-in="${o.deadline}"` : ''
          }
                 data-time="${o.label}" data-where="${o.place} · ${o.age}"
                 data-price="${o.price}" data-discount="${o.off}">
            <input class="sr-only" type="radio" name="schedule" value="${o.v}">
            <span class="option-card__main">
              <span class="option-card__time">${startTime(o)}</span>
              <span class="option-card__price">${price}</span>
              <span class="option-card__place">${o.place}</span>
            </span>
            <span class="option-card__aside">${tag}
              <span class="option-card__seats">${icon}${seatsText(o)}</span>
            </span>
          </label>
        </li>`
      })
      .join('\n')
    group.innerHTML = `<time class="schedule__date"></time>
      <ul class="schedule__options">${rows}</ul>`
    return group
  })
  list.replaceChildren(...(keep ? [keep, ...groups] : groups))
  // 첫 일정을 골라둡니다. 아무것도 골라져 있지 않으면 신청 버튼이 갈 곳을 잃습니다.
  const first = list.querySelector('[name="schedule"]')
  if (first) first.checked = true
}

function renderReviews(scope, reviews) {
  const list = scope.querySelector('.review__list')
  if (!list) return
  const stars = [...list.querySelectorAll('.review__item')][0]?.querySelector('.review__stars')
  list.replaceChildren(
    ...reviews.map((r) => {
      const li = document.createElement('li')
      li.className = 'review__item'
      li.dataset.daysAgo = String(r.days)
      li.innerHTML = `<p class="review__rating">
          ${stars ? stars.outerHTML : ''}
          <span>· <time class="review__ago">${r.days}일 전</time></span>
        </p>
        <p class="review__body">${r.body}</p>
        <p class="review__profile"><span>${r.who}</span><span>${r.area}</span><span>${r.age}</span></p>`
      return li
    }),
  )
}

export function initProduct(scope = document) {
  const slug = currentProduct()

  // 상품이 정해져 있으면 다음 화면으로도, 돌아가는 길로도 들고 갑니다. 갈아끼울 것이
  // 없어도 이건 합니다.
  //
  // 돌아가는 길에서 대상을 data-back 으로 좁히는 것은, 상세 화면의 "비슷한 모임"도
  // detail.html 을 가리키기 때문입니다 — 그쪽은 이미 제 상품을 달고 있어, 싸잡아
  // 덮어쓰면 어느 카드를 눌러도 지금 보던 모임으로 갑니다.
  if (slug) {
    for (const a of scope.querySelectorAll(
      'a[href*="checkout.html"], a[data-back][href*="detail.html"]',
    )) {
      const url = new URL(a.getAttribute('href'), location.href)
      url.searchParams.set('product', slug)
      a.setAttribute('href', `${url.pathname.split('/').pop()}${url.search}`)
    }
  }

  if (!slug) return
  const product = PRODUCTS[slug]

  fill(scope, '[data-product-title]', product.title)
  // 탭 이름도 같이 바꿉니다. 여러 상품을 열어두면 탭 제목이 유일한 구분입니다.
  document.title = `${product.title} — 감정적인 오렌지들`

  const lead = scope.querySelector('[data-product-lead]')
  if (lead) lead.innerHTML = product.lead.join('<br>')

  for (const [key, [head, body]] of Object.entries(product.facts)) {
    const fact = scope.querySelector(`[data-product-fact="${key}"]`)
    if (!fact) continue
    fill(fact, 'b', head)
    fill(fact, '[data-product-fact-body]', body)
  }

  renderGallery(scope, product.photos)
  renderViewer(scope, product.photos)
  renderSchedule(scope, product.schedule)
  renderReviews(scope, product.reviews)
}
