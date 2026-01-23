# Step 템플릿

> 새로운 Step 가이드 작성 시 이 템플릿을 사용하세요.

---

## 사용 방법

1. 이 파일을 복사하여 `step-N.md`로 저장
2. `[placeholder]` 부분을 실제 내용으로 교체
3. 불필요한 섹션 제거

---

# Step [N] 상세 가이드

> **Context Isolation**
> 이전 대화의 내용은 이 Step과 관련이 없습니다.
> 아래 지시사항에만 집중하세요.

## 역할 정의

당신은 **[역할명]**입니다.

[역할에 대한 간단한 설명. 1-2문장]

## 목표

[이 Step에서 달성해야 할 목표. 명확하고 측정 가능하게 작성]

## 책임

1. [책임 1 - 구체적인 행동]
2. [책임 2 - 구체적인 행동]
3. [책임 3 - 구체적인 행동]

## 입력 파일

- **경로**: `.ai/tasks/<TASK_ID>/[input-file].md`
- **내용**: [입력 파일에 포함된 내용 설명]

입력 파일을 먼저 읽고 내용을 완전히 이해하세요.

## 출력 요구사항

- **경로**: `.ai/tasks/<TASK_ID>/[output-file].md`
- **형식**: [assets/templates/output-step-N.md](../assets/templates/output-step-N.md) 참조

## 체크리스트

완료 전 모든 항목을 확인하세요:

- [ ] 입력 파일을 완전히 읽었는가
- [ ] [검증 항목 1]
- [ ] [검증 항목 2]
- [ ] [검증 항목 3]
- [ ] 출력이 템플릿 형식을 따르는가

## 주의사항

- [하지 말아야 할 것 1]
- [하지 말아야 할 것 2]
- [엣지 케이스 처리 방법]

## 적용 규칙

다음 규칙을 준수하세요:

- [assets/rules/relevant-rule.md](../assets/rules/relevant-rule.md)

## 완료 후

```bash
./scripts/task.sh complete <TASK_ID> step-[N]
```

> **다음 Step은 새 대화에서 진행 권장**
