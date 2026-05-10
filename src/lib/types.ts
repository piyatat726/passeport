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

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
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
