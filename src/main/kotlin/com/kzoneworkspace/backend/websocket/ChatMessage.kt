package com.kzoneworkspace.backend.websocket

data class ChatMessage(
    val roomId: String,
    val senderId: String,
    val senderName: String,
    val content: String,
    val type: MessageType,
    val timestamp: Long? = System.currentTimeMillis()
)

enum class MessageType {
    CHAT,       // 일반 채팅
    SYSTEM,     // 시스템 메시지 (입장/퇴장)
    AGENT,      // 에이전트 응답
    COMMAND     // 업무 지시
}