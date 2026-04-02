# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**Smart A/S Connect** — 소형가전(냉장고, 세탁기, 에어컨 등) A/S 매칭 및 관리 시스템.
세 가지 클라이언트(관리자 웹, 고객 앱, 기사 앱)와 Go 백엔드로 구성된 모노레포.

## 개발 명령어

### 백엔드 (Go)

```bash
cd backend

# 서버 실행 (config.yaml 기준)
go run ./cmd/server

# 빌드
go build -o bin/server ./cmd/server

# 의존성 설치
go mod tidy
```

### 프론트엔드 Admin Web (React + Vite)

```bash
cd frontend/admin-web

npm install
npm run dev      # http://localhost:3000 (→ API proxy: localhost:8088)
npm run build    # dist/ 생성 (백엔드 정적 파일로 서빙됨)
```

### 모바일 앱 (Expo React Native)

```bash
# 고객용
cd mobile/customer-app
npm install && npx expo start

# 기사용
cd mobile/technician-app
npm install && npx expo start
```

### Docker (프로덕션)

```bash
cd docker
docker compose up -d   # nginx + backend + frontend
```

### 초기 관리자 계정 생성

```bash
curl -X POST http://localhost:8088/api/v1/admin/register \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

## 아키텍처

### 전체 흐름

```
[고객 앱 / 기사 앱]  ──→  GET /api/v1/customer|technician/...
[Admin Web]         ──→  GET /api/v1/admin/...
                            ↓
                        Go/Gin 서버 (port 8088)
                            ↓
                    Service 레이어 (비즈니스 로직)
                            ↓
                    Repository 레이어 (GORM)
                            ↓
                        PostgreSQL
```

프로덕션에서는 Nginx가 `8080`에서 요청을 받아 백엔드(`8088`)로 프록시.
Admin Web 빌드 결과물(`frontend/admin-web/dist/`)은 Go 서버가 정적 파일로 직접 서빙.

### 백엔드 레이어 구조

| 경로 | 역할 |
|------|------|
| `cmd/server/main.go` | 진입점. DB 연결, AutoMigrate, 라우팅, 핸들러 조립 |
| `internal/config/` | `config.yaml` 파싱 (DB, JWT, Server, FCM) |
| `internal/models/` | GORM 모델 + 요청/응답 DTO 전체 정의 |
| `internal/repository/` | DB 쿼리 (GORM). 단일 `Repository` 구조체 |
| `internal/service/` | 비즈니스 로직. JWT 발급/검증, bcrypt 해싱 포함 |
| `internal/handlers/` | Gin 핸들러 (admin, customer, technician, utils) |
| `internal/middleware/` | JWT `AuthMiddleware` + CORS |
| `internal/fcm/` | Firebase Cloud Messaging 클라이언트 (선택적) |
| `migrations/` | 초기 SQL 마이그레이션 (001_init.sql) |

**중요**: AutoMigrate를 사용하므로 모델에 필드 추가 시 별도 마이그레이션 파일 없이 자동 반영됨.

### 인증 방식

- JWT Bearer 토큰 (유효기간 24시간, `config.yaml`의 `jwt.secret` 사용)
- 토큰은 클라이언트 `localStorage`에 보관 (`token`, `role` 키)
- 401 응답 시 axios 인터셉터가 자동으로 `/login`으로 리디렉트

### 역할(Role) 구분

| 역할 | 인증 경로 | 비고 |
|------|-----------|------|
| 고객(User) | `POST /api/v1/customer/login` | 전화번호 + 비밀번호 |
| 기사(Technician) | `POST /api/v1/technician/login` | 전화번호 + 비밀번호, 관리자 승인 필요 |
| 관리자(Admin) | `POST /api/v1/admin/login` | username + 비밀번호 |

### 프론트엔드 (Admin Web)

- `src/api/index.ts` — axios 인스턴스 + 모든 API 함수 정의. 새 API 추가 시 여기에 추가
- `src/pages/` — 라우트별 페이지 컴포넌트
- `src/App.tsx` — 라우팅 + 인증 가드 (`localStorage.getItem('token')` 체크)
- Vite dev 서버에서 `/api` 요청을 `localhost:8088`로 프록시 처리

### 모바일 앱

두 앱 모두 Expo 50 기반, 구조 동일:
- `mobile/customer-app/` — 고객용 (A/S 접수, 상태 확인, 사진 업로드, 위치)
- `mobile/technician-app/` — 기사용 (콜 목록, 수락/거절, 작업 완료, FCM 수신)

## 설정 파일

`backend/config.yaml` (실제 운영 값 사용):

```yaml
database:
  host: localhost
  port: 5432
  user: smartas
  password: smart1234
  dbname: smart_as

jwt:
  secret: your-super-secret-key-change-in-production
  expiry_hours: 24

server:
  port: 8088

fcm:
  credentials_file: ./fcm-credentials.json  # 없으면 FCM 비활성화됨
```

Docker 환경에서는 환경변수(`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `SERVER_PORT`)로 오버라이드.

## 파일 업로드

수리 사진 등은 `backend/uploads/` 디렉터리에 저장되며, `/uploads/*` 경로로 정적 서빙됨.
`RepairRequest.SymptomPhotos`, `RepairCompletion.CompletionPhotos` 필드는 PostgreSQL `jsonb` 타입으로 URL 배열 저장.
