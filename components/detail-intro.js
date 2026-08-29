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
 */

export function initDetailIntro(scope = document) {
  for (const root of scope.querySelectorAll('.detail-intro')) {
    if (root.dataset.introReady) continue
    root.dataset.introReady = '1'

    const content = root.querySelector('.detail-intro__content')
    const button = root.querySelector('[data-expand]')
    if (!content || !button) continue

    // 접었을 때의 높이는 CSS 가 정합니다. 여기서는 접어본 뒤 실제로 잘리는지만 봅니다.
    root.classList.add('is-collapsed')
    if (content.scrollHeight <= content.clientHeight) {
      root.classList.remove('is-collapsed')
      continue
    }

    button.addEventListener('click', () => root.classList.remove('is-collapsed'))
  }
}
