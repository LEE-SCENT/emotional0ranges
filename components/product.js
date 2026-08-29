/**
 * 어느 상품을 눌러 들어왔는지를 화면에 반영합니다.
 *
 *   <a href="./detail.html?product=tikitaka">…</a>
 *
 *   import { initProduct } from './components/product.js'
 *   initProduct()
 *
 * 목록에서 무엇을 눌렀든 늘 같은 제목이 나오면, 눌린 것이 맞는지부터 의심하게
 * 됩니다. 주소에 붙어 온 상품을 읽어 제목을 갈아끼웁니다.
 *
 * ⚠️ 지금 바꾸는 것은 제목뿐입니다. 사진·일정·후기는 이 화면에 놓인 것 그대로입니다 —
 * 상품마다 다른 그 값들은 서버에서 오는 것이라, 여기에 지어내 채우면 화면은 그럴듯한데
 * 사실이 아닌 것이 됩니다. 무엇이 연결되고 무엇이 아직 아닌지는 이렇게 드러나 있는
 * 편이 낫습니다.
 */

/** 목록에 나오는 상품들. 제목이 여러 화면에 나오므로 한 곳에 둡니다. */
export const PRODUCTS = {
  dolsing: '돌싱 로테이션 소개팅',
  tikitaka: '12:12 티키타카 로테이션 소개팅',
  theme: '테마 로테이션 소개팅',
  black: '블랙 라운지 소개팅',
}

/** 주소에 붙어 온 상품. 없거나 모르는 값이면 화면에 적힌 것을 그대로 둡니다. */
export const currentProduct = () => {
  const slug = new URLSearchParams(location.search).get('product')
  return slug && PRODUCTS[slug] ? slug : null
}

export function initProduct(scope = document) {
  const slug = currentProduct()
  if (!slug) return
  const title = PRODUCTS[slug]

  for (const el of scope.querySelectorAll('[data-product-title]')) el.textContent = title

  // 탭 이름도 같이 바꿉니다. 여러 상품을 열어두면 탭 제목이 유일한 구분입니다.
  document.title = `${title} — 감정적인 오렌지들`

  // 다음 화면으로도 들고 갑니다.
  for (const a of scope.querySelectorAll('a[href*="checkout.html"]')) {
    const url = new URL(a.getAttribute('href'), location.href)
    url.searchParams.set('product', slug)
    a.setAttribute('href', `${url.pathname.split('/').pop()}${url.search}`)
  }
}
