/**
 * 일정 목록의 날짜를 그리고, 고른 일정을 다음 화면으로 넘깁니다.
 *
 *   <div class="schedule__group">
 *     <p class="schedule__date"></p>
 *     <ul class="schedule__options">
 *       <li><label class="option-card" data-date-in="0" data-time="오후 2시"
 *                  data-where="서울 강남 · 27-38세" data-price="45000" data-discount="3000">
 *             <input type="radio" name="schedule" value="s1" checked> … </label></li>
 *
 *   import { initSchedule } from './components/schedule.js'
 *   initSchedule()
 *
 * 날짜를 마크업에 적어두지 않고 여기서 그립니다. 정적인 화면이라 일정이 늘 미래에
 * 있어야 하는데, 적어둔 날짜는 하루만 지나도 지난 날이 됩니다. data-date(YYYY-MM-DD)
 * 가 있으면 그것을 쓰고, 없으면 data-date-in(오늘부터 며칠 뒤)으로 계산합니다 —
 * 실제 서비스에서는 앞의 것만 내려주면 됩니다.
 *
 * 신청하기 링크에는 고른 일정을 붙여둡니다. 누르는 순간 만들지 않고 고를 때마다
 * 고쳐두는 것은, 링크를 새 탭으로 열거나 주소를 복사해도 같은 일정이어야 하기
 * 때문입니다.
 */

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']

/**
 * 오늘(한국 시간)의 날짜.
 *
 * 기기 시계가 어느 지역에 맞춰져 있든 서비스 운영 기준으로 판단해야 합니다. 해외에
 * 있는 사람이 "오늘"이 아니라고 안내받고 결제한 뒤, 서버는 당일로 보고 환불을
 * 막는 일이 생깁니다.
 */
export function todayInSeoul() {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .split('-')
    .map(Number)
  return { y, m, d }
}

/** 오늘부터 며칠 뒤의 날짜. */
export function dateAfter(days) {
  const t = todayInSeoul()
  return new Date(t.y, t.m - 1, t.d + days)
}

/** 일정 카드가 가리키는 날짜. */
export function dateOf(el) {
  const raw = el.dataset.date
  if (raw) {
    const [y, m, d] = raw.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const days = Number(el.dataset.dateIn)
  if (!Number.isFinite(days)) return null
  return dateAfter(days)
}

export function isToday(at) {
  const t = todayInSeoul()
  return at.getFullYear() === t.y && at.getMonth() + 1 === t.m && at.getDate() === t.d
}

/** 목록의 날짜 머리글: 8월 30일(일요일) */
export const groupText = (at) =>
  `${at.getMonth() + 1}월 ${at.getDate()}일(${WEEKDAY[at.getDay()]}요일)`

/** 목록 카드의 한 줄: 8월 30일 (일) — 목록에서는 올해 안의 일정만 보여줍니다. */
export const dayText = (at) =>
  `${at.getMonth() + 1}월 ${at.getDate()}일 (${WEEKDAY[at.getDay()]})`

/** 요약의 한 줄: 2026년 8월 30일 (일) */
export const dateText = (at) =>
  `${at.getFullYear()}년 ${at.getMonth() + 1}월 ${at.getDate()}일 (${WEEKDAY[at.getDay()]})`

export function initSchedule(scope = document) {
  const groups = [...scope.querySelectorAll('.schedule__group')]

  for (const group of groups) {
    const head = group.querySelector('.schedule__date')
    const first = group.querySelector('.option-card')
    if (!head || !first) continue
    const at = dateOf(first)
    // 날짜를 계산할 수 없으면 마크업에 적힌 것을 그대로 둡니다.
    if (at) {
      head.textContent = groupText(at)
      head.dateTime = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`
    }
  }

  /* ---- 고른 일정을 다음 화면으로 -------------------------------------- */

  const options = [...scope.querySelectorAll('[name="schedule"]')]
  if (!options.length) return

  for (const el of options) el.addEventListener('change', () => stampScheduleLinks(scope))
  stampScheduleLinks(scope)
}

/**
 * 신청하기 링크에 고른 일정을 붙입니다.
 *
 * 밖으로 내는 것은 빈자리 알림 때문입니다. 알림 일정을 고르면 그 링크에서 href 를
 * 아예 걷어냈다가 보통 일정으로 돌아올 때 되돌리는데, 그때 붙일 일정을 그쪽에서
 * 다시 계산하면 두 곳이 같은 규칙을 각자 들고 있게 됩니다.
 */
export function stampScheduleLinks(scope = document) {
  const picked = [...scope.querySelectorAll('[name="schedule"]')].find((el) => el.checked)?.value
  if (!picked) return
  for (const a of scope.querySelectorAll('.schedule__actions a[href]')) {
    const url = new URL(a.getAttribute('href'), location.href)
    url.searchParams.set('schedule', picked)
    // 주소창에 보이는 것은 상대 경로 그대로가 낫습니다.
    a.setAttribute('href', `${url.pathname.split('/').pop()}${url.search}`)
  }
}
