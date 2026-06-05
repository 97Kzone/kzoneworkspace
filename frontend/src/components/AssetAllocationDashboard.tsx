"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Cpu, Layers, Search, ShieldCheck, Zap, User, Trash2, 
  Loader2, CheckCircle2, AlertTriangle, RefreshCw, Server, ArrowRight,
  Info, X, Network, List, Bot
} from "lucide-react";
import { 
  agentService, officeService, Agent, OfficeItem 
} from "../app/apiService";
import { getAgentColor } from "../utils/agentColors";

interface ComputationalAsset {
  id: string;
  name: string;
  type: string;
  description: string;
  price: number;
  icon: React.ReactNode;
  color: string;
}

interface AssetAllocationDashboardProps {
  agents?: Agent[];
  allocatedItems?: OfficeItem[];
  setAgents?: React.Dispatch<React.SetStateAction<Agent[]>>;
  setAllocatedItems?: React.Dispatch<React.SetStateAction<OfficeItem[]>>;
  fetchInitialData?: () => Promise<void>;
}

export const AssetAllocationDashboard: React.FC<AssetAllocationDashboardProps> = ({
  agents: propsAgents,
  allocatedItems: propsAllocatedItems,
  setAgents: propsSetAgents,
  setAllocatedItems: propsSetAllocatedItems,
  fetchInitialData
}) => {
  const [localAgents, setLocalAgents] = useState<Agent[]>([]);
  const [localAllocatedItems, localSetAllocatedItems] = useState<OfficeItem[]>([]);
  const [loading, setLoading] = useState(!propsAgents);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<number | "">("");
  
  // 우측 영역 탭 전환 상태 및 선택된 자산 상세 보기 상태
  const [activeTabRight, setActiveTabRight] = useState<'topology' | 'list'>('topology');
  const [selectedAssetDetail, setSelectedAssetDetail] = useState<OfficeItem | null>(null);

  // Props가 있으면 우선 사용하고 없으면 로컬 상태를 폴백으로 사용
  const agents = propsAgents !== undefined ? propsAgents : localAgents;
  const allocatedItems = propsAllocatedItems !== undefined ? propsAllocatedItems : localAllocatedItems;
  
  // 성공/실패 알림 상태
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 현재 선택된 에이전트 상세 객체 및 할당된 자산 필터링
  const selectedAgent = useMemo(() => {
    return agents.find(a => a.id === selectedAgentId);
  }, [agents, selectedAgentId]);

  const allocatedItemsForAgent = useMemo(() => {
    return allocatedItems.filter(item => item.agentId === selectedAgentId);
  }, [allocatedItems, selectedAgentId]);

  // 제공되는 컴퓨팅 자산 정의
  const availableAssets: ComputationalAsset[] = [
    {
      id: "reasoning_core",
      name: "고성능 추론 가속 코어",
      type: "REASONING_CORE",
      description: "고부하 추론 처리를 위한 GPU 가속 컴퓨팅 코어를 추가 할당합니다.",
      price: 150,
      icon: <Cpu size={20} />,
      color: "from-indigo-500 to-cyan-500"
    },
    {
      id: "extended_context",
      name: "대용량 컨텍스트 메모리 확장",
      type: "EXTENDED_CONTEXT",
      description: "Context Window를 최대 128k로 확장하고 세션 캐싱 메모리를 확보합니다.",
      price: 100,
      icon: <Layers size={20} />,
      color: "from-purple-500 to-pink-500"
    },
    {
      id: "vector_search",
      name: "실시간 벡터 지식 검색 세션",
      type: "VECTOR_SEARCH",
      description: "에이전트 단/장기 기억 검색의 정확도를 높이고 시맨틱 검색 속도를 극대화합니다.",
      price: 80,
      icon: <Search size={20} />,
      color: "from-emerald-500 to-teal-500"
    },
    {
      id: "auxiliary_instance",
      name: "보조 추론 및 자가 치유 인스턴스",
      type: "AUXILIARY_INSTANCE",
      description: "다중 스레드 병렬 연산을 지원하여 로직 검증 및 자가 치유 레이턴시를 단축합니다.",
      price: 200,
      icon: <ShieldCheck size={20} />,
      color: "from-amber-500 to-orange-500"
    }
  ];

  const fetchData = async () => {
    // Props로 초기 데이터 로딩 함수가 넘어오면 이를 사용
    if (fetchInitialData) {
      setLoading(true);
      try {
        await fetchInitialData();
      } catch (e) {
        console.error("자산 배치 데이터 로딩 실패:", e);
        setErrorMessage("백엔드 데이터를 로드하지 못했습니다.");
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const [agentRes, officeRes] = await Promise.all([
        agentService.getAll(),
        officeService.getAll()
      ]);
      
      if (propsSetAgents) {
        propsSetAgents(agentRes.data);
      } else {
        setLocalAgents(agentRes.data);
      }

      if (propsSetAllocatedItems) {
        propsSetAllocatedItems(officeRes.data);
      } else {
        localSetAllocatedItems(officeRes.data);
      }
      
      if (agentRes.data.length > 0 && selectedAgentId === "") {
        setSelectedAgentId(agentRes.data[0].id);
      }
    } catch (e) {
      console.error("자산 배치 데이터 로딩 실패:", e);
      setErrorMessage("백엔드 데이터를 로드하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (agents.length > 0 && selectedAgentId === "") {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  useEffect(() => {
    if (!propsAgents) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [propsAgents]);

  // 특정 자산을 에이전트에 할당 (배치)
  const handleAllocateAsset = async (asset: ComputationalAsset) => {
    if (!selectedAgentId) {
      setErrorMessage("자산을 할당할 에이전트를 먼저 선택해 주세요.");
      return;
    }

    const agent = agents.find(a => a.id === selectedAgentId);
    if (!agent) return;

    if (agent.contributionPoints < asset.price) {
      setErrorMessage(`'${agent.name}' 에이전트의 성공 기여도(현재: ${agent.contributionPoints} pts)가 부족합니다. 자산 배치에 ${asset.price} pts가 필요합니다.`);
      return;
    }

    setActionLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      // API call: allocateAsset
      await officeService.allocateAsset({
        agentId: Number(selectedAgentId),
        name: asset.name,
        type: asset.type,
        x: Math.floor(Math.random() * 100), // 가상 좌표
        y: Math.floor(Math.random() * 100),
        price: asset.price
      });

      setSuccessMessage(`에이전트 '${agent.name}'에 '${asset.name}' 자산 배치를 성공적으로 완료하였습니다!`);
      setTimeout(() => setSuccessMessage(null), 5000);
      
      // 재조회
      await fetchData();
    } catch (e: any) {
      console.error(e);
      const errMsg = e.response?.data?.message || "자산 할당 중 오류가 발생했습니다. 백엔드 에러를 확인하세요.";
      setErrorMessage(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // 할당된 자산 회수 (반환)
  const handleRevokeAsset = async (itemId: number, assetName: string, agentName: string) => {
    if (!confirm(`'${agentName}' 에이전트에 배치된 '${assetName}' 자원을 정말 회수하시겠습니까?`)) {
      return;
    }

    setActionLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    setSelectedAssetDetail(null); // 모달/디테일 뷰 닫기

    try {
      await officeService.deleteItem(itemId);
      setSuccessMessage(`'${agentName}'의 '${assetName}' 자원을 정상적으로 회수 및 반환 조치하였습니다.`);
      setTimeout(() => setSuccessMessage(null), 5000);
      
      // 재조회
      await fetchData();
    } catch (e: any) {
      console.error(e);
      setErrorMessage("자원 회수 처리 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  // 통계 계산
  const metrics = useMemo(() => {
    const totalPoints = agents.reduce((acc, a) => acc + a.contributionPoints, 0);
    const totalAssets = allocatedItems.length;
    const avgReliability = agents.length > 0 
      ? Math.round(agents.reduce((acc, a) => acc + a.reliabilityIndex, 0) / agents.length)
      : 0;

    return {
      totalPoints,
      totalAssets,
      avgReliability
    };
  }, [agents, allocatedItems]);

  // 자산 카드 스타일 및 정보 맵
  const getAssetStyle = (type: string) => {
    switch (type) {
      case "REASONING_CORE":
        return {
          bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
          stroke: "#6366f1",
          spec: "최대 추론 단계 확장 (10회 -> 15회), Strict Temp 0.1 적용",
          icon: <Cpu size={16} />
        };
      case "EXTENDED_CONTEXT":
        return {
          bg: "bg-purple-500/10 text-purple-400 border-purple-500/30",
          stroke: "#a855f7",
          spec: "Context Window 128k 확장, RAG 청크 스캔 확장 (5개 -> 15개)",
          icon: <Layers size={16} />
        };
      case "VECTOR_SEARCH":
        return {
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          stroke: "#10b981",
          spec: "장기 기억 스캔 깊이 확대 (2개 -> 10개), 실시간 벡터 RAG 가속",
          icon: <Search size={16} />
        };
      case "AUXILIARY_INSTANCE":
        return {
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          stroke: "#f59e0b",
          spec: "자가 치유(Self-Healing) 및 다중 스레드 병렬 코드 검증 활성화",
          icon: <ShieldCheck size={16} />
        };
      default:
        return {
          bg: "bg-slate-500/10 text-slate-400 border-slate-500/30",
          stroke: "#64748b",
          spec: "지정된 사양 없음",
          icon: <Zap size={16} />
        };
    }
  };

  if (loading && agents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900 rounded-[2.5rem] p-10 border border-slate-800">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-indigo-400" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">생산성 자산 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-hidden bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl relative">
      
      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none z-0"></div>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 pb-6 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white flex items-center justify-center shadow-lg">
            <Server size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight uppercase flex items-center gap-2">
              생산성 컴퓨팅 자산 배치 대시보드
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              에이전트별 기여도를 바탕으로 고성능 컴퓨팅 리소스를 합리적으로 할당 및 운영합니다.
            </p>
          </div>
        </div>

        {/* 에이전트 퀵 셀렉터 */}
        <div className="flex items-center gap-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">배치 대상 에이전트:</label>
          <select 
            value={selectedAgentId} 
            onChange={(e) => {
              setSelectedAgentId(e.target.value === "" ? "" : Number(e.target.value));
              setSelectedAssetDetail(null);
            }}
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            {agents.map(a => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.role.split(' ')[0]} - 기여도: {a.contributionPoints} pts)
              </option>
            ))}
          </select>
          <button 
            onClick={fetchData} 
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            title="데이터 새로고침"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* 실시간 알림 피드백 배너 */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-5 py-4 rounded-2xl flex items-center gap-3 text-xs font-bold relative z-20"
          >
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-5 py-4 rounded-2xl flex items-center gap-3 text-xs font-bold relative z-20"
          >
            <AlertTriangle size={18} className="text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI 카운터 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0 relative z-10">
        {[
          { label: "군집 총 성공 기여도 지수", val: `${metrics.totalPoints} pts`, desc: "모든 에이전트가 축적한 생산성 기여 지표" },
          { label: "총 배치된 컴퓨팅 자산", val: `${metrics.totalAssets} 개`, desc: "현재 실시간 작동 중인 연산 자원 수량" },
          { label: "군집 평균 인지 신뢰도", val: `${metrics.avgReliability}%`, desc: "에이전트 인지 사고의 정합성 일관도 평균" }
        ].map((item, idx) => (
          <div key={idx} className="bg-slate-800/40 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
            <span className="text-3xl font-black text-white italic my-3">{item.val}</span>
            <span className="text-[9px] font-bold text-slate-400">{item.desc}</span>
          </div>
        ))}
      </div>

      {/* Main Grid: Left (Asset Options) & Right (Topology or List) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden relative z-10">
        
        {/* Left: Available Assets to Allocate (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar-dark">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
            배치 가능한 고성능 컴퓨팅 자산
          </h4>
          
          <div className="grid grid-cols-1 gap-4">
            {availableAssets.map((asset) => {
              const currentAgent = agents.find(a => a.id === selectedAgentId);
              const isAffordable = currentAgent ? currentAgent.contributionPoints >= asset.price : false;

              return (
                <motion.div
                  key={asset.id}
                  whileHover={{ x: 4 }}
                  className="bg-slate-800/40 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 p-5 rounded-3xl flex items-center justify-between gap-6 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${asset.color} text-white flex items-center justify-center shadow-lg shrink-0`}>
                      {asset.icon}
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-white uppercase">{asset.name}</h5>
                      <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">{asset.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[8px] font-black text-slate-500 uppercase">필요 기여도</span>
                      <p className="text-lg font-black text-indigo-400 italic leading-none mt-0.5">{asset.price} pts</p>
                    </div>
                    
                    <button
                      onClick={() => handleAllocateAsset(asset)}
                      disabled={actionLoading || !selectedAgentId}
                      className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                        isAffordable 
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg active:scale-95 cursor-pointer" 
                          : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                      }`}
                    >
                      배치 할당
                      <ArrowRight size={10} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right: Interactive Topology & Spec details (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-4 overflow-hidden bg-slate-950/20 rounded-[2rem] border border-slate-800/60 p-6">
          <div className="flex items-center justify-between shrink-0 border-b border-white/5 pb-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
              <Server size={12} className="text-indigo-400" />
              배치 자원 모니터링
            </h4>

            {/* 우측 뷰 탭 전환 버튼 */}
            <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800">
              <button 
                onClick={() => setActiveTabRight('topology')}
                className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${activeTabRight === 'topology' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <Network size={10} />
                토폴로지 맵
              </button>
              <button 
                onClick={() => setActiveTabRight('list')}
                className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${activeTabRight === 'list' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <List size={10} />
                자산 목록
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4 overflow-hidden relative">
            {activeTabRight === 'topology' ? (
              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                {/* SVG Topology Visualization Container */}
                <div className="relative w-full h-[220px] bg-slate-950/40 rounded-3xl border border-slate-800/80 overflow-hidden flex items-center justify-center">
                  {/* Grid overlay for tech look */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>

                  {allocatedItemsForAgent.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 text-slate-600 text-center px-4">
                      <Network size={36} className="stroke-1 animate-pulse" />
                      <p className="text-[10px] font-black uppercase tracking-widest">할당된 생산성 자산이 없습니다.</p>
                      <p className="text-[9px] font-bold text-slate-500 max-w-[200px] leading-relaxed">왼쪽 리스트에서 연산 가속 자원을 할당하면 여기에 실시간 토폴로지가 활성화됩니다.</p>
                    </div>
                  ) : (
                    <svg className="w-full h-full" viewBox="0 0 400 220">
                      {/* Definitions for gradients */}
                      <defs>
                        <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                        </radialGradient>
                      </defs>

                      {/* Center Pulse Glow */}
                      <circle cx="200" cy="110" r="60" fill="url(#centerGlow)" />

                      {/* Connecting Flow Lines */}
                      {allocatedItemsForAgent.map((item, idx) => {
                        const angle = (idx * 2 * Math.PI) / allocatedItemsForAgent.length;
                        const x = 200 + 85 * Math.cos(angle);
                        const y = 110 + 85 * Math.sin(angle);
                        const style = getAssetStyle(item.type);

                        return (
                          <g key={`line-${item.id}`}>
                            {/* Static line */}
                            <line 
                              x1="200" y1="110" x2={x} y2={y} 
                              stroke={style.stroke} strokeWidth="1.5" strokeOpacity="0.15" 
                            />
                            {/* Flowing particle dash line */}
                            <motion.line
                              x1="200" y1="110" x2={x} y2={y}
                              stroke={style.stroke} strokeWidth="2" strokeOpacity="0.6"
                              strokeDasharray="5 5"
                              animate={{ strokeDashoffset: [0, -20] }}
                              transition={{ repeat: Infinity, ease: "linear", duration: 1.8 }}
                            />
                          </g>
                        );
                      })}

                      {/* Orbit Line */}
                      <circle cx="200" cy="110" r="85" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3 6" opacity="0.4" />

                      {/* Satellite Nodes */}
                      {allocatedItemsForAgent.map((item, idx) => {
                        const angle = (idx * 2 * Math.PI) / allocatedItemsForAgent.length;
                        const x = 200 + 85 * Math.cos(angle);
                        const y = 110 + 85 * Math.sin(angle);
                        const style = getAssetStyle(item.type);

                        return (
                          <motion.g
                            key={item.id}
                            initial={{ scale: 0, x: 200, y: 110 }}
                            animate={{ scale: 1, x: x, y: y }}
                            transition={{ type: "spring", stiffness: 80, delay: idx * 0.05 }}
                            whileHover={{ scale: 1.15 }}
                            className="cursor-pointer"
                            onClick={() => setSelectedAssetDetail(item)}
                          >
                            <circle cx="0" cy="0" r="16" fill="#0f172a" stroke={style.stroke} strokeWidth="2" />
                            {/* Pulsing ring */}
                            <motion.circle
                              cx="0" cy="0" r="20"
                              fill="none" stroke={style.stroke} strokeWidth="1" strokeOpacity="0.4"
                              animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0, 0.4] }}
                              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                            />
                            {/* Custom foreignobject to host Lucide icons cleanly */}
                            <foreignObject x="-9" y="-9" width="18" height="18" className="pointer-events-none">
                              <div className="w-full h-full flex items-center justify-center text-white" style={{ color: style.stroke }}>
                                {style.icon}
                              </div>
                            </foreignObject>
                          </motion.g>
                        );
                      })}

                      {/* Central Agent Node */}
                      <g className="cursor-pointer" onClick={() => setSelectedAssetDetail(null)}>
                        <circle cx="200" cy="110" r="28" fill="#1e1b4b" stroke="#818cf8" strokeWidth="3" />
                        <motion.circle 
                          cx="200" cy="110" r="34" 
                          fill="none" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.5"
                          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        />
                        <foreignObject x="-14" y="-14" width="28" height="28" transform="translate(200, 110) scale(0.9)" className="pointer-events-none">
                          <div className="w-full h-full flex items-center justify-center text-indigo-300">
                            <Bot size={20} />
                          </div>
                        </foreignObject>
                      </g>
                    </svg>
                  )}

                  {/* Dynamic Asset Info Overlay (Inside Topology Container) */}
                  <AnimatePresence>
                    {selectedAssetDetail && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-3 left-3 right-3 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xl z-20"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="text-indigo-400">
                              {getAssetStyle(selectedAssetDetail.type).icon}
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              배치 사양 분석
                            </span>
                          </div>
                          <h5 className="text-xs font-black text-white truncate">{selectedAssetDetail.name}</h5>
                          <p className="text-[9px] font-bold text-slate-400 leading-normal mt-1">
                            {getAssetStyle(selectedAssetDetail.type).spec}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleRevokeAsset(
                              selectedAssetDetail.id, 
                              selectedAssetDetail.name, 
                              selectedAgent?.name || "미지정"
                            )}
                            className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors active:scale-95"
                          >
                            회수
                          </button>
                          <button
                            onClick={() => setSelectedAssetDetail(null)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition-colors"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 에이전트 인지 한계 스펙 시트 (Cognitive Acceleration Spec Sheet) */}
                <div className="bg-slate-900/40 rounded-3xl border border-slate-800 p-5 flex flex-col gap-3 relative">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <Info size={12} className="text-indigo-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      에이전트 인지 한계 분석 시트
                    </span>
                  </div>

                  {selectedAgent ? (
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">인공지능 모델</span>
                        <span className="font-bold text-indigo-300 italic px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">{selectedAgent.model}</span>
                      </div>

                      {/* Spec item: Reasoning Loop */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">최대 추론 루프 단계</span>
                        <div className="flex items-center gap-2 font-bold text-white">
                          <span>10회</span>
                          <ArrowRight size={10} className="text-slate-600" />
                          <span className={allocatedItemsForAgent.some(item => item.type === "REASONING_CORE") ? "text-indigo-400 animate-pulse" : "text-slate-500"}>
                            {allocatedItemsForAgent.some(item => item.type === "REASONING_CORE") ? "15회 (가속 활성)" : "10회 (기본)"}
                          </span>
                        </div>
                      </div>

                      {/* Spec item: RAG Window size */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">컨텍스트 RAG 스캔 깊이</span>
                        <div className="flex items-center gap-2 font-bold text-white">
                          <span>5개</span>
                          <ArrowRight size={10} className="text-slate-600" />
                          <span className={allocatedItemsForAgent.some(item => item.type === "EXTENDED_CONTEXT") ? "text-purple-400 animate-pulse" : "text-slate-500"}>
                            {allocatedItemsForAgent.some(item => item.type === "EXTENDED_CONTEXT") ? "15개 (128k 확장)" : "5개 (기본)"}
                          </span>
                        </div>
                      </div>

                      {/* Spec item: Long-term Memories search */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">기억 연출 조회수</span>
                        <div className="flex items-center gap-2 font-bold text-white">
                          <span>2개</span>
                          <ArrowRight size={10} className="text-slate-600" />
                          <span className={allocatedItemsForAgent.some(item => item.type === "VECTOR_SEARCH") ? "text-emerald-400 animate-pulse" : "text-slate-500"}>
                            {allocatedItemsForAgent.some(item => item.type === "VECTOR_SEARCH") ? "10개 (실시간 벡터)" : "2개 (기본)"}
                          </span>
                        </div>
                      </div>

                      {/* Spec item: Self Healing check */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">자가 치유 (Self-Healing)</span>
                        <span className={`font-bold ${allocatedItemsForAgent.some(item => item.type === "AUXILIARY_INSTANCE") ? "text-amber-400 animate-pulse" : "text-slate-500"}`}>
                          {allocatedItemsForAgent.some(item => item.type === "AUXILIARY_INSTANCE") ? "병렬 보조 스레드 상시 검증 중" : "일반 추론 단독 수행"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 text-center py-4 font-bold uppercase">분석 에이전트를 상단에서 선택하십시오.</p>
                  )}
                </div>
              </div>
            ) : (
              // Asset List tab view (original list view with refined styles)
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar-dark space-y-4">
                {allocatedItems.length === 0 ? (
                  <div className="h-full border border-dashed border-slate-800 rounded-[2rem] flex flex-col items-center justify-center text-slate-600 gap-4 py-20">
                    <Server size={40} className="stroke-1" />
                    <p className="text-[10px] font-black uppercase tracking-widest">배치 활성화된 자산이 없습니다.</p>
                  </div>
                ) : (
                  allocatedItems.map((item) => {
                    const holdingAgent = agents.find(a => a.id === item.agentId);
                    const agentColor = holdingAgent ? getAgentColor(holdingAgent.name) : { bg: "bg-slate-700" };
                    const style = getAssetStyle(item.type);

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-black/20 border border-slate-800 p-5 rounded-3xl flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">컴퓨팅 자원 운영 중</span>
                          </div>
                          
                          <h5 className="text-xs font-black text-white truncate uppercase flex items-center gap-2">
                            <span style={{ color: style.stroke }}>{style.icon}</span>
                            {item.name}
                          </h5>
                          
                          <div className="flex items-center gap-2 mt-3">
                            <div className={`w-6 h-6 rounded-lg ${agentColor.bg} flex items-center justify-center text-white text-[8px] font-bold`}>
                              {holdingAgent ? holdingAgent.name[0].toUpperCase() : "?"}
                            </div>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-wide">
                              {holdingAgent ? holdingAgent.name : "미지정 개체"}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRevokeAsset(item.id, item.name, holdingAgent?.name || "미지정")}
                          disabled={actionLoading}
                          className="p-3 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl border border-rose-500/20 transition-all active:scale-95 group shrink-0"
                          title="자산 회수 및 반환"
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Footer / Status Ticker */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-800/20 rounded-[2rem] border border-slate-800 shrink-0 relative z-10 mt-auto">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
          SYSTEM ACTIVE // PRODUCTION SERVER PORT: 9000
        </span>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            실시간 자원 배치 모니터링 가동 중
          </span>
        </div>
      </div>

    </div>
  );
};
