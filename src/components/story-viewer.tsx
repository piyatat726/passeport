'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Story, User } from '@/lib/types';
import { viewStory } from '@/lib/db';

interface StoryGroup {
  user: User;
  stories: Story[];
}

interface StoryViewerProps {
  groups: StoryGroup[];
  initialGroupIndex: number;
  currentUserId?: string;
  onClose: () => void;
}

const STORY_DURATION = 5000; // 5 seconds per story

export function StoryViewer({ groups, initialGroupIndex, currentUserId, onClose }: StoryViewerProps) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(0);
  const elapsedRef = useRef(0);

  const group = groups[groupIndex];
  const story = group?.stories[storyIndex];

  // Track view
  useEffect(() => {
    if (story && currentUserId) {
      viewStory(story.id, currentUserId).catch(() => {});
    }
  }, [story, currentUserId]);

  // Progress timer
  const startTimer = useCallback(() => {
    if (!imageLoaded) return;
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = elapsedRef.current + (Date.now() - startTimeRef.current);
      const pct = Math.min(elapsed / STORY_DURATION, 1);
      setProgress(pct);
      if (pct >= 1) {
        clearInterval(timerRef.current!);
        goNext();
      }
    }, 30);
  }, [imageLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isPaused && imageLoaded) {
      startTimer();
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        elapsedRef.current += Date.now() - startTimeRef.current;
      }
    };
  }, [isPaused, imageLoaded, startTimer]);

  // Reset on story change
  useEffect(() => {
    setProgress(0);
    elapsedRef.current = 0;
    setImageLoaded(false);
  }, [groupIndex, storyIndex]);

  const goNext = useCallback(() => {
    if (!group) return;
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex(prev => prev + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex(prev => prev + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  }, [group, storyIndex, groupIndex, groups.length, onClose]);

  const goPrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex(prev => prev - 1);
    } else if (groupIndex > 0) {
      setGroupIndex(prev => prev - 1);
      setStoryIndex(groups[groupIndex - 1].stories.length - 1);
    }
  }, [storyIndex, groupIndex, groups]);

  // Tap zones
  const handleTap = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width * 0.3) {
      goPrev();
    } else {
      goNext();
    }
  };

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!group || !story) {
    onClose();
    return null;
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return `${Math.floor(diff / 60000)}m`;
    return `${hrs}h`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      {/* Story image */}
      <div
        className="relative w-full h-full max-w-lg mx-auto"
        onClick={handleTap}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <Image
          src={story.image_url}
          alt={story.caption || ''}
          fill
          className="object-cover"
          priority
          onLoad={() => setImageLoaded(true)}
        />

        {/* Top gradient */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />

        {/* Progress bars */}
        <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
          {group.stories.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] rounded-full bg-white/30 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width: `${i < storyIndex ? 100 : i === storyIndex ? progress * 100 : 0}%`,
                }}
              />
            </div>
          ))}
        </div>

        {/* User info */}
        <div className="absolute top-6 left-3 right-3 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/50 bg-black/30">
              {group.user.avatar_url ? (
                <img src={group.user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-xs font-playfair italic">
                  {group.user.display_name?.charAt(0)}
                </div>
              )}
            </div>
            <span className="text-white text-sm font-inter font-medium drop-shadow">
              {group.user.display_name || group.user.username}
            </span>
            <span className="text-white/60 text-xs font-inter drop-shadow">
              {timeAgo(story.created_at)}
            </span>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-8 h-8 flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-white drop-shadow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Caption */}
        {story.caption && (
          <div className="absolute bottom-8 left-4 right-4 z-20 pointer-events-none">
            <p className="text-white text-sm font-noto drop-shadow-lg leading-relaxed">
              {story.caption}
            </p>
          </div>
        )}

        {/* Bottom gradient */}
        {story.caption && (
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-10" />
        )}
      </div>
    </div>
  );
}
