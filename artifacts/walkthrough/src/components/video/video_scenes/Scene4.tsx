import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 500);
    const t2 = setTimeout(() => setPhase(2), 2000);
    const t3 = setTimeout(() => setPhase(3), 4000);
    const t4 = setTimeout(() => setPhase(4), 11000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  const capabilities = [
    "Forecasts Campaigns", 
    "Drafts PR", 
    "Diagnoses Ad Health", 
    "Suggests SEO Wins", 
    "Builds Emails", 
    "Brainstorms Ideas"
  ];

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center p-20 overflow-hidden"
      initial={{ opacity: 0, rotateY: -90 }}
      animate={{ opacity: 1, rotateY: 0 }}
      exit={{ opacity: 0, rotateY: 90 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex w-full max-w-[80vw] gap-12 items-center">
        <motion.div className="flex-1 relative h-[60vh] flex items-center justify-center">
          <motion.div 
            className="absolute w-[40vw] h-[40vw] rounded-full border border-[#8b5cf6]/30"
            animate={{ rotate: 360, scale: [1, 1.05, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute w-[30vw] h-[30vw] rounded-full border border-[#2563eb]/40"
            animate={{ rotate: -360, scale: [1, 1.1, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="w-48 h-48 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#2563eb] shadow-[0_0_80px_#8b5cf680] flex items-center justify-center z-10"
            initial={{ scale: 0 }}
            animate={phase >= 1 ? { scale: 1 } : { scale: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
          >
            <div className="text-[2vw] font-display font-bold">AI</div>
          </motion.div>
        </motion.div>

        <div className="flex-1 flex flex-col gap-6">
          <motion.h2 
            className="text-[4vw] font-display font-bold leading-tight"
            initial={{ opacity: 0, x: 50 }}
            animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
          >
            MarketingOS AI Copilot
          </motion.h2>
          
          <div className="flex flex-col gap-4">
            {capabilities.map((cap, i) => (
              <motion.div
                key={i}
                className="text-[1.8vw] font-medium text-white/80 flex items-center gap-4"
                initial={{ opacity: 0, x: 50 }}
                animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                transition={{ delay: phase >= 3 ? i * 0.15 : 0 }}
              >
                <div className="w-3 h-3 rounded-full bg-[#14b8a6]" />
                {cap}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
