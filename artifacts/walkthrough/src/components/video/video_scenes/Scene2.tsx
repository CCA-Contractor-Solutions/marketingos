import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 800);
    const t3 = setTimeout(() => setPhase(3), 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const kpis = [
    { label: "Revenue Pipeline", value: "$2.4M", trend: "+14.2%", color: "#2563eb" },
    { label: "MQLs", value: "1,248", trend: "+8.4%", color: "#8b5cf6" },
    { label: "ROAS", value: "3.8x", trend: "+0.4x", color: "#14b8a6" },
    { label: "Conversion Rate", value: "4.6%", trend: "+1.1%", color: "#f43f5e" },
    { label: "Website Traffic", value: "184K", trend: "+22%", color: "#2563eb" },
    { label: "Social Engagement", value: "8.2%", trend: "+1.5%", color: "#8b5cf6" },
  ];

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center p-20"
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "-100%" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.h2 
        className="text-[4vw] font-display font-bold mb-16 text-center"
        initial={{ opacity: 0 }}
        animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
      >
        Live Performance
      </motion.h2>

      <div className="grid grid-cols-3 gap-8 w-full max-w-[80vw]">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            className="bg-[#1e3a8a]/20 border border-[#1e3a8a]/50 p-8 rounded-3xl backdrop-blur-md"
            initial={{ opacity: 0, scale: 0.8, rotateY: 30 }}
            animate={phase >= 2 ? { opacity: 1, scale: 1, rotateY: 0 } : { opacity: 0, scale: 0.8, rotateY: 30 }}
            transition={{ duration: 0.6, delay: phase >= 2 ? i * 0.1 : 0, type: "spring" }}
            style={{ boxShadow: `0 10px 40px -10px ${kpi.color}40` }}
          >
            <div className="text-[1.2vw] text-white/60 mb-2">{kpi.label}</div>
            <div className="flex items-end justify-between">
              <div className="text-[3vw] font-display font-bold leading-none">{kpi.value}</div>
              <div className="text-[1.2vw] font-bold" style={{ color: kpi.color }}>{kpi.trend}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
