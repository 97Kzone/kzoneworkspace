"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Cpu, Layers, Search, ShieldCheck, Zap, User, Trash2, 
  Loader2, CheckCircle2, AlertTriangle, RefreshCw, Server, ArrowRight 
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

export const AssetAllocationDashboard: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [allocatedItems, setAllocatedItems] = useState<OfficeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<number | "">("");
  
  // 성공/실패 알림 상태
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 제공되는 컴퓨팅 자산 정의
  const availableAssets: ComputationalAsset[] = [
    {
      id: "reasoning_core",
      name: "고성능 추론 코어 (Reasoning Core)",
      type: "REASONING_CORE",
      description: "고부하 추론 처리를 위한 GPU 가속 컴퓨팅 코어를 추가 할당합니다.",
      price: 150,
      icon: <Cpu size={20} />,
      color: "from-indigo-500 to-cyan-500"
    },
    {
      id: "extended_context",
      name: "대용량 컨텍스트 메모리 (Extended Context)",
      type: "EXTENDED_CONTEXT",
      description: "Context Window를 최대 128k로 확장하고 세션 캐싱 메모리를 확보합니다.",
      price: 100,
      icon: <Layers size={20} />,
      color: "from-purple-500 to-pink-500"
    },
    {
      id: "vector_search",
      name: "실시간 벡터 DB 검색 세션 (Vector DB Search)",
      type: "VECTOR_SEARCH",
      description: "에이전트 단/장기 기억 검색의 정확도를 높이고 시맨틱 검색 속도를 극대화합니다.",
      price: 80,
      icon: <Search size={20} />,
      color: "from-emerald-500 to-teal-500"
    },
    {
      id: "auxiliary_instance",
      name: "보조 추론 모델 인스턴스 (Auxiliary Instance)",
      type: "AUXILIARY_INSTANCE",
      description: "다중 스레드 병렬 연산을 지원하여 로직 검증 및 자가 치유 레이턴시를 단축합니다.",
      price: 200,
      icon: <ShieldCheck size={20} />,
      color: "from-amber-500 to-orange-500"
    }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [agentRes, officeRes] = await Promise.all([
        agentService.getAll(),
        officeService.getAll()
      ]);
      setAgents(agentRes.data);
      setAllocatedItems(officeRes.data);
      
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
    fetchData();
  }, []);

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
      // API call: buyItem
      await officeService.buyItem({
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
            onChange={(e) => setSelectedAgentId(e.target.value === "" ? "" : Number(e.target.value))}
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

      {/* Main Grid: Left (Asset Options) & Right (Active Deployments) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden relative z-10">
        
        {/* Left: Available Assets to Allocate (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar-dark">
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

        {/* Right: Active Allocations (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 overflow-hidden">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 shrink-0">
            실시간 자산 할당 및 배치 현황
          </h4>

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

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-black/20 border border-slate-800 p-5 rounded-3xl flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-2 h-2 rounded-full bg-emerald-500 animate-pulse`}></span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">컴퓨팅 자원 운영 중</span>
                      </div>
                      
                      <h5 className="text-xs font-black text-white truncate uppercase">{item.name}</h5>
                      
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
