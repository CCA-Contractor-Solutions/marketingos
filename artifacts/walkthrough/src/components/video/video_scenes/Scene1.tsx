import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 500);
    const t2 = setTimeout(() => setPhase(2), 1500);
    const t3 = setTimeout(() => setPhase(3), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div 
        className="text-[1.5vw] text-[#14b8a6] uppercase tracking-[0.3em] font-bold mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      >
        Command Center
      </motion.div>
      
      <div className="flex flex-col items-center gap-4">
        {['Plan.', 'Launch.', 'Optimize.', 'Grow.'].map((word, i) => (
          <motion.h1 
            key={i}
            className="text-[8vw] font-display font-black leading-none text-white tracking-tight"
            initial={{ opacity: 0, y: 50, rotateX: -30 }}
            animate={phase >= 2 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 50, rotateX: -30 }}
            transition={{ duration: 0.8, delay: phase >= 2 ? i * 0.2 : 0, type: "spring" }}
          >
            {word}
          </motion.h1>
        ))}
      </div>
    </motion.div>
  );
}
