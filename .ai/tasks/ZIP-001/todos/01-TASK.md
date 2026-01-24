# 01-TASK: 타입 정의 및 의존성 설치

```yaml
우선순위: P0
복잡도: Low
의존성: None
차단: 02, 03
예상 LOC: ~30
```

## 목표

archiver 패키지를 설치하고 ZIP 기능에 필요한 TypeScript 타입을 정의합니다.

## 범위

### 포함

- archiver, @types/archiver 패키지 설치
- `ZipResult` 인터페이스 정의
- `ZipPromptResult` 인터페이스 정의

### 제외

- 실제 기능 구현 (02, 03에서 수행)

## 구현 가이드

### 1. 패키지 설치

```bash
cd packages/cli
pnpm add archiver
pnpm add -D @types/archiver
```

### 2. types.ts 수정

파일: `packages/cli/src/types.ts`

기존 코드 맨 아래에 추가:

```typescript
/**
 * ZIP 내보내기 결과
 */
export interface ZipResult {
  success: boolean;
  outputPath: string;
  resourceCount: number;
  error?: string;
}

/**
 * ZIP 프롬프트 결과 (Agent/Scope 없음)
 */
export interface ZipPromptResult {
  directories: RegistryDirectory[];
  types: ResourceType[];
  resources: Resource[];
}
```

## 테스트 요구사항

- [ ] `pnpm build` 성공 (타입 에러 없음)
- [ ] archiver import 가능 확인

```typescript
// 테스트 코드 (임시)
import archiver from 'archiver';
console.log(typeof archiver); // 'function'
```

## 체크리스트

### 구현 전

- [ ] packages/cli 디렉토리에서 작업

### 구현 중

- [ ] archiver 설치
- [ ] @types/archiver 설치
- [ ] ZipResult 타입 추가
- [ ] ZipPromptResult 타입 추가

### 구현 후

- [ ] `pnpm build` 성공
- [ ] Git 커밋

## 통합 포인트

### 출력 (export)

- `ZipResult` 타입 → 02-ZipExporter에서 사용
- `ZipPromptResult` 타입 → 03-ZipPrompt에서 사용

### 입력 (import)

- 기존 `RegistryDirectory`, `ResourceType`, `Resource` 타입 재사용
