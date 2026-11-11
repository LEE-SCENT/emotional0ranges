/**
 * 온라인 프로필 등록 — 사전 대기등록자가 온라인 프로필에 필요한 자료를 더하는 화면.
 *
 *   import { initProfileExtra } from './components/profile-extra.js'
 *   initProfileExtra()
 *
 * 기존 회원이 이미 쓴 것은 다시 묻지 않습니다. 이 화면이 받는 것은 둘입니다.
 *   1. 온라인에서 새로 생긴 물음(사진 3장 · 나의 특징 · 체형·타투 · 닮은 연예인 · 자산 상세)
 *   2. 온라인에서 꼭 필요한데 기존 회원이 비워둔 물음(소득 · 학력 · 음주 … · MBTI 의 빈 축)
 * 그래서 회원마다 보이는 구획과 칸이 다릅니다. 무엇이 비었는지는 MEMBERS 의 기존 답변이
 * 정합니다.
 *
 * 근거: 2026-11-05 개발 요청서(03_프라이빗_프로필_추가정보_수집_개발요청.md)와 그 시안
 * (online-private-profile-registration-20261105.html), 개발 참고 JSON.
 *
 * ⚠️ 보낼 곳이 없습니다. 기존 프로필 화면처럼 이 기기(localStorage)에 적어둘 뿐이고,
 *    사진은 작게 줄인 사본을 적습니다. 회원 예시를 바꿔 볼 수 있도록 주소의 ?member= 로
 *    예시를 고르고, 예시마다 따로 적습니다.
 */
import { el, read, write } from './profile-form.js?v=8daf7ac8'
import { MBTI, QUESTIONS } from './profile-detail.js?v=d250034f'
import { showToast } from './toast.js?v=ccb77a07'
import { openConfirm } from './confirm.js?v=f516d2db'

/* ---- 물음 ---------------------------------------------------------------- */

/**
 * 나의 특징 — 외모 · 성격 · 매력. 성별마다 보기가 다릅니다(여성 52개 · 남성 54개).
 * 11/2 회의에서 확정한 온·오프 공통 문항입니다. 분류마다 3개 이상, 상한 없음.
 */
const TRAITS = {
  female: {
    looks: ['자기관리 잘 된', '귀여운', '섹시한', '웃는게 예쁜', '강아지상', '고양이상', '눈웃음', '보조개',
      '비율이 좋은', '오똑한 콧날', '고른 치열', '동안', '갸름한 얼굴', '큰 눈', '손이 예쁜', '하얀 피부',
      '구리빛 피부', '깨끗한 피부', '무쌍', '유쌍'],
    personality: ['솔직한', '애교 많은', '긍정적인', '성실한', '야망있고 진취적인', '다정한', '차분한',
      '예의가 바른', '잘 웃는', '배려심 깊은', '털털한', '장난기 많은', '섬세한', '수줍은', '밝고 활발한',
      '직진하는', '집순이'],
    charm: ['지적인', '유머감각있는', '리드하는', '대인관계가 좋은', '잘 챙겨주는', '안정형', '자기계발하는',
      '대화를 잘 이끌어요', '뭐든 잘 먹어요', '혼자 잘 놀아요', '패션 센스가 좋아요', '목소리가 좋아요',
      '이야기를 잘 들어줘요', '생활력이 강해요', '노래를 잘 해요'],
  },
  male: {
    looks: ['자기관리 잘 된', '귀여운', '섹시한', '웃는게 예쁜', '두부상', '눈웃음', '보조개', '비율이 좋은',
      '오똑한 콧날', '고른 치열', '동안', '샤프한 턱선', '큰 눈', '손이 예쁜', '하얀 피부', '구리빛 피부',
      '깨끗한 피부', '무쌍', '속쌍', '겉쌍', '짙은 눈썹'],
    personality: ['솔직한', '애교 많은', '긍정적인', '성실한', '야망있고 진취적인', '다정한', '차분한',
      '예의가 바른', '잘 웃는', '배려심 깊은', '털털한', '장난기 많은', '허세없는', '섬세한', '수줍은',
      '밝고 활발한', '직진하는', '집돌이'],
    charm: ['지적인', '유머감각있는', '리드하는', '대인관계가 좋은', '잘 챙겨주는', '안정형', '자기계발하는',
      '대화를 잘 이끌어요', '뭐든 잘 먹어요', '혼자 잘 놀아요', '패션 센스가 좋아요', '목소리가 좋아요',
      '이야기를 잘 들어줘요', '생활력이 강해요', '노래를 잘 해요'],
  },
}
const TRAIT_NAMES = { looks: '나의 외모', personality: '나의 성격', charm: '나의 매력' }
const TRAIT_MIN = 3

const BODY = {
  female: ['마른 편', '슬림한 편', '보통', '탄탄·근육형', '볼륨이 있는 편', '통통한 편'],
  male: ['마른 편', '슬림한 편', '보통', '탄탄·근육형', '통통한 편'],
}
/** 남성만 두 가지를 더 묻습니다. 각각 해당 · 아님. */
const FRAME = [['shoulder', '어깨가 넓은 편인가요?'], ['frame', '큰 체격(덩치가 있는 편)인가요?']]
const TATTOO = ['없음', '작은 타투', '큰 타투']

/** 새 소득 구간. 기존 답변이 있는 회원은 옛 5구간 그대로 두고 묻지 않습니다. */
const INCOME = ['4,000만원 미만', '4,000만원 이상 ~ 6,000만원 미만', '6,000만원 이상 ~ 8,000만원 미만',
  '8,000만원 이상 ~ 1억원 미만', '1억원 이상 ~ 1억5,000만원 미만', '1억5,000만원 이상 ~ 2억원 미만',
  '2억원 이상 ~ 3억원 미만', '3억원 이상']

/** 자산 상세. 이 순서로 묻고, 만원 단위로 받습니다.
    ⚠️ "전세 보증금 등 포함"은 기획서의 이름표 그대로입니다. 세입자가 낸 보증금(돌려받을
       돈)을 부채로 넣으면 순자산이 실제보다 작게 나와, 정의를 기획에 묻고 있습니다. */
const AMOUNTS = [
  ['cash', '현금 보유액'],
  ['realEstate', '부동산 시세'],
  ['stocksCrypto', '주식·코인 평가액'],
  ['debt', '부채·대출잔액 (전세 보증금 등 포함)'],
]

/** 학력. 상세 프로필의 첫 단계(학적 상태 없이)만 묻습니다. */
const EDU = ['고등학교', '전문대', '대학교', '석사', '박사']

/**
 * 온라인에서 꼭 필요한 기존 물음. 비어 있는 것만 섭니다.
 * 이름은 상세 프로필(profile-detail.js)의 것과 같아, 보기도 그쪽 것을 그대로 씁니다.
 * ⚠️ 온라인 필수 항목의 전체 표는 기획에서 "별도 문서"로 남아 있습니다. 여기 목록은
 *    개발 요청서 2장에 적힌 것까지입니다.
 */
const REQUIRED = ['edu-level', 'drinking', 'smoking', 'pets', 'date-count', 'date-style', 'friends', 'money',
  'marriage', ...MBTI.map(([name]) => name)]

/* 결혼 가치관은 한 물음에 결혼 의향(앞 넷)과 자녀 계획(뒤 둘)이 함께 섭니다(상세 프로필과 같은
   물음). 기획은 둘을 각각 확인하라고 해서, 한쪽만 고른 답은 비어 있는 것으로 봅니다 —
   "1-2년 안에 결혼"만 고른 사람에게 자녀 계획을 결혼 시기로 짐작하지 않습니다. */
const MARRIAGE = QUESTIONS.find((q) => q.name === 'marriage').options
const PLANS = { marriage: MARRIAGE.slice(0, 4), children: MARRIAGE.slice(4) }
const marriageGap = (value = []) =>
  Object.entries(PLANS).filter(([, options]) => !options.some((option) => value.includes(option))).map(([key]) => key)

/** 이 기존 물음이 아직 덜 답해졌는지. */
const unanswered = (name, value) => {
  if (name === 'marriage') return marriageGap(value).length > 0
  return Array.isArray(value) ? !value.length : !value
}

/* ---- 회원 예시 -------------------------------------------------------------
   기획 시안의 다섯 가지를 그대로 옮겼습니다. 성별은 따로 고릅니다. */

const FULL = {
  'edu-level': '대학교', drinking: ['주 1-2회'], smoking: '비흡연', pets: ['없음'], 'date-count': '주 2회',
  'date-style': ['맛집에서 술 한 잔'], friends: '만나지만 않는다면 연락 정도는 괜찮다', money: ['저축 후 소비'],
  marriage: ['1-2년 안에 결혼하고 싶어요', '자녀가 있었으면 좋겠어요'],
  'mbti-ei': 'I', 'mbti-ns': 'N', 'mbti-tf': 'F', 'mbti-jp': 'J',
}
const without = (...names) => Object.fromEntries(Object.entries(FULL).filter(([name]) => !names.includes(name)))
/** 옛 소득 보기(5구간 — 상세 프로필의 seon-income)의 답. 새 8구간으로 옮기지 않고 그대로 씁니다. */
const OLD_INCOME = '6천~1억'

const CASES = {
  answered: { label: '소득·기존 필수 항목 작성됨', income: OLD_INCOME, answers: FULL },
  'income-missing': { label: '소득만 미작성', income: null, answers: FULL },
  'mbti-missing': { label: 'MBTI 네 축 모두 미작성', income: OLD_INCOME,
    answers: without('mbti-ei', 'mbti-ns', 'mbti-tf', 'mbti-jp') },
  missing: { label: '소득·일부 기존 필수 항목 미작성', income: null,
    // 결혼 의향만 있고 자녀 계획이 빈 사람입니다(기획 시안의 "향후 자녀 계획" 미작성).
    answers: { ...without('edu-level', 'drinking', 'pets', 'mbti-tf'), marriage: ['1-2년 안에 결혼하고 싶어요'] } },
  'new-tags-already': { label: '새 특징 3분류도 이미 작성됨', income: OLD_INCOME, answers: FULL, traits: true },
}
const PEOPLE = {
  female: { name: '이수아', birthYear: 1994, gender: '여성' },
  male: { name: '김땡땡', birthYear: 1991, gender: '남성' },
}

function member() {
  const asked = new URLSearchParams(location.search).get('member') ?? ''
  const [gender, ...rest] = asked.split('-')
  const kind = rest.join('-')
  const g = PEOPLE[gender] ? gender : 'female'
  const c = CASES[kind] ? kind : 'missing'
  return { id: `${g}-${c}`, gender: g, kind: c, me: PEOPLE[g], ...CASES[c] }
}

/* ---- 금액 ---------------------------------------------------------------- */

/** "12,500" → 12500. 비었으면 null, 숫자가 아니면 NaN. */
function amount(text) {
  const plain = String(text ?? '').replace(/[,\s]/g, '')
  if (!plain) return null
  return /^\d+$/.test(plain) ? Number(plain) : NaN
}

/** 만원 → 읽는 금액. 12500 → "1억 2,500만원", 10000 → "1억원", 0 → "0원". */
export function won(manwon) {
  if (manwon === 0) return '0원'
  const sign = manwon < 0 ? '−' : ''
  const n = Math.abs(manwon)
  const eok = Math.floor(n / 10000)
  const man = n % 10000
  if (!eok) return `${sign}${man.toLocaleString('ko-KR')}만원`
  if (!man) return `${sign}${eok.toLocaleString('ko-KR')}억원`
  return `${sign}${eok.toLocaleString('ko-KR')}억 ${man.toLocaleString('ko-KR')}만원`
}

/* ---- 칸 만들기 ------------------------------------------------------------- */

const icon = (name, className = '') =>
  `<svg${className ? ` class="${className}"` : ''} aria-hidden="true"><use href="#icon-${name}"></use></svg>`

function choice(type, name, value, text = value) {
  const label = el('label', 'choice')
  const input = el('input')
  input.type = type
  input.name = name
  input.value = value
  label.append(input, el('span', '', text))
  return label
}

function group(type, name, options, cols) {
  const node = el('div', `choice-group${cols ? ` choice-group--cols-${cols}` : ''}`)
  node.setAttribute('role', type === 'radio' ? 'radiogroup' : 'group')
  for (const option of options) node.append(choice(type, name, option))
  return node
}

/** 이름표 + 선택지 묶음 하나. */
function field(label, control, { name } = {}) {
  const node = el('div', 'field')
  node.setAttribute('role', 'group')
  node.setAttribute('aria-label', label)
  if (name) node.dataset.field = name
  node.append(el('span', 'field__label', label), control)
  return node
}

/** 구획 하나. 머리(이름 · 설명 · 보이지 않는다는 말) 아래에 칸들이 섭니다. */
function section(id, title, { help, optional = false, private: hidden = false } = {}) {
  const node = el('section', 'profile__section')
  node.id = `extra-${id}`
  node.dataset.section = id
  node.setAttribute('aria-labelledby', `${node.id}-title`)
  const head = el('div', 'extra__head')
  const h2 = el('h2', '', title)
  h2.id = `${node.id}-title`
  if (optional) h2.append(el('small', '', '선택'))
  head.append(h2)
  if (help) head.append(el('p', '', help))
  if (hidden) head.append(privateNote())
  const fields = el('div', 'extra__fields')
  node.append(head, fields)
  return { node, fields }
}

function privateNote(text = '상대에게 보이지 않아요') {
  const note = el('span', 'extra__private')
  note.innerHTML = icon('lockFilled')
  note.append(text)
  return note
}

const PHOTOS = [['face', '얼굴'], ['upper', '상반신'], ['full', '전신']]

function photoSlots() {
  const node = el('div', 'field')
  node.setAttribute('role', 'group')
  node.setAttribute('aria-label', '사진 3장')
  node.dataset.field = 'photos'
  const slots = el('div', 'photo-slots')
  for (const [key, label] of PHOTOS) {
    const slot = el('div', 'photo-slot')
    const frame = el('label', 'photo-slot__frame')
    const input = el('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.dataset.photo = key
    input.setAttribute('aria-label', `${label} 사진 고르기`)
    const img = el('img')
    img.alt = `${label} 사진`
    img.hidden = true
    const change = el('span', 'tag photo-slot__change', '바꾸기')
    change.hidden = true
    frame.innerHTML = icon('plus', 'photo-slot__plus')
    frame.append(input, img, change)
    slot.append(frame, el('span', 'photo-slot__label', label))
    slots.append(slot)
  }
  node.append(slots)
  return node
}

function traitField(gender, key) {
  const label = el('span', 'field__label', TRAIT_NAMES[key])
  const tally = el('span', 'choice-tally')
  tally.dataset.tally = key
  tally.innerHTML = icon('check')
  tally.append(el('span'))
  label.append(tally)
  const node = el('div', 'field')
  node.setAttribute('role', 'group')
  node.setAttribute('aria-label', `${TRAIT_NAMES[key]}, ${TRAIT_MIN}개 이상`)
  node.dataset.field = `trait-${key}`
  // 칸을 맞추지 않고 글자 폭대로 흘립니다. 보기가 스무 개 안팎이라 칸에 세우면 한 분류가 화면 두세 개를 차지합니다.
  node.append(label, group('checkbox', `trait-${key}`, TRAITS[gender][key]))
  return node
}

function amountField([name, label]) {
  const node = el('div', 'field')
  node.dataset.field = name
  const id = `extra-${name}`
  const title = el('label', 'field__label', label)
  title.htmlFor = id
  const row = el('div', 'field-amount')
  const box = el('div', 'text-field')
  const input = el('input')
  input.id = id
  input.name = name
  input.type = 'text'
  input.inputMode = 'numeric'
  input.autocomplete = 'off'
  input.placeholder = '0'
  const read = el('output', 'field-amount__read')
  read.htmlFor = id
  read.dataset.amount = name
  read.dataset.empty = '금액을 입력하면 표시돼요'
  box.append(input, el('span', 'text-field__unit', '만원'))
  row.append(box, read)
  node.append(title, row)
  return node
}

/** 기존 물음 하나(상세 프로필의 것). 몇 개까지인지도 그쪽을 따릅니다. */
function existingField(name) {
  if (name === 'edu-level') return field('학력', group('radio', name, EDU, 3), { name })
  const q = QUESTIONS.find((item) => item.name === name)
  const title = q.max ? `${q.label} (최대 ${q.max}개)` : q.label
  const control = group(q.multi ? 'checkbox' : 'radio', q.name, q.options, q.cols)
  if (q.max) control.dataset.max = q.max
  const node = field(title, control, { name })
  if (name === 'marriage') {
    node.querySelector('.field__label').after(el('p', 'field__help', '결혼 의향과 자녀 계획을 하나씩 골라 주세요'))
  }
  return node
}

/** MBTI 의 빈 축만. 이미 고른 글자를 함께 보여줘, 어느 칸을 채우는지가 보입니다(INF_). */
function mbtiField(answers, missing) {
  const letters = MBTI.map(([name]) => answers[name] || '_').join('')
  const pairs = el('div', 'choice-group choice-group--cols-2 choice-group--pair')
  for (const [name, ...pair] of MBTI) {
    if (!missing.includes(name)) continue
    for (const [letter, word] of pair) pairs.append(choice('radio', name, letter, `${letter} · ${word}`))
  }
  const node = field('MBTI', pairs, { name: 'mbti' })
  if (missing.length < MBTI.length) {
    node.querySelector('.field__label').after(el('p', 'field__help', `지금 ${letters}예요. 빈 자리만 골라 주세요`))
  }
  return node
}

/* ---- 화면 ---------------------------------------------------------------- */

export function initProfileExtra() {
  const form = document.querySelector('[data-extra-form]')
  if (!form) return

  const who = member()
  const KEY = `eo:profile-extra:${who.id}`
  const missing = REQUIRED.filter((name) => unanswered(name, who.answers[name]))
  const missingMbti = missing.filter((name) => name.startsWith('mbti-'))
  const missingOther = missing.filter((name) => !name.startsWith('mbti-'))

  /* ---- 그리기 ---- */
  const parts = []
  const add = (part) => { parts.push(part); return part }

  add(section('photos', '사진 3장', { help: '얼굴 · 상반신 · 전신이 보이는 사진을 한 장씩 올려 주세요.' }))
    .fields.append(photoSlots())

  if (!who.traits) {
    const traits = add(section('traits', '나의 특징', {
      help: `나에게 해당하는 것을 분류마다 ${TRAIT_MIN}개 이상, 해당하는 만큼 모두 골라 주세요. 많이 고를수록 잘 맞는 분을 찾기 쉬워요.`,
    }))
    for (const key of Object.keys(TRAIT_NAMES)) traits.fields.append(traitField(who.gender, key))
  }

  const body = add(section('body', '체형 · 타투', { help: '본인에게 해당하는 것을 골라 주세요.' }))
  body.fields.append(field('지금 내 체형', group('radio', 'body', BODY[who.gender], 3), { name: 'body' }))
  if (who.gender === 'male') {
    for (const [name, label] of FRAME) {
      body.fields.append(field(label, group('radio', name, ['해당해요', '해당하지 않아요'], 2), { name }))
    }
  }
  const tattoo = field('타투', group('radio', 'tattoo', TATTOO, 3), { name: 'tattoo' })
  tattoo.querySelector('.field__label').after(privateNote())
  body.fields.append(tattoo)

  if (!who.income) {
    const income = add(section('income', '세전 연소득', { private: true }))
    income.fields.append(field('세전 연소득', group('radio', 'income', INCOME, 2), { name: 'income' }))
    income.fields.firstChild.querySelector('.field__label').classList.add('sr-only')
  }

  const assets = add(section('assets', '자산 상세', {
    help: '만원 단위로 입력해 주세요. 없으면 0을 입력하면 돼요. 정확히 모르면 대략적인 금액도 괜찮아요.',
    private: true,
  }))
  for (const item of AMOUNTS) assets.fields.append(amountField(item))
  const net = el('div', 'extra-net')
  net.innerHTML = '<span class="extra-net__label">순자산<small>현금 + 부동산 + 주식·코인 − 부채</small></span>'
  const netOut = el('output')
  netOut.dataset.empty = '네 금액을 모두 입력하면 계산돼요'
  net.append(netOut)
  assets.fields.append(net)
  assets.fields.append(field('지금 자가를 보유하고 있나요?', group('radio', 'house', ['보유하고 있어요', '없어요'], 2), { name: 'house' }))

  if (missing.length) {
    const rest = add(section('missing', '비어 있는 기본 정보', {
      help: '온라인 이용에 필요한 항목 가운데 아직 답하지 않은 것만 모았어요.',
    }))
    for (const name of missingOther) rest.fields.append(existingField(name))
    if (missingMbti.length) rest.fields.append(mbtiField(who.answers, missingMbti))
  }

  const celeb = add(section('celebrity', '닮은 연예인', {
    help: '닮았다는 말을 들어본 연예인이 있다면 이름이나 활동명을 적어 주세요. 이상형을 묻는 것이 아니에요.',
    optional: true,
  }))
  const celebBox = el('div', 'text-field')
  celebBox.innerHTML = '<input id="extra-celebrity" name="celebrity" type="text" maxlength="60" autocomplete="off" placeholder="이름 또는 활동명">'
  const celebField = el('div', 'field')
  celebField.append(el('label', 'field__label sr-only', '닮은 연예인'), celebBox)
  celebField.firstChild.htmlFor = 'extra-celebrity'
  celeb.fields.append(celebField)

  const slot = form.querySelector('[data-extra-sections]')
  parts.forEach((part, index) => {
    if (index) slot.append(el('hr', 'profile__divider'))
    slot.append(part.node)
  })

  drawImported(who, missing)

  /* ---- 저장된 것 ---- */
  let saved = loadSaved(KEY)
  const photos = { ...saved.photos }
  // 덜 답한 기존 물음은 이미 고른 것을 켜둔 채 엽니다(결혼 의향만 고른 결혼 가치관 같은 것).
  write(form, Object.fromEntries(missingOther.map((name) => [name, who.answers[name]]).filter(([, value]) => value)))
  write(form, saved.values ?? {})
  for (const [key, src] of Object.entries(photos)) showPhoto(key, src)

  const snapshot = () => JSON.stringify({ values: read(form), photos })
  let clean = snapshot()
  const dirty = () => snapshot() !== clean

  /* ---- 사진 ---- */
  function showPhoto(key, src) {
    const input = form.querySelector(`[data-photo="${key}"]`)
    const frame = input.closest('.photo-slot__frame')
    const img = frame.querySelector('img')
    img.hidden = !src
    if (src) img.src = src
    else img.removeAttribute('src')
    frame.querySelector('.photo-slot__change').hidden = !src
    frame.querySelector('.photo-slot__plus').style.visibility = src ? 'hidden' : ''
  }
  form.addEventListener('change', async (e) => {
    const input = e.target.closest('[data-photo]')
    if (!input?.files[0]) return
    photos[input.dataset.photo] = await shrink(input.files[0])
    input.value = ''
    showPhoto(input.dataset.photo, photos[input.dataset.photo])
    edited()
  })

  /* ---- 금액: 쉼표를 넣어 다시 적고, 옆에 원화로 ---- */
  form.addEventListener('input', (e) => {
    const input = e.target
    if (!AMOUNTS.some(([name]) => name === input.name)) return
    const value = amount(input.value)
    if (Number.isInteger(value)) {
      const fromEnd = input.value.length - input.selectionStart
      input.value = value.toLocaleString('ko-KR')
      const at = Math.max(0, input.value.length - fromEnd)
      input.setSelectionRange(at, at)
    }
  })

  function drawAmounts(values) {
    const numbers = AMOUNTS.map(([name]) => amount(values[name]))
    AMOUNTS.forEach(([name], index) => {
      const value = numbers[index]
      form.querySelector(`[data-amount="${name}"]`).textContent = Number.isInteger(value) ? won(value) : ''
    })
    const ok = numbers.every(Number.isInteger)
    netOut.textContent = ok ? won(numbers[0] + numbers[1] + numbers[2] - numbers[3]) : ''
  }

  /* ---- 빠진 것 ----
     구획마다 무엇이 빠졌는지를 셉니다. 등록을 누르기 전에는 말하지 않고(기존 프로필 화면과
     같습니다), 오른쪽 단의 "남은 것"만 따라 바뀝니다. 숫자가 아닌 금액만은 치는 그 자리에서
     말합니다 — 쓰는 중이 아니라 이미 틀린 것이라 기다릴 까닭이 없습니다. */
  function problems(values) {
    const list = []
    const need = (fieldName, message) => {
      const node = form.querySelector(`[data-field="${fieldName}"]`)
      if (node) list.push({ field: node, message, section: node.closest('[data-section]').dataset.section })
    }
    const empty = (value) => (Array.isArray(value) ? !value.length : !value)

    if (PHOTOS.some(([key]) => !photos[key])) need('photos', '얼굴 · 상반신 · 전신 사진을 한 장씩 올려 주세요')
    if (!who.traits) {
      for (const key of Object.keys(TRAIT_NAMES)) {
        if ((values[`trait-${key}`] ?? []).length < TRAIT_MIN) need(`trait-${key}`, `${TRAIT_MIN}개 이상 골라 주세요`)
      }
    }
    for (const name of ['body', ...(who.gender === 'male' ? FRAME.map(([n]) => n) : []), 'tattoo']) {
      if (empty(values[name])) need(name, '하나를 골라 주세요')
    }
    if (!who.income && empty(values.income)) need('income', '소득 구간을 골라 주세요')
    for (const [name] of AMOUNTS) {
      const value = amount(values[name])
      if (value === null) need(name, '금액을 입력해 주세요. 없으면 0을 입력해 주세요')
      else if (Number.isNaN(value)) need(name, '숫자만 입력해 주세요')
    }
    if (empty(values.house)) need('house', '하나를 골라 주세요')
    for (const name of missingOther) {
      if (!unanswered(name, values[name])) continue
      if (name === 'marriage') {
        need(name, marriageGap(values[name]).includes('marriage') ? '결혼 의향을 골라 주세요' : '자녀 계획을 골라 주세요')
        continue
      }
      const multi = QUESTIONS.find((q) => q.name === name)?.multi
      need(name, multi ? '하나 이상 골라 주세요' : '하나를 골라 주세요')
    }
    if (missingMbti.some((name) => empty(values[name]))) need('mbti', '빈 자리를 모두 골라 주세요')
    return list
  }

  let warned = false
  function mark(list) {
    for (const node of form.querySelectorAll('.field__error')) node.remove()
    for (const node of form.querySelectorAll('.field--error')) node.classList.remove('field--error')
    for (const { field: node, message } of list) {
      node.classList.add('field--error')
      const note = el('p', 'field__error', message)
      note.setAttribute('role', 'alert')
      node.append(note)
    }
  }

  /* ---- 남은 것(오른쪽 단 · 좁은 화면의 한 줄) ---- */
  const progress = document.querySelector('[data-extra-progress]')
  const count = document.querySelector('[data-extra-count]')
  const required = parts.filter((part) => part.node.dataset.section !== 'celebrity')
  progress.replaceChildren(...parts.map((part) => {
    const id = part.node.dataset.section
    const item = el('li')
    item.dataset.progress = id
    const link = el('a')
    link.href = `#${part.node.id}`
    link.innerHTML = `<span class="extra-progress__mark">${icon('check')}</span>`
    link.append(part.node.querySelector('h2').firstChild.textContent)
    if (id === 'celebrity') link.append(el('span', 'extra-progress__optional', ' · 선택'))
    item.append(link)
    return item
  }))

  function drawProgress(list) {
    const open = new Set(list.map((item) => item.section))
    let done = 0
    for (const item of progress.children) {
      const id = item.dataset.progress
      const isDone = id === 'celebrity' ? Boolean(read(form).celebrity?.trim()) : !open.has(id)
      item.classList.toggle('is-done', isDone)
      if (isDone && id !== 'celebrity') done += 1
    }
    const text = `${done}/${required.length}`
    document.querySelector('[data-extra-done-count]').textContent = text
    count.textContent = `${required.length}개 구획 가운데 ${done}개 작성`
  }

  /* ---- 개수 · 한도 ---- */
  function tallies(values) {
    for (const node of form.querySelectorAll('[data-tally]')) {
      const picked = (values[`trait-${node.dataset.tally}`] ?? []).length
      node.lastChild.textContent = `${picked}개 선택 · ${TRAIT_MIN}개 이상`
      node.classList.toggle('is-met', picked >= TRAIT_MIN)
    }
    for (const box of form.querySelectorAll('[data-max]')) {
      const inputs = [...box.querySelectorAll('input[type="checkbox"]')]
      const full = inputs.filter((input) => input.checked).length >= Number(box.dataset.max)
      for (const input of inputs) input.disabled = full && !input.checked
    }
  }

  function refresh() {
    const values = read(form)
    tallies(values)
    drawAmounts(values)
    const list = problems(values)
    drawProgress(list)
    // 숫자가 아닌 금액은 등록을 누르기 전에도 그 자리에서 말합니다.
    const typos = list.filter((item) => item.message === '숫자만 입력해 주세요')
    mark(warned ? list : typos)
    return list
  }
  function edited() { refresh() }
  form.addEventListener('input', edited)
  form.addEventListener('change', edited)

  /* ---- 저장 ---- */
  function persist(status) {
    const now = new Date().toISOString()
    saved = {
      ...saved,
      values: read(form),
      photos: { ...photos },
      status,
      updatedAt: now,
      // 처음 마친 때는 한 번만 적습니다. 출시 후 혜택을 가릴 때 쓰는 값입니다.
      completedAt: saved.completedAt ?? (status === 'complete' ? now : undefined),
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(saved))
    } catch {
      showToast('이 기기에 저장할 공간이 모자라요', { icon: '#icon-error' })
      return false
    }
    clean = snapshot()
    return true
  }

  /** 임시저장. 빠진 것이 있어도 됩니다 — 쓰다 만 그대로 두었다가 이어 씁니다.
      한 번 마친 뒤에는 임시로 되돌리지 않습니다(완료 상태는 그대로, 다 채워야 저장). */
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-extra-draft]')) return
    if (saved.status === 'complete') return
    if (persist('draft')) showToast('임시저장했어요', { icon: '#icon-check', tone: 'success' })
  })

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    warned = true
    const list = refresh()
    if (list.length) {
      const first = list[0].field
      first.querySelector('input:not([type="file"]), select, textarea, input')?.focus({ preventScroll: true })
      first.scrollIntoView({ block: 'center' })
      return
    }
    const first = saved.status !== 'complete'
    if (!persist('complete')) return
    if (first) {
      showDone()
      // 마친 화면을 먼저 보여주고, 인증은 그 다음에 권합니다. 곧바로 창이 덮으면 다
      // 했다는 것을 보기도 전에 다음 할 일이 앞을 막습니다.
      setTimeout(() => openConfirm('extra-proof-ask'), 700)
    } else {
      showToast('수정한 내용을 저장했어요', { icon: '#icon-check', tone: 'success' })
    }
  })
  for (const button of document.querySelectorAll('[data-extra-submit]')) {
    if (!button.form) button.addEventListener('click', () => form.requestSubmit())
  }

  /* ---- 마친 화면 ---- */
  const main = document.querySelector('[data-extra-main]')
  const done = document.querySelector('[data-extra-done]')
  const cta = document.querySelector('.bottom-cta')
  function showDone() {
    main.hidden = true
    cta.hidden = true
    done.hidden = false
    scrollTo({ top: 0, behavior: 'instant' })
  }
  function showForm() {
    main.hidden = false
    cta.hidden = false
    done.hidden = true
    // 마친 뒤에 고칠 때는 임시저장이 없습니다 — 고친 것은 다 채워야 저장됩니다.
    const editing = saved.status === 'complete'
    for (const button of document.querySelectorAll('[data-extra-draft]')) button.hidden = editing
    for (const label of document.querySelectorAll('[data-extra-submit] .btn__label')) {
      label.textContent = editing ? '수정 내용 저장' : '등록 완료하기'
    }
    scrollTo({ top: 0, behavior: 'instant' })
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-extra-edit]')) showForm()
  })
  document.addEventListener('confirm:accept', (e) => {
    if (e.target.id === 'extra-proof-ask') openConfirm('extra-proof')
  })

  /* ---- 나가는 길: 쓴 것이 남아 있으면 한 번 묻습니다(기존 프로필 화면과 같은 창) ---- */
  let leaving = null
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href], [data-profile-leave]')
    if (!link || !dirty() || main.hidden) return
    if (link.matches('a[href^="#"]')) return
    e.preventDefault()
    e.stopImmediatePropagation()
    leaving = () => { location.href = link.href ?? './my.html' }
    openConfirm('profile-leave')
  }, true)
  document.addEventListener('confirm:accept', (e) => {
    if (e.target.id !== 'profile-leave' || !leaving) return
    persist(saved.status === 'complete' ? 'complete' : 'draft')
    leaving()
  })
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-profile-discard]') || !leaving) return
    e.target.closest('dialog')?.close()
    clean = snapshot()
    leaving()
  })
  addEventListener('beforeunload', (e) => {
    if (!dirty() || main.hidden) return
    e.preventDefault()
    e.returnValue = ''
  })

  /* ---- 시안: 회원 예시 바꾸기 ---- */
  const demo = document.querySelector('[data-extra-demo]')
  if (demo) {
    const [gender, kind] = demo.querySelectorAll('select')
    gender.value = who.gender
    for (const [id, item] of Object.entries(CASES)) kind.append(new Option(item.label, id))
    kind.value = who.kind
    demo.addEventListener('change', () => {
      location.search = `?member=${gender.value}-${kind.value}`
    })
    demo.querySelector('[data-extra-reset]').addEventListener('click', () => {
      try { localStorage.removeItem(KEY) } catch { /* 지울 것이 없습니다. */ }
      clean = snapshot()
      location.reload()
    })
  }

  refresh()
  if (saved.status === 'complete') showDone()
  else showForm()
}

/* ---- 그 밖 ---------------------------------------------------------------- */

function loadSaved(key) {
  try { return JSON.parse(localStorage.getItem(key)) ?? {} } catch { return {} }
}

/** 가져온 정보. 무엇을 다시 묻지 않는지를 보여줍니다. */
function drawImported(who, missing) {
  const box = document.querySelector('[data-extra-imported]')
  const rows = [
    ['기본 정보', `${who.me.name} · ${who.me.birthYear}년생 · ${who.me.gender}, 직업 · 거주지 · 키 등`],
    ['세전 연소득', who.income ? `${who.income} (기존 답변)` : '아래에서 작성해 주세요'],
    ['상세 정보', missing.length ? `학력 · 생활 · 가치관 가운데 ${missing.length}개가 비어 있어요` : '모두 작성돼 있어요'],
  ]
  const list = el('dl')
  for (const [term, text] of rows) list.append(el('dt', '', term), el('dd', '', text))
  box.append(list)
}

/** 사진을 긴 변 480 으로 줄여 적습니다. 원본을 그대로 적으면 이 기기의 저장 공간(5MB
    안팎)이 사진 한두 장에 찹니다. 서버가 붙으면 원본을 올리고 이 함수는 미리보기만 맡습니다. */
function shrink(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, 480 / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve('') }
    img.src = url
  })
}
