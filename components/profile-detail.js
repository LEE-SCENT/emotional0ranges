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
 * 구획은 넷(상세 정보 · 라이프 · 가치관 · 한마디)이고 한 페이지에 이어집니다. 탭은
 * 구획으로 가는 길이고, 저장은 하나라 넷이 함께 저장됩니다.
 */
import { cardGrid, cardHeader, cardRow, el, initProfileForm, load, swap } from './profile-form.js?v=25fd6e27'
import { selectTab } from './tabs.js?v=aec7319a'

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
 *   seon     선개팅 추가 프로필(profile-detail.html 의 data-seon)에 섭니다. 모두 답하지 않아도
 *            되고, 선개팅 모임에서 상대가 볼 때만 보여 완성도에도 프로필 카드에도 들지 않습니다.
 *   only     여럿 고르는 물음에서 홀로 서야 하는 선택지(외동 · 밝히고 싶지 않음). 고르면 나머지가
 *            풀리고, 나머지를 고르면 이것이 풀립니다.
 *   word     가입한 사람의 성별에 따라 달리 적는 선택지({ 값: { 여성: '…' } }). 값은 그대로이고
 *            보이는 글자만 바뀝니다.
 *   other    이 선택지("기타 의견" 같은)를 고르면 글로 받는 칸이 열립니다.
 *   sensitive 민감정보(개인정보 보호법 제23조)라 동의한 사람에게만 묻습니다. 동의하지
 *            않으면 칸도, 카드의 줄도, 완성도의 셈도 없습니다.
 *
 * ⚠️ 이름표에 "(최대 n개)" 가 없는 물음 가운데 여럿 고르는 것(기타)은 Figma 의
 *    예시에서 둘이 함께 켜져 있는 것을 보고 정했습니다. 흡연과 데이트 횟수는 하나만
 *    켜져 있어 하나만 고르게 했습니다.
 */
const QUESTIONS = [
  {
    tab: 'info', name: 'charms', label: '나의 매력', multi: true, max: 5, cols: 3,
    options: ['착하다', '똑똑하다', '재미있다', '자기관리가 잘 되어 있다', '상대에게 잘 맞춰준다',
      '리더십 있다', '애교·적극적', '남 얘기 잘 들어준다', '잘 웃는다', '긍정적이다', '성실하다',
      '야망 있고 진취적', '생활력이 강하다', '외모 자신감 있다', '대인관계 좋다', '편하게 해준다'],
  },

  {
    tab: 'life', name: 'housing', label: '주거 형태', multi: true, max: 3, cols: 4,
    options: ['1인 가구', '가족과 함께', '기숙사·숙소 거주', '룸메이트 있음'],
  },
  {
    tab: 'life', name: 'work-style', label: '근무 유형', multi: true, max: 3, cols: 4,
    options: ['평일 근무', '교대 근무', '주말 근무', '스케줄 근무', '야간 근무', '규칙적인 근무',
      '재택 근무', '유연 근무', '출장이 잦아요'],
    short: (text) => text.replace(/ 근무$/, ''),
  },
  {
    tab: 'life', name: 'lifestyle', label: '생활 패턴', multi: true, max: 3, cols: 4,
    /* 기존 사이트는 가입한 사람의 성별에 따라 집돌이 · 집순이로 적습니다. 값은 '집돌이' 하나로
       둡니다 — 성별로 값까지 갈리면 재인증으로 성별이 바뀐 날 고른 것이 풀립니다. */
    word: { 집돌이: { 여성: '집순이' } },
    options: ['집돌이', '아침형 인간', '올빼미형 인간', '부지런히 자기계발', '꾸준한 운동', '워커홀릭',
      '일-집-일-집', '취미 부자'],
  },
  {
    tab: 'life', name: 'assets', label: '기타', multi: true, cols: 4,
    options: ['자가 보유', '자차 보유', '고액 연봉', '요리를 잘해요', '집안일 잘해요'],
  },
  {
    tab: 'life', name: 'drinking', label: '음주 성향', multi: true, max: 5, cols: 4,
    options: ['주 5회 이상', '주 3-4회', '주 1-2회', '한 달에 1-2회', '아예 안 마셔요', '주량이 세요',
      '주량이 약해요', '위스키', '와인', '맥주', '소주', '사케', '막걸리', '칵테일'],
  },
  {
    tab: 'life', name: 'smoking', label: '흡연', cols: 4,
    options: ['비흡연', '연초', '전자담배', '금연 노력 중'],
  },
  {
    tab: 'life', name: 'pets', label: '반려동물', multi: true, max: 3, cols: 4,
    options: ['없음', '개', '고양이', '어류', '조류', '설치류', '파충류', '기타'],
  },
  {
    tab: 'life', name: 'hobbies', label: '취미', multi: true, max: 3, cols: 4,
    options: ['아웃도어·여행', '운동·스포츠', '인문학·책·글', '외국·언어', '문화·공연·축제',
      '음악·악기', '공예·만들기', '댄스·무용', '봉사활동', '맛집·사교', '차·바이크',
      '사진·영상', '스포츠 관람', '게임·오락', '요리·제조', '반려동물', '자기계발·재테크'],
  },

  {
    tab: 'values', name: 'date-count', label: '이상적인 데이트 횟수',
    options: ['주 1회', '주 2회', '주 3회', '주말만 함께', '가능한 날은 모두 함께'],
  },
  {
    tab: 'values', name: 'date-style', label: '선호하는 데이트', multi: true, max: 3, cols: 2,
    options: ['캠핑 등산 등 자연 속 데이트', '놀이공원 쇼핑몰 등 활동적인 데이트', '편안한 집 데이트',
      '조용한 동네 카페나 공원 데이트', '핫플 탐방하고 사진 찍기', '영화 전시회 등 문화생활 데이트',
      '맛집에서 술 한 잔', '각자 할 일 하며 함께 시간 보내기', '근교 드라이브나 여행 가기',
      '운동, 게임 등 취미생활 같이 하기'],
  },
  {
    tab: 'values', name: 'friends', label: '남사친, 여사친에 대해 어떻게 생각하세요?', cols: 2, other: '기타 의견',
    options: ['거짓말만 하지 않는다면 만나도 된다', '만나지만 않는다면 연락 정도는 괜찮다',
      '남녀 사이에 친구란 있을 수 없다', '기타 의견'],
  },
  {
    tab: 'values', name: 'ideal', label: '선호하는 이성 스타일', multi: true, max: 3, cols: 3,
    options: ['귀여운', '지적인', '섹시한', '다정한', '운동하는', '예의 바른', '나에게 잘 맞춰주는',
      '긍정적인', '나를 리드하고 적극적인', '차분하고 조용한', '섬세하고 잘 챙겨주는', '유쾌하고 재밌는',
      '자기관리를 잘하는', '열정적이고 발전 지향적인', '현재에 만족하고 즐길 줄 아는',
      '내향적인 집돌 집순이', '외향적인 밖돌 밖순이'],
  },
  /* 운영 사이트와 같이 결혼과 자녀를 한 물음에 둡니다. 결혼 시기와 자녀 계획을 함께
     고를 수 있어야 해서(3-4년 안에 + 딩크) 여럿 고르는 물음입니다. */
  {
    tab: 'values', name: 'marriage', label: '결혼 가치관', multi: true, cols: 2,
    options: ['비혼주의', '아직 결혼 생각은 없어요', '1-2년 안에 결혼하고 싶어요',
      '3-4년 안에 결혼하고 싶어요', '딩크를 원해요', '자녀가 있었으면 좋겠어요'],
  },
  {
    tab: 'values', name: 'money', label: '경제 가치관', multi: true, max: 3, cols: 2,
    options: ['경제적 자유를 꿈꿔요', 'N잡, 부업에 관심 있어요', '높은 수입보다 일상의 즐거움이 중요해요',
      '예금, 적금 등 안전 지향형', '주식, 부동산 등 약간 공격형', '코인, 선물 등 공격형', '소비 후 저축',
      '저축 후 소비', '저축을 많이 해요'],
  },

  /* ---- 선개팅 추가 프로필 ---------------------------------------------------
     기존 사이트에서 옮겨 왔습니다. 자리는 profile-detail.html 의 data-q 입니다.
     기존 사이트는 고르는 방식(하나 · 여럿)을 따로 적지 않아, 선택지가 서로를 밀어내면
     하나로, 함께 참일 수 있으면 여럿으로 정했습니다. */
  {
    tab: 'values', name: 'seon-leave', label: '육아 휴직 가능 여부', seon: true,
    options: ['가능', '불가', '모름'],
  },
  /* 운영 사이트와 같이 관리 방식과 맞벌이 · 외벌이가 한 물음에 섭니다. 둘을 함께 고를 수
     있어야 해서(공동 관리 + 맞벌이 희망) 여럿 고르는 물음입니다. */
  {
    tab: 'values', name: 'seon-money', label: '이상적인 경제 관리', seon: true, multi: true, cols: 2,
    options: ['한 사람이 전적으로 관리', '공동관리(협의 후 분배)', '각자 관리(필요 비용만 공유)',
      '상황에 따라 유연하게 결정', '맞벌이 희망', '외벌이 희망'],
  },
  {
    tab: 'values', name: 'seon-in-laws', label: '이상적인 가족 관계', seon: true, cols: 2, other: '기타의견',
    options: ['양가에 자주 찾아뵙고 교류하는 편이 좋다', '명절이나 중요한 때만 챙기면 된다',
      '최소한의 예의만 지키면 된다', '특별한 기준 없이 상황에 따라 맞춘다', '기타의견'],
  },
  {
    tab: 'values', name: 'seon-income', label: '연소득', seon: true,
    options: ['4천 이하', '4천~6천', '6천~1억', '1억~2억', '2억 이상'],
  },
  {
    tab: 'values', name: 'seon-assets', label: '자산 규모', seon: true,
    options: ['5천 미만', '5천~1억', '1억~3억', '3억~5억', '5억~10억', '10억 이상'],
  },
  {
    tab: 'values', name: 'seon-father', label: '아버지 생존 여부', seon: true,
    options: ['생존', '별세', '밝히고 싶지 않음'],
  },
  {
    tab: 'values', name: 'seon-father-job', label: '아버지 직업군', seon: true,
    options: ['회사원', '사업·자영업', '전문직', '공무원·공공기관', '은퇴', '주부', '기타'],
  },
  {
    tab: 'values', name: 'seon-mother', label: '어머니 생존 여부', seon: true,
    options: ['생존', '별세', '밝히고 싶지 않음'],
  },
  {
    tab: 'values', name: 'seon-mother-job', label: '어머니 직업군', seon: true,
    options: ['회사원', '사업·자영업', '전문직', '공무원·공공기관', '은퇴', '주부', '기타'],
  },
  /* 형제자매는 여럿입니다(형도 여동생도 있을 수 있습니다). 외동과 밝히고 싶지 않음만
     홀로 섭니다 — "외동"과 "남동생 있음"이 함께 켜진 답은 어느 쪽도 믿을 수 없습니다. */
  {
    tab: 'values', name: 'seon-siblings', label: '형제자매', seon: true, multi: true, cols: 3,
    only: ['외동', '밝히고 싶지 않음'],
    options: ['외동', '형/오빠 있음', '누나/언니 있음', '남동생 있음', '여동생 있음', '밝히고 싶지 않음'],
  },

  /* 기존 사이트(dev-app)에서 동의한 뒤 열리는 두 물음. 선택지와 차례도 그대로입니다.
     동의 아래에 섭니다(profile-detail.html 의 data-sensitive).
     기존 사이트의 동의 고지는 "종교 참여 정도"도 수집 항목으로 적고 있지만, 동의한 뒤에
     그 물음은 없습니다. 묻지 않는 것을 수집한다고 적지 않도록 고지에서도 뺐습니다. */
  {
    tab: 'values', name: 'politics', label: '정치 성향', sensitive: true,
    options: ['보수', '진보', '중도', '관심 없음', '밝히고 싶지 않음'],
  },
  {
    tab: 'values', name: 'religion', label: '종교', sensitive: true,
    options: ['기독교', '불교', '천주교', '무교', '기타 종교', '밝히고 싶지 않음'],
  },
]

/** 이 물음을 지금 묻는지. 민감정보는 동의한 사람에게만 묻습니다. */
const isAsked = (q, draft) => !q.sensitive || Boolean(draft['sensitive-consent'])

/* ---- 완성도 -------------------------------------------------------------
   카드 교환의 문턱입니다. 물음 하나가 한 칸이고, MBTI 는 넷을 다 골라야 한 칸입니다.

   민감정보는 운영 사이트와 같이 동의한 사람에게만 셈에 듭니다("동의하지 않으면 프로필
   완성도에서도 제외"). 선개팅 추가 프로필은 모두 선택이라 셈에 들지 않습니다. */

/** 이 넘으면 프로필 카드를 교환할 수 있습니다(%). */
export const EXCHANGE_AT = 80

/**
 * @param {object} draft  상세 프로필의 값. 한 번도 쓰지 않았으면 {}.
 * @returns {{ percent: number, need: number, missing: string[] }}
 *   need 는 문턱까지 더 채워야 하는 칸의 수, missing 은 비어 있는 칸의 이름(차례대로).
 */
export function progressOf(draft = {}) {
  const filled = (value) => (Array.isArray(value) ? value.length > 0 : Boolean(value?.trim?.() ?? value))
  const units = [
    ['mbti', MBTI.every(([name]) => draft[name])],
    ['edu', filled(draft['edu-level'])],
    ['school', filled(draft.school)],
    ['school-public', filled(draft['school-public'])],
    ...QUESTIONS.filter((q) => !q.seon && isAsked(q, draft)).map((q) => [q.name, filled(draft[q.name])]),
    ['words', filled(draft.words)],
  ]
  const done = units.filter(([, ok]) => ok).length
  return {
    // 내림입니다. 반올림하면 79.5 가 80 으로 서서, 교환할 수 있다고 적힌 채 교환이 막힙니다.
    percent: Math.floor((done / units.length) * 100),
    need: Math.max(0, Math.ceil((units.length * EXCHANGE_AT) / 100) - done),
    missing: units.filter(([, ok]) => !ok).map(([name]) => name),
  }
}

/** MBTI 는 물음 넷이 한 덩어리입니다. 줄마다 둘 가운데 하나를 고릅니다. */
const MBTI = [
  ['mbti-ei', ['I', '내향'], ['E', '외향']],
  ['mbti-ns', ['N', '직관'], ['S', '감각']],
  ['mbti-tf', ['T', '사고'], ['F', '감정']],
  ['mbti-jp', ['J', '판단'], ['P', '인식']],
]

/** [n 채우기] 버튼에 적기에 긴 물음의 줄인 이름. */
const BRIEF = { friends: '남사친·여사친' }

/** 학교 공개 여부에서 "공개"의 값(운영 사이트의 글자 그대로). */
const SCHOOL_PUBLIC = '공개 (노출함)'

const TABS = ['info', 'life', 'values', 'words']
/** 마지막 어필이 이보다 길면 카드에서 본문 크기로 내려 적습니다(글자 수). 예전 한도(100)입니다. */
const WORDS_SHORT = 100
/** 구획의 이름. 탭에 적힌 것과 같고, 카드의 머리말에도 섭니다. */
const TAB_NAMES = { info: '상세 정보', life: '라이프', values: '가치관', words: '한마디' }

function choice(type, name, value, text = value) {
  const label = el('label', 'choice')
  const input = el('input')
  input.type = type
  input.name = name
  input.value = value
  label.append(input, el('span', '', text))
  return label
}

/** 본인인증으로 들어온 성별. 화면을 그릴 때 한 번 읽습니다(initProfileDetail). */
let gender = ''

/** 선택지가 화면과 카드에 적히는 글자. */
const wordOf = (q, option) => q.word?.[option]?.[gender] ?? option

/** 물음 하나를 폼의 칸으로. */
function question(q) {
  const field = el('div', 'field')
  field.dataset.unit = q.name
  field.setAttribute('role', 'group')
  const title = q.max ? `${q.label} (최대 ${q.max}개)` : q.label
  field.setAttribute('aria-label', title)
  field.append(el('span', 'field__label', title))

  const group = el('div', `choice-group${q.cols ? ` choice-group--cols-${q.cols}` : ''}`)
  if (q.max) group.dataset.max = q.max
  for (const option of q.options) {
    group.append(choice(q.multi ? 'checkbox' : 'radio', q.name, option, wordOf(q, option)))
  }
  field.append(group)

  if (q.other) {
    const box = el('div', 'text-field')
    box.dataset.other = q.name
    box.dataset.otherWhen = q.other
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
  field.dataset.unit = 'mbti'
  field.setAttribute('role', 'group')
  field.setAttribute('aria-label', 'MBTI')
  field.append(el('span', 'field__label', 'MBTI'))
  const group = el('div', 'choice-group choice-group--cols-2 choice-group--pair')
  for (const [name, ...pair] of MBTI) {
    for (const [letter, word] of pair) group.append(choice('radio', name, letter, `${letter}: ${word}`))
  }
  field.append(group)
  return field
}

/* ---- 카드 --------------------------------------------------------------- */

const chosen = (q, draft) => {
  const picked = q.multi ? draft[q.name] ?? [] : draft[q.name] ? [draft[q.name]] : []
  return picked.map((text) => {
    if (q.other && text === q.other && draft[`${q.name}-other`]?.trim()) {
      return `${q.other} · ${draft[`${q.name}-other`].trim()}`
    }
    const word = wordOf(q, text)
    return q.short ? q.short(word) : word
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
    return [
      cardRow('MBTI', type, { wide: true }),
      cardRow('학력', draft['edu-level']),
      // 공개하겠다고 한 학교만 카드에 섭니다.
      cardRow('학교', draft['school-public'] === SCHOOL_PUBLIC ? draft.school.trim() : ''),
      cardRow('나의 매력', chosen(QUESTIONS[0], draft), { wide: true }),
    ]
  },
  life: (draft) => QUESTIONS.filter((q) => q.tab === 'life')
    .map((q) => cardRow(q.card ?? q.label, chosen(q, draft), { wide: true })),
  // 선개팅 추가 프로필은 선개팅 모임에서만 보입니다. 늘 보이는 이 카드에는 서지 않습니다.
  values: (draft) => QUESTIONS.filter((q) => q.tab === 'values' && !q.seon && isAsked(q, draft))
    .map((q) => cardRow(q.card ?? q.label, chosen(q, draft), { wide: true })),
}

/** 탭 하나에 카드 한 장. 한마디만 이름표와 생김새가 다릅니다. */
function card(profile, draft, tab) {
  const detail = el('div', 'profile-card__detail')
  if (tab === 'words') {
    detail.append(
      el('p', 'profile-card__kicker', TAB_NAMES.words),
      // 짧은 글은 명조로 크게 섭니다. 길면(2000자까지 받습니다) 같은 크기로는 카드 한
      // 장이 글로 덮여, 본문 크기의 고딕으로 내려 읽히게 둡니다.
      el('p', `profile-card__words${[...draft.words].length > WORDS_SHORT ? ' profile-card__words--long' : ''}`, draft.words),
    )
  } else {
    // 머리말에 어느 구획인지를 적습니다. 구획이 바뀌면 카드의 내용도 바뀌는데, 머리말이
    // 셋 다 "상세 프로필"이면 무엇이 바뀐 것인지 알 길이 없습니다.
    detail.append(
      el('p', 'profile-card__kicker', `상세 프로필 · ${TAB_NAMES[tab]}`),
      cardGrid(detailOf[tab](draft)),
    )
  }
  return [cardHeader(profile), el('hr', 'profile-card__divider'), detail]
}

export function initProfileDetail() {
  const form = document.querySelector('[data-profile-form]')
  if (!form) return
  gender = load().me.gender

  // 물음을 제 탭의 제 자리에 세웁니다. 자리(data-q)가 따로 없으면 탭의 끝에 섭니다.
  const panels = Object.fromEntries(TABS.map((tab) => [tab, form.querySelector(`[data-panel="${tab}"]`)]))
  form.querySelector('[data-q="mbti"]').replaceWith(mbti())
  for (const q of QUESTIONS) {
    const slot = panels[q.tab].querySelector(`[data-q="${q.name}"]`)
    if (slot) slot.replaceWith(question(q))
    else panels[q.tab].append(question(q))
  }
  /* ---- 민감정보 동의 -----------------------------------------------------
     체크가 곧 동의입니다. 체크하면 바로 아래에 두 물음이 열리고, 동의는 고른 칸처럼 바로
     저장됩니다. 동의 덩어리는 이 화면에 있는 동안 체크된 채 남아, 잘못 눌렀으면 그 자리에서
     풉니다 — 풀면 두 물음이 닫히고 답도 지웁니다(동의 철회). 동의한 채로 다시 들어오면
     덩어리 없이 물음만 섭니다. */
  const sensitive = form.querySelector('[data-sensitive]')
  const consent = form.elements['sensitive-consent']
  const agree = sensitive.querySelector('[data-sensitive-agree]')
  let agreedHere = false
  /* 고지는 동의하기 전에는 늘 펼쳐져 있고, 동의하면 접힙니다 — 접지 않으면 막 열린 두
     물음이 긴 고지 아래, 폰에서는 화면 밖에 열려 체크해도 아무 일이 없는 것처럼 보입니다.
     접혀도 무엇에 동의했는지(제목 줄)는 남고, 화살표로 다시 펼쳐 읽습니다. 철회하면 다시
     펼칩니다. */
  const termsToggle = sensitive.querySelector('[data-sensitive-toggle]')
  const openTerms = (open) => {
    sensitive.classList.toggle('is-collapsed', !open)
    termsToggle.setAttribute('aria-expanded', String(open))
    termsToggle.setAttribute('aria-label', open ? '안내 접기' : '안내 펼치기')
  }
  termsToggle.addEventListener('click', () => openTerms(sensitive.classList.contains('is-collapsed')))
  agree.addEventListener('change', () => {
    agreedHere = true
    termsToggle.hidden = !agree.checked
    openTerms(!agree.checked)
    consent.checked = agree.checked
    const names = QUESTIONS.filter((q) => q.sensitive).map((q) => q.name)
    if (!agree.checked) {
      for (const input of form.querySelectorAll(names.map((name) => `input[name="${name}"]`).join())) input.checked = false
    }
    consent.dispatchEvent(new Event('change', { bubbles: true }))
    if (!agree.checked) api.save(names)
  })

  /* 선개팅 추가 프로필은 경제 가치관 앞에 섭니다(기존 사이트의 자리). 접혀 있다가 펼칩니다
     — 모두 고르지 않아도 되는 열 몇 개의 물음이라, 처음부터 펼쳐두면 꼭 채워야 할 것처럼
     화면을 차지합니다. 이미 답한 것이 있으면 펼친 채로 엽니다. */
  const seon = form.querySelector('[data-seon]')
  form.querySelector('[data-unit="money"]').before(seon)
  const seonToggle = seon.querySelector('[data-seon-toggle]')
  const seonBody = seon.querySelector('[data-seon-body]')
  const openSeon = (open) => {
    seonBody.hidden = !open
    seonToggle.setAttribute('aria-expanded', String(open))
    seonToggle.querySelector('.btn__label').textContent = open ? '접기' : '펼치기'
  }
  seonToggle.addEventListener('click', () => openSeon(seonBody.hidden))

  /* 민감정보 동의와 두 물음은 가치관의 맨 끝입니다. 탭의 첫머리에 서면 가장 무겁고
     고르지 않아도 되는 물음이 가벼운 물음들을 가로막습니다 — 다 답한 뒤에 더 답할 수
     있는 것으로 만납니다. */
  panels.values.append(sensitive, ...QUESTIONS.filter((q) => q.sensitive)
    .map((q) => form.querySelector(`[data-unit="${q.name}"]`)))

  /* 홀로 서야 하는 선택지(only). 폼이 값을 읽기 전에(capture) 맞춰둡니다. */
  form.addEventListener('change', (e) => {
    const box = e.target
    const q = QUESTIONS.find((item) => item.only && item.name === box.name)
    if (!q || !box.checked) return
    const alone = q.only.includes(box.value)
    for (const other of form.querySelectorAll(`input[name="${q.name}"]:checked`)) {
      if (other !== box && (alone || q.only.includes(other.value))) other.checked = false
    }
  }, true)

  /* ---- 저장 ---------------------------------------------------------------
     모두 저절로 저장됩니다. 고르는 칸은 고르는 즉시, 글로 쓰는 칸은 칸을 떠날 때(change)
     입니다 — 한 글자마다 저장하면 쓰다 만 문장이 상대가 보는 카드에 오릅니다. 알림도
     "저장됨"도 띄우지 않습니다. 고르는 칸처럼 조용히 저장되고, 저절로 저장된다는 것은
     [완료] 위의 한 줄이 미리 말해둡니다. */
  let api = null
  form.addEventListener('change', (e) => {
    const input = e.target
    if (!api || !input.name || !api.dirty([input.name])) return
    api.save([input.name])
  })

  /* 칸을 떠나지 않고 화면을 떠나는 길 — 폰에서 다른 앱으로 넘어가기, 탭 닫기, 화면
     끄기, 새로고침 — 에서도 쓰던 글을 저장합니다. 그 길에서는 change 가 오지 않아, 저장
     표시도 없는 화면에서 모르는 사이에 글을 잃습니다. 페이지가 가려지는 순간이 마지막으로
     확실히 오는 때입니다. beforeunload 는 폼(profile-form.js)이 "나가시겠습니까?"를
     묻기 전에 받도록 먼저 붙입니다 — 저장했으니 물을 것이 없습니다.
     [저장 안 함]을 고른 뒤에는 저장하지 않습니다. 버리기로 한 글입니다. */
  let discarding = false
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-profile-discard]')) discarding = true
  }, true)
  const saveAll = () => {
    if (discarding || !api?.dirty()) return
    api.save()
  }
  addEventListener('beforeunload', saveAll)
  addEventListener('pagehide', saveAll)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveAll()
  })

  // 한 줄 칸에서 엔터는 쓰기를 마치는 것입니다. 폼을 보내지 않고 그 자리에서 저장합니다.
  for (const input of form.querySelectorAll('input[type="text"][name]')) {
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.isComposing) return
      e.preventDefault()
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })
  }

  /* [완료] — 다 됐으면 나갑니다. 저장하지 않은 글이 남아 있으면 함께 저장하고 나갑니다. */
  for (const done of document.querySelectorAll('[data-profile-done]')) {
    done.addEventListener('click', () => {
      if (api.dirty()) api.save()
      if (history.length > 1) history.back()
      else location.href = './my.html'
    })
  }

  const progress = document.querySelector('[data-progress]')
  // 문턱(EXCHANGE_AT)은 숫자로도 눈금으로도 그리지 않습니다. "80%"는 지금의 완성도보다 먼저
  // 읽혀 지금 값으로 오해되고, 해야 할 일은 아래 한 줄의 "n개 더"가 더 바로 말합니다.

  const count = form.querySelector('[data-words-count]')
  let tab = 'info'
  /** 옆 단의 카드에 지금 그려져 있는 구획. */
  let shown = tab

  function sync(draft) {
    for (const box of form.querySelectorAll('[data-other]')) {
      box.hidden = draft[box.dataset.other] !== box.dataset.otherWhen
    }
    for (const q of QUESTIONS.filter((item) => item.sensitive)) {
      form.querySelector(`[data-unit="${q.name}"]`).hidden = !isAsked(q, draft)
    }
    sensitive.hidden = Boolean(draft['sensitive-consent']) && !agreedHere
    count.textContent = [...draft.words].length
    drawProgress(draft)
  }

  /* 완성도. 저장하기 전의 값으로 셉니다 — 고르는 대로 오르는 것이 보여야 채우는 손이
     멈추지 않습니다. */
  /* 들어올 때 한 번, 막대만 0 에서 지금 값까지 차오릅니다(CSS 의 is-entering). 숫자는 처음부터
     지금 값으로 서 있습니다 — 숫자가 세어 올라가면 다 오를 때까지 지금이 몇인지 읽을 수
     없습니다. 채운 것이 없거나(0%) 움직임을 줄인 환경에서는 막대도 바로 그 값에 섭니다. */
  let entered = false
  let target = 0
  function enter(percent) {
    entered = true
    if (!percent || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const fill = progress.querySelector('[data-progress-fill]')
    fill.style.inlineSize = '0%'
    progress.classList.add('is-entering')
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fill.style.inlineSize = `${target}%`
      fill.addEventListener('transitionend', () => progress.classList.remove('is-entering'), { once: true })
    }))
  }

  function drawProgress(draft) {
    const { percent, need, missing } = progressOf(draft)
    target = percent
    progress.querySelector('[data-progress-percent]').textContent = `${percent}%`
    if (!entered) enter(percent)
    // 차오르는 동안에는 막대를 건드리지 않습니다. 끝나면 target 에 섭니다.
    if (!progress.classList.contains('is-entering')) {
      progress.querySelector('[data-progress-fill]').style.inlineSize = `${percent}%`
    }
    progress.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', percent)
    // 해야 할 일("n개 더")을 앞에, 얻는 것(카드 교환)을 뒤에 둡니다. 문턱(80%)은 적지
    // 않습니다 — "n개 더"에 이미 들어 있고, 숫자가 지금의 완성도로 읽힙니다.
    progress.querySelector('[data-progress-note]').textContent = need
      // "상대와"·"프로필 카드"는 매칭 화면의 [프로필 카드 교환하기]와 같은 말입니다.
      ? `${need}개 더 채우면 상대와 프로필 카드를 교환할 수 있어요`
      : '이제 상대와 프로필 카드를 교환할 수 있어요'
    progress.classList.toggle('is-ready', !need)
    // 다 채웠으면 갈 곳이 없습니다. 문턱 전에는 버튼이 다음에 갈 칸의 이름을 적습니다 —
    // 누르기 전에 어디로 가는지 알고, 하나 채울 때마다 이름이 바뀌어 나아가는 것이 보입니다.
    // 문턱을 넘으면 교환은 이미 되므로 칸 하나를 짚어 재촉하지 않고 "안 채운 항목"으로 권합니다.
    const jump = progress.querySelector('[data-progress-jump]')
    jump.hidden = !missing.length
    progress.dataset.next = missing[0] ?? ''
    if (missing.length) {
      jump.querySelector('.btn__label').textContent = need ? `${unitName(missing[0])} 채우기` : '안 채운 항목 채우기'
    }
  }

  /** 칸의 이름(버튼에 적는 것). 이름표에서 읽고 "(최대 n개)"는 뗍니다. 긴 물음은 줄입니다. */
  function unitName(unit) {
    if (BRIEF[unit]) return BRIEF[unit]
    const label = form.querySelector(`[data-unit="${unit}"] .field__label`)
    return label?.textContent.replace(/\s*\(최대 \d+개\)/, '').trim() || '다음 항목'
  }

  const aside = document.querySelector('.profile__aside [data-profile-card]')
  const previews = document.querySelectorAll('.profile-preview [data-profile-card]')

  api = initProfileForm({
    form,
    part: 'detail',
    saved: '상세 프로필을 저장했어요',
    render(profile, draft) {
      sync(draft)
      // 옆 단의 카드는 지금 보고 있는 구획의 것, 미리보기 창에는 넷이 나란히 섭니다.
      // 구획이 바뀌어 내용이 통째로 갈릴 때만 새 내용이 떠오르듯 나타납니다.
      swap(aside, card(profile, draft, tab), { fade: shown !== tab })
      shown = tab
      for (const node of previews) node.replaceChildren(...card(profile, draft, node.dataset.profileCard))
    },
  })

  /* ---- 탭 ---------------------------------------------------------------
     밑줄을 옮기는 것은 tabs.js 가, 판을 갈아 끼우는 것은 여기서 합니다. */
  const tabs = document.querySelector('[data-profile-tabs]')
  /* ---- 하나만 고르는 물음을 다시 비우기 ---------------------------------
     고른 것을 한 번 더 누르면 풀립니다. 상세 프로필은 답하지 않아도 되는데, radio 는
     한 번 고르면 다른 것으로 옮길 수만 있고 비울 수는 없습니다 — 잘못 눌렀거나 마음이
     바뀐 사람에게 "답하지 않음"으로 돌아갈 길이 없었습니다.

     눌린 그 순간에는 이미 켜져 있어, 방금 켜진 것인지 원래 켜져 있던 것인지를 알 수
     없습니다. 그래서 물음마다 지금 켜진 값을 따로 들고 있다가 견줍니다. click 은 change
     보다 먼저 오므로, click 때 들고 있는 값은 누르기 전의 것입니다. */
  const held = new Map()
  const hold = () => {
    held.clear()
    for (const radio of form.querySelectorAll('input[type="radio"]:checked')) held.set(radio.name, radio.value)
  }
  hold()
  form.addEventListener('change', hold)
  form.addEventListener('click', (e) => {
    const radio = e.target
    if (!radio.matches?.('input[type="radio"]') || held.get(radio.name) !== radio.value) return
    radio.checked = false
    radio.dispatchEvent(new Event('change', { bubbles: true }))
  })

  /* ---- 탭 = 구획으로 가는 길 ---------------------------------------------
     네 구획이 한 페이지에 이어져 있습니다. 탭을 누르면 그 구획으로 내려가고, 읽어
     내려가면 지금 보고 있는 구획의 탭이 켜집니다. 옆 단의 카드도 그 구획의 것으로
     바뀝니다.

     "지금 보고 있는 구획"은 붙어 있는 탭 아래의 선을 지난 마지막 구획입니다.
     끝까지 내려갔을 때는 마지막 구획입니다 — 한마디는 짧아서 그 선까지 올라오지 못합니다. */
  /* 방금 고친 구획. 한 화면에 두 구획이 함께 보일 때, 선을 지난 것은 위 구획인데 손이 간
     것은 아래 구획일 수 있습니다. 그때는 고친 쪽이 지금 구획입니다 — 카드가 위 구획의
     것으로 남아 있으면 방금 고친 것이 어떻게 보이는지 확인할 수 없습니다.
     그 구획이 화면에서 완전히 벗어나면 놓아주고, 다시 읽는 자리를 따라갑니다. */
  let touched = null
  const visible = (name) => {
    const box = panels[name].getBoundingClientRect()
    return box.bottom > tabs.getBoundingClientRect().bottom && box.top < window.innerHeight
  }
  const current = () => {
    if (touched && visible(touched)) return touched
    touched = null
    const end = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
    if (end && window.scrollY > 0) return TABS.at(-1)
    let found = TABS[0]
    for (const name of TABS) {
      // 선은 구획이 위에 비워두는 자리(scroll-margin)의 끝입니다. 탭을 눌러 내려오면 구획이
      // 정확히 그 자리에 서므로, 눌러서 온 구획이 곧 지금 구획이 됩니다.
      const margin = parseFloat(getComputedStyle(panels[name]).scrollMarginTop) || 0
      if (panels[name].getBoundingClientRect().top <= margin + 1) found = name
    }
    return found
  }
  const activate = (name) => {
    if (name === tab) return
    tab = name
    selectTab(tabs, tabs.querySelector(`[data-tab="${name}"]`))
    // 어느 구획인지를 주소에 적어둡니다(#values). 새로고침해도 보던 구획으로 돌아오고, 그
    // 구획을 가리키는 링크도 됩니다. 뒤로 가기에 한 칸씩 쌓이지 않도록 갈아 끼웁니다.
    history.replaceState(null, '', `#${tab}`)
    api.refresh()
  }

  /* 눌러서 내려가는 동안에는 지나가는 구획의 탭이 차례로 켜지지 않게 잠급니다. 누른 탭이
     이미 켜져 있는데, 가는 길에 다른 탭이 깜빡이면 어디로 가는지가 흐려집니다. */
  let travelling = false
  const arrive = () => { travelling = false; activate(current()) }
  let ticking = false
  addEventListener('scroll', () => {
    if (travelling || ticking) return
    ticking = true
    requestAnimationFrame(() => { ticking = false; if (!travelling) activate(current()) })
  }, { passive: true })
  addEventListener('scrollend', arrive)

  const go = (name, behavior = 'smooth') => {
    travelling = behavior === 'smooth'
    activate(name)
    panels[name].scrollIntoView({ behavior, block: 'start' })
    // scrollend 가 없는 브라우저, 이미 그 자리라 굴러가지 않는 때를 위해.
    if (travelling) setTimeout(arrive, 800)
  }
  /* 안 채운 칸으로 곧장 갑니다. 스무 개 넘는 물음 가운데 무엇이 비었는지를 찾으며
     내려가게 하지 않습니다. 채우고 다시 누르면 그 다음 빈 칸입니다. */
  /* 도착한 칸은 잠깐 빛납니다. 바로 아래 칸(MBTI)이면 거의 굴러가지 않아, 그것만으로는
     눌렀는데 아무 일도 없는 것처럼 보입니다. 칸의 이름이 붙어 있는 탭 바로 아래에 서도록
     내려갑니다(profile.css 의 [data-unit] scroll-margin). */
  progress.querySelector('[data-progress-jump]').addEventListener('click', () => {
    const field = form.querySelector(`[data-unit="${progress.dataset.next}"]`)
    if (!field) return
    touched = null
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    field.scrollIntoView({ block: 'start', behavior: still ? 'instant' : 'smooth' })
    ;[...field.querySelectorAll('input:not([disabled]), textarea')]
      .find((control) => control.offsetParent !== null)?.focus({ preventScroll: true })
    field.classList.remove('is-pointed')
    void field.offsetWidth // 연달아 눌러도 처음부터 다시 빛나게 합니다.
    field.classList.add('is-pointed')
    field.addEventListener('animationend', () => field.classList.remove('is-pointed'), { once: true })
  })

  tabs.addEventListener('click', (e) => {
    const item = e.target.closest('[data-tab]')
    if (!item) return
    // 탭을 눌러 가는 것은 읽는 자리를 스스로 옮기는 것이라, 고친 구획을 붙들지 않습니다.
    touched = null
    go(item.dataset.tab)
  })
  // 고치면 그 구획이 지금 구획이 됩니다. 폼이 값을 읽어 카드를 다시 그리기 전에(capture)
  // 구획부터 옮겨, 카드가 한 번에 맞는 구획의 새 값으로 그려집니다.
  const touch = (e) => {
    const name = e.target.closest?.('[data-panel]')?.dataset.panel
    if (!name) return
    touched = name
    activate(name)
  }
  form.addEventListener('input', touch, true)
  form.addEventListener('change', touch, true)

  // 주소에 구획이 적혀 있으면 그리로 갑니다. 물음을 다 그린 뒤라야 자리가 맞습니다.
  const asked = location.hash.slice(1)
  if (asked !== tab && TABS.includes(asked)) requestAnimationFrame(() => go(asked, 'instant'))

  api.refresh()

  // 값이 다 써넣어진 뒤라야 답한 것이 있는지 알 수 있습니다(저장된 것, 쓰던 것 모두).
  openSeon([...seonBody.querySelectorAll('input')]
    .some((input) => (input.type === 'text' ? input.value.trim() : input.checked)))

  // 미리보기 창은 지금 보고 있는 탭의 카드부터 보여줍니다.
  document.getElementById('profile-preview')?.addEventListener('profile-preview:open', (e) => {
    e.currentTarget.querySelector(`[data-profile-card="${tab}"]`)
      ?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'instant' })
  })
}
