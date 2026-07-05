"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Cpu, Layers, Search, ShieldCheck, Zap, User, Trash2, 
  Loader2, CheckCircle2, AlertTriangle, RefreshCw, Server, ArrowRight,
  Info, X, Network, List, Bot, TrendingUp, BarChart3, PieChart, Activity
} from "lucide-react";
import { 
  agentService, officeService, Agent, OfficeItem, AssetUtilizationLog, SwarmAssetAnalytics 
} from "../app/apiService";
import { getAgentColor } from "../utils/agentColors";

interface ComputationalAsset {
  id: string;
  name: string;
  type: string;
  description: string;
  cost: number;
  icon: React.ReactNode;
  color: string;
}

interface AssetAllocationDashboardProps {
  agents?: Agent[];
  allocatedItems?: OfficeItem[];
  setAgents?: React.Dispatch<React.SetStateAction<Agent[]>>;
  setAllocatedItems?: React.Dispatch<React.SetStateAction<OfficeItem[]>>;
  fetchInitialData?: () => Promise<void>;
  assetLogs?: AssetUtilizationLog[];
}

const getAgentColorHex = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('analyst')) return '#4f46e5'; // indigo-600
  if (n.includes('coder') || n.includes('dev')) return '#059669'; // emerald-600
  if (n.includes('researcher')) return '#d97706'; // amber-600
  if (n.includes('janitor')) return '#e11d48'; // rose-600
  if (n.includes('qa') || n.includes('reviewer')) return '#7c3aed'; // violet-600
  return '#475569'; // slate-600
};

const getAssetIcon = (type: string) => {
  switch (type) {
    case "REASONING_CORE": return <Cpu size={20} />;
    case "EXTENDED_CONTEXT": return <Layers size={20} />;
    case "VECTOR_SEARCH": return <Search size={20} />;
    case "AUXILIARY_INSTANCE": return <ShieldCheck size={20} />;
    case "CODE_STABILITY_SANDBOX": return <ShieldCheck size={20} />;
    case "SYNERGY_BRIDGE": return <Network size={20} />;
    case "COST_OPTIMIZER": return <Zap size={20} />;
    case "VULNERABILITY_SHIELD": return <ShieldCheck size={20} />;
    case "CI_CD_PIPELINE_EMULATOR": return <RefreshCw size={20} />;
    case "DEPRECATED_API_SCANNER": return <Search size={20} />;
    default: return <Zap size={20} />;
  }
};

const getAssetColorGradient = (type: string) => {
  switch (type) {
    case "REASONING_CORE": return "from-indigo-500 to-cyan-500";
    case "EXTENDED_CONTEXT": return "from-purple-500 to-pink-500";
    case "VECTOR_SEARCH": return "from-emerald-500 to-teal-500";
    case "AUXILIARY_INSTANCE": return "from-amber-500 to-orange-500";
    case "CODE_STABILITY_SANDBOX": return "from-emerald-500 to-blue-500";
    case "SYNERGY_BRIDGE": return "from-blue-500 to-indigo-600";
    case "COST_OPTIMIZER": return "from-yellow-500 to-amber-600";
    case "VULNERABILITY_SHIELD": return "from-rose-500 to-amber-500";
    case "CI_CD_PIPELINE_EMULATOR": return "from-cyan-500 to-blue-600";
    case "DEPRECATED_API_SCANNER": return "from-teal-500 to-emerald-600";
    default: return "from-slate-500 to-slate-700";
  }
};

export const AssetAllocationDashboard: React.FC<AssetAllocationDashboardProps> = ({
  agents: propsAgents,
  allocatedItems: propsAllocatedItems,
  setAgents: propsSetAgents,
  setAllocatedItems: propsSetAllocatedItems,
  fetchInitialData,
  assetLogs: propsAssetLogs
}) => {
  const [localAgents, setLocalAgents] = useState<Agent[]>([]);
  const [localAllocatedItems, localSetAllocatedItems] = useState<OfficeItem[]>([]);
  const [localAssetLogs, setLocalAssetLogs] = useState<AssetUtilizationLog[]>([]);
  const [availableAssets, setAvailableAssets] = useState<ComputationalAsset[]>([]);
  const assetLogs = propsAssetLogs !== undefined ? propsAssetLogs : localAssetLogs;
  
  const [loading, setLoading] = useState(!propsAgents);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<number | "">("");
  
  // 우측 영역 탭 전환 상태 및 선택된 자산 상세 보기 상태
  const [activeTabRight, setActiveTabRight] = useState<'topology' | 'swarmGrid' | 'list' | 'analytics'>('topology');
  const [selectedAssetDetail, setSelectedAssetDetail] = useState<OfficeItem | null>(null);
  const [analyticsData, setAnalyticsData] = useState<SwarmAssetAnalytics | null>(null);
  const [recommendedAsset, setRecommendedAsset] = useState<ComputationalAsset | null>(null);

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

  const fetchRecommendation = async (agentId: number) => {
    try {
      const res = await officeService.getRecommendation(agentId);
      if (res && res.data) {
        const item = res.data;
        setRecommendedAsset({
          id: item.id,
          name: item.name,
          type: item.type,
          description: item.description,
          cost: item.cost,
          icon: getAssetIcon(item.type),
          color: getAssetColorGradient(item.type)
        });
      } else {
        setRecommendedAsset(null);
      }
    } catch (e) {
      console.error("추천 자산 로드 실패:", e);
      setRecommendedAsset(null);
    }
  };

  const fetchData = async () => {
    // Props로 초기 데이터 로딩 함수가 넘어오면 이를 사용
    if (fetchInitialData) {
      setLoading(true);
      try {
        await fetchInitialData();
        const [assetsRes, analyticsRes] = await Promise.all([
          officeService.getAvailableAssets(),
          officeService.getAssetAnalytics().catch(() => null)
        ]);
        const mappedAssets = assetsRes.data.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type,
          description: item.description,
          cost: item.cost,
          icon: getAssetIcon(item.type),
          color: getAssetColorGradient(item.type)
        }));
        setAvailableAssets(mappedAssets);
        if (analyticsRes?.data) setAnalyticsData(analyticsRes.data);
        if (selectedAgentId !== "") {
          fetchRecommendation(Number(selectedAgentId));
        }
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
      const [agentRes, officeRes, logsRes, assetsRes, analyticsRes] = await Promise.all([
        agentService.getAll(),
        officeService.getAll(),
        officeService.getLogs(),
        officeService.getAvailableAssets(),
        officeService.getAssetAnalytics().catch(() => null)
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

      setLocalAssetLogs(logsRes.data);
      if (analyticsRes?.data) setAnalyticsData(analyticsRes.data);
      
      const mappedAssets = assetsRes.data.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        description: item.description,
        cost: item.cost,
        icon: getAssetIcon(item.type),
        color: getAssetColorGradient(item.type)
      }));
      setAvailableAssets(mappedAssets);
      
      if (agentRes.data.length > 0 && selectedAgentId === "") {
        setSelectedAgentId(agentRes.data[0].id);
        fetchRecommendation(agentRes.data[0].id);
      } else if (selectedAgentId !== "") {
        fetchRecommendation(Number(selectedAgentId));
      }
    } catch (e) {
      console.error("자산 배치 데이터 로딩 실패:", e);
      setErrorMessage("백엔드 데이터를 로드하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadAssetsOnly = async () => {
      try {
        const assetsRes = await officeService.getAvailableAssets();
        const mappedAssets = assetsRes.data.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type,
          description: item.description,
          cost: item.cost,
          icon: getAssetIcon(item.type),
          color: getAssetColorGradient(item.type)
        }));
        setAvailableAssets(mappedAssets);
      } catch (e) {
        console.error("자산 목록 조회 실패:", e);
      }
    };
    loadAssetsOnly();
  }, []);

  useEffect(() => {
    if (agents.length > 0 && selectedAgentId === "") {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  useEffect(() => {
    if (selectedAgentId !== "") {
      fetchRecommendation(Number(selectedAgentId));
    } else {
      setRecommendedAsset(null);
    }
  }, [selectedAgentId]);

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

    if (agent.contributionPoints < asset.cost) {
      setErrorMessage(`'${agent.name}' 에이전트의 성공 기여도(현재: ${agent.contributionPoints} pts)가 부족합니다. 자산 배치에 ${asset.cost} pts가 필요합니다.`);
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
        cost: asset.cost
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

  // 컴퓨팅 자산 일괄 자동 재배치 및 최적화 실행
  const handleAutoRebalance = async () => {
    if (!confirm("가동률이 낮거나 효율성이 저조한 유휴 컴퓨팅 자산을 일괄 회수하고, 에이전트별 최적의 추천 자산으로 자동 재배치하시겠습니까?")) {
      return;
    }

    setActionLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    setSelectedAssetDetail(null);

    try {
      const res = await officeService.rebalanceAuto();
      if (res && res.data) {
        setSuccessMessage(res.data.message);
        setTimeout(() => setSuccessMessage(null), 7000);
        // 재조회
        await fetchData();
      }
    } catch (e: any) {
      console.error(e);
      const errMsg = e.response?.data?.message || "일괄 자동 재배치 처리 중 오류가 발생했습니다. 백엔드 에러를 확인하세요.";
      setErrorMessage(errMsg);
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
      case "CODE_STABILITY_SANDBOX":
        return {
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          stroke: "#10b981",
          spec: "자율 실행 격리 테스트 환경 구축, 구문 검증 및 빌드 오류 사전 차단",
          icon: <ShieldCheck size={16} />
        };
      case "SYNERGY_BRIDGE":
        return {
          bg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
          stroke: "#3b82f6",
          spec: "협업 성공 시 시너지 스코어 상승폭 가속 (+5 -> +8), 실패 시 감점 리스크 완화 방어 (-3 -> -1)",
          icon: <Network size={16} />
        };
      case "COST_OPTIMIZER":
        return {
          bg: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
          stroke: "#eab308",
          spec: "API 비용 및 토큰 소모량 20% 절감 보정 필터 상시 작동",
          icon: <Zap size={16} />
        };
      case "VULNERABILITY_SHIELD":
        return {
          bg: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          stroke: "#f43f5e",
          spec: "코드 변경 시 취약점 정밀 검사, OWASP Top 10 차단 필터 상시 가동",
          icon: <ShieldCheck size={16} />
        };
      case "CI_CD_PIPELINE_EMULATOR":
        return {
          bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
          stroke: "#06b6d4",
          spec: "빌드 및 배포 자동화 검증 활성화, 가상 통합 테스트를 통한 결함 사전 스캔 및 제거",
          icon: <RefreshCw size={16} />
        };
      case "DEPRECATED_API_SCANNER":
        return {
          bg: "bg-teal-500/10 text-teal-400 border-teal-500/30",
          stroke: "#14b8a6",
          spec: "레거시 및 Deprecated API 사용 건 실시간 정밀 추적 및 현대적인 대체 유형 제안",
          icon: <Search size={16} />
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
              const isAffordable = currentAgent ? currentAgent.contributionPoints >= asset.cost : false;

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
                      <p className="text-lg font-black text-indigo-400 italic leading-none mt-0.5">{asset.cost} pts</p>
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
                개별 토폴로지
              </button>
              <button 
                onClick={() => setActiveTabRight('swarmGrid')}
                className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${activeTabRight === 'swarmGrid' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <Network size={10} />
                군집 토폴로지
              </button>
              <button 
                onClick={() => setActiveTabRight('list')}
                className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${activeTabRight === 'list' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <List size={10} />
                자산 목록
              </button>
              <button 
                onClick={() => setActiveTabRight('analytics')}
                className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${activeTabRight === 'analytics' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <BarChart3 size={10} />
                정량 분석 (ROI)
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4 overflow-hidden relative">
            {activeTabRight === 'topology' ? (
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar-dark">
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
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <div className="text-indigo-400">
                                {getAssetStyle(selectedAssetDetail.type).icon}
                              </div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                배치 사양 분석
                              </span>
                            </div>
                            {selectedAssetDetail.lastActivatedAt && (
                              <span className="text-[8px] text-slate-500 font-mono">
                                Activated: {new Date(selectedAssetDetail.lastActivatedAt).toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                          <h5 className="text-xs font-black text-white truncate">{selectedAssetDetail.name}</h5>
                          <p className="text-[9px] font-bold text-slate-400 leading-normal mt-1 mb-2">
                            {getAssetStyle(selectedAssetDetail.type).spec}
                          </p>
                          
                          {/* 실시간 운영 통계 뱃지 추가 */}
                          <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-2 mt-2">
                            <div className="bg-black/40 rounded-lg p-1.5 border border-white/5 flex flex-col justify-center">
                              <span className="text-[7px] text-slate-500 font-black uppercase tracking-wider leading-none">실시간 가동률</span>
                              <div className="flex items-center gap-1 mt-1">
                                <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500" style={{ width: `${selectedAssetDetail.utilizationRate || 0}%` }}></div>
                                </div>
                                <span className="text-[8px] font-mono text-indigo-400 font-bold leading-none">{selectedAssetDetail.utilizationRate || 0}%</span>
                              </div>
                            </div>
                            <div className="bg-black/40 rounded-lg p-1.5 border border-white/5 flex flex-col justify-center">
                              <span className="text-[7px] text-slate-500 font-black uppercase tracking-wider leading-none">오류 방어 수</span>
                              <span className="text-[9px] font-mono text-emerald-400 font-bold mt-1 leading-none">{selectedAssetDetail.failurePreventedCount || 0} 회</span>
                            </div>
                            <div className="bg-black/40 rounded-lg p-1.5 border border-white/5 flex flex-col justify-center">
                              <span className="text-[7px] text-slate-500 font-black uppercase tracking-wider leading-none">누적 가동 시간</span>
                              <span className="text-[9px] font-mono text-slate-300 font-bold mt-1 leading-none">
                                {(() => {
                                  const sec = selectedAssetDetail.accumulatedTimeSeconds || 0;
                                  if (sec < 60) return `${sec}초`;
                                  const min = Math.floor(sec / 60);
                                  const rem = sec % 60;
                                  return `${min}분 ${rem}초`;
                                })()}
                              </span>
                            </div>
                          </div>
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

                      {/* Spec item: Safe Sandbox check */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">코드 격리 검증 (Sandbox)</span>
                        <span className={`font-bold ${allocatedItemsForAgent.some(item => item.type === "CODE_STABILITY_SANDBOX") ? "text-emerald-400 animate-pulse" : "text-slate-500"}`}>
                          {allocatedItemsForAgent.some(item => item.type === "CODE_STABILITY_SANDBOX") ? "자율 격리 샌드박스 가동 중" : "로컬 직접 변경"}
                        </span>
                      </div>

                      {/* Spec item: Vulnerability Shield check */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">보안 및 취약점 검증 (Shield)</span>
                        <span className={`font-bold ${allocatedItemsForAgent.some(item => item.type === "VULNERABILITY_SHIELD") ? "text-rose-400 animate-pulse" : "text-slate-500"}`}>
                          {allocatedItemsForAgent.some(item => item.type === "VULNERABILITY_SHIELD") ? "실시간 취약점 쉴드 가동 중" : "보안 스캔 미활성"}
                        </span>
                      </div>

                      {/* Spec item: CI/CD Pipeline Emulator check */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">CI/CD 통합 검증 (Pipeline)</span>
                        <span className={`font-bold ${allocatedItemsForAgent.some(item => item.type === "CI_CD_PIPELINE_EMULATOR") ? "text-cyan-400 animate-pulse" : "text-slate-500"}`}>
                          {allocatedItemsForAgent.some(item => item.type === "CI_CD_PIPELINE_EMULATOR") ? "파이프라인 시뮬레이션 가동 중" : "검증 모드 미연동"}
                        </span>
                      </div>

                      {/* Spec item: Deprecated API Scanner check */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">API 호환성 검증 (Scanner)</span>
                        <span className={`font-bold ${allocatedItemsForAgent.some(item => item.type === "DEPRECATED_API_SCANNER") ? "text-amber-400 animate-pulse" : "text-slate-500"}`}>
                          {allocatedItemsForAgent.some(item => item.type === "DEPRECATED_API_SCANNER") ? "레거시 API 실시간 추적 중" : "기본 컴파일러 감지"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 text-center py-4 font-bold uppercase">분석 에이전트를 상단에서 선택하십시오.</p>
                  )}
                </div>

                {/* AI 맞춤형 자산 배치 추천 엔진 (AI Computational Asset Recommendation) */}
                <div className="bg-slate-900/40 rounded-3xl border border-slate-800 p-5 flex flex-col gap-3.5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none"></div>
                  
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <Zap size={12} className="text-yellow-400 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      AI 맞춤형 자산 배치 추천 엔진
                    </span>
                  </div>

                  {selectedAgent ? (
                    recommendedAsset ? (
                      <div className="flex flex-col gap-3">
                        <div className="text-[10px] text-slate-400 leading-normal">
                          에이전트의 역할군(<strong>{selectedAgent.role}</strong>)과 역량을 정량 분석한 결과, 아래 연산 가속 자산이 비즈니스 생산성 향상에 가장 권장됩니다.
                        </div>

                        <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${recommendedAsset.color} text-white flex items-center justify-center shadow-md shrink-0`}>
                              {recommendedAsset.icon}
                            </div>
                            <div>
                              <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none">추천 자산</span>
                              <h6 className="text-xs font-black text-white uppercase mt-0.5">{recommendedAsset.name}</h6>
                              <p className="text-[9px] text-slate-400 font-medium leading-relaxed mt-0.5">{recommendedAsset.description}</p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="text-right">
                              <span className="text-[7px] font-black text-slate-500 uppercase">배치 비용</span>
                              <p className="text-sm font-black text-indigo-400 italic leading-none mt-0.5">{recommendedAsset.cost} pts</p>
                            </div>
                            
                            <button
                              onClick={() => handleAllocateAsset(recommendedAsset)}
                              disabled={actionLoading || selectedAgent.contributionPoints < recommendedAsset.cost}
                              className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${
                                selectedAgent.contributionPoints >= recommendedAsset.cost
                                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow active:scale-95 cursor-pointer"
                                  : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                              }`}
                            >
                              즉시 배치
                              <ArrowRight size={8} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 text-center gap-2">
                        <CheckCircle2 size={24} className="text-emerald-500" />
                        <p className="text-[10px] font-black text-white uppercase tracking-widest">최적의 자산 구성 상태</p>
                        <p className="text-[9px] text-slate-500 font-medium max-w-[240px]">
                          현재 에이전트의 역할군에 필요한 모든 핵심 생산성 자산이 정상 배치되어 있습니다.
                        </p>
                      </div>
                    )
                  ) : (
                    <p className="text-[10px] text-slate-500 text-center py-4 font-bold uppercase">분석 에이전트를 상단에서 선택하십시오.</p>
                  )}
                </div>

                {/* 스케일 아웃 제어 패널 (Scale-Out Control Panel) */}
                <div className="bg-slate-900/40 rounded-3xl border border-slate-800 p-5 flex flex-col gap-4 relative">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <Server size={12} className="text-indigo-400 animate-pulse" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        스케일 아웃(Scale-Out) 제어 본부
                      </span>
                    </div>
                    {selectedAgent && (
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${
                        allocatedItemsForAgent.some(item => item.type === "AUXILIARY_INSTANCE")
                          ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                          : "text-slate-400 bg-slate-500/10 border-slate-500/20"
                      }`}>
                        {allocatedItemsForAgent.some(item => item.type === "AUXILIARY_INSTANCE") ? "병렬 분산 작동 중" : "단일 노드 가동 중"}
                      </span>
                    )}
                  </div>

                  {selectedAgent ? (
                    <div className="flex flex-col gap-3.5">
                      <div className="text-[10px] text-slate-400 leading-normal">
                        성공 기여도 지표를 사용하여 에이전트의 스케일 아웃을 실시간 제어합니다. 스케일 아웃 시 <strong>보조 추론 모델 인스턴스</strong>가 추가 배치되어 병렬 연산 및 에러 자가 치유 능력이 극대화됩니다.
                      </div>
                      
                      <div className="flex items-center justify-between bg-black/20 p-3.5 rounded-2xl border border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-500 uppercase">현재 스케일 강도</span>
                          <span className="text-xs font-bold text-white mt-1">
                            {allocatedItemsForAgent.some(item => item.type === "AUXILIARY_INSTANCE")
                              ? "2 Nodes (Planner + Auxiliary)"
                              : "1 Node (Primary Agent)"}
                          </span>
                        </div>
                        
                        {allocatedItemsForAgent.some(item => item.type === "AUXILIARY_INSTANCE") ? (
                          <button
                            onClick={() => {
                              const auxItem = allocatedItemsForAgent.find(item => item.type === "AUXILIARY_INSTANCE");
                              if (auxItem) {
                                handleRevokeAsset(
                                  auxItem.id,
                                  auxItem.name,
                                  selectedAgent.name
                                );
                              }
                            }}
                            disabled={actionLoading}
                            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                          >
                            스케일 인 (Scale-In)
                            <ArrowRight size={10} className="rotate-180" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const scaleAsset = availableAssets.find(a => a.type === "AUXILIARY_INSTANCE");
                              if (scaleAsset) {
                                handleAllocateAsset(scaleAsset);
                              }
                            }}
                            disabled={actionLoading || selectedAgent.contributionPoints < 200}
                            className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                              selectedAgent.contributionPoints >= 200
                                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg active:scale-95 cursor-pointer"
                                : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                            }`}
                          >
                            스케일 아웃 (Scale-Out: 200 pts)
                            <ArrowRight size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 text-center py-4 font-bold uppercase">분석 에이전트를 상단에서 선택하십시오.</p>
                  )}
                </div>
              </div>
            ) : activeTabRight === 'swarmGrid' ? (
              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                {/* SVG Swarm Grid Topology Visualizer */}
                <div className="relative w-full h-[250px] bg-slate-950/40 rounded-3xl border border-slate-800/80 overflow-hidden flex items-center justify-center">
                  {/* Grid background pattern */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>
                  
                  {agents.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 text-slate-600 text-center px-4">
                      <Network size={36} className="stroke-1 animate-pulse" />
                      <p className="text-[10px] font-black uppercase tracking-widest">에이전트가 존재하지 않습니다.</p>
                    </div>
                  ) : (
                    <svg className="w-full h-full" viewBox="0 0 400 250">
                      {/* Definitions for gradients & markers */}
                      <defs>
                        <radialGradient id="swarmCenterGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                        </radialGradient>
                      </defs>

                      {/* Swarm Core Glow */}
                      <circle cx="200" cy="125" r="90" fill="url(#swarmCenterGlow)" />

                      {/* 1. Draw cooperation synergy flow lines between agent nodes */}
                      {(() => {
                        const positions = agents.map((agent, idx) => {
                          const angle = (idx * 2 * Math.PI) / agents.length;
                          const cx = 200 + 110 * Math.cos(angle);
                          const cy = 125 + 75 * Math.sin(angle);
                          return { agent, cx, cy };
                        });

                        const lines: React.ReactNode[] = [];
                        for (let i = 0; i < positions.length; i++) {
                          for (let j = i + 1; j < positions.length; j++) {
                            const p1 = positions[i];
                            const p2 = positions[j];
                            
                            const hasSynergyBridge = allocatedItems.some(
                              item => item.type === "SYNERGY_BRIDGE" && (item.agentId === p1.agent.id || item.agentId === p2.agent.id)
                            );

                            lines.push(
                              <g key={`swarm-line-${p1.agent.id}-${p2.agent.id}`}>
                                <line 
                                  x1={p1.cx} y1={p1.cy} x2={p2.cx} y2={p2.cy} 
                                  stroke={hasSynergyBridge ? "#60a5fa" : "#475569"} 
                                  strokeWidth={hasSynergyBridge ? "1.5" : "1"} 
                                  strokeOpacity={hasSynergyBridge ? "0.4" : "0.2"} 
                                  strokeDasharray="4 4"
                                />
                                {hasSynergyBridge && (
                                  <motion.line
                                    x1={p1.cx} y1={p1.cy} x2={p2.cx} y2={p2.cy}
                                    stroke="#3b82f6" strokeWidth="2" strokeOpacity="0.7"
                                    strokeDasharray="6 6"
                                    animate={{ strokeDashoffset: [0, -24] }}
                                    transition={{ repeat: Infinity, ease: "linear", duration: 1.5 }}
                                  />
                                )}
                              </g>
                            );
                          }
                        }
                        return lines;
                      })()}

                      {/* 2. Draw Agent Orbit paths & Asset Nodes orbiting agents */}
                      {agents.map((agent, idx) => {
                        const angle = (idx * 2 * Math.PI) / agents.length;
                        const cx = 200 + 110 * Math.cos(angle);
                        const cy = 125 + 75 * Math.sin(angle);
                        
                        const agentAssets = allocatedItems.filter(item => item.agentId === agent.id);
                        const isSelected = selectedAgentId === agent.id;
                        const agentColor = getAgentColor(agent.name);

                        return (
                          <g key={`swarm-agent-group-${agent.id}`}>
                            {agentAssets.length > 0 && (
                              <circle 
                                cx={cx} cy={cy} r="25" 
                                fill="none" stroke="#334155" strokeWidth="0.75" 
                                strokeDasharray="2 3" opacity="0.5" 
                              />
                            )}

                            {agentAssets.map((asset, assetIdx) => {
                              const assetAngle = (assetIdx * 2 * Math.PI) / agentAssets.length;
                              const assetX = cx + 25 * Math.cos(assetAngle);
                              const assetY = cy + 25 * Math.sin(assetAngle);
                              const style = getAssetStyle(asset.type);

                              return (
                                <g key={`swarm-asset-${asset.id}`}>
                                  <line x1={cx} y1={cy} x2={assetX} y2={assetY} stroke={style.stroke} strokeWidth="0.75" opacity="0.3" />
                                  <motion.g
                                    whileHover={{ scale: 1.2 }}
                                    className="cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedAgentId(agent.id);
                                      setSelectedAssetDetail(asset);
                                    }}
                                  >
                                    <circle cx={assetX} cy={assetY} r="9" fill="#0f172a" stroke={style.stroke} strokeWidth="1.5" />
                                    <foreignObject x={assetX - 5} y={assetY - 5} width="10" height="10" className="pointer-events-none">
                                      <div className="w-full h-full flex items-center justify-center text-white" style={{ color: style.stroke }}>
                                        {React.cloneElement(style.icon, { size: 8 })}
                                      </div>
                                    </foreignObject>
                                  </motion.g>
                                </g>
                              );
                            })}

                            <motion.g
                              whileHover={{ scale: 1.1 }}
                              className="cursor-pointer"
                              onClick={() => {
                                setSelectedAgentId(agent.id);
                                setSelectedAssetDetail(null);
                              }}
                            >
                              {isSelected && (
                                <circle cx={cx} cy={cy} r="20" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="3 3" />
                              )}
                              
                              <circle 
                                cx={cx} cy={cy} r="14" 
                                fill={isSelected ? "#1e1b4b" : "#0f172a"} 
                                stroke={isSelected ? "#818cf8" : getAgentColorHex(agent.name)} 
                                strokeWidth="2" 
                              />
                              
                              <foreignObject x={cx - 7} y={cy - 7} width="14" height="14" className="pointer-events-none">
                                <div className={`w-full h-full flex items-center justify-center ${isSelected ? 'text-indigo-300' : 'text-slate-400'}`}>
                                  <Bot size={11} />
                                </div>
                              </foreignObject>

                              <text 
                                x={cx} y={cy + 22} 
                                textAnchor="middle" 
                                fill={isSelected ? "#ffffff" : "#94a3b8"} 
                                fontSize="7" 
                                fontWeight="bold"
                                className="select-none font-sans"
                              >
                                {agent.name}
                              </text>
                            </motion.g>
                          </g>
                        );
                      })}
                    </svg>
                  )}

                  <AnimatePresence>
                    {selectedAssetDetail && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-3 left-3 right-3 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xl z-20"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <div className="text-indigo-400">
                                {getAssetStyle(selectedAssetDetail.type).icon}
                              </div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                배치 사양 분석 (군집)
                              </span>
                            </div>
                            {selectedAssetDetail.lastActivatedAt && (
                              <span className="text-[8px] text-slate-500 font-mono">
                                Activated: {new Date(selectedAssetDetail.lastActivatedAt).toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                          <h5 className="text-xs font-black text-white truncate">{selectedAssetDetail.name}</h5>
                          <p className="text-[9px] font-bold text-slate-400 leading-normal mt-1 mb-2">
                            {getAssetStyle(selectedAssetDetail.type).spec}
                          </p>
                          
                          {/* 실시간 운영 통계 뱃지 추가 */}
                          <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-2 mt-2">
                            <div className="bg-black/40 rounded-lg p-1.5 border border-white/5 flex flex-col justify-center">
                              <span className="text-[7px] text-slate-500 font-black uppercase tracking-wider leading-none">실시간 가동률</span>
                              <div className="flex items-center gap-1 mt-1">
                                <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500" style={{ width: `${selectedAssetDetail.utilizationRate || 0}%` }}></div>
                                </div>
                                <span className="text-[8px] font-mono text-indigo-400 font-bold leading-none">{selectedAssetDetail.utilizationRate || 0}%</span>
                              </div>
                            </div>
                            <div className="bg-black/40 rounded-lg p-1.5 border border-white/5 flex flex-col justify-center">
                              <span className="text-[7px] text-slate-500 font-black uppercase tracking-wider leading-none">오류 방어 수</span>
                              <span className="text-[9px] font-mono text-emerald-400 font-bold mt-1 leading-none">{selectedAssetDetail.failurePreventedCount || 0} 회</span>
                            </div>
                            <div className="bg-black/40 rounded-lg p-1.5 border border-white/5 flex flex-col justify-center">
                              <span className="text-[7px] text-slate-500 font-black uppercase tracking-wider leading-none">누적 가동 시간</span>
                              <span className="text-[9px] font-mono text-slate-300 font-bold mt-1 leading-none">
                                {(() => {
                                  const sec = selectedAssetDetail.accumulatedTimeSeconds || 0;
                                  if (sec < 60) return `${sec}초`;
                                  const min = Math.floor(sec / 60);
                                  const rem = sec % 60;
                                  return `${min}분 ${rem}초`;
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              const ownerAgent = agents.find(a => a.id === selectedAssetDetail.agentId);
                              handleRevokeAsset(
                                selectedAssetDetail.id, 
                                selectedAssetDetail.name, 
                                ownerAgent?.name || "미지정"
                              );
                            }}
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

                {/* 군집 시너지 및 요약 현황 보드 */}
                <div className="bg-slate-900/40 rounded-3xl border border-slate-800 p-5 flex flex-col gap-3 relative">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <Info size={12} className="text-indigo-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      군집 협업 시너지 분석 보드
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold">활성화된 시너지 공명 브릿지</span>
                      <span className="font-bold text-blue-400 font-mono">
                        {allocatedItems.filter(item => item.type === "SYNERGY_BRIDGE").length} 개 작동 중
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold">활성화된 비용 최적화 엔진</span>
                      <span className="font-bold text-yellow-400 font-mono">
                        {allocatedItems.filter(item => item.type === "COST_OPTIMIZER").length} 개 작동 중
                      </span>
                    </div>

                    <div className="text-[9px] text-slate-500 font-bold leading-normal border-t border-white/5 pt-2.5">
                      💡 군집 토폴로지 맵에서 에이전트 노드(파란색 원)를 클릭하면 해당 에이전트가 주 제어 대상으로 전환됩니다. 각 에이전트 주위를 도는 위성 노드는 배치된 컴퓨팅 자산이며, 클릭하여 실시간 사양 조회 및 강제 회수 조치가 가능합니다.
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTabRight === 'analytics' ? (
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar-dark flex flex-col gap-4">
                {/* 요약 정량 지표 카드 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/60 border border-indigo-500/20 p-4 rounded-2xl flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">전체 배치 자산 비용</span>
                      <Cpu size={14} className="text-indigo-400" />
                    </div>
                    <div className="mt-3">
                      <span className="text-xl font-black text-white italic">{analyticsData?.totalAllocatedAssetCost || 0}</span>
                      <span className="text-xs font-bold text-indigo-400 ml-1">pts</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 border border-emerald-500/20 p-4 rounded-2xl flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">평균 투자 대비 ROI</span>
                      <TrendingUp size={14} className="text-emerald-400" />
                    </div>
                    <div className="mt-3">
                      <span className="text-xl font-black text-emerald-400 italic">+{analyticsData?.overallRoi || 0}%</span>
                    </div>
                  </div>
                </div>

                {/* 에이전트별 자산 정량 효율성 리스트 */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Activity size={12} className="text-indigo-400" />
                      에이전트별 자산 활용 효율성 (Utilization Efficiency)
                    </h5>
                  </div>

                  {(!analyticsData || analyticsData.agentAnalytics.length === 0) ? (
                    <div className="border border-dashed border-slate-800 rounded-2xl p-8 text-center text-slate-600">
                      <p className="text-[10px] font-black uppercase tracking-widest">분석 데이터가 존재하지 않습니다.</p>
                    </div>
                  ) : (
                    analyticsData.agentAnalytics.map((item) => (
                      <div key={item.agentId} className="bg-black/30 border border-slate-800 p-4 rounded-2xl flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                            <span className="text-xs font-black text-white">{item.agentName}</span>
                            <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                              자산 {item.allocatedAssetCount}개 보유
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-black text-slate-400">ROI:</span>
                            <span className="text-xs font-black text-emerald-400">{item.roi}%</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[9px]">
                            <span className="text-slate-400 font-bold">컴퓨팅 활용 효율성 점수</span>
                            <span className="font-mono font-bold text-indigo-300">{item.utilizationEfficiency} / 100</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500" 
                              style={{ width: `${item.utilizationEfficiency}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[8px] font-bold text-slate-500 border-t border-white/5 pt-2 mt-1">
                          <span>총 배치 비용: {item.totalAssetCost} pts</span>
                          <span>기여도 획득: {item.earnedContributionPoints} pts</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* 컴퓨팅 자산 재배치/회수 권장 제안 */}
                <div className="flex flex-col gap-3 border-t border-white/5 pt-4">
                  <div className="flex items-center justify-between px-1">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <AlertTriangle size={12} className="text-amber-400" />
                      자산 재배치 및 회수 권장 제안 (Rebalancing Recommendations)
                    </h5>
                    {analyticsData && analyticsData.rebalancingRecommendations && analyticsData.rebalancingRecommendations.length > 0 && (
                      <button
                        onClick={handleAutoRebalance}
                        disabled={actionLoading}
                        className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500 hover:to-orange-500 hover:text-black border border-amber-500/20 hover:border-amber-500 text-amber-400 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        <RefreshCw size={10} className={actionLoading ? "animate-spin" : ""} />
                        일괄 자동 재배치 및 최적화 실행
                      </button>
                    )}
                  </div>


                  {(!analyticsData || !analyticsData.rebalancingRecommendations || analyticsData.rebalancingRecommendations.length === 0) ? (
                    <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-4 text-center text-slate-500">
                      <p className="text-[9px] font-bold uppercase tracking-wider">가동 중인 모든 컴퓨팅 리소스가 효율적으로 운용되고 있습니다.</p>
                    </div>
                  ) : (
                    analyticsData.rebalancingRecommendations.map((rec) => (
                      <div key={rec.assetId} className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1 flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-black px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {rec.agentName}
                            </span>
                            <span className="text-[9px] font-black text-white">{rec.assetName}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 font-bold leading-normal mt-0.5">
                            {rec.recommendationReason}
                          </p>
                          <span className="text-[8px] font-mono text-slate-500 font-bold">
                            회수 시 반환 예정 기여도: <strong className="text-amber-400">{rec.cost} pts</strong>
                          </span>
                        </div>
                        <button
                          onClick={() => handleRevokeAsset(rec.assetId, rec.assetName, rec.agentName)}
                          disabled={actionLoading}
                          className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500 hover:text-black border border-amber-500/20 hover:border-amber-500 text-amber-400 rounded-xl text-[8px] font-black uppercase tracking-widest transition-colors active:scale-95 cursor-pointer shrink-0"
                        >
                          즉시 회수
                        </button>
                      </div>
                    ))
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
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">컴퓨팅 자원 운영 중</span>
                            </div>
                            {item.lastActivatedAt && (
                              <span className="text-[8px] text-slate-500 font-mono">
                                Act: {new Date(item.lastActivatedAt).toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                          
                          <h5 className="text-xs font-black text-white truncate uppercase flex items-center gap-2">
                            <span style={{ color: style.stroke }}>{style.icon}</span>
                            {item.name}
                          </h5>
                          
                          {/* 실시간 운영 통계 렌더링 */}
                          <div className="flex gap-4 items-center mt-3 bg-black/40 border border-white/5 p-2.5 rounded-2xl">
                            <div className="flex-1 min-w-0">
                              <span className="text-[7px] text-slate-500 font-black uppercase tracking-wider block mb-0.5">실시간 가동률</span>
                              <div className="flex items-center gap-1.5">
                                <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500" style={{ width: `${item.utilizationRate || 0}%` }}></div>
                                </div>
                                <span className="text-[8px] font-mono text-indigo-400 font-bold leading-none">{item.utilizationRate || 0}%</span>
                              </div>
                            </div>
                            <div className="shrink-0 border-l border-white/5 pl-4 text-right">
                              <span className="text-[7px] text-slate-500 font-black uppercase tracking-wider block leading-none">방어 횟수</span>
                              <span className="text-[9px] font-mono text-emerald-400 font-bold mt-1.5 block leading-none">{item.failurePreventedCount || 0}회</span>
                            </div>
                            <div className="shrink-0 border-l border-white/5 pl-4 text-right">
                              <span className="text-[7px] text-slate-500 font-black uppercase tracking-wider block leading-none">누적 가동</span>
                              <span className="text-[9px] font-mono text-slate-300 font-bold mt-1.5 block leading-none">
                                {(() => {
                                  const sec = item.accumulatedTimeSeconds || 0;
                                  if (sec < 60) return `${sec}초`;
                                  const min = Math.floor(sec / 60);
                                  return `${min}분`;
                                })()}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-3.5">
                            <div className={`w-5 h-5 rounded-lg ${agentColor.bg} flex items-center justify-center text-white text-[8px] font-bold`}>
                              {holdingAgent ? holdingAgent.name[0].toUpperCase() : "?"}
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">
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

      {/* 실시간 컴퓨팅 자원 가동 로그 피드 */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 relative z-10 flex flex-col gap-3 shrink-0 max-h-[180px]">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            실시간 컴퓨팅 자원 가동 로그 피드 (Computing Asset Operation Logs)
          </span>
          <span className="text-[9px] font-mono text-slate-500">최근 50개 연동 이력</span>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar-dark space-y-2">
          {assetLogs.length === 0 ? (
            <p className="text-[10px] text-slate-600 text-center py-4 font-bold uppercase">가동 또는 배치 기록이 없습니다.</p>
          ) : (
            assetLogs.map((log) => {
              // Action type badge style
              let badgeColor = "bg-slate-500/10 text-slate-400 border-slate-500/20";
              let actionLabel = "가동";
              if (log.actionType === "ALLOCATION") {
                badgeColor = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
                actionLabel = "배치";
              } else if (log.actionType === "REVOCATION") {
                badgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                actionLabel = "회수";
              } else if (log.actionType === "UTILIZATION") {
                badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                actionLabel = "가동";
              }

              return (
                <div key={log.id} className="flex items-start justify-between gap-4 p-2.5 bg-black/10 hover:bg-black/20 border border-slate-800/50 rounded-xl transition-colors">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className={`px-2 py-0.5 rounded-md border text-[8px] font-black uppercase shrink-0 ${badgeColor}`}>
                      {actionLabel}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-300 leading-normal">
                        {log.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 shrink-0 mt-0.5">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              );
            })
          )}
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
