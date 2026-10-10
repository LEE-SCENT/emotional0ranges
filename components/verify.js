/**
 * 서류로 인증을 요청하는 창 셋 — 회사·직업 / 혼인·가족 / 학교.
 *
 * 본인 인증은 여기 없습니다. 그쪽은 우리 창이 아니라 본인확인 기관의 창이 뜹니다
 * (identity-check.js).
 *
 *   <button data-verify-open="company">재인증</button>
 *
 *   import { initVerify } from './components/verify.js'
 *   initVerify()
 *
 * 무엇을 받는지는 아래 KINDS 한 곳에 있습니다. 회사·직업만 해도 내 상황에 따라 받는
 * 서류가 일곱 가지로 갈려, 마크업에 적어두면 같은 칸(발급일·파일)이 스무 번 넘게
 * 되풀이됩니다. 창은 처음 열 때 그립니다.
 *
 * ⚠️ 보낼 곳이 없습니다. `인증 요청`은 창을 닫고 알림을 띄울 뿐이고, 고른 파일은
 *    어디에도 올라가지 않습니다. 심사 결과가 돌아올 길도 없어 인증 상태는 바뀌지
 *    않습니다.
 * ⚠️ 요청한 뒤의 화면이 Figma 에 없습니다. 알림 문구("인증을 요청했어요")는 저장
 *    알림의 말투를 따라 임시로 넣었습니다.
 */
import { showToast } from './toast.js?v=ccb77a07'
import { lockScroll, unlockScroll } from './scroll-lock.js?v=40a2cd35'
import { initDialogFocus } from './dialog-focus.js?v=a4704637'
import { initTabs } from './tabs.js?v=aec7319a'
import { load } from './profile-form.js?v=50619393'

const RECENT = '최근 3개월 이내 발급된 서류만 인정돼요'
const HIDE_ID = '주민등록번호 뒷자리는 가리고 제출해 주세요.'
const ONE_YEAR = '인증은 승인일로부터 1년간 유효해요.'
const FAKE = '허위·위조 서류 제출 시 서비스 이용 제한, 환불 불가 및 법적 책임이 발생할 수 있어요.'
const OWN_RECENT = '최근 3개월 이내 발급된 본인 명의의 서류만 인정돼요.'

/* 받는 칸의 모양은 셋입니다.
     date  서류 발급일 한 칸.
     file  증빙 서류 한 칸.
     doc   이름이 붙은 서류 하나 — 그 아래 발급일과 파일이 함께 섭니다. */
const dated = [
  { type: 'date', label: '서류 발급일', help: RECENT },
  { type: 'file', label: '증빙 서류' },
]

/**
 * 회사·직업의 직접 인증. 내 상황마다 받는 서류와 유의사항이 다릅니다.
 *
 * for 가 있는 상황은 그 성별의 회원에게만 섭니다. 운영 사이트의 신청 기준입니다 —
 * 남성은 소득을 증빙할 수 있는 직업이 있어야 하고(학생 가운데 의대생 · 로스쿨 재학생 ·
 * 연구비 소득 대학원생만 따로 신청), 여성은 대학 · 대학원 학생과 이직 · 취업 준비 중인
 * 경우도 신청할 수 있습니다. 무직 · 주부는 누구도 신청할 수 없습니다(RULES).
 */
const SITUATIONS = [
  {
    label: '직장인 (자동 인증 실패)',
    fields: [{ type: 'text', label: '회사', name: 'company', placeholder: '회사명을 입력해 주세요' }, ...dated],
    notes: ['재직증명서 또는 건강보험 자격득실확인서를 제출해 주세요.', OWN_RECENT, HIDE_ID,
      '사원증, 명함 등은 인증 서류로 인정되지 않아요.', ONE_YEAR, FAKE],
  },
  {
    label: '사업자',
    fields: [{ type: 'doc', label: '사업자등록증' }, { type: 'doc', label: '소득금액증명원' }],
    notes: [OWN_RECENT, HIDE_ID, ONE_YEAR, FAKE],
  },
  {
    label: '프리랜서',
    fields: dated,
    notes: ['소득금액증명원 또는 사업소득 원천징수영수증을 제출해 주세요.', HIDE_ID,
      '사원증, 명함 등은 인증 서류로 인정되지 않아요.', ONE_YEAR, FAKE],
  },
  {
    label: '전문직',
    // 자격증에는 발급일을 묻지 않습니다 — 한 번 받으면 바뀌지 않는 서류입니다.
    fields: [{ type: 'file', label: '자격증' }, { type: 'doc', label: '재직·개업 증빙 서류' }],
    notes: [OWN_RECENT, HIDE_ID, ONE_YEAR, FAKE],
  },
  ...['의대생', '로스쿨 재학생', '연구비 소득 대학원생'].map((label) => ({
    label,
    for: '남성',
    fields: dated,
    notes: ['재학증명서를 제출해 주세요.', HIDE_ID, ONE_YEAR, FAKE],
  })),
  {
    label: '대학 · 대학원생',
    for: '여성',
    fields: dated,
    notes: ['재학증명서를 제출해 주세요.', OWN_RECENT, HIDE_ID, ONE_YEAR, FAKE],
  },
  /* ⚠️ 운영 사이트는 "안내된 자료로 신청"이라고만 적고 어떤 서류인지 보여주지 않습니다.
        아래 서류는 자리를 채운 것이라 기획 확인이 필요합니다. */
  {
    label: '이직 준비 중',
    for: '여성',
    fields: dated,
    notes: ['경력증명서 또는 건강보험 자격득실확인서를 제출해 주세요.', OWN_RECENT, HIDE_ID, ONE_YEAR, FAKE],
  },
  {
    label: '취업 준비 중',
    for: '여성',
    fields: dated,
    notes: ['최종 학력 졸업증명서를 제출해 주세요.', OWN_RECENT, HIDE_ID, ONE_YEAR, FAKE],
  },
  {
    label: '기타',
    fields: dated,
    notes: ['소득금액증명원 또는 소득·자산 인증 자료를 제출해 주세요.',
      '소득·자산 인증 자료는 최근 6개월간의 수입 내역을 확인할 수 있어야 해요.',
      '본인 명의의 서류만 인정돼요.', HIDE_ID, ONE_YEAR, FAKE],
  },
]

/**
 * 직접 인증으로 누가 신청할 수 있는지(운영 사이트의 문구). 회원의 성별에 맞는 줄만 섭니다
 * — 남녀의 기준이 다른데 둘을 나란히 세우면, 내 것이 아닌 기준을 읽고 견주게 됩니다.
 * 성별을 모르면(로그인 전 등) 둘 다 섭니다.
 */
const RULES = {
  남성: '남성 회원은 소득을 증빙할 수 있는 직업이 있어야 해요. 의대생 · 로스쿨 재학생 · 연구비 소득 대학원생은 재학증명서로 신청할 수 있어요.',
  여성: '여성 회원은 대학 · 대학원 재학 중이거나 이직 · 취업을 준비 중이어도 신청할 수 있어요.',
}
const NO_JOB = '무직 · 주부는 신청할 수 없어요.'

const KINDS = {
  company: {
    title: '회사·직업 인증',
    /* 길이 둘입니다. 건강보험으로 되면 서류가 필요 없고, 안 되는 사람(사업자·
       프리랜서 …)만 서류를 냅니다. */
    auto: {
      tab: '건강보험 자동 인증',
      lead: '회사를 인증하면 같은 회사 사람이 참여한 모임인지 확인할 수 있어요.',
      label: '인증 수단',
      options: ['카카오톡', '네이버', '삼성패스', 'KB모바일', '신한'],
      submit: '인증하기',
    },
    tab: '직접 인증',
    lead: '자동 확인이 어려운 분(프리랜서 · 사업자 · 전문직 · 학생 등)은 재직 · 자격 증빙을 올리면 검토 후 인증돼요.',
    situations: SITUATIONS,
  },
  family: {
    title: '혼인·가족 인증',
    fields: [{ type: 'doc', label: '혼인관계증명서(상세)' }, { type: 'doc', label: '가족관계증명서(상세)' }],
    notes: ['최근 3개월 이내 발급된 서류만 인정돼요.', '본인 외 다른 사람의 이름과 주민등록번호는 가리고 제출해 주세요.',
      '혼인·이혼 여부만 확인하며, 인증에 필요하지 않은 정보는 수집하지 않아요.',
      '허위·위조 서류 제출 시 서비스 이용이 제한될 수 있어요.'],
  },
  school: {
    title: '학교 인증',
    fields: dated,
    notes: ['졸업증명서 또는 재학증명서를 제출해 주세요.', OWN_RECENT, HIDE_ID, ONE_YEAR,
      '허위·위조 서류 제출 시 서비스 이용이 제한될 수 있어요.'],
  },
}

const el = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}
const icon = (name, className = '') =>
  `<svg${className ? ` class="${className}"` : ''} aria-hidden="true"><use href="#icon-${name}"></use></svg>`
const button = (className, text) => {
  const node = el('button', `btn ${className}`)
  node.type = 'button'
  node.append(el('span', 'btn__label', text))
  return node
}

let serial = 0

/** 이름표. 이 창의 칸은 모두 꼭 채워야 하는 것이라 점이 붙습니다. */
function label(text, id) {
  // 칸 하나에 붙으면 <label>, 묶음(서류 하나)의 이름이면 글자입니다.
  const node = el(id ? 'label' : 'span', 'field__label', text)
  if (id) node.htmlFor = id
  node.insertAdjacentHTML('beforeend', '<span class="field__required" aria-hidden="true"></span>')
  node.append(el('span', 'sr-only', '필수'))
  return node
}

function dateBox(labelText) {
  const box = el('div', 'text-field')
  box.innerHTML = icon('calendar', 'text-field__icon')
  const input = el('input')
  input.type = 'date'
  input.required = true
  input.id = `verify-${++serial}`
  if (labelText) input.setAttribute('aria-label', labelText)
  // 서류는 대개 방금 뗀 것이라 오늘로 시작합니다. 오늘보다 뒤는 고를 수 없습니다.
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)
  input.value = input.max = today
  box.append(input)
  // 칸 어디를 눌러도 달력이 열립니다(브라우저의 작은 달력 아이콘은 감춰져 있습니다).
  box.addEventListener('click', () => { try { input.showPicker() } catch { input.focus() } })
  return box
}

/** 파일 한 칸. 고르기 전과 후의 모습이 다릅니다. */
function fileBox(labelText) {
  const box = el('div', 'file-field')
  const input = el('input')
  input.type = 'file'
  input.required = true
  input.accept = 'application/pdf,image/*'
  input.tabIndex = -1
  input.setAttribute('aria-label', labelText)

  const name = el('span', 'file-field__name')
  const clear = el('button', 'file-field__clear')
  clear.type = 'button'
  clear.setAttribute('aria-label', `${labelText} 파일 지우기`)
  clear.innerHTML = icon('cancelCircleFilled')
  const shown = el('div', 'text-field text-field--readonly')
  shown.append(name, clear)

  const pick = button('btn--outlined btn--medium', '파일 선택')

  const sync = () => {
    const file = input.files[0]
    shown.hidden = !file
    name.textContent = file?.name ?? ''
    pick.querySelector('.btn__label').textContent = file ? '파일 변경' : '파일 선택'
  }
  pick.addEventListener('click', () => input.click())
  clear.addEventListener('click', () => {
    input.value = ''
    input.dispatchEvent(new Event('change', { bubbles: true }))
    pick.focus()
  })
  input.addEventListener('change', sync)
  sync()

  box.append(input, shown, pick)
  return box
}

function field(spec) {
  const node = el('div', 'field')
  if (spec.type === 'doc') {
    // 서류 이름 아래 발급일과 파일이 한 묶음으로 섭니다.
    node.classList.add('verify__doc')
    node.setAttribute('role', 'group')
    node.setAttribute('aria-label', spec.label)
    node.append(
      label(spec.label),
      el('span', 'field__label field__label--sub', '서류 발급일'),
      dateBox(`${spec.label} 발급일`),
      fileBox(spec.label),
    )
  } else if (spec.type === 'date') {
    const box = dateBox()
    node.append(label(spec.label, box.querySelector('input').id), box)
    if (spec.help) node.append(el('p', 'field__help', spec.help))
  } else if (spec.type === 'file') {
    node.setAttribute('role', 'group')
    node.setAttribute('aria-label', spec.label)
    node.append(label(spec.label), fileBox(spec.label))
  } else {
    const box = el('div', 'text-field')
    const input = el('input')
    input.type = 'text'
    input.required = true
    input.id = `verify-${++serial}`
    input.name = spec.name
    input.placeholder = spec.placeholder
    input.autocomplete = 'off'
    box.append(input)
    node.append(label(spec.label, input.id), box)
  }
  return node
}

function notes(list) {
  const node = el('ul', 'verify__notes')
  for (const text of list) node.append(el('li', '', text))
  return [el('hr', 'verify__divider'), node]
}

/** 서류를 내는 쪽의 가운데(칸들 + 선 + 유의사항). */
function documents(body, { fields, notes: list }) {
  body.replaceChildren(...fields.map(field), ...notes(list))
}

/** 인증 수단을 고르는 가운데(안내 한 줄 + 수단 하나 고르기). 건강보험 자동 인증이 씁니다. */
function meansBody({ lead, label: title, options }) {
  const body = el('div', 'verify__body')
  const means = el('div', 'field')
  means.setAttribute('role', 'radiogroup')
  means.setAttribute('aria-label', title)
  const group = el('div', 'choice-group choice-group--cols-3 choice-group--pair')
  for (const option of options) {
    const choice = el('label', 'choice')
    const input = el('input')
    input.type = 'radio'
    input.name = 'means'
    input.value = option
    input.required = true
    choice.append(input, el('span', '', option))
    group.append(choice)
  }
  means.append(el('span', 'field__label', title), group)
  body.append(el('p', 'verify__lead', lead), means)
  return body
}

function build(kind) {
  const spec = KINDS[kind]
  const dialog = el('dialog', 'verify')
  dialog.id = `verify-${kind}`
  const titleId = `${dialog.id}-title`
  dialog.setAttribute('aria-labelledby', titleId)

  const form = el('form', 'verify__panel')
  form.noValidate = true
  form.method = 'dialog'

  const title = el('h2', 'verify__title', spec.title)
  title.id = titleId
  const close = button('btn--ghost btn--medium btn--icon-only verify__close', '')
  close.replaceChildren()
  close.innerHTML = icon('close', 'btn__icon')
  close.setAttribute('aria-label', '닫기')
  close.addEventListener('click', () => dialog.close())

  const body = el('div', 'verify__body')
  const submit = el('button', 'btn btn--filled btn--large verify__submit')
  submit.type = 'submit'
  submit.append(el('span', 'btn__label', '인증 요청'))

  form.append(title, close)

  if (spec.situations) {
    /* ---- 회사·직업: 탭 둘 ---- */
    const tabs = el('div', 'tabs')
    tabs.setAttribute('role', 'tablist')
    tabs.setAttribute('aria-label', spec.title)
    tabs.innerHTML = '<span class="tabs__thumb" aria-hidden="true"></span>'
    const tabAuto = el('button', 'tabs__item is-active', spec.auto.tab)
    const tabDirect = el('button', 'tabs__item', spec.tab)
    for (const tab of [tabAuto, tabDirect]) {
      tab.type = 'button'
      tab.setAttribute('role', 'tab')
    }
    tabs.append(tabAuto, tabDirect)

    // 건강보험 쪽: 인증 수단 하나를 고릅니다.
    const auto = meansBody(spec.auto)

    // 직접 인증 쪽: 내 상황을 고르면 그에 맞는 칸으로 바뀝니다.
    // 회원의 성별에 해당하는 상황만 섭니다(for). 값은 원래 목록의 자리라, 걸러도 서류가 맞습니다.
    const gender = load().me?.gender
    const rules = el('ul', 'verify__notes verify__rules')
    for (const text of [...(RULES[gender] ? [RULES[gender]] : Object.values(RULES)), NO_JOB]) {
      rules.append(el('li', '', text))
    }
    const situation = el('div', 'field')
    const select = el('select')
    select.id = `verify-${++serial}`
    for (const [index, item] of spec.situations.entries()) {
      if (!item.for || !gender || item.for === gender) select.append(new Option(item.label, index))
    }
    const selectBox = el('div', 'text-field text-field--select')
    selectBox.append(select)
    selectBox.insertAdjacentHTML('beforeend', icon('chevronDown'))
    situation.append(label('내 상황', select.id), selectBox)

    // 내 상황도 굴러가는 칸 안에 함께 있습니다. 밖에 두면 칸이 길어질 때 굴러갈 자리가
    // 그만큼 줄어듭니다.
    const docs = el('div', 'verify__fields')
    const direct = el('div', 'verify__body')
    direct.hidden = true
    direct.append(el('p', 'verify__lead', spec.lead), rules, situation, docs)
    const draw = () => { documents(docs, spec.situations[select.value]); check() }
    select.addEventListener('change', draw)

    const show = (isAuto) => {
      auto.hidden = !isAuto
      direct.hidden = isAuto
      tabAuto.setAttribute('aria-selected', String(isAuto))
      tabDirect.setAttribute('aria-selected', String(!isAuto))
      submit.querySelector('.btn__label').textContent = isAuto ? spec.auto.submit : '인증 요청'
      check()
    }
    tabAuto.addEventListener('click', () => show(true))
    tabDirect.addEventListener('click', () => show(false))

    form.append(tabs, auto, direct, submit)
    form.addEventListener('input', check)
    form.addEventListener('change', check)
    dialog.append(form)
    document.body.append(dialog)
    initTabs(dialog)
    documents(docs, spec.situations[0])
    show(true)
  } else {
    documents(body, spec)
    form.append(body, submit)
    form.addEventListener('input', check)
    form.addEventListener('change', check)
    dialog.append(form)
    document.body.append(dialog)
    check()
  }

  /* 보이는 칸이 다 차야 요청할 수 있습니다. 감춰진 탭의 칸은 세지 않습니다 —
     건강보험 탭에 있는 사람에게 직접 인증의 빈 칸이 걸림돌이 되면 안 됩니다. */
  function check() {
    const live = [...form.querySelectorAll('[required]')].filter((input) => !input.closest('[hidden]'))
    const groups = new Set(live.filter((input) => input.type === 'radio').map((input) => input.name))
    const radios = [...groups].every((name) => form.querySelector(`input[name="${name}"]:checked`))
    const rest = live.filter((input) => input.type !== 'radio')
      .every((input) => (input.type === 'file' ? input.files.length : input.value.trim()))
    submit.disabled = !(radios && rest)
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    if (submit.disabled) return
    dialog.close()
    showToast('인증을 요청했어요', { icon: '#icon-check', tone: 'success' })
  })

  initDialogFocus(dialog, form)
  dialog.addEventListener('click', (e) => {
    // 판 바깥(어두워진 자리)을 누르면 닫습니다.
    if (e.target === dialog) dialog.close()
  })
  dialog.addEventListener('close', () => unlockScroll())
  return dialog
}

export function initVerify() {
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-verify-open]')
    if (!trigger) return
    const kind = trigger.dataset.verifyOpen
    if (!KINDS[kind]) return
    const dialog = document.getElementById(`verify-${kind}`) ?? build(kind)
    if (dialog.open) return
    dialog.showModal()
    lockScroll()
  })
}
