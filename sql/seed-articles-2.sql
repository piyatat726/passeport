-- ============================================
-- Seed 20 More PASSEPORT Articles (#11-30)
-- Run this in Supabase SQL Editor
-- ============================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the first user
  SELECT id INTO v_user_id FROM users LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found! Create an account first.';
  END IF;

  -- Article 11: 維也納咖啡館
  INSERT INTO posts (user_id, title, subtitle, content, category, cover_image_url, additional_images, location, tags)
  VALUES (
    v_user_id,
    '維也納咖啡館裡沒有人在趕時間',
    '一座城市用兩百年的時間，把「坐著不動」變成了藝術',
    E'維也納的咖啡館有一條不成文的規矩：你可以只點一杯 Melange，然後坐一整個下午，沒有人會趕你走。\n\n這不是因為維也納人特別好心。是因為他們真心認為，坐在咖啡館裡什麼都不做，本身就是一件有價值的事。\n\n## Kaffeehaus 不是咖啡廳\n\n不要拿星巴克的概念來理解維也納的咖啡館。這裡沒有外帶杯，沒有 Wi-Fi 密碼貼在牆上，沒有人打開筆電假裝在工作。\n\n有的是大理石桌面、絲絨長椅、一份夾在木條架上的當日報紙，和一杯放在銀色托盤上的咖啡——旁邊永遠附一杯水。\n\n那杯水不是裝飾。它的意思是：慢慢來。\n\n## Café Central 的幽靈\n\n維也納最有名的咖啡館 Café Central，已經開了超過一百四十年。佛洛伊德在這裡寫過論文，托洛茨基在這裡下過棋。\n\n現在觀光客很多，排隊要半小時。但如果你避開尖峰時段，找一個角落的位子坐下來，點一份 Apfelstrudel 和一杯 Einspänner，你會理解為什麼那些人願意在這裡消磨一輩子。\n\n不是因為咖啡特別好喝。是因為那個空間的氣質——挑高的天花板、昏黃的燈光、銀器碰瓷盤的聲音——讓你的腦袋自動切換到另一個速度。\n\n## 給不趕時間的人\n\n如果你去維也納，至少留一個下午給咖啡館。\n\n不要帶筆電。不要一直看手機。帶一本書，或者什麼都不帶。\n\n你會發現，坐著不動三個小時之後，你想到的東西比忙一整天還多。\n\n維也納人兩百年前就知道這件事。我們現在才在學。',
    'cafe_journal',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
    '{}',
    'Vienna, Austria',
    ARRAY['vienna', 'kaffeehaus', 'cafe-culture', 'slow-living', 'europe', 'coffee']
  );

  -- Article 12: 曼谷街頭穿搭
  INSERT INTO posts (user_id, title, subtitle, content, category, cover_image_url, additional_images, location, tags)
  VALUES (
    v_user_id,
    '曼谷 35 度，他們還是穿得很好看',
    '熱帶城市的穿衣邏輯：當你不能靠層次取勝的時候',
    E'曼谷的溫度常年在 32 到 38 度之間。濕度大概 80%。你走出飯店五分鐘，全身就濕了。\n\n在這種天氣穿衣服，基本上只有兩個選擇：放棄，或者想辦法。\n\n曼谷的年輕人選了後者。\n\n## 熱帶時尚的限制與自由\n\n寒冷的城市有外套、圍巾、靴子、層次。你可以用堆疊來製造視覺效果。\n\n曼谷沒有這個選項。一件上衣、一條褲子或裙子、一雙鞋。就這樣。\n\n所以你得在更少的單品裡做文章。\n\n**顏色。** 曼谷的街頭穿搭用色比任何歐洲城市都大膽。芒果黃配電光藍、粉紅配橘色——在灰色的倫敦會顯得太過，但在曼谷的陽光下，這些顏色反而剛好。\n\n**材質。** 棉和麻是基本款。但曼谷的設計師也大量使用絲——泰絲的光澤在陽光下非常好看，而且透氣。\n\n**配件。** 因為衣服只有兩件，配件就變得特別重要。一頂好看的帽子、一副有態度的墨鏡、一個手工編織的包——這些細節在曼谷比衣服本身更重要。\n\n## Siam 不是唯一的答案\n\n觀光客都去 Siam 商圈，百貨公司一間接一間。\n\n但真正有意思的東西在 Ari 區和 Charoenkrung 路。Ari 有很多本地設計師的小店，價格合理，風格獨特。Charoenkrung 是曼谷最老的路，現在被年輕創作者重新注入活力，每個月都有新的 pop-up 出現。\n\n## 你可以學到什麼\n\n曼谷教會你一件事：穿衣服不一定要多。\n\n當你只能穿一件上衣的時候，那件上衣最好是有趣的。\n\n當你不能靠層次取勝的時候，你就得靠選擇取勝。\n\n每一件都要值得穿在身上。沒有「反正外面會被外套蓋住」的藉口。',
    'style_diary',
    'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800',
    '{}',
    'Bangkok, Thailand',
    ARRAY['bangkok', 'tropical-fashion', 'thai-style', 'street-style', 'summer-dressing']
  );

  -- Article 13: 波爾多的餐桌
  INSERT INTO posts (user_id, title, subtitle, content, category, cover_image_url, additional_images, location, tags)
  VALUES (
    v_user_id,
    '波爾多的餐桌上，葡萄酒不是配角',
    '在法國西南部，吃飯是一場以酒為中心的儀式',
    E'波爾多人不會問你「要不要喝酒」。他們會問你「要喝什麼酒」。\n\n在這座城市，晚餐沒有葡萄酒是不完整的。就像台北的晚餐沒有米飯一樣不可思議。\n\n## 不需要懂酒，只需要喝\n\n很多人覺得法國酒很難懂。年份、產區、葡萄品種、左岸右岸——光是讀酒標就像在考法文。\n\n但波爾多人喝酒的方式其實非常簡單：去附近的酒莊，買一箱他們喝了二十年的那款，回家打開就喝。\n\n沒有搖杯、沒有嗅聞、沒有在嘴裡滾來滾去。就是打開，倒進杯子，喝。\n\n那些儀式是給侍酒師的。普通的波爾多人只在乎一件事：好不好喝。\n\n## 市場裡的午餐\n\n波爾多的 Marché des Capucins 是當地人的食堂。\n\n清晨六點開始，漁販開始叫賣牡蠣。你可以站在攤位前，讓他幫你現開六顆，配一杯冰涼的白酒，站著吃完。\n\n早上七點，吃牡蠣，喝白酒，周圍都是買菜的阿姨。\n\n這在大部分城市會被視為有問題。在波爾多，這是正常的早餐選項。\n\n## Entrecôte 的哲學\n\n波爾多有一道菜幾乎每間餐廳都有：entrecôte à la bordelaise。牛排配波爾多紅酒醬。\n\n醬汁用的是真正的波爾多紅酒、紅蔥頭、骨髓。一塊好的 entrecôte 不需要其他花俏的調味，紅酒醬已經說完了所有的話。\n\n簡單、直接、好吃。\n\n這就是波爾多餐桌的哲學。不需要擺盤像藝術品，不需要二十道分子料理。\n\n一塊好肉、一杯好酒、一張不趕人的桌子。\n\n夠了。',
    'table_taste',
    'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800',
    '{}',
    'Bordeaux, France',
    ARRAY['bordeaux', 'french-wine', 'food-culture', 'gastronomy', 'france']
  );

  -- Article 14: 倫敦的 Charity Shop
  INSERT INTO posts (user_id, title, subtitle, content, category, cover_image_url, additional_images, location, tags)
  VALUES (
    v_user_id,
    '倫敦的 Charity Shop 是最民主的時尚',
    '五英鎊的 Burberry 圍巾和兩英鎊的 Paul Smith 襯衫，都是真的',
    E'倫敦有一種店，全世界其他地方很少見。\n\n它叫 charity shop——慈善商店。人們把不要的東西捐出來，商店賣掉之後，收入歸慈善機構。Oxfam、British Heart Foundation、Cancer Research UK，幾乎每條高街都有。\n\n聽起來像是在賣別人的舊貨。事實上也是。\n\n但在倫敦，這些舊貨的水準非常高。\n\n## 富人區的 Charity Shop\n\n訣竅在於：去對的社區。\n\n倫敦的 Notting Hill、Chelsea、Hampstead——這些區域住的是什麼人？是那種會把穿過兩次的 Burberry 大衣捐掉的人。\n\n所以你在 Chelsea 的 Oxfam 裡，可能用五英鎊買到一條 Hermès 絲巾。不是仿的。是哪位阿姨覺得「這個花色我不喜歡了」然後捐出來的。\n\n這就是倫敦的 charity shop 讓人上癮的原因。\n\n## 尋寶的技巧\n\n**常去。** 好東西是隨機出現的。你不可能去一次就找到 Prada。但如果你每週三都去同一間，機率會大幅提升。\n\n**先看材質。** 不要被品牌迷惑。先摸布料。好的布料不管掛在哪裡，手感都是對的。\n\n**看尺碼，不看標籤。** Charity shop 的衣服通常不能試穿。你需要知道自己的尺寸，而且要會目測。\n\n**不要猶豫。** 你今天不買，明天就被別人買走了。五英鎊的東西，不值得考慮太久。\n\n## 這跟時尚有什麼關係\n\n很多。\n\nCharity shop 是最好的時尚教育。你在這裡學會辨認布料、辨認版型、辨認什麼東西經得起時間的考驗。\n\n而且它很民主。你不需要有錢才能穿好的東西。你需要的是眼光。\n\n眼光比預算重要。\n\n倫敦的 charity shop 每天都在證明這件事。',
    'city_guide',
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
    '{}',
    'London, United Kingdom',
    ARRAY['london', 'charity-shop', 'vintage', 'thrifting', 'sustainable-fashion', 'british-style']
  );

  -- Article 15: 京都的和菓子
  INSERT INTO posts (user_id, title, subtitle, content, category, cover_image_url, additional_images, location, tags)
  VALUES (
    v_user_id,
    '京都和菓子：你捨不得吃的那一口',
    '日本甜點師傅用糯米和紅豆，做出四季的形狀',
    E'在京都的和菓子店，你買的不是甜點。你買的是一個季節。\n\n春天的櫻餅用鹽漬櫻葉包著粉色的麻糬，吃起來有花的香氣。夏天的水饅頭透明如水，裡面包一顆紅豆沙，看起來像一滴露水。秋天的栗子金團用栗子泥手工塑形，表面的紋路像秋天的雲。冬天的花瓣餅白色的外皮裡包著味噌餡，安靜得像下雪的下午。\n\n每一款只在它的季節出現。錯過了，要再等一年。\n\n## 為什麼和菓子長這樣\n\n和菓子的造型不是設計師決定的。是自然決定的。\n\n師傅出門散步，看到一朵花開了、一片葉子變色了、一隻蝴蝶停在枝頭。回到工作室，用糯米粉和豆沙，把那個瞬間做出來。\n\n這不是創作，是觀察。最好的和菓子師傅不是手最巧的，是眼睛最敏感的。\n\n## 去哪裡吃\n\n京都的和菓子老舖多到數不完，但有幾間是一定要去的。\n\n**嘯月。** 需要預約，而且只做外帶。每次只做少量，賣完就收。味道極度安靜，不甜膩，像在嘴裡下了一場小雨。\n\n**中村軒。** 在桂離宮附近，名物是麥代餅。糯米餅裡包紅豆餡，外面裹一層炒過的大麥粉。口感樸實到讓你想哭。\n\n**出町柳的豆餅。** 下鴨神社旁邊的出町ふたば，永遠在排隊。他們的豆餅——糯米皮裡有整顆紅豌豆，包著紅豆沙——是京都人從小吃到大的味道。\n\n## 一期一會的甜\n\n和菓子教會你的事情是：美好的東西不需要永遠存在。\n\n它出現在對的時間，你好好品嚐，然後它就消失了。\n\n這很京都。也很人生。',
    'table_taste',
    'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800',
    '{}',
    'Kyoto, Japan',
    ARRAY['kyoto', 'wagashi', 'japanese-sweets', 'food-culture', 'seasonal', 'japan']
  );

  -- Article 16: 柏林的黑色派對
  INSERT INTO posts (user_id, title, subtitle, content, category, cover_image_url, additional_images, location, tags)
  VALUES (
    v_user_id,
    '柏林的穿衣守則只有一條：黑色',
    '在這座城市，時尚不是穿給別人看的',
    E'柏林人穿黑色，不是因為時尚。是因為黑色最不需要解釋。\n\n你穿一件粉紅色外套走在巴黎，人家覺得你很 chic。穿同一件走在柏林，人家會多看你一眼——不是欣賞的那種看，是「你是觀光客嗎」的那種看。\n\n## 柏林黑 vs 紐約黑\n\n紐約人穿黑色是因為方便。早上不用想搭配，黑配黑永遠不會錯。\n\n柏林人穿黑色是一種態度。它說的是：我不在乎你怎麼看我。我穿衣服不是為了被看。\n\n所以柏林的黑色通常不是精緻的。它是寬大的、有點皺的、可能昨天穿過沒洗的。不是 Celine 那種價值三千歐的極簡黑，是在跳蚤市場花三歐買的工裝外套。\n\n重點不是看起來好看。重點是舒服，然後真實。\n\n## Techno 跟時尚的關係\n\n柏林的夜生活塑造了這座城市的穿衣風格。\n\n如果你要去 Berghain——或者任何一間柏林的 techno club——你需要的裝備是：黑色、舒服、能跳整晚的鞋子。\n\n不要穿太新的衣服，不要穿有明顯 logo 的東西，不要看起來像「特別打扮過」。在柏林的夜店，太精心的打扮反而是一種格格不入。\n\n這跟紐約、倫敦完全相反。在那些城市，你盛裝打扮是為了進門。在柏林，你不打扮是為了進門。\n\n## Kreuzberg 的日常\n\n柏林最有風格的區不是 Mitte（那裡現在太觀光了），是 Kreuzberg 和 Neukölln。\n\n走在 Kreuzberg 的街上，你會看到：穿著 oversized 黑色大衣騎腳踏車的女生、用黑色膠帶修過的 Dr. Martens、手工刺青、退色的牛仔褲外面套一件更退色的黑色風衣。\n\n沒有人在追求什麼潮流。他們只是穿自己覺得對的東西。\n\n這可能是全世界最健康的時尚態度。',
    'style_diary',
    'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800',
    '{}',
    'Berlin, Germany',
    ARRAY['berlin', 'all-black', 'techno-culture', 'german-style', 'anti-fashion', 'kreuzberg']
  );

  -- Article 17: 墨爾本的咖啡
  INSERT INTO posts (user_id, title, subtitle, content, category, cover_image_url, additional_images, location, tags)
  VALUES (
    v_user_id,
    '墨爾本的咖啡已經是一種宗教',
    '南半球的咖啡之都，認真到有點瘋狂',
    E'墨爾本人對咖啡的執著，已經到了一個外人很難理解的程度。\n\n他們會為了一杯好的 flat white 走二十分鐘。他們會因為某間咖啡廳換了豆子而生氣。他們會在 Instagram 上跟陌生人爭論到底哪間店的 espresso 萃取比較好。\n\n這不是嗜好。這是信仰。\n\n## 為什麼是墨爾本\n\n二戰之後，大量義大利和希臘移民來到墨爾本。他們帶來了 espresso 機器和對咖啡的講究。\n\n但墨爾本人做了一件義大利人沒做的事：他們把咖啡變成了一種精品文化。\n\n義大利的咖啡是日常的——站著喝、很便宜、不需要想太多。墨爾本的咖啡是精品的——單一產區、手沖、淺焙、每一杯都有自己的風味筆記。\n\n## 巷弄裡的咖啡館\n\n墨爾本最好的咖啡館幾乎都藏在巷子裡。這座城市的巷弄文化是出了名的——那些窄窄的、塗滿街頭藝術的小巷，每一條都可能藏著一間讓你改變人生觀的咖啡廳。\n\n你推開一扇看起來什麼都沒有的門，裡面是一個只有八個座位的空間。吧台後面一個紋身的 barista，正在用你沒見過的器具做一杯咖啡。\n\n他會問你：要不要試試他們剛進的衣索比亞日曬豆？有藍莓和巧克力的風味。\n\n你本來只想要一杯正常的拿鐵。但你點了那杯衣索比亞。\n\n然後你就回不去了。\n\n## 點單指南\n\n**Flat white。** 墨爾本的招牌。比拿鐵少一點奶、比卡布奇諾多一點奶。奶泡細密到幾乎看不見。\n\n**Long black。** 不是美式。是先放熱水、再倒 espresso。差別在 crema 被保留了。\n\n**Magic。** 墨爾本獨有的飲品。雙份 ristretto 加少量牛奶，裝在一個小杯子裡。非常濃、非常好喝。\n\n不要點「大杯摩卡加鮮奶油」。會被用眼神審判的。',
    'cafe_journal',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
    '{}',
    'Melbourne, Australia',
    ARRAY['melbourne', 'coffee-culture', 'flat-white', 'specialty-coffee', 'australia', 'cafe']
  );

  -- Article 18: 摩洛哥的色彩
  INSERT INTO posts (user_id, title, subtitle, content, category, cover_image_url, additional_images, location, tags)
  VALUES (
    v_user_id,
    '馬拉喀什的色彩讓你重新思考「配色」這件事',
    '在北非的市集裡，所有你認為衝突的顏色都和諧了',
    E'到馬拉喀什的第一天，你的眼睛會很累。\n\n不是因為沙塵或陽光。是因為顏色太多了。\n\n## 色彩的轟炸\n\n走進 Jemaa el-Fnaa 廣場旁邊的露天市集（souk），你的視覺會被徹底淹沒。\n\n橘紅色的香料堆成小山，旁邊是靛藍色的陶器。翠綠色的薄荷茶壺掛在牆上，對面是粉紅色和金色交織的手織地毯。紫色的洋蔥、黃色的薑黃、深紅色的番紅花——每一個攤位都是一幅抽象畫。\n\n在時尚學校裡，老師會告訴你：一個造型不要超過三種顏色。\n\n馬拉喀什用整座城市告訴你：那個規則是錯的。\n\n## 為什麼這些顏色放在一起是對的\n\n因為光線。\n\n馬拉喀什的陽光非常強烈、非常溫暖。在這種光線下，顏色的飽和度會被自然地壓下來，互相之間的衝突感也會降低。\n\n同樣的配色放在北歐的灰光下，可能會很刺眼。但在北非的陽光下，它們融合得恰到好處。\n\n這也是為什麼很多時尚設計師會來馬拉喀什找靈感。Saint Laurent 在這裡住了幾十年。他花園裡的那種藍——Majorelle blue——成了他最標誌性的顏色之一。\n\n## 你可以帶回家的東西\n\n**一條 Berber 地毯。** 不是機器織的觀光客款。是某個 Atlas 山區的女人花了三個月手織的那種。每一條的圖案都不一樣，因為每一條都是她的故事。殺價是必須的。開價的三分之一是合理的起點。\n\n**一雙 Babouche。** 摩洛哥傳統皮拖鞋，沒有鞋跟，尖頭。穿久了會變成你的腳的形狀。很多顏色可以選。\n\n**幾包香料。** Ras el hanout——摩洛哥的萬用綜合香料。每個商人的配方都不同，有的辣一點、有的甜一點。買回家之後，你煮什麼都想加一點。\n\n馬拉喀什會擴大你的色彩容忍度。\n\n回來之後你可能會突然想穿一件橘色的襯衫。\n\n穿吧。',
    'travel_notes',
    'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=800',
    '{}',
    'Marrakech, Morocco',
    ARRAY['marrakech', 'morocco', 'color', 'souk', 'travel', 'north-africa']
  );

  -- Article 19: 丹寧的故事
  INSERT INTO posts (user_id, title, subtitle, content, category, cover_image_url, additional_images, location, tags)
  VALUES (
    v_user_id,
    '一條牛仔褲的旅程：從礦坑到 runway',
    '丹寧布可能是人類史上最偉大的布料發明',
    E'全世界大概有 45 億條牛仔褲。每年還有 12 億條新的被做出來。\n\n沒有任何一種衣服比牛仔褲更普遍。也沒有任何一種衣服的故事比它更長。\n\n## 從工作服到反叛符號\n\n1873 年，Levi Strauss 和裁縫師 Jacob Davis 用銅鉚釘加固了一條工作褲的口袋。這條褲子後來叫 501，是給礦工和農夫穿的。\n\n然後 James Dean 穿了它。然後 Marlon Brando 穿了它。然後所有叛逆的年輕人都穿了它。\n\n牛仔褲從「工人的制服」變成了「不想聽大人話的人的制服」。\n\n到了 80 年代，Calvin Klein 用牛仔褲拍了一支讓全美國家長崩潰的廣告。丹寧布從反叛變成了性感。\n\n再到現在，一條 vintage Levi''s 在東京的二手店可以賣到幾十萬日圓。丹寧布從性感變成了收藏品。\n\n## Raw Denim 的偏執\n\n如果你認識玩 raw denim 的人，你會知道那是一種什麼程度的偏執。\n\n他們買一條沒有經過任何水洗處理的「原色」牛仔褲，然後穿六個月到一年不洗。讓褲子隨著自己的身體、動作、生活方式，慢慢養出專屬的紋路和色落。\n\n膝蓋彎曲的地方會有蜂巢狀的紋路。口袋放手機的位置會有一個長方形的淡色印記。腰帶的位置會有摩擦的痕跡。\n\n每一條養出來的褲子都是獨一無二的。因為每個人的身體和習慣都不一樣。\n\n## 你真正需要的只有一條\n\n不管你選 Levi''s 501、A.P.C. Petit Standard、還是日本的桃太郎——找到那條版型對的牛仔褲，然後一直穿。\n\n不要買五條勉強的。買一條完美的。\n\n然後看著它隨著你的生活慢慢改變。\n\n三年之後，那條褲子會變成你的自傳。',
    'style_diary',
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800',
    '{}',
    'Los Angeles, USA',
    ARRAY['denim', 'levis', 'raw-denim', 'fashion-history', 'jeans', 'workwear']
  );

  -- Article 20: 台南小吃
  INSERT INTO posts (user_id, title, subtitle, content, category, cover_image_url, additional_images, location, tags)
  VALUES (
    v_user_id,
    '台南人吃東西的方式，外地人學不來',
    '一座用味覺建構記憶的城市',
    E'台南人早餐吃牛肉湯。\n\n不是那種慢慢熬的紅燒牛肉。是當天凌晨現宰的溫體牛，切成薄片，放進碗裡，淋上滾燙的清湯，肉片在三秒內從紅變粉。\n\n你得趕在早上六點半之前到。去晚了就賣完了。\n\n## 甜是一種態度\n\n外地人到台南最大的文化衝擊不是廟多、不是巷子窄。是甜。\n\n台南的食物幾乎什麼都帶甜味。肉燥飯是甜的。擔仔麵是甜的。連棺材板裡面的白醬都是甜的。\n\n這不是因為台南人嗜糖。是因為台南的甜來自食材本身——糖是台南三百年前最重要的產業，甘蔗田的甜滲進了這座城市的味覺 DNA。\n\n你在台南吃到的甜，不是加了很多糖的那種甜。是一種底層的、溫暖的、像日照一樣的甜味。\n\n## 不能錯過的東西\n\n**碗粿。** 在來米漿蒸出來的半透明米糕，上面放肉燥、蛋黃、香菇。吃起來軟但不爛，每一口都有醬油和油蔥酥的香味。\n\n**蝦仁飯。** 火燒蝦用豬油炒過，鋪在飯上。蝦很小、很甜、很彈。飯粒吸了蝦油和醬汁，每一粒都有味道。\n\n**義豐冬瓜茶。** 整條冬瓜用糖慢慢熬煮八小時。喝起來不是那種死甜，是一種回甘的、有深度的甜。夏天加冰塊，冬天喝溫的。\n\n## 台南教會我的吃飯哲學\n\n台南人吃東西不追求排場。一間沒有招牌的路邊攤、一張鐵桌子、一碗湯——這就是他們的米其林。\n\n重點從來不是「去哪裡吃很厲害的東西」。\n\n而是「今天的虱目魚有沒有比昨天好吃」。\n\n食物的好壞不是靠裝潢和價格定義的。是靠那個每天站在鍋前、重複做同一件事做了三十年的人定義的。\n\n這大概是台南最迷人的地方。',
    'table_taste',
    'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800',
    '{}',
    'Tainan, Taiwan',
    ARRAY['tainan', 'taiwanese-food', 'street-food', 'beef-soup', 'local-cuisine', 'taiwan']
  );

  -- Article 21: 布拉格的建築穿搭
  INSERT INTO posts (user_id, title, subtitle, content, category, cover_image_url, additional_images, location, tags)
  VALUES (
    v_user_id,
    '布拉格的建築教你怎麼穿衣服',
    '一座城市的立面層次，就是最好的穿搭課',
    E'布拉格的舊城區有一件很神奇的事：每棟建築的風格都不一樣，但放在一起卻完全和諧。\n\n哥德式教堂旁邊是巴洛克的宮殿，巴洛克旁邊是新藝術風格的公寓，新藝術旁邊是立體派的房子。五個世紀的建築，擠在同一條街上，卻沒有人覺得突兀。\n\n為什麼？\n\n## 色調統一\n\n走在布拉格的街上，你會發現不管什麼風格的建築，它們的色調都在同一個範圍裡：赭石色、鵝黃色、灰綠色、淡粉色、米白色。\n\n沒有刺眼的顏色，沒有跳出來搶戲的建築。大家在同一個色溫裡玩，所以不管形狀多不同，視覺上還是協調的。\n\n這跟穿搭的道理一樣。\n\n你可以混搭很多不同風格的單品——西裝外套配球鞋、工裝褲配絲綢襯衫——只要它們的色調在同一個家族裡，穿起來就不會亂。\n\n## 層次的遊戲\n\n布拉格的巴洛克建築特別講究立面的層次。柱子、雕花、窗框、陽台——每一層都有自己的細節，疊在一起形成豐富的視覺深度。\n\n這跟秋冬穿搭的邏輯完全一樣。一件好看的秋天造型，通常有三到四層：T-shirt、襯衫、針織背心、外套。每一層露出一點邊緣，形成節奏。\n\n**重點是：每一層都要值得被看到。** 即使只露出一公分的領口或袖口，那個細節也要是有意識的選擇。\n\n## 比例的智慧\n\n布拉格的建築還教了一件事：底部厚重、頂部輕盈。\n\n大部分好看的建築，一樓的石材最厚實，越往上越細緻、越透亮。這個比例讓建築看起來穩定但不笨重。\n\n穿衣服也可以用這個概念：\n\n下半身選擇有份量感的——寬褲、厚底鞋、深色。\n上半身選擇輕一點的——淺色、薄材質、柔軟的線條。\n\n穩定但不沉悶。\n\n下次去布拉格的時候，抬頭看看那些房子。它們是最好的穿搭老師。',
    'style_diary',
    'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800',
    '{}',
    'Prague, Czech Republic',
    ARRAY['prague', 'architecture', 'styling-tips', 'color-theory', 'layering', 'europe']
  );

  -- Article 22: 上海梧桐區
  INSERT INTO posts (user_id, title, subtitle, content, category, cover_image_url, additional_images, location, tags)
  VALUES (
    v_user_id,
    '上海梧桐區：法租界的咖啡館不賣懷舊',
    '在最有歷史感的街區裡，年輕人正在發明新的生活方式',
    E'上海人說的「梧桐區」，大概是從武康路到安福路、從淮海中路到永嘉路的那一片。法國梧桐樹在夏天把整條路蓋住，走在下面像走在綠色的隧道裡。\n\n這一帶以前叫法租界。現在不這樣叫了，但那些 1920 年代蓋的老洋房還在。一樓變成了咖啡廳，二樓變成了買手店。\n\n## 每五十公尺一間咖啡廳\n\n這不是誇張。\n\n上海梧桐區的咖啡廳密度可能是全亞洲最高的。而且每一間都不一樣。\n\n有的把老洋房的客廳原封不動地保留下來，磨石子地板、鑄鐵欄杆、壁爐上面放了一束乾燥花。你覺得自己像坐在某個 1930 年代上海名媛的家裡。\n\n有的走極簡路線，整間店只有白牆、水泥、一張長桌。像一個什麼都拿掉的空間，只剩下咖啡跟你。\n\n有的開在一樓車庫裡，門面只有兩公尺寬，但豆子是自己烘的，品質可以跟墨爾本的精品咖啡廳對打。\n\n## 安福路的下午\n\n安福路是梧桐區最有「生活感」的一條街。\n\n週末的下午，這條路上擠滿了穿得好看的年輕人。他們的風格很難用一個詞定義——不完全是日系、不完全是韓系、也不完全是歐美。是一種混合了所有影響，但又帶著上海特有的精緻和矜持的東西。\n\n上海人穿衣服有一個特點：不太犯錯。\n\n他們可能不是最大膽的，但他們對比例、質感、完成度的要求，在中國所有城市裡是最高的。\n\n## 買手店的生態\n\n梧桐區的買手店（select shop）是觀察中國獨立設計師最好的窗口。\n\n這些店挑的品牌通常沒有什麼知名度——沒有明星代言，沒有社群行銷。但你翻開衣服看做工，會發現它們的水準已經跟國際品牌不相上下。\n\n中國的年輕設計師正在變得非常厲害。\n\n只是還沒有很多人注意到而已。',
    'city_guide',
    'https://images.unsplash.com/photo-1537531383496-f4749b04f800?w=800',
    '{}',
    'Shanghai, China',
    ARRAY['shanghai', 'french-concession', 'cafe-culture', 'chinese-fashion', 'select-shop', 'street-style']
  );

  -- Article 23: 拿坡里披薩
  INSERT INTO posts (user_id, title, subtitle, content, category, cover_image_url, additional_images, location, tags)
  VALUES (
    v_user_id,
    '拿坡里人說：披薩只有兩種是真的',
    '在披薩的原產地，少即是多不是哲學，是常識',
    E'在拿坡里點披薩，你基本上只有兩個選擇：\n\nMargherita。番茄、Mozzarella、羅勒、橄欖油。\n\nMarinara。番茄、大蒜、奧勒岡、橄欖油。連起司都沒有。\n\n就這樣。\n\n## 不要加鳳梨\n\n這不是玩笑。如果你在拿坡里的披薩店問有沒有夏威夷披薩，最好的結果是被忽略，最壞的結果是被趕出去。\n\n拿坡里人對披薩的態度非常簡單：好的食材不需要太多裝飾。番茄就是番茄，Mozzarella 就是 Mozzarella。你把最好的東西放在一起，不要擋住它們的味道，就夠了。\n\n任何額外的 topping 都是對食材的不尊重。\n\n（好啦，他們不會真的趕你出去。但他們會用一種很義大利的方式嘆氣。）\n\n## 90 秒的藝術\n\n一個好的拿坡里披薩在窯裡只待 60 到 90 秒。\n\n溫度大概攝氏 485 度。餅皮在這個溫度下會迅速膨脹，外面焦脆、裡面還有一點嚼勁。邊緣（cornicione）會像氣球一樣鼓起來，上面有一些焦黑的泡泡——那些斑點叫 leoparding，是好披薩的標誌。\n\n這個過程不能多也不能少。多十秒就乾了，少十秒就不夠熟。\n\n## 去哪裡吃\n\n拿坡里有太多好的披薩店了。每個當地人都會跟你說不同的答案。\n\n但有幾件事是共通的：\n\n**排隊的店通常是好的。** 拿坡里人不會浪費時間排不好吃的東西。\n\n**門面越不起眼越好。** 那些裝潢漂亮的通常是開給觀光客的。真正的好店可能就是一個磁磚地板、塑膠桌椅、牆上掛了一些足球隊旗的地方。\n\n**一整張吃。** 不要切。拿坡里人用手把披薩對折（a libretto），然後整片拿起來吃。\n\n這是效率。也是態度。\n\n你面前的這張披薩，從做好到你吃完，最好不要超過十分鐘。\n\n因為好的披薩跟好的時刻一樣，不等人。',
    'table_taste',
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800',
    '{}',
    'Naples, Italy',
    ARRAY['naples', 'pizza', 'italian-food', 'margherita', 'food-culture', 'italy']
  );

  -- Article 24: 阿姆斯特丹騎腳踏車
  INSERT INTO posts (user_id, title, subtitle, content, category, cover_image_url, additional_images, location, tags)
  VALUES (
    v_user_id,
    '阿姆斯特丹人穿高跟鞋騎腳踏車，而且不覺得有什麼',
    '在這座城市，腳踏車不是交通工具，是身體的延伸',
    E'阿姆斯特丹有 88 萬台腳踏車。人口只有 87 萬。\n\n腳踏車比人多。這大概是你需要知道的第一件事。\n\n## 所有人都騎\n\n銀行家穿著三件式西裝騎。媽媽前面載一個小孩後面載一個小孩騎。老奶奶穿毛皮大衣騎。年輕女生穿迷你裙和高跟靴騎，大衣被風吹得像披風一樣飄。\n\n沒有人覺得這有什麼特別的。也沒有人戴安全帽。\n\n在阿姆斯特丹，腳踏車不是一個你需要特別「換裝」才能使用的交通工具。你穿什麼出門，就穿什麼騎車。腳踏車是你的腿的延伸，不是一項運動。\n\n## 車比人有個性\n\n阿姆斯特丹人的腳踏車通常很醜。\n\n不是偶然的醜。是故意的醜。因為好看的車會被偷。\n\n所以你會看到各種生鏽的、掉漆的、坐墊用膠帶纏的、籃子歪掉的腳踏車。越醜越安全。\n\n但偶爾你會看到一台不一樣的。一台很老的荷蘭品牌 Gazelle 或 Batavus，黑色的車架被擦得很乾淨，皮革坐墊因為坐了太多年而變成深棕色。鍊條蓋有一個優雅的弧度，跟車架的線條完美配合。\n\n那種車跟它的主人通常已經在一起很多年了。像一雙穿了十年的皮鞋。\n\n## 你學不來的部分\n\n觀光客租腳踏車在阿姆斯特丹騎，通常會發生三件事：\n\n一，被電車軌道卡住前輪摔車。\n二，在運河邊轉彎太急差點掉進水裡。\n三，被當地人用荷蘭語罵。\n\n因為阿姆斯特丹的腳踏車道有自己的規則——不成文的、從小學騎到大的、靠身體記憶的規則。什麼時候要讓、什麼時候可以超車、怎麼用手勢表達「我要左轉」。\n\n這些東西沒有人教你。你得摔幾次才會懂。\n\n就像學穿衣服一樣。看書沒有用，你得自己犯幾次錯。',
    'travel_notes',
    'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800',
    '{}',
    'Amsterdam, Netherlands',
    ARRAY['amsterdam', 'cycling', 'dutch-culture', 'street-style', 'netherlands', 'travel']
  );

  -- Article 25: 清邁的慢時尚
  INSERT INTO posts (user_id, title, subtitle, content, category, cover_image_url, additional_images, location, tags)
  VALUES (
    v_user_id,
    '清邁正在安靜地改寫亞洲時尚的規則',
    '在泰國北部的山城裡，一群設計師選擇用最慢的速度做衣服',
    E'清邁不是你會聯想到時尚的地方。\n\n它是一座被山圍住的古城，寺廟比商店多，街上走的是僧侶和觀光客。大部分人穿夾腳拖和寬鬆的棉麻褲，看起來像來度假的。\n\n但如果你知道去哪裡找，你會發現這座城市正在發生一些非常有趣的事。\n\n## 手工織布的復興\n\n泰國北部的山區部落——Karen、Hmong、Lisu——有幾百年的手工織布傳統。那些布料的圖案、色彩、織法，是幾代人傳下來的智慧。\n\n十幾年前，這些技藝快要消失了。年輕人離開山區去城市工作，沒有人學織布。\n\n現在有一些清邁的年輕設計師回去找這些老師傅合作。他們用傳統的手工布料，做出現代的剪裁。一件看起來像 COS 的極簡襯衫，但布料是 Karen 族的阿嬤用手工織布機織出來的。\n\n一件襯衫可能要花三週才能完成。因為布料不能趕。\n\n## Nimmanhaemin 之外\n\n觀光客都在 Nimmanhaemin 路上逛。那裡有很多好的咖啡廳和泰國品牌的連鎖店。但真正有意思的獨立品牌藏在老城區的小巷裡。\n\n有一些設計師把自己的工作室直接當成展示空間。你推門進去，可能先看到一台織布機，然後是幾件掛在牆上的樣衣，然後設計師本人坐在角落跟你聊天。\n\n這種體驗在快時尚主導的世界裡越來越少了。\n\n## 為什麼這很重要\n\n快時尚教會我們「衣服是用完就丟的東西」。一件 T-shirt 三百塊，穿三次就扔。\n\n清邁的慢時尚提醒你另一種可能：一件衣服可以是某個人花了三個禮拜的時間，用手做出來的東西。它有重量。它有故事。它不應該被用完就丟。\n\n這不是道德審判。是一種選擇。\n\n你選擇買什麼樣的衣服，就是選擇支持什麼樣的世界。',
    'travel_notes',
    'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=800',
    '{}',
    'Chiang Mai, Thailand',
    ARRAY['chiang-mai', 'slow-fashion', 'handwoven', 'thai-design', 'sustainable', 'artisan']
  );

  -- Article 26: 紐約地鐵穿搭
  INSERT INTO posts (user_id, title, subtitle, content, category, cover_image_url, additional_images, location, tags)
  VALUES (
    v_user_id,
    '紐約地鐵是全世界最好的時裝秀',
    '在 L train 上，每個人都是模特兒',
    E'紐約的時裝週一年兩次。但紐約的地鐵時裝秀每天都在演。\n\n## L train 的美學\n\n如果你只能選一條地鐵線觀察紐約的穿搭，選 L train。\n\n它從曼哈頓的 14 街一路開到布魯克林的 Bushwick。車上的人從 Chelsea 的藝廊工作者、Williamsburg 的創意人、到 Bushwick 的藝術家，每一站上來的人穿的風格都不一樣。\n\nChelsea 上來的人穿得像《Vogue》的street style 頁面。全身黑，但每一件都是你叫不出名字但很貴的品牌。\n\nWilliamsburg 上來的人穿得像從 90 年代穿越來的。vintage 運動外套、寬版牛仔褲、一雙被穿到快解體的 New Balance 993。\n\nBushwick 上來的人穿得像沒有在穿。但那個「沒有在穿」是精心計算過的：手繪的 DIY T-shirt、在跳蚤市場找到的軍用外套、用安全別針改造過的裙子。\n\n## 為什麼紐約的街頭風格全世界最強\n\n因為紐約是一座所有文化都被壓縮在同一個空間裡的城市。\n\n地鐵車廂裡，一個穿 abaya 的穆斯林女性、一個穿全套 Supreme 的高中生、一個穿 Thom Browne 短褲西裝的上班族、一個穿哈雷騎士皮衣的老頭——他們可能同時站在同一根扶手上。\n\n這種密度，讓紐約人從小就習慣看到各種穿衣方式。所以他們不太會被嚇到。你穿什麼都可以。只要你穿得像你自己。\n\n## 地鐵穿搭的實用守則\n\n**鞋子要耐走。** 紐約人一天走一萬步起跳。球鞋是正義。\n\n**外套要好脫。** 夏天地鐵裡冷氣開到像冰箱，冬天暖氣開到像三溫暖。你永遠不知道下一站是哪個溫度。\n\n**包要背的。** 你的手要空出來扶扶手、滑手機、擋住試圖推你的人。\n\n紐約是一座不溫柔的城市。但它對穿衣服這件事，非常寬容。',
    'city_guide',
    'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
    '{}',
    'New York, USA',
    ARRAY['new-york', 'subway', 'street-style', 'brooklyn', 'fashion-observation', 'nyc']
  );

  -- Article 27: 伊斯坦堡的茶
  INSERT INTO posts (user_id, title, subtitle, content, category, cover_image_url, additional_images, location, tags)
  VALUES (
    v_user_id,
    '伊斯坦堡的茶杯長得像鬱金香，這不是巧合',
    '土耳其人一天喝十杯紅茶，而且每一杯都用同一種杯子',
    E'土耳其人喝的茶比英國人多。\n\n這不是都市傳說。土耳其是全世界人均茶葉消費量最高的國家。一個普通的土耳其人一天喝七到十杯茶。而且不是隨便喝。是用一種特定的、鬱金香形狀的小玻璃杯喝。\n\n## 那個杯子\n\n土耳其的茶杯叫 ince belli——「纖腰」的意思。腰部收窄、上緣微微外翻，從側面看確實像一朵鬱金香。\n\n這個形狀不只是好看。它有功能：\n\n收窄的腰部讓你可以用手指握住杯子而不被燙到（因為茶杯沒有把手）。上寬下窄的形狀讓你可以看到茶的顏色是不是對的——太深太淺都不行，要是那種透明的、帶金色光澤的深紅色。\n\n土耳其人判斷一杯茶好不好，第一步是看顏色。不是喝。\n\n## çaydanlık 的兩層邏輯\n\n土耳其人煮茶用的是一種雙層茶壺（çaydanlık）。下層是熱水壺，上層是放茶葉的小壺。下層的蒸氣加熱上層，讓茶葉慢慢悶出味道。\n\n喝的時候，先從上層倒一點很濃的茶到杯子裡，再用下層的熱水稀釋到你喜歡的濃度。\n\n這個系統很聰明。每個人可以自己調整濃淡。喜歡濃的多倒一點上層，喜歡淡的多加一點熱水。\n\n## 茶是社交的起點\n\n在伊斯坦堡，拒絕一杯茶幾乎是不禮貌的。\n\n你走進一間地毯店，老闆會先倒茶。你去修鞋子，師傅會先遞茶。你跟計程車司機聊天聊到他下班，他會邀請你去他常去的茶館喝一杯。\n\n茶不是飲料。茶是「我把你當朋友」的開場白。\n\n## 在加拉塔大橋上喝\n\n伊斯坦堡最好的喝茶地點是加拉塔大橋下層的茶攤。\n\n你坐在一張搖搖晃晃的塑膠椅上，面對博斯普魯斯海峽。渡輪經過的時候，海水的鹹味會飄過來。\n\n你手上那杯茶很燙、很甜（土耳其人放很多糖）、很紅。\n\n一杯大概七塊台幣。\n\n可能是伊斯坦堡最便宜的幸福。',
    'cafe_journal',
    'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800',
    '{}',
    'Istanbul, Turkey',
    ARRAY['istanbul', 'turkish-tea', 'tea-culture', 'turkey', 'cafe', 'travel']
  );

  -- Article 28: 斯德哥爾摩的功能美學
  INSERT INTO posts (user_id, title, subtitle, content, category, cover_image_url, additional_images, location, tags)
  VALUES (
    v_user_id,
    '斯德哥爾摩人不說「好看」，他們說「好用」',
    '瑞典設計的核心不是美感，是一種對功能的偏執',
    E'你去斯德哥爾摩人的家裡，第一個感覺是：空。\n\n不是那種因為窮所以東西少的空。是那種每一件物品都被仔細考慮過、不需要的全部不留的空。\n\n## 功能美學的極致\n\n瑞典人買東西有一個標準：它好不好用？\n\n不是好不好看。是好不好用。\n\n好看但不實用的東西，他們不會買。不好看但很實用的東西，他們會用到它壞掉。\n\n但奇妙的是，當一個東西真的非常好用的時候，它往往也是好看的。因為好的功能需要好的形狀，而好的形狀本身就是一種美。\n\n這就是瑞典設計的核心邏輯。不是為了美而設計。是為了用而設計。美是副產品。\n\n## 衣櫃裡的瑞典邏輯\n\n斯德哥爾摩人的衣櫃通常不大。但裡面的每一件東西都能互相搭配。\n\n**配色系統化。** 大部分人有一個固定的色盤：黑、灰、白、深藍、卡其。買新衣服的時候，第一個問題是「它跟我衣櫃裡的東西配不配」。不配就不買。\n\n**材質優先。** 寧可花兩倍的錢買一件好材質的，也不要買三件便宜的。好的羊毛衫穿十年，便宜的穿一季就起毛球。\n\n**修而不丟。** 瑞典的衣物修改店生意很好。褲子太長了改短，外套的拉鍊壞了換新的，毛衣出現一個洞就補起來。\n\n這不是因為他們小氣。是因為他們真心覺得：已經好用的東西，為什麼要換？\n\n## Acne Studios 的啟示\n\n瑞典最有名的時尚品牌 Acne Studios，完美體現了這個邏輯。\n\n他們的衣服看起來很「普通」——剪裁乾淨、顏色低調、沒有多餘的裝飾。但你穿上去就知道差別在哪：肩線的位置、口袋的深度、釦子的手感。每一個「看不到的細節」都是對的。\n\n好的設計不是讓你注意到設計。\n\n是讓你忘記設計的存在。\n\n穿起來剛好、用起來順手、看起來自然。\n\n瑞典人把這個做到了極致。',
    'style_diary',
    'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=800',
    '{}',
    'Stockholm, Sweden',
    ARRAY['stockholm', 'swedish-design', 'minimalism', 'acne-studios', 'functional-fashion', 'scandinavia']
  );

  -- Article 29: 香港茶餐廳
  INSERT INTO posts (user_id, title, subtitle, content, category, cover_image_url, additional_images, location, tags)
  VALUES (
    v_user_id,
    '香港茶餐廳的速度感，是一種都市美學',
    '在最擠的城市裡，五分鐘吃完一頓飯不是趕，是效率',
    E'香港的茶餐廳沒有時間等你慢慢看菜單。\n\n你坐下來，阿姐已經站在旁邊了。手上拿著一支筆、一張單子、一臉「你要點什麼」的表情。你如果猶豫超過五秒，她會先走去服務下一桌。\n\n這不是態度差。這是香港的速度。\n\n## 茶餐廳是什麼\n\n茶餐廳是香港獨有的餐飲形態。它不是中餐，不是西餐，是一種只有在香港這種特殊歷史條件下才會誕生的混合體。\n\n菜單上同時有公仔麵和意粉、有叉燒飯和法蘭西多士、有港式奶茶和好立克。中西並列，毫不違和。\n\n因為這就是香港。一座把所有文化塞進同一條街的城市。\n\n## 奶茶的秘密\n\n港式奶茶用的是紅茶加淡奶（evaporated milk），不是鮮奶。\n\n茶葉要用「絲襪」（其實是棉紗袋）反覆沖泡好幾次，萃取出極濃的茶底。然後加入淡奶，攪拌均勻。\n\n好的港式奶茶喝起來有一種獨特的滑順感——茶夠濃、奶夠厚、甜度由你自己加糖控制。香港人把這個口感叫「茶走」的時候少糖、「茶少甜」的時候微糖。\n\n每一間茶餐廳的奶茶味道都不一樣。因為茶葉的配方是師傅的秘密。有人混四種茶葉，有人混五種。比例差一點，味道就完全不同。\n\n## 搭枱文化\n\n午餐時間的茶餐廳一定滿座。你不可能獨佔一張四人桌。\n\n所以你會跟陌生人共桌——香港人叫「搭枱」。你們面對面坐著，中間可能隔一個醬油瓶，各吃各的。\n\n不需要打招呼、不需要假裝認識、不需要聊天。吃完了站起來就走。\n\n這種看似冷漠的默契，其實是一種都市生存的智慧：在最擠的空間裡，尊重彼此的邊界。\n\n## 消失中的老店\n\n香港的老茶餐廳正在一間一間關掉。\n\n租金太高了。年輕人不想接。那些用了三十年的鐵桌子、磨到看不清字的菜單牌、油煙薰黃的天花板——這些東西無法被復刻。\n\n等它們消失了，就真的消失了。',
    'table_taste',
    'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800',
    '{}',
    'Hong Kong',
    ARRAY['hong-kong', 'cha-chaan-teng', 'milk-tea', 'food-culture', 'city-life', 'disappearing']
  );

  -- Article 30: 巴塞隆納的午後
  INSERT INTO posts (user_id, title, subtitle, content, category, cover_image_url, additional_images, location, tags)
  VALUES (
    v_user_id,
    '巴塞隆納的下午兩點到五點，什麼事都不會發生',
    '西班牙人的午睡文化正在消失，但那種「不急」的精神還在',
    E'你在巴塞隆納的下午兩點走出餐廳，發現整條街的店都關了。\n\n不是因為放假。不是因為出事了。是因為午休。\n\n## Siesta 的邏輯\n\n西班牙的午休文化（siesta）有氣候的原因：夏天下午太熱了，做什麼都沒效率，不如睡一覺。\n\n但更深的原因是：西班牙人對時間的態度跟北歐人完全不同。\n\n北歐人的時間是線性的。效率、產出、不浪費一分一秒。\n\n西班牙人的時間是圓的。工作有工作的時間，吃飯有吃飯的時間，休息有休息的時間。每一段時間都要被好好對待。不能因為工作重要，就犧牲吃飯。\n\n所以西班牙的午餐不是三十分鐘的便當。是兩個小時的正式一餐。前菜、主菜、甜點、咖啡，一道一道慢慢來。\n\n然後休息。然後回去上班。上到晚上八、九點。然後吃晚餐。晚餐十點開始。\n\n對外國人來說，這個時間表很瘋狂。對西班牙人來說，這是唯一合理的活法。\n\n## 巴塞隆納的穿搭節奏\n\n因為一天被午休切成兩半，巴塞隆納人的穿搭也有兩個版本。\n\n上午到下午兩點是「正式版」：去辦公室或去見人的裝扮。\n\n下午五點之後是「放鬆版」：換了鞋子、把襯衫塞出來、可能加了一副墨鏡。同一個人看起來像換了一個人。\n\n這種一天之內的風格切換，是地中海城市特有的。因為他們的一天真的比較長。\n\n## El Born 的傍晚\n\n如果你在巴塞隆納只有一個傍晚，去 El Born 區。\n\n下午六點左右，這個區域會開始活過來。小巷子裡的酒吧一間一間開門，人們站在門口喝第一杯 vermouth。光線從金色慢慢變成粉紅色，中世紀的石牆被染成暖調。\n\n沒有人在看手機。大家都在聊天。\n\n你會聞到 tapas 的味道——橄欖油、蒜頭、煎魚——從某扇門後面飄出來。\n\n然後你會突然理解，為什麼西班牙人不覺得他們的時間表有什麼問題。\n\n如果你的傍晚是這樣的，你也不會想改。',
    'city_guide',
    'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
    '{}',
    'Barcelona, Spain',
    ARRAY['barcelona', 'siesta', 'spanish-culture', 'slow-living', 'mediterranean', 'tapas']
  );

  RAISE NOTICE 'Successfully seeded 20 articles (#11-30) for user %', v_user_id;
END $$;
