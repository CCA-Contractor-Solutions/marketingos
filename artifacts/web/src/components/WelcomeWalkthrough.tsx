import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  TrendingUp,
  Users,
  Target,
  DollarSign,
  Gauge,
  Rocket,
  Megaphone,
  PenLine,
  BarChartBig,
  Star,
  ListChecks,
  MessagesSquare,
  LineChart,
} from "lucide-react";

const AUDIO_SRC = `${import.meta.env.BASE_URL}audio/welcome_walkthrough.mp3`;
const TOTAL = 71.44;

const SCENES = [
  { key: "intro", start: 0, label: "Welcome" },
  { key: "kpis", start: 13.86, label: "Live Metrics" },
  { key: "modules", start: 30.51, label: "Modules" },
  { key: "copilot", start: 45.49, label: "AI Copilot" },
  { key: "outro", start: 60.05, label: "Get Started" },
] as const;

function activeSceneIndex(t: number) {
  let idx = 0;
  for (let i = 0; i < SCENES.length; i++) {
    if (t >= SCENES[i].start) idx = i;
  }
  return idx;
}

const ease = [0.16, 1, 0.3, 1] as const;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

function IntroScene() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex h-full flex-col items-center justify-center px-8 text-center"
    >
      <motion.div
        variants={item}
        className="text-[12px] font-bold uppercase tracking-[0.3em] text-emerald-200/80"
      >
        Marketing Operations Platform
      </motion.div>
      <motion.h2
        variants={item}
        className="font-display mt-4 text-[34px] font-bold leading-tight sm:text-[52px] tracking-tight text-white"
      >
        Welcome to
        <br />
        <span
          style={{
            background: "linear-gradient(90deg, #a78bfa, #e879f9, #818cf8)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          MarketingOS
        </span>{" "}
        Command Center
      </motion.h2>
      <motion.p
        variants={item}
        className="mt-5 text-[16px] font-medium text-emerald-100/80 sm:text-[19px]"
      >
        Plan. Launch. Optimize. Grow.
      </motion.p>
    </motion.div>
  );
}

const KPIS = [
  { label: "Revenue Pipeline", value: "$2.4M", delta: "+14.2%", icon: DollarSign, color: "#34d399" },
  { label: "Qualified Leads", value: "1,248", delta: "+8.4%", icon: Users, color: "#818cf8" },
  { label: "Return on Ad Spend", value: "3.8x", delta: "+0.3x", icon: Target, color: "#22d3ee" },
  { label: "Conversion Rate", value: "4.6%", delta: "+1.1%", icon: TrendingUp, color: "#fbbf24" },
];

function KpisScene() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex h-full flex-col justify-center px-8"
    >
      <motion.div variants={item} className="mb-6 flex items-center gap-2 text-white">
        <Gauge size={20} style={{ color: "#4ade80" }} />
        <span className="font-display text-[20px] font-bold sm:text-[24px]">
          Metrics that matter, live
        </span>
      </motion.div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {KPIS.map((k) => {
          const Icon = k.icon;
          return (
            <motion.div
              key={k.label}
              variants={item}
              className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm sm:p-5"
            >
              <div className="flex items-center gap-2">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: `${k.color}22`, color: k.color }}
                >
                  <Icon size={17} />
                </div>
                <span className="text-[12px] font-medium text-emerald-100/70">
                  {k.label}
                </span>
              </div>
              <div className="mt-3 font-display text-[26px] font-bold text-white sm:text-[32px]">
                {k.value}
              </div>
              <div className="text-[12px] font-semibold" style={{ color: k.color }}>
                {k.delta}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

const GROUPS = [
  { label: "Performance Pulse", icon: Gauge, color: "#22c55e" },
  { label: "Growth Engine", icon: Rocket, color: "#a855f7" },
  { label: "Campaigns & Ads", icon: Megaphone, color: "#fb6f5a" },
  { label: "Content & SEO", icon: PenLine, color: "#0ea5e9" },
  { label: "Market Intelligence", icon: BarChartBig, color: "#14b8a6" },
  { label: "Brand & Signals", icon: Star, color: "#f5a524" },
];

function ModulesScene() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex h-full flex-col justify-center px-8"
    >
      <motion.div variants={item} className="mb-6 flex items-center gap-2 text-white">
        <Sparkles size={20} style={{ color: "#c084fc" }} />
        <span className="font-display text-[20px] font-bold sm:text-[24px]">
          Every corner of your strategy
        </span>
      </motion.div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {GROUPS.map((g) => {
          const Icon = g.icon;
          return (
            <motion.div
              key={g.label}
              variants={item}
              className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-sm"
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${g.color}22`, color: g.color }}
              >
                <Icon size={17} />
              </div>
              <span className="text-[13px] font-semibold leading-tight text-white">
                {g.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

const PROMPTS = [
  "Forecast a campaign",
  "Diagnose ad health",
  "Draft a press release",
  "Brainstorm new ideas",
];

function CopilotScene() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex h-full flex-col items-center justify-center px-8 text-center"
    >
      <motion.div
        variants={item}
        className="flex h-16 w-16 items-center justify-center rounded-3xl"
        style={{
          background: "linear-gradient(135deg, #16a34a, #7c3aed)",
          boxShadow: "0 12px 30px -8px rgba(124,58,237,0.7)",
        }}
      >
        <Sparkles size={30} className="text-white" />
      </motion.div>
      <motion.h2
        variants={item}
        className="font-display mt-5 text-[24px] font-bold text-white sm:text-[30px]"
      >
        Your AI Copilot is always on
      </motion.h2>
      <motion.div variants={item} className="mt-6 flex flex-wrap justify-center gap-2.5">
        {PROMPTS.map((p) => (
          <span
            key={p}
            className="rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 text-[13px] font-medium text-emerald-50 backdrop-blur-sm"
          >
            {p}
          </span>
        ))}
      </motion.div>
    </motion.div>
  );
}

const OUTRO_ITEMS = [
  { label: "Tasks", icon: ListChecks },
  { label: "Collaboration", icon: MessagesSquare },
  { label: "Analytics", icon: LineChart },
];

function OutroScene() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex h-full flex-col items-center justify-center px-8 text-center"
    >
      <motion.div variants={item} className="flex items-center gap-6">
        {OUTRO_ITEMS.map((o) => {
          const Icon = o.icon;
          return (
            <div key={o.label} className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white">
                <Icon size={22} />
              </div>
              <span className="text-[12px] font-medium text-emerald-100/70">
                {o.label}
              </span>
            </div>
          );
        })}
      </motion.div>
      <motion.h2
        variants={item}
        className="font-display mt-7 text-[26px] font-bold leading-tight text-white sm:text-[34px]"
      >
        This is{" "}
        <span
          style={{
            background: "linear-gradient(90deg, #a78bfa, #e879f9)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          MarketingOS
        </span>
      </motion.h2>
      <motion.p
        variants={item}
        className="mt-2 text-[16px] font-semibold text-emerald-100/80 sm:text-[18px]"
      >
        Let's go make some noise.
      </motion.p>
    </motion.div>
  );
}

const SCENE_COMPONENTS = [IntroScene, KpisScene, ModulesScene, CopilotScene, OutroScene];

export function WelcomeWalkthrough() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setTime(a.currentTime);
    const onEnd = () => {
      setPlaying(false);
      setEnded(true);
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
    };
  }, []);

  const play = () => {
    const a = audioRef.current;
    if (!a) return;
    a.play().then(() => {
      setStarted(true);
      setPlaying(true);
      setEnded(false);
    }).catch(() => {
      setStarted(true);
      setPlaying(false);
    });
  };

  const pause = () => {
    audioRef.current?.pause();
    setPlaying(false);
  };

  const restart = () => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = 0;
    setTime(0);
    setEnded(false);
    a.play().then(() => {
      setStarted(true);
      setPlaying(true);
    }).catch(() => undefined);
  };

  const toggleMute = () => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = !a.muted;
    setMuted(a.muted);
  };

  const idx = activeSceneIndex(time);
  const Scene = SCENE_COMPONENTS[idx];
  const progress = Math.min(100, (time / TOTAL) * 100);

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl border"
      style={{ borderColor: "var(--c-border)", boxShadow: "0 24px 60px -20px rgba(9,14,24,0.5)" }}
    >
      <audio ref={audioRef} src={AUDIO_SRC} preload="auto" />

      {/* Stage */}
      <div
        className="relative aspect-video w-full"
        style={{
          background:
            "radial-gradient(120% 120% at 80% 0%, #14532d 0%, #0b1224 55%, #060913 100%)",
        }}
      >
        {/* ambient orbs */}
        <div
          className="cadence-ai-glow pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full"
          style={{ background: "rgba(124,58,237,0.35)", filter: "blur(48px)" }}
        />
        <div
          className="cadence-ai-glow pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full"
          style={{ background: "rgba(22,163,74,0.3)", filter: "blur(54px)", animationDelay: "0.8s" }}
        />

        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={SCENES[idx].key}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease }}
              className="h-full w-full"
            >
              <Scene />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Play overlay before first start, or replay on end */}
        {(!started || ended) && (
          <button
            type="button"
            onClick={ended ? restart : play}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 transition-colors"
            style={{ background: "rgba(6,9,19,0.55)", backdropFilter: "blur(2px)" }}
            aria-label={ended ? "Replay walkthrough" : "Play walkthrough"}
          >
            <span
              className="flex h-20 w-20 items-center justify-center rounded-full text-white transition-transform hover:scale-110"
              style={{
                background: "linear-gradient(135deg, #16a34a, #7c3aed)",
                boxShadow: "0 16px 40px -10px rgba(124,58,237,0.8)",
              }}
            >
              {ended ? <RotateCcw size={30} /> : <Play size={32} className="ml-1" />}
            </span>
            <span className="text-[14px] font-semibold text-white">
              {ended ? "Watch again" : "Play the walkthrough"}
            </span>
          </button>
        )}
      </div>

      {/* Controls */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ background: "var(--c-surface)", borderTop: "1px solid var(--c-border)" }}
      >
        <button
          type="button"
          onClick={playing ? pause : ended ? restart : play}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white transition-transform hover:scale-105"
          style={{ background: "linear-gradient(135deg, var(--c-brand), var(--c-violet))" }}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={restart}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-[var(--c-surface-2)]"
          style={{ border: "1px solid var(--c-border)", color: "var(--c-ink-soft)" }}
          aria-label="Restart"
        >
          <RotateCcw size={15} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-[11.5px] font-semibold" style={{ color: "var(--c-muted)" }}>
            <span style={{ color: "var(--c-brand)" }}>{SCENES[idx].label}</span>
            <span>
              Scene {idx + 1} / {SCENES.length}
            </span>
          </div>
          <div
            className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full"
            style={{ background: "var(--c-surface-3)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, var(--c-brand), var(--c-purple))",
                transition: "width 0.2s linear",
              }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={toggleMute}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-[var(--c-surface-2)]"
          style={{ border: "1px solid var(--c-border)", color: "var(--c-ink-soft)" }}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
      </div>
    </div>
  );
}
