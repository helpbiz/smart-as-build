# Smart A/S Connect

> 소형가전 A/S 매칭 및 관리 시스템 (v1.0)

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

## 📋 개요

Smart A/S Connect는 소형가전(냉장고, 세탁기, 에어컨 등)의 애프터서비스를 위한 종합 관리 시스템입니다.

### 주요 기능

- **고객 앱**: A/S 요청 접수 및 상태 확인
- **기사 앱**: 수리 요청 확인, 수락, 작업 완료
- **관리자 웹**: 전체 서비스 관리, 통계, 정산

## 🚀 빠른 시작

### 로컬 개발

```bash
# 1. 프로젝트 클론
git clone https://github.com/helpbiz/smart-as.git
cd smart-as

# 2. PostgreSQL 데이터베이스 생성
# (자세한 내용은 docs/setup/local-dev.md 참고)

# 3. Backend 실행
cd backend
go run ./cmd/server

# 4. Frontend 실행 (새 터미널)
cd frontend/admin-web
npm install
npm run dev
```

### 관리자 계정 생성

```bash
curl -X POST http://localhost:8088/api/v1/admin/register \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### 접속 정보

| 서비스 | URL |
|--------|-----|
| Admin Web | http://localhost:3000 |
| Backend API | http://localhost:8088 |
| 관리자 로그인 | admin / admin123 |

## 📁 프로젝트 구조

```
smart-as/
├── backend/                    # Go Backend API
│   ├── cmd/server/main.go      # 서버 진입점
│   ├── internal/
│   │   ├── config/            # 설정 관리
│   │   ├── fcm/               # Firebase 알림
│   │   ├── handlers/           # HTTP 핸들러
│   │   ├── middleware/         # JWT, CORS
│   │   ├── models/             # 데이터 모델
│   │   ├── repository/         # DB 연산
│   │   └── service/            # 비즈니스 로직
│   ├── migrations/             # DB 마이그레이션
│   ├── config.yaml             # 설정 파일
│   └── go.mod
├── frontend/admin-web/          # React Admin Web
│   ├── src/
│   │   ├── api/               # API 클라이언트
│   │   ├── components/         # UI 컴포넌트
│   │   ├── pages/             # 페이지
│   │   ├── types/             # TypeScript 타입
│   │   └── App.tsx
│   └── package.json
├── mobile/
│   ├── customer-app/           # 고객용 React Native
│   └── technician-app/           # 기사용 React Native
└── docs/                       # 📚 개발 문서
    ├── README.md              # 문서 인덱스
    ├── 00-overview.md         # 프로젝트 개요
    ├── api/endpoints.md       # API 문서
    ├── architecture/           # 아키텍처 문서
    ├── database/schema.md     # DB 스키마
    ├── setup/                 # 설정 가이드
    │   ├── local-dev.md       # 로컬 개발
    │   ├── aws-deploy.md      # AWS 배포
    │   ├── configuration.md    # 설정 가이드
    │   └── testing.md         # 테스트 가이드
    └── troubleshooting/         # 문제 해결
        └── common-issues.md
```

## 🛠 기술 스택

| 영역 | 기술 |
|------|------|
| **Backend** | Go, Gin, GORM, PostgreSQL |
| **Frontend** | React 18, TypeScript, Tailwind CSS, React Query |
| **Mobile** | React Native, Expo |
| **Push** | Firebase Cloud Messaging (FCM) |
| **Infra** | AWS EC2, Nginx |

## 📚 문서

자세한 개발 문서는 [`docs/`](./docs/) 폴더를 참고하세요.

| 문서 | 설명 |
|------|------|
| [프로젝트 개요](./docs/00-overview.md) | 프로젝트 전체 구조 및 설명 |
| [로컬 개발 가이드](./docs/setup/local-dev.md) | Windows/Mac/Linux 개발 환경 구축 |
| [AWS 배포 가이드](./docs/setup/aws-deploy.md) | EC2에 배포하는 방법 |
| [API 문서](./docs/api/endpoints.md) | 모든 API 엔드포인트 |
| [DB 스키마](./docs/database/schema.md) | 데이터베이스 테이블 구조 |
| [테스트 가이드](./docs/setup/testing.md) | API 테스트 방법 |
| [문제 해결](./docs/troubleshooting/common-issues.md) | 자주 발생하는 오류 해결 |

## 🌐 개발 로드맵

- [x] 1단계: DB 스키마 설계 및 기본 API 서버 구축
- [x] 2단계: 고객용 접수 페이지 및 관리자 기본 웹 개발
- [x] 3단계: 기사용 실시간 콜 목록 및 배정 로직 구현
- [x] 4단계: 엑셀 출력 및 정산 시스템 고도화
- [x] Mobile Apps (Customer, Technician)
- [x] FCM 푸시 알림 연동

## 🔧 설정

### Backend (`backend/config.yaml`)

```yaml
database:
  host: localhost
  port: 5432
  user: postgres
  password: your_password
  dbname: smart_as
  sslmode: disable

jwt:
  secret: your-secret-key
  expiry_hours: 24

server:
  host: 0.0.0.0
  port: 8088

fcm:
  credentials_file: ./fcm-credentials.json  # 선택사항
```

자세한 설정은 [`docs/setup/configuration.md`](./docs/setup/configuration.md)를 참고하세요.

## 🧪 테스트

API 테스트는 [`docs/setup/testing.md`](./docs/setup/testing.md)를 참고하세요.

```bash
# 서버 상태 확인
curl http://localhost:8088/health

# 관리자 로그인
curl -X POST http://localhost:8088/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

## 🚀 배포

### AWS EC2 배포

자세한 내용은 [`docs/setup/aws-deploy.md`](./docs/setup/aws-deploy.md)를 참고하세요.

```bash
# EC2 접속
ssh -i "your-key.pem" ubuntu@<EC2-IP>

# 프로젝트 클론
git clone https://github.com/helpbiz/smart-as.git
cd smart-as/backend

# 빌드 및 실행
go build -o bin/server ./cmd/server
```

## 📝 라이선스

MIT License

## 👥 기여자

GitHub Issues를 통해 버그 리포트 및 기능 요청을 환영합니다.

---

**문의**: GitHub Issues
