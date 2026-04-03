# AGENTS.md - Smart A/S Connect 개발 가이드

> 이 파일은 에이전트 코딩 에이전트(자신 포함)를 위한 참조 문서입니다.

## 프로젝트 개요

**Smart A/S Connect** - 소형가전 A/S 매칭 및 관리 시스템. Go 백엔드, React Admin Web, React Native 모바일 앱으로 구성된 모노레포.

## 빌드 및 실행 명령어

### 백엔드 (Go)

```bash
# 의존성 설치
cd backend && go mod tidy

# 서버 실행 (config.yaml 기준)
go run ./cmd/server

# 빌드
go build -o bin/server ./cmd/server

# 서버 상태 확인
curl http://localhost:8088/health
```

### Admin Web (React + Vite)

```bash
cd frontend/admin-web

# 의존성 설치
npm install

# 개발 서버 실행 (localhost:3000, API 프록시: localhost:8088)
npm run dev

# 프로덕션 빌드
npm run build
```

### 모바일 앱 (React Native + Expo)

```bash
# 고객용 앱
cd mobile/customer-app && npm install && npx expo start

# 기사용 앱
cd mobile/technician-app && npm install && npx expo start
```

### Docker (프로덕션)

```bash
cd docker && docker compose up -d
```

## 코드 스타일 가이드

### Go 백엔드

**패키지 구조:**
```
backend/
├── cmd/server/main.go      # 서버 진입점
├── internal/
│   ├── config/             # 설정 파싱 (config.yaml)
│   ├── models/              # GORM 모델 + DTO
│   ├── repository/         # DB 쿼리 (단일 Repository)
│   ├── service/            # 비즈니스 로직
│   ├── handlers/           # Gin HTTP 핸들러
│   ├── middleware/         # JWT, CORS
│   └── fcm/                # Firebase Cloud Messaging
└── config.yaml             # 설정 파일
```

**명명 규칙:**
- 파일명: snake_case (e.g., `admin_handler.go`)
- 함수/변수: CamelCase
- 인터페이스: `Repository`, `Service` 등 명사형
- 에러: `errors.New("설명")` 형태, 한국어 메시지 허용

**import 규칙:**
```go
import (
    "fmt"
    "net/http"
    "time"
    
    "smart-as/internal/models"
    "smart-as/internal/service"
    
    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
    "golang.org/x/crypto/bcrypt"
)
```

**에러 처리:**
- 함수 반환: `(value, error)` 형태
- 핸들러: `if err != nil { c.JSON(status, gin.H{"error": err.Error()}); return }`
- 에러 메시지:简短하고 명확하게

**주요 패턴:**
- JWT 토큰: 24시간 유효 (`config.yaml`의 `jwt.secret` 사용)
- 비밀번호: bcrypt 해싱
- DB: GORM + PostgreSQL (AutoMigrate 사용)
- 서비스 계층: 단일 Repository 구조체 주입

### Admin Web (React + TypeScript)

**기술 스택:**
- React 18 + TypeScript
- Tailwind CSS
- React Query (@tanstack/react-query)
- React Router v6
- axios

**디렉토리 구조:**
```
frontend/admin-web/src/
├── api/index.ts      # axios 인스턴스 + API 함수
├── components/       # UI 컴포넌트
├── pages/            # 라우트별 페이지
├── types/index.ts    # TypeScript 타입 정의
├── App.tsx           # 라우팅 + 인증 가드
└── main.tsx         # 진입점
```

**명명 규칙:**
- 컴포넌트: PascalCase (e.g., `StatusBadge.tsx`)
- 함수/변수: camelCase
- 상수: UPPER_SNAKE_CASE
- CSS 클래스: Tailwind 유틸리티 클래스 사용

**주요 패턴:**
- 인증: `localStorage.getItem('token')` 체크
- API 호출: React Query 사용
- API 에러: axios 인터셉터가 401 시 `/login`으로 리디렉트
- 파일 업로드: `backend/uploads/` 디렉터리에 저장, `/uploads/*` 경로로 서빙

### 모바일 앱 (React Native + Expo)

**기술 스택:**
- Expo 50
- React Native 0.73
- React Navigation 6
- AsyncStorage
- expo-location, expo-image-picker

**명명 규칙:**
- 컴포넌트: PascalCase
- 함수/변수: camelCase

## 데이터베이스

- PostgreSQL 사용
- GORM AutoMigrate 사용 (모델 변경 시 자동 마이그레이션)
- 주요 테이블: Users, Technicians, RepairRequests, RepairCompletions, Admins
- jsonb 타입: `SymptomPhotos`, `CompletionPhotos` (URL 배열 저장)

## API 공통 사항

**기본 URL:** `http://localhost:8088`

**인증:**
- JWT Bearer 토큰
- `Authorization: Bearer <token>` 헤더
- 역할: `user`, `technician`, `admin`

**역할별 엔드포인트:**
- 고객: `/api/v1/customer/*`
- 기사: `/api/v1/technician/*`
- 관리자: `/api/v1/admin/*`

## 테스트

### 수동 API 테스트

```bash
# 서버 상태 확인
curl http://localhost:8088/health

# 관리자 로그인
curl -X POST http://localhost:8088/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# 관리자 계정 생성
curl -X POST http://localhost:8088/api/v1/admin/register \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

## 설정

`backend/config.yaml`:
```yaml
database:
  host: localhost
  port: 5432
  user: smartas
  password: smart1234
  dbname: smart_as

jwt:
  secret: your-super-secret-key
  expiry_hours: 24

server:
  port: 8088

fcm:
  credentials_file: ./fcm-credentials.json  # 선택사항
```

## 참고 사항

- 이 프로젝트에는 테스트 스위트가 없음 (수동 테스트为主)
- lint 도구 미설정 (go fmt, eslint 미사용)
- Cursor/Copilot 규칙 파일 없음
