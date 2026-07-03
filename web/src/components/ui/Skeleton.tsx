import React from 'react'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-neutral-800 rounded-md ${className}`}
      {...props}
    />
  )
}
