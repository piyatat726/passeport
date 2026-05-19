export type Category =
  | 'style_diary'
  | 'travel_notes'
  | 'city_guide'
  | 'cafe_journal'
  | 'table_taste'
  | 'beauty_rituals'
  | 'culture_calendar'
  | 'living_aesthetic'
  | 'personal_essay'
  | 'curated_picks';

export interface CategoryInfo {
  value: Category;
  labelEn: string;
  labelZh: string;
  icon: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { value: 'style_diary', labelEn: 'Style Diary', labelZh: '穿搭日記', icon: '👗' },
  { value: 'travel_notes', labelEn: 'Travel Notes', labelZh: '旅行筆記', icon: '✈️' },
  { value: 'city_guide', labelEn: 'City Guide', labelZh: '城市指南', icon: '🏙️' },
  { value: 'cafe_journal', labelEn: 'Café Journal', labelZh: '咖啡誌', icon: '☕' },
  { value: 'table_taste', labelEn: 'Table & Taste', labelZh: '餐桌風景', icon: '🍽️' },
  { value: 'beauty_rituals', labelEn: 'Beauty Rituals', labelZh: '美容儀式', icon: '✨' },
  { value: 'culture_calendar', labelEn: 'Culture Calendar', labelZh: '文化日曆', icon: '🎭' },
  { value: 'living_aesthetic', labelEn: 'Living Aesthetic', labelZh: '生活美學', icon: '🪴' },
  { value: 'personal_essay', labelEn: 'Personal Essay', labelZh: '個人隨筆', icon: '✍️' },
  { value: 'curated_picks', labelEn: 'Curated Picks', labelZh: '編輯選物', icon: '💎' },
];

export interface User {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  cities: string[];
  followers_count?: number;
  following_count?: number;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  subtitle: string;
  content: string;
  category: Category;
  cover_image_url: string;
  additional_images: string[];
  location: string;
  tags: string[];
  likes_count?: number;
  views_count?: number;
  created_at: string;
  user?: User;
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  cover_image_url: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  actor_id: string;
  type: 'like' | 'comment' | 'follow';
  post_id: string | null;
  comment_text: string;
  is_read: boolean;
  created_at: string;
  actor?: User;
  post?: { id: string; title: string; cover_image_url: string } | null;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id?: string | null;
  created_at: string;
  user?: User;
  replies?: (Comment & { user: User })[];
}

export interface Story {
  id: string;
  user_id: string;
  image_url: string;
  caption?: string;
  created_at: string;
  expires_at: string;
  user?: User;
  views_count?: number;
}

export interface StoryGroup {
  user: User;
  stories: Story[];
  hasUnviewed: boolean;
}

export interface Place {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  category: string;
  mapbox_id: string;
  mention_count: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_text: string;
  last_message_at: string;
  created_at: string;
  other_user?: User;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: User;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: 'post' | 'user' | 'comment';
  target_id: string;
  reason: string;
  created_at: string;
}

export interface Block {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}
