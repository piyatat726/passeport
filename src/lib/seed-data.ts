import { User, Post } from './types';

export const SEED_USER: User = {
  id: 'seed-user-001',
  username: 'piyatat.passeport',
  display_name: 'Piyatat',
  bio: 'Travel · Fashion · Café · Life. Enjoy the little things. 把日常變成一本可以慢慢翻的雜誌。',
  avatar_url: '',
  cities: ['Taipei', 'Tokyo', 'Paris'],
  followers_count: 1247,
  following_count: 348,
  created_at: '2024-01-01T00:00:00Z',
};

export const SEED_POSTS: Post[] = [
  {
    id: 'post-001',
    user_id: SEED_USER.id,
    title: 'KYOTO IN AUTUMN',
    subtitle: '在嵐山的竹林間，時間彷彿靜止了',
    content: `京都的秋天，是一場關於色彩的盛宴。從東福寺的楓紅到嵐山的竹林，每一步都是一幅畫。

我在清水寺的舞台上看著整座城市被夕陽染成金色，那一刻我明白了為什麼千年來無數人為這座城市傾心。

旅行不只是移動身體，更是讓靈魂在另一個時空中呼吸。走在花見小路上，藝妓的木屐聲與遠處寺院的鐘聲交織，這就是京都獨有的生活節奏。

在一家隱藏在巷弄裡的抹茶店，我點了一杯濃茶配上和菓子。店主是一位七十多歲的老太太，她說這家店已經開了三代。「抹茶就像人生，」她微笑著說，「苦中帶甘。」

傍晚時分，我沿著鴨川散步，看著情侶們等距坐在河邊，這個城市連浪漫都帶著秩序感。`,
    category: 'travel_notes',
    cover_image_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=1000&fit=crop',
    additional_images: [
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=800&h=600&fit=crop',
    ],
    location: 'Kyoto, Japan',
    tags: ['京都', '日本旅行', '嵐山', '秋天', '抹茶'],
    created_at: '2024-11-15T10:00:00Z',
    user: SEED_USER,
    likes_count: 128,
    is_liked: false,
    is_saved: false,
  },
  {
    id: 'post-002',
    user_id: SEED_USER.id,
    title: 'TAIPEI CAFÉ GUIDE',
    subtitle: '這座城市最美的角落，都藏在咖啡杯裡',
    content: `台北的咖啡文化，是一種安靜的革命。不同於紐約的快節奏，也不同於巴黎的刻意優雅，台北的咖啡館自成一格。

在大稻埕的老屋改建咖啡館裡，時光的痕跡和咖啡的香氣完美融合。這裡的手沖咖啡，用的是來自阿里山的精品豆，每一口都帶著台灣山林的清新。

永康街的那家小店，只有八個座位，卻有全城最好的拿鐵。老闆每天凌晨四點起來烘豆，他說咖啡是一種修行。

民生社區的巷弄裡，新開了一家以白色為主調的咖啡館，落地窗外是一棵老榕樹。坐在窗邊，看著陽光透過樹葉灑進來，時間就這樣慢了下來。`,
    category: 'cafe_journal',
    cover_image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=1000&fit=crop',
    additional_images: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop',
    ],
    location: 'Taipei, Taiwan',
    tags: ['台北', '咖啡', '大稻埕', '永康街', '手沖'],
    created_at: '2024-12-01T08:00:00Z',
    user: SEED_USER,
    likes_count: 96,
    is_liked: true,
    is_saved: false,
  },
  {
    id: 'post-003',
    user_id: SEED_USER.id,
    title: 'NEW YORK WEST SIDE',
    subtitle: 'Chelsea Market 到 High Line，紐約的另一種美',
    content: `紐約的西邊，有一種不同於時代廣場的迷人氣質。這裡是藝術家和美食家的天堂。

Chelsea Market 的前身是 Nabisco 餅乾工廠，現在這個工業風的空間裡聚集了紐約最有個性的食物和商店。龍蝦三明治、手工義大利麵、日式抹茶——每一個攤位都是一個故事。

走上 High Line，這條由廢棄鐵道改建的空中花園，是紐約最浪漫的散步路線。野草和鋼鐵的對比，城市與自然的共存，這就是紐約精神的縮影。

在 Meatpacking District 的一家屋頂酒吧，我看著 Hudson River 對岸的日落。紐約的夕陽不是溫柔的，它是壯烈的，像這座城市本身。

夜晚的 West Village，爵士樂從地下酒吧裡飄出來，街燈映著百年紅磚，這才是紐約最動人的模樣。`,
    category: 'city_guide',
    cover_image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=1000&fit=crop',
    additional_images: [
      'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=800&h=600&fit=crop',
    ],
    location: 'New York, USA',
    tags: ['紐約', 'Chelsea', 'High Line', '城市漫步', '美食'],
    created_at: '2024-12-20T14:00:00Z',
    user: SEED_USER,
    likes_count: 215,
    is_liked: false,
    is_saved: true,
  },
];
