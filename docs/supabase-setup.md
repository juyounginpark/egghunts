# Supabase 연결

## 로그인 링크 복구 (2026-09-24)

SMTP 미설정 상태에서는 기본 이메일 로그인 링크를 사용한다. 코드 전용 안내를 제거하고 SDK URL 세션 감지를 활성화했다. Site URL·허용 리다이렉트·메일 요청의 redirect는 모두 `https://juyounginpark.github.io/egghunts/`로 통일한다. 코드 템플릿 설정은 기본 config에서 빼서 무료 발송기 정책으로 URL 변경까지 함께 거부되지 않게 한다. 코드 입력은 메일에 실제 코드가 있을 때만 펼쳐 사용한다. 기존 메일은 이미 사용됐거나 오래된 주소가 담겼을 수 있으므로 수정 후 새 메일을 받는다. 실제 메일 발송과 브라우저 로그인은 자동 테스트하지 않았다.

SMTP 연결 후 코드 방식으로 전환할 때는 아래를 config에 추가하고 `supabase config diff`로 검토한 뒤 push한다.

```toml
[auth.email.template.magic_link]
subject = "알콩 원정대 로그인 인증 코드"
content_path = "./supabase/templates/magic_link.html"
```

프로젝트: `leblcdiqsyxqzwlsnkio` · 웹 주소: `https://juyounginpark.github.io/egghunts/`

공개 URL과 Publishable key는 앱에 연결했다. 공개 키는 관리자 권한이 없으므로 아래 서버 적용이 완료되어야 방 찾기가 동작한다. 서버 비밀키를 Vite 환경변수나 Git에 넣지 않는다.

2026-09-24 적용 기록: 프로젝트 연결, `202609240001_rooms.sql` 원격 적용, `game` Edge Function 배포 완료. 인증 템플릿 config push는 기본 발송기를 쓰는 무료 프로젝트의 정책으로 HTTP 400 거부됨. 사용자는 아직 SMTP 서비스가 없다고 확인했다. 일반 사용자 이메일 인증과 토스 실기기·5명 동시 접속은 미확인 상태다.

## 서버 적용

프로젝트 폴더의 PowerShell에서 실행한다. 로그인은 계정 소유자가 브라우저에서 완료한다.

```powershell
npx supabase login
npx supabase link --project-ref leblcdiqsyxqzwlsnkio
npx supabase db push
npm run server:bundle
npx supabase functions deploy game --project-ref leblcdiqsyxqzwlsnkio
```

DB 비밀번호를 요청하면 자신의 터미널에 입력한다. CLI 연결이 어려우면 SQL Editor에서 `supabase/migrations/202609240001_rooms.sql`을 실행할 수 있다. 기존 테이블이 있는 프로젝트에 반복해서 수동 적용하지 않는다.

`game`은 publishable key 호환을 위해 gateway JWT 검사를 끄고, 함수 안에서 Auth `/user`로 매번 로그인 토큰을 검증한다. 이를 제거하면 안 된다. 기본 제공 `SUPABASE_SERVICE_ROLE_KEY`는 Edge Function 안에서만 사용한다.

## 이메일 인증

Authentication → Email Templates → Magic Link 본문에 다음을 설정한다. 링크 대신 인증 코드를 입력하는 UI다.

```html
<h2>알콩 원정대 로그인</h2>
<p>인증 코드: <strong>{{ .Token }}</strong></p>
<p>직접 요청한 경우에만 게임에 입력해 주세요.</p>
```

Authentication → SMTP Settings에서 발송 업체를 연결한다. Supabase 기본 발송은 팀 계정 주소에 제한되므로 일반 사용자 이메일 로그인에는 사용자 SMTP가 필요하다. SMTP 비밀번호도 대시보드에만 입력한다.

Authentication → URL Configuration의 Site URL은 게임 웹 주소로 설정한다. 토스 출시는 실제 미니앱 origin을 `GAME_ALLOWED_ORIGINS`에 추가해야 한다. 현재 함수는 GitHub Pages와 로컬 4317/4320 origin만 허용한다. `*`로 바꾸지 않는다.

## 저장 및 방 규칙

- 이메일 인증 → 방 찾기 → 가장 많이 찬 빈자리 있는 방. 최대 5명, 개인 농장 슬롯 0~4. 방 코드 입력 없음.
- 방별 서버 난수로 알을 생성한다. 동일한 방의 공유 월드, 보스, 밤 주기를 사용한다.
- 서버가 이동 입력을 적분하고 획득 거리·준비 시간·소유권·보유량·쿨다운을 계산한다. 클라이언트 좌표·재화·저장 파일은 수신하지 않는다.
- 방 revision 비교와 트랜잭션으로 월드와 개인 저장을 함께 갱신한다. 경쟁 요청은 최신 상태를 다시 읽어 계산한다. 동일 요청 ID의 재전송은 중복 보상으로 처리하지 않는다.
- RLS 활성화, anon/authenticated 직접 읽기·쓰기 및 관리 RPC 실행 거부. 함수 응답에는 자신의 전체 저장과 다른 참가자의 공개 외형·전시 펫만 포함한다.
- 기존 기기 저장은 원래 키에 보존한다. 검증되지 않은 로컬 재화는 서버 계정으로 자동 이관하지 않는다. 로컬 설정만 별도 보존한다.
- 기지에서는 성장과 무관하게 기본 속도 1.6. 개인 운동 버튼은 본인 슬롯의 기구로 이동한다. 펫·트레일 장착·판매·강화는 로그인 계정의 저장만 변경한다.
- 응답이 없으면 입력은 500ms 후 중단된다. 회원 예약은 60초 후 해제할 수 있다. 재접속 시 서버 개인 저장으로 돌아온다.
- 가상 광고는 기존 테스트 기능이다. 서버는 최소 대기 시간과 중복 지급만 검사하며 실제 광고 시청을 검증하지 않는다.

## 운영 한계와 수동 확인

현재 전송은 200ms 간격 HTTPS 요청과 서버 상태 보정이다. 대규모 동시접속 운영 전에는 Edge 호출량·DB 부하·지역 지연을 측정하고 전용 게임 서버 또는 실시간 전송을 검토한다. 5명 동시 접속이나 실기기 토스 동작을 확인했다고 간주하지 않는다.

요청받았을 때만 수동 실행: 서로 다른 6개 계정으로 5+1 배정, 동시 알 획득 1명만 성공, 개인 저장 재로그인, 타 계정 자산 변경 거부, 날조한 좌표·재화 요청 거부, 야간 리셋, 연결 끊김과 재전송, 각 농장 운동 버튼, 모바일 가독성. 기존 자동 QA는 자동 실행하지 않는다.

공식 문서: [이메일 OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [함수 배포](https://supabase.com/docs/guides/functions/deploy).
