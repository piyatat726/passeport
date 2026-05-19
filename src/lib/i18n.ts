/**
 * Lightweight i18n for PASSEPORT
 * Usage:
 *   const { t } = useI18n();
 *   t('home.forYou')  // => "For You" or "為你推薦"
 */

const translations: Record<string, Record<string, string>> = {
  'zh-TW': {
    // Navigation
    'nav.home': '首頁',
    'nav.discover': '探索',
    'nav.create': '發文',
    'nav.map': '地圖',
    'nav.profile': '個人',

    // Home
    'home.forYou': '為你推薦',
    'home.following': '追蹤中',
    'home.latest': '最新文章',
    'home.endOfFeed': '已經看完了',
    'home.endOfFeedSub': '探索更多靈感，發現你的生活風格',
    'home.startJourney': '開始你的旅程',
    'home.createFirst': '還沒有文章，成為第一個分享的人吧！',
    'home.demoHint': '目前是訪客模式，註冊帳號後即可發文',

    // Post
    'post.share': '分享',
    'post.saved': '已收藏',
    'post.unsaved': '已取消收藏',
    'post.linkCopied': '連結已複製',
    'post.deleteConfirm': '確定要刪除這篇文章嗎？',
    'post.views': '次瀏覽',

    // Create
    'create.uploadPhotos': '上傳照片',
    'create.photoHint': '選擇照片（最多 10 張，第一張為封面）',
    'create.compose': '撰寫',
    'create.preview': '預覽',
    'create.publish': '發布',
    'create.publishing': '發布中...',
    'create.draftSaved': '草稿已儲存',
    'create.saveDraft': '儲存草稿',

    // Comments
    'comment.placeholder': '寫下你的想法...',
    'comment.replyTo': '回覆',
    'comment.cancel': '取消',
    'comment.send': '送出',

    // Profile
    'profile.posts': '文章',
    'profile.followers': '粉絲',
    'profile.following': '追蹤中',
    'profile.saved': '收藏',
    'profile.liked': '喜歡',
    'profile.editProfile': '編輯個人檔案',
    'profile.follow': '追蹤',
    'profile.unfollow': '取消追蹤',
    'profile.message': '訊息',

    // Settings
    'settings.title': '設定',
    'settings.theme': '主題',
    'settings.language': '語言',
    'settings.notifications': '通知',
    'settings.signOut': '登出',
    'settings.about': '關於',

    // Common
    'common.loading': '載入中...',
    'common.error': '發生錯誤',
    'common.retry': '重試',
    'common.back': '返回',
    'common.cancel': '取消',
    'common.confirm': '確認',
    'common.delete': '刪除',
    'common.edit': '編輯',
    'common.save': '儲存',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.discover': 'Discover',
    'nav.create': 'Create',
    'nav.map': 'Map',
    'nav.profile': 'Profile',

    // Home
    'home.forYou': 'For You',
    'home.following': 'Following',
    'home.latest': 'Latest',
    'home.endOfFeed': 'End of Feed',
    'home.endOfFeedSub': 'Explore more inspiration and discover your style',
    'home.startJourney': 'Start Your Journey',
    'home.createFirst': 'No posts yet. Be the first to share!',
    'home.demoHint': 'You\'re in guest mode. Sign up to create posts.',

    // Post
    'post.share': 'Share',
    'post.saved': 'Saved',
    'post.unsaved': 'Unsaved',
    'post.linkCopied': 'Link copied',
    'post.deleteConfirm': 'Are you sure you want to delete this post?',
    'post.views': 'views',

    // Create
    'create.uploadPhotos': 'Upload Photos',
    'create.photoHint': 'Choose photos (up to 10, first one is the cover)',
    'create.compose': 'Compose',
    'create.preview': 'Preview',
    'create.publish': 'Publish',
    'create.publishing': 'Publishing...',
    'create.draftSaved': 'Draft saved',
    'create.saveDraft': 'Save Draft',

    // Comments
    'comment.placeholder': 'Write your thoughts...',
    'comment.replyTo': 'Reply to',
    'comment.cancel': 'Cancel',
    'comment.send': 'Send',

    // Profile
    'profile.posts': 'Posts',
    'profile.followers': 'Followers',
    'profile.following': 'Following',
    'profile.saved': 'Saved',
    'profile.liked': 'Liked',
    'profile.editProfile': 'Edit Profile',
    'profile.follow': 'Follow',
    'profile.unfollow': 'Unfollow',
    'profile.message': 'Message',

    // Settings
    'settings.title': 'Settings',
    'settings.theme': 'Theme',
    'settings.language': 'Language',
    'settings.notifications': 'Notifications',
    'settings.signOut': 'Sign Out',
    'settings.about': 'About',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.retry': 'Retry',
    'common.back': 'Back',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.save': 'Save',
  },
};

export type Locale = 'zh-TW' | 'en';

export function getLocale(): Locale {
  if (typeof window === 'undefined') return 'zh-TW';
  try {
    const saved = localStorage.getItem('passeport_locale');
    if (saved === 'en' || saved === 'zh-TW') return saved;
  } catch {}
  return 'zh-TW';
}

export function setLocale(locale: Locale) {
  try {
    localStorage.setItem('passeport_locale', locale);
  } catch {}
}

export function t(key: string, locale?: Locale): string {
  const l = locale || getLocale();
  return translations[l]?.[key] || translations['zh-TW']?.[key] || key;
}

// React hook
import { useState, useEffect } from 'react';

export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>('zh-TW');

  useEffect(() => {
    setLocaleState(getLocale());
  }, []);

  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    setLocaleState(newLocale);
  };

  return {
    locale,
    changeLocale,
    t: (key: string) => t(key, locale),
  };
}
