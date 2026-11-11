/**
 * 광고 쿠키를 쓸지 묻는 카드를 띄웁니다.
 *
 *   import { initCookieConsent, getCookieConsent } from './components/cookie-consent.js'
 *   initCookieConsent({
 *     policyHref: '/privacy',
 *     onChange: (value) => { if (value === 'granted') loadAdScripts() },
 *   })
 *
 * 고른 값은 이 브라우저에 남깁니다. 이미 고른 사람에게는 카드를 띄우지 않고,
 * onChange 를 그 값으로 한 번 부릅니다 — 광고 스크립트를 싣는 쪽이 "처음 고른 때"와
 * "예전에 고른 사람이 다시 온 때"를 따로 다룰 필요가 없게 합니다.
 *
 * 고르기 전에는 허용하지 않은 것으로 다룹니다. 묻는 중에 광고 쿠키가 먼저 심기면
 * 묻는 의미가 없습니다.
 *
 * 카드를 띄워도 초점을 가져오지 않습니다. 화면을 막지 않는 카드라, 읽던 자리에서
 * 초점이 튀면 키보드로 쓰던 사람이 길을 잃습니다. 문서 끝에 붙어 탭 순서상 마지막입니다.
 */

const KEY = 'cookie-consent'

/** 이 모듈이 띄운 카드. 같은 화면에 두 장이 뜨지 않게 다시 띄울 때 먼저 치웁니다. */
let current

/** @typedef {'granted' | 'denied'} Consent */

/** 고른 값. 아직 고르지 않았거나 저장소를 쓸 수 없으면 null 입니다. */
export function getCookieConsent() {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    return null
  }
}

/** 사라지는 데 걸리는 시간은 CSS 가 정합니다 — 두 곳에 적어두면 언젠가 갈립니다. */
const cssMs = (name) =>
  parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0

/**
 * @param {{ policyHref?: string, onChange?: (value: Consent) => void, force?: boolean }} [options]
 *   policyHref — "자세히 보기"가 여는 개인정보처리방침 주소. 새 탭으로 엽니다 — 읽고 돌아와 고를 수 있어야 합니다.
 *   onChange   — 고른 값(또는 예전에 고른 값)을 받습니다.
 *   force      — 예전에 골랐어도 다시 띄웁니다. 설정 화면의 "쿠키 설정 바꾸기"가 씁니다.
 * @returns {HTMLElement | null} 띄운 카드. 띄우지 않았으면 null.
 */
export function initCookieConsent({ policyHref = '#', onChange, force = false } = {}) {
  const saved = getCookieConsent()
  if (saved && !force) {
    onChange?.(saved)
    return null
  }

  current?.remove()
  stopClearance?.()

  const card = document.createElement('section')
  card.className = 'cookie-consent'
  card.setAttribute('aria-labelledby', 'cookie-consent-title')
  card.innerHTML = `
    <div class="cookie-consent__text">
      <h2 id="cookie-consent-title">광고 쿠키를 허용할까요?</h2>
      <p>맞춤 광고와 광고 효과 측정에 쿠키를 사용해요.
        거부해도 서비스는 그대로 이용할 수 있어요.
        <a target="_blank" rel="noopener">자세히 보기</a></p>
    </div>
    <div class="cookie-consent__actions">
      <button class="btn btn--outlined btn--medium" type="button" data-cookie-consent="denied"><span class="btn__label">거부</span></button>
      <button class="btn btn--filled btn--medium" type="button" data-cookie-consent="granted"><span class="btn__label">허용</span></button>
    </div>`
  card.querySelector('a').href = policyHref

  card.addEventListener('click', (event) => {
    const button = event.target.closest('[data-cookie-consent]')
    if (!button) return
    /** @type {Consent} */
    const value = button.dataset.cookieConsent
    try {
      localStorage.setItem(KEY, value)
    } catch {
      // 저장할 수 없는 환경(사생활 보호 창 등)에서는 이번 방문에만 따릅니다.
    }
    onChange?.(value)
    card.classList.add('is-leaving')
    // animationend 를 기다리지 않습니다 — 모션을 끈 환경에서는 그 사건이 오지 않습니다.
    setTimeout(() => {
      card.remove()
      stopClearance?.()
    }, cssMs('--_duration-base'))
  })

  document.body.append(card)
  current = card
  stopClearance = trackClearance(card)
  return card
}

/** 지금 재고 있는 카드의 관찰을 멈춥니다. 카드가 없으면 비어 있습니다. */
let stopClearance

/**
 * 카드 윗변이 화면 아래에서 얼마나 떨어져 있는지를 `--_cookie-consent-clearance` 로
 * 문서에 적습니다. 알림 띠(toast.css)가 이 값만큼 올라서, 카드를 덮지 않고 그 위에
 * 뜹니다.
 *
 * CSS 만으로는 정할 수 없습니다 — 카드 높이는 글이 몇 줄로 접히느냐에 따라, 바닥에서의
 * 거리는 화면 폭과 아래에 고정된 것(신청 버튼·탭)에 따라 달라집니다. 그래서 실제로
 * 그려진 자리를 잽니다.
 */
function trackClearance(card) {
  const root = document.documentElement
  const update = () => {
    root.style.setProperty(
      '--_cookie-consent-clearance',
      // 그려진 자리(getBoundingClientRect)가 아니라 정해진 자리입니다. 카드가 아래에서
      // 밀려 올라오는 동안 재면 그만큼 낮게 잡힙니다.
      `${parseFloat(getComputedStyle(card).bottom) + card.offsetHeight}px`,
    )
  }
  const observer = new ResizeObserver(update)
  observer.observe(card)
  addEventListener('resize', update)
  update()
  return () => {
    observer.disconnect()
    removeEventListener('resize', update)
    root.style.removeProperty('--_cookie-consent-clearance')
    stopClearance = undefined
  }
}
