package com.kzoneworkspace.backend.websocket

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "chat_messages")
data class ChatMessage(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: Long? = null,

    @Column(nullable = false)
    val roomId: String,

    @Column(nullable = false)
    val senderId: String,

    @Column(nullable = false)
    val senderName: String,

    @Column(columnDefinition = "TEXT", nullable = false)
    val content: String,

    @Enumerated(EnumType.STRING)
    val type: MessageType,

    val timestamp: LocalDateTime? = LocalDateTime.now()
)

enum class MessageType {
    CHAT,       // 일반 채팅
    SYSTEM,     // 시스템 메시지 (입장/퇴장)
    AGENT,      // 에이전트 응답
    COMMAND     // 업무 지시
}