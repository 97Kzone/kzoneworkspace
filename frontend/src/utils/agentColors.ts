export const getAgentColor = (name: string) => {
  const colors = [
    { bg: "bg-indigo-500", text: "text-indigo-500", light: "bg-indigo-50", border: "border-indigo-100", soft: "text-indigo-600" },
    { bg: "bg-rose-500", text: "text-rose-500", light: "bg-rose-50", border: "border-rose-100", soft: "text-rose-600" },
    { bg: "bg-emerald-500", text: "text-emerald-500", light: "bg-emerald-50", border: "border-emerald-100", soft: "text-emerald-600" },
    { bg: "bg-amber-500", text: "text-amber-500", light: "bg-amber-50", border: "border-amber-100", soft: "text-amber-600" },
    { bg: "bg-violet-500", text: "text-violet-500", light: "bg-violet-50", border: "border-violet-100", soft: "text-violet-600" },
    { bg: "bg-sky-500", text: "text-sky-500", light: "bg-sky-50", border: "border-sky-100", soft: "text-sky-600" },
  ];

  if (name === "시스템") return { bg: "bg-slate-500", text: "text-slate-500", light: "bg-slate-50", border: "border-slate-100", soft: "text-slate-600" };

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};
