'use client';

import { useUser } from '../context/UserContext';
import { useEffect, useState } from 'react';

export function EasterEgg() {
  const { isGeneratingAI } = useUser();
  const [active, setActive] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    console.log('EasterEgg: isGeneratingAI changed to', isGeneratingAI);
    if (isGeneratingAI) {
      setActive(true);
      setImageIndex(Math.floor(Math.random() * 2));
      const timer = setTimeout(() => {
        setActive(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isGeneratingAI]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center pointer-events-none" style={{ background: 'transparent' }}>
      <div className="relative flex flex-col items-center animate-easter-egg">
        {/* The Boy - Use fixed size to ensure visibility even if image fails */}
        <div className="relative w-64 h-64 md:w-96 md:h-96 flex items-center justify-center">
          <img 
            src={`/images/easter-egg/boy_${imageIndex + 1}.png`} 
            alt="Daje Cazzo"
            className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(0,255,65,0.5)]"
            onError={(e) => console.error('EasterEgg image load error:', e)}
          />
        </div>
        
        {/* The Text */}
        <div className="mt-4 bg-black/90 backdrop-blur-xl px-10 py-6 rounded-3xl border-4 border-[--color-primary] shadow-[0_0_60px_rgba(0,255,65,0.4)] transform -rotate-3 scale-110">
          <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white uppercase m-0 leading-none">
            Daje <span className="text-[--color-primary] animate-pulse">Cazzo</span> Uomo
          </h2>
        </div>
      </div>
    </div>
  );
}
