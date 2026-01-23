# Task 01: Turborepo Monorepo 초기화

```yaml
우선순위: P0
복잡도: Medium
의존성: None
차단: 02, 03
```

---

## 목표

Turborepo 기반 monorepo 프로젝트 구조를 생성하고, pnpm workspace 설정을 완료합니다.

---

## 범위

### 포함 사항

- Root package.json 생성 (private: true)
- pnpm-workspace.yaml 생성
- turbo.json 생성 (빌드 파이프라인)
- tsconfig.base.json 생성 (공통 TypeScript 설정)
- .gitignore 업데이트 (node_modules, dist, .turbo)
- packages/ 디렉토리 생성

### 제외 사항

- 개별 패키지 구현 (Task 02, 03에서 진행)
- 의존성 설치 (pnpm install은 구조 생성 후)

---

## 구현 가이드

### 1. Root package.json

**위치**: `/Users/hynu/Projects/ai-toolkit/package.json`

```json
{
  "name": "ai-toolkit",
  "version": "0.1.0",
  "private": true,
  "description": "Universal AI agent resource installer",
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "dev": "turbo run dev"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.3.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.15.0"
}
```

### 2. pnpm-workspace.yaml

**위치**: `/Users/hynu/Projects/ai-toolkit/pnpm-workspace.yaml`

```yaml
packages:
  - 'packages/*'
```

### 3. turbo.json

**위치**: `/Users/hynu/Projects/ai-toolkit/turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### 4. tsconfig.base.json

**위치**: `/Users/hynu/Projects/ai-toolkit/tsconfig.base.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  },
  "exclude": ["node_modules", "dist", ".turbo"]
}
```

### 5. .gitignore 업데이트

**위치**: `/Users/hynu/Projects/ai-toolkit/.gitignore`

기존 파일에 다음 내용 추가:

```gitignore
# Turborepo
.turbo

# Build outputs
dist/
*.tsbuildinfo

# Dependencies
node_modules/

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

### 6. packages/ 디렉토리 생성

**명령어**:

```bash
mkdir -p packages/cli packages/registry
```

---

## 테스트 요구사항

### 검증 단계

1. **구조 확인**:
   ```bash
   ls -la
   # package.json, pnpm-workspace.yaml, turbo.json, tsconfig.base.json 존재 확인
   ```

2. **pnpm 설치**:
   ```bash
   pnpm install
   # node_modules 생성 확인
   ```

3. **Turborepo 동작 확인**:
   ```bash
   pnpm turbo build
   # 에러 없이 실행 (패키지가 없어도 OK)
   ```

---

## 체크리스트

### 구현 전

- [ ] 현재 디렉토리 위치 확인: `/Users/hynu/Projects/ai-toolkit`
- [ ] 기존 package.json 백업 (있는 경우)

### 구현 중

- [ ] Root package.json 생성
- [ ] pnpm-workspace.yaml 생성
- [ ] turbo.json 생성
- [ ] tsconfig.base.json 생성
- [ ] .gitignore 업데이트
- [ ] packages/ 디렉토리 생성

### 구현 후

- [ ] `pnpm install` 성공
- [ ] `pnpm turbo build` 에러 없이 실행
- [ ] packages/cli, packages/registry 디렉토리 존재 확인

---

## 통합 포인트

### 출력 (Export)

- Root 프로젝트 구조 (Task 02, 03이 사용)
- turbo.json 빌드 파이프라인 (모든 빌드 작업이 참조)
- tsconfig.base.json (각 패키지가 extends)

### 입력 (Import)

- 없음 (첫 번째 태스크)

---

## 완료 조건

- [x] Root package.json 생성 완료
- [x] pnpm-workspace.yaml 생성 완료
- [x] turbo.json 생성 완료
- [x] tsconfig.base.json 생성 완료
- [x] .gitignore 업데이트 완료
- [x] packages/cli, packages/registry 디렉토리 생성 완료
- [x] `pnpm install` 성공
- [x] `pnpm turbo build` 에러 없이 실행

---

## Git 커밋

```bash
git add package.json pnpm-workspace.yaml turbo.json tsconfig.base.json .gitignore packages/
git commit -m "feat/AI-TOOLKIT-001-[AI]: Add Turborepo monorepo structure"
```
