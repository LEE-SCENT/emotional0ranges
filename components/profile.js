/**
 * 기본 프로필 화면.
 *
 *   import { initProfile } from './components/profile.js'
 *   initProfile()
 *
 * 칸은 마크업(profile.html)에 있고, 여기서는 칸끼리 얽힌 것만 다룹니다 — 시/도를
 * 고르면 구가 바뀌고, 혼인신고 경험이 있으면 기간 칸이 나오고, 자녀가 있으면
 * 몇 명인지 묻습니다. 나가고 저장하는 일은 profile-form.js 가 합니다.
 */
import { openConfirm } from './confirm.js?v=f516d2db'
import { cardGrid, cardHeader, cardRow, initProfileForm, load, store } from './profile-form.js?v=fdba3179'

/**
 * ⚠️ 예시입니다. 행정구역 전체가 아니라 화면을 맞춰 보는 데 필요한 만큼만 있습니다.
 *    실제 목록은 서버에서 옵니다.
 */
const REGIONS = {
  서울: ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구',
    '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구',
    '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'],
  경기: ['고양시', '과천시', '광명시', '성남시', '수원시', '안양시', '용인시', '하남시', '화성시'],
  인천: ['계양구', '남동구', '부평구', '연수구', '중구'],
  부산: ['남구', '동래구', '부산진구', '수영구', '해운대구'],
}

/** ⚠️ 예시입니다. 직업 분류표가 정해지면 이 자리에 들어옵니다. */
const JOBS = {
  'IT/개발/기획': ['개발자', '기획자', '디자이너', '데이터 분석가'],
  '대학(원)생': ['대학생', '연구비소득인증 대학원생', '의대생', '로스쿨 재학생'],
  전문직: ['의사', '변호사', '회계사', '약사'],
  '경영/사무': ['회사원', '인사', '재무', '마케팅'],
  프리랜서: ['크리에이터', '강사', '작가'],
}

/** ⚠️ 140–210 은 임의의 범위입니다. Figma 에는 175cm 한 값만 있고, 그 값이 막대
    가운데에 서 있는 것만 맞췄습니다. */
const HEIGHT = { min: 140, max: 210 }

function fill(select, values, placeholder) {
  const kept = select.value
  select.replaceChildren()
  if (placeholder) select.append(new Option(placeholder, ''))
  for (const value of values) select.append(new Option(value, value))
  // 앞에서 고른 것이 새 목록에도 있으면 그대로 둡니다.
  select.value = values.includes(kept) ? kept : placeholder ? '' : values[0] ?? ''
}

/** 앞 칸을 고르면 뒤 칸의 목록이 따라 바뀌는 한 쌍(시/도 → 구, 대분류 → 중분류). */
function chain(parent, child, table, placeholders = []) {
  fill(parent, Object.keys(table), placeholders[0])
  const sync = () => fill(child, table[parent.value] ?? [], placeholders[1])
  /* 앞 칸을 바꾸면 뒤 칸은 비웁니다. 새 목록의 첫 것으로 조용히 바꿔두면 고르지도 않은
     구가 골라진 채 저장되고, 이름이 같은 것(서울 중구 · 인천 중구)이 그대로 남아 있으면
     바뀐 줄도 모릅니다. */
  parent.addEventListener('change', () => {
    sync()
    if (placeholders[1]) child.value = ''
  })
  sync()
  return sync
}

const join = (...parts) => parts.filter(Boolean).join(' · ')

/** 폼의 지금 값으로 카드에 적을 것을 만듭니다. */
function facts(profile, draft) {
  const married = [
    draft.cohabited && '사실혼 경험 있음',
    draft.married === 'yes' && '혼인신고 경험 있음',
  ].filter(Boolean)

  return [
    cardRow('성별', profile.me.gender),
    cardRow('키', `${draft.height}cm`),
    cardRow('거주지', join(draft['home-sido'], draft['home-gugun']), { wide: true }),
    // 검색으로 고른 것이거나 분류로 고른 것. 어느 탭을 보고 있는지와는 상관없습니다 —
    // 탭을 옮긴 것만으로 직업이 사라지지 않습니다.
    cardRow('직업', draft['job-search'].trim() || draft['job-minor'] || draft['job-major']),
    cardRow('근무지', draft['work-none']
      ? '고정 근무지 없음'
      : join(draft['work-sido'], draft['work-gugun'])),
    cardRow('혼인 경험', married.length ? married.join(' · ') : '없음', { wide: true }),
    cardRow('자녀', draft.kids === 'yes'
      ? join('있음', draft['kids-count'], draft['kids-custody'])
      : draft.kids === 'none' ? '없음' : '', { wide: true }),
  ]
}

/**
 * 빠진 것을 찾습니다. 기본 프로필은 전부 채워야 합니다 — 매칭과 추천이 이 값들로
 * 돌아가서, 하나가 비면 그 사람은 조건에 걸리지도 빠지지도 않는 채로 남습니다.
 *
 * 키·회사는 늘 값이 있습니다. 거주지와 근무지는 구까지 골라야 하고, 근무지는
 * "고정 근무지 없음"도 답입니다.
 * 고르면 딸린 것이 생기는 칸(혼인신고 경험 → 기간, 자녀 있음 → 수·양육)은 그 딸린
 * 것까지가 답입니다.
 *
 * ⚠️ 빠졌을 때의 모습과 말이 Figma 에 없습니다. 문구는 임시입니다.
 */
function missing(form, draft) {
  const at = (selector) => form.querySelector(selector)
  const found = []
  const need = (ok, selector, message) => { if (!ok) found.push({ field: at(selector), message }) }

  // 시/도를 바꾸면 구가 비워집니다. 다시 골라야 답입니다.
  need(draft['home-gugun'], '[data-field="home-gugun"]', '시/군/구를 선택해 주세요')
  if (!draft['work-none']) {
    need(draft['work-gugun'], '[data-field="work-gugun"]', '시/군/구를 선택해 주세요')
  }

  // 직업은 검색으로 고른 것이 있거나, 분류를 중분류까지 골랐으면 됩니다.
  if (draft['job-major'] && !draft['job-minor']) {
    // 대분류는 골랐으니 말은 중분류 상자 아래에 섭니다.
    found.push({ field: at('[data-field="job-minor"]'), message: '중분류를 선택해 주세요' })
  } else {
    need(draft['job-search'].trim() || draft['job-minor'], '[data-field="job"]', '직업을 선택해 주세요')
  }

  need(draft.married, '[data-field="married"]', '혼인 경험을 선택해 주세요')
  if (draft.married === 'yes') {
    need(draft['married-from'] && draft['married-to'], '[data-period="married"]', '법률혼 기간을 선택해 주세요')
  }
  if (draft.cohabited) {
    need(draft['cohabited-from'] && draft['cohabited-to'], '[data-period="cohabited"]', '사실혼 기간을 선택해 주세요')
  }

  need(draft.kids, '[data-field="kids"]', '자녀 여부를 선택해 주세요')
  if (draft.kids === 'yes') {
    need(draft['kids-count'] && draft['kids-custody'], '[data-kids-detail]', '자녀 수와 양육 형태를 선택해 주세요')
  }
  return found
}

export function initProfile() {
  const form = document.querySelector('[data-profile-form]')
  if (!form) return
  const $ = (name) => form.elements[name]

  const syncHome = chain($('home-sido'), $('home-gugun'), REGIONS, [null, '시/군/구'])
  const syncWork = chain($('work-sido'), $('work-gugun'), REGIONS, [null, '시/군/구'])
  const syncJob = chain($('job-major'), $('job-minor'), JOBS, ['대분류', '중분류'])

  /* 저장된 값의 시/도·대분류를 먼저 넣고 뒤 칸의 목록을 그에 맞춥니다. 뒤 칸의 값은
     initProfileForm 이 써넣는데, 그때 고를 것이 목록에 없으면 빈 칸으로 남습니다. */
  const stored = load().basic
  for (const [parent, syncList] of [['home-sido', syncHome], ['work-sido', syncWork], ['job-major', syncJob]]) {
    if (stored[parent]) $(parent).value = stored[parent]
    syncList()
  }

  const height = $('height')
  height.min = HEIGHT.min
  height.max = HEIGHT.max
  const heightText = form.querySelector('[data-height-text]')

  /* 기간 칸(법률혼 · 사실혼). 브라우저의 달 고르는 칸 위에 우리 글자를 얹어 씁니다
     (field.css). 글자를 눌러도 달력이 열리도록 showPicker 를 부릅니다 — <label> 은
     초점만 옮기고 달력까지 열어주지는 않습니다. */
  const months = [...form.querySelectorAll('.text-field__month')].map((box) => {
    const input = box.querySelector('input')
    const text = box.querySelector('[data-month-text]')
    // 달 고르는 칸이 없는 브라우저는 type 을 text 로 되돌려 놓습니다.
    if (input.type !== 'month') {
      box.classList.add('is-plain')
      input.placeholder = 'YYYY-MM'
      input.pattern = '\\d{4}-\\d{2}'
    }
    input.max = new Date().toISOString().slice(0, 7)
    box.addEventListener('click', () => { try { input.showPicker() } catch { input.focus() } })
    return { box, input, text, hint: text.textContent }
  })
  /* 끝이 시작보다 앞설 수 없습니다. 한쪽을 고르면 다른 쪽이 고를 수 있는 범위가 그에
     맞춰 좁아집니다. */
  const thisMonth = new Date().toISOString().slice(0, 7)
  const periods = [...form.querySelectorAll('.text-field--period')].map((period) => {
    const [from, to] = period.querySelectorAll('input')
    /* 시작을 고르면 곧바로 끝을 고르게 합니다. 기간은 둘이 한 답이라, 시작만 고르고
       멈출 일이 없습니다. 이미 끝이 있으면 건드리지 않되, 새 시작보다 앞서게 됐으면
       지우고 다시 고르게 합니다. */
    from.addEventListener('change', () => {
      if (!from.value || from.type !== 'month') return
      if (to.value && to.value < from.value) {
        to.value = ''
        to.dispatchEvent(new Event('input', { bubbles: true }))
      }
      if (to.value) return
      // 시작 쪽이 초점을 내려놓은 뒤에(field.js) 끝 쪽을 엽니다.
      setTimeout(() => {
        to.focus()
        try { to.showPicker() } catch { /* 달력을 스스로 열 수 없는 브라우저에서는 초점만 옮깁니다. */ }
      })
    })
    return () => {
      from.max = to.value || thisMonth
      to.min = from.value
    }
  })

  /* 칸끼리 얽힌 것들. 폼이 바뀔 때마다 통째로 다시 맞춥니다 — 무엇이 바뀌었는지
     가려 가며 고치면, 저장된 값을 처음 써넣을 때처럼 사건 없이 바뀐 자리를 놓칩니다. */
  function sync(draft) {
    heightText.textContent = `${draft.height}cm`
    jobClear.hidden = !draft['job-search']

    const search = mode === 'search'
    form.querySelector('[data-job-search]').hidden = !search
    form.querySelector('[data-job-category]').hidden = search

    $('work-sido').disabled = $('work-gugun').disabled = draft['work-none']

    form.querySelector('[data-period="married"]').hidden = draft.married !== 'yes'
    form.querySelector('[data-period="cohabited"]').hidden = !draft.cohabited
    form.querySelector('[data-periods]').hidden = draft.married !== 'yes' && !draft.cohabited
    form.querySelector('[data-kids-detail]').hidden = draft.kids !== 'yes'

    for (const bound of periods) bound()

    // 기간 칸의 글자. 값("2022-01")을 "2022년 1월"로 적습니다.
    for (const part of months) {
      const [year, month] = part.input.value.split('-')
      part.box.classList.toggle('is-empty', !month)
      part.text.textContent = month ? `${year}년 ${Number(month)}월` : part.hint
    }
  }

  /* ± 는 한 칸씩. 막대와 같은 값을 고치므로 둘이 따로 놀지 않습니다. */
  form.addEventListener('click', (e) => {
    const step = e.target.closest('[data-height-step]')
    if (!step) return
    const next = Number(height.value) + Number(step.dataset.heightStep)
    height.value = Math.min(HEIGHT.max, Math.max(HEIGHT.min, next))
    height.dispatchEvent(new Event('input', { bubbles: true }))
  })

  /* ---- 직업 검색 --------------------------------------------------------
     치는 대로 맞는 직업을 아래에 띄웁니다. 맞는 것이 없으면 없다고 말합니다.

     ↑↓ 로 옮기고 Enter 로 고르고 Esc 로 닫습니다. 고르는 동안 초점은 칸에 남습니다
     (aria-activedescendant) — 목록으로 초점이 넘어가면 이어서 칠 수 없습니다.
     고르고 나면 초점을 내려놓습니다. */
  const jobInput = $('job-search')
  const jobList = form.querySelector('#job-suggest')
  const jobClear = form.querySelector('[data-job-clear]')
  const jobs = Object.entries(JOBS).flatMap(([group, names]) => names.map((name) => ({ name, group })))
  let active = -1

  const closeJobs = () => {
    jobList.hidden = true
    jobInput.setAttribute('aria-expanded', 'false')
    jobInput.removeAttribute('aria-activedescendant')
    active = -1
  }
  const mark = (index) => {
    const items = [...jobList.querySelectorAll('[role="option"]')]
    if (!items.length) return
    active = (index + items.length) % items.length
    for (const [i, item] of items.entries()) item.setAttribute('aria-selected', String(i === active))
    jobInput.setAttribute('aria-activedescendant', items[active].id)
    items[active].scrollIntoView({ block: 'nearest' })
  }
  /* 목록에 있는 직업만 받습니다. 고르지 않고 칸을 떠나면 친 것은 버리고, 마지막으로
     고른 것(없으면 빈 칸)으로 돌아갑니다 — 반쯤 친 말이 직업으로 저장되지 않습니다. */
  let confirmed = ''
  const settle = () => {
    closeJobs()
    if (jobInput.value === confirmed) return
    jobInput.value = confirmed
    jobInput.dispatchEvent(new Event('input', { bubbles: true }))
    closeJobs()
  }
  const pickJob = (name) => {
    confirmed = name
    jobInput.value = name
    // 직업은 하나입니다. 검색으로 골랐으면 분류로 골라둔 것은 내려놓습니다.
    $('job-major').value = ''
    syncJob()
    jobInput.dispatchEvent(new Event('input', { bubbles: true }))
    closeJobs()
    // 골랐으면 이 칸의 일은 끝났습니다. 초점을 내려놓아 칸이 채워진 모습으로 돌아가고,
    // 폰에서는 자판이 내려가 고른 것이 카드에 반영된 것이 보입니다.
    jobInput.blur()
  }
  const suggest = () => {
    const query = jobInput.value.trim()
    jobClear.hidden = !jobInput.value
    // 이미 목록의 것과 똑같이 적혀 있으면 더 띄울 것이 없습니다(방금 고른 직후가 그렇습니다).
    if (!query || jobs.some((job) => job.name === query)) return closeJobs()
    const found = jobs.filter((job) => job.name.includes(query) || job.group.includes(query))

    const option = (i, value, label, group) => {
      const item = document.createElement('li')
      item.id = `job-suggest-${i}`
      item.setAttribute('role', 'option')
      item.setAttribute('aria-selected', 'false')
      item.dataset.value = value
      const tag = document.createElement('span')
      tag.textContent = group
      item.append(label, tag)
      return item
    }
    if (found.length) {
      jobList.replaceChildren(...found.map((job, i) => option(i, job.name, job.name, job.group)))
    } else {
      /* 맞는 것이 없다는 것도 말합니다. 목록이 그냥 사라지면 아직 찾는 중인지, 없는
         것인지 알 수 없습니다. 고를 수 있는 줄이 아니라 option 이 아닙니다. */
      const none = document.createElement('li')
      none.className = 'is-empty'
      none.setAttribute('role', 'presentation')
      none.textContent = '검색 결과가 없어요'
      jobList.replaceChildren(none)
    }
    active = -1
    jobList.hidden = false
    jobInput.setAttribute('aria-expanded', 'true')
  }
  jobInput.addEventListener('input', suggest)
  jobInput.addEventListener('focus', suggest)
  jobInput.addEventListener('blur', settle)
  jobInput.addEventListener('keydown', (e) => {
    // 한글을 조합하는 중의 Enter·화살표는 글자를 확정하는 것이라 건드리지 않습니다.
    if (e.isComposing || jobList.hidden) return
    if (e.key === 'ArrowDown') { e.preventDefault(); mark(active + 1) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); mark(active - 1) }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pickJob(jobList.children[active].dataset.value) }
    // 고른 줄 없이 Enter 를 치면 폼이 저장되려 합니다. 찾는 중에는 막습니다.
    else if (e.key === 'Enter') e.preventDefault()
    else if (e.key === 'Escape') closeJobs()
  })
  // click 이 아니라 mousedown 입니다. click 을 기다리면 그 전에 칸이 초점을 잃어 목록이
  // 먼저 닫힙니다.
  jobList.addEventListener('mousedown', (e) => {
    e.preventDefault()
    const item = e.target.closest('[role="option"]')
    if (item) pickJob(item.dataset.value)
  })
  jobClear.addEventListener('click', () => {
    confirmed = ''
    jobInput.value = ''
    jobInput.dispatchEvent(new Event('input', { bubbles: true }))
    jobInput.focus()
  })

  /* ---- 검색 ↔ 카테고리 --------------------------------------------------
     탭은 직업을 고르는 두 길일 뿐, 답이 아닙니다. 탭을 옮기는 것만으로는 아무것도
     바뀌지 않습니다 — 고른 직업도, 카드도, 저장할 것이 생겼는지도 그대로입니다.
     다른 길로 새 직업을 끝까지 골랐을 때에야 앞의 것이 내려갑니다.

     그래서 어느 탭인지는 저장하지 않습니다. 열 때는 값이 든 쪽의 탭이 열립니다. */
  let mode = !stored['job-search'] && stored['job-major'] ? 'category' : 'search'
  const modes = form.querySelector('[data-job-modes]')
  modes.addEventListener('click', (e) => {
    const item = e.target.closest('[data-job-mode]')
    if (!item || item.dataset.jobMode === mode) return
    mode = item.dataset.jobMode
    // 대분류만 고르다 만 채로 떠나면 그것은 버립니다. 보이지 않는 탭에 반쯤 고른 것이
    // 남아 있으면, 저장할 때 보이지도 않는 칸이 빠졌다고 하게 됩니다.
    if (mode === 'search' && $('job-major').value && !$('job-minor').value) {
      $('job-major').value = ''
      syncJob()
    }
    form.dispatchEvent(new Event('change'))
  })
  // 분류로 중분류까지 골랐으면 검색으로 골라둔 것은 내려놓습니다.
  $('job-minor').addEventListener('change', () => {
    if (!$('job-minor').value) return
    confirmed = ''
    jobInput.value = ''
  })

  // 열릴 탭이 고른 칸으로 서 있어야 합니다(segmented-control.js 가 그 칸을 잽니다).
  for (const item of modes.querySelectorAll('[data-job-mode]')) {
    const on = item.dataset.jobMode === mode
    item.classList.toggle('is-selected', on)
    item.setAttribute('aria-selected', String(on))
  }

  const cards = document.querySelectorAll('[data-profile-card]')
  const promos = document.querySelectorAll('[data-profile-promo]')

  initProfileForm({
    form,
    part: 'basic',
    saved: '기본 프로필을 저장했어요',
    validate: (draft) => missing(form, draft),
    render(profile, draft) {
      sync(draft)
      for (const card of cards) card.replaceChildren(cardHeader(profile), cardGrid(facts(profile, draft)))
      // 상세 프로필을 한 번이라도 저장했으면 더 권하지 않습니다.
      for (const promo of promos) promo.hidden = Boolean(profile.detail)
    },
    /* 상세 프로필을 아직 쓰지 않았고 권한 적도 없으면, 저장 알림이 사라진 뒤에
       한 번 권합니다. 알림과 겹쳐 뜨면 저장이 됐는지를 읽기 전에 다음 것을 묻게 됩니다. */
    afterSave(profile) {
      if (profile.detail || profile.promoShown) return
      const root = getComputedStyle(document.documentElement)
      const wait = parseFloat(root.getPropertyValue('--_toast-duration')) +
        parseFloat(root.getPropertyValue('--_duration-base'))
      setTimeout(() => {
        profile.promoShown = true
        store({ ...load(), promoShown: true })
        openConfirm('profile-promo')
      }, wait)
    },
  })

  // 저장돼 있던 직업은 이미 받아들여진 것입니다. 여기서부터가 돌아갈 자리입니다.
  confirmed = jobInput.value
}
