/**
 * 뒤로 돌아온 화면은 맨 위에서 시작합니다.
 *
 *   import './components/scroll-restore.js'
 *
 * 브라우저는 뒤로 갈 때 그 화면에서 보던 자리로 스크롤을 되돌려 놓습니다. 문서를 읽다
 * 잠깐 다른 데를 다녀오는 길에는 그 편이 낫지만, 여기서는 신청하러 갔다가 돌아오는
 * 길입니다 — 돌아온 화면이 한참 아래에서 시작하면 무엇을 보고 있었는지 다시 찾아
 * 올라가야 하고, 방금 지나온 화면과 이어지지도 않습니다.
 *
 * 두 자리를 모두 막습니다. scrollRestoration 은 브라우저가 스스로 되돌리는 것을 끄고,
 * pageshow 는 얼려두었던 화면을 통째로 되살릴 때를 맡습니다 — 그때는 스크롤도 얼어
 * 있던 자리 그대로라 위 설정이 닿지 않습니다.
 *
 * 불러오는 것만으로 겁니다. 화면마다 정할 것이 없어 부를 함수도 두지 않았습니다.
 */

if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

/**
 * 맨 위로. 한 번으로 끝나지 않습니다.
 *
 * 사파리는 얼려둔 화면을 되살리면서 스크롤을 pageshow 뒤에 되돌려 놓기도 합니다.
 * 그 자리에서 한 번만 올려두면 곧바로 아래로 되돌려져, 아무 일도 하지 않은 것과
 * 같아집니다. 다음 프레임과 그 조금 뒤에 한 번씩 더 올려 그 되돌림을 지웁니다.
 *
 * 여러 번 불러도 이미 맨 위면 아무 일도 일어나지 않습니다.
 */
function toTop() {
  scrollTo(0, 0)
  requestAnimationFrame(() => scrollTo(0, 0))
  setTimeout(() => scrollTo(0, 0), 60)
}

addEventListener('pageshow', (e) => {
  if (e.persisted) toTop()
})
