/**
 * 소개를 접었다 폅니다.
 *
 *   <div class="detail-intro">
 *     <div class="detail-intro__content"> … </div>
 *     <div class="detail-intro__more"><button data-expand>소개 전체 보기</button></div>
 *   </div>
 *
 *   import { initDetailIntro } from './components/detail-intro.js'
 *   initDetailIntro()
 *
 * 마크업은 펼쳐진 채로 두고 여기서 접습니다. 반대로 두면 스크립트가 실패했을 때
 * 소개가 잘린 채 남고 펼칠 방법도 없습니다.
 *
 * 이미 다 보이는 소개라면 접지 않습니다 — 눌러도 아무 일도 없는 버튼을 두지
 * 않으려는 것입니다.
 *
 * 다만 "다 보이는지"는 한 번 재고 끝낼 수 있는 것이 아닙니다. 소개가 사진이면 그
 * 사진이 도착하기 전에는 높이가 0 에 가깝고, 그때 재면 접을 것이 없다고 나옵니다 —
 * 그대로 두면 사진이 도착해 화면 세 배 길이가 되어도 "소개 전체 보기"가 끝내
 * 나오지 않습니다. 창 폭이 바뀌어 사진이 커지거나 작아질 때도 마찬가지입니다.
 * 그래서 사진이 도착할 때와 크기가 바뀔 때마다 다시 봅니다.
 */

export function initDetailIntro(scope = document) {
  for (const root of scope.querySelectorAll('.detail-intro')) {
    if (root.dataset.introReady) continue
    root.dataset.introReady = '1'

    const content = root.querySelector('.detail-intro__content')
    const button = root.querySelector('[data-expand]')
    if (!content || !button) continue

    // 한 번 펼치고 나면 다시 접지 않습니다. 읽는 도중에 소개가 도로 접히면 보고 있던
    // 자리를 잃습니다.
    let opened = false

    // 접었을 때의 높이는 CSS 가 정합니다. 여기서는 접어본 뒤 실제로 잘리는지만 봅니다.
    // 1 을 두는 것은 확대·축소나 기기 화소 비율 때문에 소수점 하나가 남는 일이 있어서입니다.
    const check = () => {
      if (opened) return
      root.classList.add('is-collapsed')
      if (content.scrollHeight <= content.clientHeight + 1) root.classList.remove('is-collapsed')
    }

    button.addEventListener('click', () => {
      opened = true
      root.classList.remove('is-collapsed')
    })

    // 접힌 높이는 고정이라 사진이 도착해도 상자 크기는 그대로입니다. 안에 든 것을
    // 지켜봐야 합니다 — 폭이 바뀌어 사진 높이가 달라지는 것도 여기서 잡힙니다.
    const watch = new ResizeObserver(check)
    watch.observe(content)
    for (const el of content.children) watch.observe(el)

    check()
  }
}
