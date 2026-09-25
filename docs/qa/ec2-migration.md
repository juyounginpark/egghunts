# 서울 EC2 게임 서버 이전 — 2026-09-25

## 구성

- EC2 `i-0db140f3108b5901c`, 서울, t3.micro, Amazon Linux 2023.
- 임시 HTTPS: `https://egghunts.54-180-115-11.sslip.io/game`. 자동 할당 IP이므로 인스턴스를 중지 후 시작하면 IP가 바뀔 수 있다. 이때 DNS 이름·인증서·Pages 환경 변수를 함께 변경해야 한다.
- Node.js 24 + ws, nginx TLS, systemd 단일 프로세스. CPUQuota=80%(한 vCPU 기준), MemoryMax=550M, V8 heap=384MB. 자동 증설 없음.
- 인증은 Supabase Auth 유지. 기존 game_profiles의 ID/보유/성장/알 데이터를 첫 접속 때 읽는다. 클라이언트 저장 데이터나 좌표를 신뢰하지 않는다.
- `server/room-engine.ts`를 공통으로 사용한다. 요청의 입력·명령을 서버 시간으로 시뮬레이션한다. 매 업데이트에 원격 DB 읽기/잠금/쓰기를 기다리지 않는다.
- 방을 메모리에 두고, 응답 전 로컬 SQLite WAL(FULL) 트랜잭션에 방과 개인 상태·중복 명령 영수증을 저장한다. Supabase 체크포인트는 5초 주기, 단조 증가 revision으로 재시도를 처리한다.
- 로컬 디스크 손실 시 클라우드에 아직 반영되지 않은 진행은 잃을 수 있다. DB 장애 중 무제한 누적을 막기 위해 정상 클라우드 확인이 60초 이상 끊기면 새 게임 요청을 차단한다.
- `game_backend` 소유자를 EC2로 전환하면 DB 트리거가 옛 Edge의 방/보유 기록 쓰기를 차단한다. 새 호스트와 옛 호스트로 같은 계정의 재화를 동시에 변경할 수 없다.
- 클라이언트 `VITE_GAME_SERVER_URL`은 join/update/leave/HTTP fallback/WS 모두 동일하다. EC2 연결에서는 15초마다 소켓을 교체하던 Edge 우회 동작을 사용하지 않는다.

## 봇·비용 제한

- 최대 4개 방, 방당 5명. 게임 소켓 최대 40개, 전체 TCP 연결 128개.
- nginx IP당 연결 12개, HTTP 요청/접속 빈도 제한. 본체 포트 4330은 loopback에만 바인딩한다.
- 인증 조회 동시 4개/초당 4개(초기 burst 20), 검증 결과 10초 이내 캐시와 실패 캐시. 토큰의 user/만료는 Supabase 검증 이후만 사용한다.
- 사용자당 초당 20개 요청(burst 30), 전역/IP별 메시지 상한, 12KB 입력 제한, 5초 미인증 연결 종료, 느린 수신자의 출력 버퍼 256KiB 상한.
- 기본 월 10GiB **애플리케이션 게임 응답 payload** 상한. 5초마다 계량 저장. TLS/헤더/인증/DB/OS/공격 트래픽 등 AWS 청구 전체를 측정하거나 차단하는 장치가 아니다.
- 새 계정 생성은 Supabase 경로다. CAPTCHA 설정은 아직 적용하지 않았으며, 이러한 속도 제한을 사람/봇 식별 완료로 보고하지 않는다.
- EC2 T3 CPU Unlimited → Standard 변경은 사용자가 콘솔에서 해야 하며 완료 확인이 필요하다. Standard는 추가 CPU 크레딧 과금 대신 잔량 소진 시 CPU 성능이 낮아질 수 있다.
- AWS Budgets는 알림 지연이 있어 절대 과금 상한이 아니다. AWS Billing 접근 권한이 없어 예산 알림은 설정하지 않았다. 시드니 인스턴스의 중지/삭제도 수행하지 않았다.

## 배포와 운영

1. `node scripts/build-ec2.mjs`로 배포 번들 생성. 서버에서는 npm install/build 하지 않는다.
2. `server/deploy/` 파일과 번들을 SSH로 업로드. 비밀키는 `/etc/egghunts.env`(root 0600)에만 배치하고 커밋하지 않는다.
3. `install.sh`는 최초 설치용이다. nginx 인증서 발급 후 이를 다시 실행하면 Certbot 수정 설정을 덮어쓰므로, 이후에는 host.mjs와 systemd 파일만 교체한다.
4. 서버 데이터는 `/var/lib/egghunts/game.sqlite`와 `-wal`/`-shm`. 배포할 때 삭제하지 않는다. 새 디스크에서 owner를 재생성해 임의로 운영하지 않는다.
5. 마이그레이션 `202609250002_ec2_backend.sql`은 기본값 edge. HTTPS 준비 후 서버에서 `sudo node --env-file=/etc/egghunts.env activate.mjs`로 단일 소유자 전환.
6. 클라이언트 Pages 빌드 환경에 새 HTTPS /game 주소를 넣는다. Supabase 인증 redirect는 기존 게임 페이지 유지.
7. HTTPS는 Certbot + certbot-renew.timer로 하루 두 번 갱신 확인. 진입점 /healthz는 프로세스, /readyz는 활성 소유권·저장 연결·전송 한도를 구분한다.
8. 롤백은 EC2 신규 요청을 멈추고 미반영 체크포인트를 모두 올린 뒤 진행한다. 남아 있는 Edge 방 상태가 최신 프로필을 덮어쓰지 않도록 기존 game_members/game_rooms 처리 계획도 필요하다. 단순 URL/모드 원복 금지.

## 확인 범위

- 배포 번들 생성 성공, EC2 프로세스 실행, nginx 구성 적용, 공개 HTTPS 인증서 확인.
- 격리 `scripts/qa/ec2-host.mjs`: 5인 정원, 공유 알, 초과 정원 거부, sections 스트림, 위조 인증 실패 캐시, 퇴장, 비동기 체크포인트, 프로세스 재시작 후 저장 복구 통과.
- 실제 EC2 소켓 진단은 `scripts/qa/ec2-live.mjs`, 결과 `artifacts/performance/ec2-live.json`. 실기기/브라우저 렌더링 FPS, 20명 부하, 장시간 이동 시험과 구분한다.
- 공개 HTTPS/WS 2인 × 180회: 중앙값 26.6/24.1ms, P95 56.8/54.4ms, 최대 161.9/148.4ms, 서버 내부 P95 8.7/9.7ms. 약 40초 동안 두 연결이 유지되고 모든 업데이트가 200이었다. 진단 계정은 퇴장·체크포인트 대기 후 삭제했다. 과거 Edge 측정과 동시 조건의 A/B 시험은 아니다.
- 운영 소유권을 EC2로 전환했고 /readyz=true를 확인했다. 게임 프런트는 GitHub Pages 배포로 주소를 반영한다.
- AWS Standard/예산 알림/시드니 정리 및 Supabase CAPTCHA는 미확인·미적용.
