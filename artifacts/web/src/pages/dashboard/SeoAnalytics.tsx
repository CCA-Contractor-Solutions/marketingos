import { ModuleCard, ProgressRing } from "./Shared";
import { seoAnalytics } from "./sampleData";
import { Search } from "lucide-react";

export function SeoAnalytics() {
  return (
    <ModuleCard title="SEO Analytics" actionLabel="View report" actionHref="/analytics" icon={Search} accent="var(--c-sky)">
      <div className="flex items-center gap-6">
        <div className="relative flex items-center justify-center shrink-0">
          <ProgressRing progress={seoAnalytics.progress} size={70} strokeWidth={6} color="var(--c-brand)" />
          <div className="absolute flex flex-col items-center text-center">
            <span className="font-display text-lg font-bold leading-none">{seoAnalytics.progress}%</span>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[12px] text-slate-500 font-medium">Organic Sessions</span>
            <span className="text-[14px] font-bold">{seoAnalytics.organicSessions}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[12px] text-slate-500 font-medium">Keyword Rankings</span>
            <span className="text-[14px] font-bold text-emerald-600">{seoAnalytics.keywordRankings}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[12px] text-slate-500 font-medium">Domain Authority</span>
            <span className="text-[14px] font-bold">{seoAnalytics.domainAuthority}</span>
          </div>
        </div>
      </div>
    </ModuleCard>
  );
}
