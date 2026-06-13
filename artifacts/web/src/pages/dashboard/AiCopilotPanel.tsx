import { Link } from "wouter";
import { Sparkles, MessageSquare, Megaphone, CheckCircle2, TrendingUp, PenTool } from "lucide-react";
import { CcaLogo } from "@/components/CcaLogo";

export function AiCopilotPanel() {
  const actions = [
    { icon: TrendingUp, label: "Forecast Campaign", color: "text-blue-400" },
    { icon: CheckCircle2, label: "Diagnose Ad Health", color: "text-emerald-400" },
    { icon: Sparkles, label: "Suggest SEO Wins", color: "text-amber-400" },
    { icon: PenTool, label: "Draft Press Release", color: "text-purple-400" },
    { icon: MessageSquare, label: "Build Email", color: "text-rose-400" },
    { icon: Megaphone, label: "Brainstorm Ideas", color: "text-cyan-400" },
  ];

  return (
    <div
      className="flex flex-col h-full rounded-2xl overflow-hidden text-white"
      style={{
        background: "linear-gradient(180deg, #090e18 0%, #0b1224 100%)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 60px -20px rgba(0,0,0,0.8)",
      }}
    >
      <div className="p-6 relative">
        <div
          className="cadence-ai-glow pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full"
          style={{ background: "rgba(59,130,246,0.25)", filter: "blur(24px)" }}
        />
        <div className="relative flex items-center gap-3 mb-6">
          <CcaLogo size={32} />
          <div>
            <h2 className="font-display text-[18px] font-bold tracking-tight">CCA AI Copilot</h2>
            <p className="text-[12px] text-blue-200/70 font-medium">Ready to assist</p>
          </div>
        </div>

        <div className="space-y-2 relative">
          {actions.map((act, i) => {
            const Icon = act.icon;
            return (
              <Link
                key={i}
                href="/assistant"
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
              >
                <div className={`p-1.5 rounded-lg bg-white/5 ${act.color}`}>
                  <Icon size={16} />
                </div>
                <span className="text-[13.5px] font-medium">{act.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-auto p-6 pt-0 relative">
        <Link
          href="/assistant"
          className="flex items-center justify-center w-full py-3.5 rounded-xl font-bold text-[14px] bg-blue-600 hover:bg-blue-500 transition-colors shadow-[0_0_20px_rgba(37,99,235,0.4)]"
        >
          <Sparkles size={16} className="mr-2" /> Ask Copilot Anything
        </Link>
      </div>
    </div>
  );
}
