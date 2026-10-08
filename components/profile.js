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
import { cardGrid, cardHeader, cardRow, initProfileForm, load, store } from './profile-form.js?v=d6b4971e'

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
  parent.addEventListener('change', sync)
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
    cardRow('직업', draft['job-mode'] === 'search'
      ? draft['job-search'].trim()
      : draft['job-minor'] || draft['job-major']),
    cardRow('근무지', draft['work-none']
      ? '고정 근무지 없음'
      : join(draft['work-sido'], draft['work-gugun'])),
    cardRow('혼인 경험', married.length ? married.join(' · ') : '없음', { wide: true }),
    cardRow('자녀', draft.kids === 'yes'
      ? join('있음', draft['kids-count'], draft['kids-custody'])
      : draft.kids === 'none' ? '없음' : '', { wide: true }),
  ]
}

export function initProfile() {
  const form = document.querySelector('[data-profile-form]')
  if (!form) return
  const $ = (name) => form.elements[name]

  const syncHome = chain($('home-sido'), $('home-gugun'), REGIONS)
  const syncWork = chain($('work-sido'), $('work-gugun'), REGIONS)
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

  /* 칸끼리 얽힌 것들. 폼이 바뀔 때마다 통째로 다시 맞춥니다 — 무엇이 바뀌었는지
     가려 가며 고치면, 저장된 값을 처음 써넣을 때처럼 사건 없이 바뀐 자리를 놓칩니다. */
  function sync(draft) {
    heightText.textContent = `${draft.height}cm`

    const search = draft['job-mode'] === 'search'
    form.querySelector('[data-job-search]').hidden = !search
    form.querySelector('[data-job-category]').hidden = search

    $('work-sido').disabled = $('work-gugun').disabled = draft['work-none']

    form.querySelector('[data-period="married"]').hidden = draft.married !== 'yes'
    form.querySelector('[data-period="cohabited"]').hidden = !draft.cohabited
    form.querySelector('[data-periods]').hidden = draft.married !== 'yes' && !draft.cohabited
    form.querySelector('[data-kids-detail]').hidden = draft.kids !== 'yes'

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

  /* 검색 ↔ 카테고리. segmented-control.js 가 고른 칸을 옮기고, 여기서는 어느 쪽이
     골라졌는지만 폼에 적습니다. */
  const modes = form.querySelector('[data-job-modes]')
  modes.addEventListener('click', (e) => {
    const item = e.target.closest('[data-job-mode]')
    if (!item) return
    $('job-mode').value = item.dataset.jobMode
    $('job-mode').dispatchEvent(new Event('change', { bubbles: true }))
  })

  // 저장된 쪽이 고른 칸으로 서 있어야 합니다(segmented-control.js 가 그 칸을 잽니다).
  for (const item of modes.querySelectorAll('[data-job-mode]')) {
    const on = item.dataset.jobMode === stored['job-mode']
    item.classList.toggle('is-selected', on)
    item.setAttribute('aria-selected', String(on))
  }

  const cards = document.querySelectorAll('[data-profile-card]')
  const promos = document.querySelectorAll('[data-profile-promo]')

  initProfileForm({
    form,
    part: 'basic',
    saved: '기본 프로필을 저장했어요',
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

}
