# Task 08: ResourceParser 구현

```yaml
우선순위: P0
복잡도: Medium
의존성: 06, 07
차단: 09, 16
```

---

## 목표

SourceFile을 Resource 객체로 변환하는 ResourceParser를 구현합니다. YAML frontmatter 파싱과 메타데이터 추출을 포함합니다.

---

## 범위

### 포함 사항

- ResourceParser 클래스
- YAML frontmatter 파싱
- 리소스 타입 자동 감지
- 메타데이터 추출 (name, description, author, version, license, category)
- 폴더 구조 포함 여부 감지
- 단위 테스트

### 제외 사항

- 소스 해석 (Task 06, 07)
- 설치 로직 (Task 09)

---

## 구현 가이드

### 1. package.json 의존성 추가

**위치**: `packages/cli/package.json`

```json
{
  "dependencies": {
    "yaml": "^2.3.0"
  }
}
```

### 2. src/parser/ResourceParser.ts

**위치**: `packages/cli/src/parser/ResourceParser.ts`

```typescript
import { parse as parseYAML } from 'yaml';
import { basename, dirname } from 'path';
import type { ResourceType, SourceFile, Resource } from '../types';

export class ResourceParser {
  /**
   * Parse source file to resource
   */
  parseResource(file: SourceFile, type: ResourceType): Resource {
    const frontmatter = this.parseYAMLFrontmatter(file.content);
    const detectedType = this.detectType(file.path) || type;

    const resource: Resource = {
      name: frontmatter.name || this.extractNameFromPath(file.path),
      type: detectedType,
      description: frontmatter.description || '',
      path: file.path,
      content: file.content,
      metadata: {
        author: frontmatter.author,
        version: frontmatter.version,
        license: frontmatter.license,
        category: frontmatter.category,
      },
    };

    return resource;
  }

  /**
   * Parse multiple source files
   */
  parseResources(files: SourceFile[], type: ResourceType): Resource[] {
    return files.map((file) => this.parseResource(file, type));
  }

  /**
   * Parse YAML frontmatter
   * Extracts content between --- delimiters
   */
  private parseYAMLFrontmatter(content: string): Record<string, any> {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return {};
    }

    try {
      return parseYAML(match[1]) || {};
    } catch (error) {
      console.warn('Failed to parse YAML frontmatter:', error);
      return {};
    }
  }

  /**
   * Detect resource type from file path
   */
  private detectType(filePath: string): ResourceType | null {
    const filename = basename(filePath);

    const typeMap: Record<string, ResourceType> = {
      'SKILL.md': 'skill',
      'RULES.md': 'rule',
      'COMMANDS.md': 'command',
      'AGENT.md': 'agent',
    };

    return typeMap[filename] || null;
  }

  /**
   * Extract resource name from file path
   * Example: skills/commit/SKILL.md -> commit
   */
  private extractNameFromPath(filePath: string): string {
    const dir = dirname(filePath);
    const parts = dir.split('/').filter(Boolean);

    // Get last directory name
    if (parts.length > 0) {
      const lastName = parts[parts.length - 1];
      // Skip if it's a type directory (skills, rules, etc.)
      if (!['skills', 'rules', 'commands', 'agents'].includes(lastName)) {
        return lastName;
      }
      // Try second-to-last
      if (parts.length > 1) {
        return parts[parts.length - 2];
      }
    }

    // Fallback to filename without extension
    return basename(filePath, '.md').toLowerCase();
  }
}
```

### 3. src/types.ts 업데이트

**위치**: `packages/cli/src/types.ts`

기존 타입에 추가:

```typescript
export interface Resource {
  name: string;           // 리소스 이름 (YAML name 필드)
  type: ResourceType;     // 'skill' | 'rule' | 'command' | 'agent'
  description: string;    // 설명
  path: string;           // 원본 경로
  content: string;        // 파일 내용
  metadata: {
    author?: string;
    version?: string;
    license?: string;
    category?: string;
  };
}
```

---

## 테스트 요구사항

### 단위 테스트

**위치**: `packages/cli/src/parser/ResourceParser.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { ResourceParser } from './ResourceParser';
import type { SourceFile } from '../types';

describe('ResourceParser', () => {
  const parser = new ResourceParser();

  describe('parseResource', () => {
    it('should parse resource with YAML frontmatter', () => {
      const file: SourceFile = {
        path: 'skills/commit/SKILL.md',
        content: `---
name: commit
description: Create git commits
author: AI Toolkit
version: 1.0.0
license: MIT
category: git
---

# Commit Skill

This is a commit skill.`,
        isDirectory: false,
      };

      const resource = parser.parseResource(file, 'skill');

      expect(resource.name).toBe('commit');
      expect(resource.description).toBe('Create git commits');
      expect(resource.type).toBe('skill');
      expect(resource.metadata.author).toBe('AI Toolkit');
      expect(resource.metadata.version).toBe('1.0.0');
      expect(resource.metadata.license).toBe('MIT');
      expect(resource.metadata.category).toBe('git');
    });

    it('should extract name from path if not in frontmatter', () => {
      const file: SourceFile = {
        path: 'skills/my-skill/SKILL.md',
        content: '# My Skill\n\nNo frontmatter',
        isDirectory: false,
      };

      const resource = parser.parseResource(file, 'skill');
      expect(resource.name).toBe('my-skill');
    });

    it('should detect type from filename', () => {
      const file: SourceFile = {
        path: 'rules/code-style/RULES.md',
        content: '---\nname: code-style\n---\nRules',
        isDirectory: false,
      };

      const resource = parser.parseResource(file, 'skill');
      expect(resource.type).toBe('rule'); // Detected from filename
    });

    it('should handle missing frontmatter', () => {
      const file: SourceFile = {
        path: 'skills/test/SKILL.md',
        content: '# Test Skill\n\nNo YAML',
        isDirectory: false,
      };

      const resource = parser.parseResource(file, 'skill');
      expect(resource.name).toBe('test');
      expect(resource.description).toBe('');
    });

    it('should handle malformed YAML gracefully', () => {
      const file: SourceFile = {
        path: 'skills/bad/SKILL.md',
        content: `---
invalid: yaml: : :
---
Content`,
        isDirectory: false,
      };

      const resource = parser.parseResource(file, 'skill');
      expect(resource.name).toBe('bad');
    });
  });

  describe('parseResources', () => {
    it('should parse multiple files', () => {
      const files: SourceFile[] = [
        {
          path: 'skills/skill1/SKILL.md',
          content: '---\nname: skill1\n---\nSkill 1',
          isDirectory: false,
        },
        {
          path: 'skills/skill2/SKILL.md',
          content: '---\nname: skill2\n---\nSkill 2',
          isDirectory: false,
        },
      ];

      const resources = parser.parseResources(files, 'skill');
      expect(resources.length).toBe(2);
      expect(resources[0].name).toBe('skill1');
      expect(resources[1].name).toBe('skill2');
    });
  });

  describe('extractNameFromPath', () => {
    it('should extract from directory name', () => {
      const name = (parser as any).extractNameFromPath(
        'skills/commit/SKILL.md'
      );
      expect(name).toBe('commit');
    });

    it('should skip type directories', () => {
      const name = (parser as any).extractNameFromPath('skills/SKILL.md');
      expect(name).toBe('skill'); // Fallback to filename
    });

    it('should handle nested paths', () => {
      const name = (parser as any).extractNameFromPath(
        'repo/skills/my-skill/SKILL.md'
      );
      expect(name).toBe('my-skill');
    });
  });
});
```

### 수동 테스트

```bash
pnpm --filter @ai-toolkit/cli build
pnpm --filter @ai-toolkit/cli test
```

---

## 체크리스트

### 구현 전

- [ ] Task 06, 07 완료 확인

### 구현 중

- [ ] yaml 의존성 추가
- [ ] ResourceParser.ts 구현
- [ ] parseYAMLFrontmatter() 구현
- [ ] detectType() 구현
- [ ] extractNameFromPath() 구현
- [ ] types.ts에 Resource 인터페이스 추가
- [ ] ResourceParser.test.ts 작성

### 구현 후

- [ ] `pnpm install` (새 의존성)
- [ ] `pnpm --filter @ai-toolkit/cli build` 성공
- [ ] `pnpm --filter @ai-toolkit/cli test` 테스트 통과
- [ ] YAML 파싱 동작 확인
- [ ] 에러 핸들링 확인

---

## 통합 포인트

### 출력 (Export)

- ResourceParser 클래스 (Task 09에서 사용)
- Resource 인터페이스 (Task 09, 10에서 사용)

### 입력 (Import)

- SourceFile (Task 06, 07)
- ResourceType (Task 03)

---

## 완료 조건

- [x] ResourceParser 구현 완료
- [x] YAML frontmatter 파싱 동작
- [x] 리소스 타입 자동 감지
- [x] 메타데이터 추출
- [x] 에러 처리 (malformed YAML)
- [x] 단위 테스트 커버리지 80% 이상

---

## Git 커밋

```bash
git add packages/cli/src/parser/ResourceParser.ts packages/cli/src/parser/ResourceParser.test.ts packages/cli/src/types.ts packages/cli/package.json
git commit -m "feat/AI-TOOLKIT-001-[AI]: Implement ResourceParser with YAML frontmatter parsing"
```

---

## 완료 후: TASK_MASTER 업데이트

**중요**: 이 작업 완료 후 반드시 `.ai/tasks/AI-TOOLKIT-001/todos/00-TASK_MASTER.md`의 진행 상황을 업데이트하세요.

**업데이트 항목**:
- [ ] 해당 서브태스크의 상태를 `✅ completed`로 변경
- [ ] 최근 업데이트 테이블에 완료 날짜 추가
- [ ] Phase 진행률 업데이트
