import React from 'react';

/**
 * FadeIn Wrapper
 * Fügt sanftes Fade-In hinzu ohne komplexe Route-Detection
 * Einfach, performant, kein Anti-Pattern
 */
export const FadeIn = ({ children, delay = 0, duration = 500 }) => {
  return (
    <div
      className="animate-fadeIn"
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
};