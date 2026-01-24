# 07-TASK: 레거시 코드 제거

## 메타데이터

```yaml
우선순위: P2
복잡도: Low
의존성: 06-TASK
차단: 08
예상 LOC: ~50 (삭제)
```

## 목표

새 기능이 완료된 후 더 이상 사용하지 않는 레거시 코드를 제거합니다.

## 범위

### 포함

- Source resolver 파일들 삭제
- Registry 패키지 PathResolver 제거
- 관련 테스트 파일 삭제
- import 정리

### 제외

- 새 기능 코드 (이미 완료)
- README 업데이트 (08-TASK에서 처리)

## 구현 가이드

### 1. 삭제 파일 목록

#### CLI 패키지 (`packages/cli/src/source/`)

```bash
# 삭제할 파일
packages/cli/src/source/GitHubResolver.ts
packages/cli/src/source/GitHubResolver.test.ts
packages/cli/src/source/LocalResolver.ts
packages/cli/src/source/LocalResolver.test.ts
packages/cli/src/source/URLResolver.ts
packages/cli/src/source/URLResolver.test.ts
packages/cli/src/source/BitbucketResolver.ts
packages/cli/src/source/BitbucketResolver.test.ts
```

#### Registry 패키지

```bash
# 삭제할 파일
packages/registry/src/PathResolver.ts
packages/registry/src/PathResolver.test.ts  # 있다면
```

### 2. Import 정리

#### `packages/cli/src/source/index.ts`

```typescript
// 변경 전
export { GitHubResolver } from './GitHubResolver.js';
export { LocalResolver } from './LocalResolver.js';
export { URLResolver } from './URLResolver.js';
export { BitbucketResolver } from './BitbucketResolver.js';
export { RegistryResolver, registryResolver } from './RegistryResolver.js';

// 변경 후
export { RegistryResolver, registryResolver } from './RegistryResolver.js';
```

#### `packages/registry/src/index.ts`

```typescript
// 변경 전
export { PathResolver } from './PathResolver.js';
export { default as agentsData } from '../data/agents.json';

// 변경 후
export { default as agentsData } from '../data/agents.json';
```

### 3. 삭제 명령어

```bash
# CLI 패키지 레거시 resolver 삭제
rm -f packages/cli/src/source/GitHubResolver.ts
rm -f packages/cli/src/source/GitHubResolver.test.ts
rm -f packages/cli/src/source/LocalResolver.ts
rm -f packages/cli/src/source/LocalResolver.test.ts
rm -f packages/cli/src/source/URLResolver.ts
rm -f packages/cli/src/source/URLResolver.test.ts
rm -f packages/cli/src/source/BitbucketResolver.ts
rm -f packages/cli/src/source/BitbucketResolver.test.ts

# Registry 패키지 PathResolver 삭제
rm -f packages/registry/src/PathResolver.ts
rm -f packages/registry/src/PathResolver.test.ts
```

## 테스트 요구사항

### 검증 사항

- [ ] 삭제 후 TypeScript 컴파일 성공
- [ ] 삭제 후 기존 테스트 통과 (남은 테스트)
- [ ] 삭제 후 CLI 실행 정상

### 명령어 검증

```bash
# 빌드 확인
pnpm build

# 테스트 확인
pnpm test

# 실행 확인
pnpm --filter @anthropic/ai-toolkit-cli start
```

## 체크리스트

### 구현 전

- [ ] 06-TASK 완료 확인 (CommandHandler)
- [ ] 새 기능 정상 동작 확인
- [ ] 삭제 대상 파일이 더 이상 참조되지 않는지 확인

### 구현 중

- [ ] CLI 레거시 resolver 8개 파일 삭제
- [ ] Registry PathResolver 삭제
- [ ] source/index.ts import 정리
- [ ] registry/src/index.ts export 정리

### 구현 후

- [ ] TypeScript 컴파일 성공
- [ ] 기존 테스트 통과
- [ ] CLI 실행 정상

## 통합 포인트

### Export (이 태스크의 출력)

- 정리된 source/index.ts
- 정리된 registry/src/index.ts

### Import (다른 태스크에서 사용)

- 08-TASK: 테스트 작성 시 정리된 구조 기반
