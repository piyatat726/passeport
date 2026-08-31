// ═══ City Guides ═══
// Editorial city guides — the magazine's answer to 「這座城市哪裡好玩」.
// Five flagship cities are hand-written; any other city is generated
// on demand via /api/city-guide and cached in Supabase.

export interface CityGuideItem {
  name: string;
  area?: string;
  note: string;
}

export interface CityGuideSection {
  title: string;
  titleEn: string;
  items: CityGuideItem[];
}

export interface CityGuide {
  slug: string;
  nameEn: string;
  nameZh: string;
  countryZh: string;
  tagline: string;
  intro: string[];
  heroImage?: string;
  sections: CityGuideSection[];
  aliases?: string[];
}

export const CITY_GUIDES: CityGuide[] = [
  {
    slug: 'tokyo',
    nameEn: 'Tokyo',
    nameZh: '東京',
    countryZh: '日本',
    tagline: '一座把秩序和混亂都做到極致的城市',
    intro: [
      '東京不是一個景點的城市，是一百個街區的城市。原宿和銀座隔了三站，卻像兩個星球。',
      '所以逛東京的正確方式不是趕行程，是挑兩三個街區，把它們走透。剩下的，留給下一次。',
    ],
    heroImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&h=800&fit=crop',
    sections: [
      {
        title: '必去景點',
        titleEn: 'SEE',
        items: [
          { name: '明治神宮', area: '原宿', note: '從竹下通走進來只要五分鐘，卻安靜得像另一個世界。東京最厲害的反差。' },
          { name: 'teamLab Planets', area: '豐洲', note: '赤腳走進水裡看數位藝術。照片拍不出十分之一，要親自進去。' },
          { name: '谷中銀座', area: '谷根千', note: '老東京的下町生活還在這裡運轉：貓、煎餅店、黃昏的階梯。' },
          { name: 'Shibuya Sky', area: '澀谷', note: '從上往下看十字路口的人流，你會突然理解這座城市的節奏。' },
        ],
      },
      {
        title: '咖啡與甜點',
        titleEn: 'CAFÉ',
        items: [
          { name: 'Blue Bottle 清澄白河', area: '清澄白河', note: '倉庫改建的旗艦店，東京第三波咖啡的起點之一。順便逛整個街區的小店。' },
          { name: 'Fuglen Tokyo', area: '奧澀谷', note: '從奧斯陸來的復古咖啡店，白天喝咖啡晚上變酒吧。奧澀谷散步的起點。' },
          { name: '茶亭 羽當', area: '澀谷', note: '昭和喫茶店的手沖儀式感。在澀谷的喧囂裡，這裡的時間流得比較慢。' },
        ],
      },
      {
        title: '風格購物',
        titleEn: 'SHOP',
        items: [
          { name: '代官山 蔦屋書店', area: '代官山', note: '把書店做成生活方式的教科書。買不買書都該來一次。' },
          { name: '下北澤古著街', area: '下北澤', note: '整個街區都是古著店和唱片行。東京年輕人的品味養成地。' },
          { name: 'Dover Street Market', area: '銀座', note: '川久保玲的選物宇宙，七層樓的前衛時尚。銀座最不像銀座的地方。' },
        ],
      },
      {
        title: '在地體驗',
        titleEn: 'LOCAL',
        items: [
          { name: '築地場外市場早餐', area: '築地', note: '市場搬走了，但場外的老店還在。早上七點的玉子燒和海鮮丼。' },
          { name: '錢湯體驗', area: '高圓寺', note: '小杉湯這類老錢湯正被年輕人重新愛上。四百多円泡進東京的日常。' },
          { name: '目黑川散步', area: '中目黑', note: '沿著河走，兩岸都是小店。櫻花季瘋狂，平日則是剛剛好的安靜。' },
        ],
      },
    ],
  },
  {
    slug: 'seoul',
    nameEn: 'Seoul',
    nameZh: '首爾',
    countryZh: '韓國',
    tagline: '全世界最會把「新」做成風格的城市',
    intro: [
      '首爾的厲害在速度：一個廢工廠街區，三年就能變成全城最有型的地方。',
      '但真正值得看的，是新舊之間的縫隙 — 韓屋巷子裡的咖啡店、老市場旁邊的選物店。',
    ],
    heroImage: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=1200&h=800&fit=crop',
    sections: [
      {
        title: '必去景點',
        titleEn: 'SEE',
        items: [
          { name: '景福宮與西村', area: '鐘路', note: '看完宮殿別急著走，旁邊西村的巷弄才是首爾人的日常。' },
          { name: '東大門設計廣場 DDP', area: '東大門', note: '札哈·哈蒂的流線建築，晚上打燈之後像一艘太空船。' },
          { name: '北村韓屋村', area: '三清洞', note: '傳統韓屋的屋簷線條。早一點去，趕在人潮前面。' },
          { name: '漢江公園', area: '漢江', note: '首爾人的客廳。買個炸雞外送到江邊，就是最在地的一餐。' },
        ],
      },
      {
        title: '咖啡與甜點',
        titleEn: 'CAFÉ',
        items: [
          { name: 'Onion 聖水店', area: '聖水洞', note: '廢工廠改建的代表作。粗糙的水泥牆配精緻的麵包，首爾美學的縮影。' },
          { name: 'Fritz Coffee', area: '桃花洞', note: '海狗 logo 的復古咖啡品牌，韓國精品咖啡的代表隊。' },
          { name: '益善洞韓屋咖啡巷', area: '益善洞', note: '最老的韓屋街區塞滿了最新的咖啡店，新舊混搭到極致。' },
        ],
      },
      {
        title: '風格購物',
        titleEn: 'SHOP',
        items: [
          { name: '聖水洞街區', area: '聖水洞', note: '製鞋工廠變成選物店和展示空間，被叫做首爾的布魯克林。' },
          { name: '漢南洞', area: '龍山', note: '安靜的坡道上是設計師品牌和畫廊，首爾品味的高地。' },
          { name: '弘大自由市場', area: '弘大', note: '獨立創作者的手作市集，年輕的首爾在這裡擺攤。' },
        ],
      },
      {
        title: '在地體驗',
        titleEn: 'LOCAL',
        items: [
          { name: '汗蒸幕', area: '各區', note: '躺在熱石房裡流汗、喝甜米露、吃雞蛋。韓國人的休息方式。' },
          { name: '廣藏市場', area: '鐘路', note: '麻藥飯捲和綠豆煎餅，站著吃才對味。首爾胃的原點。' },
          { name: '經理團路夜晚', area: '梨泰院', note: '坡道上的小酒館和咖啡店，首爾夜生活比較安靜的那一面。' },
        ],
      },
    ],
  },
  {
    slug: 'new-york',
    nameEn: 'New York',
    nameZh: '紐約',
    countryZh: '美國',
    tagline: '每個人都在趕時間，每個人都覺得自己是主角',
    intro: [
      '紐約的能量不在景點，在街上。走路十分鐘看到的人，比別的城市一天還多。',
      '所以在紐約最好的行程就是：選一個街區，走路，然後讓城市自己發生。',
    ],
    heroImage: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&h=800&fit=crop',
    aliases: ['nyc', '纽约'],
    sections: [
      {
        title: '必去景點',
        titleEn: 'SEE',
        items: [
          { name: 'The High Line', area: '雀兒喜', note: '廢棄鐵道變成空中花園，紐約都市更新的代表作。從下往上逛到哈德遜園區。' },
          { name: 'DUMBO', area: '布魯克林', note: '曼哈頓橋框住紅磚街道的那個畫面。清晨去，光線和人潮都對。' },
          { name: '大都會博物館', area: '上東區', note: '一天走不完，所以別貪心。挑兩個展區，好好看。' },
          { name: '中央公園', area: '曼哈頓', note: '紐約人真正的後院。租一台單車，或只是找張長椅看人。' },
        ],
      },
      {
        title: '咖啡與甜點',
        titleEn: 'CAFÉ',
        items: [
          { name: 'Devoción', area: '威廉斯堡', note: '哥倫比亞直送生豆，整面植生牆和天窗。布魯克林咖啡的門面。' },
          { name: '西村咖啡巷弄', area: '西村', note: '西四街一帶的小店密度是全紐約最高，挑一間坐窗邊看街。' },
          { name: 'Bakeri', area: '布魯克林', note: '北歐系的小麵包店，制服圍裙都好看。早餐的正確打開方式。' },
        ],
      },
      {
        title: '風格購物',
        titleEn: 'SHOP',
        items: [
          { name: 'SoHo 石板街區', area: 'SoHo', note: '鑄鐵建築裡塞滿旗艦店和買手店，時尚產業的櫥窗。' },
          { name: 'Strand 書店', area: '聯合廣場', note: '「18 英里的書」。二手書和絕版攝影集，挖寶要留時間。' },
          { name: 'Brooklyn Flea', area: '布魯克林', note: '古著、老家具、黑膠。紐約人的品味在跳蚤市場現形。' },
        ],
      },
      {
        title: '在地體驗',
        titleEn: 'LOCAL',
        items: [
          { name: 'Smorgasburg 市集', area: '威廉斯堡', note: '週末限定的露天美食市集，排隊最長的那攤通常值得。' },
          { name: '清晨的布魯克林大橋', area: '布魯克林', note: '七點前上橋，只有晨跑的人和你。走向曼哈頓那個方向。' },
          { name: '百老匯 Rush Ticket', area: '劇院區', note: '當日券碰運氣，用小預算看一場大製作。' },
        ],
      },
    ],
  },
  {
    slug: 'taipei',
    nameEn: 'Taipei',
    nameZh: '台北',
    countryZh: '台灣',
    tagline: '一座被低估的生活之城',
    intro: [
      '台北的好從來不在打卡點，在巷子裡。一條赤峰街，打鐵舖和咖啡店共用同一面牆。',
      '這座城市最迷人的是密度：走路五分鐘，可以從廟口走到選物店，從老屋走到新浪潮。',
    ],
    heroImage: 'https://images.unsplash.com/photo-1470004914212-05527e49370b?w=1200&h=800&fit=crop',
    sections: [
      {
        title: '必去景點',
        titleEn: 'SEE',
        items: [
          { name: '大稻埕迪化街', area: '大同區', note: '南北貨老街屋裡開出茶館、布行、酒吧。台北新舊共存的最佳示範。' },
          { name: '象山步道', area: '信義區', note: '爬二十分鐘換一個 101 的最佳視角。傍晚上去，看城市點燈。' },
          { name: '北投溫泉博物館', area: '北投', note: '日式浴場建築配溫泉鄉的硫磺味，台北最有時代感的角落。' },
          { name: '華山 1914', area: '中正區', note: '酒廠變文創園區，展覽和市集輪番上陣。' },
        ],
      },
      {
        title: '咖啡與甜點',
        titleEn: 'CAFÉ',
        items: [
          { name: '赤峰街咖啡群', area: '中山', note: '打鐵街變咖啡街區，每間店都小小的，但都有自己的態度。' },
          { name: 'Fika Fika Cafe', area: '伊通公園', note: '北歐烘焙賽冠軍的作品，淺焙的乾淨風味配公園綠意。' },
          { name: '永康街巷弄', area: '大安', note: '觀光客在街上，咖啡在巷子裡。往青田街方向鑽就對了。' },
        ],
      },
      {
        title: '風格購物',
        titleEn: 'SHOP',
        items: [
          { name: '中山赤峰街選物', area: '中山', note: '獨立品牌、古著、器物店的密集帶，台北品味的前線。' },
          { name: '誠品生活', area: '信義／松菸', note: '深夜書店的傳奇還在。買書之外，選物樓層更值得逛。' },
          { name: '溫州街獨立書店', area: '師大', note: '大學旁的舊書店和獨立出版，台北的知識份子氣味。' },
        ],
      },
      {
        title: '在地體驗',
        titleEn: 'LOCAL',
        items: [
          { name: '寧夏夜市', area: '大同區', note: '規模不大但密度極高，老攤比例全台北最好。從頭吃到尾剛剛好。' },
          { name: '陽明山溫泉', area: '北投／陽明山', note: '捷運可達的火山溫泉。平日下午去，一個人一池。' },
          { name: '霞海城隍廟', area: '大稻埕', note: '拜月老最有名的廟。信不信由你，儀式感本身就值得。' },
        ],
      },
    ],
  },
  {
    slug: 'paris',
    nameEn: 'Paris',
    nameZh: '巴黎',
    countryZh: '法國',
    tagline: '巴黎人最懂的事：把日常過成值得被看的樣子',
    intro: [
      '巴黎的美不需要努力，這正是它讓人生氣又著迷的地方。',
      '別把行程排滿。在巴黎，坐在咖啡店外面看街一小時，跟進羅浮宮一樣重要。',
    ],
    heroImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&h=800&fit=crop',
    sections: [
      {
        title: '必去景點',
        titleEn: 'SEE',
        items: [
          { name: '瑪黑區巷弄', area: 'Le Marais', note: '中世紀街區裡是畫廊、猶太麵包店和買手店。巴黎最會逛的一區。' },
          { name: '奧賽美術館', area: '左岸', note: '火車站改建的美術館，印象派的家。大鐘後面那個視角記得找。' },
          { name: '盧森堡公園', area: '第六區', note: '巴黎人閱讀、下棋、曬太陽的地方。綠色鐵椅隨你搬。' },
          { name: '塞納河畔舊書攤', area: '河岸', note: '綠色鐵箱一打開就是舊書、海報和版畫，聯合國教科文組織認證的風景。' },
        ],
      },
      {
        title: '咖啡與甜點',
        titleEn: 'CAFÉ',
        items: [
          { name: 'Café de Flore', area: '聖日耳曼', note: '沙特和波娃的老座位。觀光客很多，但左岸文人傳統就從這裡開始。' },
          { name: 'KB CaféShop', area: '南皮加勒', note: '巴黎新一波咖啡的代表，SoPi 街區散步的補給站。' },
          { name: 'Du Pain et des Idées', area: '運河區', note: '老麵包店的招牌是香蕉巧克力麵包卷，早上去排隊的都是在地人。' },
        ],
      },
      {
        title: '風格購物',
        titleEn: 'SHOP',
        items: [
          { name: 'Merci', area: '瑪黑區', note: '概念店的教科書，中庭那台紅色小車是全巴黎最會賣貨的裝飾。' },
          { name: 'Shakespeare and Company', area: '拉丁區', note: '塞納河邊的英文書店，海明威那一代的文學據點。' },
          { name: '聖圖安跳蚤市場', area: '克利尼昂古爾', note: '全世界最大的古董市場之一，老燈具和舊畫框的迷宮。' },
        ],
      },
      {
        title: '在地體驗',
        titleEn: 'LOCAL',
        items: [
          { name: '巴士底市集', area: '第十一區', note: '週末早上的露天市集，起司攤和牡蠣攤都直接開吃。' },
          { name: '藝術橋看日落', area: '塞納河', note: '帶一瓶酒坐在橋上，巴黎的傍晚自動變成電影。' },
          { name: '週日的瑪黑區', area: 'Le Marais', note: '大部分巴黎店週日休息，瑪黑區照開。巴黎人自己也在這天來逛。' },
        ],
      },
    ],
  },
];

// Normalize a slug or search string for matching
function norm(s: string) {
  return decodeURIComponent(s).trim().toLowerCase().replace(/\s+/g, '-');
}

// Find a flagship guide by slug, English name, or Chinese name
export function getStaticGuide(slugOrName: string): CityGuide | undefined {
  const n = norm(slugOrName);
  return CITY_GUIDES.find(
    g =>
      g.slug === n ||
      norm(g.nameEn) === n ||
      g.nameZh === decodeURIComponent(slugOrName).trim() ||
      g.aliases?.some(a => norm(a) === n)
  );
}

// Detect a known city mentioned inside a free-text search query
// (e.g. 「東京哪裡比較好玩」 → Tokyo guide)
export function matchCityInQuery(query: string): CityGuide | undefined {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return undefined;
  return CITY_GUIDES.find(
    g =>
      q.includes(g.nameZh) ||
      q.includes(g.nameEn.toLowerCase()) ||
      g.aliases?.some(a => q.includes(a.toLowerCase()))
  );
}
