# code-review-team

프로젝트 컨텍스트를 파악한 뒤 전문가 관점으로 코드 리뷰하고, 사용자 승인 후 Agent Team SPAWN으로 병렬 개선 작업을 수행합니다.

## 주요 기능

- Phase 1: 프로젝트 컨텍스트 탐색 및 전문가 패널 동적 구성
- 변경 사항 분석 (diff 범위 자동 결정, TICKET_ID 추출)
- 전문가 관점의 코드 리뷰 (CRITICAL/MAJOR/MEDIUM/LOW 등급 판정)
- Phase 2: 리뷰 결과 기반 Agent Team 스폰으로 병렬 개선 작업 수행
- 작업 그룹핑 (파일 단위), Team 생성 → TaskCreate → Worker 스폰 → 완료 모니터링
- 리뷰 문서 저장 및 체계적인 개선 추적

## 사용 방법

- 호출: `/code-review-team` (또는 트리거 키워드: 코드리뷰, 코드 리뷰, code review, 리뷰해줘, 리팩토링, 코드검토, PR 리뷰, 변경사항 검토)
- 인자: 없음 (대화형 프롬프트로 진행)

## 디렉토리 구조

```
code-review-team/
├── SKILL.md
└── references/
    ├── expert-panel.md
    ├── review-template.md
    └── team-spawn.md
```
