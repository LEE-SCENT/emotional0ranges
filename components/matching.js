/**
 * 매칭 — 내가 신청한 모임을 때에 따라 셋으로 나눠 봅니다.
 *
 *   import { initMatching } from './components/matching.js'
 *   initMatching()
 *
 * 탭은 시간 순서입니다 — 예정 → 진행 중 → 지난. 무엇이 먼저 오는지가 이미
 * 정해져 있어 정렬이나 필터가 없습니다.
 *
 * 지금은 셋 다 비어 있습니다. 신청한 모임을 들고 있는 자리가 아직 없기 때문인데,
 * 목록이 생기면 이 파일이 그것을 그리고 빈 상태는 지금 그대로 남습니다 — 그래서
 * 빈 상태를 화면에 적어두지 않고 여기서 그립니다. 마크업에 세 벌을 적어두면
 * 목록이 들어오는 날 세 곳을 함께 고쳐야 합니다.
 *
 * 고른 탭은 주소에 남깁니다(?tab=ongoing). 링크를 복사하거나 새 탭으로 열었을 때
 * 같은 자리가 나와야 하고, 뒤로가기로 돌아왔을 때도 보던 탭이어야 합니다.
 */

import { ME } from './my-menu.js?v=ea25029d'

/** 갈 곳이 있는 버튼들. 아직 화면이 없는 것은 href 를 비워 둡니다. */
const BROWSE = { label: '모임 둘러보기', icon: 'explorerFilled', href: './meetups.html' }
const CARD = { label: '프로필 카드 교환하기', icon: 'workplaceVerificationFilled', href: '' }

/**
 * 탭마다의 빈 상태(Figma 66:83440 · 66:85164 · 66:85274 · 66:85849).
 *
 * 셋이 서로 다른 말을 합니다. "예정된 모임이 없어요"와 "참여한 모임이 없어요"는
 * 같은 빈 화면이지만 다음에 할 일이 다릅니다 — 앞은 신청할 모임을 고르는 것이고,
 * 뒤는 지난 것이 쌓이면 매칭 결과를 볼 수 있다는 안내입니다.
 */
const TABS = [
  {
    id: 'upcoming',
    label: '예정 모임',
    title: '예정된 모임이 없어요',
    desc: '새로운 모임을 둘러보고 신청해 보세요',
    cta: BROWSE,
  },
  {
    id: 'ongoing',
    label: '진행 중 모임',
    title: '진행 중인 모임이 없어요',
    /* 이 탭만 둘입니다(Figma 66:85164 · 66:85849). 프로필 카드가 없으면 그것부터
       쓰라고 하고, 있으면 다른 탭과 같이 모임을 보러 보냅니다 — 카드가 없는
       사람에게 "둘러보세요"라고 하면, 눌러 들어간 자리에서 다시 카드부터 쓰라는
       말을 듣습니다.
       ⚠️ 무엇이 두 변형을 가르는지는 Figma 에 적혀 있지 않아 문구에서 읽었습니다.
          로그인하지 않았으면 카드도 없으므로 지금은 앞의 것이 나옵니다. */
    variants: [
      {
        when: (me) => !me?.card,
        desc: '모임을 신청하려면 프로필 카드를 먼저 작성해 주세요',
        cta: CARD,
      },
      { desc: '새로운 모임을 둘러보고 신청해 보세요', cta: BROWSE },
    ],
  },
  {
    id: 'past',
    label: '지난 모임',
    title: '참여한 모임이 없어요',
    desc: '모임에 참여하면 지난 모임과 매칭 결과를 확인할 수 있어요',
    cta: BROWSE,
  },
]

const el = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

/** 지금 이 사람에게 보일 문구와 버튼. 변형이 없는 탭은 적힌 그대로입니다. */
function stateOf(tab, me) {
  const variant = tab.variants?.find((v) => !v.when || v.when(me)) ?? tab
  return { title: tab.title, desc: variant.desc, cta: variant.cta }
}

/**
 * 빈 상태 한 장. EmptyState 컴포넌트의 짜임 그대로입니다(empty-state.css) —
 * 모임 목록의 빈 결과와 같은 것이라 생김새를 여기서 다시 정하지 않습니다.
 */
function empty(tab, me) {
  const { title, desc, cta } = stateOf(tab, me)

  const box = el('div', 'empty-state')
  const wrap = el('div', 'empty-state__wrap')
  const mark = el('span', 'empty-state__mark')
  mark.setAttribute('aria-hidden', 'true')
  const text = el('div', 'empty-state__text')
  text.append(el('p', 'empty-state__title', title), el('p', 'empty-state__desc', desc))
  wrap.append(mark, text)

  /* 갈 곳이 있으면 링크, 없으면 버튼입니다 — 주소가 없는 <a> 는 키보드가 지나가지
     못하고, 눌러도 아무 일이 없다는 것을 미리 말해주지도 못합니다. */
  const action = cta.href ? el('a', 'btn btn--filled btn--medium') : el('button', 'btn btn--filled btn--medium')
  if (cta.href) action.href = cta.href
  else action.type = 'button'
  action.innerHTML = `<svg class="btn__icon" aria-hidden="true"><use href="#icon-${cta.icon}"></use></svg>`
  action.append(el('span', 'btn__label', cta.label))

  box.append(wrap, action)
  return box
}

export function initMatching(root = document.querySelector('[data-matching]')) {
  if (!root || root.dataset.matchingReady) return
  root.dataset.matchingReady = '1'

  const tabsBox = root.querySelector('[data-matching-tabs]')
  const body = root.querySelector('[data-matching-body]')
  if (!tabsBox || !body) return

  const first = new URL(location.href).searchParams.get('tab')
  let current = TABS.some((t) => t.id === first) ? first : TABS[0].id

  /* 탭도 데이터에서 만듭니다. 마크업에 적어두면 탭 하나가 늘 때 이름은 늘어나는데
     그 아래 빈 상태는 없는 화면이 생깁니다. */
  tabsBox.append(el('span', 'tabs__thumb'))
  for (const tab of TABS) {
    const item = el('a', `tabs__item${tab.id === current ? ' is-active' : ''}`, tab.label)
    item.href = `?tab=${tab.id}`
    if (tab.id === current) item.setAttribute('aria-current', 'true')
    tabsBox.append(item)
  }

  function render() {
    body.replaceChildren(empty(TABS.find((t) => t.id === current), ME))
  }

  /* 탭을 옮기면 주소만 갈아끼웁니다(replaceState) — 히스토리에 쌓으면 뒤로가기가
     탭을 하나씩 되짚어, 앞 화면으로 돌아가려면 세 번을 눌러야 합니다. */
  tabsBox.addEventListener('click', (e) => {
    const item = e.target.closest('.tabs__item')
    if (!item) return
    e.preventDefault()
    const id = new URL(item.href, location.href).searchParams.get('tab')
    if (!id || id === current) return
    current = id
    const url = new URL(location.href)
    url.searchParams.set('tab', id)
    history.replaceState(history.state, '', `${url.pathname.split('/').pop()}${url.search}`)
    render()
  })

  render()
}
