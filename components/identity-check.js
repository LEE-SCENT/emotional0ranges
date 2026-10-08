/**
 * 본인 인증(휴대폰 본인확인)을 다시 받습니다.
 *
 *   <button data-identity-check>재인증</button>
 *
 *   import { initIdentityCheck } from './components/identity-check.js'
 *   initIdentityCheck()
 *
 * 본인 인증은 우리 화면에서 하지 않습니다. 본인확인 기관(NICE 평가정보)의 창이 따로 뜨고,
 * 통신사를 고르고 문자로 받은 번호를 넣는 일은 전부 그 창 안에서 일어납니다. 우리가 하는
 * 일은 그 창을 여는 것과, 끝났다는 소식을 받아 화면을 고치는 것 둘뿐입니다.
 *
 * 그래서 그 창을 흉내 내어 그리지 않습니다. 남의 서비스의 화면이고, 이름·주민번호·통신사를
 * 받는 자리라 비슷하게 생긴 것이 우리 주소에서 뜨면 안 됩니다.
 *
 * ⚠️ 지금은 그 창을 열 수 없습니다. 기관의 창은 서버가 만들어 준 암호화된 요청값이 있어야
 *    열립니다. 그 자리에 임시 창(identity-check.html)을 띄워, 창이 따로 뜨고 → 끝나면
 *    닫히고 → 원래 화면에 알림이 뜨는 흐름만 볼 수 있게 했습니다. 서버가 붙으면 open() 의
 *    주소와, 결과를 받는 길(지금은 postMessage)을 갈아 끼웁니다.
 */
import { showToast } from './toast.js?v=ccb77a07'

/** 기관의 창과 같은 크기입니다(휴대폰 본인확인 창의 관례). 폰에서는 새 탭으로 열립니다. */
const WINDOW = 'width=480,height=720,menubar=no,toolbar=no'

export function initIdentityCheck() {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-identity-check]')) return
    window.open('./identity-check.html', 'identity-check', WINDOW)
  })

  // 창이 끝났다고 알려오면 받습니다. 다른 곳에서 온 소식은 듣지 않습니다.
  addEventListener('message', (e) => {
    if (e.origin !== location.origin || e.data?.type !== 'identity-check:done') return
    showToast('본인 인증을 완료했어요', { icon: '#icon-check', tone: 'success' })
  })
}
