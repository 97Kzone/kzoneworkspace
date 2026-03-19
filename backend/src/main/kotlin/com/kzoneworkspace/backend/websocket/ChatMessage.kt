package com.kzoneworkspace.backend.websocket

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "chat_messages")
class ChatMessage(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    var id: Long? = null,

    @Column(nullable = false)
    var roomId: String = "",

    @Column(nullable = false)
    var senderId: String = "",

    @Column(nullable = false)
    var senderName: String = "",

    @Column(columnDefinition = "TEXT", nullable = false)
    var content: String = "",

    @Enumerated(EnumType.STRING)
    var type: MessageType = MessageType.CHAT,

    @Column(nullable = false)
    var timestamp: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onPrePersist() {
        // Redundant but safe for JPA
    }
}

enum class MessageType {
    CHAT,       // 일반 채팅
    SYSTEM,     // 시스템 메시지 (입장/퇴장)
    AGENT,      // 에이전트 응답
    COMMAND,    // 업무 지시
    TOOL,       // 도구 사용 및 결과
    THINKING,   // 에이전트 추론 과정
    WHITEBOARD_UPDATE, // 화이트보드 업데이트
    BROWSER_UPDATE, // 실시간 브라우저 시각화 업데이트
    COLLABORATION // 에이전트 간 협업 이벤트
}