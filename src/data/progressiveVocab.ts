export interface VocabWorldEntry {
  key: string;
  worldTheme: string;
  english: string;
  words: Record<string, string>;
  phonetic: Record<string, string>;
  /** Short sentence combining this word with the previous word when applicable */
  sentences: Record<string, string>;
  /** Word-by-word tokens for English meaning mapping */
  englishSentence: string;
}

// Foundational & expanding concrete vocabulary across all 15 PIRYAS languages.
// Path #1 begins with "Cat" (e.g., Hindi: बिल्ली), Path #2 builds "Water" + "Cat drinks water", etc.
export const PROGRESSIVE_VOCAB_BANK: VocabWorldEntry[] = [
  {
    key: 'cat',
    worldTheme: 'Friendly Animals World',
    english: 'Cat',
    words: {
      en: 'Cat', de: 'Katze', ja: '猫', es: 'Gato', zh: '猫',
      fr: 'Chat', ko: '고양이', it: 'Gatto', pt: 'Gato', ar: 'قطة',
      hi: 'बिल्ली', ru: 'Кошка', tr: 'Kedi', nl: 'Kat', sv: 'Katt',
    },
    phonetic: {
      en: 'kat', de: 'kat-seh', ja: 'neko', es: 'ga-to', zh: 'mao',
      fr: 'sha', ko: 'go-yang-i', it: 'gat-to', pt: 'ga-to', ar: 'qit-ta',
      hi: 'bil-lee', ru: 'kosh-ka', tr: 'ke-di', nl: 'kat', sv: 'katt',
    },
    englishSentence: 'The cat is here',
    sentences: {
      en: 'The cat is here.', de: 'Die Katze ist hier.', ja: '猫がここにいます。',
      es: 'El gato está aquí.', zh: '猫在这里。', fr: 'Le chat est ici.',
      ko: '고양이가 여기에 있어요.', it: 'Il gatto è qui.', pt: 'O gato está aqui.',
      ar: 'القطة هنا.', hi: 'बिल्ली यहाँ है।', ru: 'Кошка здесь.',
      tr: 'Kedi burada.', nl: 'De kat is hier.', sv: 'Katten är här.',
    },
  },
  {
    key: 'water',
    worldTheme: 'Pure Water World',
    english: 'Water',
    words: {
      en: 'Water', de: 'Wasser', ja: '水', es: 'Agua', zh: '水',
      fr: 'Eau', ko: '물', it: 'Acqua', pt: 'Água', ar: 'ماء',
      hi: 'पानी', ru: 'Вода', tr: 'Su', nl: 'Water', sv: 'Vatten',
    },
    phonetic: {
      en: 'waw-ter', de: 'vas-ser', ja: 'mizu', es: 'a-gwa', zh: 'shui',
      fr: 'oh', ko: 'mul', it: 'ak-kwa', pt: 'a-gwa', ar: 'maa',
      hi: 'paa-nee', ru: 'va-da', tr: 'su', nl: 'va-ter', sv: 'vat-ten',
    },
    englishSentence: 'The cat drinks water',
    sentences: {
      en: 'The cat drinks water.', de: 'Die Katze trinkt Wasser.', ja: '猫が水を飲みます。',
      es: 'El gato bebe agua.', zh: '猫喝水。', fr: "Le chat boit de l'eau.",
      ko: '고양이가 물을 마셔요.', it: "Il gatto beve l'acqua.", pt: 'O gato bebe água.',
      ar: 'القطة تشرب الماء.', hi: 'बिल्ली पानी पीती है।', ru: 'Кошка пьёт воду.',
      tr: 'Kedi su içiyor.', nl: 'De kat drinkt water.', sv: 'Katten dricker vatten.',
    },
  },
  {
    key: 'milk',
    worldTheme: 'Morning Kitchen World',
    english: 'Milk',
    words: {
      en: 'Milk', de: 'Milch', ja: '牛乳', es: 'Leche', zh: '牛奶',
      fr: 'Lait', ko: '우유', it: 'Latte', pt: 'Leite', ar: 'حليب',
      hi: 'दूध', ru: 'Молоко', tr: 'Süt', nl: 'Melk', sv: 'Mjölk',
    },
    phonetic: {
      en: 'milk', de: 'milkh', ja: 'gyu-nyu', es: 'le-che', zh: 'niu-nai',
      fr: 'leh', ko: 'u-yu', it: 'lat-te', pt: 'lei-te', ar: 'ha-leeb',
      hi: 'doodh', ru: 'ma-la-ko', tr: 'syut', nl: 'melk', sv: 'myolk',
    },
    englishSentence: 'The cat wants fresh milk',
    sentences: {
      en: 'The cat wants fresh milk.', de: 'Die Katze möchte frische Milch.', ja: '猫は新鮮な牛乳が欲しいです。',
      es: 'El gato quiere leche fresca.', zh: '猫想要新鲜牛奶。', fr: 'Le chat veut du lait frais.',
      ko: '고양이가 신선한 우유를 원해요.', it: 'Il gatto vuole latte fresco.', pt: 'O gato quer leite fresco.',
      ar: 'القطة تريد حليباً طازجاً.', hi: 'बिल्ली को ताज़ा दूध चाहिए।', ru: 'Кошка хочет свежее молоко.',
      tr: 'Kedi taze süt istiyor.', nl: 'De kat wil verse melk.', sv: 'Katten vill ha färsk mjölk.',
    },
  },
  {
    key: 'dog',
    worldTheme: 'Park Companions World',
    english: 'Dog',
    words: {
      en: 'Dog', de: 'Hund', ja: '犬', es: 'Perro', zh: '狗',
      fr: 'Chien', ko: '개', it: 'Cane', pt: 'Cão', ar: 'كلب',
      hi: 'कुत्ता', ru: 'Собака', tr: 'Köpek', nl: 'Hond', sv: 'Hund',
    },
    phonetic: {
      en: 'dog', de: 'hunt', ja: 'inu', es: 'pe-rro', zh: 'gou',
      fr: 'shyan', ko: 'gae', it: 'ka-ne', pt: 'kaun', ar: 'kalb',
      hi: 'kut-taa', ru: 'sa-ba-ka', tr: 'kyo-pek', nl: 'hont', sv: 'hund',
    },
    englishSentence: 'The dog and the cat play',
    sentences: {
      en: 'The dog and the cat play.', de: 'Der Hund und die Katze spielen.', ja: '犬と猫が遊びます。',
      es: 'El perro y el gato juegan.', zh: '狗和猫一起玩。', fr: 'Le chien et le chat jouent.',
      ko: '개와 고양이가 놀아요.', it: 'Il cane e il gatto giocano.', pt: 'O cão e o gato brincam.',
      ar: 'الكلب والقطة يلعبان.', hi: 'कुत्ता और बिल्ली खेलते हैं।', ru: 'Собака и кошка играют.',
      tr: 'Köpek ve kedi oynuyor.', nl: 'De hond en de kat spelen.', sv: 'Hunden och katten leker.',
    },
  },
  {
    key: 'home',
    worldTheme: 'Cozy Home World',
    english: 'House',
    words: {
      en: 'House', de: 'Haus', ja: '家', es: 'Casa', zh: '房子',
      fr: 'Maison', ko: '집', it: 'Casa', pt: 'Casa', ar: 'بيت',
      hi: 'घर', ru: 'Дом', tr: 'Ev', nl: 'Huis', sv: 'Hus',
    },
    phonetic: {
      en: 'haus', de: 'haus', ja: 'ie', es: 'ka-sa', zh: 'fang-zi',
      fr: 'me-zon', ko: 'jip', it: 'ka-za', pt: 'ka-za', ar: 'bayt',
      hi: 'ghar', ru: 'dom', tr: 'ev', nl: 'hois', sv: 'huus',
    },
    englishSentence: 'My house is clean and warm',
    sentences: {
      en: 'My house is clean and warm.', de: 'Mein Haus ist sauber und warm.', ja: '私の家はきれいで暖かいです。',
      es: 'Mi casa es limpia y cálida.', zh: '我的房子干净又温暖。', fr: 'Ma maison est propre et chaude.',
      ko: '우리 집은 깨끗하고 따뜻해요.', it: 'La mia casa è pulita e calda.', pt: 'Minha casa é limpa e aconchegante.',
      ar: 'بيتي نظيف ودافئ.', hi: 'मेरा घर साफ और गर्म है।', ru: 'Мой дом чистый и тёплый.',
      tr: 'Evim temiz ve sıcak.', nl: 'Mijn huis is schoon en warm.', sv: 'Mitt hus är rent och varmt.',
    },
  },
  {
    key: 'book',
    worldTheme: 'Reading & Library World',
    english: 'Book',
    words: {
      en: 'Book', de: 'Buch', ja: '本', es: 'Libro', zh: '书',
      fr: 'Livre', ko: '책', it: 'Libro', pt: 'Livro', ar: 'كتاب',
      hi: 'किताब', ru: 'Книга', tr: 'Kitap', nl: 'Boek', sv: 'Bok',
    },
    phonetic: {
      en: 'buk', de: 'bukh', ja: 'hon', es: 'li-bro', zh: 'shu',
      fr: 'leevr', ko: 'chaek', it: 'li-bro', pt: 'li-vro', ar: 'ki-taab',
      hi: 'ki-taab', ru: 'kni-ga', tr: 'ki-tap', nl: 'book', sv: 'buuk',
    },
    englishSentence: 'I read a good book at home',
    sentences: {
      en: 'I read a good book at home.', de: 'Ich lese zu Hause ein gutes Buch.', ja: '家で良い本を読みます。',
      es: 'Leo un buen libro en casa.', zh: '我在家读一本好书。', fr: 'Je lis un bon livre à la maison.',
      ko: '집에서 좋은 책을 읽어요.', it: 'Leggo un buon libro a casa.', pt: 'Eu leio um bom livro em casa.',
      ar: 'أقرأ كتاباً جيداً في البيت.', hi: 'मैं घर पर एक अच्छी किताब पढ़ता हूँ।', ru: 'Я читаю хорошую книгу дома.',
      tr: 'Evde güzel bir kitap okuyorum.', nl: 'Ik lees thuis een goed boek.', sv: 'Jag läser en bra bok hemma.',
    },
  },
  {
    key: 'apple',
    worldTheme: 'Fresh Fruit Market World',
    english: 'Apple',
    words: {
      en: 'Apple', de: 'Apfel', ja: 'りんご', es: 'Manzana', zh: '苹果',
      fr: 'Pomme', ko: '사과', it: 'Mela', pt: 'Maçã', ar: 'تفاحة',
      hi: 'सेब', ru: 'Яблоко', tr: 'Elma', nl: 'Appel', sv: 'Äpple',
    },
    phonetic: {
      en: 'ap-ul', de: 'ap-fel', ja: 'ringo', es: 'man-sa-na', zh: 'ping-guo',
      fr: 'pom', ko: 'sa-gwa', it: 'me-la', pt: 'ma-san', ar: 'tuf-fa-ha',
      hi: 'seb', ru: 'yab-la-ka', tr: 'el-ma', nl: 'ap-el', sv: 'ep-ple',
    },
    englishSentence: 'She eats a sweet red apple',
    sentences: {
      en: 'She eats a sweet red apple.', de: 'Sie isst einen süßen roten Apfel.', ja: '彼女は甘い赤いりんごを食べます。',
      es: 'Ella come una manzana roja dulce.', zh: '她吃一个甜红苹果。', fr: 'Elle mange une pomme rouge sucrée.',
      ko: '그녀는 달콤한 빨간 사과를 먹어요.', it: 'Lei mangia una mela rossa dolce.', pt: 'Ela come uma maçã vermelha doce.',
      ar: 'هي تأكل تفاحة حمراء حلوة.', hi: 'वह एक मीठा लाल सेब खाती है।', ru: 'Она ест сладкое красное яблоко.',
      tr: 'O tatlı kırmızı bir elma yiyor.', nl: 'Zij eet een zoete rode appel.', sv: 'Hon äter ett sött rött äpple.',
    },
  },
  {
    key: 'friend',
    worldTheme: 'Community & Friends World',
    english: 'Friend',
    words: {
      en: 'Friend', de: 'Freund', ja: '友達', es: 'Amigo', zh: '朋友',
      fr: 'Ami', ko: '친구', it: 'Amico', pt: 'Amigo', ar: 'صديق',
      hi: 'दोस्त', ru: 'Друг', tr: 'Arkadaş', nl: 'Vriend', sv: 'Vän',
    },
    phonetic: {
      en: 'frend', de: 'froynt', ja: 'to-mo-da-chi', es: 'a-mi-go', zh: 'peng-you',
      fr: 'a-mi', ko: 'chin-gu', it: 'a-mi-ko', pt: 'a-mi-go', ar: 'sa-deeq',
      hi: 'dost', ru: 'droog', tr: 'ar-ka-dash', nl: 'vreend', sv: 'ven',
    },
    englishSentence: 'My friend brings a book and tea',
    sentences: {
      en: 'My friend brings a book and tea.', de: 'Mein Freund bringt ein Buch und Tee.', ja: '友達が本とお茶を持ってきます。',
      es: 'Mi amigo trae un libro y té.', zh: '我的朋友带来了书和茶。', fr: 'Mon ami apporte un livre et du thé.',
      ko: '제 친구가 책과 차를 가져와요.', it: 'Il mio amico porta un libro e del tè.', pt: 'Meu amigo traz um livro e chá.',
      ar: 'صديقي يحضر كتاباً وشاياً.', hi: 'मेरा दोस्त एक किताब और चाय लाता है।', ru: 'Мой друг приносит книгу и чай.',
      tr: 'Arkadaşım bir kitap ve çay getiriyor.', nl: 'Mijn vriend brengt een boek en thee.', sv: 'Min vän tar med en bok och te.',
    },
  },
  {
    key: 'sun',
    worldTheme: 'Morning Sky World',
    english: 'Sun',
    words: {
      en: 'Sun', de: 'Sonne', ja: '太陽', es: 'Sol', zh: '太阳',
      fr: 'Soleil', ko: '태양', it: 'Sole', pt: 'Sol', ar: 'شمس',
      hi: 'सूरज', ru: 'Солнце', tr: 'Güneş', nl: 'Zon', sv: 'Sol',
    },
    phonetic: {
      en: 'sun', de: 'zon-neh', ja: 'tai-yo', es: 'sol', zh: 'tai-yang',
      fr: 'so-ley', ko: 'tae-yang', it: 'so-le', pt: 'sol', ar: 'shams',
      hi: 'soo-raj', ru: 'sont-se', tr: 'gyu-nesh', nl: 'zon', sv: 'sool',
    },
    englishSentence: 'The bright sun shines over the house',
    sentences: {
      en: 'The bright sun shines over the house.', de: 'Die helle Sonne scheint über dem Haus.', ja: '明るい太陽が家の上で輝いています。',
      es: 'El sol brillante brilla sobre la casa.', zh: '明亮的太阳照在房子上。', fr: 'Le soleil brille sur la maison.',
      ko: '밝은 태양이 집 위에서 빛나요.', it: 'Il sole splende sulla casa.', pt: 'O sol brilhante brilha sobre a casa.',
      ar: 'الشمس الساطعة تشرق فوق البيت.', hi: 'चमकता सूरज घर के ऊपर चमक रहा है।', ru: 'Яркое солнце светит над домом.',
      tr: 'Parlak güneş evin üzerinde parlıyor.', nl: 'De heldere zon schijnt boven het huis.', sv: 'Den klara solen skiner över huset.',
    },
  },
  {
    key: 'train',
    worldTheme: 'City Rail & Travel World',
    english: 'Train',
    words: {
      en: 'Train', de: 'Zug', ja: '電車', es: 'Tren', zh: '火车',
      fr: 'Train', ko: '기차', it: 'Treno', pt: 'Trem', ar: 'قطار',
      hi: 'ट्रेन', ru: 'Поезд', tr: 'Tren', nl: 'Trein', sv: 'Tåg',
    },
    phonetic: {
      en: 'trayn', de: 'tsoog', ja: 'den-sha', es: 'tren', zh: 'huo-che',
      fr: 'tran', ko: 'gi-cha', it: 'tre-no', pt: 'trem', ar: 'qi-taar',
      hi: 'treyn', ru: 'po-yezd', tr: 'tren', nl: 'trayn', sv: 'tog',
    },
    englishSentence: 'Our morning train arrives on time',
    sentences: {
      en: 'Our morning train arrives on time.', de: 'Unser Morgenzug kommt pünktlich an.', ja: '朝の電車は時間通りに到着します。',
      es: 'Nuestro tren de la mañana llega a tiempo.', zh: '我们的早班火车准时到达。', fr: 'Notre train du matin arrive à l’heure.',
      ko: '우리 아침 기차가 제시간에 도착해요.', it: 'Il nostro treno del mattino arriva in orario.', pt: 'Nosso trem da manhã chega na hora.',
      ar: 'يصل قطار الصباح في موعده.', hi: 'हमारी सुबह की ट्रेन समय पर आती है।', ru: 'Наш утренний поезд прибывает вовремя.',
      tr: 'Sabah trenimiz tam zamanında geliyor.', nl: 'Onze ochtendtrein komt op tijd aan.', sv: 'Vårt morgontåg kommer i tid.',
    },
  },
  {
    key: 'coffee',
    worldTheme: 'Neighborhood Café World',
    english: 'Coffee',
    words: {
      en: 'Coffee', de: 'Kaffee', ja: 'コーヒー', es: 'Café', zh: '咖啡',
      fr: 'Café', ko: '커피', it: 'Caffè', pt: 'Café', ar: 'قهوة',
      hi: 'कॉफ़ी', ru: 'Кофе', tr: 'Kahve', nl: 'Koffie', sv: 'Kaffe',
    },
    phonetic: {
      en: 'kaw-fee', de: 'ka-fee', ja: 'ko-hi', es: 'ka-fe', zh: 'ka-fei',
      fr: 'ka-fe', ko: 'keo-pi', it: 'kaf-fe', pt: 'ka-fe', ar: 'qah-wa',
      hi: 'kaw-fee', ru: 'ko-fe', tr: 'kah-ve', nl: 'kof-ee', sv: 'kaf-fe',
    },
    englishSentence: 'My friend orders hot coffee and water',
    sentences: {
      en: 'My friend orders hot coffee and water.', de: 'Mein Freund bestellt heißen Kaffee und Wasser.', ja: '友達が温かいコーヒーと水を注文します。',
      es: 'Mi amigo pide café caliente y agua.', zh: '我的朋友点了热咖啡和水。', fr: 'Mon ami commande un café chaud et de l’eau.',
      ko: '제 친구가 뜨거운 커피와 물을 주문해요.', it: 'Il mio amico ordina caffè caldo e acqua.', pt: 'Meu amigo pede café quente e água.',
      ar: 'صديقي يطلب قهوة ساخنة وماء.', hi: 'मेरा दोस्त गरम कॉफ़ी और पानी मंगवाता है।', ru: 'Мой друг заказывает горячий кофе и воду.',
      tr: 'Arkadaşım sıcak kahve ve su sipariş ediyor.', nl: 'Mijn vriend bestelt hete koffie en water.', sv: 'Min vän beställer varmt kaffe och vatten.',
    },
  },
  {
    key: 'market',
    worldTheme: 'Street Bazaar World',
    english: 'Market',
    words: {
      en: 'Market', de: 'Markt', ja: '市場', es: 'Mercado', zh: '市场',
      fr: 'Marché', ko: '시장', it: 'Mercato', pt: 'Mercado', ar: 'سوق',
      hi: 'बाज़ार', ru: 'Рынок', tr: 'Pazar', nl: 'Markt', sv: 'Marknad',
    },
    phonetic: {
      en: 'mar-kit', de: 'markt', ja: 'i-chi-ba', es: 'mer-ka-do', zh: 'shi-chang',
      fr: 'mar-she', ko: 'si-jang', it: 'mer-ka-to', pt: 'mer-ka-do', ar: 'sooq',
      hi: 'baa-zaar', ru: 'ry-nak', tr: 'pa-zar', nl: 'markt', sv: 'mark-nad',
    },
    englishSentence: 'We buy fresh apples at the market',
    sentences: {
      en: 'We buy fresh apples at the market.', de: 'Wir kaufen frische Äpfel auf dem Markt.', ja: '市場で新鮮なりんごを買います。',
      es: 'Compramos manzanas frescas en el mercado.', zh: '我们在市场买新鲜苹果。', fr: 'Nous achetons des pommes fraîches au marché.',
      ko: '우리는 시장에서 신선한 사과를 사요.', it: 'Compriamo mele fresche al mercato.', pt: 'Compramos maçãs frescas no mercado.',
      ar: 'نشتري تفاحاً طازجاً من السوق.', hi: 'हम बाज़ार से ताज़े सेब खरीदते हैं।', ru: 'Мы покупаем свежие яблоки на рынке.',
      tr: 'Pazardan taze elma alıyoruz.', nl: 'Wij kopen verse appels op de markt.', sv: 'Vi köper färska äpplen på marknaden.',
    },
  },
  {
    key: 'music',
    worldTheme: 'Concert & Melody World',
    english: 'Music',
    words: {
      en: 'Music', de: 'Musik', ja: '音楽', es: 'Música', zh: '音乐',
      fr: 'Musique', ko: '음악', it: 'Musica', pt: 'Música', ar: 'موسيقى',
      hi: 'संगीत', ru: 'Музыка', tr: 'Müzik', nl: 'Muziek', sv: 'Musik',
    },
    phonetic: {
      en: 'myoo-zik', de: 'mu-zeek', ja: 'on-ga-ku', es: 'mu-si-ka', zh: 'yin-yue',
      fr: 'myu-zeek', ko: 'eum-ak', it: 'mu-zi-ka', pt: 'mu-zi-ka', ar: 'moo-see-qa',
      hi: 'san-geet', ru: 'mu-zy-ka', tr: 'myu-zik', nl: 'mu-zeek', sv: 'mu-seek',
    },
    englishSentence: 'Calm music makes our house peaceful',
    sentences: {
      en: 'Calm music makes our house peaceful.', de: 'Ruhige Musik macht unser Haus friedlich.', ja: '穏やかな音楽が家を平和にします。',
      es: 'La música tranquila hace nuestra casa pacífica.', zh: '轻柔的音乐让我们的家很宁静。', fr: 'La musique douce rend notre maison paisible.',
      ko: '잔잔한 음악이 우리 집을 평화롭게 해요.', it: 'La musica calma rende la nostra casa pacifica.', pt: 'Música calma deixa nossa casa tranquila.',
      ar: 'الموسيقى الهادئة تجعل بيتنا هادئاً.', hi: 'शांत संगीत हमारे घर को सुकून देता है।', ru: 'Спокойная музыка делает наш дом уютным.',
      tr: 'Sakin müzik evimizi huzurlu yapar.', nl: 'Rustige muziek maakt ons huis vredig.', sv: 'Lugn musik gör vårt hus fridfullt.',
    },
  },
  {
    key: 'weather',
    worldTheme: 'Seasons & Breeze World',
    english: 'Weather',
    words: {
      en: 'Weather', de: 'Wetter', ja: '天気', es: 'Clima', zh: '天气',
      fr: 'Météo', ko: '날씨', it: 'Tempo', pt: 'Clima', ar: 'طقس',
      hi: 'मौसम', ru: 'Погода', tr: 'Hava', nl: 'Weer', sv: 'Väder',
    },
    phonetic: {
      en: 'we-ther', de: 'vet-ter', ja: 'ten-ki', es: 'klee-ma', zh: 'tian-qi',
      fr: 'me-te-o', ko: 'nal-ssi', it: 'tem-po', pt: 'klee-ma', ar: 'taqs',
      hi: 'mau-sam', ru: 'pa-go-da', tr: 'ha-va', nl: 'veer', sv: 've-der',
    },
    englishSentence: 'The weather is sunny and pleasant today',
    sentences: {
      en: 'The weather is sunny and pleasant today.', de: 'Das Wetter ist heute sonnig und angenehm.', ja: '今日の天気は晴れて心地よいです。',
      es: 'El clima está soleado y agradable hoy.', zh: '今天天气晴朗舒适。', fr: 'La météo est ensoleillée et agréable aujourd’hui.',
      ko: '오늘 날씨가 맑고 상쾌해요.', it: 'Oggi il tempo è soleggiato e piacevole.', pt: 'O clima está ensolarado e agradável hoje.',
      ar: 'الطقس مشمس ولطيف اليوم.', hi: 'आज मौसम धूप वाला और सुहावना है।', ru: 'Сегодня солнечная и приятная погода.',
      tr: 'Bugün hava güneşli ve güzel.', nl: 'Het weer is vandaag zonnig en prettig.', sv: 'Vädret är soligt och behagligt idag.',
    },
  },
  {
    key: 'language',
    worldTheme: 'Global Voices World',
    english: 'Language',
    words: {
      en: 'Language', de: 'Sprache', ja: '言語', es: 'Idioma', zh: '语言',
      fr: 'Langue', ko: '언어', it: 'Lingua', pt: 'Idioma', ar: 'لغة',
      hi: 'भाषा', ru: 'Язык', tr: 'Dil', nl: 'Taal', sv: 'Språk',
    },
    phonetic: {
      en: 'lang-wij', de: 'shpra-khe', ja: 'gen-go', es: 'ee-dyo-ma', zh: 'yu-yan',
      fr: 'lang', ko: 'eo-neo', it: 'lin-gwa', pt: 'ee-dyo-ma', ar: 'lu-gha',
      hi: 'bhaa-shaa', ru: 'ya-zyk', tr: 'dil', nl: 'taal', sv: 'sprok',
    },
    englishSentence: 'Speaking a new language opens the world',
    sentences: {
      en: 'Speaking a new language opens the world.', de: 'Eine neue Sprache zu sprechen öffnet die Welt.', ja: '新しい言語を話すと世界が広がります。',
      es: 'Hablar un nuevo idioma abre el mundo.', zh: '说一门新语言会打开世界。', fr: 'Parler une nouvelle langue ouvre le monde.',
      ko: '새 언어를 말하면 세상이 열려요.', it: 'Parlare una nuova lingua apre il mondo.', pt: 'Falar um novo idioma abre o mundo.',
      ar: 'التحدث بلغة جديدة يفتح لك العالم.', hi: 'नई भाषा बोलना पूरी दुनिया के दरवाज़े खोलता है।', ru: 'Новый язык открывает целый мир.',
      tr: 'Yeni bir dil konuşmak dünyayı açar.', nl: 'Een nieuwe taal spreken opent de wereld.', sv: 'Att tala ett nytt språk öppnar världen.',
    },
  },
];
