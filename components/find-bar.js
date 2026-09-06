/**
 * 찾기 화면의 조건 — 통합 필터바, 팝오버와 바텀시트, 모임 유형 퀵필터.
 *
 *   import { initFindBar } from './components/find-bar.js'
 *   initFindBar()
 *
 * 고른 것이 무엇인지는 이 파일이 따로 세어두지 않습니다. 섹션 안의 체크박스·라디오가
 * 곧 상태이고, 날짜만 이 안에 남습니다 — 달력에는 켜고 끄는 입력이 없어 브라우저에
 * 맡길 자리가 없습니다.
 *
 * 조건이 바뀌면 `find:change` 를 올립니다. 무엇을 걸러 어떤 차례로 보여줄지는
 * find.js 가 그 이벤트를 받아서 합니다 — 조건을 고르는 일과 목록을 그리는 일이
 * 한 파일에 있으면, 조건이 하나 늘 때마다 목록을 그리는 코드를 함께 고치게 됩니다.
 *
 * 지역·모임 유형·하위 필터의 선택지는 마크업에 적어두지 않고 데이터에서 만듭니다.
 * 적어두면 지역이 하나 열릴 때 목록에는 나오는데 조건에는 없는 지역이 생깁니다.
 *
 * ---- 넓은 화면과 좁은 화면이 다르게 걸립니다 ----------------------------
 * 961 부터는 팝오버에서 고르는 즉시 목록에 걸립니다. 960 이하에서는 네 섹션이
 * 한 장에 담긴 통합 필터 시트가 올라오고, 거기서 고른 것은 개수만 앞서 바뀌다가
 * `모임 N개 보기` 를 눌러야 한꺼번에 걸립니다 — 좁은 화면에서는 조건 하나를 고칠
 * 때마다 시트 뒤의 목록이 다시 그려지는 것을 볼 수 없어, 즉시 반영이 "아무 일도
 * 일어나지 않는" 것으로 보입니다.
 *
 * 섹션은 한 벌뿐이고 팝오버와 시트 사이를 옮겨 다닙니다(moveSections). 두 벌을
 * 두면 같은 이름의 입력이 문서에 둘 있게 되어, 어느 쪽에서 고른 것인지 서로
 * 모르게 됩니다.
 *
 * 주소에도 같은 조건을 적어둡니다(?area=&date=…). 링크를 복사하거나 새 탭으로
 * 열었을 때 같은 목록이 나와야 하고, 뒤로 돌아왔을 때 고른 것이 남아 있어야 합니다.
 */

import {
  AREA_GROUPS, PRODUCTS, REGIONS, areaLabel, areaOf, groupOf, openMeetups, regionOf, tagsOf,
} from './products.js?v=49fbe067'
import { ME, countMatches } from './find.js?v=12ac30df'
import { dateAfter, dateKey, isToday, todayInSeoul } from './schedule.js?v=a9e9003f'
import { lockScroll, unlockScroll } from './scroll-lock.js?v=40a2cd35'
import { initSegmentedControl } from './segmented-control.js?v=bbd7c4b8'

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']
const SORTS = ['soon', 'price', 'urgent']

/** 섹션이 서는 차례. 팝오버에서든 시트에서든 같습니다. */
const SECTIONS = ['area', 'date', 'seats', 'picks']

/** 추천 조건 — 목록 위 알약에 적을 이름과 아이콘. */
const PICKS = {
  promo: { label: '프로모션', icon: 'promotionFilled' },
  closing: { label: '마감 임박', icon: 'scheduleFilled' },
  // 내 나이로 신청 가능에는 아이콘이 없습니다(Figma) — 프로모션·마감 임박은
  // 상품에 붙는 표시라 그림이 있지만, 이것은 보는 사람 쪽의 조건입니다.
  myage: { label: '내 나이 신청 가능' },
}

const parseKey = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const isKey = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s ?? '')

/** 바와 알약에 적는 날짜: 9월 24일 (Figma 의 요약·칩과 같은 모양입니다). */
const dayLabel = (at) => `${at.getMonth() + 1}월 ${at.getDate()}일`

const el = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

/**
 * 켜고 끄는 알약 하나 — Button 컴포넌트를 그대로 쓰고, 켜진 모습은 CSS 의
 * :has(:checked) 가 맡습니다. 자바스크립트가 클래스를 오가며 바꿔 달지 않아도
 * 브라우저가 상태를 들고 있습니다.
 */
function chip({ name, value, label, type = 'checkbox', className, checked = false, mark = false }) {
  const wrap = el('label', className)
  const input = document.createElement('input')
  input.className = 'sr-only'
  input.type = type
  input.name = name
  input.value = value
  input.checked = checked
  wrap.append(input, el('span', 'btn__label', label))
  // 켜졌을 때만 보이는 × 입니다(find-bar.css: .find-mark).
  if (mark) {
    wrap.insertAdjacentHTML('beforeend', '<svg class="find-mark" aria-hidden="true"><use href="#icon-close"></use></svg>')
  }
  return wrap
}

export function initFindBar(root = document.querySelector('[data-find]')) {
  if (!root || root.dataset.findReady) return
  root.dataset.findReady = '1'

  const head = root.querySelector('.find-head')
  const bar = root.querySelector('.find-bar')
  const fields = root.querySelector('.find-bar__fields')
  if (!head || !bar || !fields) return

  const meetups = openMeetups()
  /* 지난 날만 고를 수 없습니다. 모임이 없는 날까지 막아두면 "9월 13일 이후는
     왜 눌리지 않지" 하고 달력을 의심하게 되는데, 실제로는 아직 그 날 모임이
     열리지 않았을 뿐입니다 — 고르면 빈 목록이 그 사실을 말합니다. */
  const todayKey = dateKey(dateAfter(0))

  const sheet = root.querySelector('[data-find-sheet]')
  const sheetBody = root.querySelector('[data-find-sheet-body]')
  const sheetPanel = root.querySelector('.find-sheet__panel')
  const sheetWidth = matchMedia('(max-width: 960px)')

  /* ---- 섹션이 사는 자리 ---------------------------------------------------
     처음 자리는 마크업에 적힌 그대로(각자의 팝오버)입니다. 시트가 열리는 동안만
     넷이 시트 안으로 옮겨 갔다가, 닫히면 제자리로 돌아옵니다. */
  const sections = new Map()
  const hosts = new Map()
  for (const name of SECTIONS) {
    const node = root.querySelector(`[data-find-section="${name}"]`)
    if (!node) continue
    sections.set(name, node)
    hosts.set(name, node.parentElement)
  }

  /* ---- 지역 -------------------------------------------------------------
     권역(수도권 · 그 외 지역) 탭 아래에 그 권역의 지역이 놓입니다. 수도권은
     다시 서울과 경기·인천으로 나뉘고, 그 외 지역은 도시 하나가 곧 한 곳이라
     소제목 없이 펼칩니다.

     맨 위의 `수도권 전체`, 묶음마다의 `전체` 는 지우는 버튼이 아니라 그 범위를
     통째로 고르는 항목입니다 — 목록은 그 안에 드는 회차를 모두 통과시킵니다. */

  const areaBody = root.querySelector('[data-find-body="area"]')

  const isRegion = (value) => REGIONS.includes(value)
  const isGroup = (value) => AREA_GROUPS.includes(value)

  /** 값보다 위에 있는 것들 — 지역이면 [묶음, 권역], 묶음이면 [권역], 권역이면 []. */
  const ancestorsOf = (value) => {
    if (isRegion(value)) return []
    if (isGroup(value)) return [REGIONS[0]]
    return [...new Set([groupOf(value), regionOf(value)])].filter((v) => v !== value)
  }

  function areaItem(value, label) {
    return chip({ name: 'area', value, label, className: 'btn btn--ghost btn--medium find-btn-grid__item' })
  }

  if (areaBody) {
    const areas = [...new Set(meetups.map((m) => areaOf(m.s.place)))]

    /* 권역 → 묶음 → 지역. 묶음이 권역 이름과 같으면(그 외 지역) 소제목 없이
       한 격자로 펼칩니다. */
    const byRegion = new Map(REGIONS.map((region) => [region, new Map()]))
    for (const area of areas) {
      const groups = byRegion.get(regionOf(area))
      const group = groupOf(area)
      if (!groups.has(group)) groups.set(group, [])
      groups.get(group).push(area)
    }

    const first = REGIONS.find((region) => byRegion.get(region).size) ?? REGIONS[0]

    /* 탭에는 지역 개수를 적지 않습니다 — 거르는 조건이 아니라 아래 격자가 어느
       묶음을 보여줄지 고르는 자리입니다. 지역이 하나도 없는 묶음은 탭을 지우지
       않고 눌리지 않게만 둡니다 — 지우면 탭 줄이 한 칸짜리가 됩니다. */
    const tabs = el('div', 'segmented segmented--default')
    tabs.setAttribute('role', 'tablist')
    tabs.setAttribute('aria-label', '권역')
    tabs.append(el('span', 'segmented__thumb'))
    for (const region of REGIONS) {
      const tab = el('button', `segmented__item${region === first ? ' is-selected' : ''}`, region)
      tab.type = 'button'
      tab.setAttribute('role', 'tab')
      tab.setAttribute('aria-selected', String(region === first))
      tab.disabled = byRegion.get(region).size === 0
      tab.dataset.region = region
      tabs.append(tab)
    }

    const panels = REGIONS.map((region) => {
      const box = el('div', 'find-area__region')
      box.dataset.region = region
      box.hidden = region !== first

      /* 묶음의 차례는 데이터에 나온 순서가 아니라 정해진 순서입니다(서울 →
         경기·인천). 어느 지역의 회차가 먼저 들어오느냐에 따라 목록의 위아래가
         바뀌면, 같은 화면을 두 번 볼 때마다 눈이 다시 훑어야 합니다. */
      const groups = [...byRegion.get(region)].sort(
        (a, b) => AREA_GROUPS.indexOf(a[0]) - AREA_GROUPS.indexOf(b[0]),
      )
      const grouped = groups.some(([group]) => group !== region)

      /* 갈래 전체. 묶음이 있는 갈래에서만 제 줄을 갖습니다("수도권 전체") —
         소제목 아래 격자들 위에 서야 그 전부를 뜻한다는 것이 자리로 드러납니다.
         묶음이 없는 갈래(그 외 지역)는 격자가 하나뿐이라 그 첫 칸에 "전체"로
         들어갑니다(Figma) — 한 줄짜리 목록 위에 또 한 줄을 세울 이유가 없습니다. */
      if (grouped) {
        const all = el('div', 'find-btn-grid find-btn-grid--area')
        all.append(areaItem(region, `${region} 전체`))
        box.append(all)
      }

      for (const [group, list] of groups) {
        const grid = el('div', 'find-btn-grid find-btn-grid--area')
        // 묶음이 권역과 같은 이름이면 그 묶음은 없는 것입니다(그 외 지역).
        grid.append(areaItem(group === region ? region : group, '전체'))
        /* 묶음 이름이 이미 말하고 있는 앞머리는 뗍니다 — `서울` 묶음의
           `서울 강남` 은 `강남` 입니다. `고양 일산`·`인천 주안` 처럼 시 이름이
           있어야 어디인지 알 수 있는 곳은 그대로입니다(products.js: areaLabel). */
        const labelled = list
          .map((area) => [area, areaLabel(area)])
          .sort((a, b) => a[1].localeCompare(b[1], 'ko'))
        for (const [area, label] of labelled) grid.append(areaItem(area, label))
        if (group === region) {
          box.append(grid)
        } else {
          const wrap = el('div', 'find-area__group')
          wrap.append(el('p', 'find-area__group-title', group), grid)
          box.append(wrap)
        }
      }
      return box
    })

    const area = el('div', 'find-area')
    area.append(tabs, ...panels)
    areaBody.replaceChildren(area)
    initSegmentedControl(tabs)
    tabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.segmented__item')
      if (!tab || tab.disabled) return
      for (const panel of panels) panel.hidden = panel.dataset.region !== tab.dataset.region
    })
  }

  /* ---- 모임 유형 퀵필터과 하위 필터 --------------------------------------
     상위는 하나만 고릅니다(라디오). `전체` 는 상태를 지우는 버튼이 아니라 값이
     빈 항목이라, 다른 유형과 똑같이 라디오 하나입니다 — 지우는 버튼으로 두면
     지금 전체를 보고 있다는 사실을 화면이 스스로 말하지 못합니다.

     하위 필터는 고른 유형의 회차에 붙은 특집에서 만듭니다. 유형을 바꾸면 그
     줄을 다시 그리므로 이전 조건은 저절로 풀립니다. */

  const kindList = root.querySelector('[data-find-kinds]')
  const tagList = root.querySelector('[data-find-tags]')
  const tagBox = root.querySelector('[data-find-tags-box]')
  const typesRow = root.querySelector('.find-types__row')
  const typesBox = root.querySelector('[data-find-types]')
  const moreBtn = root.querySelector('[data-find-types-more]')

  const kindOf = () => root.querySelector('input[name="kind"]:checked')?.value ?? ''

  if (kindList) {
    const slugs = [...new Set(meetups.map((m) => m.slug))]
    kindList.replaceChildren(
      chip({ name: 'kind', value: '', label: '전체', type: 'radio', checked: true, className: 'btn btn--outlined btn--medium find-types__kind' }),
      ...slugs.map((slug) => chip({
        name: 'kind', value: slug, label: PRODUCTS[slug].title, type: 'radio',
        className: 'btn btn--outlined btn--medium find-types__kind',
      })),
    )
  }

  /** 고른 유형의 하위 필터. 전체를 보고 있으면 줄 자체가 없습니다. */
  function renderTags() {
    if (!tagList) return
    const kind = kindOf()
    /* 그 유형의 회차들이 들고 있는 조건을 모읍니다 — 차례는 회차에 나온 차례
       그대로입니다. 이름순으로 다시 세우면 같은 유형을 열 때마다 알약의 자리가
       데이터와 어긋나 보입니다. */
    const themes = kind
      ? [...new Set(meetups.filter((m) => m.slug === kind).flatMap((m) => tagsOf(m.s)))]
      : []
    /* 닫히는 동안에는 알약을 그대로 둡니다. 먼저 비우면 접힐 높이가 그 자리에서
       사라져, 줄이 밀려 올라가는 것이 아니라 툭 없어지고 아래 카드가 한 칸
       뛰어오릅니다 — 비우는 것은 다 닫힌 뒤입니다(아래 transitionend).

       걸린 것만은 그 자리에서 풉니다. 사라지는 중인 알약이 켜진 채로 남아 있으면
       닫히는 200ms 동안 목록이 이전 유형의 조건으로 걸러진 채 서 있습니다 —
       화면에서 물러나는 것은 모양이지 조건이 아닙니다. */
    if (themes.length === 0) {
      for (const input of tagList.querySelectorAll('input[name="tag"]')) input.checked = false
      if (tagBox) tagBox.hidden = true
      return
    }
    tagList.replaceChildren(
      ...themes.map((theme) => chip({
        name: 'tag', value: theme, label: theme, mark: true,
        className: 'btn btn--ghost btn--medium find-types__tag',
      })),
    )
    // 여닫는 것은 바깥 상자입니다 — 그것이 높이를 펴고 접습니다(find.css).
    if (tagBox) tagBox.hidden = false
  }

  /* 다 닫힌 뒤에야 비웁니다. 닫히는 도중에 다른 유형을 골라 다시 열렸으면 그때
     그린 알약이 서 있으므로 건드리지 않습니다 — 지금 닫혀 있을 때만 비웁니다.

     end 만이 아니라 cancel 도 듣습니다. 다 닫히는 순간 display:none 이 적용되면서
     (allow-discrete) 브라우저가 남은 전환을 end 가 아니라 cancel 로 끝냅니다 —
     end 만 들으면 알약이 영영 남습니다. 열린 채로 잘려 취소되는 경우는 위의
     hidden 검사에 걸립니다. */
  for (const type of ['transitionend', 'transitioncancel']) {
    tagBox?.addEventListener(type, (e) => {
      if (e.target !== tagBox || e.propertyName !== 'grid-template-rows') return
      if (tagBox.hidden) tagList?.replaceChildren()
    })
  }

  /* 폰에서는 한 줄만 보이고 펼침 버튼으로 나머지를 폅니다. 목록을 덮는 창이
     아니라 그 자리에서 줄이 늘어나고, 결과 수·소팅·카드가 함께 밀려 내려갑니다. */
  function setTypesExpanded(next) {
    if (!moreBtn) return
    moreBtn.setAttribute('aria-expanded', String(next))
    typesRow?.classList.toggle('is-expanded', next)
    moreBtn.querySelector('.sr-only').textContent = next ? '모임 유형 접기' : '모임 유형 모두 보기'
    measureTypesTop()
  }

  /* 화면이 움직이면 펼쳐둔 줄은 접습니다. 여러 줄로 벌어진 채 위에 붙어 따라오면
     읽으려던 목록을 그만큼 가리고, 유형을 고르러 편 줄이 목록을 보는 내내 남습니다 —
     펴는 것은 고르기 위해서지 계속 보기 위해서가 아닙니다. */
  const collapseTypes = () => {
    if (moreBtn?.getAttribute('aria-expanded') === 'true') setTypesExpanded(false)
  }

  moreBtn?.addEventListener('click', () => {
    setTypesExpanded(moreBtn.getAttribute('aria-expanded') !== 'true')
  })

  /* ---- 날짜 --------------------------------------------------------------
     달력에는 켜고 끄는 입력이 없어 이 값만 이 파일이 들고 있습니다.

     하루 또는 기간을 하나씩 "담아" 최대 MAX 개까지 쌓습니다 — 목록은 담긴 것 중
     어느 하나에라도 걸리면 보여줍니다(OR). 하나로 묶은 긴 기간과 다른 점은, 그
     사이의 못 가는 날까지 걸지 않는다는 것입니다. */

  const MAX_DATES = 8
  /** 지금 보고 있는 왼쪽 달이 이번 달에서 몇 달 뒤인지. 좌우 버튼이 이것만 옮깁니다. */
  let monthOffset = 0
  let selections = []
  /** 지금 담는 중인 것의 시작일. 아직 끝을 고르지 않은 상태입니다. */
  let pendingFrom = null

  const calendar = root.querySelector('[data-find-calendar]')
  const datesList = root.querySelector('[data-find-dates]')
  const dateHelp = root.querySelector('[data-find-date-help]')

  /** k 가 이미 담긴 것(하루 또는 기간) 안에 있으면 그것을. */
  const selectionAt = (k) => selections.find((sel) => k >= sel.from && k <= sel.to)

  const dateLabel = (sel) =>
    sel.from === sel.to
      ? dayLabel(parseKey(sel.from))
      : `${dayLabel(parseKey(sel.from))} - ${dayLabel(parseKey(sel.to))}`

  /** 머리의 좌우 버튼 하나. 창을 통째로 한 달씩 옮깁니다. */
  function navBtn(label, icon, step, disabled) {
    // Button 컴포넌트(ghost/small/iconOnly)를 그대로 씁니다 — 6/12 여백에 20 아이콘.
    const btn = el('button', 'btn btn--ghost btn--small btn--icon-only calendar__nav')
    btn.type = 'button'
    btn.disabled = disabled
    btn.dataset.findMonth = String(step)
    btn.setAttribute('aria-label', label)
    btn.innerHTML = `<svg class="btn__icon" aria-hidden="true"><use href="#icon-${icon}"></use></svg>`
    return btn
  }

  function month(y, m, bounds, side) {
    const box = el('div', 'calendar__month')

    /* 화살표는 창의 바깥쪽에만 보입니다(Figma) — 안쪽 화살표는 자리만 지키고
       숨습니다. 두 달이 한 창으로 함께 움직이므로 안쪽에도 같은 버튼을 두면 같은
       일을 하는 버튼이 넷이 됩니다. 자리를 비우지 않고 숨기는 것은, 그래야 달
       이름이 칸 격자의 가운데에 옵니다. 한 달만 서는 폭에서는 바깥이 양쪽입니다. */
    const headRow = el('div', 'calendar__head')
    const prev = navBtn('이전 달', 'chevronLeft', -1, !bounds.canPrev)
    const next = navBtn('다음 달', 'chevronRight', 1, !bounds.canNext)
    if (side === 'right') prev.classList.add('is-hidden')
    if (side === 'left') next.classList.add('is-hidden')
    headRow.append(prev, el('p', 'calendar__title', `${y}년 ${m}월`), next)
    box.append(headRow)

    const heads = el('div', 'calendar__weekdays')
    for (const day of WEEKDAY) heads.append(el('span', 'calendar__weekday', day))

    /* 주마다 한 줄로 감쌉니다(Figma 의 Row). 그 줄이 모서리를 둥글게 잘라내
       기간의 띠가 줄 끝에서 둥글게 끝납니다. */
    const grid = el('div', 'calendar__days')
    let week = el('div', 'calendar__week')
    grid.append(week)

    // 1일이 무슨 요일인지에 따라 앞을 비웁니다. 비운 칸은 버튼이 아니라 자리입니다.
    const lead = new Date(y, m - 1, 1).getDay()
    for (let i = 0; i < lead; i += 1) week.append(el('span', 'calendar__day calendar__day--blank'))

    const last = new Date(y, m, 0).getDate()
    for (let d = 1; d <= last; d += 1) {
      if ((lead + d - 1) % 7 === 0 && d !== 1) {
        week = el('div', 'calendar__week')
        grid.append(week)
      }
      const at = new Date(y, m - 1, d)
      const k = dateKey(at)
      const cell = el('button', 'calendar__day', String(d))
      cell.type = 'button'
      cell.dataset.date = k
      const sel = selectionAt(k)
      // 이미 담긴 날은 다 찼을 때도 눌립니다 — 눌러서 빼는 길이 그것뿐입니다.
      const atMax = !pendingFrom && selections.length >= MAX_DATES
      cell.disabled = k < todayKey || (atMax && !sel)
      // 화면을 읽어주는 쪽에는 숫자만이 아니라 어느 날인지를 알립니다.
      cell.setAttribute('aria-label', `${m}월 ${d}일 (${WEEKDAY[at.getDay()]})`)
      // 달의 첫날·마지막날. 기간이 달을 넘어갈 때 띠가 빈 칸으로 새어 나가지
      // 않도록 여기서 끊습니다(find-bar.css).
      if (d === 1) cell.classList.add('is-month-start')
      if (d === last) cell.classList.add('is-month-end')
      if (isToday(at)) cell.classList.add('is-today')
      if (pendingFrom === k) cell.classList.add('is-from')
      if (sel) {
        if (k === sel.from) cell.classList.add('is-from')
        if (k === sel.to) cell.classList.add('is-to')
        if (k !== sel.from && k !== sel.to) cell.classList.add('is-between')
      }
      if (pendingFrom === k || sel) cell.setAttribute('aria-pressed', 'true')
      week.append(cell)
    }

    // 마지막 주의 남는 칸도 채워야 줄의 둥근 모서리가 격자와 같은 자리에서 끝납니다.
    while (week.children.length < 7) week.append(el('span', 'calendar__day calendar__day--blank'))

    box.append(heads, grid)
    return box
  }

  /** offset 달 뒤의 [연, 월]. 12월을 넘으면 해가 바뀝니다. */
  function monthAfter(offset) {
    const t = todayInSeoul()
    const zero = t.y * 12 + (t.m - 1) + offset
    return [Math.floor(zero / 12), (zero % 12) + 1]
  }

  /** 앞으로 넘길 수 있는 달 수. 일 년이면 충분히 멀고, 그 뒤로는 고를 이유가 없습니다. */
  const MAX_MONTH_OFFSET = 11

  function renderCalendar() {
    if (!calendar) return
    // 폰에서는 한 달입니다 — 416 짜리 달력 둘이 들어가지 않고, 위아래로 쌓으면
    // 한 페이지짜리 시트에서 날짜만으로 화면 두 장이 됩니다.
    const count = sheetWidth.matches ? 1 : 2
    const bounds = {
      // 지난 달로는 가지 않습니다 — 이미 지난 날은 어차피 고를 수 없습니다.
      canPrev: monthOffset > 0,
      canNext: monthOffset < MAX_MONTH_OFFSET,
    }
    const months = []
    for (let i = 0; i < count; i += 1) {
      const [y, m] = monthAfter(monthOffset + i)
      const side = count === 1 ? 'only' : i === 0 ? 'left' : 'right'
      months.push(month(y, m, bounds, side))
    }
    calendar.replaceChildren(...months)
    renderDates()
  }

  /** 담은 것들의 알약 — 하나씩 × 로 뺍니다. 아래 안내 줄이 몇 개인지를 말합니다. */
  function renderDates() {
    if (dateHelp) {
      dateHelp.textContent = selections.length
        ? `하루 또는 기간으로 선택할 수 있어요 · 선택 ${selections.length}/${MAX_DATES}`
        : `하루 또는 기간으로 선택할 수 있어요 · 최대 ${MAX_DATES}개`
    }
    if (!datesList) return
    datesList.replaceChildren(
      ...selections.map((sel, i) => {
        const label = dateLabel(sel)
        const item = el('span', 'btn btn--outlined btn--small find-dates__item')
        item.append(el('span', 'btn__label', label))
        const remove = el('button', 'find-dates__remove')
        remove.type = 'button'
        remove.setAttribute('aria-label', `${label} 빼기`)
        remove.innerHTML = '<svg aria-hidden="true"><use href="#icon-close"></use></svg>'
        remove.addEventListener('click', () => {
          selections.splice(i, 1)
          renderCalendar()
          update()
        })
        item.append(remove)
        return item
      }),
    )
  }

  /**
   * 날짜 하나를 누른 결과.
   *
   *   이미 담긴 날(또는 그 기간 안)이면              →  그 담긴 것을 뺍니다
   *   담는 중이 아니고 이미 8개를 다 담았으면        →  누른 것을 무시합니다
   *   담는 중이 아니면                                →  거기서 새로 시작합니다
   *   담는 중에 같은 날을 다시 누르면                →  그 하루만 담습니다
   *   담는 중에 시작보다 앞을 누르면                  →  둘을 뒤바꿔 담습니다
   *   그 외(담는 중에 시작보다 뒤를 누르면)           →  거기가 끝이 되어 담깁니다
   *
   * 시작보다 앞선 날짜를 눌렀을 때 시작과 끝을 뒤바꿉니다. 18일을 누른 뒤 17일을
   * 누른 사람은 "17~18일"을 고른 것이지 "17일부터 다시"가 아닙니다 — 달력에는
   * 앞뒤가 없고 누른 두 날 사이가 곧 기간입니다.
   */
  /**
   * 담은 것들을 날짜 차례로 세웁니다.
   *
   * 고른 차례로 두면 9월과 10월이 섞여 서서, 알약 줄이 달력과 다른 순서로 읽힙니다 —
   * 무엇을 담았는지 확인하려면 여섯 개를 다 훑어야 합니다. 시작일이 같으면 끝이
   * 이른 것을 앞에 둡니다.
   */
  const byDate = (a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : a.to < b.to ? -1 : a.to > b.to ? 1 : 0)

  function add(from, to) {
    // 같은 기간을 두 번 담지 않습니다 — 알약이 둘 서고 개수만 하나 더 셉니다.
    if (selections.some((sel) => sel.from === from && sel.to === to)) return
    selections.push({ from, to })
    selections.sort(byDate)
  }

  function pick(k) {
    const sel = pendingFrom ? null : selectionAt(k)
    if (sel) {
      selections = selections.filter((s) => s !== sel)
    } else if (!pendingFrom) {
      if (selections.length >= MAX_DATES) return
      pendingFrom = k
    } else if (k === pendingFrom) {
      add(k, k)
      pendingFrom = null
    } else if (k < pendingFrom) {
      add(k, pendingFrom)
      pendingFrom = null
    } else {
      add(pendingFrom, k)
      pendingFrom = null
    }
    renderCalendar()
    update()
  }

  /**
   * 날짜 조건을 처음 상태로. 담은 것과 담는 중인 것을 비우고, 보고 있던 달도
   * 이번 달로 되돌립니다.
   *
   * 담은 날짜만 지우면 달력은 12월에 선 채로 남습니다. 지웠다는 말과 달리 화면에는
   * 이번 달이 없고, 폰에서는 달력이 한 달만 서서 오늘이 아예 보이지 않습니다 —
   * 지운 사람이 다시 고르려면 넘겨 온 만큼 되돌아가야 합니다.
   *
   * 시트의 초기화, 빈 목록의 필터 초기화, 날짜 칸의 지우기가 모두 이것을 씁니다 —
   * 지우는 자리마다 되돌리는 범위가 다르면 어느 것을 눌렀는지에 따라 달력이
   * 남기도 하고 돌아가기도 합니다.
   */
  function clearDates() {
    selections = []
    pendingFrom = null
    monthOffset = 0
    renderCalendar()
  }

  calendar?.addEventListener('click', (e) => {
    const nav = e.target.closest('.calendar__nav')
    if (nav && !nav.disabled) {
      monthOffset = Math.max(0, monthOffset + Number(nav.dataset.findMonth))
      renderCalendar()
      return
    }
    const cell = e.target.closest('.calendar__day')
    if (cell && !cell.disabled && cell.dataset.date) pick(cell.dataset.date)
  })

  /* ---- 팝오버 여닫기(961~) ------------------------------------------------
     showModal() 을 쓸 수 없어(find-bar.css) 그것이 주던 것들을 여기서 냅니다 —
     Esc, 바깥 누르기, 초점 되돌리기. 좁은 화면에서는 팝오버가 아예 열리지
     않습니다 — 같은 섹션이 통합 필터 시트 안에 서 있습니다. */

  let openId = null

  const fieldOf = (id) => root.querySelector(`[data-find-open="${id}"]`)
  const panelOf = (id) => root.querySelector(`#${CSS.escape(id)}`)

  const focusables = (box) =>
    [...box.querySelectorAll('button, [href], input, select, [tabindex]')].filter(
      (node) => !node.disabled && node.tabIndex !== -1 && node.offsetParent !== null,
    )

  function closePanel({ restore = true } = {}) {
    if (!openId) return
    const panel = panelOf(openId)
    const field = fieldOf(openId)
    // 판 안에 초점이 있을 때만 되돌립니다. 다른 곳을 눌러 닫은 사람의 초점을
    // 빼앗아 바로 끌어오면, 누른 자리에서 하려던 일이 끊깁니다.
    const inside = panel.contains(document.activeElement)
    panel.hidden = true
    field?.setAttribute('aria-expanded', 'false')
    openId = null
    fields.classList.remove('is-open')
    if (restore && inside) field?.focus()

    /* 여닫는 사이 목록이 줄어 화면이 따라 움직였을 수 있습니다. 그 거리는
       사람이 되짚은 것이 아니므로 버리고, 지금 위치에서 다시 셉니다. */
    moved = 0
    lastY = Math.max(0, window.scrollY)
  }

  function openPanel(id) {
    if (openId === id) return closePanel()
    closePanel()
    const panel = panelOf(id)
    const field = fieldOf(id)
    if (!panel) return
    panel.hidden = false
    field?.setAttribute('aria-expanded', 'true')
    openId = id
    /* 팝오버가 열려 있는 동안 바는 흰 바탕에 테두리를 두릅니다 — 아래에 뜬 흰
       팝오버와 한 덩어리로 읽혀야 합니다(find-bar.css). */
    fields.classList.add('is-open')
    /* 초점은 팝오버가 받습니다 — 열자마자 첫 알약이나 날짜에 테가 둘리면 그것이
       여기서 해야 할 일인 양 보입니다(dialog-focus.js 와 같은 이유입니다). */
    panel.focus()
  }

  /* ---- 통합 필터 시트(~960) ----------------------------------------------
     열 때 지금 조건을 베껴 두고, 고치는 동안에는 개수만 앞서 바뀝니다. 닫기·배경·
     뒤로가기로 나가면 베껴둔 것으로 되돌리고, `모임 N개 보기` 를 누르면 그대로
     둔 채 닫습니다 — 시트를 여는 것만으로 목록이 바뀌어서는 안 됩니다.

     뒤로가기를 그 되돌림에 쓰려면 시트가 방문 기록에 한 칸을 차지해야 합니다.
     닫는 길이 여럿이라(손잡이·배경·Esc·CTA) 각자 닫게 두지 않고, 모두
     history.back() 을 부르고 실제로 닫는 일은 popstate 한 곳에서 합니다. */

  let draft = null
  let pendingApply = false

  const applyBtn = root.querySelector('[data-find-apply]')
  const applyLabel = root.querySelector('[data-find-apply-label]')

  function snapshot() {
    return {
      area: [...root.querySelectorAll('input[name="area"]:checked')].map((i) => i.value),
      seats: root.querySelector('input[name="seats"]:checked')?.value ?? 'one',
      pick: [...root.querySelectorAll('input[name="pick"]:checked')].map((i) => i.value),
      dates: selections.map((sel) => ({ ...sel })),
    }
  }

  function restore(snap) {
    for (const input of root.querySelectorAll('input[name="area"], input[name="pick"]')) {
      input.checked = snap[input.name === 'area' ? 'area' : 'pick'].includes(input.value)
    }
    const seats = root.querySelector(`input[name="seats"][value="${snap.seats}"]`)
    if (seats) seats.checked = true
    selections = snap.dates
    pendingFrom = null
  }

  function moveSections(to) {
    for (const name of SECTIONS) {
      const node = sections.get(name)
      if (node) (to === 'sheet' ? sheetBody : hosts.get(name)).append(node)
    }
  }

  function openSheet() {
    if (!sheet || draft) return
    closePanel({ restore: false })
    draft = snapshot()
    moveSections('sheet')
    sheet.hidden = false
    lockScroll()
    // 열자마자 첫 알약에 테가 둘리지 않도록 초점은 판이 받습니다.
    sheetPanel?.focus()
    renderCalendar()
    setDraftCount()
    history.pushState({ findSheet: true }, '')
  }

  /** 닫아 달라는 요청. 실제로 닫는 것은 popstate 입니다. */
  function requestClose({ apply = false } = {}) {
    if (!draft) return
    pendingApply = apply
    history.back()
  }

  function finishClose() {
    if (!draft) return
    if (!pendingApply) restore(draft)
    draft = null
    pendingApply = false
    moveSections('host')
    sheet.hidden = true
    unlockScroll()
    renderCalendar()
    update()
  }

  addEventListener('popstate', () => {
    if (draft) finishClose()
  })

  /* 시트의 CTA 는 지금 고른 조건이 몇 개를 남기는지를 미리 말합니다. 하나도
     남지 않으면 숫자 대신 그 사실을 적고 버튼을 끕니다 — "모임 0개 보기" 는
     누를 수 있는 얼굴을 하고 있지만, 눌러도 빈 목록으로 닫힐 뿐입니다.
     조건을 더 고치라는 말이 버튼 자리에서 나와야 합니다. */
  function setDraftCount() {
    const n = countMatches(state())
    if (applyLabel) {
      applyLabel.textContent = n ? `모임 ${n}개 보기` : '조건에 맞는 모임이 없어요'
    }
    // 흐림 25% 는 filled 버튼의 기본 disabled 모습입니다(button.css).
    if (applyBtn) applyBtn.disabled = n === 0
  }

  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-find-sheet-close]')) {
      requestClose()
      return
    }
    if (e.target.closest('[data-find-apply]')) {
      requestClose({ apply: true })
      return
    }
    const opener = e.target.closest('[data-find-open]')

    /* 좁은 화면에서는 바가 통째로 한 자리입니다 — 칸 위든, 칸 사이든, 여백이든
       어디를 눌러도 같은 통합 필터 시트가 올라옵니다. 요약이 한 줄로 접혀 있어
       "지역"과 "날짜"의 경계가 눈에 보이지 않는데, 그 보이지 않는 선을 손가락이
       맞춰 짚어야 열리면 누른 사람은 화면이 죽은 줄로 압니다.
       × 는 이 폭에서 나오지 않으므로(find-bar.css) 가로챌 것이 없습니다. */
    if (sheetWidth.matches) {
      if (opener || e.target.closest('.find-bar')) openSheet()
      return
    }
    if (opener) openPanel(opener.dataset.findOpen)
  })

  // 팝오버와 칸 밖을 누르면 닫습니다. 넓은 화면에는 어둠이 없어 이것이 유일한 길입니다.
  document.addEventListener('click', (e) => {
    if (!openId) return
    /* 눌린 것이 이미 문서에서 빠졌으면 밖을 누른 것이 아닙니다. 달력은 날짜를
       누르는 순간 다시 그려지므로, 눌린 칸은 이 줄에 닿기 전에 문서에서
       사라집니다 — 그러면 기간의 끝을 고를 수가 없었습니다. */
    if (!e.target.isConnected) return
    if (e.target.closest('.find-bar__panel, [data-find-open]')) return
    closePanel({ restore: false })
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (draft) {
        e.preventDefault()
        requestClose()
        return
      }
      if (openId) {
        e.preventDefault()
        closePanel()
      }
      return
    }
    /* 시트가 올라와 있는 동안에는 초점이 그 안을 벗어나지 않게 합니다. 팝오버는
       가두지 않습니다 — 바 아래에 붙은 팝오버는 뒤 화면을 가리지 않아, Tab 으로
       빠져나가 목록을 읽는 것이 자연스럽습니다. */
    if (e.key !== 'Tab' || !draft || !sheetPanel) return
    const stops = focusables(sheetPanel)
    if (!stops.length) return
    const first = stops[0]
    const last = stops[stops.length - 1]
    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    } else if (e.shiftKey && (document.activeElement === first || document.activeElement === sheetPanel)) {
      e.preventDefault()
      last.focus()
    }
  })

  /* 폭이 경계를 넘으면 조건을 고르는 방식 자체가 바뀝니다(즉시 반영 ↔ 한꺼번에
     적용). 열린 채로 갈아타게 두면 섹션이 어느 쪽에 있는지 알 수 없어집니다. */
  sheetWidth.addEventListener('change', () => {
    closePanel({ restore: false })
    if (draft) requestClose()
    renderCalendar()
  })

  /* ---- 조건 ------------------------------------------------------------ */

  const sort = root.querySelector('[data-find-sort]')

  /* 고른 차례. 문서에서 읽으면 늘 놓인 차례로 나오는데, 칸에는 "먼저 고른 것 외 N"
     으로 적어야 합니다 — 홍대를 고르고 광화문을 더한 사람에게 "광화문 외 1" 이라고
     적으면 자기가 고른 차례와 어긋납니다. 주소로 되살릴 때도 그 차례 그대로입니다. */
  const order = { area: [], tag: [], pick: [] }

  const checked = (name) => {
    const on = [...root.querySelectorAll(`input[name="${name}"]:checked`)].map((i) => i.value)
    const seen = order[name]
    if (!seen) return on
    // 알던 차례를 먼저, 이번에 새로 켜진 것은 뒤에 붙입니다.
    return [...seen.filter((v) => on.includes(v)), ...on.filter((v) => !seen.includes(v))]
  }

  /** 지금 켜진 것들로 차례를 다시 맞춥니다. 꺼진 것은 빠지고, 새로 켜진 것은 뒤로. */
  function noteOrder() {
    for (const name of Object.keys(order)) order[name] = checked(name)
  }

  /* 지역의 기본값은 "수도권 전체" 입니다.
     지금 여는 모임이 대부분 수도권이라, 처음 들어온 사람이 전국을 훑고 다시 좁히는
     것보다 여기서 시작해 넓히는 편이 짧습니다. 그래서 비어 있는 지역이라는 상태를
     두지 않고, 비면 늘 이 값으로 되돌립니다. 이 값 하나만 걸린 것은 조건을 걸지
     않은 것과 같게 셉니다 — 주소에 싣지 않고, 바를 넓히지도 × 를 보이지도 않습니다. */
  const DEFAULT_AREA = REGIONS[0]

  const isDefaultAreas = (areas) => !areas.length || (areas.length === 1 && areas[0] === DEFAULT_AREA)

  function ensureArea() {
    if (root.querySelector('input[name="area"]:checked')) return
    const capital = root.querySelector(`input[name="area"][value="${CSS.escape(DEFAULT_AREA)}"]`)
    if (capital) capital.checked = true
  }

  const state = () => ({
    areas: checked('area'),
    kind: kindOf(),
    tags: checked('tag'),
    seats: root.querySelector('input[name="seats"]:checked')?.value ?? 'one',
    picks: checked('pick'),
    dates: selections.map((sel) => ({ ...sel })),
    sort: SORTS.includes(sort?.value) ? sort.value : SORTS[0],
  })

  /**
   * 칸마다 세 가지를 함께 정합니다 — 적을 글자, 안내로 흐리게 둘지(muted),
   * 그 자리에서 바로 지우는 × 를 보일지(clearable).
   *
   * 단위(건·곳·개)는 붙이지 않습니다 — Figma 의 예시가 셋 다 단위 없이 적고,
   * 좁은 화면에서는 그 두 글자가 값을 밀어냅니다.
   */
  function summaries(s) {
    // 권역과 묶음은 이름만으로는 범위가 드러나지 않아 "전체"를 붙여 적습니다.
    const label = (value) => (isRegion(value) || isGroup(value) ? `${value} 전체` : value)
    const many = (list) => (list.length > 1 ? `${list[0]} 외 ${list.length - 1}` : list[0])
    const date = s.dates.length ? many(s.dates.map(dateLabel)) : null

    return {
      area: {
        text: s.areas.length ? many(s.areas.map(label)) : `${DEFAULT_AREA} 전체`,
        muted: false,
        // 기본값뿐이면 지울 것이 없습니다.
        clearable: !isDefaultAreas(s.areas),
      },
      date: { text: date ?? '날짜 전체', muted: !date, clearable: !!date },
      seats: {
        text: s.seats === 'two' ? '친구와 갈래요' : '혼자 갈래요',
        muted: false,
        clearable: s.seats === 'two',
      },
    }
  }

  function writeUrl(s) {
    const url = new URL(location.href)
    const set = (name, value) => {
      if (value) url.searchParams.set(name, value)
      else url.searchParams.delete(name)
    }
    // 기본값(수도권 전체)은 싣지 않습니다 — 링크가 짧아지고, 주소에 지역이 없는
    // 것과 기본값이 같은 뜻이 되어 새로 열어도 같은 목록이 나옵니다.
    set('area', isDefaultAreas(s.areas) ? '' : s.areas.join(','))
    set('kind', s.kind)
    set('tag', s.tags.join(','))
    set('pick', s.picks.join(','))
    set('seats', s.seats === 'two' ? 'two' : '')
    // 담긴 것마다 하루면 그 하루만, 기간이면 밑줄로 시작과 끝을 잇습니다.
    set('date', s.dates.map((d) => (d.from === d.to ? d.from : `${d.from}_${d.to}`)).join(','))
    // 기본값은 적지 않습니다. 아무 조건도 없는 목록의 주소가 깨끗해야 합니다.
    set('sort', s.sort === SORTS[0] ? '' : s.sort)
    history.replaceState(history.state, '', `${url.pathname.split('/').pop()}${url.search}`)
  }

  /** 칸에 적히는 글자만 다시 씁니다. 붙고 풀릴 때도 이것만 부르면 됩니다. */
  function renderSummaries(s) {
    for (const [name, { text, muted, clearable }] of Object.entries(summaries(s))) {
      const slot = root.querySelector(`[data-find-summary="${name}"]`)
      if (!slot) continue
      slot.textContent = text
      const field = root.querySelector(`[data-find-field="${name}"]`)
      field?.classList.toggle('is-empty', muted)
      /* 자리는 늘 두고 보이기만 끕니다(find-bar.css) — display 로 빼면 칸 폭이
         바뀌어 옆 칸 글자까지 밀립니다. */
      const clear = field?.querySelector('.find-bar__clear')
      if (clear) clear.classList.toggle('is-empty', !clearable)
    }
  }

  /** 걸린 추천 조건 — 바의 아이콘에는 점만, 목록 위에는 무엇이 걸렸는지를 적습니다. */
  const applied = root.querySelector('[data-find-applied]')
  const badge = root.querySelector('[data-find-picks-badge]')

  function renderPicks(s) {
    if (badge) badge.hidden = s.picks.length === 0
    if (!applied) return
    applied.hidden = s.picks.length === 0
    applied.replaceChildren(
      ...s.picks.filter((value) => PICKS[value]).map((value) => {
        const { label, icon } = PICKS[value]
        const item = el('span', 'btn btn--outlined btn--medium find-applied__item')
        if (icon) item.innerHTML = `<svg class="btn__icon" aria-hidden="true"><use href="#icon-${icon}"></use></svg>`
        item.append(el('span', 'btn__label', label))
        const remove = el('button', 'find-applied__remove')
        remove.type = 'button'
        remove.setAttribute('aria-label', `${label} 조건 빼기`)
        remove.innerHTML = '<svg aria-hidden="true"><use href="#icon-close"></use></svg>'
        remove.addEventListener('click', () => {
          const input = root.querySelector(`input[name="pick"][value="${value}"]`)
          if (input) input.checked = false
          update()
        })
        item.append(remove)
        return item
      }),
    )
  }

  /** 폰에서 퀵필터가 붙는 자리 — 필터바 바로 아래입니다(find.css). */
  function measureTypesTop() {
    if (!typesBox) return
    const top = parseFloat(getComputedStyle(head).insetBlockStart) || 0
    root.style.setProperty('--_find-types-top', `${Math.round(top + head.offsetHeight)}px`)
  }

  function update() {
    // 지역이 비었으면 기본값으로 되돌립니다. 지우는 길이 여럿이라 각자 되돌리게
    // 두지 않고 이 한 곳에서 채웁니다.
    ensureArea()
    // 무엇이 대표로 적힐지는 고른 차례가 정합니다(order). 상태를 읽기 전에 맞춥니다.
    noteOrder()
    const s = state()

    /* 시트가 올라와 있는 동안에는 개수만 앞서 바뀝니다 — 바의 요약도, 목록 위
       알약도, 주소도 그대로 둡니다. `모임 N개 보기` 를 눌러야 한꺼번에 걸립니다. */
    if (draft) {
      setDraftCount()
      return
    }

    renderSummaries(s)
    renderPicks(s)
    /* 값이 하나라도 있으면 폰의 요약이 두 줄이 됩니다(find-bar.css). 넓은 화면의
       바는 이것과 상관없이 늘 912 입니다 — 조건을 고를 때마다 바가 좌우로 자라면,
       목록을 좁히려고 누른 것이 화면 위쪽을 움직이는 일이 됩니다. */
    const hasValue = !isDefaultAreas(s.areas) || s.dates.length || s.seats === 'two'
    fields.classList.toggle('has-value', Boolean(hasValue))
    measureTypesTop()

    writeUrl(s)
    root.dispatchEvent(new CustomEvent('find:change', { detail: s, bubbles: true }))
  }

  /**
   * 다 고른 것은 아무것도 고르지 않은 것과 같습니다.
   *
   * 한 묶음의 지역을 전부 켜면 걸리는 결과가 그 묶음의 "전체"와 한 글자도 다르지
   * 않은데, 화면에는 "전체"가 꺼진 채 알약이 검게 켜져 있고 칸에는 "서울 강남 외 8"
   * 이 적힙니다 — 같은 목록을 두 가지 상태로 말하는 셈입니다.
   */
  function collapseWhenAll() {
    const all = [...root.querySelectorAll('input[name="area"]')].filter(
      (input) => !isRegion(input.value) && !isGroup(input.value),
    )
    if (all.length && all.every((input) => input.checked)) {
      for (const input of all) input.checked = false
    }
  }

  /**
   * 위와 아래는 함께 설 수 없습니다.
   *
   * "수도권 전체"와 그 안의 "강남"을 같이 켜두면 걸리는 결과는 전체 하나만 켠 것과
   * 똑같은데 칸에는 "수도권 전체 외 1"이라고 적혀, 하나가 더 걸린 것처럼 읽힙니다.
   */
  function untangleAreas(input) {
    if (input.name !== 'area' || !input.checked) return
    const up = ancestorsOf(input.value)
    for (const other of root.querySelectorAll('input[name="area"]:checked')) {
      if (other === input) continue
      if (up.includes(other.value) || ancestorsOf(other.value).includes(input.value)) {
        other.checked = false
      }
    }
  }

  root.addEventListener('change', (e) => {
    const input = e.target
    if (!(input instanceof HTMLInputElement)) return
    if (input.name === 'area') {
      untangleAreas(input)
      collapseWhenAll()
    }
    // 다른 유형으로 바꾸면 하위 조건은 그 유형의 것이 아니므로 함께 지웁니다.
    if (input.name === 'kind') renderTags()
    update()
  })

  sort?.addEventListener('change', update)

  /** 조건을 하나도 걸지 않은 처음 상태로. 시트의 초기화와 빈 목록의 버튼이 함께 씁니다. */
  function clearAll() {
    for (const input of root.querySelectorAll('input[name="area"], input[name="pick"], input[name="tag"]')) {
      input.checked = false
    }
    const one = root.querySelector('input[name="seats"][value="one"]')
    if (one) one.checked = true
    const anyKind = root.querySelector('input[name="kind"][value=""]')
    if (anyKind) anyKind.checked = true
    renderTags()
    clearDates()
    update()
  }

  root.addEventListener('click', (e) => {
    const clear = e.target.closest('[data-find-clear]')
    if (!clear) return
    const which = clear.dataset.findClear
    if (which === 'all') {
      clearAll()
      return
    }
    if (which === 'date') {
      clearDates()
    } else if (which === 'seats') {
      const one = root.querySelector('input[name="seats"][value="one"]')
      if (one) one.checked = true
    } else {
      for (const input of root.querySelectorAll(`input[name="${which}"]`)) input.checked = false
    }
    update()
  })

  document.addEventListener('find:clear', clearAll)

  /* ---- 붙었는지 알리기 --------------------------------------------------
     스크롤해 바가 GNB 아래에 붙는 순간 머리에 is-sticky 를 답니다. 줄어드는 모양은
     CSS 가 정합니다(find-bar.css) — 여기서는 "지금 붙어 있다"만 알립니다.

     position:sticky 는 붙어 있는 상태를 CSS 로 노출하지 않아 재야 합니다. 머리의
     위쪽을 직접 재지 않는 것은, 붙어 있는 동안에는 그 값이 늘 붙는 자리와 같아
     스크롤이 0 일 때와 구분되지 않기 때문입니다. 대신 머리 바로 위에 높이 0 짜리
     표식을 하나 두고, 그것이 GNB 아래로 지나갔는지만 봅니다. */

  /** 머리가 붙는 자리. components.gnb 의 maxHeight 와 같은 값입니다(find.css 도 같은 수를 씁니다). */
  const GNB_HEIGHT = 72

  let stuck = null
  let passed = false

  const sentinel = el('div', 'find-head__sentinel')
  head.before(sentinel)

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)')

  /* ---- 고른 직후의 되튐 -------------------------------------------------
     조건을 하나 고르면 목록이 그만큼 짧아집니다. 문서가 줄면 브라우저는 스크롤을
     위로 당기는데, 그것이 스크롤 이벤트로 그대로 올라와 "사람이 화면을 되돌려
     올렸다"로 읽혔습니다 — 고르는 도중에 바가 물러나고 팝오버까지 닫혀 버렸습니다. */
  const SETTLE = 400
  let settleUntil = 0
  const settling = () => performance.now() < settleUntil
  root.addEventListener('change', () => {
    settleUntil = performance.now() + SETTLE
  })

  function applyStuck() {
    // 폰에서는 머리가 늘 붙어 있고 줄어들지 않습니다 — 줄일 것이 없습니다.
    const next = passed && !sheetWidth.matches
    if (next === stuck) return
    const first = stuck !== null
    stuck = next

    /* 줄어드는(또는 되돌아오는) 폭을 실제로 재서 그 사이를 잇습니다. CSS 만으로는
       되지 않습니다 — 붙었을 때의 폭이 내용을 따라가는 max-content 라,
       auto ↔ max-content 사이에 보간할 값이 없어 폭이 툭 바뀝니다. */
    const from = fields.getBoundingClientRect().width
    head.classList.toggle('is-sticky', next)
    if (first && !reduceMotion.matches) {
      const to = fields.getBoundingClientRect().width
      if (Math.round(from) !== Math.round(to)) {
        fields.animate(
          [{ inlineSize: `${from}px` }, { inlineSize: `${to}px` }],
          { duration: 240, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
        )
      }
    }

    /* 줄어드는 동안 열려 있던 팝오버는 바와 함께 자리가 어긋나므로 닫습니다.
       다만 조건을 고른 직후의 되튐일 때는 두고 봅니다 — 그때 화면이 움직인 것은
       사람이 스크롤해서가 아니라 목록이 줄어 문서가 짧아진 탓입니다. */
    if (openId && !settling()) closePanel({ restore: false })
  }

  /* ---- 스크롤 방향 ------------------------------------------------------
     한 번의 움직임이 아니라 한 방향으로 쌓인 거리를 봅니다. 8px 만 움직여도 바로
     반응하면, 손을 떼는 순간의 흔들림이나 한 칸 되짚어 보는 정도에도 화면 위가
     흔들립니다. 방향이 바뀌면 쌓아둔 것은 버립니다.

       넓은 화면  아래로 내려가는 동안 바는 남아 있고, 위로 되돌아 올릴 때 물러납니다 —
                  되돌아 올린다는 것은 이미 지나온 목록을 다시 본다는 뜻이라, 그동안은
                  목록이 한 줄이라도 더 보이는 편이 낫습니다.
       폰         아래로 내려가면 퀵필터가 접히고 필터바만 남습니다. 위로 올리면
                  퀵필터가 다시 붙습니다 — 다른 유형을 보려는 뜻일 때가 많습니다.
                  결과 수와 소팅은 따라오지 않습니다(find.css).

     맨 위 가까이(TOP_ZONE)에서는 무조건 다 보입니다. */

  const HIDE_DISTANCE = 64
  const SHOW_DISTANCE = 16
  /** 폰에서 방향이 바뀌었다고 볼 거리. 정책이 12~16 을 이릅니다. */
  const TYPES_DISTANCE = 14
  const TOP_ZONE = 80
  let lastY = Math.max(0, window.scrollY)
  let moved = 0
  let hidden = false
  let collapsed = false
  let queued = false

  function setHidden(next) {
    if (next === hidden) return
    hidden = next
    head.classList.toggle('is-hidden', next)
    // 물러나는 동안 열려 있던 팝오버만 허공에 떠 있지 않도록 함께 닫습니다.
    if (next && openId) closePanel({ restore: false })
  }

  function setCollapsed(next) {
    if (next === collapsed) return
    collapsed = next
    typesBox?.classList.toggle('is-collapsed', next)
  }

  function measureScroll() {
    queued = false
    const y = Math.max(0, window.scrollY)
    const dy = y - lastY
    lastY = y
    if (!dy) return

    // 고른 직후의 되튐은 사람이 되돌려 올린 것이 아니므로 세지 않습니다.
    if (settling()) {
      moved = 0
      return
    }

    // 맨 위 가까이에서는 무조건 다 보입니다.
    if (y <= TOP_ZONE) {
      moved = 0
      setHidden(false)
      setCollapsed(false)
      return
    }

    if (dy < 0 !== moved < 0) moved = 0
    moved += dy

    if (moved <= -HIDE_DISTANCE) setHidden(true)
    else if (moved >= SHOW_DISTANCE) setHidden(false)

    if (moved >= TYPES_DISTANCE) {
      setCollapsed(true)
      collapseTypes()
    } else if (moved <= -TYPES_DISTANCE) {
      setCollapsed(false)
      collapseTypes()
    }
  }

  addEventListener(
    'scroll',
    () => {
      if (queued) return
      queued = true
      requestAnimationFrame(measureScroll)
    },
    { passive: true },
  )

  new IntersectionObserver(
    ([entry]) => {
      passed = !entry.isIntersecting
      applyStuck()
    },
    { rootMargin: `-${GNB_HEIGHT}px 0px 0px 0px` },
  ).observe(sentinel)

  sheetWidth.addEventListener('change', applyStuck)
  // 바의 높이가 바뀌면(한 줄 ↔ 두 줄) 퀵필터가 붙는 자리도 함께 옮겨야 합니다.
  new ResizeObserver(measureTypesTop).observe(head)

  /* ---- 주소에 적혀 있던 조건 ------------------------------------------- */

  // 생년월일이 없으면 걸 수 있는 조건이 아닙니다 — 눌러도 아무것도 걸러지지 않는
  // 알약을 남겨두면 조건이 걸린 줄 알고 목록을 믿게 됩니다.
  if (!ME) root.querySelector('[data-find-pick="myage"]')?.remove()

  const q = new URLSearchParams(location.search)
  const listOf = (name) => (q.get(name) ?? '').split(',').filter(Boolean)

  for (const name of ['area', 'pick']) {
    for (const value of listOf(name)) {
      const input = root.querySelector(`input[name="${name}"][value="${CSS.escape(value)}"]`)
      if (input) input.checked = true
    }
  }
  const kindParam = root.querySelector(`input[name="kind"][value="${CSS.escape(q.get('kind') ?? '')}"]`)
  if (kindParam) kindParam.checked = true
  renderTags()
  for (const value of listOf('tag')) {
    const input = root.querySelector(`input[name="tag"][value="${CSS.escape(value)}"]`)
    if (input) input.checked = true
  }
  if (q.get('seats') === 'two') {
    const two = root.querySelector('input[name="seats"][value="two"]')
    if (two) two.checked = true
  }
  // 담긴 것마다 하루면 밑줄 없이, 기간이면 `시작_끝` 입니다. 형식이 잘못됐거나
  // 8개를 넘긴 만큼은 조용히 버립니다 — 주소를 손으로 고쳐 들어와도 화면이
  // 깨지지 않아야 합니다.
  const dateParam = q.get('date')
  if (dateParam) {
    selections = dateParam
      .split(',')
      .map((entry) => {
        const [from, to = from] = entry.split('_')
        return isKey(from) && isKey(to) && to >= from ? { from, to } : null
      })
      .filter(Boolean)
      .slice(0, MAX_DATES)
      .sort(byDate)
  }
  if (sort && SORTS.includes(q.get('sort'))) sort.value = q.get('sort')

  renderCalendar()
  update()
}
