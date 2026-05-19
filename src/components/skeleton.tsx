'use client';

/**
 * Skeleton loading components for PASSEPORT
 * Replaces spinning circles with content-shaped placeholders
 */

function Bone({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-border/60 dark:bg-neutral-700/40 rounded-md animate-pulse ${className}`}
    />
  );
}

/** Featured card skeleton (hero post on homepage) */
export function FeaturedSkeleton() {
  return (
    <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-border/40 dark:bg-neutral-800/40 animate-pulse relative">
      {/* Category badge */}
      <div className="absolute top-4 left-4">
        <Bone className="w-20 h-6 rounded-full" />
      </div>
      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-5 space-y-3">
        <Bone className="h-7 w-4/5 rounded" />
        <Bone className="h-4 w-3/5 rounded" />
        <div className="flex items-center gap-2">
          <Bone className="w-6 h-6 rounded-full" />
          <Bone className="h-3 w-20 rounded" />
        </div>
      </div>
    </div>
  );
}

/** Small post card skeleton (list item) */
export function PostCardSkeleton() {
  return (
    <div className="flex gap-4">
      <Bone className="w-28 h-36 rounded-xl flex-shrink-0" />
      <div className="flex-1 flex flex-col justify-between py-1">
        <div className="space-y-2">
          <Bone className="h-3 w-24" />
          <Bone className="h-5 w-full" />
          <Bone className="h-5 w-3/4" />
          <Bone className="h-3 w-full" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Bone className="w-4 h-4 rounded-full" />
            <Bone className="h-3 w-16" />
          </div>
          <Bone className="w-8 h-4 rounded" />
        </div>
      </div>
    </div>
  );
}

/** Grid item skeleton (discover / profile) */
export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <Bone
          key={i}
          className={`aspect-square rounded-lg ${i === 0 ? 'row-span-2 col-span-2' : ''}`}
        />
      ))}
    </div>
  );
}

/** Full feed skeleton (featured + 3 cards) */
export function FeedSkeleton() {
  return (
    <div className="space-y-6">
      <FeaturedSkeleton />
      <div className="mt-8 mb-4 flex items-center justify-between">
        <Bone className="h-5 w-20" />
        <Bone className="h-3 w-16" />
      </div>
      <div className="space-y-5">
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    </div>
  );
}

/** Post detail skeleton */
export function PostDetailSkeleton() {
  return (
    <div className="min-h-screen bg-cream dark:bg-[#1a1917]">
      {/* Hero */}
      <Bone className="w-full aspect-[16/10] rounded-none" />
      {/* Content */}
      <div className="px-5 pt-6 space-y-4">
        <Bone className="h-3 w-24" />
        <Bone className="h-8 w-full" />
        <Bone className="h-8 w-3/4" />
        <div className="flex items-center gap-3 pt-2">
          <Bone className="w-10 h-10 rounded-full" />
          <div className="space-y-1.5">
            <Bone className="h-4 w-28" />
            <Bone className="h-3 w-20" />
          </div>
        </div>
        <div className="pt-6 space-y-3">
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-5/6" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}

/** Notification row skeleton */
export function NotificationSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3.5">
          <Bone className="w-2 h-2 rounded-full flex-shrink-0" />
          <Bone className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Bone className="h-4 w-full" />
            <Bone className="h-3 w-16" />
          </div>
          <Bone className="w-11 h-11 rounded-lg flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

export { Bone };
