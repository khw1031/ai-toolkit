# changelog

CHANGELOG.md에 변경 사항과 담당자를 정리하고 package.json 버전을 올립니다.

## 주요 기능

- 최근 커밋 로그를 분석하여 카테고리별로 변경 사항 분류 (feat, fix, refactor, docs, style, test, chore)
- 변경 담당자(문의담당자)를 자동으로 추출하여 CHANGELOG.md에 기록
- package.json의 버전을 patch/minor/major 유형에 따라 자동으로 업데이트
- CHANGELOG.md가 없으면 Keep a Changelog 형식으로 새로 생성
- 현재 버전 확인 및 최근 태그 이후 커밋만 분석

## 사용 방법

- 호출: `/changelog` (또는 트리거 키워드: changelog 작성, 변경 이력 정리, 버전 올리기, 릴리즈 노트, CHANGELOG 업데이트)
- 인자: [버전 유형: patch/minor/major]

## 디렉토리 구조

```
changelog/
├── SKILL.md
└── references/
    └── format-guide.md
```
