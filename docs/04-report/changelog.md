# Smart A/S Connect 변경 로그

모든 주목할 만한 변경 사항이 이 파일에 문서화됩니다.
형식은 [Keep a Changelog](https://keepachangelog.com/)를 참고합니다.

---

## [1.2.0] - 2026-04-03

### Added
- **외부 접속 및 배포 완료**: NAS 환경에서 Docker Compose 기반 배포
  - 도메인 `http://foryouelec.co.kr`을 통한 외부 접속 정상화
  - Docker Compose 구성 (smartas-nginx, backend, frontend, database)
  - DSM 리버스 프록시 통합 (SSL/TLS 처리)
  - 환경변수 기반 설정 관리

### Fixed
- 7건의 배포 관련 이슈 해결
  - nginx server_name 설정 (localhost → 도메인)
  - DSM 내장 nginx 포트 충돌 (80/443)
  - HTTPS 설정 에러 → HTTP 전용으로 변경
  - Email Unique Index → Partial Unique Index로 변경
  - Repair Request NOT NULL 제약 → 기본값 설정
  - Docker restart → stop/rm/run으로 변경
  - Docker build 경로 오류 → 프로젝트 루트 기준으로 변경

### Deployment
- ✅ 외부 도메인 접속 정상화 (`http://foryouelec.co.kr`)
- ✅ 관리자 웹 로그인 정상 동작
- ✅ 기사 등록 API 정상 동작
- ✅ 접수 등록 API 정상 동작
- ✅ 모든 컨테이너 정상 실행

### Documentation
- 배포 완료 보고서 작성 (`docs/04-report/smart-as-deployment.report.md`)

---

## [1.1.0] - 2026-04-03

### Added
- **관리자 CRUD API**: 기사 등록/삭제, 접수 직접 등록, 기사 배정, 상태 변경, 사진 업로드 기능
  - `POST /api/v1/admin/technicians` — 기사 등록 (즉시 approved)
  - `DELETE /api/v1/admin/technicians/:id` — 기사 삭제
  - `POST /api/v1/admin/repair-requests` — 접수 직접 등록
  - `POST /api/v1/admin/repair-requests/:requestId/assign` — 기사 배정
  - `PATCH /api/v1/admin/repair-requests/:requestId/status` — 상태 변경
  - `POST /api/v1/admin/repair-requests/:requestId/photos` — 사진 업로드
- **로고 브랜딩 통일**: "Smart A/S" → "고짱(Go ZZANG)" 로고 이미지 교체
  - 관리자 웹 (Login, Register, Layout)
  - 고객 앱 (App, LoginScreen)
  - 기사 앱 (LoginScreen, RegisterScreen)
- **Docker NAS 배포 자동화**:
  - nginx 서비스명 기반 프록시 설정
  - SPA 라우팅 설정 (try_files)
  - 환경변수 오버라이드 (DB, JWT, SERVER_PORT)
  - Docker Compose custom network 설정

### Changed
- **엑셀 내보내기 개선**:
  - 결제금액을 숫자 타입으로 변환 (SUM 수식 지원)
  - 시트명 변경 ("Sheet1" → "수리 요청 현황")
  - 합계 행 추가 (노란 배경, SUM 수식)
  - 빈 데이터를 "-"로 표시
- **데이터베이스 마이그레이션 자동화**:
  - symptom_photos 기본값 설정 (`[]`)
  - purchase_date 기본값 및 NOT NULL 제약 설정
  - user_id nullable로 변경
  - idx_technicians_email partial unique index로 교체
- **설정 관리 개선**:
  - config.go에서 환경변수 오버라이드 로직 추가
  - Docker Compose에서 환경변수 기반 설정 가능

### Fixed
- 7건의 데이터 모델 및 마이그레이션 버그 수정
- nginx 하드코딩 IP를 서비스명으로 수정
- Frontend Dockerfile에 SPA nginx 설정 추가
- Docker 환경에서 환경변수 무시되는 문제 해결

### Technical Details
- **Files Added**: 
  - backend/internal/handlers/admin.go (관리자 CRUD 핸들러)
  - public/logo-go-zzang.png (로고 이미지)
  - mobile/customer-app/assets/logo-go-zzang.png
  - mobile/technician-app/assets/logo-go-zzang.png

- **Files Modified**: 20개
  - Backend: handlers, config, models, cmd/server
  - Frontend: pages, components, utils
  - Mobile: screens, assets
  - Docker: nginx.conf, Dockerfile, docker-compose.yml

- **Breaking Changes**: 없음

### Dependencies
- 기존 의존성 변경 없음

### Known Issues
- NAS 배포 환경에서 최종 테스트 진행 중

---

## [1.0.0] - 2026-04-02

### Added
- **전체 버그 검수 및 수정**:
  - CRITICAL 버그 1건 (Status 필드 데이터 파괴)
  - 일반 버그 5건
  - 기능 개선 8건
- 기사 앱 핵심 기능 복구
  - GetMe API (`/api/v1/technician/me`)
  - 승인 상태 기반 분기 처리 (PendingApprovalScreen)
  - 기사 상태 실시간 조회 기능
- 관리자 웹 인증 정상화
  - 상태 관리 일관성 (localStorage → React state)
  - Admin 역할 권한 저장
  - 로그아웃 상태 동기화

### Changed
- 모바일 앱 승인 플로우 재설계
  - pending/suspended 기사 메인 기능 접근 차단
  - 승인 대기 화면 신규 추가
  - 상태 확인 버튼으로 실시간 갱신

### Fixed
- 14건의 버그 수정 (CRITICAL 1, HIGH 5, MEDIUM 8)
- 백엔드 데이터 무결성 확보
- 프론트엔드 상태 관리 안정화
- 모바일 앱 접근 제어 강화

### Deployment
- Docker 컨테이너 이미지 빌드 성공

---

## 초기 버전 이력

- v0.1.0: 프로젝트 초기 설정
- v0.2.0: 기본 API 구현
- v0.3.0: 모바일 앱 기본 화면
- ...
- v1.0.0: 첫 번째 안정 버전 (버그 검수 완료)

---

## Unreleased (개발 중)

### Planned
- [ ] 관리자 웹 CRUD UI 개발
- [ ] API 문서 (Swagger/OpenAPI)
- [ ] 성능 최적화
- [ ] CI/CD 파이프라인 구축
- [ ] 모바일 APK 정식 배포
