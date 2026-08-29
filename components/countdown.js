/**
 * 남은 시간을 1초마다 줄여 보여줍니다.
 *
 *   <time class="countdown" data-countdown="9024">02:30:24</time>
 *
 *   import { initCountdowns } from './components/countdown.js'
 *   initCountdowns()
 *
 * data-countdown 은 남은 초입니다. 정적 화면이라 절대 시각 대신 초를 넘겨받지만,
 * 실제 서비스에서는 마감 시각을 내려주고 그 차이를 재는 편이 맞습니다 — 탭을 오래
 * 열어두거나 기기 시계가 바뀌면 초 세기는 어긋납니다.
 *
 * 타이머 하나에 setInterval 하나를 두지 않고 전체를 1초에 한 번 훑습니다. 카드가
 * 여러 장이면 각자 도는 타이머가 서로 다른 순간에 깨어나 초가 어긋나 보입니다.
 *
 * 초 단위로 바뀌는 글자에는 aria-live 를 걸지 않습니다. 스크린 리더가 1 초마다
 * 읽어 다른 내용을 덮습니다. 남은 시간이 궁금하면 그 자리에서 다시 읽으면 됩니다.
 */

const pad = (n) => String(n).padStart(2, '0')

/** 초를 HH:MM:SS 로. 24 시간이 넘어도 시간 자리를 늘려 그대로 보여줍니다. */
function format(total) {
  const s = Math.max(0, total)
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map(pad).join(':')
}

/** <time> 의 datetime 은 기계가 읽는 자리라 ISO 기간으로 적습니다. */
function duration(total) {
  const s = Math.max(0, total)
  return `PT${Math.floor(s / 3600)}H${Math.floor((s % 3600) / 60)}M${s % 60}S`
}

export function initCountdowns(scope = document) {
  const items = [...scope.querySelectorAll('[data-countdown]')].map((el) => ({
    el,
    left: Number(el.dataset.countdown) || 0,
  }))
  if (!items.length) return

  const paint = () => {
    for (const item of items) {
      item.el.textContent = format(item.left)
      if (item.el.tagName === 'TIME') item.el.dateTime = duration(item.left)
    }
  }

  paint()

  const id = setInterval(() => {
    let running = false
    for (const item of items) {
      if (item.left > 0) {
        item.left -= 1
        running = true
      }
    }
    paint()
    // 남은 것이 없으면 더 돌 이유가 없습니다.
    if (!running) clearInterval(id)
  }, 1000)
}
