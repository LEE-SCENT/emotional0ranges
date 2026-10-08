/**
 * 칸들의 몸짓 — 고르는 칸이 초점을 내려놓는 것, 셀렉트의 고르는 판, 글자 칸의 지우기.
 *
 *   import { initFields } from './components/field.js'
 *   initFields()
 *
 * 문서 하나에 한 번만 답니다. 나중에 그려지는 창(verify.js) 안의 칸도 함께 받습니다.
 *
 * ── 고르고 나면 초점을 내려놓습니다
 *
 * 셀렉트·달·날짜처럼 눌러서 고르는 칸은, 고른 뒤에도 초점이 남으면 여전히 쓰는 중인
 * 모습(흰 바탕과 테두리)으로 서 있습니다. 글자 칸은 다 썼는지 알 수 없어 초점이 남는
 * 것이 맞지만, 고르는 칸은 고른 순간이 끝입니다.
 *
 * 손가락·마우스로 고른 때만입니다. 키보드로 고르는 사람은 화살표를 누를 때마다 값이
 * 바뀌는데(change), 그때마다 초점을 빼면 다음 화살표가 갈 곳이 없습니다.
 *
 * ── 셀렉트의 고르는 판 (마우스가 있는 기기에서만)
 *
 * 칸은 우리 것인데 눌렀을 때 뜨는 판만 기기의 것이라, 직업 검색의 목록과 따로
 * 놀았습니다. 마우스가 있는 기기에서는 기기의 판을 막고 같은 목록(.text-field__suggest)을
 * 칸 아래에 띄웁니다.
 *
 * 손가락으로 쓰는 기기는 그대로 둡니다. 그쪽의 판(휠·시트)은 손가락에 맞춰져 있어,
 * 스물다섯 개짜리 구 목록을 고르기에 우리 목록보다 낫습니다.
 *
 * 진짜 <select> 는 그대로입니다. 값도 초점도 그쪽이 들고 있고, 목록은 그 위에 얹힌
 * 겉모습일 뿐이라 — 고르면 select 의 값을 바꾸고 change 를 올려, 폼은 무엇으로 골랐는지
 * 알 필요가 없습니다.
 *
 * ⚠️ 이 판의 디자인이 Figma 에 없습니다. 직업 검색의 목록을 그대로 씁니다.
 *
 * ── 글자 칸의 지우기 (아래 initClearButtons)
 */
const PICKERS = 'select, input[type="month"], input[type="date"]'

let ready = false

export function initFields() {
  if (ready) return
  ready = true

  // 마지막으로 칸을 건드린 것이 손가락·마우스였는지.
  let byPointer = false
  document.addEventListener('pointerdown', () => { byPointer = true }, true)
  document.addEventListener('keydown', () => { byPointer = false }, true)

  document.addEventListener('change', (e) => {
    if (byPointer && e.target.matches?.(PICKERS)) e.target.blur()
  })

  initSelectMenus()
  initClearButtons()
}

/* ---- 글자 칸의 지우기 ----------------------------------------------------
   무엇이든 적혀 있는 글자 칸에는 오른쪽 끝에 지우기가 섭니다. 긴 학교 이름을 한 글자씩
   지우게 하지 않습니다.

   마크업에 미리 적어두지 않고 여기서 붙입니다. 글자 칸이 생길 때마다 버튼 마크업을
   함께 적어야 하면, 하나쯤은 빠집니다 — 실제로 학교 칸이 그랬습니다.

   고칠 수 없는 칸(readonly)과 제 지우기를 따로 가진 칸(직업 검색)은 건너뜁니다. */
const CLEARABLE = '.text-field > input[type="text"]:not([readonly]):not([role="combobox"])'

function syncClear(input) {
  const box = input.parentElement
  let button = box.querySelector(':scope > .text-field__clear')
  if (!button) {
    if (!input.value) return
    button = document.createElement('button')
    button.type = 'button'
    button.className = 'text-field__clear'
    button.setAttribute('aria-label', '지우기')
    button.innerHTML = '<svg aria-hidden="true"><use href="#icon-cancelCircleFilled"></use></svg>'
    button.addEventListener('click', () => {
      input.value = ''
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.focus()
    })
    input.after(button)
  }
  button.hidden = !input.value
}

function initClearButtons() {
  // 이미 값이 들어 있는 칸(저장된 것, 쓰던 것)부터.
  for (const input of document.querySelectorAll(CLEARABLE)) syncClear(input)
  document.addEventListener('input', (e) => {
    if (e.target.matches?.(CLEARABLE)) syncClear(e.target)
  })
}

/* ---- 셀렉트의 고르는 판 -------------------------------------------------- */

const SELECT = '.text-field--select select'
/** 마우스가 있는 기기. 폭이 아니라 기기로 가립니다 — 창을 좁힌 데스크톱도 데스크톱입니다. */
const desktop = matchMedia('(hover: hover) and (pointer: fine)')

let serial = 0
/** 지금 열려 있는 판. 한 번에 하나만 열립니다. */
let open = null

function close() {
  if (!open) return
  open.list.remove()
  open.select.setAttribute('aria-expanded', 'false')
  open.select.removeAttribute('aria-activedescendant')
  open = null
}

function mark(index) {
  const items = [...open.list.children]
  open.active = (index + items.length) % items.length
  for (const [i, item] of items.entries()) item.setAttribute('aria-selected', String(i === open.active))
  open.select.setAttribute('aria-activedescendant', items[open.active].id)
  items[open.active].scrollIntoView({ block: 'nearest' })
}

function show(select) {
  close()
  // 아직 고르지 않았다는 안내(값이 빈 것)는 고를 것이 아니라 목록에 세우지 않습니다.
  const options = [...select.options].filter((option) => option.value !== '' && !option.disabled)
  if (!options.length) return

  const list = document.createElement('ul')
  list.className = 'text-field__suggest'
  list.id = `select-menu-${++serial}`
  list.setAttribute('role', 'listbox')
  for (const [i, option] of options.entries()) {
    const item = document.createElement('li')
    item.id = `${list.id}-${i}`
    item.setAttribute('role', 'option')
    item.setAttribute('aria-selected', 'false')
    item.dataset.value = option.value
    item.append(option.text)
    // 지금 골라져 있는 것에는 체크가 붙습니다.
    if (option.selected) {
      item.classList.add('is-current')
      item.insertAdjacentHTML('beforeend', '<svg aria-hidden="true"><use href="#icon-check"></use></svg>')
    }
    list.append(item)
  }
  select.closest('.text-field').append(list)
  select.setAttribute('aria-expanded', 'true')
  select.setAttribute('aria-controls', list.id)
  open = { select, list, active: -1 }
  // 열리면 지금 골라져 있는 줄에서 시작합니다. 아직 고른 것이 없으면 어느 줄도 켜지
  // 않습니다 — 첫 줄이 켜져 있으면 그것이 이미 골라져 있는 것처럼 보입니다.
  const current = options.findIndex((option) => option.selected)
  if (current >= 0) mark(current)

  // click 이 아니라 mousedown 입니다. click 을 기다리면 그 전에 select 가 초점을 잃어
  // 판이 먼저 닫힙니다.
  list.addEventListener('mousedown', (e) => {
    e.preventDefault()
    const item = e.target.closest('[role="option"]')
    if (item) pick(item.dataset.value)
  })
}

function pick(value) {
  const { select } = open
  close()
  if (select.value === value) return
  select.value = value
  select.dispatchEvent(new Event('input', { bubbles: true }))
  select.dispatchEvent(new Event('change', { bubbles: true }))
}

function initSelectMenus() {
  // 기기의 판이 뜨지 않게 막고 우리 것을 여닫습니다.
  document.addEventListener('mousedown', (e) => {
    if (!desktop.matches) return
    const select = e.target.closest?.(SELECT)
    if (!select || select.disabled || e.button !== 0) return
    e.preventDefault()
    select.focus()
    if (open?.select === select) close()
    else show(select)
  })

  document.addEventListener('keydown', (e) => {
    if (!desktop.matches) return
    const select = e.target.closest?.(SELECT)
    if (!select) return
    const here = open?.select === select

    if (!here) {
      // 닫혀 있을 때 이 키들은 기기의 판을 엽니다(또는 값을 바로 바꿉니다). 대신 우리 것을 엽니다.
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault()
        show(select)
      }
      return
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); mark(open.active + 1) }
    // 켜진 줄이 없을 때 ↑ 는 맨 아래에서 시작합니다(↓ 는 맨 위).
    else if (e.key === 'ArrowUp') { e.preventDefault(); mark(open.active < 0 ? -1 : open.active - 1) }
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (open.active >= 0) pick(open.list.children[open.active].dataset.value)
    }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close() }
    else if (e.key === 'Tab') close()
    // 글자를 쳐서 건너뛰는 것은 select 가 스스로 값을 바꿉니다. 판은 낡은 것이 되므로 닫습니다.
    else if (e.key.length === 1) close()
  }, true)

  // 초점이 떠나면 닫습니다.
  document.addEventListener('focusout', (e) => {
    if (open && e.target === open.select) close()
  })
  // 손가락 기기로 바뀌면(태블릿에 마우스를 떼는 경우) 열려 있던 것을 닫습니다.
  desktop.addEventListener('change', close)
}
