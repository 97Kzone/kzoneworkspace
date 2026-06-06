# Spring Boot 및 Gradle 백엔드 개발 시작 가이드 (HELP.md)

본 문서는 스프링 부트(Spring Boot) 및 그래들(Gradle) 기반의 K-Zone AI 백엔드 프로젝트 개발자 가이드입니다.

---

## 1. 참고 문서 (Reference Documentation)
자세한 개발 사양 및 활용법은 스프링 공식 가이드라인을 참조하십시오.

*   [공식 Gradle 문서](https://docs.gradle.org)
*   [Spring Boot Gradle 플러그인 레퍼런스 가이드](https://docs.spring.io/spring-boot/4.0.3/gradle-plugin)
*   [OCI 이미지 빌드 및 패키징 가이드](https://docs.spring.io/spring-boot/4.0.3/gradle-plugin/packaging-oci-image.html)
*   [Spring Web MVC 레퍼런스](https://docs.spring.io/spring-boot/4.0.3/reference/web/servlet.html)
*   [Spring WebSocket 및 STOMP 메시징](https://docs.spring.io/spring-boot/4.0.3/reference/messaging/websockets.html)
*   [Spring Data JPA (SQL 연동)](https://docs.spring.io/spring-boot/4.0.3/reference/data/sql.html#data.sql.jpa-and-spring-data)
*   [Docker Compose 지원 기능](https://docs.spring.io/spring-boot/4.0.3/reference/features/dev-services.html#features.dev-services.docker-compose)

---

## 2. 튜토리얼 및 안내서 (Guides)
프레임워크의 핵심 비즈니스 기능을 빌드하는 단계별 실무 안내입니다.

*   [RESTful 웹 서비스 구축하기](https://spring.io/guides/gs/rest-service/)
*   [Spring MVC를 활용한 웹 콘텐츠 처리](https://spring.io/guides/gs/serving-web-content/)
*   [Spring 기반 대규모 REST 서비스 설계](https://spring.io/guides/tutorials/rest/)
*   [WebSocket/STOMP 프로토콜을 사용한 실시간 대화형 웹 앱 개발](https://spring.io/guides/gs/messaging-stomp-websocket/)
*   [Spring Data JPA 기반 데이터 관리](https://spring.io/guides/gs/accessing-data-jpa/)

---

## 3. 유용한 유틸리티 (Additional Links)
*   [Gradle Build Scans – 그래들 빌드 성능 정밀 진단 및 통계 분석](https://scans.gradle.com#gradle)

---

## 4. Docker Compose 로컬 인프라 지원
본 프로젝트는 로컬 개발 인프라 편의성을 위해 `compose.yaml`을 포함하고 있습니다.
기본 설정으로 다음 서비스가 연동되어 자동으로 활성화됩니다:

*   **PostgreSQL 데이터베이스**: [`postgres:latest`](https://hub.docker.com/_/postgres)

> [!WARNING]
> 상용 환경으로 배포하기 전에 `compose.yaml`에 명시된 PostgreSQL 및 인프라 이미지 태그와 비밀번호가 프로덕션 사양에 정확히 부합하는지 반드시 재점검하십시오.
