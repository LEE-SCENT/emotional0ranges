/**
 * 찾기 화면의 조건 바 — 판을 여닫고, 달력을 그리고, 고른 조건을 한 곳에서 말합니다.
 *
 *   import { initFindBar } from './components/find-bar.js'
 *   initFindBar()
 *
 * 고른 것이 무엇인지는 이 파일이 따로 세어두지 않습니다. 판 안의 체크박스·라디오가
 * 곧 상태이고(chip.css), 날짜만 이 안에 남습니다 — 달력에는 켜고 끄는 입력이 없어
 * 브라우저에 맡길 자리가 없습니다.
 *
 * 조건이 바뀌면 `find:change` 를 올립니다. 무엇을 걸러 어떤 차례로 보여줄지는
 * find.js 가 그 이벤트를 받아서 합니다 — 조건을 고르는 일과 목록을 그리는 일이
 * 한 파일에 있으면, 조건이 하나 늘 때마다 목록을 그리는 코드를 함께 고치게 됩니다.
 *
 * 지역·모임 종류의 선택지는 마크업에 적어두지 않고 데이터에서 만듭니다. 적어두면
 * 지역이 하나 열릴 때 목록에는 나오는데 조건에는 없는 지역이 생깁니다.
 *
 * 날짜는 하루만 고를 수도, 기간으로 고를 수도 있고, 그렇게 고른 것을 최대 8번까지
 * 담을 수 있습니다("9월 5일" 과 "9월 10일~12일" 을 동시에 걸 수 있습니다) — 담긴
 * 것끼리는 OR 입니다. 하나로 묶으면(9.5~9.12) 그 사이의 못 가는 날까지 걸리므로,
 * 실제로 가려는 날들만 따로 담을 수 있어야 합니다.
 *
 * 주소에도 같은 조건을 적어둡니다(?area=&date=…). 링크를 복사하거나 새 탭으로
 * 열었을 때 같은 목록이 나와야 하고, 뒤로 돌아왔을 때 고른 것이 남아 있어야 합니다.
 *
 * 판이 서는 자리는 폭에 따라 다릅니다. 넓은 화면에서는 눌린 칸 아래에 하나씩 붙고,
 * 좁은 화면에서는 네 조건이 한 판 안에 층으로 서서 한 번에 정할 수 있습니다 —
 * 폰에서 판을 네 번 열고 닫는 대신 한 번 열어 지역·날짜·모임 유형·남은자리를
 * 차례로 펼칩니다. 마크업은 하나이고, 폭이 바뀌면 같은 판을 옮겨 답니다(dock).
 */

import { PRODUCTS, REGIONS, areaOf, cityOf, openMeetups, regionOf } from './products.js?v=a3926563'
import { dateAfter, dateKey, isToday, todayInSeoul } from './schedule.js?v=a9e9003f'
import { lockScroll, unlockScroll } from './scroll-lock.js?v=40a2cd35'
import { initSegmentedControl } from './segmented-control.js?v=bbd7c4b8'

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']
const SORTS = ['soon', 'price', 'urgent']

/** 머리가 붙는 자리. components.gnb 의 maxHeight 와 같은 값입니다(find.css 도 같은 수를 씁니다). */
const GNB_HEIGHT = 72

const parseKey = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const isKey = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s ?? '')

/**
 * 바에 적는 짧은 날짜: 9.5(금)
 *
 * 목록 카드의 `9월 5일 (금)` 보다 짧습니다. 칸 하나에 시작과 끝이 함께 들어가야
 * 하는데, 긴 모양으로 두면 기간을 고른 순간 글자가 잘립니다.
 */
const shortDay = (at) => `${at.getMonth() + 1}.${at.getDate()}(${WEEKDAY[at.getDay()]})`

const el = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

/**
 * 격자 안의 낱장 버튼 하나 — Button 컴포넌트(ghost/large)를 그대로 쓰고, 켜진
 * 모습은 CSS 의 :has(:checked) 가 맡습니다(find-bar.css).
 */
function btnGridItem(name, value, label, type = 'checkbox') {
  const wrap = el('label', 'btn btn--ghost btn--medium find-btn-grid__item')
  const input = document.createElement('input')
  input.className = 'sr-only'
  input.type = type
  input.name = name
  input.value = value
  wrap.append(input, el('span', 'btn__label', label))
  return wrap
}

/**
 * "어디서든"/"전체" — 상태가 아니라 그 칸의 선택을 모두 지우는 버튼입니다.
 * 입력이 아니라서 :has(:checked) 를 못 쓰니, update() 가 지금 그 칸이 비어
 * 있는지 보고 aria-pressed 를 직접 붙였다 뗍니다.
 */
function resetBtn(label, which) {
  const btn = el('button', 'btn btn--ghost btn--medium find-btn-grid__item find-btn-grid__reset')
  btn.type = 'button'
  btn.dataset.findClear = which
  btn.append(el('span', 'btn__label', label))
  return btn
}

export function initFindBar(root = document.querySelector('[data-find]')) {
  if (!root || root.dataset.findReady) return
  root.dataset.findReady = '1'

  /* 조건을 고르는 자리가 머리 하나가 아닙니다. 정렬 줄의 "전체" 알약과 추천 조건
     (프로모션·마감 임박·친구 동반·내 나이)은 목록 바로 위, 머리 밖에 있습니다 —
     조건 바와 한 몸으로 움직여야 하므로(친구 동반 ↔ 둘이 갈래요) 세고 듣는 범위는
     화면 전체입니다. 머리에만 귀를 대면 그 알약들은 눌러도 아무 일도 없습니다. */
  const scope = root.closest('.find') ?? document

  const meetups = openMeetups()
  /* 지난 날만 고를 수 없습니다. 모임이 없는 날까지 막아두면 "9월 13일 이후는
     왜 눌리지 않지" 하고 달력을 의심하게 되는데, 실제로는 아직 그 날 모임이
     열리지 않았을 뿐입니다 — 고르면 빈 목록이 그 사실을 말합니다. */
  const todayKey = dateKey(dateAfter(0))

  /* ---- 판 안의 선택지 -------------------------------------------------- */

  const areaBody = root.querySelector('[data-find-body="area"]')
  if (areaBody) {
    const areas = [...new Set(meetups.map((m) => areaOf(m.s.place)))]
    const byRegion = new Map()
    for (const area of areas) {
      const region = regionOf(area)
      if (!byRegion.has(region)) byRegion.set(region, [])
      byRegion.get(region).push(area)
    }

    /* 동네가 여럿인 도시에는 그 도시 전체를 고르는 항목을 하나 더 둡니다
       (Figma 의 "서울"). 동네를 하나씩 다 누르지 않아도 되는 자리이고,
       목록은 그 도시에 속한 회차를 모두 통과시킵니다(find.js). */
    for (const [region, list] of byRegion) {
      const cities = new Map()
      for (const area of list) {
        const city = cityOf(area)
        cities.set(city, (cities.get(city) ?? 0) + 1)
      }
      const umbrellas = [...cities]
        .filter(([city, count]) => count > 1 && !list.includes(city))
        .map(([city]) => city)
      if (umbrellas.length) byRegion.set(region, [...umbrellas, ...list])
    }
    /* 수도권/비수도권 은 거르는 조건이 아니라, 아래 격자가 어느 지역 묶음을
       보여줄지 고르는 탭입니다(Figma 지역 팝오버). 지역이 하나도 없는 묶음은
       탭을 지우지 않고 숫자 0 을 단 채 눌리지 않게 둡니다 — 지우면 탭 줄이
       한 칸짜리가 되어 디자인과 어긋나고, 그냥 두면 눌러서 빈 격자를 만납니다. */
    const first = REGIONS.find((region) => byRegion.get(region)?.length) ?? REGIONS[0]

    const tabs = el('div', 'segmented segmented--default')
    tabs.setAttribute('role', 'tablist')
    tabs.setAttribute('aria-label', '지역 묶음')
    tabs.append(el('span', 'segmented__thumb'))
    for (const region of REGIONS) {
      const count = byRegion.get(region)?.length ?? 0
      const tab = el('button', `segmented__item${region === first ? ' is-selected' : ''}`)
      tab.type = 'button'
      tab.setAttribute('role', 'tab')
      tab.setAttribute('aria-selected', String(region === first))
      tab.disabled = count === 0
      tab.dataset.region = region
      tab.append(el('span', null, region), el('b', null, String(count)))
      tabs.append(tab)
    }

    /* 탭마다 첫 칸에 "어디서든"을 둡니다(Figma). 이것은 지우는 버튼이 아니라
       그 묶음 전체를 고르는 항목입니다 — 수도권 탭에서 누르면 수도권에서 열리는
       회차가 모두 걸리고, 바에는 어느 묶음인지가 함께 적힙니다("수도권 · 어디서든").
       두 탭에 같은 이름이 하나씩 있어, 이름만으로는 어느 쪽인지 알 수 없기
       때문입니다. 값은 갈래 이름(수도권/비수도권)이고 목록도 그것으로 거릅니다. */
    const groups = REGIONS.map((region) => {
      const grid = el('div', 'find-btn-grid find-btn-grid--4col find-bar__location-group')
      grid.dataset.region = region
      grid.hidden = region !== first
      grid.append(
        btnGridItem('area', region, '어디서든'),
        ...(byRegion.get(region) ?? []).map((area) => btnGridItem('area', area, area)),
      )
      return grid
    })

    areaBody.replaceChildren(tabs, ...groups)
    initSegmentedControl(tabs)
    tabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.segmented__item')
      if (!tab || tab.disabled) return
      for (const g of groups) g.hidden = g.dataset.region !== tab.dataset.region
    })
  }

  const kindBody = root.querySelector('[data-find-body="kind"]')
  if (kindBody) {
    const slugs = [...new Set(meetups.map((m) => m.slug))]
    const grid = el('div', 'find-btn-grid find-btn-grid--2col')
    grid.append(
      resetBtn('전체', 'kind'),
      ...slugs.map((slug) => btnGridItem('kind', slug, PRODUCTS[slug].short)),
    )
    kindBody.replaceChildren(grid)
  }

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
  /* 담긴 것이 하나도 없으면 아래 줄은 통째로 없습니다 — 지울 것이 없는데 초기화만
     남아 있으면, 무엇을 되돌리는 버튼인지 알 수 없는 자리가 됩니다. */
  const datesFoot = root.querySelector('.find-bar__panel-foot--summary')

  /** k 가 이미 담긴 것(하루 또는 기간) 안에 있으면 그것을. */
  const selectionAt = (k) => selections.find((sel) => k >= sel.from && k <= sel.to)

  const dateLabel = (sel) =>
    sel.from === sel.to
      ? shortDay(parseKey(sel.from))
      : `${shortDay(parseKey(sel.from))} - ${shortDay(parseKey(sel.to))}`

  /** 머리의 좌우 버튼 하나. 두 달 창을 통째로 한 달씩 옮깁니다. */
  function navBtn(label, icon, step, disabled) {
    const btn = el('button', 'calendar__nav')
    btn.type = 'button'
    btn.disabled = disabled
    btn.dataset.findMonth = String(step)
    btn.setAttribute('aria-label', label)
    btn.innerHTML = `<svg aria-hidden="true"><use href="#icon-${icon}"></use></svg>`
    return btn
  }

  function month(y, m, bounds, side) {
    const box = el('div', 'calendar__month')

    /* 화살표는 두 달의 바깥쪽에만 보입니다(Figma) — 안쪽 화살표는 자리만 지키고
       숨습니다. 두 달이 한 창으로 함께 움직이므로 안쪽에도 같은 버튼을 두면 같은
       일을 하는 버튼이 넷이 됩니다. 자리를 비우지 않고 숨기는 것은, 그래야 달
       이름이 두 달 모두 칸 격자의 가운데에 옵니다. */
    const head = el('div', 'calendar__head')
    const prev = navBtn('이전 달', 'chevronLeft', -1, !bounds.canPrev)
    const next = navBtn('다음 달', 'chevronRight', 1, !bounds.canNext)
    if (side === 'right') prev.classList.add('is-hidden')
    if (side === 'left') next.classList.add('is-hidden')
    head.append(prev, el('p', 'calendar__title', `${y}년 ${m}월`), next)
    box.append(head)

    const heads = el('div', 'calendar__weekdays')
    for (const day of WEEKDAY) heads.append(el('span', 'calendar__weekday', day))

    /* 주마다 한 줄로 감쌉니다(Figma 의 Row). 그 줄이 모서리를 둥글게 잘라내
       기간의 띠가 줄 끝에서 둥글게 끝납니다 — 한 격자로 두고 통째로 자르면
       5일의 오른쪽, 6일의 왼쪽이 각지게 잘립니다. */
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
    const left = monthAfter(monthOffset)
    const right = monthAfter(monthOffset + 1)
    const bounds = {
      // 지난 달로는 가지 않습니다 — 이미 지난 날은 어차피 고를 수 없습니다.
      canPrev: monthOffset > 0,
      canNext: monthOffset < MAX_MONTH_OFFSET,
    }
    calendar.replaceChildren(
      month(left[0], left[1], bounds, 'left'),
      month(right[0], right[1], bounds, 'right'),
    )
    renderDates()
  }

  /** 담은 것들의 목록 — 알약마다 지우는 버튼이 달립니다. */
  function renderDates() {
    if (datesFoot) datesFoot.hidden = selections.length === 0
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
          const gone = selections[i]
          selections.splice(i, 1)
          renderCalendar()
          update()
          announce(`${dateSpoken(gone)}가 삭제되었습니다`)
        })
        item.append(remove)
        return item
      }),
    )
  }

  /* ---- 담은 직후의 한마디 ------------------------------------------------
     달력에서 이틀을 누른 것이 담긴 것인지 아직 고르는 중인지는 칸 색만으로는
     헷갈립니다. 방금 무엇이 들어갔는지와 몇 개째인지를 2초만 말하고, 안내는 원래
     문장으로 돌아갑니다 — 계속 남겨두면 다음에 무엇을 할 수 있는지를 말하는 자리를
     지난 일이 차지합니다. 자리는 겹쳐 두어 바뀔 때 흔들리지 않습니다(find-bar.css). */

  const help = root.querySelector('.find-help')
  const addedSlot = root.querySelector('[data-find-added]')

  /* 지워진 것을 읽어주는 쪽에만 알리는 자리(meetups.html).
     더하는 것은 위 한마디가 눈과 귀에 함께 말하지만, 지우는 것은 알약이 사라지는
     모습으로만 남습니다 — 그 모습을 볼 수 없는 사람에게는 아무 일도 일어나지 않은
     것과 같습니다. 화면에는 아무것도 더하지 않고 여기에만 적습니다. */
  const live = root.querySelector('[data-find-live]')

  function announce(text) {
    if (!live) return
    /* 같은 말을 잇달아 넣으면 바뀐 것이 없다고 보고 읽지 않는 리더가 있습니다
       (알약 둘을 연달아 지우면 두 번째가 조용했습니다). 한 번 비웠다가 다음 프레임에
       넣어, 언제나 새로 들어온 말이 되게 합니다. */
    live.textContent = ''
    requestAnimationFrame(() => {
      live.textContent = text
    })
  }

  /** "9.8(화) - 9.17(목) 날짜 범위" / "9.6(일) 날짜" */
  const dateSpoken = (sel) =>
    `${dateLabel(sel)} 날짜${sel.from === sel.to ? '' : ' 범위'}`
  /** 한마디가 서 있는 시간과, 한 줄이 흐르는 데 걸리는 시간(find-bar.css). */
  const ADDED_FOR = 2000
  const ROLL = 160
  let addedTimer = 0
  let addedClearTimer = 0

  /** 받침이 있으면 "이", 없으면 "가" — 끝이 요일 한 글자입니다(9.8(화) / 9.17(목)). */
  const subjectMark = (label) => {
    const code = label.replace(/\)\s*$/, '').slice(-1).charCodeAt(0)
    const hasTail = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0
    return hasTail ? '이' : '가'
  }

  function announceAdded(sel) {
    if (!help || !addedSlot) return
    const label = dateLabel(sel)
    addedSlot.textContent = `${label}${subjectMark(label)} 추가됐어요 · ${selections.length}/${MAX_DATES}`
    help.classList.add('is-added')
    // 이어서 담으면 다시 2초입니다 — 앞의 한마디가 남은 시간을 물려받지 않습니다.
    clearTimeout(addedTimer)
    clearTimeout(addedClearTimer)
    addedTimer = setTimeout(() => {
      help.classList.remove('is-added')
      /* 다 내려간 뒤에 글자를 비웁니다. 창 밖으로 나갔을 뿐 지워진 것이 아니라,
         남겨두면 화면을 읽어주는 쪽에서는 지난 한마디가 안내 옆에 계속 붙어
         있습니다. 내려가는 도중에 비우면 글자가 사라진 채로 흐릅니다. */
      addedClearTimer = setTimeout(() => {
        addedSlot.textContent = ''
      }, ROLL + 40)
    }, ADDED_FOR)
  }

  /**
   * 날짜 하나를 누른 결과.
   *
   *   이미 담긴 날(또는 그 기간 안)이면              →  그 담긴 것을 뺍니다
   *   담는 중이 아니고 이미 8개를 다 담았으면        →  누른 것을 무시합니다
   *   담는 중이 아니면                                →  거기서 새로 시작합니다
   *   담는 중에 같은 날을 다시 누르면                →  그 하루만 담습니다
   *   담는 중에 시작보다 앞을 누르면                  →  거기가 새 시작입니다
   *   그 외(담는 중에 시작보다 뒤를 누르면)           →  거기가 끝이 되어 담깁니다
   *
   * 시작보다 앞선 날짜를 눌렀을 때 시작과 끝을 뒤바꾸지 않는 것은, 되돌아가 다시
   * 고르는 동작이 대부분 "여기부터 다시"이기 때문입니다.
   */
  function pick(k) {
    const sel = pendingFrom ? null : selectionAt(k)
    // 이번에 담긴 것. 빼거나 시작만 찍은 때는 없습니다 — 알릴 일이 아직 없습니다.
    let added = null
    if (sel) {
      selections = selections.filter((s) => s !== sel)
      announce(`${dateSpoken(sel)}가 삭제되었습니다`)
    } else if (!pendingFrom) {
      if (selections.length >= MAX_DATES) return
      pendingFrom = k
    } else if (k === pendingFrom) {
      added = { from: k, to: k }
      selections.push(added)
      pendingFrom = null
    } else if (k < pendingFrom) {
      pendingFrom = k
    } else {
      added = { from: pendingFrom, to: k }
      selections.push(added)
      pendingFrom = null
    }
    renderCalendar()
    update()
    if (added) announceAdded(added)
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

  /* ---- 판 여닫기 -------------------------------------------------------
     넓은 화면에서는 눌린 칸 아래에 붙는 판이 하나씩 열립니다. 좁은 화면에서는
     그렇게 하지 않습니다 — 아래에서 판이 올라오고, 그 안에 여러 조건이 함께
     섭니다(아래 "좁은 화면: 두 개의 판").

     showModal() 을 쓸 수 없어(find-bar.css) 판이 떠 있는 동안 필요한 것들을 여기서
     냅니다 — 뒤 페이지 잠그기, 초점 가두기, Esc, 바깥 누르기. */

  const scrim = root.querySelector('.find-bar__scrim')
  const sheetWidth = matchMedia('(max-width: 960px)')
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)')
  /** 지금 열린(넓은 화면) 또는 펼쳐진(좁은 화면 조건 판) 조건. 없으면 null 입니다. */
  let openId = null
  let locked = false

  const fieldOf = (id) => root.querySelector(`[data-find-open="${id}"]`)
  /* 머리(root) 가 아니라 화면 전체(scope)에서 찾습니다 — 좁은 화면에서 판으로
     들어오는 것 중 추천 알약은 목록 바로 위, 머리 밖에 있습니다. */
  const panelOf = (id) => scope.querySelector(`#${CSS.escape(id)}`)

  const focusables = (box) =>
    [...box.querySelectorAll('button, [href], input, select, [tabindex]')].filter(
      (node) => !node.disabled && node.tabIndex !== -1 && node.offsetParent !== null,
    )

  /* ---- 좁은 화면: 두 개의 판 --------------------------------------------
     폰에서 칸마다 판이 따로 올라오면, 지역을 고르고 날짜를 고르고 유형을 고르는 데
     판을 네 번 열고 네 번 닫습니다. 조건은 대개 한자리에서 한 번에 정하는 것이라,
     좁은 화면에서는 여러 조건이 한 판 안에 함께 섭니다.

     판은 둘이고, 무엇을 여느냐가 곧 그 안에 무엇이 들었는지입니다.

       조건 판   (바를 누르면)     지역 · 날짜 · 모임 유형 · 남은 자리
       정렬 판   (필터 버튼을)     정렬 · 추천

     한 판에 여섯을 다 담지 않는 것은, 그러면 바를 눌러도 필터 버튼을 눌러도 같은
     것이 나와 두 자리를 나눠 둔 이유가 사라지기 때문입니다. 바는 무엇을 볼지를,
     버튼은 그 밖의 것(어느 차례로 볼지 · 어떤 것을 먼저 볼지)을 맡습니다.

     조건 판은 한 번에 한 층만 펼칩니다 — 넷을 다 펼쳐두면 판이 화면 세 배 길이가
     되어, 무엇을 고르는 중인지 스크롤 없이는 알 수 없습니다. 정렬 판은 담긴 것이
     둘뿐이라 접지 않고 그대로 폅니다.

     담기는 것은 어느 쪽이든 화면에 이미 있던 그 노드입니다 — 폭이 바뀌면 옮겨
     답니다(dock). 폭마다 다른 DOM 을 두면 고르던 것이 폭이 바뀌는 순간 사라집니다. */

  /** 조건 판의 층 — 바의 칸에서 그대로 읽어옵니다. 칸이 하나 늘면 층도 함께 늡니다. */
  const sheetFields = [...root.querySelectorAll('[data-find-field]')]
    .map((field) => ({
      name: field.dataset.findField,
      id: field.querySelector('[data-find-open]')?.dataset.findOpen,
      label: field.querySelector('.find-bar__name')?.textContent ?? '',
    }))
    .filter((f) => f.id && panelOf(f.id))

  const bar = root.querySelector('.find-bar') ?? root
  const sortingBtn = root.querySelector('[data-find-sorting]')
  /** 판이 원래 있던 자리. 넓은 화면으로 돌아갈 때 그 자리에 되돌립니다. */
  const homes = new Map()
  /** 지금 떠 있는 판. 없으면 null 입니다. */
  let sheetUp = null
  /** 그 판을 연 버튼 — 닫을 때 초점을 되돌릴 자리입니다. */
  let sheetOpener = null

  /* 두 판이 같은 껍데기를 씁니다 — 머리(제목 + ×), 몸통, 발(초기화 + 개수 버튼).
     which 는 발의 초기화가 무엇을 되돌릴지입니다: 판은 제가 담은 것만 되돌립니다.
     조건 판의 초기화가 정렬까지 되돌리면, 지역을 다시 고르려던 사람이 정렬을 잃습니다. */
  function sheetShell(id, title, which) {
    const box = el('div', 'find-sheet')
    box.id = id
    box.hidden = true
    box.tabIndex = -1
    box.setAttribute('role', 'dialog')
    box.setAttribute('aria-modal', 'true')
    box.setAttribute('aria-label', title)

    const head = el('div', 'find-sheet__head')
    const x = el('button', 'btn btn--ghost btn--medium btn--icon-only')
    x.type = 'button'
    x.dataset.findClose = ''
    x.setAttribute('aria-label', '닫기')
    x.innerHTML = '<svg class="btn__icon" aria-hidden="true"><use href="#icon-close"></use></svg>'
    head.append(el('h2', 'find-sheet__title', title), x)

    const body = el('div', 'find-sheet__body')

    /* 발의 두 버튼. 조건은 누르는 즉시 걸리므로 "적용" 이 아닙니다 — 닫으면 무엇을
       보게 되는지를 미리 말하는 자리라 개수를 답니다(update 가 씁니다). */
    const foot = el('div', 'find-sheet__foot')
    const reset = el('button', 'btn btn--ghost btn--medium find-sheet__reset')
    reset.type = 'button'
    reset.dataset.sheetReset = which
    reset.append(el('span', 'btn__label', '초기화'))
    const done = el('button', 'btn btn--filled btn--large')
    done.type = 'button'
    done.dataset.sheetDone = ''
    done.append(el('span', 'btn__label', '모임 보기'))
    foot.append(reset, done)

    box.append(head, body, foot)
    return box
  }

  /* 조건 판 — 층 넷. */
  const conditionSheet = sheetShell('find-conditions', '조건', 'condition')
  {
    const body = conditionSheet.querySelector('.find-sheet__body')
    for (const f of sheetFields) {
      const section = el('section', 'find-sheet__section')
      section.dataset.sheetSection = f.name
      /* 층의 머리는 칸과 같은 것을 말합니다(이름 + 지금 걸린 값). 값은 바와 한
         곳에서 함께 씁니다(renderSummaries) — 두 곳에서 따로 지어내면 바에는
         "어디서든", 판에는 "전국" 이라고 적히는 날이 옵니다. */
      const row = el('button', 'find-sheet__row')
      row.type = 'button'
      row.dataset.sheetOpen = f.id
      row.setAttribute('aria-expanded', 'false')
      row.setAttribute('aria-controls', f.id)
      const value = el('span', 'find-sheet__value')
      value.dataset.sheetSummary = f.name
      row.append(el('span', 'find-sheet__label', f.label), value)
      section.append(row)
      body.append(section)
    }
  }

  /* 정렬 판 — 정렬 한 줄과 추천 알약. 둘 다 접지 않습니다.
     정렬이 위인 것은 값이 하나뿐이라 짧고, 목록의 차례를 정하는 것이 먼저 눈에
     들어와야 하기 때문입니다. */
  const sortingSheet = sheetShell('find-sorting-sheet', '정렬과 추천', 'sorting')
  {
    const body = sortingSheet.querySelector('.find-sheet__body')
    /* 정렬은 조건이 아니라 순서입니다 — 무엇을 볼지가 아니라 어느 차례로 볼지라,
       값 하나를 고르는 줄로 둡니다. 고르개는 목록 위에 있던 <select> 를 그대로
       옮겨 옵니다(dock) — 같은 것을 두 벌 두면 한쪽만 바뀝니다. */
    const sortRow = el('div', 'find-sheet__sort')
    sortRow.append(el('span', 'find-sheet__label', '정렬'))
    const pickSection = el('section', 'find-sheet__section')
    pickSection.dataset.sheetSection = 'pick'
    pickSection.append(el('h3', 'find-sheet__heading', '추천'))
    body.append(sortRow, pickSection)
  }

  bar.append(conditionSheet, sortingSheet)

  const conditionBody = conditionSheet.querySelector('.find-sheet__body')
  const rowOf = (id) => conditionSheet.querySelector(`[data-sheet-open="${CSS.escape(id)}"]`)
  const sectionOf = (id) => rowOf(id)?.closest('.find-sheet__section')

  /** 옮겨 담을 것과 담길 자리 — 조건 판의 층 넷, 정렬 판의 정렬 줄과 추천. */
  const cargo = () => [
    ...sheetFields.map((f) => ({ node: panelOf(f.id), into: sectionOf(f.id) })),
    { node: scope.querySelector('.find__sort'), into: sortingSheet.querySelector('.find-sheet__sort') },
    { node: panelOf('find-pick'), into: sortingSheet.querySelector('[data-sheet-section="pick"]'), bare: true },
  ]

  /** 판 안으로 옮기거나(좁은 화면), 원래 자리로 되돌립니다. */
  function dock(into) {
    for (const { node, into: box, bare } of cargo()) {
      if (!node || !box) continue
      if (into) {
        if (!homes.has(node)) homes.set(node, { parent: node.parentNode, next: node.nextSibling })
        box.append(node)
      } else {
        const home = homes.get(node)
        home?.parent.insertBefore(node, home.next)
      }
      // 접었다 펴는 층이 아닌 것(추천)은 어느 자리에서든 펴져 있습니다.
      if (bare) node.hidden = false
    }
  }

  /** 조건 판의 한 층만 펼칩니다. id 가 없으면 모두 접습니다(값만 남은 목록이 됩니다). */
  function expand(id) {
    for (const f of sheetFields) {
      const on = f.id === id
      const panel = panelOf(f.id)
      if (panel) panel.hidden = !on
      rowOf(f.id)?.setAttribute('aria-expanded', String(on))
      sectionOf(f.id)?.classList.toggle('is-open', on)
      fieldOf(f.id)?.setAttribute('aria-expanded', String(on))
    }
    openId = id
    const section = id && sectionOf(id)
    if (!section) return
    /* 펼친 층은 아래로 자랍니다 — 달력이 펼쳐지면 그 머리가 판 위쪽으로 밀려
       올라가 무엇을 펼친 것인지 보이지 않습니다. 층의 머리를 판 맨 위로 끌어옵니다. */
    requestAnimationFrame(() => {
      conditionBody.scrollTo({
        top: Math.max(0, section.offsetTop - conditionBody.offsetTop),
        behavior: reduceMotion.matches ? 'auto' : 'smooth',
      })
    })
  }

  function showSheet(box, { id = null, opener = null } = {}) {
    // 이미 그 판이 떠 있으면 층만 갈아탑니다. 펼친 층을 다시 누르면 접힙니다.
    if (sheetUp === box) {
      if (box === conditionSheet) expand(openId === id ? null : id)
      return
    }
    if (sheetUp) close({ restore: false })
    sheetUp = box
    sheetOpener = opener
    box.hidden = false
    if (scrim) scrim.hidden = false
    lockScroll()
    locked = true
    if (box === conditionSheet) expand(id)
    else sortingBtn?.setAttribute('aria-expanded', 'true')
    /* 초점은 판이 받습니다 — 열자마자 첫 층이나 날짜에 테가 둘리면 그것이 이 판에서
       해야 할 일인 양 보입니다(dialog-focus.js 와 같은 이유입니다). */
    box.focus()
  }

  /* ---- 여닫기 ---------------------------------------------------------- */

  function close({ restore = true } = {}) {
    if (!openId && !sheetUp) return
    // 판 안에 초점이 있을 때만 되돌립니다. 다른 곳을 눌러 닫은 사람의 초점을
    // 빼앗아 바로 끌어오면, 누른 자리에서 하려던 일이 끊깁니다.
    const box = sheetUp ?? panelOf(openId)
    const inside = box.contains(document.activeElement)
    // 마지막으로 펼친 층의 칸으로 돌아갑니다 — 판 안에서 층을 갈아탔다면 처음 누른
    // 자리가 아니라 방금까지 보던 자리가 눈이 있던 곳입니다.
    const back = fieldOf(openId) ?? sheetOpener

    if (sheetUp) {
      if (sheetUp === conditionSheet) expand(null)
      sortingBtn?.setAttribute('aria-expanded', 'false')
      sheetUp.hidden = true
      sheetUp = null
      sheetOpener = null
    } else {
      box.hidden = true
      fieldOf(openId)?.setAttribute('aria-expanded', 'false')
      openId = null
    }

    fields?.classList.remove('is-open')
    if (scrim) scrim.hidden = true
    if (locked) {
      unlockScroll()
      locked = false
    }
    if (restore && inside) back?.focus()

    /* 판을 여닫는 사이 목록이 줄어 화면이 따라 움직였을 수 있습니다. 그 거리는
       사람이 되짚은 것이 아니므로 버리고, 지금 위치에서 다시 셉니다. */
    moved = 0
    lastY = Math.max(0, window.scrollY)
  }

  function open(id) {
    // 좁은 화면에서는 칸을 눌러도 그 칸만 열리지 않습니다 — 조건 판이 뜨고 그 층이
    // 펼쳐집니다. 어느 칸을 눌렀는지는 어느 층에서 시작할지로 남습니다.
    if (sheetWidth.matches) {
      showSheet(conditionSheet, { id, opener: fieldOf(id) })
      return
    }
    if (openId === id) return close()
    close()
    const panel = panelOf(id)
    const field = fieldOf(id)
    if (!panel) return
    panel.hidden = false
    field?.setAttribute('aria-expanded', 'true')
    openId = id
    /* 판이 열려 있는 동안 바는 흰 바탕에 테두리를 두릅니다 — 아래에 뜬 흰 판과
       한 덩어리로 읽히고, 회색 바탕 그대로면 판만 따로 떠 있는 것처럼 보입니다. */
    fields?.classList.add('is-open')
    panel.focus()
  }

  root.addEventListener('click', (e) => {
    // 바의 칸과 조건 판의 층 머리가 같은 일을 합니다 — 그 조건을 여는 것입니다.
    const opener = e.target.closest('[data-find-open], [data-sheet-open]')
    if (opener) {
      open(opener.dataset.findOpen ?? opener.dataset.sheetOpen)
      return
    }
    // 필터 버튼은 조건이 아니라 그 밖의 것을 엽니다 — 정렬과 추천입니다.
    if (e.target.closest('[data-find-sorting]')) {
      showSheet(sortingSheet, { opener: sortingBtn })
      return
    }
    const reset = e.target.closest('[data-sheet-reset]')
    if (reset) {
      // 판은 제가 담은 것만 되돌립니다.
      if (reset.dataset.sheetReset === 'sorting') {
        clearSorting()
        announce('정렬과 추천이 삭제되었습니다')
      } else {
        clearConditions()
        announce('조건이 모두 삭제되었습니다')
      }
      return
    }
    if (e.target.closest('[data-find-close], [data-sheet-done]')) close()
  })

  scrim?.addEventListener('click', () => close())

  // 판과 칸 밖을 누르면 닫습니다. 넓은 화면에는 어둠이 없어 이것이 유일한 길입니다.
  document.addEventListener('click', (e) => {
    if (!openId && !sheetUp) return
    /* 눌린 것이 이미 문서에서 빠졌으면 밖을 누른 것이 아닙니다.
       달력은 날짜를 누르는 순간 다시 그려지므로, 눌린 칸은 이 줄에 닿기 전에
       문서에서 사라집니다. 그러면 closest() 가 판을 찾지 못해, 날짜를 고른 것이
       바깥을 누른 것으로 읽히고 판이 닫혔습니다 — 기간의 끝을 고를 수가 없었습니다. */
    if (!e.target.isConnected) return
    if (e.target.closest('.find-bar__panel, .find-sheet, [data-find-open], [data-find-sorting]')) return
    close({ restore: false })
  })

  document.addEventListener('keydown', (e) => {
    if (!openId && !sheetUp) return
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
      return
    }
    /* 시트로 서 있는 동안에는 초점이 판을 벗어나지 않게 합니다. 넓은 화면에서는
       가두지 않습니다 — 바 아래에 붙은 판은 뒤 화면을 가리지 않아, Tab 으로
       빠져나가 목록을 읽는 것이 자연스럽습니다. */
    if (e.key !== 'Tab' || !sheetWidth.matches) return
    const box = sheetUp ?? panelOf(openId)
    const stops = focusables(box)
    if (!stops.length) return
    const first = stops[0]
    const last = stops[stops.length - 1]
    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    } else if (e.shiftKey && (document.activeElement === first || document.activeElement === box)) {
      e.preventDefault()
      last.focus()
    }
  })

  /* 폭이 경계를 넘으면 판이 서는 자리가 통째로 바뀝니다 — 좁은 쪽에서는 두 판 안에,
     넓은 쪽에서는 칸마다 하나씩과 목록 위입니다. 열린 채로 갈아타게 두면 잠금이
     남거나 어둠만 남는 상태가 생기므로 닫고 나서 옮겨 답니다. */
  sheetWidth.addEventListener('change', () => {
    close({ restore: false })
    dock(sheetWidth.matches)
  })

  dock(sheetWidth.matches)

  /* ---- 조건 ------------------------------------------------------------ */

  const sort = document.querySelector('[data-find-sort]')

  /* 고른 차례. 문서에서 읽으면 늘 놓인 차례(수도권 목록의 위에서 아래)로 나오는데,
     칸에는 "먼저 고른 것 외 N건"으로 적어야 합니다 — 홍대를 고르고 광화문을 더한
     사람에게 "광화문 외 1건"이라고 적으면, 자기가 고른 차례와 어긋나 무엇이 대표로
     뽑힌 것인지 알 수 없습니다. 그래서 차례를 따로 셉니다.
     주소로 되살릴 때도 그 차례 그대로입니다 — 주소에 적히는 순서가 곧 이 차례입니다. */
  const order = { area: [], kind: [], pick: [] }

  const checked = (name) => {
    const on = [...scope.querySelectorAll(`input[name="${name}"]:checked`)].map((i) => i.value)
    const seen = order[name]
    if (!seen) return on
    // 알던 차례를 먼저, 이번에 새로 켜진 것은 뒤에 붙입니다.
    return [...seen.filter((v) => on.includes(v)), ...on.filter((v) => !seen.includes(v))]
  }

  /** 지금 켜진 것들로 차례를 다시 맞춥니다. 꺼진 것은 빠지고, 새로 켜진 것은 뒤로. */
  function noteOrder() {
    for (const name of Object.keys(order)) order[name] = checked(name)
  }

  /* 지역의 기본값은 "수도권 · 어디서든" 입니다.
     지금 여는 모임이 대부분 수도권이라, 처음 들어온 사람이 전국을 훑고 다시 좁히는
     것보다 여기서 시작해 넓히는 편이 짧습니다. 그래서 비어 있는 지역이라는 상태를
     두지 않고, 비면 늘 이 값으로 되돌립니다(전체 알약·× ·다 고르기 모두).
     이 값 하나만 걸린 것은 조건을 걸지 않은 것과 같게 셉니다 — 주소에 싣지 않고,
     바를 넓히지도, × 를 보이지도 않습니다(남은자리의 "혼자 갈래요"와 같습니다). */
  const DEFAULT_AREA = REGIONS[0]

  const isDefaultAreas = (areas) => !areas.length || (areas.length === 1 && areas[0] === DEFAULT_AREA)

  function ensureArea() {
    if (root.querySelector('input[name="area"]:checked')) return
    const capital = root.querySelector(`input[name="area"][value="${CSS.escape(DEFAULT_AREA)}"]`)
    if (capital) capital.checked = true
  }

  const state = () => ({
    areas: checked('area'),
    kinds: checked('kind'),
    seats: root.querySelector('input[name="seats"]:checked')?.value ?? 'one',
    picks: checked('pick'),
    dates: selections.map((sel) => ({ ...sel })),
    sort: SORTS.includes(sort?.value) ? sort.value : SORTS[0],
  })

  const isDefault = (s) =>
    isDefaultAreas(s.areas) && !s.kinds.length && !s.picks.length && s.seats === 'one' && !s.dates.length

  /**
   * "친구 동반" 알약과 "남은자리 · 둘이 갈래요" 는 같은 것을 말합니다.
   *
   * 둘 다 자리가 두 개 남은 일정을 찾는 조건입니다. 상태를 둘로 나눠 들고 있으면
   * 한쪽만 켜진 화면이 생기고, 그때 목록은 어느 쪽을 따라야 할지 알 수 없습니다.
   * 그래서 한 상태를 두 자리에서 보여주고, 어느 쪽을 만져도 나머지가 따라옵니다.
   */
  function syncFriend(source) {
    const friend = scope.querySelector('input[name="pick"][value="friend"]')
    const two = root.querySelector('input[name="seats"][value="two"]')
    const one = root.querySelector('input[name="seats"][value="one"]')
    if (!friend || !two || !one) return
    if (source === 'pick') {
      if (friend.checked) two.checked = true
      else one.checked = true
    } else {
      friend.checked = two.checked
    }
  }

  /**
   * 칸마다 세 가지를 함께 정합니다 — 적을 글자, 안내로 흐리게 둘지(muted),
   * 그 자리에서 바로 지우는 × 를 보일지(clearable).
   *
   * 흐려지는 칸은 날짜뿐입니다. 지역·모임 유형·남은자리는 고르지 않아도 정해진
   * 값이 있어("어디서든"·"전체"·"혼자 갈래요") 그 자체가 지금 걸린 조건입니다 —
   * 안내 문구가 아니라 값이므로 fg 로 적습니다. 날짜만 정해진 값이 없어
   * "날짜 추가"가 무엇을 하라는 안내이고, 그래서 한 단 흐립니다.
   *
   * 흐림과 × 는 따로 움직입니다. 남은자리는 늘 값이 있어 흐려지지 않지만,
   * 기본값(혼자)일 때는 지울 것이 없어 × 는 감춥니다.
   */
  function summaries(s) {
    const areaLabel = (value) => (REGIONS.includes(value) ? `${value} · 어디서든` : value)
    const many = (list, unit) =>
      list.length > 1 ? `${list[0]} 외 ${list.length - 1}${unit}` : list[0]

    const date = s.dates.length ? many(s.dates.map(dateLabel), '건') : null

    return {
      // 지역·모임 유형·날짜 모두 "외 N건"으로 단위를 통일합니다 — Figma 예시가
      // 셋 다 "건"을 씁니다(곳·개로 나눠 쓰지 않습니다).
      // 아무것도 안 고른 지역은 "어디서든" 입니다 — 판의 되돌리는 버튼과 같은 말이라,
      // 무엇을 누르면 이 값으로 돌아오는지가 이름으로 이어집니다.
      area: {
        /* 묶음은 이름만으로는 어느 탭의 "어디서든"인지 알 수 없어 함께 적습니다.
           아무것도 고르지 않았을 때의 "어디서든"과도 그렇게 구분됩니다. */
        text: s.areas.length ? many(s.areas.map(areaLabel), '건') : '어디서든',
        muted: false,
        // 기본값뿐이면 지울 것이 없습니다.
        clearable: !isDefaultAreas(s.areas),
      },
      date: { text: date ?? '날짜 추가', muted: !date, clearable: !!date },
      kind: {
        /* 칸 이름(모임 유형)이 숨는 자리에서는 "전체" 만 남아 무엇이 전체인지
           알 수 없습니다 — 붙어 있을 때와 폰에서 "전체 모임" 으로 적습니다. */
        text: s.kinds.length
          ? many(s.kinds.map((k) => PRODUCTS[k].short), '건')
          : stuck || sheetWidth.matches ? '전체 모임' : '전체',
        muted: false,
        clearable: !!s.kinds.length,
      },
      seats: { text: s.seats === 'two' ? '둘이 갈래요' : '혼자 갈래요', muted: false, clearable: s.seats === 'two' },
    }
  }

  function writeUrl(s) {
    const url = new URL(location.href)
    const set = (name, value) => {
      if (value) url.searchParams.set(name, value)
      else url.searchParams.delete(name)
    }
    // 기본값(수도권 · 어디서든)은 싣지 않습니다 — 링크가 짧아지고, 주소에 지역이
    // 없는 것과 기본값이 같은 뜻이 되어 새로 열어도 같은 목록이 나옵니다.
    set('area', isDefaultAreas(s.areas) ? '' : s.areas.join(','))
    set('kind', s.kinds.join(','))
    // friend 는 seats 가 이미 말하고 있습니다 — 같은 조건을 주소에 두 번 적지 않습니다.
    set('pick', s.picks.filter((p) => p !== 'friend').join(','))
    set('seats', s.seats === 'two' ? 'two' : '')
    // 담긴 것마다 하루면 그 하루만, 기간이면 밑줄로 시작과 끝을 잇습니다.
    set('date', s.dates.map((d) => (d.from === d.to ? d.from : `${d.from}_${d.to}`)).join(','))
    // 기본값은 적지 않습니다. 아무 조건도 없는 목록의 주소가 깨끗해야 합니다.
    set('sort', s.sort === SORTS[0] ? '' : s.sort)
    history.replaceState(null, '', `${url.pathname.split('/').pop()}${url.search}`)
  }

  /** 칸에 적히는 글자만 다시 씁니다. 붙고 풀릴 때도 이것만 부르면 됩니다. */
  function renderSummaries(s) {
    for (const [name, { text, muted, clearable }] of Object.entries(summaries(s))) {
      /* 좁은 화면의 조건 판에서는 같은 값이 층 머리에 한 번 더 적힙니다 — 접힌
         층은 값만으로 무엇이 걸려 있는지 말해야 합니다. 글자를 여기서 함께 쓰는
         것은, 두 곳에서 따로 지어내면 바에는 "어디서든", 판에는 "전국" 이라고
         적히는 날이 오기 때문입니다. */
      const sheetSlot = conditionSheet.querySelector(`[data-sheet-summary="${name}"]`)
      if (sheetSlot) {
        sheetSlot.textContent = text
        sheetSlot.classList.toggle('is-empty', muted)
      }
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

  function update() {
    // 지역이 비었으면 기본값으로 되돌립니다. 지우는 길이 여럿이라(전체 알약 · ×
    // · 다 고르기) 각자 되돌리게 두지 않고 이 한 곳에서 채웁니다.
    ensureArea()
    // 무엇이 대표로 적힐지는 고른 차례가 정합니다(order). 상태를 읽기 전에 맞춥니다.
    noteOrder()
    const s = state()
    renderSummaries(s)

    // 값이 하나라도 있으면 바가 넓어집니다(find-bar.css: has-value).
    const hasValue = !isDefaultAreas(s.areas) || s.kinds.length || s.dates.length || s.seats === 'two'
    root.querySelector('.find-bar__fields')?.classList.toggle('has-value', Boolean(hasValue))

    const all = scope.querySelector('[data-find-all]')
    all?.setAttribute('aria-pressed', String(isDefault(s)))

    // "전체" 는 그 칸이 비어 있을 때만 채운 모습입니다 — 지금 아무 모임 유형도
    // 안 골랐다는 사실을 스스로 보여줍니다. 지역의 "어디서든"은 이제 지우는
    // 버튼이 아니라 고르는 항목이라, 켜진 모습은 :has(:checked) 가 맡습니다.
    for (const btn of root.querySelectorAll('[data-find-clear="kind"].find-btn-grid__reset')) {
      btn.setAttribute('aria-pressed', String(!s.kinds.length))
    }

    /* 폰에서는 추천과 정렬이 필터 버튼 안에 수납되어 보이지 않습니다. 걸어둔 것이
       있는데 아무 표시가 없으면 목록이 왜 이만큼인지 알 수 없으므로, 그 버튼이
       대신 셉니다 — 추천으로 건 조건과, 기본이 아닌 정렬을 함께 셉니다.
       하나도 없으면 숫자를 감춥니다. 0 이라고 적으면 그것도 하나의 표시가 되어,
       걸린 것이 있는 것처럼 보입니다. */
    const moreCount = root.querySelector('[data-find-more-count]')
    if (moreCount) {
      const n = s.picks.length + (s.sort === SORTS[0] ? 0 : 1)
      moreCount.textContent = String(n)
      moreCount.hidden = n === 0
      moreCount
        .closest('.find-bar__more')
        ?.setAttribute('aria-label', n ? `추천 조건과 정렬, ${n}개 적용됨` : '추천 조건과 정렬')
    }

    writeUrl(s)
    root.dispatchEvent(new CustomEvent('find:change', { detail: s, bubbles: true }))

    /* 좁은 화면 판의 버튼은 닫으면 무엇을 보게 되는지를 미리 말합니다. 목록을 그린
       쪽이 센 수를 그대로 읽습니다(find.js 가 위 신호를 받아 이미 적어두었습니다) —
       같은 것을 여기서 한 번 더 세면 거르는 규칙이 두 곳에 생깁니다.
       하나도 없을 때 "모임 0개 보기" 라고 적으면 볼 것이 없는데 보러 가라는 말이
       됩니다. 그때는 닫는 버튼으로만 남고, 무엇을 해야 하는지는 빈 목록이 말합니다. */
    const n = Number(document.querySelector('[data-find-count]')?.textContent ?? 0)
    for (const label of root.querySelectorAll('[data-sheet-done] .btn__label')) {
      label.textContent = n > 0 ? `모임 ${n}개 보기` : '닫기'
    }
  }

  /**
   * 다 고른 것은 아무것도 고르지 않은 것과 같습니다.
   *
   * 지역을 전부 켜면 걸리는 결과가 "어디서든"과 한 글자도 다르지 않은데, 화면에는
   * "어디서든"이 꺼진 채 알약 열 개가 검게 켜져 있고 칸에는 "서울 강남 외 8건"이
   * 적힙니다 — 같은 목록을 두 가지 상태로 말하는 셈입니다. 마지막 하나를 켜는
   * 순간 전부 끄고 "전체"로 되돌립니다. 주소에도 그 조건이 실리지 않습니다.
   */
  function collapseWhenAll(name) {
    // 지역의 "어디서든"(묶음)은 동네가 아니므로 세지 않습니다 — 그것까지 켜야
    // 전부가 되는 것으로 두면 영영 이 자리에 닿지 않습니다.
    const all = [...scope.querySelectorAll(`input[name="${name}"]`)].filter(
      (input) => !(name === 'area' && REGIONS.includes(input.value)),
    )
    if (all.length && all.every((input) => input.checked)) {
      for (const input of all) input.checked = false
    }
  }

  /**
   * 묶음("수도권 · 어디서든")과 그 안의 동네는 함께 설 수 없습니다.
   *
   * 둘을 같이 켜두면 걸리는 결과는 묶음 하나만 켠 것과 똑같은데 칸에는
   * "수도권 · 어디서든 외 1건"이라고 적혀, 하나가 더 걸린 것처럼 읽힙니다.
   * 묶음을 켜면 그 안의 동네를 내리고, 동네를 켜면 묶음을 내립니다.
   */
  function untangleAreas(input) {
    if (input.name !== 'area' || !input.checked) return
    const isRegion = REGIONS.includes(input.value)
    for (const other of root.querySelectorAll('input[name="area"]:checked')) {
      if (other === input) continue
      const otherIsRegion = REGIONS.includes(other.value)
      if (isRegion) {
        if (!otherIsRegion && regionOf(other.value) === input.value) other.checked = false
      } else if (otherIsRegion && other.value === regionOf(input.value)) {
        other.checked = false
      }
    }
  }

  scope.addEventListener('change', (e) => {
    const input = e.target
    if (!(input instanceof HTMLInputElement)) return
    untangleAreas(input)
    if (input.name === 'area' || input.name === 'kind') collapseWhenAll(input.name)
    if (input.name === 'pick' && input.value === 'friend') syncFriend('pick')
    if (input.name === 'seats') syncFriend('seats')
    update()
  })

  sort?.addEventListener('change', update)

  /** 칸에 적힌 이름(지역 · 날짜 · 모임 유형 · 남은 자리). 여기에 다시 적어두면
      이름이 바뀔 때 고칠 곳이 두 군데가 됩니다. */
  const fieldName = (name) =>
    root.querySelector(`[data-find-field="${name}"] .find-bar__name`)?.textContent ?? name

  /** 지역 · 날짜 · 모임 유형 · 남은 자리 — 조건 판이 담은 것들. */
  function clearConditions({ apply = true } = {}) {
    for (const input of scope.querySelectorAll('input[name="area"], input[name="kind"]')) {
      input.checked = false
    }
    const one = root.querySelector('input[name="seats"][value="one"]')
    if (one) one.checked = true
    // 남은자리를 되돌리면 그것과 한 몸인 "친구 동반" 알약도 함께 꺼집니다.
    syncFriend('seats')
    selections = []
    pendingFrom = null
    renderCalendar()
    if (apply) update()
  }

  /** 정렬 · 추천 — 정렬 판이 담은 것들. */
  function clearSorting({ apply = true } = {}) {
    for (const input of scope.querySelectorAll('input[name="pick"]')) input.checked = false
    // "친구 동반" 이 꺼지면 남은자리도 혼자로 돌아갑니다 — 둘은 같은 조건입니다.
    syncFriend('pick')
    if (sort) sort.value = SORTS[0]
    if (apply) update()
  }

  /** 조건을 하나도 걸지 않은 처음 상태로. "전체" 알약과 빈 목록의 버튼이 함께 씁니다.
      정렬은 되돌리지 않습니다 — 무엇을 볼지를 지우는 자리이지 어느 차례로 볼지를
      바꾸는 자리가 아니고, 목록이 빈 이유도 정렬에는 없습니다. */
  function clearAll() {
    clearConditions({ apply: false })
    for (const input of scope.querySelectorAll('input[name="pick"]')) input.checked = false
    update()
  }

  scope.addEventListener('click', (e) => {
    if (e.target.closest('[data-find-all]')) {
      clearAll()
      announce('조건이 모두 삭제되었습니다')
      return
    }
    const clear = e.target.closest('[data-find-clear]')
    if (!clear) return
    const which = clear.dataset.findClear
    if (which === 'date') {
      selections = []
      pendingFrom = null
      renderCalendar()
    } else if (which === 'seats') {
      const one = root.querySelector('input[name="seats"][value="one"]')
      if (one) one.checked = true
      syncFriend('seats')
    } else {
      for (const input of root.querySelectorAll(`input[name="${which}"]`)) input.checked = false
    }
    update()
    announce(`${fieldName(which)} 조건이 삭제되었습니다`)
  })

  document.addEventListener('find:clear', clearAll)

  /* ---- 붙었는지 알리기 --------------------------------------------------
     스크롤해 바가 GNB 아래에 붙는 순간 머리에 is-sticky 를 답니다. 줄어드는 모양은
     CSS 가 정합니다(find-bar.css) — 여기서는 "지금 붙어 있다"만 알립니다.

     position:sticky 는 붙어 있는 상태를 CSS 로 노출하지 않아 재야 합니다. 머리의
     위쪽이 붙는 자리(GNB 높이)에 닿았는지로 판단하고, 값이 바뀔 때만 씁니다
     (gnb.js 와 같은 방식입니다). */

  const fields = root.querySelector('.find-bar__fields')
  const head = root.closest('.find-head') ?? root
  let stuck = null
  let passed = false

  /* 머리의 위치를 직접 재지 않습니다. 붙어 있는 동안에는 머리의 top 이 늘 붙는
     자리(GNB 높이)와 같아서, 스크롤이 0 일 때와 구분되지 않습니다 — 실제로 그
     때문에 페이지를 열자마자 줄어든 바가 떠 있었습니다.

     대신 머리 바로 위에 높이 0 짜리 표식을 하나 두고, 그것이 GNB 아래로 지나갔는지
     만 봅니다. 표식은 붙지 않으므로 스크롤과 함께 정직하게 올라갑니다. */
  const sentinel = el('div', 'find-head__sentinel')
  head.before(sentinel)

  /* ---- 고른 직후의 되튐 -------------------------------------------------
     조건을 하나 고르면 목록이 그만큼 짧아집니다. 문서가 줄면 브라우저는 스크롤을
     위로 당기는데, 그것이 스크롤 이벤트로 그대로 올라와 "사람이 화면을 되돌려
     올렸다"로 읽혔습니다 — 고르는 도중에 바가 물러나고 판까지 닫혀 버렸습니다.
     목록을 다시 그린 직후 잠깐은 화면의 움직임을 사람의 것으로 세지 않습니다. */
  const SETTLE = 400
  let settleUntil = 0
  const settling = () => performance.now() < settleUntil
  root.addEventListener('change', () => {
    settleUntil = performance.now() + SETTLE
  })

  function applyStuck() {
    // 시트로 서는 폭에서는 머리가 붙지 않으므로 줄일 것도 없습니다.
    const next = passed && !sheetWidth.matches
    if (next === stuck) return
    const first = stuck !== null
    stuck = next

    /* 줄어드는(또는 되돌아오는) 폭을 실제로 재서 그 사이를 잇습니다.
       CSS 만으로는 되지 않습니다 — 붙었을 때의 폭이 내용을 따라가는
       max-content 라, auto ↔ max-content 사이에 보간할 값이 없어 폭이 툭
       바뀝니다. 바뀌기 직전의 폭을 재두고, 클래스를 바꾼 뒤의 폭을 다시 재서
       그 두 값 사이를 애니메이션합니다. */
    const from = fields?.getBoundingClientRect().width
    head.classList.toggle('is-sticky', next)
    if (fields && first && !reduceMotion.matches) {
      const to = fields.getBoundingClientRect().width
      if (Math.round(from) !== Math.round(to)) {
        fields.animate(
          [{ inlineSize: `${from}px` }, { inlineSize: `${to}px` }],
          { duration: 240, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
        )
      }
    }

    renderSummaries(state())

    /* 줄어드는 동안 열려 있던 판은 바와 함께 자리가 어긋나므로 닫습니다.
       다만 조건을 고른 직후의 되튐(아래 settling)일 때는 두고 봅니다 — 그때
       화면이 움직인 것은 사람이 스크롤해서가 아니라 목록이 줄어 문서가 짧아진
       탓이라, 여기서 닫으면 조건을 여러 개 이어 고를 수가 없습니다. */
    if (openId && !settling()) close({ restore: false })
  }

  /* ---- 되돌아 올릴 때 물러나기 ------------------------------------------
     방향이 GNB·앱바와 반대라 auto-hide.js 를 쓰지 않습니다.

       아래로 내려가는 동안  →  바는 남아 있습니다. 읽던 목록을 계속 좁히거나
                               바꿀 수 있어야 하는 자리입니다.
       위로 되돌아 올릴 때   →  물러납니다. 되돌아 올린다는 것은 이미 지나온
                               목록을 다시 본다는 뜻이라, 그동안은 목록이
                               한 줄이라도 더 보이는 편이 낫습니다.

     맨 위 가까이(TOP_ZONE)에서는 무조건 보입니다 — 거기서는 바가 줄지 않은
     기본 모습으로 서 있어야 합니다. */

  /* 한 번의 움직임이 아니라 한 방향으로 쌓인 거리를 봅니다. 8px 만 올려도 바로
     물러나면, 손을 떼는 순간의 흔들림이나 한 칸 되짚어 보는 정도에도 바가
     사라져 버립니다 — 물러나는 데에는 넉넉히(64), 돌아오는 데에는 조금만(16)
     쌓이면 됩니다. 방향이 바뀌면 쌓아둔 것은 버립니다. */
  const HIDE_DISTANCE = 64
  const SHOW_DISTANCE = 16
  const TOP_ZONE = 80
  let lastY = Math.max(0, window.scrollY)
  let moved = 0
  let hidden = false
  let queued = false

  function setHidden(next) {
    if (next === hidden) return
    hidden = next
    head.classList.toggle('is-hidden', next)
    // 물러나는 동안 열려 있던 판만 허공에 떠 있지 않도록 함께 닫습니다.
    if (next && openId) close({ restore: false })
  }

  function measureHide() {
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

    // 맨 위 가까이에서는 무조건 보입니다 — 거기서는 줄지 않은 기본 바입니다.
    if (y <= TOP_ZONE) {
      moved = 0
      setHidden(false)
      return
    }

    if (dy < 0 !== moved < 0) moved = 0
    moved += dy

    if (moved <= -HIDE_DISTANCE) setHidden(true)
    else if (moved >= SHOW_DISTANCE) setHidden(false)
  }

  addEventListener(
    'scroll',
    () => {
      if (queued) return
      queued = true
      requestAnimationFrame(measureHide)
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
  // 폭이 바뀌면 적히는 말도 달라집니다("전체" ↔ "전체 모임").
  sheetWidth.addEventListener('change', () => renderSummaries(state()))

  /* ---- 주소에 적혀 있던 조건 ------------------------------------------- */

  const q = new URLSearchParams(location.search)
  const listOf = (name) => (q.get(name) ?? '').split(',').filter(Boolean)

  for (const name of ['area', 'kind', 'pick']) {
    for (const value of listOf(name)) {
      const input = scope.querySelector(`input[name="${name}"][value="${CSS.escape(value)}"]`)
      if (input) input.checked = true
    }
  }
  if (q.get('seats') === 'two') {
    const two = root.querySelector('input[name="seats"][value="two"]')
    if (two) two.checked = true
  }
  syncFriend('seats')
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
  }
  if (sort && SORTS.includes(q.get('sort'))) sort.value = q.get('sort')

  renderCalendar()
  update()
}
