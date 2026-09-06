/**
 * 상세 페이지 템플릿 — 블록 동작.
 *
 *   import { initTemplete } from './blocks.js'
 *   initTemplete()
 *
 * 지금 동작이 필요한 블록은 아코디언 하나뿐입니다. 캐러셀은 CSS 의 가로 스크롤과
 * scroll-snap 으로 굴러가서 스크립트가 없습니다 — 스크립트가 없어도, 켜지기 전에도
 * 넘겨볼 수 있습니다.
 */

/**
 * 아코디언을 접었다 폅니다.
 *
 *   <div class="tpl-block tpl-accordion">
 *     <button class="tpl-accordion__question" aria-expanded="false" aria-controls="faq-1"> … </button>
 *     <div class="tpl-accordion__answer" id="faq-1" hidden> … </div>
 *   </div>
 *
 * 마크업은 닫힌 채로 두고 여기서 폅니다. 질문 목록은 원래 접혀 있는 것이 기본
 * 상태라, 스크립트가 없으면 답이 전부 펼쳐진 긴 글이 됩니다 — 그래도 읽을 수는
 * 있어야 하므로 hidden 은 마크업에 두되 스크립트가 없을 때를 위한 대비는
 * <noscript> 가 아니라 이 함수의 존재 여부로 갈립니다. 답이 하나도 안 보이는 것보다
 * 전부 보이는 편이 낫다면 hidden 을 빼고 여기서 접으세요.
 */
export function initAccordion(scope = document) {
  for (const button of scope.querySelectorAll('.tpl-accordion__question')) {
    if (button.dataset.tplReady) continue
    button.dataset.tplReady = '1'

    const answer = document.getElementById(button.getAttribute('aria-controls'))
    if (!answer) continue

    // 마크업이 무엇으로 시작하든 둘을 같은 상태로 맞춰 둡니다. aria-expanded 와
    // hidden 이 어긋난 채 시작하면 첫 클릭이 아무것도 하지 않는 것처럼 보입니다.
    const open = button.getAttribute('aria-expanded') === 'true'
    button.setAttribute('aria-expanded', String(open))
    answer.hidden = !open

    button.addEventListener('click', () => {
      const next = button.getAttribute('aria-expanded') !== 'true'
      button.setAttribute('aria-expanded', String(next))
      answer.hidden = !next
    })
  }
}

/**
 * 캐러셀에 사진이 한 장뿐이면 캐러셀을 걷어냅니다.
 *
 * 어드민에서 최소 3장을 권하지만 하나만 남는 경우가 생깁니다(등록 실수, 노출 종료).
 * 그때 반쯤 잘린 빈자리만 남지 않도록 한 장짜리 표시로 바꿉니다.
 */
export function initCarousel(scope = document) {
  for (const block of scope.querySelectorAll('.tpl-carousel-images')) {
    const track = block.querySelector('.tpl-carousel')
    if (!track) continue
    block.classList.toggle('tpl-carousel-images--single', track.children.length <= 1)
  }
}


/**
 * 지도를 그립니다 — 네이버 지도 JS API.
 *
 *   <section class="tpl-block tpl-location"
 *            data-lat="37.5385" data-lng="127.0027"
 *            data-label="한남동 라운지"></section>
 *
 *   import { initLocation } from './blocks.js'
 *   initLocation(document, { clientId: 'YOUR_KEY' })
 *
 * 키는 코드에 박지 않고 부르는 쪽에서 넣습니다 — 어드민·제품·이 카탈로그가 서로 다른
 * 키를 쓰고, 무엇보다 키가 저장소에 남지 않아야 합니다.
 *
 * ⚠️ 스크립트 주소의 키 파라미터 이름이 발급 시점에 따라 다릅니다. 새 콘솔에서 받은
 *    키는 `ncpKeyId`, 예전 키는 `ncpClientId` 입니다. 기본값은 ncpKeyId 이고,
 *    다르면 param 으로 바꾸거나 src 에 전체 주소를 넣으세요.
 *
 * 지도가 오지 않아도(키 없음·차단·오프라인) 아무것도 무너지지 않습니다. 자리는 빈 채로
 * 남고, 장소명·주소는 어차피 옆 Text 블록에, 바깥 지도 링크는 Button 블록에 있습니다.
 * 그래서 이 함수는 실패를 삼킵니다 — 지도 하나 때문에 페이지가 멈출 이유가 없습니다.
 */
let naverMapsLoading = null

function loadNaverMaps({ clientId, param = 'ncpKeyId', src } = {}) {
  if (window.naver?.maps) return Promise.resolve(window.naver.maps)
  if (naverMapsLoading) return naverMapsLoading
  const url = src || (clientId
    ? `https://oapi.map.naver.com/openapi/v3/maps.js?${param}=${encodeURIComponent(clientId)}`
    : null)
  if (!url) return Promise.reject(new Error('네이버 지도 키가 없습니다.'))

  naverMapsLoading = new Promise((resolve, reject) => {
    const tag = document.createElement('script')
    tag.src = url
    tag.async = true
    tag.onload = () => (window.naver?.maps ? resolve(window.naver.maps) : reject(new Error('네이버 지도를 읽지 못했습니다.')))
    tag.onerror = () => reject(new Error('네이버 지도 스크립트를 받지 못했습니다.'))
    document.head.append(tag)
  })
  // 실패한 약속을 남겨두면 키를 고쳐 다시 불러도 같은 실패를 돌려줍니다.
  naverMapsLoading.catch(() => { naverMapsLoading = null })
  return naverMapsLoading
}

export function initLocation(scope = document, options = {}) {
  const blocks = [...scope.querySelectorAll('.tpl-location[data-lat][data-lng]')]
  if (!blocks.length) return Promise.resolve()

  return loadNaverMaps(options).then((maps) => {
    for (const block of blocks) {
      if (block.dataset.tplReady) continue
      block.dataset.tplReady = '1'

      const at = new maps.LatLng(Number(block.dataset.lat), Number(block.dataset.lng))
      // 지도는 대체 글 위에 얹힙니다. is-mapped 가 그 글을 감춥니다 — 지우지 않는 것은
      // 지도를 다시 그릴 일이 생겨도 글이 그대로 남아 있어야 하기 때문입니다.
      // 자리를 채우고 있던 그림(시안 지도)이 있으면 치웁니다. 남겨 두면 진짜 지도 뒤에
      // 깔린 채 남아, 지도가 반투명한 곳에서 두 겹으로 보입니다.
      for (const img of block.querySelectorAll(':scope > img')) img.hidden = true

      const canvas = document.createElement('div')
      canvas.className = 'tpl-location__map'
      block.prepend(canvas)
      block.classList.add('is-mapped')

      const map = new maps.Map(canvas, {
        center: at,
        zoom: Number(block.dataset.zoom || 16),
        // 손가락으로 페이지를 내리다 지도에 닿으면 페이지 대신 지도가 확대됩니다.
        // 읽어 내려가는 글 한가운데 놓이는 지도라 그 손해가 더 큽니다.
        scrollWheel: false,
        // 핀 하나를 보여주는 자리이지 길을 찾는 자리가 아닙니다. 조작 UI 는 덜어냅니다 —
        // 길찾기는 아래 Button 블록이 네이버 지도로 넘깁니다.
        mapDataControl: false,
        scaleControl: false,
        logoControl: true,
      })
      new maps.Marker({ position: at, map, title: block.dataset.label || '' })
    }
    return blocks.length
  }).catch((err) => {
    // 자리는 그대로 비워 둡니다. 콘솔에만 남깁니다.
    console.warn('[templete] 지도를 그리지 못했습니다:', err.message)
  })
}

export function initTemplete(scope = document, options = {}) {
  initAccordion(scope)
  initCarousel(scope)
  // 지도는 키가 있을 때만 그립니다. 없으면 자리만 비어 있습니다.
  if (options.naver) initLocation(scope, options.naver)
}
