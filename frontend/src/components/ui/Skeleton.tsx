import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

export function BentoSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-4">
      <Skeleton className="h-40 md:col-span-2" />
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32 md:col-span-2" />
    </div>
  );
}