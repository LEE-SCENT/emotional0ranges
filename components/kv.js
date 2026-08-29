/**
 * KV 배경 영상(YouTube)을 만들고 관리합니다.
 *
 *   <div class="kv__media" data-youtube="9fRsFJAS1-Y" data-title="소개 영상"></div>
 *
 * iframe 을 마크업에 직접 두지 않고 여기서 만드는 이유는 `origin` 파라미터 때문입니다.
 * enablejsapi=1 은 origin 이 현재 페이지와 정확히 일치할 때만 상태 메시지를 돌려주는데,
 * 그 값은 배포 환경마다 달라 정적 HTML 에 박아둘 수 없습니다.
 *
 * 상태 메시지로 두 가지를 합니다.
 *   1. 재생이 시작되면 영상을 드러냅니다. 그 전까지 YouTube 가 띄우는 오버레이
 *      (일시정지 아이콘 등)는 controls=0 으로 지워지지 않아 가려두는 편이 확실합니다.
 *   2. 재생이 끝나면 다시 틀어 반복합니다. `loop=1` 은 `playlist=` 를 요구하는데
 *      그러면 플레이어가 재생목록 UI(이전/다음 버튼)를 그려버립니다.
 *
 * YouTube 의 스크립트는 불러오지 않습니다 — 핸드셰이크 한 번과 메시지 수신뿐이라
 * postMessage 로 직접 주고받습니다.
 */

const YT_ORIGIN = 'https://www.youtube.com'
const ENDED = 0
const PLAYING = 1
/** 상태 메시지가 끝내 오지 않아도 영상이 영영 안 보이면 안 되므로 그때는 그냥 드러냅니다. */
const REVEAL_FALLBACK_MS = 2500

const PARAMS = {
  autoplay: 1,
  mute: 1,
  controls: 0,
  modestbranding: 1,
  rel: 0,
  playsinline: 1,
  disablekb: 1,
  fs: 0,
  iv_load_policy: 3,
  enablejsapi: 1,
}

/**
 * 재생 상태를 꺼냅니다. YouTube 스크립트를 쓰지 않고 postMessage 만 듣는 경우,
 * 상태는 `onStateChange` 가 아니라 `infoDelivery.info.playerState` 로 옵니다.
 * 두 형태를 모두 받아 둡니다.
 */
function playerState(data) {
  if (data?.event === 'infoDelivery') return data.info?.playerState
  if (data?.event === 'onStateChange' && typeof data.info === 'number') return data.info
  return undefined
}

function buildSrc(videoId) {
  const p = new URLSearchParams({ ...PARAMS, origin: location.origin })
  return `${YT_ORIGIN}/embed/${encodeURIComponent(videoId)}?${p}`
}

export function initKvVideo(scope = document) {
  const mounts = [...scope.querySelectorAll('.kv__media[data-youtube]')]
  if (!mounts.length) return

  const frames = mounts.map((mount) => {
    const frame = document.createElement('iframe')
    frame.src = buildSrc(mount.dataset.youtube)
    frame.title = mount.dataset.title || '배경 영상'
    frame.allow = 'autoplay; encrypted-media'
    frame.tabIndex = -1
    frame.setAttribute('aria-hidden', 'true')
    mount.append(frame)
    return frame
  })

  const reveal = (frame) => frame.closest('.kv')?.classList.add('is-playing')
  const command = (frame, func) =>
    frame.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), YT_ORIGIN)

  addEventListener('message', (e) => {
    if (e.origin !== YT_ORIGIN) return
    const frame = frames.find((f) => f.contentWindow === e.source)
    if (!frame) return
    let data
    try { data = JSON.parse(e.data) } catch { return }
    const state = playerState(data)
    if (state === PLAYING) reveal(frame)
    if (state === ENDED) {
      // 캐러셀이 여러 장이면 다음 장으로 넘길 기회를 줍니다. 한 장뿐이면 아무도
      // 듣지 않으므로 아래에서 그대로 다시 틉니다.
      frame.closest('.kv')?.dispatchEvent(new CustomEvent('kv:ended', { bubbles: true }))
      command(frame, 'playVideo')
    }
  })

  for (const frame of frames) {
    // 플레이어에게 상태 변화를 보내달라고 알립니다. iframe 이 준비된 뒤여야 합니다.
    frame.addEventListener('load', () =>
      frame.contentWindow?.postMessage(
        JSON.stringify({ event: 'listening', id: 'kv', channel: 'widget' }),
        YT_ORIGIN,
      ),
    )
    setTimeout(() => reveal(frame), REVEAL_FALLBACK_MS)
  }
}
