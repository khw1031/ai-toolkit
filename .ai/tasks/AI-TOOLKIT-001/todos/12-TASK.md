# Task 12: URLResolver 구현

```yaml
우선순위: P1
복잡도: Low
의존성: 03
차단: 16
```

---

## 목표

URL에서 단일 리소스 파일을 다운로드하는 URLResolver를 구현합니다.

---

## 범위

### 포함 사항

- URLResolver 클래스
- HTTP/HTTPS URL 지원
- GitHub Raw URL 지원
- 파일 다운로드
- Content-Type 검증
- 단위 테스트

### 제외 사항

- GitHub, Bitbucket, Local resolver (Task 06, 07, 11)

---

## 구현 가이드

### 1. src/source/URLResolver.ts

**위치**: `packages/cli/src/source/URLResolver.ts`

```typescript
import type { ResourceType, SourceFile } from '../types';

export class URLResolver {
  /**
   * Resolve URL to single file
   */
  async resolve(url: string, type: ResourceType): Promise<SourceFile[]> {
    this.validateURL(url);

    const content = await this.downloadFile(url);
    this.validateContent(content, type);

    // Extract filename from URL
    const filename = this.extractFilename(url, type);

    return [
      {
        path: filename,
        content,
        isDirectory: false,
      },
    ];
  }

  /**
   * Validate URL format
   */
  private validateURL(url: string): void {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Only HTTP/HTTPS URLs are supported');
      }
    } catch (error: any) {
      throw new Error(`Invalid URL: ${error.message}`);
    }
  }

  /**
   * Download file from URL
   */
  private async downloadFile(url: string): Promise<string> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check Content-Type
      const contentType = response.headers.get('content-type');
      if (contentType && !this.isTextContent(contentType)) {
        throw new Error(`Unsupported content type: ${contentType}`);
      }

      return await response.text();
    } catch (error: any) {
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  /**
   * Check if content type is text-based
   */
  private isTextContent(contentType: string): boolean {
    const textTypes = [
      'text/',
      'application/json',
      'application/yaml',
      'application/x-yaml',
    ];
    return textTypes.some((type) => contentType.includes(type));
  }

  /**
   * Validate content matches resource type
   */
  private validateContent(content: string, type: ResourceType): void {
    const filename = this.getResourceFilename(type);

    // Basic validation: check if content looks like markdown
    if (!content.includes('#') && !content.includes('---')) {
      console.warn('Warning: Content does not look like a valid resource file');
    }
  }

  /**
   * Extract filename from URL
   */
  private extractFilename(url: string, type: ResourceType): string {
    const parsed = new URL(url);
    const pathname = parsed.pathname;

    // Try to get filename from URL
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1];
      if (lastPart.endsWith('.md')) {
        return lastPart;
      }
    }

    // Fallback to default filename
    return this.getResourceFilename(type);
  }

  /**
   * Get resource filename by type
   */
  private getResourceFilename(type: ResourceType): string {
    const filenames: Record<ResourceType, string> = {
      skill: 'SKILL.md',
      rule: 'RULES.md',
      command: 'COMMANDS.md',
      agent: 'AGENT.md',
    };
    return filenames[type];
  }
}
```

---

## 테스트 요구사항

### 단위 테스트

**위치**: `packages/cli/src/source/URLResolver.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { URLResolver } from './URLResolver';

describe('URLResolver', () => {
  describe('validateURL', () => {
    it('should accept valid HTTP URL', () => {
      const resolver = new URLResolver();
      expect(() => {
        (resolver as any).validateURL('http://example.com/SKILL.md');
      }).not.toThrow();
    });

    it('should accept valid HTTPS URL', () => {
      const resolver = new URLResolver();
      expect(() => {
        (resolver as any).validateURL('https://example.com/SKILL.md');
      }).not.toThrow();
    });

    it('should reject non-HTTP protocols', () => {
      const resolver = new URLResolver();
      expect(() => {
        (resolver as any).validateURL('ftp://example.com/SKILL.md');
      }).toThrow('Only HTTP/HTTPS URLs are supported');
    });

    it('should reject invalid URLs', () => {
      const resolver = new URLResolver();
      expect(() => {
        (resolver as any).validateURL('not-a-url');
      }).toThrow('Invalid URL');
    });
  });

  describe('extractFilename', () => {
    it('should extract filename from URL', () => {
      const resolver = new URLResolver();
      const filename = (resolver as any).extractFilename(
        'https://example.com/path/to/SKILL.md',
        'skill'
      );
      expect(filename).toBe('SKILL.md');
    });

    it('should fallback to default filename', () => {
      const resolver = new URLResolver();
      const filename = (resolver as any).extractFilename(
        'https://example.com/path',
        'skill'
      );
      expect(filename).toBe('SKILL.md');
    });
  });

  describe('isTextContent', () => {
    it('should accept text content types', () => {
      const resolver = new URLResolver();
      expect((resolver as any).isTextContent('text/plain')).toBe(true);
      expect((resolver as any).isTextContent('text/markdown')).toBe(true);
      expect((resolver as any).isTextContent('application/json')).toBe(true);
    });

    it('should reject binary content types', () => {
      const resolver = new URLResolver();
      expect((resolver as any).isTextContent('image/png')).toBe(false);
      expect((resolver as any).isTextContent('application/pdf')).toBe(false);
    });
  });

  describe('getResourceFilename', () => {
    it('should return correct filename for each type', () => {
      const resolver = new URLResolver();
      expect((resolver as any).getResourceFilename('skill')).toBe('SKILL.md');
      expect((resolver as any).getResourceFilename('rule')).toBe('RULES.md');
    });
  });
});
```

### 수동 테스트

```bash
# GitHub Raw URL
node packages/cli/bin/ai-toolkit.js --skills --source=https://raw.githubusercontent.com/owner/repo/main/skills/commit/SKILL.md

# Direct URL
node packages/cli/bin/ai-toolkit.js --skills --source=https://example.com/SKILL.md
```

---

## 체크리스트

### 구현 전

- [ ] Task 03 완료 확인

### 구현 중

- [ ] URLResolver.ts 구현
- [ ] validateURL() 메서드 구현
- [ ] downloadFile() 메서드 구현
- [ ] isTextContent() 검증 구현
- [ ] extractFilename() 구현
- [ ] URLResolver.test.ts 작성

### 구현 후

- [ ] `pnpm --filter @ai-toolkit/cli build` 성공
- [ ] `pnpm --filter @ai-toolkit/cli test` 테스트 통과
- [ ] URL 다운로드 동작 확인
- [ ] Content-Type 검증 확인

---

## 통합 포인트

### 출력 (Export)

- URLResolver 클래스 (CommandHandler에서 사용)

### 입력 (Import)

- ResourceType, SourceFile (Task 03, 06)

---

## 완료 조건

- [x] URLResolver 구현 완료
- [x] HTTP/HTTPS URL 지원
- [x] Content-Type 검증
- [x] 파일 다운로드 동작
- [x] 단위 테스트 커버리지 80% 이상

---

## Git 커밋

```bash
git add packages/cli/src/source/URLResolver.ts packages/cli/src/source/URLResolver.test.ts
git commit -m "feat/AI-TOOLKIT-001-[AI]: Implement URLResolver for direct file downloads"
```
