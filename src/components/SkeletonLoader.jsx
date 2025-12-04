import React from 'react';

// Basis Skeleton Komponente
const SkeletonBase = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

// Todo Skeleton
export const TodoSkeleton = () => (
  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
    <div className="flex items-center gap-3">
      <SkeletonBase className="w-6 h-6 rounded-full" />
      <div className="flex-1 space-y-2">
        <SkeletonBase className="h-4 w-3/4" />
        <SkeletonBase className="h-3 w-1/4" />
      </div>
      <SkeletonBase className="w-4 h-4" />
    </div>
  </div>
);

// Recipe Card Skeleton
export const RecipeSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
    <SkeletonBase className="w-full h-32" />
    <div className="p-4 space-y-2">
      <SkeletonBase className="h-5 w-2/3" />
      <SkeletonBase className="h-3 w-full" />
      <SkeletonBase className="h-3 w-4/5" />
    </div>
  </div>
);

// Flexible Skeleton Loader
export const SkeletonLoader = ({ type = 'todo', count = 3 }) => {
  const Component = type === 'recipe' ? RecipeSkeleton : TodoSkeleton;
  const containerClass = type === 'recipe' 
    ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
    : 'space-y-2';
  
  return (
    <div className={containerClass}>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
};