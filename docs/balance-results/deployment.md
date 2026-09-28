# 밸런스 개편 배포 확인

- 코드 커밋: `031acfcf82c78f9786a685326fc2a932c63b9b7d`.
- GitHub Pages 작업 `36406838893`: completed / success.
- 서버 백업: `/opt/egghunts/backups/balance-20260928T101047Z`. 이전 실행 파일과 정지 상태의 저장 데이터 압축본을 보존했다.
- 서버 `egghunts` 서비스 active, 배포 후 `/healthz`에서 `ready: true`.
- 로컬 배포 번들과 운영 `/opt/egghunts/host.mjs`의 SHA256 일치:
  `ed2b1346f94706954a2c7666c164619e8dcfdb18fd0b981a8d31189cdf5d1b49`.
- 실제 웹 주소 `https://juyounginpark.github.io/egghunts`에서 신규 게스트 접속, QA 훅 제외, 4개 트레일 이미지, 도감 3개 분류, 가로 넘침 없음을 확인했다. 확인 결과는 `checks.json`의 `production-ui`에 보존한다.
- 로컬 미리보기 주소의 연결 실패는 운영 CORS 사전 요청 403이었다. 허용 출처나 인증 보안을 완화하지 않았다.
- 배포 성공은 모든 밸런스 목표 달성과 다르다. 미달 항목은 [결과 보고서](../balance-overhaul-report.md)를 따른다.
