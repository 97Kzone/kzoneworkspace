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
    var timestamp: LocalDateTime? = null
) {
    @PrePersist
    fun onPrePersist() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now()
        }
    }
}

enum class MessageType {
    CHAT,       // 일반 채팅
    SYSTEM,     // 시스템 메시지 (입장/퇴장)
    AGENT,      // 에이전트 응답
    COMMAND,    // 업무 지시
    TOOL        // 도구 사용 및 결과
}