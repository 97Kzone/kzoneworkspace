# kzoneAi Backend Architecture

## 1. 개요 (Overview)
kzoneAi 백엔드는 복수의 AI 에이전트가 협업하고, 스스로 학습하며, 문제를 해결하는 **군집 지능(Swarm Intelligence)** 기반 시스템입니다. 각 에이전트는 독립적인 역할과 기억을 가지며, 복잡한 태스크를 마이크로 태스크로 분할하여 분산 처리합니다.

## 2. 기술 스택 (Tech Stack)
*   **Language**: Kotlin (Java 21)
*   **Framework**: Spring Boot 4.0.3 (WebMVC, Data JPA)
*   **Database**: PostgreSQL
*   **AI SDKs**: Anthropic Java SDK (Claude), Google GenAI SDK (Gemini)
*   **Real-time**: Spring WebSocket (STOMP)
*   **Automation**: Playwright (웹 브라우저 제어), Kotlin Coroutines (비동기 처리)

## 3. 핵심 디렉토리 및 패키지 구조
경로: `src/main/kotlin/com/kzoneworkspace/backend/`

### 3.1. `agent` (군집 지능 코어 도메인)
에이전트의 생애주기, 인지, 기억, 협업 모델을 정의하는 가장 거대한 패키지입니다.
*   **`entity/`**: 데이터베이스 스키마와 매핑되는 도메인 객체들.
    *   `Agent.kt`: 에이전트 기본 정보 및 상태.
    *   `Memory.kt`, `CognitiveTrace.kt`: 에이전트의 단기/장기 기억 및 사고 흐름.
    *   `NeuralResonance.kt`, `AgentSynergy.kt`: 에이전트 간의 연결 강도 및 지식 동기화.
    *   `WarRoomIncident.kt`, `BrainstormingSession.kt`: 집단 문제 해결 세션 기록.
    *   `SwarmJournal.kt`, `ActivityLog.kt`: 군집 전체의 활동 로깅.
*   **`service/`**: 방대한 도메인별 비즈니스 로직 처리.
    *   `MemoryOptimizationService.kt`, `MemoryExtractionService.kt`: 파편화된 기억 압축, 핵심 정보 추출.
    *   `CognitiveAlignmentService.kt`: 에이전트 간의 목표 및 컨텍스트 정렬.
    *   `BrainstormingService.kt`, `WarRoomService.kt`: 난상 토론 및 위기 극복 프로세스 제어.
    *   `JanitorService.kt`, `ResourceEfficiencyService.kt`: 불필요한 데이터 정리 및 리소스 최적화.
    *   `ConflictService.kt`: 에이전트 간의 의견 충돌 조정.
*   **`controller/`**: 위 서비스들을 프론트엔드 대시보드에 노출하는 REST API. (예: `MemoryController`, `SwarmJournalController` 등 30여 개)

### 3.2. `claude` (LLM 오케스트레이션)
실제 AI 모델과의 통신을 추상화하여 담당합니다.
*   `AgentExecutor.kt`: 프롬프트를 구성하고 AI에 질의한 뒤 응답을 파싱하여 행동으로 변환하는 핵심 엔진.
*   `ClaudeClient.kt`, `GeminiClient.kt`: 벤더별 API 호출 래퍼.
*   `ProjectContextService.kt`: 프로젝트의 코드나 문맥을 AI 프롬프트에 주입하기 위해 관리.

### 3.3. `tools` (에이전트 활용 도구)
AI 에이전트가 "손과 발"로 사용하는 외부 환경 제어 도구입니다.
*   `BrowserService.kt`: Playwright를 통한 웹 스크래핑 및 자동화 테스트.
*   `GitService.kt`: 소스코드 버전 관리 및 브랜치 제어.
*   `CodeReviewService.kt`: 코드 분석 로직.

### 3.4. `websocket`
*   클라이언트(프론트엔드)로 에이전트들의 실시간 생각(Thought), 대화, 활동 상태를 푸시(Push)하기 위한 설정과 핸들러.

## 4. 데이터 플로우 및 주요 메커니즘
1.  **Task Assignment**: 사용자 혹은 상위 에이전트가 작업을 생성하면 `task` 패키지를 통해 워크스트림이 구성됩니다.
2.  **Agent Execution**: `AgentExecutor`가 할당된 에이전트의 `Memory`와 `ProjectContext`를 읽어 프롬프트를 생성하고 LLM에 질의합니다.
3.  **Collaboration**: 문제 난이도가 높을 경우 `WarRoomService`나 `BrainstormingService`가 발동하여 다수의 에이전트가 참여하는 세션이 열립니다.
4.  **Real-time Push**: 에이전트 상태가 변경되거나 활동 로그가 남을 때마다 WebSocket 토픽(`/topic/agents/활동`, `/topic/warroom/로그` 등)을 통해 프론트엔드로 브로드캐스트됩니다.
5.  **Memory Compaction (비동기)**: 시간이 지남에 따라 `MemoryOptimizationService`가 주기적으로 과거 대화나 로그를 요약/압축하여 토큰 낭비를 줄이고 정보 밀도를 높입니다.

## 5. 개발 가이드라인
*   새로운 에이전트 행동이나 분석 도구를 추가할 때는 `agent` 하위의 적절한 도메인(Service, Controller, Entity)에 분산시켜 책임을 명확히 하세요.
*   LLM 호출이 수반되는 로직은 블로킹을 방지하기 위해 Kotlin Coroutines(`suspend` 함수)를 적극 활용하거나 비동기로 처리해야 합니다.
*   프론트엔드에서 즉각적으로 인지해야 하는 주요 상태 변화는 반드시 WebSocket(STOMP) 채널을 통해 이벤트를 발행(`convertAndSend`)하세요.
