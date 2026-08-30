/**
 * 알림 띠를 띄웁니다.
 *
 *   import { showToast } from './components/toast.js'
 *   showToast('찜한 모임에 저장했어요', { icon: '#icon-favoriteFilled', tone: 'accent' })
 *
 * 화면에 미리 적어둘 마크업이 없습니다. 처음 부를 때 <body> 끝에 자리(region)를
 * 하나 만들고, 그 다음부터는 그 안의 띠만 갈아 끼웁니다.
 *
 * 자리를 미리 만들어 두는 이유는 화면을 읽어주는 쪽 때문입니다. aria-live 상자는
 * 이미 문서에 있어야 그 안에 들어온 글을 읽습니다 — 글과 상자를 한꺼번에 넣으면
 * 아무 말도 하지 않고 지나갑니다.
 *
 * 연달아 누르면 띠를 쌓지 않고 마지막 것으로 바꿉니다. 찜했다가 바로 해제했다면
 * 지금 상태는 해제 하나뿐이고, 두 장이 겹쳐 뜨면 어느 쪽이 지금인지 알 수 없습니다.
 */

let region
let timer

/** 자리는 하나뿐입니다. 화면에 두 곳에서 부르더라도 같은 자리를 씁니다. */
function ensureRegion() {
  if (region?.isConnected) return region
  region = document.createElement('div')
  region.className = 'toast-region'
  // status 는 하던 일을 끊지 않고 틈이 날 때 읽어줍니다. 찜은 사용자가 방금 스스로
  // 한 일이라 말을 가로챌 만큼 급하지 않습니다.
  region.role = 'status'
  region.ariaLive = 'polite'
  document.body.append(region)
  return region
}

/** 사라지는 데 걸리는 시간은 CSS 가 정합니다 — 두 곳에 적어두면 언젠가 갈립니다. */
const cssMs = (name) =>
  parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0

/**
 * @param {string} text  한 줄 또는 두 줄까지의 문구.
 * @param {{ icon?: string, tone?: 'accent' | 'critical' }} [options]
 *   icon — 스프라이트의 아이콘 id(`#icon-favoriteFilled`). 없으면 글자만 뜹니다.
 *   tone — 아이콘 색. accent 는 브랜드색(잘 된 일), critical 은 붉은색(뜻대로 되지
 *          않은 일). 없으면 글자와 같은 흰색입니다.
 */
export function showToast(text, { icon, tone } = {}) {
  const host = ensureRegion()

  const toast = document.createElement('div')
  toast.className = tone ? `toast toast--${tone}` : 'toast'

  if (icon) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('class', 'toast__icon')
    svg.setAttribute('aria-hidden', 'true')
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use')
    use.setAttribute('href', icon)
    svg.append(use)
    toast.append(svg)
  }

  const label = document.createElement('p')
  label.className = 'toast__label'
  label.textContent = text
  toast.append(label)

  clearTimeout(timer)
  host.replaceChildren(toast)

  const life = cssMs('--_toast-duration')
  const exit = cssMs('--_duration-base')
  timer = setTimeout(() => {
    toast.classList.add('is-leaving')
    // animationend 를 기다리지 않습니다 — 모션을 끈 환경에서는 그 사건이 오지 않아
    // 띠가 남습니다.
    timer = setTimeout(() => toast.remove(), exit)
  }, life)

  return toast
}

/** 화면이 바뀌는 등 지금 알림이 더는 맞지 않을 때 바로 치웁니다. */
export function hideToast() {
  clearTimeout(timer)
  region?.replaceChildren()
}
