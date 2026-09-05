/**
 * 고른 일정에 이미 확정된 사람들을 카드 안에 펼치고, 전체는 창으로 엽니다.
 *
 *   import { initParticipants } from './components/participants.js'
 *   initParticipants()   // product.js 가 일정을 그린 뒤에
 *
 * 카드 안의 블록은 마크업에 적어두지 않고 여기서 만듭니다. 같은 사람 목록이 카드
 * 요약과 창 두 곳에 나오는데, 마크업에 적어두면 둘이 갈립니다 — 상품마다 일정이
 * 다시 그려지는 화면이라 특히 그렇습니다.
 *
 * 무엇을 공개하고 무엇을 감추는지는 policy.html 이 정합니다(일정별 참여자 구성).
 * 여기서 지키는 것은 그중 셋입니다.
 *
 *   확정된 사람만    빈자리 알림 신청자는 세지 않습니다. 알림은 자리가 아닙니다.
 *   마감된 일정      아무것도 붙이지 않습니다. 고를 수 없는 일정입니다.
 *   아무도 없으면    한 줄만 남기고 버튼을 만들지 않습니다 — 열어봐야 빈 창입니다.
 */

import { PRODUCTS, peopleOf, peopleSummary } from './products.js?v=49fbe067'
import { currentProduct } from './product.js?v=604e8878'
import { openConfirm } from './confirm.js?v=f516d2db'
import { dateAfter, dayText } from './schedule.js?v=a9e9003f'

const DIALOG = 'participants'
const EMPTY = '아직 참여자가 없어요'
/** 주소에 상품이 없으면 detail.html 에 적혀 있는 그 상품입니다. */
const DEFAULT = 'tikitaka'

const scheduleOf = () => PRODUCTS[currentProduct() ?? DEFAULT]?.schedule ?? []
const find = (value) => scheduleOf().find((o) => o.v === value)

/** 창의 첫 줄에 적는 일정. 목록 카드의 날짜 태그와 같은 규칙으로 만듭니다. */
const whenText = (o) => `${dayText(dateAfter(o.in))} ${o.label}`

const el = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text != null) node.textContent = text
  return node
}

/* ---- 카드 안의 요약 ------------------------------------------------------ */

function summaryBlock(o) {
  const { m, f } = peopleOf(o)
  const wrap = el('span', 'option-card__participants')
  // 접힐 때 잘려나갈 자리. 여백과 선까지 이 안에 들어갑니다.
  const inner = el('span', 'option-card__participants-inner')
  inner.append(el('span', 'option-card__participants-divider'))
  wrap.append(inner)

  const row = el('span', 'option-card__participants-row')
  row.append(el('span', 'option-card__participants-label', '참여자 구성'))

  if (!m.length && !f.length) {
    row.append(el('span', 'option-card__participants-empty', EMPTY))
    inner.append(row)
    return wrap
  }

  const summary = el('span', 'option-card__participants-summary')
  const count = el('span', 'option-card__participants-count')
  // "남 6 · 여 3" — 숫자만 <b> 로 감싸 브랜드색이 수에만 걸립니다.
  count.append('남 ', el('b', null, String(m.length)), ' · 여 ', el('b', null, String(f.length)))
  summary.append(count, el('span', 'option-card__participants-detail', peopleSummary(o)))
  row.append(summary)

  const button = el('button', 'btn btn--blur btn--small')
  button.type = 'button'
  button.dataset.participants = o.v
  button.append(el('span', 'btn__label', '전체 참여자 구성 보기'))

  inner.append(row, button)
  return wrap
}

/* ---- 전체를 펼친 창 ------------------------------------------------------ */

function column(name, list) {
  const col = el('section', 'participants__col')
  const title = el('h3')
  title.append(`${name} `, el('b', null, String(list.length)))
  col.append(title)

  if (!list.length) {
    const empty = el('p', 'participants__empty')
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('aria-hidden', 'true')
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use')
    use.setAttribute('href', '#icon-infoCircle')
    svg.append(use)
    empty.append(svg, el('span', null, EMPTY))
    col.append(empty)
    return col
  }

  /*
   * 두 줄로 나눠 담습니다. 좁은 화면에서 위 줄이 먼저 왼쪽에서 오른쪽으로 차고 아래
   * 줄이 그만큼 따라오는데, 이것을 한 줄짜리 목록에 맡기면 칸 폭이 서로 묶입니다 —
   * 같은 칸의 두 사람이 긴 쪽에 맞춰 함께 늘어납니다. 줄을 아예 나눠두면 사람마다
   * 제 글자만큼만 차지합니다.
   *
   * 넓은 화면에서는 두 줄이 세로로 쌓여 앞에서부터 순서대로 한 줄이 됩니다.
   * 한두 명은 나눌 것이 없어 윗줄 하나로 끝납니다.
   */
  const wrap = el('div', 'participants__list')
  const half = list.length <= 2 ? list.length : Math.ceil(list.length / 2)
  for (const part of [list.slice(0, half), list.slice(half)]) {
    if (!part.length) continue
    const ul = el('ul', 'participants__row')
    for (const person of part) {
      const li = el('li', `participant participant--${name === '남성' ? 'm' : 'f'}`)
      const content = el('span', 'participant__content')
      content.append(
        el('span', 'participant__age', person.age),
        el('span', 'participant__sep'),
        el('span', 'participant__job', person.job),
      )
      li.append(content)
      ul.append(li)
    }
    wrap.append(ul)
  }
  col.append(wrap)
  return col
}

function fill(dialog, o) {
  const when = dialog.querySelector('[data-participants-when]')
  if (when) when.textContent = whenText(o)
  const cols = dialog.querySelector('.participants__cols')
  if (!cols) return
  const { m, f } = peopleOf(o)
  cols.replaceChildren(column('남성', m), column('여성', f))
}

/* ------------------------------------------------------------------------ */

export function initParticipants(scope = document) {
  const dialog = document.getElementById(DIALOG)

  for (const input of scope.querySelectorAll('[name="schedule"]')) {
    const card = input.closest('.option-card')
    if (!card || card.dataset.participantsReady) continue
    card.dataset.participantsReady = '1'
    // 마감된 일정은 고를 수 없으므로 펼칠 것도 없습니다.
    if (card.classList.contains('option-card--soldout')) continue
    const o = find(input.value)
    if (!o) continue
    card.append(summaryBlock(o))
  }

  if (!dialog || dialog.dataset.participantsReady) return
  dialog.dataset.participantsReady = '1'
  document.addEventListener('click', (e) => {
    const button = e.target.closest('[data-participants]')
    if (!button) return
    // 카드는 <label> 입니다. 막지 않으면 창을 여는 클릭이 라디오까지 건드립니다.
    e.preventDefault()
    const o = find(button.dataset.participants)
    if (!o) return
    fill(dialog, o)
    openConfirm(dialog)
  })
}
