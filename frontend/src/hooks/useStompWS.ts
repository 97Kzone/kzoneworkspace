import { useEffect, useCallback } from "react";
import { createWebSocketClient } from "../app/apiService";

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
  fetchInitialData: any
) => {
  const setupWebSocket = useCallback(() => {
    stompClientRef.current = createWebSocketClient();
    
    stompClientRef.current.onConnect = (frame: any) => {
      console.log('WS Connected:', frame);
      
      stompClientRef.current.subscribe('/topic/messages', (msg: any) => {
        const body = JSON.parse(msg.body);
        setMessages((prev: any) => [...prev, body]);
      });

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

      stompClientRef.current.subscribe('/topic/agents', (msg: any) => {
        const body = JSON.parse(msg.body);
        setAgents((prev: any) => {
          const idx = prev.findIndex((a: any) => a.id === body.id);
          if (idx !== -1) {
              const newAgents = [...prev];
              newAgents[idx] = body;
              return newAgents;
          }
          return [...prev, body];
        });
      });

      stompClientRef.current.subscribe('/topic/activities', (msg: any) => {
        const body = JSON.parse(msg.body);
        setActivities((prev: any) => [body, ...prev].slice(0, 100));
      });

      stompClientRef.current.subscribe('/topic/performance', (msg: any) => {
        setPerformanceData(JSON.parse(msg.body));
      });

      stompClientRef.current.subscribe('/topic/connections', (msg: any) => {
          const body = JSON.parse(msg.body);
          setActiveConnections((prev: any) => {
            const exists = prev.find((c: any) => c.from === body.from && c.to === body.to);
            if (exists) return prev;
            return [...prev, { ...body, timestamp: Date.now() }];
          });
          
          setTimeout(() => {
            setActiveConnections((prev: any) => prev.filter((c: any) => !(c.from === body.from && c.to === body.to)));
          }, 3000);
      });

      stompClientRef.current.subscribe('/topic/tool-preview', (msg: any) => {
        const body = JSON.parse(msg.body);
        setActivePreviews((prev: any) => ({
          ...prev,
          [body.agentName]: body.toolName === 'thinking_end' ? null : body
        }));
      });

      stompClientRef.current.subscribe('/topic/healing-alert', (msg: any) => {
        const message = msg.body;
        setShowHealingToast(message);
        setTimeout(() => setShowHealingToast(null), 5000);
      });

      stompClientRef.current.subscribe('/topic/cognitive-traces', (msg: any) => {
        const body = JSON.parse(msg.body);
        setCognitiveTraces((prev: any) => [body, ...prev].slice(0, 50));
      });

      stompClientRef.current.subscribe('/topic/collaborations', (msg: any) => {
        const body = JSON.parse(msg.body);
        setActiveCollaborations((prev: any) => ({
          ...prev,
          [body.agentName]: body.targetAgentName
        }));
        
        if (body.targetAgentName === null) {
          setTimeout(() => {
             setActiveCollaborations((prev: any) => {
               const newState = { ...prev };
               delete newState[body.agentName];
               return newState;
             });
          }, 2000);
        }
      });

      stompClientRef.current.subscribe('/topic/intelligence-boost', (msg: any) => {
          const intelId = msg.body;
          setIsIntelligenceBoosted((prev: any) => ({ ...prev, [intelId]: true }));
          setTimeout(() => {
              setIsIntelligenceBoosted((prev: any) => ({ ...prev, [intelId]: false }));
          }, 3000);
      });
    };

    stompClientRef.current.activate();
  }, [stompClientRef, setMessages, setTasks, setAgents, setActivities, setPerformanceData, setActiveConnections, setActivePreviews, setShowHealingToast, setCognitiveTraces, setActiveCollaborations, setIsIntelligenceBoosted]);

  useEffect(() => {
    fetchInitialData();
    setupWebSocket();
    return () => {
      if (stompClientRef.current) stompClientRef.current.deactivate();
    };
  }, [fetchInitialData, setupWebSocket, stompClientRef]);
};
