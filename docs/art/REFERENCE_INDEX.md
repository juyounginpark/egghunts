# 공식 아트 레퍼런스 색인

사용자가 지정한 [공식 스타일](STYLE_GUIDE.md) → 같은 스테이지 기준 → [신규별 760개 연결](expansion-style-references.json) → [개별 제작 지시](expansion-style-prompt.md) 순서로 읽는다. R 번호는 문서 번호이며 아래 실제 ID로 변환한다.

## 자료와 역할

| 상태 | 실제 경로 | 종류·역할 | 지정 근거 / 계승 범위 |
| --- | --- | --- | --- |
| 공식 | [STYLE_GUIDE.md](STYLE_GUIDE.md) | 공통 스타일 문서 | 이번 사용자 지정. 조형·점눈·색면·큰 파츠 |
| 공식 | [voxel-art-rework-220-characters.md](voxel-art-rework-220-characters.md) | 원본 설계 문서 | 기존 사용자 지정 기록 document-rework-report.md. 과거 전체 리워크 명령은 재실행하지 않음 |
| 공식 | [expansion-style-prompt.md](expansion-style-prompt.md) | 380종 참조·설계 문서 | 이번 사용자 지정. ID·이름·수치를 유지하며 시각 표현 수정 |
| 구현 기준 | ../../src/voxel.ts / ../../src/diorama-material.ts | 메시 병합·재질 | 현재 실행 코드. 전역 변경 없이 신규 모델에서 계승 |
| 비교 조건 | ../../scripts/qa/expansion-art.html | 중립 카메라·조명·배경 | Orthographic, hemisphere 2.5, directional 2.6, 256px. 자체 검수 조건이며 실제 UI 해상도와 구분 |
| 후보/이력 | stage-gallery.html 및 과거 artifacts 이미지 | 이전 제작 결과 | 현재 공식 기준으로 자동 편입하지 않음 |

## 확인된 원본 모델

아래 모델은 현재 카탈로그의 stageId/slot과 기존 document-id-map.md를 교차 연결한 구현 기준이다. 형태 참조에서는 큰 면·눈·연결 두께만, 소재 참조에서는 명도 분리·광택 범위만 계승하고 생물·소품·팔레트는 복사하지 않는다. 모델 파일의 SHA-256, 측정 단위, 눈 높이, 파트 수는 JSON에 기록한다. 변경 기준 커밋: 338d48d.

| 문서 참조 | 실제 ID | 현재 이름 | 모델 경로 | 단위 |
| --- | ---: | --- | --- | ---: |
| R01-01 | 100 | 새싹이 | [public/models/pet-100.json](../../public/models/pet-100.json) | 21.6 |
| R01-02 | 101 | 클로버 토끼 | [public/models/pet-101.json](../../public/models/pet-101.json) | 21.6 |
| R01-03 | 102 | 민들레 병아리 | [public/models/pet-102.json](../../public/models/pet-102.json) | 21.6 |
| R01-04 | 103 | 딸기쥐 | [public/models/pet-103.json](../../public/models/pet-103.json) | 21.6 |
| R01-05 | 104 | 도토리 거북 | [public/models/pet-104.json](../../public/models/pet-104.json) | 21.6 |
| R01-06 | 105 | 바람개비 병아리 | [public/models/pet-105.json](../../public/models/pet-105.json) | 21.6 |
| R01-07 | 106 | 꿀단지 곰 | [public/models/pet-106.json](../../public/models/pet-106.json) | 21.6 |
| R01-08 | 107 | 꽃갈기 사자 | [public/models/pet-107.json](../../public/models/pet-107.json) | 21.6 |
| R01-09 | 108 | 무지개 나비 | [public/models/pet-108.json](../../public/models/pet-108.json) | 21.6 |
| R01-10 | 109 | 사계절 사슴 | [public/models/pet-109.json](../../public/models/pet-109.json) | 21.6 |
| R02-01 | 110 | 단추곰 | [public/models/pet-110.json](../../public/models/pet-110.json) | 21.6 |
| R02-02 | 111 | 태엽오리 | [public/models/pet-111.json](../../public/models/pet-111.json) | 21.6 |
| R02-03 | 112 | 목마 조랑말 | [public/models/pet-112.json](../../public/models/pet-112.json) | 21.6 |
| R02-04 | 113 | 블록코끼리 | [public/models/pet-113.json](../../public/models/pet-113.json) | 21.6 |
| R02-05 | 114 | 구슬고양이 | [public/models/pet-114.json](../../public/models/pet-114.json) | 21.6 |
| R02-06 | 115 | 종이배 펭귄 | [public/models/pet-115.json](../../public/models/pet-115.json) | 21.6 |
| R02-07 | 116 | 깜짝상자 토끼 | [public/models/pet-116.json](../../public/models/pet-116.json) | 21.6 |
| R02-08 | 117 | 양말뱀 | [public/models/pet-117.json](../../public/models/pet-117.json) | 21.6 |
| R02-09 | 118 | 오르골 백조 | [public/models/pet-118.json](../../public/models/pet-118.json) | 21.6 |
| R02-10 | 119 | 풍선강아지 | [public/models/pet-119.json](../../public/models/pet-119.json) | 21.6 |
| R03-01 | 120 | 물방울 물개 | [public/models/pet-120.json](../../public/models/pet-120.json) | 21.6 |
| R03-02 | 121 | 소라게 | [public/models/pet-121.json](../../public/models/pet-121.json) | 21.6 |
| R03-03 | 122 | 진주조개 | [public/models/pet-122.json](../../public/models/pet-122.json) | 21.6 |
| R03-04 | 123 | 리본해마 | [public/models/pet-123.json](../../public/models/pet-123.json) | 21.6 |
| R03-05 | 124 | 파도 가오리 | [public/models/pet-124.json](../../public/models/pet-124.json) | 21.6 |
| R03-06 | 125 | 산호거북 | [public/models/pet-125.json](../../public/models/pet-125.json) | 21.6 |
| R03-07 | 126 | 별빛해파리 | [public/models/pet-126.json](../../public/models/pet-126.json) | 21.6 |
| R03-08 | 127 | 노을 돌고래 | [public/models/pet-127.json](../../public/models/pet-127.json) | 21.6 |
| R03-10 | 129 | 산호용 | [public/models/pet-129.json](../../public/models/pet-129.json) | 21.6 |
| R04-01 | 130 | 숯병아리 | [public/models/pet-130.json](../../public/models/pet-130.json) | 21.6 |
| R04-02 | 131 | 불씨도마뱀 | [public/models/pet-131.json](../../public/models/pet-131.json) | 21.6 |
| R04-03 | 132 | 화로거북 | [public/models/pet-132.json](../../public/models/pet-132.json) | 21.6 |
| R04-04 | 133 | 잿빛박쥐 | [public/models/pet-133.json](../../public/models/pet-133.json) | 21.6 |
| R04-05 | 134 | 유황산양 | [public/models/pet-134.json](../../public/models/pet-134.json) | 21.6 |
| R04-06 | 135 | 용암달팽이 | [public/models/pet-135.json](../../public/models/pet-135.json) | 21.6 |
| R04-07 | 136 | 흑요석 전갈 | [public/models/pet-136.json](../../public/models/pet-136.json) | 21.6 |
| R04-08 | 137 | 분화구 멧돼지 | [public/models/pet-137.json](../../public/models/pet-137.json) | 21.6 |
| R04-09 | 138 | 모루두더지 | [public/models/pet-138.json](../../public/models/pet-138.json) | 21.6 |
| R04-10 | 139 | 잿불공작 | [public/models/pet-139.json](../../public/models/pet-139.json) | 21.6 |
| R05-01 | 150 | 분필유령 | [public/models/pet-150.json](../../public/models/pet-150.json) | 21.6 |
| R05-02 | 151 | 지우개 햄스터 | [public/models/pet-151.json](../../public/models/pet-151.json) | 21.6 |
| R05-03 | 152 | 연필고슴도치 | [public/models/pet-152.json](../../public/models/pet-152.json) | 21.6 |
| R05-04 | 153 | 잉크문어 | [public/models/pet-153.json](../../public/models/pet-153.json) | 21.6 |
| R05-05 | 154 | 책가방 거북 | [public/models/pet-154.json](../../public/models/pet-154.json) | 21.6 |
| R05-06 | 155 | 종이학 | [public/models/pet-155.json](../../public/models/pet-155.json) | 21.6 |
| R05-07 | 156 | 칠판고양이 | [public/models/pet-156.json](../../public/models/pet-156.json) | 21.6 |
| R05-08 | 157 | 종소리 부엉이 | [public/models/pet-157.json](../../public/models/pet-157.json) | 21.6 |
| R05-09 | 158 | 커튼박쥐 | [public/models/pet-158.json](../../public/models/pet-158.json) | 21.6 |
| R05-10 | 159 | 그림자 사슴 | [public/models/pet-159.json](../../public/models/pet-159.json) | 21.6 |
| R06-01 | 160 | 안테나 토끼 | [public/models/pet-160.json](../../public/models/pet-160.json) | 21.6 |
| R06-02 | 161 | 배터리 햄스터 | [public/models/pet-161.json](../../public/models/pet-161.json) | 21.6 |
| R06-03 | 162 | 택배너구리 | [public/models/pet-162.json](../../public/models/pet-162.json) | 21.6 |
| R06-04 | 163 | 스케이트 도마뱀 | [public/models/pet-163.json](../../public/models/pet-163.json) | 21.6 |
| R06-05 | 164 | 헤드폰 고양이 | [public/models/pet-164.json](../../public/models/pet-164.json) | 21.6 |
| R06-06 | 165 | 신호등 부엉이 | [public/models/pet-165.json](../../public/models/pet-165.json) | 21.6 |
| R06-07 | 166 | 홀로그램 잉어 | [public/models/pet-166.json](../../public/models/pet-166.json) | 21.6 |
| R06-08 | 167 | 케이블 뱀 | [public/models/pet-167.json](../../public/models/pet-167.json) | 21.6 |
| R06-09 | 168 | 드론가오리 | [public/models/pet-168.json](../../public/models/pet-168.json) | 21.6 |
| R07-01 | 170 | 모래여우 | [public/models/pet-170.json](../../public/models/pet-170.json) | 21.6 |
| R07-02 | 171 | 물병낙타 | [public/models/pet-171.json](../../public/models/pet-171.json) | 21.6 |
| R07-03 | 172 | 선인장 고슴도치 | [public/models/pet-172.json](../../public/models/pet-172.json) | 21.6 |
| R07-04 | 173 | 모래두더지 | [public/models/pet-173.json](../../public/models/pet-173.json) | 21.6 |
| R07-05 | 174 | 청금석 풍뎅이 | [public/models/pet-174.json](../../public/models/pet-174.json) | 21.6 |
| R07-06 | 175 | 항아리 코브라 | [public/models/pet-175.json](../../public/models/pet-175.json) | 21.6 |
| R07-07 | 176 | 붕대고양이 | [public/models/pet-176.json](../../public/models/pet-176.json) | 21.6 |
| R07-08 | 177 | 보석전갈 | [public/models/pet-177.json](../../public/models/pet-177.json) | 21.6 |
| R07-09 | 178 | 해시계 매 | [public/models/pet-178.json](../../public/models/pet-178.json) | 21.6 |
| R07-10 | 179 | 작은 스핑크스 | [public/models/pet-179.json](../../public/models/pet-179.json) | 21.6 |
| R08-01 | 180 | 알껍질 공룡 | [public/models/pet-180.json](../../public/models/pet-180.json) | 21.6 |
| R08-02 | 181 | 양치 트리케라 | [public/models/pet-181.json](../../public/models/pet-181.json) | 21.6 |
| R08-03 | 182 | 꽃등 스테고 | [public/models/pet-182.json](../../public/models/pet-182.json) | 21.6 |
| R08-04 | 183 | 깃털 랩터 | [public/models/pet-183.json](../../public/models/pet-183.json) | 21.6 |
| R08-05 | 184 | 조약돌 안킬로 | [public/models/pet-184.json](../../public/models/pet-184.json) | 21.6 |
| R08-06 | 185 | 물수제비 수장룡 | [public/models/pet-185.json](../../public/models/pet-185.json) | 21.6 |
| R08-07 | 186 | 과일 익룡 | [public/models/pet-186.json](../../public/models/pet-186.json) | 21.6 |
| R08-08 | 187 | 나팔 볏공룡 | [public/models/pet-187.json](../../public/models/pet-187.json) | 21.6 |
| R08-09 | 188 | 이끼 긴목공룡 | [public/models/pet-188.json](../../public/models/pet-188.json) | 21.6 |
| R08-10 | 189 | 호박빛 티라노 | [public/models/pet-189.json](../../public/models/pet-189.json) | 21.6 |
| R09-01 | 190 | 달떡토끼 | [public/models/pet-190.json](../../public/models/pet-190.json) | 21.6 |
| R09-02 | 191 | 복주머니 참새 | [public/models/pet-191.json](../../public/models/pet-191.json) | 21.6 |
| R09-03 | 192 | 초롱반딧불 | [public/models/pet-192.json](../../public/models/pet-192.json) | 21.6 |
| R09-04 | 193 | 짚신너구리 | [public/models/pet-193.json](../../public/models/pet-193.json) | 21.6 |
| R09-05 | 194 | 장승곰 | [public/models/pet-194.json](../../public/models/pet-194.json) | 21.6 |
| R09-06 | 195 | 보자기 박쥐 | [public/models/pet-195.json](../../public/models/pet-195.json) | 21.6 |
| R09-07 | 196 | 도깨비 방망이 | [public/models/pet-196.json](../../public/models/pet-196.json) | 21.6 |
| R09-08 | 197 | 청자두꺼비 | [public/models/pet-197.json](../../public/models/pet-197.json) | 21.6 |
| R09-09 | 198 | 달무늬 호랑이 | [public/models/pet-198.json](../../public/models/pet-198.json) | 21.6 |
| R09-10 | 199 | 은빛 구미호 | [public/models/pet-199.json](../../public/models/pet-199.json) | 21.6 |
| R10-01 | 200 | 올리브 거북 | [public/models/pet-200.json](../../public/models/pet-200.json) | 21.6 |
| R10-02 | 201 | 구름양 | [public/models/pet-201.json](../../public/models/pet-201.json) | 21.6 |
| R10-03 | 202 | 포도멧돼지 | [public/models/pet-202.json](../../public/models/pet-202.json) | 21.6 |
| R10-04 | 203 | 두루마리 부엉이 | [public/models/pet-203.json](../../public/models/pet-203.json) | 21.6 |
| R10-05 | 204 | 날개샌들 강아지 | [public/models/pet-204.json](../../public/models/pet-204.json) | 21.6 |
| R10-06 | 205 | 물항아리 수달 | [public/models/pet-205.json](../../public/models/pet-205.json) | 21.6 |
| R10-07 | 206 | 월계관 사자 | [public/models/pet-206.json](../../public/models/pet-206.json) | 21.6 |
| R10-08 | 207 | 번개독수리 | [public/models/pet-207.json](../../public/models/pet-207.json) | 21.6 |
| R10-09 | 208 | 대리석 그리핀 | [public/models/pet-208.json](../../public/models/pet-208.json) | 21.6 |
| R10-10 | 209 | 새벽 페가수스 | [public/models/pet-209.json](../../public/models/pet-209.json) | 21.6 |
| R11-01 | 210 | 안테나 슬라임 | [public/models/pet-210.json](../../public/models/pet-210.json) | 21.6 |
| R11-02 | 211 | 세눈 도마뱀 | [public/models/pet-211.json](../../public/models/pet-211.json) | 21.6 |
| R11-03 | 212 | 원반문어 | [public/models/pet-212.json](../../public/models/pet-212.json) | 21.6 |
| R11-04 | 213 | 수정달팽이 | [public/models/pet-213.json](../../public/models/pet-213.json) | 21.6 |
| R11-05 | 214 | 흡착개구리 | [public/models/pet-214.json](../../public/models/pet-214.json) | 21.6 |
| R11-06 | 215 | 촉수토끼 | [public/models/pet-215.json](../../public/models/pet-215.json) | 21.6 |
| R11-07 | 216 | 부유해파리 | [public/models/pet-216.json](../../public/models/pet-216.json) | 21.6 |
| R11-08 | 217 | 실험복 족제비 | [public/models/pet-217.json](../../public/models/pet-217.json) | 21.6 |
| R11-09 | 218 | 중력두꺼비 | [public/models/pet-218.json](../../public/models/pet-218.json) | 21.6 |
| R11-10 | 219 | 별꽃 사마귀 | [public/models/pet-219.json](../../public/models/pet-219.json) | 21.6 |
| R12-01 | 220 | 태엽생쥐 | [public/models/pet-220.json](../../public/models/pet-220.json) | 21.6 |
| R12-02 | 221 | 비행모 강아지 | [public/models/pet-221.json](../../public/models/pet-221.json) | 21.6 |
| R12-03 | 222 | 찻주전자 코끼리 | [public/models/pet-222.json](../../public/models/pet-222.json) | 21.6 |
| R12-04 | 223 | 프로펠러 참새 | [public/models/pet-223.json](../../public/models/pet-223.json) | 21.6 |
| R12-05 | 224 | 나침반 거북 | [public/models/pet-224.json](../../public/models/pet-224.json) | 21.6 |
| R12-06 | 225 | 톱니여우 | [public/models/pet-225.json](../../public/models/pet-225.json) | 21.6 |
| R12-07 | 226 | 풍선고래 | [public/models/pet-226.json](../../public/models/pet-226.json) | 21.6 |
| R12-08 | 227 | 기관차 멧돼지 | [public/models/pet-227.json](../../public/models/pet-227.json) | 21.6 |
| R12-09 | 228 | 망원경 기린 | [public/models/pet-228.json](../../public/models/pet-228.json) | 21.6 |
| R12-10 | 229 | 시계부엉이 | [public/models/pet-229.json](../../public/models/pet-229.json) | 21.6 |
| R13-01 | 230 | 눈송이 물범 | [public/models/pet-230.json](../../public/models/pet-230.json) | 21.6 |
| R13-02 | 231 | 목도리 펭귄 | [public/models/pet-231.json](../../public/models/pet-231.json) | 21.6 |
| R13-03 | 232 | 유리빙어 | [public/models/pet-232.json](../../public/models/pet-232.json) | 21.6 |
| R13-04 | 233 | 서리토끼 | [public/models/pet-233.json](../../public/models/pet-233.json) | 21.6 |
| R13-05 | 234 | 얼음게 | [public/models/pet-234.json](../../public/models/pet-234.json) | 21.6 |
| R13-06 | 235 | 고드름 일각고래 | [public/models/pet-235.json](../../public/models/pet-235.json) | 21.6 |
| R13-07 | 236 | 설산 산양 | [public/models/pet-236.json](../../public/models/pet-236.json) | 21.6 |
| R13-08 | 237 | 털북숭이 매머드 | [public/models/pet-237.json](../../public/models/pet-237.json) | 21.6 |
| R13-09 | 238 | 오로라 여우 | [public/models/pet-238.json](../../public/models/pet-238.json) | 21.6 |
| R13-10 | 239 | 눈꽃부엉이 | [public/models/pet-239.json](../../public/models/pet-239.json) | 21.6 |
| R14-01 | 240 | 베개강아지 | [public/models/pet-240.json](../../public/models/pet-240.json) | 21.6 |
| R14-02 | 241 | 꿈풍선 코끼리 | [public/models/pet-241.json](../../public/models/pet-241.json) | 21.6 |
| R14-03 | 242 | 초승달 해마 | [public/models/pet-242.json](../../public/models/pet-242.json) | 21.6 |
| R14-04 | 243 | 우산해파리 | [public/models/pet-243.json](../../public/models/pet-243.json) | 21.6 |
| R14-05 | 244 | 찻잔고양이 | [public/models/pet-244.json](../../public/models/pet-244.json) | 21.6 |
| R14-06 | 245 | 양말물고기 | [public/models/pet-245.json](../../public/models/pet-245.json) | 21.6 |
| R14-07 | 246 | 구름기린 | [public/models/pet-246.json](../../public/models/pet-246.json) | 21.6 |
| R14-08 | 247 | 거울백조 | [public/models/pet-247.json](../../public/models/pet-247.json) | 21.6 |
| R14-09 | 248 | 별사탕 고슴도치 | [public/models/pet-248.json](../../public/models/pet-248.json) | 21.6 |
| R14-10 | 249 | 밤하늘 양 | [public/models/pet-249.json](../../public/models/pet-249.json) | 21.6 |
| R15-01 | 250 | 새싹들쥐 | [public/models/pet-250.json](../../public/models/pet-250.json) | 21.6 |
| R15-02 | 251 | 철통두꺼비 | [public/models/pet-251.json](../../public/models/pet-251.json) | 21.6 |
| R15-03 | 252 | 방독면 너구리 | [public/models/pet-252.json](../../public/models/pet-252.json) | 21.6 |
| R15-04 | 253 | 유리버섯 달팽이 | [public/models/pet-253.json](../../public/models/pet-253.json) | 21.6 |
| R15-05 | 254 | 쌍꼬리 도마뱀 | [public/models/pet-254.json](../../public/models/pet-254.json) | 21.6 |
| R15-06 | 255 | 깡통꽃게 | [public/models/pet-255.json](../../public/models/pet-255.json) | 21.6 |
| R15-07 | 256 | 형광나방 | [public/models/pet-256.json](../../public/models/pet-256.json) | 21.6 |
| R15-08 | 257 | 건전지 멧돼지 | [public/models/pet-257.json](../../public/models/pet-257.json) | 21.6 |
| R15-09 | 258 | 온실사슴 | [public/models/pet-258.json](../../public/models/pet-258.json) | 21.6 |
| R15-10 | 259 | 두머리 살쾡이 | [public/models/pet-259.json](../../public/models/pet-259.json) | 21.6 |
| R16-01 | 260 | 꽃꿀벌 | [public/models/pet-260.json](../../public/models/pet-260.json) | 21.6 |
| R16-02 | 261 | 이슬무당벌레 | [public/models/pet-261.json](../../public/models/pet-261.json) | 21.6 |
| R16-03 | 262 | 잎사귀벌레 | [public/models/pet-262.json](../../public/models/pet-262.json) | 21.6 |
| R16-04 | 263 | 도토리 장수풍뎅이 | [public/models/pet-263.json](../../public/models/pet-263.json) | 21.6 |
| R16-05 | 264 | 풀잎메뚜기 | [public/models/pet-264.json](../../public/models/pet-264.json) | 21.6 |
| R16-06 | 265 | 버섯개미 | [public/models/pet-265.json](../../public/models/pet-265.json) | 21.6 |
| R16-07 | 266 | 씨앗잠자리 | [public/models/pet-266.json](../../public/models/pet-266.json) | 21.6 |
| R16-08 | 267 | 호박빛 매미 | [public/models/pet-267.json](../../public/models/pet-267.json) | 21.6 |
| R16-09 | 268 | 비단나방 | [public/models/pet-268.json](../../public/models/pet-268.json) | 21.6 |
| R16-10 | 269 | 왕관사슴벌레 | [public/models/pet-269.json](../../public/models/pet-269.json) | 21.6 |
| R17-01 | 270 | 볼트생쥐 | [public/models/pet-270.json](../../public/models/pet-270.json) | 21.6 |
| R17-02 | 271 | 양철강아지 | [public/models/pet-271.json](../../public/models/pet-271.json) | 21.6 |
| R17-03 | 272 | 자석문어 | [public/models/pet-272.json](../../public/models/pet-272.json) | 21.6 |
| R17-04 | 273 | 바퀴딱정벌레 | [public/models/pet-273.json](../../public/models/pet-273.json) | 21.6 |
| R17-05 | 274 | 유압고릴라 | [public/models/pet-274.json](../../public/models/pet-274.json) | 21.6 |
| R17-06 | 275 | 스프링토끼 | [public/models/pet-275.json](../../public/models/pet-275.json) | 21.6 |
| R17-07 | 276 | 태양전지 거북 | [public/models/pet-276.json](../../public/models/pet-276.json) | 21.6 |
| R17-08 | 277 | 전구해파리 | [public/models/pet-277.json](../../public/models/pet-277.json) | 21.6 |
| R17-09 | 278 | 굴착두더지 | [public/models/pet-278.json](../../public/models/pet-278.json) | 21.6 |
| R17-10 | 279 | 레이더여우 | [public/models/pet-279.json](../../public/models/pet-279.json) | 21.6 |
| R18-01 | 280 | 별모래 햄스터 | [public/models/pet-280.json](../../public/models/pet-280.json) | 21.6 |
| R18-02 | 281 | 혜성다람쥐 | [public/models/pet-281.json](../../public/models/pet-281.json) | 21.6 |
| R18-03 | 282 | 달구덩이 거북 | [public/models/pet-282.json](../../public/models/pet-282.json) | 21.6 |
| R18-04 | 283 | 망원경 부엉이 | [public/models/pet-283.json](../../public/models/pet-283.json) | 21.6 |
| R18-05 | 284 | 토성고양이 | [public/models/pet-284.json](../../public/models/pet-284.json) | 21.6 |
| R18-06 | 285 | 유성제비 | [public/models/pet-285.json](../../public/models/pet-285.json) | 21.6 |
| R18-07 | 286 | 별자리 사슴 | [public/models/pet-286.json](../../public/models/pet-286.json) | 21.6 |
| R18-08 | 287 | 성운문어 | [public/models/pet-287.json](../../public/models/pet-287.json) | 21.6 |
| R18-09 | 288 | 은하수 고래 | [public/models/pet-288.json](../../public/models/pet-288.json) | 21.6 |
| R18-10 | 289 | 일식사자 | [public/models/pet-289.json](../../public/models/pet-289.json) | 21.6 |
| R19-01 | 140 | 틈새고양이 | [public/models/pet-140.json](../../public/models/pet-140.json) | 21.6 |
| R19-02 | 141 | 빈껍질 거북 | [public/models/pet-141.json](../../public/models/pet-141.json) | 21.6 |
| R19-03 | 142 | 그림자토끼 | [public/models/pet-142.json](../../public/models/pet-142.json) | 21.6 |
| R19-04 | 143 | 공백가오리 | [public/models/pet-143.json](../../public/models/pet-143.json) | 21.6 |
| R19-05 | 144 | 조각여우 | [public/models/pet-144.json](../../public/models/pet-144.json) | 21.6 |
| R19-06 | 145 | 침묵의 종 | [public/models/pet-145.json](../../public/models/pet-145.json) | 21.6 |
| R19-08 | 147 | 어긋난 사슴 | [public/models/pet-147.json](../../public/models/pet-147.json) | 21.6 |
| R19-09 | 148 | 검은구멍 고래 | [public/models/pet-148.json](../../public/models/pet-148.json) | 21.6 |
| R19-10 | 149 | 경계의 사냥개 | [public/models/pet-149.json](../../public/models/pet-149.json) | 21.6 |
| R20-01 | 290 | 첫새싹 | [public/models/pet-290.json](../../public/models/pet-290.json) | 21.6 |
| R20-02 | 291 | 새벽토끼 | [public/models/pet-291.json](../../public/models/pet-291.json) | 21.6 |
| R20-03 | 292 | 물감새 | [public/models/pet-292.json](../../public/models/pet-292.json) | 21.6 |
| R20-04 | 293 | 흙빚는 곰 | [public/models/pet-293.json](../../public/models/pet-293.json) | 21.6 |
| R20-05 | 294 | 샘물수달 | [public/models/pet-294.json](../../public/models/pet-294.json) | 21.6 |
| R20-06 | 295 | 바람사슴 | [public/models/pet-295.json](../../public/models/pet-295.json) | 21.6 |
| R20-07 | 296 | 나무껍질 거북 | [public/models/pet-296.json](../../public/models/pet-296.json) | 21.6 |
| R20-08 | 297 | 계절나비 | [public/models/pet-297.json](../../public/models/pet-297.json) | 21.6 |
| R20-09 | 298 | 밤낮의 사자 | [public/models/pet-298.json](../../public/models/pet-298.json) | 21.6 |
