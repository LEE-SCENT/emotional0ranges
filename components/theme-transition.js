/**
 * 밝은 화면(로테이션)과 어두운 화면(프라이빗)을 오갈 때만 화면을 디졸브로 바꿉니다.
 *
 *   <script src="./components/theme-transition.js"></script>   ← <head> 맨 위, module 이 아닌 일반 스크립트
 *
 * 디졸브는 브라우저의 페이지 간 화면 전환(cross-document view transition)이 합니다.
 * container.css 의 `@view-transition` 이 모든 페이지에서 켜 두지만, 같은 테마끼리
 * 넘어갈 때까지 화면이 흐려졌다 나타나면 모든 이동이 느려 보입니다. 그래서 떠나는
 * 화면이 제 테마를 적어두고, 도착한 화면이 같으면 전환을 건너뜁니다.
 *
 * <head> 에 일반 스크립트로 두는 이유는 pagereveal 이 첫 그림보다 먼저 와서입니다 —
 * module 은 그보다 늦게 실행될 수 있어, 듣기 시작하기 전에 디졸브가 이미 끝납니다.
 *
 * 전환을 지원하지 않는 브라우저에서는 이 사건들이 오지 않고 그냥 바로 넘어갑니다.
 */

const KEY = 'theme-transition-from'
const theme = () => document.documentElement.dataset.theme ?? 'default'

addEventListener('pageswap', (e) => {
  if (!e.viewTransition) return
  try {
    sessionStorage.setItem(KEY, theme())
  } catch {
    // 저장할 수 없으면 아래에서 전환을 건너뜁니다.
  }
})

addEventListener('pagereveal', (e) => {
  if (!e.viewTransition) return
  let from = null
  try {
    from = sessionStorage.getItem(KEY)
    sessionStorage.removeItem(KEY)
  } catch {
    // 위와 같습니다.
  }
  // 어디서 왔는지 모르면(주소를 직접 열었거나 저장이 막혔으면) 디졸브하지 않습니다.
  if (!from || from === theme()) {
    // 건너뛰면 전환의 ready 가 거절됩니다. 받아두지 않으면 콘솔에 오류로 남습니다.
    e.viewTransition.ready.catch(() => {})
    e.viewTransition.skipTransition()
  }
})
