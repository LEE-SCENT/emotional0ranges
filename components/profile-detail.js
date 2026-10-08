/**
 * 상세 프로필 화면.
 *
 *   import { initProfileDetail } from './components/profile-detail.js'
 *   initProfileDetail()
 *
 * 물음은 아래 QUESTIONS 한 곳에 있습니다. 서른 가까운 물음에 선택지가 백오십 개라,
 * 마크업에 적어두면 선택지 하나를 고칠 때 폼과 카드 두 군데를 찾아 고치게 됩니다.
 * 여기서 폼을 그리고, 같은 목록으로 카드도 그립니다.
 *
 * 탭은 넷이고 저장은 하나입니다 — 탭은 한 폼을 나눠 보는 것일 뿐이라, 어느 탭에서
 * 저장하든 네 탭의 것이 함께 저장됩니다.
 */
import { cardGrid, cardHeader, cardRow, el, initProfileForm } from './profile-form.js?v=a86f3f27'

/**
 * 물음 하나.
 *
 *   tab      어느 탭에 서는지.
 *   name     폼에서의 이름.
 *   label    폼의 이름표. max 가 있으면 뒤에 "(최대 n개)" 가 붙습니다.
 *   card     카드의 이름표. 없으면 label 을 씁니다.
 *   multi    여럿 고를 수 있는지. max 가 있으면 그만큼까지입니다.
 *   cols     넓은 화면의 칸 수. 없으면 글자 폭대로 흘러갑니다.
 *   short    카드에 적을 때 줄이는 법("평일 근무" → "평일").
 *   other    "기타" 를 고르면 글로 받는 칸이 열립니다.
 *
 * ⚠️ 이름표에 "(최대 n개)" 가 없는 물음 가운데 여럿 고르는 것(기타)은 Figma 의
 *    예시에서 둘이 함께 켜져 있는 것을 보고 정했습니다. 흡연과 데이트 횟수는 하나만
 *    켜져 있어 하나만 고르게 했습니다.
 */
const QUESTIONS = [
  {
    tab: 'info', name: 'charms', label: '나의 매력', multi: true, max: 5, cols: 3,
    options: ['착하다', '똑똑하다', '재미있다', '자기관리가 잘 되어 있다', '상대에게 잘 맞춰준다',
      '리더십 있다', '애교 · 적극적', '남 얘기를 잘 들어준다', '잘 웃는다', '긍정적이다', '성실하다',
      '야만적이고 진취적', '생활력이 강하다', '외모 자신감 있다', '대인관계 좋다', '편하게 해준다'],
  },

  {
    tab: 'life', name: 'housing', label: '주거 형태', multi: true, max: 3, cols: 4,
    options: ['1인 가구', '가족과 함께', '기숙사 · 숙소 거주', '룸메이트 있음'],
  },
  {
    tab: 'life', name: 'work-style', label: '근무 유형', multi: true, max: 3, cols: 4,
    options: ['평일 근무', '교대 근무', '주말 근무', '스케줄 근무', '야간 근무', '규칙적인 근무',
      '재택 근무', '유연 근무', '출장이 잦아요'],
    short: (text) => text.replace(/ 근무$/, ''),
  },
  {
    tab: 'life', name: 'lifestyle', label: '생활패턴', card: '생활 패턴', multi: true, max: 3, cols: 4,
    options: ['집돌이', '아침형 인간', '올빼미형 인간', '부지런히 자기계발', '꾸준한 운동', '워커홀릭',
      '일-집-일-집', '취미 부자'],
  },
  {
    tab: 'life', name: 'assets', label: '기타', multi: true, cols: 4,
    options: ['자가 보유', '자차 보유', '고액 연봉', '요리를 잘해요', '집안일 잘해요'],
  },
  {
    tab: 'life', name: 'drinking', label: '음주 성향', multi: true, max: 5, cols: 4,
    options: ['아예 안 마셔요', '주 5회 이상', '주 3-4회', '주 1-2회', '주량이 세요', '주량이 약해요',
      '위스키', '와인', '맥주', '소주', '사케', '막걸리', '칵테일'],
  },
  {
    tab: 'life', name: 'smoking', label: '흡연', cols: 4,
    options: ['비흡연', '연초', '전자담배', '금연 노력중'],
  },
  {
    tab: 'life', name: 'pets', label: '반려동물', multi: true, max: 3, cols: 4,
    options: ['없음', '개', '고양이', '어류', '조류', '설치류', '파충류', '기타'],
  },
  {
    tab: 'life', name: 'hobbies', label: '취미', multi: true, max: 3, cols: 4,
    options: ['아웃도어 · 여행', '운동 · 스포츠', '인문학 · 책 · 글', '외국 · 언어', '문화 · 공연 · 축제',
      '음악 · 악기', '공예 · 만들기', '댄스 · 무용', '봉사활동', '맛집 · 사교', '차 · 바이크',
      '사진 · 영상', '스포츠 관람', '게임 · 오락', '요리 · 제조', '반려동물', '자기계발 · 재태크'],
  },

  {
    tab: 'values', name: 'date-count', label: '이상적인 데이트 횟수',
    options: ['주1회', '주2회', '주3회', '주말만 함께', '가능한 날은 모두 함께'],
    short: (text) => text.replace(/^주(\d)/, '주 $1'),
  },
  {
    tab: 'values', name: 'date-style', label: '선호하는 데이트', multi: true, max: 3, cols: 2,
    options: ['캠핑 등산 등 자연 속 데이트', '놀이공원 쇼핑몰 등 활동적인 데이트', '편안한 집 데이트',
      '조용한 동네 카페나 공원 데이트', '핫플 탐방하고 사진 찍기', '영화 전시회 등 문화생활 데이트',
      '맛집에서 술 한 잔', '각자 할 일 하며 함께 시간 보내기', '근교 드라이브나 여행 가기',
      '운동, 게임 등 취미생활 같이 하기'],
  },
  {
    tab: 'values', name: 'friends', label: '남사친, 여사친에 대해 어떻게 생각하세요?', cols: 2, other: true,
    options: ['거짓말만 하지 않는다면 만나도 된다', '만나지만 않는다면 연락 정도는 괜찮다',
      '남녀 사이에 친구란 있을 수 없다', '기타'],
  },
  {
    tab: 'values', name: 'ideal', label: '선호하는 이성 스타일', multi: true, max: 3, cols: 3,
    options: ['귀여운', '지적인', '섹시한', '다정한', '운동하는', '예의 바른', '나에게 잘 맞춰주는',
      '긍정적인', '나를 리드하고 적극적인', '차분하고 조용한', '섬세하고 잘 챙겨주는', '유쾌하고 재밌는',
      '자기관리를 잘 하는', '열정적이고 발전 지향적인', '현재에 만족하고 즐길 줄 아는',
      '내향적인 집돌 집순이', '외향적인 밖돌 밖순이'],
  },
  /* 결혼과 자녀는 따로 묻습니다. Figma 는 여섯을 "결혼 가치관" 한 물음에 두고 예시에서
     둘(3-4년 안에 · 딩크)이 켜져 있어 여럿 고르는 물음으로 읽었는데, 그러면 "비혼주의"와
     "1-2년 안에 결혼", "딩크"와 "자녀가 있었으면"이 함께 켜집니다. 여섯은 두 물음이
     섞인 것이라 — 예시도 각각에서 하나씩 고른 모습입니다 — 나누고 하나씩만 받습니다.
     ⚠️ "자녀 가치관"이라는 이름표는 Figma 에 없습니다. */
  {
    tab: 'values', name: 'marriage', label: '결혼 가치관', cols: 2,
    options: ['비혼주의', '아직 결혼 생각은 없어요', '1-2년 안에 결혼하고 싶어요',
      '3-4년 안에 결혼하고 싶어요'],
  },
  {
    tab: 'values', name: 'children', label: '자녀 가치관', cols: 2,
    options: ['딩크를 원해요', '자녀가 있었으면 좋겠어요'],
  },
  {
    tab: 'values', name: 'money', label: '경제 가치관', multi: true, max: 3, cols: 2,
    options: ['경제적 자유를 꿈꿔요', 'N잡, 부업에 관심 있어요', '높은 수입보다 일상의 즐거움이 중요해요',
      '예금, 적금 등 안전 지향형', '주식, 부동산 등 약간 공격형', '코인, 선물 등 공격형', '소비 후 저축',
      '저축 후 소비', '저축을 많이 해요'],
  },
]

/** MBTI 는 물음 넷이 한 덩어리입니다. 줄마다 둘 가운데 하나를 고릅니다. */
const MBTI = [
  ['mbti-ei', ['I', '내향'], ['E', '외향']],
  ['mbti-ns', ['N', '직관'], ['S', '감각']],
  ['mbti-tf', ['T', '사고'], ['F', '감정']],
  ['mbti-jp', ['J', '판단'], ['P', '인식']],
]

/** 학력마다 고를 수 있는 학적 상태가 다릅니다 — 고등학교에는 재학이 없고, 수료는
    석사·박사에만 있습니다. */
const EDU_STATUS = {
  고등학교: ['졸업', '중퇴'],
  전문대: ['재학', '졸업', '중퇴'],
  대학교: ['재학', '졸업', '중퇴'],
  석사: ['재학', '수료', '졸업', '중퇴'],
  박사: ['재학', '수료', '졸업', '중퇴'],
}

const TABS = ['info', 'life', 'values', 'words']

function choice(type, name, value, text = value) {
  const label = el('label', 'choice')
  const input = el('input')
  input.type = type
  input.name = name
  input.value = value
  label.append(input, el('span', '', text))
  return label
}

/** 물음 하나를 폼의 칸으로. */
function question(q) {
  const field = el('div', 'field')
  field.setAttribute('role', 'group')
  const title = q.max ? `${q.label} (최대 ${q.max}개)` : q.label
  field.setAttribute('aria-label', title)
  field.append(el('span', 'field__label', title))

  const group = el('div', `choice-group${q.cols ? ` choice-group--cols-${q.cols}` : ''}`)
  if (q.max) group.dataset.max = q.max
  for (const option of q.options) group.append(choice(q.multi ? 'checkbox' : 'radio', q.name, option))
  field.append(group)

  if (q.other) {
    const box = el('div', 'text-field')
    box.dataset.other = q.name
    box.hidden = true
    const input = el('input')
    input.type = 'text'
    input.name = `${q.name}-other`
    // ⚠️ 안내 문구가 Figma 에 없습니다(입력된 예시만 있습니다). 학교 칸의 말투를 따랐습니다.
    input.placeholder = '의견 입력'
    input.setAttribute('aria-label', `${q.label} 기타 의견`)
    box.append(input)
    field.append(box)
  }
  return field
}

function mbti() {
  const field = el('div', 'field')
  field.setAttribute('role', 'group')
  field.setAttribute('aria-label', 'MBTI')
  field.append(el('span', 'field__label', 'MBTI'))
  const group = el('div', 'choice-group choice-group--cols-2 choice-group--pair')
  for (const [name, ...pair] of MBTI) {
    for (const [letter, word] of pair) group.append(choice('radio', name, letter, `${letter} · ${word}`))
  }
  field.append(group)
  return field
}

/* ---- 카드 --------------------------------------------------------------- */

const chosen = (q, draft) => {
  const picked = q.multi ? draft[q.name] ?? [] : draft[q.name] ? [draft[q.name]] : []
  return picked.map((text) => {
    if (q.other && text === '기타' && draft[`${q.name}-other`]?.trim()) {
      return `기타 · ${draft[`${q.name}-other`].trim()}`
    }
    return q.short ? q.short(text) : text
  })
}

const detailOf = {
  info(draft) {
    const letters = MBTI.map(([name]) => draft[name]).join('')
    const words = MBTI.map(([name, ...pair]) => pair.find(([letter]) => letter === draft[name])?.[1])
      .filter(Boolean).join('·')
    let type = null
    if (letters) {
      type = document.createDocumentFragment()
      type.append(el('b', 'profile-card__mbti', letters), el('span', 'profile-card__mbti-desc', words))
    }
    const edu = [draft['edu-level'], draft['edu-status']].filter(Boolean).join(' · ')
    return [
      cardRow('MBTI', type, { wide: true }),
      cardRow('학력 · 학적 상태', edu),
      // 공개하겠다고 한 학교만 카드에 섭니다.
      cardRow('학교', draft['school-public'] ? draft.school.trim() : ''),
      cardRow('나의 매력', chosen(QUESTIONS[0], draft), { wide: true }),
    ]
  },
  life: (draft) => QUESTIONS.filter((q) => q.tab === 'life')
    .map((q) => cardRow(q.card ?? q.label, chosen(q, draft), { wide: true })),
  values: (draft) => QUESTIONS.filter((q) => q.tab === 'values')
    .map((q) => cardRow(q.card ?? q.label, chosen(q, draft), { wide: true })),
}

/** 탭 하나에 카드 한 장. 한마디만 이름표와 생김새가 다릅니다. */
function card(profile, draft, tab) {
  const detail = el('div', 'profile-card__detail')
  if (tab === 'words') {
    detail.append(
      el('p', 'profile-card__kicker', '한마디'),
      el('p', 'profile-card__words', draft.words),
    )
  } else {
    detail.append(el('p', 'profile-card__kicker', '상세 프로필'), cardGrid(detailOf[tab](draft)))
  }
  return [cardHeader(profile), el('hr', 'profile-card__divider'), detail]
}

export function initProfileDetail() {
  const form = document.querySelector('[data-profile-form]')
  if (!form) return

  // 물음을 제 탭의 제 자리에 세웁니다. 자리(data-q)가 따로 없으면 탭의 끝에 섭니다.
  const panels = Object.fromEntries(TABS.map((tab) => [tab, form.querySelector(`[data-panel="${tab}"]`)]))
  form.querySelector('[data-q="mbti"]').replaceWith(mbti())
  for (const q of QUESTIONS) {
    const slot = panels[q.tab].querySelector(`[data-q="${q.name}"]`)
    if (slot) slot.replaceWith(question(q))
    else panels[q.tab].append(question(q))
  }

  const statuses = form.querySelector('[data-edu-status]')
  const count = form.querySelector('[data-words-count]')
  let tab = 'info'

  /* 학력이 바뀌면 고를 수 있는 학적 상태도 바뀝니다. 새 목록에 없는 것은 풀립니다. */
  function drawStatuses(level, keep) {
    if (statuses.dataset.for === level) return
    statuses.dataset.for = level
    const list = EDU_STATUS[level] ?? []
    statuses.replaceChildren(...list.map((status) => choice('radio', 'edu-status', status)))
    statuses.hidden = !list.length
    const kept = [...statuses.querySelectorAll('input')].find((input) => input.value === keep)
    if (kept) kept.checked = true
  }

  function sync(draft) {
    drawStatuses(draft['edu-level'], draft['edu-status'])

    for (const box of form.querySelectorAll('[data-other]')) {
      box.hidden = draft[box.dataset.other] !== '기타'
    }
    count.textContent = [...draft.words].length
  }

  const aside = document.querySelector('.profile__aside [data-profile-card]')
  const previews = document.querySelectorAll('.profile-preview [data-profile-card]')

  const { refresh } = initProfileForm({
    form,
    part: 'detail',
    saved: '상세 프로필을 저장했어요',
    // 학력의 목록을 먼저 그려둡니다. 학적 상태를 써넣을 때 고를 것이 이미 있어야 합니다.
    prepare: (values) => drawStatuses(values['edu-level'] ?? ''),
    render(profile, draft) {
      sync(draft)
      // 옆 단의 카드는 지금 보고 있는 탭의 것, 미리보기 창에는 넷이 나란히 섭니다.
      aside.replaceChildren(...card(profile, draft, tab))
      for (const node of previews) node.replaceChildren(...card(profile, draft, node.dataset.profileCard))
    },
  })

  /* ---- 탭 ---------------------------------------------------------------
     밑줄을 옮기는 것은 tabs.js 가, 판을 갈아 끼우는 것은 여기서 합니다. */
  const tabs = document.querySelector('[data-profile-tabs]')
  const showTab = (name) => {
    tab = name
    for (const [key, panel] of Object.entries(panels)) panel.hidden = key !== tab
    for (const button of tabs.querySelectorAll('[data-tab]')) {
      button.setAttribute('aria-selected', String(button.dataset.tab === tab))
    }
    refresh()
  }
  tabs.addEventListener('click', (e) => {
    const item = e.target.closest('[data-tab]')
    if (!item) return
    showTab(item.dataset.tab)
    // 어느 탭인지를 주소에 적어둡니다(#values). 새로고침해도 보던 탭으로 돌아오고, 그 탭을
    // 가리키는 링크도 됩니다. 뒤로 가기에 탭마다 한 칸씩 쌓이지 않도록 갈아 끼웁니다.
    history.replaceState(null, '', `#${tab}`)
  })

  /* 주소에 탭이 적혀 있으면 그 탭에서 시작합니다. 밑줄은 tabs.js 가 is-active 인 항목을
     재서 그리므로(이 뒤에 돕니다), 눌린 것처럼 그 표시까지 옮겨둡니다. */
  const asked = location.hash.slice(1)
  if (asked !== tab && TABS.includes(asked)) {
    for (const button of tabs.querySelectorAll('[data-tab]')) {
      const on = button.dataset.tab === asked
      button.classList.toggle('is-active', on)
      if (on) button.setAttribute('aria-current', 'true')
      else button.removeAttribute('aria-current')
    }
    showTab(asked)
  }

  // 미리보기 창은 지금 보고 있는 탭의 카드부터 보여줍니다.
  document.getElementById('profile-preview')?.addEventListener('profile-preview:open', (e) => {
    e.currentTarget.querySelector(`[data-profile-card="${tab}"]`)
      ?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'instant' })
  })
}
