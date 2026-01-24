# 02-TASK: Registry 디렉토리 구조 생성

## 메타데이터

```yaml
우선순위: P0
복잡도: Low
의존성: None
차단: 04
예상 LOC: ~50 (주로 디렉토리/파일 생성)
```

## 목표

Registry 패키지에 3개 디렉토리 구조(common, frontend, app)를 생성하고 샘플 리소스를 배치합니다.

## 범위

### 포함

- `packages/registry/resources/` 디렉토리 구조 생성
- 각 디렉토리에 샘플 리소스 배치
- 기존 `skills/hello-world` 이동

### 제외

- 실제 리소스 콘텐츠 작성 (기존 것 활용)
- RegistryResolver 로직 (04-TASK에서 처리)

## 구현 가이드

### 1. 디렉토리 구조 생성

```bash
packages/registry/resources/
├── common/
│   ├── skills/
│   │   └── hello-world/
│   │       └── SKILL.md
│   ├── rules/
│   │   └── .gitkeep
│   ├── commands/
│   │   └── .gitkeep
│   └── agents/
│       └── .gitkeep
├── frontend/
│   ├── skills/
│   │   └── .gitkeep
│   ├── rules/
│   │   └── .gitkeep
│   ├── commands/
│   │   └── .gitkeep
│   └── agents/
│       └── .gitkeep
└── app/
    ├── skills/
    │   └── .gitkeep
    ├── rules/
    │   └── .gitkeep
    ├── commands/
    │   └── .gitkeep
    └── agents/
        └── .gitkeep
```

### 2. 기존 리소스 이동

**현재 위치**: `packages/registry/resources/skills/hello-world/`
**이동 위치**: `packages/registry/resources/common/skills/hello-world/`

### 3. .gitkeep 파일 생성

빈 디렉토리 유지를 위해 각 디렉토리에 `.gitkeep` 생성

## 테스트 요구사항

### 검증 사항

- [ ] `common/`, `frontend/`, `app/` 3개 디렉토리 존재
- [ ] 각 디렉토리에 `skills/`, `rules/`, `commands/`, `agents/` 하위 디렉토리 존재
- [ ] `common/skills/hello-world/SKILL.md` 존재 (기존 리소스 이동)

### 명령어 검증

```bash
# 구조 확인
tree packages/registry/resources/

# 기대 출력
resources/
├── common/
│   ├── skills/
│   │   └── hello-world/
│   ├── rules/
│   ├── commands/
│   └── agents/
├── frontend/
│   ├── skills/
│   ├── rules/
│   ├── commands/
│   └── agents/
└── app/
    ├── skills/
    ├── rules/
    ├── commands/
    └── agents/
```

## 체크리스트

### 구현 전

- [ ] 기존 `resources/` 구조 확인
- [ ] 기존 `skills/hello-world/` 위치 확인

### 구현 중

- [ ] 3개 최상위 디렉토리 생성 (common, frontend, app)
- [ ] 각 디렉토리에 4개 하위 디렉토리 생성
- [ ] 기존 hello-world 이동
- [ ] .gitkeep 파일 추가

### 구현 후

- [ ] tree 명령으로 구조 확인
- [ ] hello-world SKILL.md 접근 가능 확인

## 통합 포인트

### Export (이 태스크의 출력)

- 디렉토리 구조: `packages/registry/resources/{common,frontend,app}/{skills,rules,commands,agents}/`

### Import (다른 태스크에서 사용)

- 04-TASK: RegistryResolver가 이 구조를 탐색
