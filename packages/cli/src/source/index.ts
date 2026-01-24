/**
 * Source parsing for different resource locations
 */

// Source parser (GitHub, GitLab, Git URL, direct URL)
export {
  parseSource,
  isDirectSkillUrl,
  isDirectResourcePath,
  getOwnerRepo,
  getSourceDisplayName,
} from './SourceParser.js';
