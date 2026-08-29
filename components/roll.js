/**
 * 숫자가 바뀔 때 자릿수를 굴려서 보여줍니다.
 *
 *   <span class="roll" data-roll></span>
 *
 *   import { roll } from './components/roll.js'
 *   roll(el, '42,000')
 *
 * 옵션을 켜거나 일정을 바꾸면 결제할 금액이 달라집니다. 글자만 갈아끼우면 바뀐 것을
 * 못 보고 지나치는데, 정작 그 숫자가 이 화면에서 가장 중요한 값입니다. 자릿수가
 * 굴러가면 무엇이 어디서 달라졌는지가 눈에 남습니다.
 *
 * 자리마다 0~9 를 세 벌 세워두고 위로 밀어 올립니다. 한 칸만 움직이면 4 가 5 로
 * 슬쩍 바뀔 뿐이라, 늘 한 바퀴를 더 돌게 해서 굴러가는 것으로 보이게 합니다. 세 벌인
 * 것은 한 바퀴(10) + 최대 차이(9) 를 넘겨야 하기 때문입니다.
 *
 * 왼쪽 자리부터 조금씩 늦게 출발합니다. 다 같이 멈추면 한 덩어리가 툭 바뀌는 것으로
 * 보입니다.
 *
 * 자릿수가 달라지면(9,000 → 10,000) 굴리지 않고 그대로 새로 그립니다. 없던 칸이
 * 생기는 동안 굴러봐야 어느 자리가 어디로 갔는지 알 수 없습니다.
 */

const DIGITS = '0123456789'
const CYCLES = 3
/** 자리마다 늦어지는 시간. ⚠️ Figma 에 없어 코드에서 정했습니다. */
const STAGGER = 40

const wantsLessMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** 한 칸. 숫자면 굴러가는 띠를, 쉼표 같은 것은 글자 그대로 둡니다. */
function column(ch) {
  const col = document.createElement('span')
  col.className = 'roll__col'
  if (!/\d/.test(ch)) {
    col.classList.add('roll__col--fixed')
    col.textContent = ch
    return col
  }
  const strip = document.createElement('span')
  strip.className = 'roll__strip'
  for (let i = 0; i < CYCLES; i += 1) {
    for (const d of DIGITS) {
      const cell = document.createElement('i')
      cell.textContent = d
      strip.append(cell)
    }
  }
  col.append(strip)
  col.dataset.at = ch
  return col
}

/** 굴리지 않고 그 자리에 세웁니다. */
function place(col) {
  const strip = col.querySelector('.roll__strip')
  if (!strip) return
  strip.style.transition = 'none'
  strip.style.translate = `0 ${-Number(col.dataset.at)}em`
}

function build(host, text) {
  host.replaceChildren(...[...text].map(column))
  for (const col of host.children) place(col)
}

export function roll(host, text) {
  const same = host.childElementCount === text.length
  if (!same || wantsLessMotion()) {
    build(host, text)
    return
  }

  ;[...host.children].forEach((col, i) => {
    const ch = text[i]
    if (col.classList.contains('roll__col--fixed')) {
      col.textContent = ch
      return
    }
    const from = Number(col.dataset.at)
    if (!/\d/.test(ch)) {
      // 숫자 자리가 숫자가 아닌 것으로 바뀌면 굴릴 것이 없습니다.
      build(host, text)
      return
    }
    const to = Number(ch)
    if (to === from) return

    const strip = col.querySelector('.roll__strip')
    // 늘 앞으로 돕니다. 한 바퀴를 더 얹어 굴러가는 것이 보이게 합니다.
    const steps = ((to - from + 10) % 10) + 10
    strip.style.transition = 'none'
    strip.style.translate = `0 ${-from}em`
    // 되돌려 세운 자리를 브라우저가 한 번 반영해야 다음 값이 전환으로 이어집니다.
    void strip.offsetHeight
    strip.style.transition = ''
    strip.style.transitionDelay = `${i * STAGGER}ms`
    strip.style.translate = `0 ${-(from + steps)}em`
    col.dataset.at = String(to)

    // 굴러간 자리는 세 벌 중 어디쯤이든 상관없지만, 다음 번에 또 앞으로 돌 자리를
    // 남겨두어야 하므로 끝나면 첫 벌로 조용히 되돌립니다.
    strip.addEventListener(
      'transitionend',
      () => {
        strip.style.transitionDelay = ''
        place(col)
      },
      { once: true },
    )
  })
}
