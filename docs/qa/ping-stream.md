# 실제 서버 핑 변동 후속 — 2026-09-24

## 원인과 변경

매 200ms 상태 갱신마다 새 HTTP Edge 호출, Auth 요청, REST 읽기, 시뮬레이션, REST commit을 수행했다. 다른 플레이어가 먼저 commit하면 같은 계산을 최대 5회 반복했다. 기존 기록에는 4회 반복과 782ms 응답이 있었다.

WebSocket으로 worker와 DB 연결을 유지한다. 메시지의 토큰을 Auth로 검증하며 검증 캐시는 기존대로 최대 10초/토큰 만료 이내다. 자원·좌표·소유권 계산은 기존 서버 엔진만 수행한다. 방 읽기부터 commit까지 단일 SQL 트랜잭션과 방별 advisory lock을 사용한다. 매칭 정원 변경만 전역 잠금을 사용한다. SQL 인자는 파라미터 바인딩한다.

트랜잭션만 직접 연결한 첫 실험은 매 HTTP 호출의 DB 연결 비용 때문에 382ms 중앙값으로 악화됐다. 따라서 HTTP fallback은 기존 REST 경로로 유지하고 지속 연결에서만 직접 DB를 사용한다. 실패/연결 만료 시 같은 요청 ID로 fallback하여 중복 획득을 방지한다. 110초 연결 교체와 5초 무인증 접속 제한을 적용한다.

구현 근거: [Supabase Edge Function의 Postgres 연결](https://supabase.com/docs/guides/functions/connect-to-postgres), [Postgres 연결 및 prepared statement 제한](https://supabase.com/docs/guides/database/connecting-to-postgres). 런타임 제공 `SUPABASE_DB_URL`을 서버에서만 사용하며 비밀 값을 코드/로그/클라이언트에 포함하지 않는다.

## 실제 측정

Windows headless Edge 390×844에서 실제 Supabase 게스트 세션을 사용했다. 실제 휴대폰 FPS 측정이 아니다. 실행 시점/방 구성/네트워크가 달라 동일 조건의 통계적 보장은 아니다.

| 실행 | 응답 중앙값 | P95 | 요청 오류 |
|---|---:|---:|---:|
| 수정 전 HTTP | 255.7ms | 359.1ms | 0 |
| 직접 트랜잭션 HTTP 실험 — 최종 HTTP 경로로 미채택 | 382.1ms | 527.6ms | 0 |
| WebSocket 포함 게임 이동 | 49.9ms | 162.3ms | 0 |
| 동일 방 실제 게스트 A | 57.8ms | 79.5ms | 연결 유지 |
| 동일 방 실제 게스트 B | 62.6ms | 95.2ms | 연결 유지 |

- 동일 방에서 두 게스트가 서로를 보는 것을 확인하고 동시에 이동했다.
- 소켓 강제 닫기 후 재연결 및 서버 시간 진행 확인.
- 상대 퇴장 후 peer 목록 제거까지 약 312ms.
- 위조 토큰의 WebSocket 상태 갱신은 401로 거부됨.
- 브라우저 예외 없음. 클라이언트 타입 검사 통과.
- B의 첫 측정 구간에는 최대 625.2ms가 있었다. 연결 초기화·인증 갱신·네트워크 이상 때의 순간 지연이 완전히 제거되었다고 주장하지 않는다.
- 5인 장시간 부하, 110초 수명 교체 장시간 검사, 휴대폰/토스 실기기는 미실행이다.

자료: `artifacts/performance/live-movement-ping-before.json`, `live-movement-ping-transaction.json`, `live-movement-ping-stream.json`, `live-room-stream.json`. 원본에는 인증 토큰을 기록하지 않는다. 수동 재현 명령: `node scripts/qa/live-movement.mjs ping-stream`, `node scripts/qa/live-room-stream.mjs`.
