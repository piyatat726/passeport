'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { User, Story } from '@/lib/types';
import { getActiveStories, getViewedStoryIds, uploadImage, createStory } from '@/lib/db';
import { useAuth } from '@/lib/auth-context';
import { StoryViewer } from './story-viewer';
import { useToast } from './toast';

interface StoryGroup {
  user: User;
  stories: Story[];
  hasUnviewed: boolean;
}

export function StoriesBar() {
  const { user, isDemo } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadStories = useCallback(async () => {
    if (isDemo) {
      setLoading(false);
      return;
    }
    try {
      const [rawGroups, viewedIds] = await Promise.all([
        getActiveStories(),
        user ? getViewedStoryIds(user.id) : Promise.resolve(new Set<string>()),
      ]);

      const withViewed: StoryGroup[] = rawGroups.map(g => ({
        ...g,
        hasUnviewed: g.stories.some(s => !viewedIds.has(s.id)),
      }));

      // Put current user's stories first, then unviewed, then viewed
      withViewed.sort((a, b) => {
        if (a.user.id === user?.id) return -1;
        if (b.user.id === user?.id) return 1;
        if (a.hasUnviewed && !b.hasUnviewed) return -1;
        if (!a.hasUnviewed && b.hasUnviewed) return 1;
        return 0;
      });

      setGroups(withViewed);
    } catch (err) {
      console.error('Failed to load stories:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isDemo]);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || isDemo) return;

    // Validate file type
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast('只支援 JPG、PNG、WebP、GIF 格式', 'error');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    // Validate file size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast('檔案大小不能超過 10MB', 'error');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await uploadImage(file, 'posts', user.id);
      await createStory(user.id, imageUrl);
      toast('限時動態已發布');
      await loadStories();
    } catch (err) {
      console.error('Story upload error:', err);
      toast('上傳失敗', 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto px-5 py-3 no-scrollbar">
        {/* Add story skeleton */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-border/50 animate-pulse" />
          <div className="w-10 h-2 bg-border/50 rounded animate-pulse" />
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-border/50 animate-pulse" />
            <div className="w-10 h-2 bg-border/50 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  // Check if current user has stories
  const myStories = groups.find(g => g.user.id === user?.id);

  return (
    <>
      <div className="flex gap-3 overflow-x-auto px-5 py-3 no-scrollbar">
        {/* Add Story button (always first) */}
        {!isDemo && (
          <button
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center gap-1 flex-shrink-0"
            disabled={uploading}
          >
            <div className="relative">
              <div className={`w-16 h-16 rounded-full border-2 border-dashed border-taupe/40 flex items-center justify-center ${
                uploading ? 'opacity-50' : ''
              }`}>
                {myStories?.user?.avatar_url ? (
                  <>
                    <img src={myStories.user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-ink rounded-full flex items-center justify-center border-2 border-cream">
                      <svg className="w-3 h-3 text-cream" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </div>
                  </>
                ) : (
                  <svg className="w-6 h-6 text-taupe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                )}
              </div>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-ink rounded-full animate-spin" />
                </div>
              )}
            </div>
            <span className="text-[10px] text-taupe font-inter">
              {uploading ? '上傳中' : '你的動態'}
            </span>
          </button>
        )}

        {/* Story circles */}
        {groups.map((group, i) => {
          // Skip current user in the list (shown as "add" button)
          if (group.user.id === user?.id && !isDemo) return null;
          return (
            <button
              key={group.user.id}
              onClick={() => openViewer(i)}
              className="flex flex-col items-center gap-1 flex-shrink-0"
            >
              <div className={`w-16 h-16 rounded-full p-[2.5px] ${
                group.hasUnviewed
                  ? 'bg-gradient-to-br from-[#E8927C] via-[#C4956A] to-[#8B7355]'
                  : 'bg-border/60'
              }`}>
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-cream bg-surface">
                  {group.user.avatar_url ? (
                    <img src={group.user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-taupe text-sm font-playfair italic">
                      {group.user.display_name?.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-ink font-inter truncate max-w-[60px]">
                {group.user.display_name?.split(' ')[0] || group.user.username}
              </span>
            </button>
          );
        })}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {/* Story Viewer */}
      {viewerOpen && (
        <StoryViewer
          groups={groups.map(g => ({ user: g.user, stories: g.stories }))}
          initialGroupIndex={viewerIndex}
          currentUserId={user?.id}
          onClose={() => {
            setViewerOpen(false);
            loadStories(); // Refresh viewed state
          }}
        />
      )}
    </>
  );
}
