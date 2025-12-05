import React, { useState, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';

export default function SwipeableListItem({ children, onDelete }) {
  const [offsetX, setOffsetX] = useState(0);
  const [startX, setStartX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const itemRef = useRef(null);
  const { vibrate } = useHaptics();

  const DELETE_THRESHOLD = -100; // Pixel nach links
  const MAX_SWIPE = -150;

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;

    // Nur Swipes nach links zulassen, mit Limit
    if (diff < 0 && diff > MAX_SWIPE) {
      setOffsetX(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    
    if (offsetX < DELETE_THRESHOLD) {
      // Trigger Delete
      vibrate(15);
      setOffsetX(-500); // Swipe item weg
      setTimeout(() => {
        onDelete();
        setOffsetX(0); // Reset für Wiederverwendung (z.B. Undo)
      }, 300);
    } else {
      // Snap back
      setOffsetX(0);
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (!isMobile) return <div className="relative">{children}</div>;

  return (
    <div className="relative overflow-hidden mb-2 rounded-xl">
      {/* Background (Delete Action) */}
      <div className="absolute inset-0 bg-red-500 flex items-center justify-end pr-6 rounded-xl">
        <Trash2 className="text-white" size={24} />
      </div>

      {/* Foreground (Content) */}
      <div
        ref={itemRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s ease-out'
        }}
        className="relative bg-white dark:bg-slate-800 rounded-xl z-10"
      >
        {children}
      </div>
    </div>
  );
}