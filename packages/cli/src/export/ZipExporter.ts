import archiver from 'archiver';
import * as fs from 'fs';
import * as path from 'path';
import type { Resource, ResourceType, ZipResult } from '../types.js';

/**
 * ZipExporter - 리소스를 ZIP으로 내보내기
 *
 * ZIP 구조:
 *   frontend/skills/my-skill/
 *     SKILL.md
 *     scripts/
 *     references/
 */
export class ZipExporter {
  /**
   * 리소스를 ZIP으로 내보내기
   */
  async export(resources: Resource[], outputPath: string): Promise<ZipResult> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        resolve({
          success: true,
          outputPath,
          resourceCount: resources.length,
        });
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      for (const resource of resources) {
        const basePath = this.getResourceBasePath(resource);
        const mainFileName = this.getMainFileName(resource.type);

        // 메인 파일 추가
        archive.append(resource.content, {
          name: path.posix.join(basePath, mainFileName),
        });

        // 형제 파일 추가
        if (resource.directory?.files) {
          for (const file of resource.directory.files) {
            if (!file.isDirectory) {
              archive.append(file.content, {
                name: path.posix.join(basePath, file.path),
              });
            }
          }
        }
      }

      archive.finalize();
    });
  }

  /**
   * 리소스의 기본 경로 추출
   * 예: /path/to/registry/frontend/skills/my-skill → frontend/skills/my-skill
   */
  private getResourceBasePath(resource: Resource): string {
    // resource.path에서 directory/type/name 추출
    const parts = resource.path.split(path.sep);
    const resourcesIndex = parts.findIndex((p) => p === 'resources');
    if (resourcesIndex !== -1) {
      return parts.slice(resourcesIndex + 1).join('/');
    }
    // fallback: type/name
    return `${resource.type}/${resource.name}`;
  }

  /**
   * 리소스 타입별 메인 파일명
   */
  private getMainFileName(type: ResourceType): string {
    const fileNames: Record<ResourceType, string> = {
      skills: 'SKILL.md',
      rules: 'RULES.md',
      commands: 'COMMANDS.md',
      agents: 'AGENT.md',
    };
    return fileNames[type];
  }
}

export const zipExporter = new ZipExporter();
