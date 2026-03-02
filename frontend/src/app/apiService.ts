import axios from 'axios';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const API_BASE_URL = 'http://localhost:9000/api';
const WS_URL = 'http://localhost:9000/ws';

export const api = axios.create({
    baseURL: API_BASE_URL,
});

export interface Agent {
    id: number;
    name: string;
    role: string;
    status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'ERROR';
    provider: string;
    model: string;
}

export interface Task {
    id: number;
    roomId: string;
    command: string;
    result: string | null;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    agent: Agent | null;
}

export interface ChatMessage {
    id?: number;
    roomId: string;
    senderId: string;
    senderName: string;
    content: string;
    type: 'CHAT' | 'SYSTEM' | 'AGENT' | 'COMMAND';
    timestamp?: string;
}

export const agentService = {
    getAll: () => api.get<Agent[]>('/agents'),
    createAgent: (agentData: any) => api.post<Agent>('/agents', agentData),
};

export const taskService = {
    getByRoom: (roomId: String) => api.get<Task[]>(`/tasks?roomId=${roomId}`),
};

export const chatService = {
    getHistory: (roomId: String) => api.get<ChatMessage[]>(`/chat/history?roomId=${roomId}`),
};

export const createWebSocketClient = (onMessageReceived: (msg: ChatMessage) => void) => {
    const client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        debug: (str) => {
            console.log('WS Debug:', str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
        console.log('Connected to WebSocket');
        client.subscribe('/topic/public', (message) => {
            onMessageReceived(JSON.parse(message.body));
        });
    };

    client.onStompError = (frame) => {
        console.error('STOMP Error:', frame.headers['message']);
    };

    return client;
};
