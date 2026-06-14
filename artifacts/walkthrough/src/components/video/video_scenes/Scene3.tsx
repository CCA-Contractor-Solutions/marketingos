import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 11000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const bands = [
    { name: "Performance Pulse", color: "#2563eb", items: ["Executive Health", "ROI on Leads", "Budget", "Funnel"] },
    { name: "Growth Engine", color: "#8b5cf6", items: ["Social Pulse", "Webinars", "Referrals", "Flows"] },
    { name: "Campaigns & Ads", color: "#f43f5e", items: ["Command Center", "Ad Health", "Email Builder"] },
    { name: "Content & SEO", color: "#14b8a6", items: ["SEO Analytics", "Suggestions", "Content", "PR"] },
  ];

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center p-12"
      initial={{ opacity: 0, scale: 1.2 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.8 }}
    >
      <div className="w-full max-w-[90vw] flex flex-col gap-6">
        {bands.map((band, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-6"
            initial={{ opacity: 0, x: -100 }}
            animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -100 }}
            transition={{ duration: 0.8, delay: phase >= 1 ? i * 0.3 : 0, ease: [0.16, 1, 0.3, 1] }}
          >
            <div 
              className="w-1/4 p-6 rounded-2xl font-display font-bold text-[1.5vw] text-right bg-gradient-to-r from-transparent"
              style={{ borderRight: `4px solid ${band.color}` }}
            >
              {band.name}
            </div>
            <div className="w-3/4 flex gap-4">
              {band.items.map((item, j) => (
                <motion.div
                  key={j}
                  className="bg-[#1e3a8a]/30 p-4 rounded-xl flex-1 text-center font-semibold text-[1vw]"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.4, delay: phase >= 1 ? (i * 0.3) + (j * 0.1) + 0.4 : 0 }}
                  style={{ borderBottom: `2px solid ${band.color}50` }}
                >
                  {item}
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
