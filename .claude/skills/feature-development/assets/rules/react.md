# React 개발 규칙

> Feature Development 워크플로우에서 적용되는 React 개발 규칙

## 컴포넌트 규칙

### 파일 구조

```
ComponentName/
├── index.ts          # re-export
├── ComponentName.tsx # 컴포넌트
├── ComponentName.test.tsx # 테스트
└── ComponentName.styles.ts # 스타일 (선택)
```

또는 단일 파일:
```
ComponentName.tsx
```

### 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase | `UserProfile` |
| 훅 | camelCase, use 접두사 | `useUserData` |
| 유틸 | camelCase | `formatDate` |
| 상수 | UPPER_SNAKE_CASE | `MAX_ITEMS` |
| 타입 | PascalCase | `UserProps` |

### 컴포넌트 작성

```tsx
// 1. 타입 정의 먼저
interface ComponentNameProps {
  title: string;
  onAction?: () => void;
}

// 2. 컴포넌트 정의
export function ComponentName({ title, onAction }: ComponentNameProps) {
  // 3. 훅 호출 (순서 일정하게)
  const [state, setState] = useState(initialValue);

  // 4. 이벤트 핸들러
  const handleClick = () => {
    // ...
  };

  // 5. 렌더링
  return (
    <div>
      {/* ... */}
    </div>
  );
}
```

## 훅 규칙

### 커스텀 훅 패턴

```tsx
export function useFeatureName(params: Params) {
  // 상태
  const [data, setData] = useState<Data | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 로직
  useEffect(() => {
    // ...
  }, [deps]);

  // 반환
  return { data, isLoading, error };
}
```

## 상태 관리 규칙

### 로컬 vs 전역

| 상태 유형 | 위치 |
|----------|------|
| UI 상태 (열림/닫힘) | 로컬 (useState) |
| 폼 데이터 | 로컬 또는 폼 라이브러리 |
| 서버 데이터 | 데이터 페칭 라이브러리 |
| 공유 상태 | Context 또는 전역 상태 |

## 테스트 규칙

### 테스트 우선순위

1. 사용자 인터랙션 테스트
2. 비즈니스 로직 테스트
3. 엣지 케이스 테스트

### 테스트 패턴

```tsx
describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should handle user action', async () => {
    const onAction = vi.fn();
    render(<ComponentName onAction={onAction} />);

    await userEvent.click(screen.getByRole('button'));
    expect(onAction).toHaveBeenCalled();
  });
});
```

## 피해야 할 패턴

- [ ] 컴포넌트 내부에서 컴포넌트 정의
- [ ] useEffect 내 무한 루프
- [ ] 불필요한 리렌더링
- [ ] props drilling (3단계 이상)
- [ ] 인라인 함수 남용
