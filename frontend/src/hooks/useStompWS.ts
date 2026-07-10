import { useEffect, useCallback } from "react";
import { createWebSocketClient } from "../app/apiService";

/**
 * WebSocket(STOMP) 연결 및 이벤트 구독을 관리하는 커스텀 훅
 */
export const useStompWS = (
  stompClientRef: React.MutableRefObject<any>,
  setMessages: any,
  setTasks: any,
  setAgents: any,
  setActivities: any,
  setPerformanceData: any,
  setActiveConnections: any,
  setActiveChat: any,
  setActivePreviews: any,
  setShowHealingToast: any,
  setCognitiveTraces: any,
  setActiveCollaborations: any,
  setIsIntelligenceBoosted: any,
  fetchInitialData: any,
  setLiveEvaluation?: any,
  setAllocatedItems?: any,
  setAssetLogs?: any,
  setStrategicRecommendations?: any
) => {
  /**
   * WebSocket 서버에 연결하고 각 토픽을 구독하는 함수
   */
  const setupWebSocket = useCallback(() => {
    stompClientRef.current = createWebSocketClient();
    
    stompClientRef.current.onConnect = (frame: any) => {
      console.log('WebSocket 연결 성공:', frame);
      
      // 중복 수신 메시지 필터링 유틸
      const handleIncomingMessage = (msgBody: any) => {
        setMessages((prev: any) => {
          if (msgBody.id && prev.some((m: any) => m.id === msgBody.id)) {
            return prev;
          }
          const isDuplicate = prev.some((m: any) => {
            const sameContent = m.content === msgBody.content && m.senderName === msgBody.senderName;
            if (sameContent) {
              const t1 = new Date(m.timestamp || m.createdAt).getTime();
              const t2 = new Date(msgBody.timestamp || msgBody.createdAt).getTime();
              if (!isNaN(t1) && !isNaN(t2) && Math.abs(t1 - t2) < 3000) {
                return true;
              }
            }
            return false;
          });
          if (isDuplicate) return prev;
          return [...prev, msgBody];
        });
      };

      // 전역 메시지 구독
      stompClientRef.current.subscribe('/topic/messages', (msg: any) => {
        const body = JSON.parse(msg.body);
        handleIncomingMessage(body);
      });

      stompClientRef.current.subscribe('/topic/public', (msg: any) => {
        const body = JSON.parse(msg.body);
        handleIncomingMessage(body);
      });

      // 태스크 업데이트 구독
      stompClientRef.current.subscribe('/topic/tasks', (msg: any) => {
        const body = JSON.parse(msg.body);
        setTasks((prev: any) => {
          const idx = prev.findIndex((t: any) => t.id === body.id);
          if (idx !== -1) {
            const newTasks = [...prev];
            newTasks[idx] = body;
            return newTasks;
          }
          return [...prev, body];
        });
      });

      // 에이전트 상태 업데이트 구독
      stompClientRef.current.subscribe('/topic/agents', (msg: any) => {
        const body = JSON.parse(msg.body);
        if (Array.isArray(body)) {
          setAgents(body);
        } else {
          setAgents((prev: any) => {
            const idx = prev.findIndex((a: any) => a.id === body.id);
            if (idx !== -1) {
                const newAgents = [...prev];
                newAgents[idx] = body;
                return newAgents;
            }
            return [...prev, body];
          });
        }
      });

      // 에이전트 활동 로그 구독
      stompClientRef.current.subscribe('/topic/activities', (msg: any) => {
        const body = JSON.parse(msg.body);
        setActivities((prev: any) => [body, ...prev].slice(0, 100));
      });

      // 팀 성능 데이터 구독
      stompClientRef.current.subscribe('/topic/performance', (msg: any) => {
        setPerformanceData(JSON.parse(msg.body));
      });

      // 에이전트 간 연결(상호작용) 구독
      stompClientRef.current.subscribe('/topic/connections', (msg: any) => {
          const body = JSON.parse(msg.body);
          const from = body.from || body.source;
          const to = body.to || body.target;
          
          setActiveConnections((prev: any) => {
            const exists = prev.find((c: any) => c.from === from && c.to === to);
            if (exists) return prev;
            return [...prev, { from, to, status: body.status, timestamp: Date.now() }];
          });
          
          // 3초 후 연결 표시 제거
          setTimeout(() => {
            setActiveConnections((prev: any) => prev.filter((c: any) => !(c.from === from && c.to === to)));
          }, 3000);
      });

      // 도구 사용 프리뷰 구독
      stompClientRef.current.subscribe('/topic/tool-preview', (msg: any) => {
        const body = JSON.parse(msg.body);
        setActivePreviews((prev: any) => ({
          ...prev,
          [body.agentName]: body.toolName === 'thinking_end' || body.status === 'END' ? null : body
        }));
      });

      // 자율 복구(Self-Healing) 알림 구독
      stompClientRef.current.subscribe('/topic/healing-alert', (msg: any) => {
        const message = msg.body;
        setShowHealingToast(message);
        setTimeout(() => setShowHealingToast(null), 5000);
      });

      // 인지 추적(Cognitive Trace) 데이터 구독
      stompClientRef.current.subscribe('/topic/cognitive-traces', (msg: any) => {
        const body = JSON.parse(msg.body);
        setCognitiveTraces((prev: any) => [body, ...prev].slice(0, 50));
      });

      // 에이전트 협업 상태 구독
      stompClientRef.current.subscribe('/topic/collaborations', (msg: any) => {
        const body = JSON.parse(msg.body);
        const agentName = body.from || body.agentName;
        const targetAgentName = body.status === 'END' ? null : (body.to || body.targetAgentName);

        setActiveCollaborations((prev: any) => ({
          ...prev,
          [agentName]: targetAgentName
        }));
        
        if (targetAgentName === null) {
          setTimeout(() => {
             setActiveCollaborations((prev: any) => {
               const newState = { ...prev };
               delete newState[agentName];
               return newState;
             });
          }, 2000);
        }
      });

      // 지식 부스트(인텔리전스 공유) 알림 구독
      stompClientRef.current.subscribe('/topic/intelligence-boost', (msg: any) => {
          let intelId = msg.body;
          try {
              const body = JSON.parse(msg.body);
              intelId = body.agentName || msg.body;
          } catch (e) {
              // JSON 형식이 아닌 경우 그대로 사용
          }
          setIsIntelligenceBoosted((prev: any) => ({ ...prev, [intelId]: true }));
          setTimeout(() => {
              setIsIntelligenceBoosted((prev: any) => ({ ...prev, [intelId]: false }));
          }, 3000);
      });

      // 벤치마킹 실시간 평가 구독
      stompClientRef.current.subscribe('/topic/evaluations', (msg: any) => {
          const body = JSON.parse(msg.body);
          if (setLiveEvaluation) {
              setLiveEvaluation(body);
          }
      });

      // 가상 오피스 컴퓨팅 자산 실시간 구독
      stompClientRef.current.subscribe('/topic/office', (msg: any) => {
          const body = JSON.parse(msg.body);
          if (setAllocatedItems) {
              setAllocatedItems(body);
          }
      });

      // 가상 오피스 컴퓨팅 자산 가동/배치 실시간 로그 구독
      stompClientRef.current.subscribe('/topic/office/logs', (msg: any) => {
          const body = JSON.parse(msg.body);
          if (setAssetLogs) {
              setAssetLogs(body);
          }
      });

      // 전략 위원회 권고안 실시간 구독
      stompClientRef.current.subscribe('/topic/strategic-recommendations', (msg: any) => {
          const body = JSON.parse(msg.body);
          if (setStrategicRecommendations) {
              setStrategicRecommendations(body);
          }
      });
    };

    stompClientRef.current.activate();
  }, [stompClientRef, setMessages, setTasks, setAgents, setActivities, setPerformanceData, setActiveConnections, setActivePreviews, setShowHealingToast, setCognitiveTraces, setActiveCollaborations, setIsIntelligenceBoosted, setLiveEvaluation, setAllocatedItems, setAssetLogs, setStrategicRecommendations]);

  useEffect(() => {
    fetchInitialData();
    setupWebSocket();
    return () => {
      if (stompClientRef.current) stompClientRef.current.deactivate();
    };
  }, [fetchInitialData, setupWebSocket, stompClientRef]);
};
