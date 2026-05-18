# kzoneAi Frontend Architecture

## 1. 개요 (Overview)
kzoneAi 프론트엔드는 수많은 AI 에이전트들의 사고 과정, 협업 상태, 프로젝트의 건강도 등을 한눈에 모니터링할 수 있는 **지휘 통제실(Command Center)** 역할을 합니다. 실시간 데이터 스트리밍과 화려한 시각화(Animation, Charts)를 통해 군집 지능의 "살아 숨 쉬는" 느낌을 사용자에게 전달합니다.

## 2. 기술 스택 (Tech Stack)
*   **Framework**: Next.js 16.1.6 (App Router 구조)
*   **Core UI**: React 19, Tailwind CSS v4
*   **Visualization & Animation**: Framer Motion, Recharts
*   **Real-time Communication**: `@stomp/stompjs`, `sockjs-client` (WebSocket)
*   **API & Utils**: `axios`, `clsx`, `tailwind-merge`, `lucide-react`

## 3. 디렉토리 및 컴포넌트 구조
경로: `src/`

### 3.1. `app` (라우팅 및 진입점)
*   `layout.tsx`: 전역 레이아웃 및 폰트, 다크모드/테마 설정이 포함된 루트 컴포넌트.
*   `page.tsx`: 애플리케이션의 메인 페이지. 다양한 대시보드 컴포넌트들을 탭이나 그리드 형태로 렌더링.
*   `apiService.ts`: Axios 인스턴스 설정 및 REST API 호출 래퍼 (에이전트 목록 조회, 초기 상태 Fetch 등).

### 3.2. `components` (코어 UI 모듈)
프론트엔드의 핵심인 방대한 대시보드 위젯들이 모여 있습니다.
*   **협업 & 문제 해결 시각화**:
    *   `HiveWarRoomDashboard.tsx`: 장애나 복잡한 이슈 발생 시 에이전트들이 모이는 "워룸" 시각화. 채팅 UI 형태로 에이전트 간 토론 렌더링.
    *   `BrainstormingBoard.tsx`, `ConflictResolutionHub.tsx`: 아이디어 발상 및 에이전트 간 충돌/조율 과정 시각화.
*   **기억 & 인지 시각화**:
    *   `MemoryInsights.tsx`: 에이전트의 압축된 기억, 지식 베이스 검색 및 구조 시각화.
    *   `NeuralResonanceMap.tsx`, `SwarmSynergyMap.tsx`: 노드와 엣지(Node & Edge)를 이용해 에이전트 간의 지식 동기화 및 시너지 관계망 표현.
    *   `CognitiveTraceTimeline.tsx`: 특정 에이전트의 사고 흐름(Thought Process)을 타임라인으로 추적.
*   **프로젝트 관리 및 유지보수**:
    *   `ProjectHealthDashboard.tsx`, `ResourceEfficiencyDashboard.tsx`: 리소스 소모량 및 토큰 사용량 차트 표시 (Recharts 활용).
    *   `JanitorDashboard.tsx`: 불필요한 파일, 코드 찌꺼기를 스캔하고 청소하는 에이전트 활동 뷰.
    *   `StandupBoard.tsx`, `MissionHiveDashboard.tsx`: 칸반(Kanban) 스타일의 에이전트 작업 진행률 및 일일 스탠드업 보고.

### 3.3. `hooks` (커스텀 훅)
*   **`useStompWS.ts`**: STOMP 프로토콜을 사용해 백엔드 WebSocket(포트 8080 등)에 연결을 맺고 유지하는 핵심 훅입니다.
    *   `/topic/agents`, `/topic/memory`, `/topic/warroom` 등의 토픽을 구독(subscribe)하여 실시간 이벤트(메시지)를 수신하면, React 상태를 업데이트하여 화면을 리렌더링하게 만듭니다.

## 4. 데이터 플로우 및 상태 관리 패턴
1.  **초기 데이터 로드**: 애플리케이션 접속 시 `apiService.ts`를 통해 백엔드(REST API)에서 현재 프로젝트 상태, 에이전트 목록, 과거 워룸 기록 등을 로드합니다.
2.  **실시간 구독 (WebSocket)**: 컴포넌트 마운트 시 `useStompWS`가 동작하여 백엔드 채널을 구독합니다.
3.  **애니메이션 렌더링**: WebSocket을 통해 백엔드에서 신규 이벤트(예: 에이전트의 새로운 발언, 메모리 압축 완료 등)가 들어오면, 해당 대시보드의 상태(State) 배열에 추가됩니다. 이때 `framer-motion`의 `AnimatePresence`나 `motion.div`를 사용하여 새 항목이 스무스하게 팝업되거나 리스트에 추가되는 효과를 줍니다.

## 5. 개발 및 UI 가이드라인
*   **시각적 품질 (Vibrant & Dynamic)**: kzoneAi의 정체성은 "살아 움직이는 군집"입니다. 상태가 변할 때는 딱딱한 전환보다는 Framer Motion을 적극 활용해 미세한 애니메이션(Micro-animations)을 적용해야 합니다.
*   **컴포넌트 독립성**: 모든 대시보드는(예: `StandupBoard`, `JanitorDashboard`) 각각의 책임만을 가지도록 분리되어야 하며, 불필요한 전역 상태 공유를 최소화하고 자신의 데이터를 구독/페치 하도록 설계하세요.
*   **웹소켓 최적화**: 잦은 웹소켓 메시지 수신으로 인한 무한 렌더링을 방지하기 위해 React의 `useMemo`, `useCallback`, `memo` 등을 적절히 혼용하여 렌더링 최적화에 신경 써야 합니다.
