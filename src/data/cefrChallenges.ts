import { LANGUAGES } from './languages';
import type { CEFRChallenge, CEFRDifficulty, CEFRLevel, LanguageCourse } from '../types/piryas';

interface ConceptItem {
  id: string;
  level: CEFRLevel;
  category: string;
  english: string;
  note: string;
  translations: Record<string, string>;
}

// 36 core multilingual concepts across A1-C2 mapped across all 15 PIRYAS languages
export const MULTILINGUAL_CONCEPTS: ConceptItem[] = [
  // A1 Foundation
  {
    id: 'a1-greet-morning',
    level: 'A1',
    category: 'Greetings & Essentials',
    english: 'Good morning, how are you?',
    note: 'Polite everyday morning greeting used across both casual and formal settings.',
    translations: {
      en: 'Good morning, how are you?',
      de: 'Guten Morgen, wie geht es Ihnen?',
      ja: 'おはようございます、お元気ですか？',
      es: 'Buenos días, ¿cómo está usted?',
      zh: '早上好，你好吗？',
      fr: 'Bonjour, comment allez-vous ?',
      ko: '좋은 아침이에요, 잘 지내세요?',
      it: 'Buongiorno, come sta?',
      pt: 'Bom dia, como vai você?',
      ar: 'صباح الخير، كيف حالك؟',
      hi: 'सुप्रभात, आप कैसे हैं?',
      ru: 'Доброе утро, как ваши дела?',
      tr: 'Günaydın, nasılsınız?',
      nl: 'Goedemorgen, hoe gaat het met u?',
      sv: 'God morgon, hur mår du?',
    },
  },
  {
    id: 'a1-thank-you',
    level: 'A1',
    category: 'Greetings & Essentials',
    english: 'Thank you very much for your help.',
    note: 'Essential expression of gratitude in daily interactions.',
    translations: {
      en: 'Thank you very much for your help.',
      de: 'Vielen Dank für Ihre Hilfe.',
      ja: '助けていただきありがとうございます。',
      es: 'Muchas gracias por su ayuda.',
      zh: '非常感谢你的帮助。',
      fr: 'Merci beaucoup pour votre aide.',
      ko: '도와주셔서 정말 감사합니다.',
      it: 'Grazie mille per il suo aiuto.',
      pt: 'Muito obrigado pela sua ajuda.',
      ar: 'شكراً جزيلاً على مساعدتك.',
      hi: 'आपकी मदद के लिए बहुत धन्यवाद।',
      ru: 'Большое спасибо за вашу помощь.',
      tr: 'Yardımınız için çok teşekkür ederim.',
      nl: 'Hartelijk dank voor uw hulp.',
      sv: 'Tack så mycket för din hjälp.',
    },
  },
  {
    id: 'a1-water-please',
    level: 'A1',
    category: 'Dining & Ordering',
    english: 'I would like a glass of water, please.',
    note: 'Polite conditional phrasing makes restaurant requests sound natural.',
    translations: {
      en: 'I would like a glass of water, please.',
      de: 'Ich möchte bitte ein Glas Wasser.',
      ja: 'お水をグラスで一杯お願いします。',
      es: 'Quisiera un vaso de agua, por favor.',
      zh: '请给我一杯水。',
      fr: "Je voudrais un verre d'eau, s'il vous plaît.",
      ko: '물 한 잔 주시겠어요?',
      it: 'Vorrei un bicchiere d’acqua, per favore.',
      pt: 'Eu gostaria de um copo de água, por favor.',
      ar: 'أريد كوباً من الماء من فضلك.',
      hi: 'कृपया मुझे एक गिलास पानी चाहिए।',
      ru: 'Я хотел бы стакан воды, пожалуйста.',
      tr: 'Bir bardak su rica edebilir miyim?',
      nl: 'Ik wil graag een glas water, alstublieft.',
      sv: 'Jag skulle vilja ha ett glas vatten, tack.',
    },
  },
  {
    id: 'a1-where-station',
    level: 'A1',
    category: 'Travel & Directions',
    english: 'Where is the nearest train station?',
    note: 'Key navigation question when arriving in a new city.',
    translations: {
      en: 'Where is the nearest train station?',
      de: 'Wo ist der nächste Bahnhof?',
      ja: '一番近い駅はどこですか？',
      es: '¿Dónde está la estación de tren más cercana?',
      zh: '最近的火车站在哪里？',
      fr: 'Où est la gare la plus proche ?',
      ko: '가장 가까운 기차역이 어디인가요?',
      it: 'Dov’è la stazione dei treni più vicina?',
      pt: 'Onde fica a estação de trem mais próxima?',
      ar: 'أين أقرب محطة قطار؟',
      hi: 'सबसे नज़दीकी रेलवे स्टेशन कहाँ है?',
      ru: 'Где ближайший железнодорожный вокзал?',
      tr: 'En yakın tren istasyonu nerede?',
      nl: 'Waar is het dichtstbijzijnde treinstation?',
      sv: 'Var ligger närmaste tågstation?',
    },
  },
  {
    id: 'a1-my-name',
    level: 'A1',
    category: 'Greetings & Essentials',
    english: 'My name is Aarav and I am learning this language.',
    note: 'Combines self-introduction with present continuous study context.',
    translations: {
      en: 'My name is Aarav and I am learning this language.',
      de: 'Ich heiße Aarav und lerne diese Sprache.',
      ja: '私の名前はアーラヴで、この言語を学んでいます。',
      es: 'Me llamo Aarav y estoy aprendiendo este idioma.',
      zh: '我叫阿劳夫，我正在学习这门语言。',
      fr: "Je m'appelle Aarav et j'apprends cette langue.",
      ko: '제 이름은 아라브이고 이 언어를 배우고 있어요.',
      it: 'Mi chiamo Aarav e sto imparando questa lingua.',
      pt: 'Meu nome é Aarav e estou aprendendo este idioma.',
      ar: 'اسمي آراف وأنا أتعلم هذه اللغة.',
      hi: 'मेरा नाम आरव है और मैं यह भाषा सीख रहा हूँ।',
      ru: 'Меня зовут Арав, и я учу этот язык.',
      tr: 'Benim adım Aarav ve bu dili öğreniyorum.',
      nl: 'Ik heet Aarav en ik leer deze taal.',
      sv: 'Jag heter Aarav och jag lär mig det här språket.',
    },
  },
  {
    id: 'a1-how-much',
    level: 'A1',
    category: 'Shopping & Numbers',
    english: 'How much does this ticket cost?',
    note: 'Direct shopping inquiry used at counters and kiosks.',
    translations: {
      en: 'How much does this ticket cost?',
      de: 'Wie viel kostet diese Fahrkarte?',
      ja: 'この切符はいくらですか？',
      es: '¿Cuánto cuesta este boleto?',
      zh: '这张票多少钱？',
      fr: 'Combien coûte ce billet ?',
      ko: '이 표는 얼마예요?',
      it: 'Quanto costa questo biglietto?',
      pt: 'Quanto custa este bilhete?',
      ar: 'كم سعر هذه التذكرة؟',
      hi: 'इस टिकट की कीमत कितनी है?',
      ru: 'Сколько стоит этот билет?',
      tr: 'Bu bilet ne kadar?',
      nl: 'Hoeveel kost dit kaartje?',
      sv: 'Hur mycket kostar den här biljetten?',
    },
  },

  // A2 Elementary
  {
    id: 'a2-understand-slow',
    level: 'A2',
    category: 'Everyday Conversation',
    english: 'Could you speak a little more slowly, please?',
    note: 'Polite request to help catch pronunciation clearly in real conversations.',
    translations: {
      en: 'Could you speak a little more slowly, please?',
      de: 'Könnten Sie bitte etwas langsamer sprechen?',
      ja: 'もう少しゆっくり話していただけますか？',
      es: '¿Podría hablar un poco más despacio, por favor?',
      zh: '请你说慢一点好吗？',
      fr: "Pourriez-vous parler un peu plus lentement, s'il vous plaît ?",
      ko: '조금만 더 천천히 말씀해 주시겠어요?',
      it: 'Potrebbe parlare un po’ più lentamente, per favore?',
      pt: 'Você poderia falar um pouco mais devagar, por favor?',
      ar: 'هل يمكنك التحدث ببطء أكثر من فضلك؟',
      hi: 'कृपया क्या आप थोड़ा धीरे बोल सकते हैं?',
      ru: 'Не могли бы вы говорить немного медленнее, пожалуйста?',
      tr: 'Biraz daha yavaş konuşabilir misiniz lütfen?',
      nl: 'Kunt u alstublieft iets langzamer spreken?',
      sv: 'Skulle du kunna prata lite långsammare, tack?',
    },
  },
  {
    id: 'a2-schedule-meet',
    level: 'A2',
    category: 'Time & Plans',
    english: 'Let us meet tomorrow afternoon at three.',
    note: 'Expressing future plans with specific clock times.',
    translations: {
      en: 'Let us meet tomorrow afternoon at three.',
      de: 'Treffen wir uns morgen Nachmittag um drei Uhr.',
      ja: '明日の午後3時に会いましょう。',
      es: 'Quedemos mañana por la tarde a las tres.',
      zh: '我们明天下午三点见面吧。',
      fr: 'Retrouvons-nous demain après-midi à quinze heures.',
      ko: '내일 오후 세 시에 만나요.',
      it: 'Incontriamoci domani pomeriggio alle tre.',
      pt: 'Vamos nos encontrar amanhã à tarde às três.',
      ar: 'دعنا نلتقي غداً بعد الظهر الساعة الثالثة.',
      hi: 'आइए कल दोपहर तीन बजे मिलते हैं।',
      ru: 'Давай встретимся завтра днём в три часа.',
      tr: 'Yarın öğleden sonra saat üçte buluşalım.',
      nl: 'Laten we morgenmiddag om drie uur afspreken.',
      sv: 'Låt oss ses i morgon eftermiddag klockan tre.',
    },
  },
  {
    id: 'a2-recommend-food',
    level: 'A2',
    category: 'Dining & Ordering',
    english: 'What local dish do you recommend here?',
    note: 'Great conversation starter with hosts and restaurant staff.',
    translations: {
      en: 'What local dish do you recommend here?',
      de: 'Welches lokale Gericht empfehlen Sie hier?',
      ja: 'ここでおすすめの郷土料理は何ですか？',
      es: '¿Qué plato local recomienda aquí?',
      zh: '你推荐这里的什么当地菜？',
      fr: 'Quel plat local recommandez-vous ici ?',
      ko: '여기서 어떤 현지 음식을 추천하시나요?',
      it: 'Quale piatto locale consiglia qui?',
      pt: 'Qual prato local você recomenda aqui?',
      ar: 'ما الطبق المحلي الذي تنصح به هنا؟',
      hi: 'आप यहाँ कौन सा स्थानीय व्यंजन सुझाते हैं?',
      ru: 'Какое местное блюдо вы здесь порекомендуете?',
      tr: 'Burada hangi yöresel yemeği tavsiye edersiniz?',
      nl: 'Welk lokaal gerecht raadt u hier aan?',
      sv: 'Vilken lokal rätt rekommenderar du här?',
    },
  },
  {
    id: 'a2-weather-walk',
    level: 'A2',
    category: 'Daily Routines',
    english: 'Because the weather is sunny, we walked to the park.',
    note: 'Uses a causal connector ("because") with past-tense motion.',
    translations: {
      en: 'Because the weather is sunny, we walked to the park.',
      de: 'Weil das Wetter sonnig ist, sind wir zum Park gelaufen.',
      ja: '天気が晴れているので、公園まで歩きました。',
      es: 'Como hace sol, caminamos hasta el parque.',
      zh: '因为天气晴朗，我们步行去了公园。',
      fr: 'Comme il fait beau, nous avons marché jusqu’au parc.',
      ko: '날씨가 맑아서 공원까지 걸어갔어요.',
      it: 'Siccome c’è il sole, siamo andati a piedi al parco.',
      pt: 'Como o tempo está ensolarado, fomos andando até o parque.',
      ar: 'لأن الطقس مشمس، مشينا إلى الحديقة.',
      hi: 'चूँकि मौसम धूप वाला है, हम पैदल पार्क गए।',
      ru: 'Поскольку погода солнечная, мы пошли пешком в парк.',
      tr: 'Hava güneşli olduğu için parka yürüdük.',
      nl: 'Omdat het zonnig weer is, liepen we naar het park.',
      sv: 'Eftersom vädret är soligt gick vi till parken.',
    },
  },
  {
    id: 'a2-forgot-key',
    level: 'A2',
    category: 'Everyday Problems',
    english: 'I forgot my room key at the front desk.',
    note: 'Past-tense action paired with location preposition.',
    translations: {
      en: 'I forgot my room key at the front desk.',
      de: 'Ich habe meinen Zimmerschlüssel an der Rezeption vergessen.',
      ja: 'フロントに部屋の鍵を忘れてしまいました。',
      es: 'Olvidé la llave de mi habitación en la recepción.',
      zh: '我把房间钥匙忘在前台了。',
      fr: "J'ai oublié la clé de ma chambre à la réception.",
      ko: '프런트에 방 열쇠를 두고 왔어요.',
      it: 'Ho dimenticato la chiave della camera alla reception.',
      pt: 'Esqueci a chave do meu quarto na recepção.',
      ar: 'نسيت مفتاح غرفتي في مكتب الاستقبال.',
      hi: 'मैं अपने कमरे की चाबी रिसेप्शन पर भूल गया हूँ।',
      ru: 'Я забыл ключ от номера на стойке регистрации.',
      tr: 'Oda anahtarımı resepsiyonda unuttum.',
      nl: 'Ik ben mijn kamersleutel bij de receptie vergeten.',
      sv: 'Jag glömde min rumsnyckel i receptionen.',
    },
  },
  {
    id: 'a2-practice-daily',
    level: 'A2',
    category: 'Study Habits',
    english: 'I practice vocabulary for twenty minutes every evening.',
    note: 'Expressing recurring habits and duration cleanly.',
    translations: {
      en: 'I practice vocabulary for twenty minutes every evening.',
      de: 'Ich übe jeden Abend zwanzig Minuten lang Vokabeln.',
      ja: '毎晩20分間、語彙を練習しています。',
      es: 'Practico vocabulario durante veinte minutos cada tarde.',
      zh: '我每天晚上练习二十分钟词汇。',
      fr: 'Je pratique le vocabulaire pendant vingt minutes chaque soir.',
      ko: '매일 저녁 20분 동안 어휘를 연습해요.',
      it: 'Faccio pratica con il vocabolario per venti minuti ogni sera.',
      pt: 'Eu pratico vocabulário por vinte minutos todas as noites.',
      ar: 'أتدرب على المفردات لمدة عشرين دقيقة كل مساء.',
      hi: 'मैं हर शाम बीस मिनट तक शब्दावली का अभ्यास करता हूँ।',
      ru: 'Я учу слова по двадцать минут каждый вечер.',
      tr: 'Her akşam yirmi dakika kelime pratiği yapıyorum.',
      nl: 'Ik oefen elke avond twintig minuten woordenschat.',
      sv: 'Jag övar ordförråd i tjugo minuter varje kväll.',
    },
  },

  // B1 Intermediate
  {
    id: 'b1-meaning-difference',
    level: 'B1',
    category: 'Meaning & Nuance',
    english: 'What is the difference between these two words?',
    note: 'Crucial meta-language phrase for asking native speakers or coaches about nuance.',
    translations: {
      en: 'What is the difference between these two words?',
      de: 'Was ist der Unterschied zwischen diesen beiden Wörtern?',
      ja: 'この二つの言葉の違いは何ですか？',
      es: '¿Cuál es la diferencia entre estas dos palabras?',
      zh: '这两个词之间有什么区别？',
      fr: 'Quelle est la différence entre ces deux mots ?',
      ko: '이 두 단어의 차이점이 무엇인가요?',
      it: 'Qual è la differenza tra queste due parole?',
      pt: 'Qual é a diferença entre estas duas palavras?',
      ar: 'ما الفرق بين هاتين الكلمتين؟',
      hi: 'इन दोनों शब्दों के बीच क्या अंतर है?',
      ru: 'В чём разница между этими двумя словами?',
      tr: 'Bu iki kelime arasındaki fark nedir?',
      nl: 'Wat is het verschil tussen deze twee woorden?',
      sv: 'Vad är skillnaden mellan de här två orden?',
    },
  },
  {
    id: 'b1-project-deadline',
    level: 'B1',
    category: 'Work & Collaboration',
    english: 'We need to finalize the presentation before Friday morning.',
    note: 'Professional obligation expression combining modal verb + time boundary.',
    translations: {
      en: 'We need to finalize the presentation before Friday morning.',
      de: 'Wir müssen die Präsentation vor Freitagmorgen abschließen.',
      ja: '金曜日の朝までにプレゼンを仕上げる必要があります。',
      es: 'Tenemos que finalizar la presentación antes del viernes por la mañana.',
      zh: '我们需要在周五上午之前完成演示文稿。',
      fr: 'Nous devons finaliser la présentation avant vendredi matin.',
      ko: '금요일 오전 전까지 발표 자료를 마무리해야 해요.',
      it: 'Dobbiamo completare la presentazione prima di venerdì mattina.',
      pt: 'Precisamos finalizar a apresentação antes de sexta-feira de manhã.',
      ar: 'نحتاج إلى إنهاء العرض التقديمي قبل صباح الجمعة.',
      hi: 'हमें शुक्रवार सुबह से पहले प्रेजेंटेशन को अंतिम रूप देना होगा।',
      ru: 'Нам нужно закончить презентацию до утра пятницы.',
      tr: 'Sunumu cuma sabahından önce tamamlamamız gerekiyor.',
      nl: 'We moeten de presentatie voor vrijdagochtend afronden.',
      sv: 'Vi måste slutföra presentationen före fredag morgon.',
    },
  },
  {
    id: 'b1-polite-reschedule',
    level: 'B1',
    category: 'Work & Collaboration',
    english: 'Would it be possible to reschedule our call to next week?',
    note: 'Diplomatic phrasing softens schedule changes in workplace dialogue.',
    translations: {
      en: 'Would it be possible to reschedule our call to next week?',
      de: 'Wäre es möglich, unser Gespräch auf nächste Woche zu verschieben?',
      ja: 'お電話を来週に変更していただくことは可能でしょうか？',
      es: '¿Sería posible reprogramar nuestra llamada para la próxima semana?',
      zh: '可以把我们的通话改期到下周吗？',
      fr: 'Serait-il possible de reporter notre appel à la semaine prochaine ?',
      ko: '통화를 다음 주로 일정을 변경할 수 있을까요?',
      it: 'Sarebbe possibile riprogrammare la nostra chiamata alla prossima settimana?',
      pt: 'Seria possível remarcar nossa ligação para a próxima semana?',
      ar: 'هل يمكن إعادة جدولة مكالمتنا إلى الأسبوع المقبل؟',
      hi: 'क्या हमारी कॉल को अगले सप्ताह के लिए पुनर्निर्धारित करना संभव होगा?',
      ru: 'Можно ли перенести наш звонок на следующую неделю?',
      tr: 'Görüşmemizi gelecek haftaya ertelememiz mümkün mü?',
      nl: 'Zou het mogelijk zijn om ons gesprek naar volgende week te verplaatsen?',
      sv: 'Skulle det vara möjligt att boka om vårt samtal till nästa vecka?',
    },
  },
  {
    id: 'b1-travel-delay',
    level: 'B1',
    category: 'Travel & Problem Solving',
    english: 'Although the flight was delayed, we reached the hotel safely.',
    note: 'Concessive clause ("although") balances unexpected obstacles with outcomes.',
    translations: {
      en: 'Although the flight was delayed, we reached the hotel safely.',
      de: 'Obwohl der Flug Verspätung hatte, erreichten wir das Hotel sicher.',
      ja: 'フライトは遅れましたが、無事にホテルに到着しました。',
      es: 'Aunque el vuelo se retrasó, llegamos al hotel a salvo.',
      zh: '虽然航班延误了，但我们安全到达了酒店。',
      fr: "Bien que le vol ait eu du retard, nous sommes arrivés à l'hôtel en sécurité.",
      ko: '비행기가 연착되었지만 안전하게 호텔에 도착했어요.',
      it: 'Sebbene il volo fosse in ritardo, siamo arrivati in hotel sani e salvi.',
      pt: 'Embora o voo tenha atrasado, chegamos ao hotel em segurança.',
      ar: 'رغم تأخر الرحلة، وصلنا إلى الفندق بأمان.',
      hi: 'हालाँकि उड़ान में देरी हुई, हम सुरक्षित रूप से होटल पहुँच गए।',
      ru: 'Хотя рейс задержали, мы благополучно добрались до отеля.',
      tr: 'Uçuş gecikmesine rağmen otele güvenle ulaştık.',
      nl: 'Hoewel de vlucht vertraagd was, bereikten we het hotel veilig.',
      sv: 'Även om flyget var försenat kom vi fram till hotellet säkert.',
    },
  },
  {
    id: 'b1-health-advice',
    level: 'B1',
    category: 'Health & Advice',
    english: 'If you feel tired, you should take a short break outside.',
    note: 'First-conditional advice structure linking condition and recommendation.',
    translations: {
      en: 'If you feel tired, you should take a short break outside.',
      de: 'Wenn Sie sich müde fühlen, sollten Sie draußen eine kurze Pause machen.',
      ja: '疲れているなら、外で少し休憩したほうがいいですよ。',
      es: 'Si te sientes cansado, deberías tomar un breve descanso afuera.',
      zh: '如果你觉得累，你应该去外面休息一会儿。',
      fr: 'Si vous vous sentez fatigué, vous devriez faire une courte pause dehors.',
      ko: '피곤하시면 밖에 나가서 잠깐 쉬시는 게 좋겠어요.',
      it: 'Se ti senti stanco, dovresti fare una breve pausa fuori.',
      pt: 'Se você se sentir cansado, deveria fazer uma pequena pausa lá fora.',
      ar: 'إذا شعرت بالتعب، يجب أن تأخذ استراحة قصيرة في الخارج.',
      hi: 'यदि आप थका हुआ महसूस करते हैं, तो आपको बाहर थोड़ा आराम करना चाहिए।',
      ru: 'Если вы чувствуете усталость, вам стоит сделать короткий перерыв на улице.',
      tr: 'Yorgun hissediyorsanız dışarıda kısa bir mola vermelisiniz.',
      nl: 'Als je je moe voelt, zou je buiten even pauze moeten nemen.',
      sv: 'Om du känner dig trött borde du ta en kort paus utomhus.',
    },
  },

  // B2 Upper Intermediate
  {
    id: 'b2-context-expression',
    level: 'B2',
    category: 'Fluency & Pragmatics',
    english: 'In this context, that expression sounds slightly too formal.',
    note: 'Register awareness differentiates B2 fluency from literal textbook translation.',
    translations: {
      en: 'In this context, that expression sounds slightly too formal.',
      de: 'In diesem Zusammenhang klingt dieser Ausdruck etwas zu formell.',
      ja: 'この文脈では、その表現は少し硬すぎるように聞こえます。',
      es: 'En este contexto, esa expresión suena un poco demasiado formal.',
      zh: '在这个语境中，这个表达听起来稍微太正式了。',
      fr: 'Dans ce contexte, cette expression paraît légèrement trop formelle.',
      ko: '이 문맥에서는 그 표현이 조금 지나치게 격식 있게 들려요.',
      it: 'In questo contesto, quell’espressione suona leggermente troppo formale.',
      pt: 'Nesse contexto, essa expressão soa um pouco formal demais.',
      ar: 'في هذا السياق، تبدو هذه العبارة رسمية أكثر من اللازم قليلاً.',
      hi: 'इस संदर्भ में यह अभिव्यक्ति थोड़ी अधिक औपचारिक लगती है।',
      ru: 'В этом контексте данное выражение звучит несколько слишком официально.',
      tr: 'Bu bağlamda o ifade biraz fazla resmî duruyor.',
      nl: 'In deze context klinkt die uitdrukking iets te formeel.',
      sv: 'I det här sammanhanget låter det uttrycket något för formellt.',
    },
  },
  {
    id: 'b2-cultural-perspective',
    level: 'B2',
    category: 'Culture & Debate',
    english: 'Speaking two languages lets us see problems from fresh perspectives.',
    note: 'Abstract reasoning sentence connecting bilingualism to cognitive flexibility.',
    translations: {
      en: 'Speaking two languages lets us see problems from fresh perspectives.',
      de: 'Zwei Sprachen zu sprechen ermöglicht es uns, Probleme aus neuen Perspektiven zu sehen.',
      ja: '二言語を話すことで、問題を新しい視点から見ることができます。',
      es: 'Hablar dos idiomas nos permite ver los problemas desde nuevas perspectivas.',
      zh: '会说两种语言能让我们从新的视角看待问题。',
      fr: 'Parler deux langues nous permet d’envisager les problèmes sous un angle nouveau.',
      ko: '두 가지 언어를 구사하면 문제를 새로운 시각으로 바라볼 수 있습니다.',
      it: 'Parlare due lingue ci permette di vedere i problemi da nuove prospettive.',
      pt: 'Falar dois idiomas nos permite enxergar os problemas sob novas perspectivas.',
      ar: 'التحدث بلغتين يتيح لنا رؤية المشكلات من وجهات نظر جديدة.',
      hi: 'दो भाषाएँ बोलने से हमें समस्याओं को नए दृष्टिकोण से देखने का अवसर मिलता है।',
      ru: 'Владение двумя языками позволяет взглянуть на задачи под новым углом.',
      tr: 'İki dil konuşmak sorunlara yeni bakış açılarından bakmamızı sağlar.',
      nl: 'Twee talen spreken laat ons problemen vanuit een nieuw perspectief bekijken.',
      sv: 'Att tala två språk gör att vi kan se problem ur nya perspektiv.',
    },
  },
  {
    id: 'b2-clarify-proposal',
    level: 'B2',
    category: 'Negotiation & Clarity',
    english: 'Before we agree, could you clarify the long-term impact of this decision?',
    note: 'Structured negotiation phrase requesting downstream consequences.',
    translations: {
      en: 'Before we agree, could you clarify the long-term impact of this decision?',
      de: 'Bevor wir zustimmen, könnten Sie die langfristigen Auswirkungen dieser Entscheidung erläutern?',
      ja: '合意する前に、この決定の長期的な影響を明確にしていただけますか？',
      es: 'Antes de estar de acuerdo, ¿podría aclarar el impacto a largo plazo de esta decisión?',
      zh: '在我们达成一致之前，您能说明这项决定的长期影响吗？',
      fr: 'Avant que nous donnions notre accord, pourriez-vous préciser l’impact à long terme de cette décision ?',
      ko: '합의하기 전에 이 결정이 장기적으로 미칠 영향을 명확히 설명해 주시겠어요?',
      it: 'Prima di accettare, potrebbe chiarire l’impatto a lungo termine di questa decisione?',
      pt: 'Antes de concordarmos, você poderia esclarecer o impacto a longo prazo desta decisão?',
      ar: 'قبل أن نوافق، هل يمكنك توضيح الأثر طويل المدى لهذا القرار؟',
      hi: 'सहमत होने से पहले, क्या आप इस निर्णय के दीर्घकालिक प्रभाव को स्पष्ट कर सकते हैं?',
      ru: 'Прежде чем мы согласимся, не могли бы вы уточнить долгосрочные последствия этого решения?',
      tr: 'Kabul etmeden önce bu kararın uzun vadeli etkisini netleştirebilir misiniz?',
      nl: 'Voordat we akkoord gaan, kunt u de langetermijnimpact van dit besluit toelichten?',
      sv: 'Innan vi kommer överens, skulle du kunna förtydliga den långsiktiga effekten av detta beslut?',
    },
  },
  {
    id: 'b2-hypothetical-regret',
    level: 'B2',
    category: 'Complex Conditionals',
    english: 'Had we left ten minutes earlier, we would have caught the express train.',
    note: 'Past counterfactual conditional expressing missed opportunity.',
    translations: {
      en: 'Had we left ten minutes earlier, we would have caught the express train.',
      de: 'Wären wir zehn Minuten früher aufgebrochen, hätten wir den Schnellzug erreicht.',
      ja: 'あと10分早く出ていれば、急行電車に間に合っていたはずです。',
      es: 'Si hubiéramos salido diez minutos antes, habríamos tomado el tren expreso.',
      zh: '如果我们早十分钟出发，就能赶上快车了。',
      fr: 'Si nous étions partis dix minutes plus tôt, nous aurions attrapé le train express.',
      ko: '우리가 10분만 일찍 출발했더라면 급행열차를 탔을 거예요.',
      it: 'Se fossimo partiti dieci minuti prima, avremmo preso il treno espresso.',
      pt: 'Se tivéssemos saído dez minutos antes, teríamos pegado o trem expresso.',
      ar: 'لو غادرنا قبل عشر دقائق، للحقنا بالقطار السريع.',
      hi: 'यदि हम दस मिनट पहले निकले होते, तो हम एक्सप्रेस ट्रेन पकड़ लेते।',
      ru: 'Если бы мы вышли на десять минут раньше, мы бы успели на экспресс.',
      tr: 'On dakika daha erken çıksaydık ekspres trene yetişmiş olurduk.',
      nl: 'Als we tien minuten eerder waren vertrokken, hadden we de sneltrein gehaald.',
      sv: 'Hade vi åkt tio minuter tidigare hade vi hunnit med expresståget.',
    },
  },
  {
    id: 'b2-media-bias',
    level: 'B2',
    category: 'Critical Analysis',
    english: 'It is important to distinguish verified evidence from personal opinion.',
    note: 'Academic and journalistic register emphasizing objectivity.',
    translations: {
      en: 'It is important to distinguish verified evidence from personal opinion.',
      de: 'Es ist wichtig, belegte Fakten von persönlicher Meinung zu unterscheiden.',
      ja: '検証された根拠と個人的な意見を区別することが重要です。',
      es: 'Es importante distinguir la evidencia verificada de la opinión personal.',
      zh: '区分经过核实的证据与个人观点非常重要。',
      fr: 'Il est important de distinguer les preuves vérifiées de l’opinion personnelle.',
      ko: '검증된 근거와 개인적인 의견을 구별하는 것이 중요합니다.',
      it: 'È importante distinguere le prove verificate dall’opinione personale.',
      pt: 'É importante distinguir evidências verificadas de opiniões pessoais.',
      ar: 'من المهم التمييز بين الأدلة الموثقة والرأي الشخصي.',
      hi: 'सत्यापित प्रमाण और व्यक्तिगत राय के बीच अंतर करना महत्वपूर्ण है।',
      ru: 'Важно отличать проверенные факты от личного мнения.',
      tr: 'Doğrulanmış kanıtı kişisel görüşten ayırt etmek önemlidir.',
      nl: 'Het is belangrijk om geverifieerd bewijs te onderscheiden van persoonlijke mening.',
      sv: 'Det är viktigt att skilja verifierade bevis från personliga åsikter.',
    },
  },

  // C1 Advanced (Hard)
  {
    id: 'c1-nuance-diplomacy',
    level: 'C1',
    category: 'Diplomatic Nuance',
    english: 'While the proposal shows promise, its implementation hinges on cross-team alignment.',
    note: 'C1 Hard: Balances hedged praise with precise dependency ("hinges on").',
    translations: {
      en: 'While the proposal shows promise, its implementation hinges on cross-team alignment.',
      de: 'Obwohl der Vorschlag vielversprechend ist, hängt seine Umsetzung von der Abstimmung zwischen den Teams ab.',
      ja: 'その提案は有望ですが、実行できるかはチーム間の連携にかかっています。',
      es: 'Aunque la propuesta resulta prometedora, su ejecución depende de la alineación entre equipos.',
      zh: '尽管该方案颇具前景，但其落地实施取决于跨团队的协同一致。',
      fr: 'Bien que la proposition soit prometteuse, sa mise en œuvre repose sur la coordination interéquipes.',
      ko: '그 제안이 유망해 보이지만, 실행 여부는 팀 간 조율에 달려 있습니다.',
      it: 'Sebbene la proposta appaia promettente, la sua attuazione dipende dall’allineamento tra i team.',
      pt: 'Embora a proposta seja promissora, sua implementação depende do alinhamento entre as equipes.',
      ar: 'رغم أن المقترح يبدو واعداً، إلا أن تنفيذه يتوقف على التوافق بين الفرق.',
      hi: 'यद्यपि यह प्रस्ताव आशाजनक प्रतीत होता है, इसका कार्यान्वयन टीमों के आपसी तालमेल पर निर्भर करता है।',
      ru: 'Хотя предложение выглядит многообещающим, его реализация зависит от согласованности команд.',
      tr: 'Öneri umut verici görünse de uygulanması ekipler arası uyuma bağlıdır.',
      nl: 'Hoewel het voorstel veelbelovend is, hangt de uitvoering af van afstemming tussen teams.',
      sv: 'Även om förslaget verkar lovande hänger genomförandet på samordning mellan teamen.',
    },
  },
  {
    id: 'c1-idiom-read-between',
    level: 'C1',
    category: 'Idioms & Subtlety',
    english: 'Reading between the lines reveals subtle hesitation behind his enthusiasm.',
    note: 'C1 Hard: Figurative idiom for inferring unspoken meaning.',
    translations: {
      en: 'Reading between the lines reveals subtle hesitation behind his enthusiasm.',
      de: 'Zwischen den Zeilen zu lesen offenbart ein subtiles Zögern hinter seiner Begeisterung.',
      ja: '行間を読むと、彼の熱意の裏にある微妙なためらいが見えてきます。',
      es: 'Leer entre líneas revela una sutil vacilación detrás de su entusiasmo.',
      zh: '字里行间流露出他热情背后微妙的犹豫。',
      fr: 'Lire entre les lignes révèle une hésitation subtile derrière son enthousiasme.',
      ko: '행간을 읽어 보면 그의 열정 뒤에 숨은 미묘한 망설임이 드러납니다.',
      it: 'Leggere tra le righe rivela una sottile esitazione dietro il suo entusiasmo.',
      pt: 'Ler nas entrelinhas revela uma sutil hesitação por trás do entusiasmo dele.',
      ar: 'القراءة بين السطور تكشف عن تردد خفي وراء حماسه.',
      hi: 'शब्दों के पीछे छिपे भाव को समझने पर उनके उत्साह के पीछे एक सूक्ष्म हिचकिचाहट झलकती है।',
      ru: 'Чтение между строк выявляет тонкое сомнение, скрытое за его энтузиазмом.',
      tr: 'Satır aralarını okumak, onun coşkusunun ardındaki ince tereddüdü ortaya koyar.',
      nl: 'Tussen de regels door lezen onthult subtiele aarzeling achter zijn enthousiasme.',
      sv: 'Att läsa mellan raderna avslöjar en subtil tvekan bakom hans entusiasm.',
    },
  },
  {
    id: 'c1-policy-paradox',
    level: 'C1',
    category: 'Academic Discourse',
    english: 'Paradoxically, stricter regulations sometimes spur faster technological innovation.',
    note: 'C1 Hard: Uses sentence-initial adverbial framing for counterintuitive arguments.',
    translations: {
      en: 'Paradoxically, stricter regulations sometimes spur faster technological innovation.',
      de: 'Paradoxerweise treiben strengere Vorschriften manchmal schnellere technologische Innovationen voran.',
      ja: '逆説的ですが、より厳しい規制が技術革新を加速させることもあります。',
      es: 'Paradójicamente, las regulaciones más estrictas a veces impulsan una innovación tecnológica más rápida.',
      zh: '矛盾的是，更严格的监管有时反而会激发更快的科技创新。',
      fr: 'Paradoxalement, des réglementations plus strictes stimulent parfois une innovation technologique plus rapide.',
      ko: '역설적이게도, 더 엄격한 규제가 때로는 기술 혁신을 더 빠르게 촉진합니다.',
      it: 'Paradossalmente, normative più severe a volte stimolano un’innovazione tecnologica più rapida.',
      pt: 'Paradoxalmente, regulamentações mais rigorosas às vezes impulsionam inovações tecnológicas mais rápidas.',
      ar: 'ومن المفارقات أن اللوائح الأكثر صرامة تحفز أحياناً ابتكاراً تقنياً أسرع.',
      hi: 'विरोधाभासी रूप से, कड़े नियम कभी-कभी तीव्र तकनीकी नवाचार को बढ़ावा देते हैं।',
      ru: 'Парадоксально, но более строгие правила порой ускоряют технологические инновации.',
      tr: 'Paradoksal olarak, daha sıkı düzenlemeler bazen teknolojik yeniliği hızlandırır.',
      nl: 'Paradoxaal genoeg stimuleren strengere regels soms snellere technologische innovatie.',
      sv: 'Paradoxalt nog sporrar striktare regleringar ibland snabbare teknisk innovation.',
    },
  },
  {
    id: 'c1-inversion-seldom',
    level: 'C1',
    category: 'Advanced Syntax',
    english: 'Seldom have linguistic shifts reshaped daily communication so rapidly.',
    note: 'C1 Hard: Negative-adverb fronting adds rhetorical emphasis in formal writing.',
    translations: {
      en: 'Seldom have linguistic shifts reshaped daily communication so rapidly.',
      de: 'Selten haben sprachliche Veränderungen die Alltagskommunikation so rasch umgestaltet.',
      ja: '言語の変化がこれほど急速に日常のコミュニケーションを作り変えたことは稀です。',
      es: 'Rara vez los cambios lingüísticos han transformado tan rápidamente la comunicación cotidiana.',
      zh: '语言演变极少如此迅速地重塑日常交流。',
      fr: 'Rarement les mutations linguistiques ont remodelé aussi rapidement la communication quotidienne.',
      ko: '언어 변화가 일상 소통을 이토록 빠르게 재편한 적은 드뭅니다.',
      it: 'Raramente i mutamenti linguistici hanno rimodellato così rapidamente la comunicazione quotidiana.',
      pt: 'Raramente mudanças linguísticas remodelaram tão rapidamente a comunicação cotidiana.',
      ar: 'نادراً ما أعادت التحولات اللغوية تشكيل التواصل اليومي بهذه السرعة.',
      hi: 'शायद ही कभी भाषाई बदलावों ने दैनिक संवाद को इतनी तेजी से नया रूप दिया हो।',
      ru: 'Редко языковые сдвиги так стремительно меняли повседневное общение.',
      tr: 'Dilbilimsel değişimlerin günlük iletişimi bu kadar hızlı dönüştürdüğü nadirdir.',
      nl: 'Zelden hebben taalverschuivingen de dagelijkse communicatie zo snel hervormd.',
      sv: 'Sällan har språkliga förändringar omformat den dagliga kommunikationen så snabbt.',
    },
  },
  {
    id: 'c1-implicit-assumption',
    level: 'C1',
    category: 'Critical Analysis',
    english: 'The argument rests on an unexamined assumption about regional dialects.',
    note: 'C1 Hard: Precise evaluative vocabulary used in essays and critiques.',
    translations: {
      en: 'The argument rests on an unexamined assumption about regional dialects.',
      de: 'Das Argument beruht auf einer ungeprüften Annahme über regionale Dialekte.',
      ja: 'その議論は地域方言に関する検証されていない前提に基づいています。',
      es: 'El argumento se apoya en una suposición no examinada sobre los dialectos regionales.',
      zh: '这一论点建立在对地方方言未经审视的假设之上。',
      fr: 'L’argument repose sur une hypothèse non vérifiée concernant les dialectes régionaux.',
      ko: '그 주장은 지역 방언에 대한 검증되지 않은 가정에 근거하고 있습니다.',
      it: 'L’argomento si fonda su un presupposto non verificato riguardo ai dialetti regionali.',
      pt: 'O argumento baseia-se em uma suposição não examinada sobre dialetos regionais.',
      ar: 'تستند الحجة إلى افتراض غير مدروس حول اللهجات الإقليمية.',
      hi: 'यह तर्क क्षेत्रीय बोलियों के बारे में एक अपरीक्षित धारणा पर टिका है।',
      ru: 'Этот аргумент опирается на непроверенное допущение о региональных диалектах.',
      tr: 'Bu argüman, bölgesel lehçeler hakkında incelenmemiş bir varsayıma dayanıyor.',
      nl: 'Het argument berust op een ongecontroleerde aanname over regionale dialecten.',
      sv: 'Argumentet vilar på ett oprövat antagande om regionala dialekter.',
    },
  },

  // C2 Mastery (Hard)
  {
    id: 'c2-ephemeral-eloquence',
    level: 'C2',
    category: 'Literary & Rhetoric',
    english: 'Her measured eloquence bridged generations without ever sounding contrived.',
    note: 'C2 Hard: Stylistic mastery pairing "measured eloquence" with subtle negation.',
    translations: {
      en: 'Her measured eloquence bridged generations without ever sounding contrived.',
      de: 'Ihre maßvolle Eloquenz schlug Brücken zwischen Generationen, ohne je gekünstelt zu wirken.',
      ja: '彼女の節度ある雄弁さは、決して不自然に聞こえることなく世代間をつなぎました。',
      es: 'Su mesurada elocuencia tendió puentes entre generaciones sin sonar jamás artificiosa.',
      zh: '她分寸得当的口才跨越了代际沟通，却丝毫不显刻意造作。',
      fr: 'Son éloquence mesurée a jeté des ponts entre les générations sans jamais paraître artificielle.',
      ko: '그녀의 절제된 웅변은 인위적으로 들리지 않으면서도 세대 간 가교 역할을 했습니다.',
      it: 'La sua misurata eloquenza ha unito le generazioni senza mai risultare artificiosa.',
      pt: 'Sua eloquência comedida aproximou gerações sem jamais soar artificial.',
      ar: 'فصاحتها المتزنة ربطت بين الأجيال دون أن تبدو متكلفة قط.',
      hi: 'उनकी संतुलित वाक्पटुता ने बिना किसी बनावट के पीढ़ियों के बीच सेतु का काम किया।',
      ru: 'Её выверенное красноречие сближало поколения, ничуть не звуча натянуто.',
      tr: 'Ölçülü belagati, yapmacık durmadan kuşaklar arasında köprü kurdu.',
      nl: 'Haar afgewogen welsprekendheid sloeg bruggen tussen generaties zonder ooit gezocht te klinken.',
      sv: 'Hennes avvägda vältalighet överbryggade generationer utan att någonsin låta tillgjord.',
    },
  },
  {
    id: 'c2-nuanced-concession',
    level: 'C2',
    category: 'Executive & Legal Register',
    english: 'Notwithstanding earlier reservations, the committee ratified the accord unanimously.',
    note: 'C2 Hard: High-register legal/executive connector ("Notwithstanding").',
    translations: {
      en: 'Notwithstanding earlier reservations, the committee ratified the accord unanimously.',
      de: 'Ungeachtet früherer Vorbehalte ratifizierte der Ausschuss das Abkommen einstimmig.',
      ja: '当初の懸念にもかかわらず、委員会は全会一致で合意を批准しました。',
      es: 'No obstante las reservas iniciales, el comité ratificó el acuerdo por unanimidad.',
      zh: '尽管此前有所保留，委员会仍一致批准了该协议。',
      fr: 'Nonobstant les réserves antérieures, le comité a ratifié l’accord à l’unanimité.',
      ko: '초기의 유보적 입장에도 불구하고 위원회는 만장일치로 협정을 비준했습니다.',
      it: 'Nonostante le riserve precedenti, il comitato ha ratificato l’accordo all’unanimità.',
      pt: 'Não obstante as ressalvas anteriores, o comitê ratificou o acordo por unanimidade.',
      ar: 'وعلى الرغم من التحفظات السابقة، صادقت اللجنة على الاتفاق بالإجماع.',
      hi: 'पिछली आपत्तियों के बावजूद, समिति ने सर्वसम्मति से समझौते की पुष्टि कर दी।',
      ru: 'Несмотря на прежние оговорки, комитет единогласно ратифицировал соглашение.',
      tr: 'Önceki çekincelere rağmen komite anlaşmayı oy birliğiyle onayladı.',
      nl: 'Niettegenstaande eerdere bedenkingen bekrachtigde de commissie het akkoord unaniem.',
      sv: 'Oaktat tidigare reservationer ratificerade kommittén överenskommelsen enhälligt.',
    },
  },
  {
    id: 'c2-semantic-drift',
    level: 'C2',
    category: 'Linguistics & Philosophy',
    english: 'Semantic drift illustrates how living idioms absorb shifting social values.',
    note: 'C2 Hard: Precision academic phrasing describing historical language evolution.',
    translations: {
      en: 'Semantic drift illustrates how living idioms absorb shifting social values.',
      de: 'Bedeutungswandel veranschaulicht, wie lebendige Idiome gesellschaftliche Werte aufnehmen.',
      ja: '意味変化は、生きた慣用句がいかに移り変わる社会的価値観を吸収するかを示しています。',
      es: 'La deriva semántica ilustra cómo los modismos vivos absorben valores sociales cambiantes.',
      zh: '语义漂移折射出鲜活的习语如何吸纳不断变迁的社会价值观。',
      fr: 'La dérive sémantique illustre la manière dont les idiomes vivants absorbent l’évolution des valeurs.',
      ko: '의미 변천은 살아 있는 관용어가 변화하는 사회적 가치를 어떻게 수용하는지 보여 줍니다.',
      it: 'La deriva semantica illustra come gli idiomi vivi assorbano valori sociali mutevoli.',
      pt: 'A deriva semântica ilustra como expressões vivas absorvem valores sociais em transformação.',
      ar: 'يوضح الانزياح الدلالي كيف تستوعب التعبيرات الحية القيم الاجتماعية المتغيرة.',
      hi: 'अर्थ-परिवर्तन दर्शाता है कि जीवंत मुहावरे बदलते सामाजिक मूल्यों को कैसे आत्मसात करते हैं।',
      ru: 'Семантический сдвиг показывает, как живые идиомы вбирают меняющиеся общественные ценности.',
      tr: 'Anlam kayması, yaşayan deyimlerin değişen toplumsal değerleri nasıl özümsediğini gösterir.',
      nl: 'Semantische verschuiving illustreert hoe levende uitdrukkingen veranderende sociale waarden opnemen.',
      sv: 'Semantisk förskjutning illustrerar hur levande idiom absorberar skiftande samhällsvärderingar.',
    },
  },
  {
    id: 'c2-irony-understatement',
    level: 'C2',
    category: 'Stylistic Mastery',
    english: 'To call the summit merely eventful would be a considerable understatement.',
    note: 'C2 Hard: Infinitive subject paired with cultivated litotes/understatement.',
    translations: {
      en: 'To call the summit merely eventful would be a considerable understatement.',
      de: 'Den Gipfel bloß ereignisreich zu nennen, wäre eine beträchtliche Untertreibung.',
      ja: 'その首脳会談を単に波乱に富んでいたと呼ぶのは、控えめな表現に過ぎます。',
      es: 'Llamar a la cumbre meramente agitada sería quedarse muy corto.',
      zh: '将此次峰会仅仅称作“颇多波折”未免过于轻描淡写。',
      fr: 'Qualifier ce sommet de simplement mouvementé relèverait d’un euphémisme considérable.',
      ko: '그 정상회담을 단순히 다사다난했다고 표현하는 것은 지나친 축소일 것입니다.',
      it: 'Definire il vertice semplicemente movimentato sarebbe un notevole eufemismo.',
      pt: 'Chamar a cúpula de apenas movimentada seria um eufemismo considerável.',
      ar: 'وصف القمة بأنها حافلة بالأحداث فحسب سيكون تهويناً كبيراً من شأنها.',
      hi: 'इस शिखर सम्मेलन को मात्र घटनापूर्ण कहना एक बहुत बड़ा अल्पकथन होगा।',
      ru: 'Назвать саммит просто насыщенным было бы серьёзным преуменьшением.',
      tr: 'Zirveyi yalnızca hareketli diye nitelemek ciddi bir hafife alma olurdu.',
      nl: 'De top louter bewogen noemen zou een aanzienlijk understatement zijn.',
      sv: 'Att kalla toppmötet enbart händelserikt vore en betydande underdrift.',
    },
  },
  {
    id: 'c2-synthesis-mastery',
    level: 'C2',
    category: 'Executive & Legal Register',
    english: 'Fluency culminates not in memorizing rules, but in effortlessly bending tone to fit the moment.',
    note: 'C2 Hard: Antithesis ("not in X, but in Y") summarizing pragmatic mastery.',
    translations: {
      en: 'Fluency culminates not in memorizing rules, but in effortlessly bending tone to fit the moment.',
      de: 'Sprachgewandtheit gipfelt nicht im Auswendiglernen von Regeln, sondern im mühelosen Anpassen des Tonfalls.',
      ja: '流暢さの極みは規則の暗記ではなく、その場にふさわしく語調を自在に操ることにあります。',
      es: 'La fluidez culmina no en memorizar reglas, sino en modular el tono con naturalidad según el momento.',
      zh: '真正的流利不在于死记硬背规则，而在于因境制宜地自如拿捏语气。',
      fr: 'La maîtrise ne réside pas dans la mémorisation des règles, mais dans l’art d’adapter le ton avec aisance.',
      ko: '유창함의 정점은 규칙 암기가 아니라 상황에 맞게 어조를 자연스럽게 조율하는 데 있습니다.',
      it: 'La padronanza culmina non nel memorizzare regole, ma nel modulare il tono con naturalezza.',
      pt: 'A fluência culmina não em memorizar regras, mas em ajustar o tom sem esforço ao momento.',
      ar: 'لا تكتمل الطلاقة بحفظ القواعد، بل بتطويع النبرة بسلاسة لتناسب الموقف.',
      hi: 'भाषा में प्रवीणता केवल नियम रटने में नहीं, बल्कि परिस्थिति के अनुसार सहजता से लहजा ढालने में निहित है।',
      ru: 'Свободное владение заключается не в зубрёжке правил, а в умении непринуждённо подбирать нужный тон.',
      tr: 'Akıcılık kuralları ezberlemekte değil, üslubu ana zahmetsizce uyarlamakta doruğa ulaşır.',
      nl: 'Vloeiendheid culmineert niet in het uit het hoofd leren van regels, maar in het moeiteloos aanpassen van de toon.',
      sv: 'Flyt kulminerar inte i att memorera regler, utan i att obesvärat anpassa tonen efter stunden.',
    },
  },
];

// Deterministic hash-based shuffle so options stay stable per challenge ID
function deterministicRotate<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (seed * 31 + i * 17) % (i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

interface PhaseBlueprint {
  phase: number;
  title: string;
  level: CEFRLevel;
  difficulty: CEFRDifficulty;
  xp: number;
  imagePath: string;
  imageCaption: string;
  sourceType: string;
  contextLabel: string;
}

const SCENE_CATALOG = [
  {
    imagePath: '/src/assets/images/scene_cafe_ordering_1795512068688.jpg',
    imageCaption: 'Morning Espresso Counter & Neighborly Hospitality',
    sourceType: 'Café Counter Receipt & Dialogue',
    contextLabel: 'Spoken politely when ordering drinks or pastries across the counter.',
  },
  {
    imagePath: '/src/assets/images/scene_train_station_1795512070512.jpg',
    imageCaption: 'International High-Speed Rail Concourse & Platform Signs',
    sourceType: 'Railway Departure Board & Ticket Stub',
    contextLabel: 'Used at ticket kiosks, platform gates, and transit information desks.',
  },
  {
    imagePath: '/src/assets/images/scene_city_market_1795512072251.jpg',
    imageCaption: 'Daytime City Produce & Artisan Bakery Market Square',
    sourceType: 'Market Stall Price Sign & Vendor Chat',
    contextLabel: 'Heard daily when asking prices, quantities, and local dish recommendations.',
  },
  {
    imagePath: '/src/assets/images/scene_office_meeting_1795512071673.jpg',
    imageCaption: 'Glass-Walled Project Briefing & Cross-Team Collaboration',
    sourceType: 'Workplace Calendar Invite & Project Memo',
    contextLabel: 'Used in team standups, scheduling requests, and diplomatic business calls.',
  },
  {
    imagePath: '/src/assets/images/scene_library_debate_1795512071567.jpg',
    imageCaption: 'University Seminar Room & Literary Research Archive',
    sourceType: 'Academic Seminar Brief & Policy Commentary',
    contextLabel: 'C1–C2 high-register phrasing for debates, essays, and executive briefings.',
  },
  {
    imagePath: '/src/assets/images/offline_travel_learning_1795509263554.jpg',
    imageCaption: 'Scenic Alpine Train Cabin Travel Journal',
    sourceType: 'Travel Itinerary & Hotel Front-Desk Log',
    contextLabel: 'Practical problem-solving phrases during hotels, delays, and bookings.',
  },
];

const PHASE_TITLES: string[] = [
  // A1 (Phases 1-9)
  'First Greetings & Introductions', 'Morning Café Ordering', 'Polite Gratitude & Basics', 'Train Station Essentials', 'Numbers & Ticket Counters',
  'City Square Directions', 'Hotel Front Desk Check-In', 'Ordering Water & Table Manners', 'Everyday Courtesies Review',
  // A2 (Phases 10-18)
  'Asking Speakers to Slow Down', 'Planning Afternoon Meetups', 'Local Dish Recommendations', 'Weather & Park Walks', 'Lost Keys & Front Desk Help',
  'Daily Study Routines', 'Street Market Shopping', 'Weekend Transit Plans', 'Elementary Conversation Mastery',
  // B1 (Phases 19-27)
  'Asking Meaning Differences', 'Deadlines & Team Presentations', 'Diplomatic Call Rescheduling', 'Flight Delays & Solutions', 'Health & Rest Advice',
  'Clarifying Workplace Plans', 'Comparing Opinions Smoothly', 'Travel Contingency Stories', 'Intermediate Bridge Review',
  // B2 (Phases 28-35)
  'Formal vs Casual Register', 'Bilingual Perspectives & Culture', 'Clarifying Long-Term Impact', 'Past Counterfactual Regrets', 'Verified Facts vs Opinion',
  'Structured Negotiation Moves', 'Problem Solving Under Pressure', 'Upper-Intermediate Fluency Lab',
  // C1 Hard (Phases 36-43)
  'Diplomatic Hedging & Alignment', 'Reading Between the Lines', 'Regulatory & Policy Paradoxes', 'Formal Negative Inversion', 'Examining Implicit Assumptions',
  'Nuanced Critique & Rhetoric', 'Cross-Cultural Pragmatics', 'C1 Hard Synthesis Challenge',
  // C2 Hard (Phases 44-50)
  'Measured Literary Eloquence', 'Executive & Legal Ratification', 'Semantic Drift & Living Idioms', 'Cultivated Understatement', 'Bending Tone to the Moment',
  'Editorial Style & Precision', 'Grand Polyglot Final Mastery',
];

function getPhaseBlueprint(phaseNum: number): PhaseBlueprint {
  let level: CEFRLevel = 'A1';
  let difficulty: CEFRDifficulty = 'Foundation';
  let xp = 10;

  if (phaseNum <= 9) {
    level = 'A1'; difficulty = 'Foundation'; xp = 10;
  } else if (phaseNum <= 18) {
    level = 'A2'; difficulty = 'Foundation'; xp = 15;
  } else if (phaseNum <= 27) {
    level = 'B1'; difficulty = 'Intermediate'; xp = 20;
  } else if (phaseNum <= 35) {
    level = 'B2'; difficulty = 'Intermediate'; xp = 25;
  } else if (phaseNum <= 43) {
    level = 'C1'; difficulty = 'Hard'; xp = 35;
  } else {
    level = 'C2'; difficulty = 'Hard'; xp = 45;
  }

  const scene =
    level === 'A1'
      ? SCENE_CATALOG[(phaseNum - 1) % 3]
      : level === 'A2'
        ? SCENE_CATALOG[(phaseNum + 1) % 4]
        : level === 'B1' || level === 'B2'
          ? SCENE_CATALOG[2 + (phaseNum % 3)]
          : SCENE_CATALOG[4];

  return {
    phase: phaseNum,
    title: PHASE_TITLES[phaseNum - 1] || `Phase ${phaseNum}`,
    level,
    difficulty,
    xp,
    imagePath: scene.imagePath,
    imageCaption: scene.imageCaption,
    sourceType: scene.sourceType,
    contextLabel: scene.contextLabel,
  };
}

interface DrillFrame {
  label: string;
  templateKnown: (src: string, knownName: string, targetName: string, eng: string) => string;
  templateTarget: (src: string, knownName: string, targetName: string, eng: string) => string;
}

const DRILL_FRAMES: DrillFrame[] = [
  { label: 'Core Translation', templateKnown: (src, knownName, targetName) => `From ${knownName} to ${targetName}: Choose the exact ${targetName} expression for "${src}"`, templateTarget: (src, knownName, targetName) => `From ${targetName} to ${knownName}: What does "${src}" mean in ${knownName}?` },
  { label: 'Audio Listening Comprehension', templateKnown: (src, knownName, targetName) => `Listen in ${targetName} or read (${knownName} cue): "${src}" — Pick the matching ${targetName} response`, templateTarget: (src, knownName, targetName) => `Listen to this ${targetName} phrase "${src}" and select the accurate ${knownName} meaning` },
  { label: 'Real-Life Scene Dialogue', templateKnown: (_src, knownName, targetName, eng) => `Scene check (${targetName} · English: "${eng}" · ${knownName} context): Pick the natural ${targetName} line`, templateTarget: (src, knownName, targetName) => `Interpret this real-world ${targetName} line "${src}" back into natural ${knownName}` },
  { label: 'Nuance & Evidence Check', templateKnown: (src, knownName, targetName) => `Bridge (${knownName} → ${targetName}): Which ${targetName} wording fits the attached evidence for "${src}"?`, templateTarget: (src, knownName, targetName) => `Reverse bridge (${targetName} → ${knownName}): Identify the exact ${knownName} meaning of "${src}"` },
];

export function getMultilingualGlossForEnglish(englishMeaning: string, knownLangCode: string): string | null {
  const lower = englishMeaning.toLowerCase();
  const hit = MULTILINGUAL_CONCEPTS.find(
    (c) => lower.includes(c.english.toLowerCase().slice(0, 12)) || c.english.toLowerCase().includes(lower.slice(0, 12))
  );
  if (hit && hit.translations[knownLangCode]) {
    return hit.translations[knownLangCode];
  }
  return null;
}

export function generate50PhasesChallenges(
  targetLangCode: string,
  knownLangCode: string,
  directionMode: 'known_to_target' | 'target_to_known' | 'mixed' = 'mixed'
): CEFRChallenge[] {
  const targetCourse: LanguageCourse = LANGUAGES.find((l) => l.code === targetLangCode) || LANGUAGES[0];
  const knownCourse: LanguageCourse = LANGUAGES.find((l) => l.code === knownLangCode) || LANGUAGES.find((l) => l.code === 'en') || LANGUAGES[1];

  const effectiveKnown =
    knownCourse.code === targetCourse.code
      ? LANGUAGES.find((l) => l.code !== targetCourse.code) || knownCourse
      : knownCourse;

  const byLevel: Record<CEFRLevel, ConceptItem[]> = {
    A1: MULTILINGUAL_CONCEPTS.filter((c) => c.level === 'A1'),
    A2: MULTILINGUAL_CONCEPTS.filter((c) => c.level === 'A2'),
    B1: MULTILINGUAL_CONCEPTS.filter((c) => c.level === 'B1'),
    B2: MULTILINGUAL_CONCEPTS.filter((c) => c.level === 'B2'),
    C1: MULTILINGUAL_CONCEPTS.filter((c) => c.level === 'C1'),
    C2: MULTILINGUAL_CONCEPTS.filter((c) => c.level === 'C2'),
  };

  targetCourse.flashcards.forEach((fc, idx) => {
    const level: CEFRLevel = idx < 2 ? 'A1' : idx < 4 ? 'A2' : 'B1';
    const fallbackConcept = MULTILINGUAL_CONCEPTS[idx % MULTILINGUAL_CONCEPTS.length];
    byLevel[level].push({
      id: `${targetCourse.code}-fc-${fc.id}`,
      level,
      category: `Vocabulary · ${fc.partOfSpeech}`,
      english: `${fc.meaning} (${fc.exampleEnglish})`,
      note: fc.culturalNote,
      translations: {
        ...fallbackConcept.translations,
        en: `${fc.meaning} — "${fc.exampleEnglish}"`,
        [targetCourse.code]: `${fc.term} (${fc.exampleTarget})`,
      },
    });
  });

  const challenges: CEFRChallenge[] = [];
  let globalIndex = 1;

  for (let phaseNum = 1; phaseNum <= 50; phaseNum++) {
    const bp = getPhaseBlueprint(phaseNum);
    const pool = byLevel[bp.level];
    const allConcepts = MULTILINGUAL_CONCEPTS;

    for (let qInPhase = 1; qInPhase <= 10; qInPhase++) {
      const item = pool[(phaseNum * 3 + qInPhase - 1) % pool.length];
      const frame = DRILL_FRAMES[(globalIndex + qInPhase) % DRILL_FRAMES.length];

      const direction: 'known_to_target' | 'target_to_known' =
        directionMode === 'mixed'
          ? globalIndex % 2 === 1
            ? 'known_to_target'
            : 'target_to_known'
          : directionMode;

      const targetText = item.translations[targetCourse.code] || item.english;
      const knownText =
        effectiveKnown.code === targetCourse.code
          ? item.english
          : item.translations[effectiveKnown.code] || item.english;

      const sourceDisplay = direction === 'known_to_target' ? knownText : targetText;
      const correctAnswer = direction === 'known_to_target' ? targetText : knownText;

      const distractorLang = direction === 'known_to_target' ? targetCourse.code : effectiveKnown.code;
      const distractors: string[] = [];
      for (let d = 1; d < allConcepts.length && distractors.length < 3; d++) {
        const candidateConcept = allConcepts[(allConcepts.indexOf(item) + d * 3 + qInPhase + phaseNum) % allConcepts.length];
        const candidateText = candidateConcept.translations[distractorLang] || candidateConcept.english;
        if (candidateText !== correctAnswer && !distractors.includes(candidateText)) {
          distractors.push(candidateText);
        }
      }
      while (distractors.length < 3) {
        distractors.push(`${correctAnswer} (${distractors.length + 1})`);
      }

      const options = deterministicRotate([correctAnswer, ...distractors], globalIndex * 7 + qInPhase);
      const promptQuestion =
        direction === 'known_to_target'
          ? frame.templateKnown(sourceDisplay, effectiveKnown.name, targetCourse.name, item.english)
          : frame.templateTarget(sourceDisplay, effectiveKnown.name, targetCourse.name, item.english);

      const qScene = SCENE_CATALOG[(phaseNum + qInPhase - 2) % SCENE_CATALOG.length];
      const difficultyNote =
        bp.difficulty === 'Hard'
          ? `Hard ${bp.level} Challenge: Pay careful attention to register, nuance, and idiomatic precision.`
          : item.note;

      challenges.push({
        id: `${targetCourse.code}-p${phaseNum}-q${qInPhase}`,
        index: globalIndex,
        phase: phaseNum,
        questionInPhase: qInPhase,
        phaseTitle: bp.title,
        level: bp.level,
        difficulty: bp.difficulty,
        category: `${frame.label} · ${item.category}`,
        direction,
        promptQuestion,
        voiceText: targetText,
        voiceLangCode: targetCourse.code,
        options,
        correctAnswer,
        englishReference: item.english,
        explanation: difficultyNote,
        xpReward: bp.xp,
        imagePath: qInPhase <= 5 ? bp.imagePath : qScene.imagePath,
        imageCaption: qInPhase <= 5 ? bp.imageCaption : qScene.imageCaption,
        realLifeEvidence: {
          sourceType: qInPhase <= 5 ? bp.sourceType : qScene.sourceType,
          contextLabel: qInPhase <= 5 ? bp.contextLabel : qScene.contextLabel,
          targetExcerpt: targetText,
          knownExcerpt: knownText,
          usageTip: item.note,
        },
      });

      globalIndex += 1;
    }
  }

  return challenges;
}

export interface PhaseGroup {
  phase: number;
  title: string;
  level: CEFRLevel;
  difficulty: CEFRDifficulty;
  imagePath: string;
  imageCaption: string;
  questions: CEFRChallenge[];
}

export function groupChallengesByPhase(challenges: CEFRChallenge[]): PhaseGroup[] {
  const map = new Map<number, PhaseGroup>();
  challenges.forEach((ch) => {
    const existing = map.get(ch.phase);
    if (existing) {
      existing.questions.push(ch);
    } else {
      map.set(ch.phase, {
        phase: ch.phase,
        title: ch.phaseTitle,
        level: ch.level,
        difficulty: ch.difficulty,
        imagePath: ch.imagePath,
        imageCaption: ch.imageCaption,
        questions: [ch],
      });
    }
  });
  return Array.from(map.values()).sort((a, b) => a.phase - b.phase);
}

