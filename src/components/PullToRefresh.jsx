import React, { useState, useRef } from 'react'; // useEffect entfernt
import { Loader2 } from 'lucide-react';

export default function PullToRefresh({ onRefresh, children }) {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef(null);

  // Configuration
  const THRESHOLD = 80; 
  const MAX_PULL = 150; 

  const handleTouchStart = (e) => {
    if (window.scrollY === 0 && !isRefreshing) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (startY === 0 || isRefreshing) return;
    
    const y = e.touches[0].clientY;
    const diff = y - startY;

    if (diff > 0 && window.scrollY === 0) {
      const dampedDiff = Math.min(diff * 0.5, MAX_PULL);
      setCurrentY(dampedDiff);
      if (e.cancelable) e.preventDefault(); 
    }
  };

  const handleTouchEnd = async () => {
    if (startY === 0 || isRefreshing) return;

    if (currentY > THRESHOLD) {
      setIsRefreshing(true);
      setCurrentY(THRESHOLD); 
      try {
        await onRefresh();
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setCurrentY(0);
        }, 500); 
      }
    } else {
      setCurrentY(0); 
    }
    setStartY(0);
  };

  return (
    <div 
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen"
    >
      <div 
        className="fixed left-0 right-0 flex justify-center items-center pointer-events-none z-10 transition-transform duration-200"
        style={{ 
          top: 0,
          height: `${THRESHOLD}px`,
          transform: `translateY(${currentY > 0 ? (isRefreshing ? 0 : currentY - THRESHOLD) : -THRESHOLD}px)`
        }}
      >
        <div className="bg-white dark:bg-slate-800 rounded-full p-2 shadow-md border border-slate-100 dark:border-slate-700">
          {isRefreshing ? (
            <Loader2 className="animate-spin text-brand-500" size={20} />
          ) : (
            <span className={`text-xs font-medium ${currentY > THRESHOLD ? 'text-brand-500' : 'text-slate-400'}`}>
              {currentY > THRESHOLD ? 'Loslassen' : 'Ziehen'}
            </span>
          )}
        </div>
      </div>

      <div 
        style={{ 
          transform: `translateY(${currentY}px)`,
          transition: isRefreshing ? 'transform 0.2s cubic-bezier(0,0,0.2,1)' : 'transform 0.3s cubic-bezier(0,0,0.2,1)'
        }}
      >
        {children}
      </div>
    </div>
  );
}