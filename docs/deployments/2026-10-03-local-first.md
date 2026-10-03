# 로컬 AI / 친구 방 운영 전환 (2026-10-03)

- 원본 기능 커밋: `4263feb`, `3fbd971`.
- Supabase `202610030001_local_first.sql` 적용 완료. 기존 테이블은 보존했다.
- EC2: `https://egghunts.54-180-115-11.sslip.io/presence`, 서비스 `egghunts-friends`.
- SQLite 56개 profile 중 인증 계정이 존재하는 54개를 `game_local_profiles`로 이전했다. 삭제된 인증 계정 2개의 기록은 SQLite 백업에 보존했다.
- 백업: `/opt/egghunts/backups/local-first-20261003T094335Z`. 기존 번들·환경·systemd·TLS nginx 설정, 일관된 SQLite 복사본, 기존 cloud/local profile JSON을 포함한다. root 전용이다.
- 첫 이전 시 삭제 계정의 FK 제약으로 거부돼 기존 서버로 자동 복구했다. 인증 계정을 확인해 분리한 뒤 전환했다.
- 운영 서비스는 SQLite 게임 저장이나 service-role 키를 사용하지 않는다. 백업에는 기존 복구용 설정을 보관한다.
- nginx는 기존 TLS 인증서를 유지하고 `/presence`를 중계한다. `/game`은 더 이상 게임 상태를 처리하지 않으므로 기존 페이지는 새로고침해야 한다.
- loopback nginx가 덮어쓴 `X-Real-IP`만 신뢰해 접속 제한을 실제 IP별로 적용한다.
- CPU 80%, 메모리 550MiB 및 기존 nginx IP별 제한 유지. 최대 60개 친구 방 설정은 실제 동시 접속 수용 보장이 아니다.
- 월 10GiB WebSocket payload 상한 유지. 기존 월 사용량을 `/var/lib/egghunts/presence-transfer.json`으로 이전했으며 5초마다 저장한다. AWS 전체 청구 상한은 아니다.

## 운영 확인

실제 공개 HTTPS 준비 상태, Supabase 익명 인증, cloud save/load, stale revision 충돌 거부, 방 코드 생성·두 사용자 입장, 위치·이모티콘 전달, human host 퇴장 후 인계를 확인했다. 확인용 계정은 일반 사용자 세이브와 분리했다.

공개 Pages 배포 상태는 운영 전환 후 아래에 기록한다. 전체 QA를 재실행하지 않았으며 구현 단계의 검증 결과와 알려진 기존 테스트 실패는 [기능 보고](../simulated-players-architecture.md)를 따른다.

## 복구 주의

`server/deploy/cutover-local-first.sh`는 교체 실패 시 번들·환경·nginx·서비스를 복구한다. 기존 데이터는 삭제하지 않는다.
공개 페이지 전환 뒤에는 로컬/새 cloud 세이브가 더 최신일 수 있으므로 과거 SQLite를 그대로 authoritative writer로 되돌리지 않는다. 새 저장의 별도 백업과 역방향 이전 계획이 먼저 필요하다.
