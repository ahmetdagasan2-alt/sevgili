export const QUOTE_CATEGORIES = {
  romantik: { label: "Romantik", emoji: "💕" },
  tatli: { label: "Tatlı", emoji: "🍯" },
  komik: { label: "Gülümset", emoji: "😄" },
  sabah: { label: "Günaydın", emoji: "☀️" },
  destek: { label: "Yanındayım", emoji: "🤍" },
  biz: { label: "Biz", emoji: "👫" },
} as const;

export type QuoteCategory = keyof typeof QUOTE_CATEGORIES;
export type Quote = { text: string; category: QuoteCategory };

/**
 * Günün sözleri. Yeni söz eklemek için listenin sonuna bir satır ekleyin;
 * sıra karıştırıldığı için nereye eklendiği önemli değil.
 */
export const QUOTES: Quote[] = [
  // Romantik
  { category: "romantik", text: "Seninle geçen her gün, takvimde en sevdiğim gün oluyor." },
  { category: "romantik", text: "Kalbimin adresi belli: neredeysen orası." },
  { category: "romantik", text: "Dünyada milyonlarca insan var ama benim gözüm hep seni arıyor." },
  { category: "romantik", text: "Sen gülünce içimde bir yerlerde çiçekler açıyor." },
  { category: "romantik", text: "Bazı insanlar ev gibidir. Sen benim evimsin." },
  { category: "romantik", text: "Seni sevmek, nefes almak kadar kolay ve onun kadar gerekli." },
  { category: "romantik", text: "En güzel manzaram, yanımda oturan sensin." },
  { category: "romantik", text: "Elini tuttuğumda bütün gürültü susuyor." },
  { category: "romantik", text: "Seninle sessizlik bile sohbet gibi." },
  { category: "romantik", text: "Kalbim seni gördüğü ilk günden beri aynı şarkıyı çalıyor." },
  { category: "romantik", text: "Yıldızları saymaya kalksam, seni düşündüğüm anlar daha fazla çıkar." },
  { category: "romantik", text: "Her sabah uyandığımda ilk aklıma gelen, her gece son düşündüğüm sensin." },
  { category: "romantik", text: "Bir insanı bu kadar özlemek mümkün mü diye düşünürken hep seni özlüyorum." },
  { category: "romantik", text: "Gözlerine baktığımda zamanın nasıl geçtiğini unutuyorum." },
  { category: "romantik", text: "Sen benim en güzel tesadüfüm, en doğru kararımsın." },
  { category: "romantik", text: "Aşk bir kelimeyse, bende senin adınla yazılıyor." },
  { category: "romantik", text: "Seninle her yer biraz deniz kenarı gibi." },
  { category: "romantik", text: "Kalbimde senin için ayrılmış bir oda yok; kalbimin tamamı senin." },
  { category: "romantik", text: "Yüzündeki o küçük gülümseme, günümün tamamını değiştirmeye yetiyor." },
  { category: "romantik", text: "Seni her gün yeniden seçiyorum, hiç düşünmeden." },
  { category: "romantik", text: "Mutluluğun bir sesi olsaydı, senin kahkahan olurdu." },
  { category: "romantik", text: "Uzakta olsan da kalbim hep yanında oturuyor." },
  { category: "romantik", text: "Ben seni sevdikçe dünya biraz daha güzel bir yer oluyor." },
  { category: "romantik", text: "Bütün yollar bir yere çıkar; benimkiler hep sana çıkıyor." },
  { category: "romantik", text: "Gökyüzü ne kadar mavi olursa olsun, en sevdiğim renk gözlerinin rengi." },
  { category: "romantik", text: "Bir ömür az gelir ama seninle her güne razıyım." },
  { category: "romantik", text: "Kalbim sana her baktığında biraz daha hızlı atıyor, hâlâ." },
  { category: "romantik", text: "Seni sevmek benim en sevdiğim alışkanlığım." },
  { category: "romantik", text: "İyi ki o gün oradaydın, iyi ki sendin." },
  { category: "romantik", text: "Seninle birlikte sıradan bir salı bile bayram gibi." },

  // Tatlı
  { category: "tatli", text: "Bugün su içmeyi unutma. Bir de beni sevmeyi. 💧" },
  { category: "tatli", text: "Sana kocaman, sıkı, bırakmayan bir sarılma borçluyum. Faiziyle ödeyeceğim." },
  { category: "tatli", text: "Dünyanın en tatlı insanına günaydın. Evet, sana diyorum." },
  { category: "tatli", text: "Kahven sıcak, günün güzel, kalbin hafif olsun." },
  { category: "tatli", text: "Bugün kendine iyi bak; çünkü sen benim en kıymetlimsin." },
  { category: "tatli", text: "Seni düşününce yüzümde beliren o aptal gülümsemeyi bir görsen." },
  { category: "tatli", text: "Bir yerlerde biri seni çok seviyor. İpucu: bu mesajı yazan kişi." },
  { category: "tatli", text: "Sana küçük bir hatırlatma: harikasın ve bunu unutmamalısın." },
  { category: "tatli", text: "Bugün sana bir kalp gönderiyorum, iade kabul edilmez. ❤️" },
  { category: "tatli", text: "Yanaklarına bir öpücük bıraktım, akşam gelip kontrol edeceğim." },
  { category: "tatli", text: "Sen benim en sevdiğim bildirimsin." },
  { category: "tatli", text: "Bugün birine gülümse. Tercihen bana." },
  { category: "tatli", text: "Kalbimin şarj aleti sensin, yanımda olunca hep yüzde yüz." },
  { category: "tatli", text: "Sana bakmak, en sevdiğim şeyi yapmak gibi." },
  { category: "tatli", text: "Bugün ne giyersen giy, en güzel aksesuarın gülüşün olacak." },
  { category: "tatli", text: "Seninle bir battaniye, bir film ve bitmeyen bir akşam istiyorum." },
  { category: "tatli", text: "Sen yokken çikolata bile yeterince tatlı gelmiyor." },
  { category: "tatli", text: "Bu siteyi açtıysan beni düşünüyorsun demektir. Ben de seni düşünüyorum." },
  { category: "tatli", text: "Bugün sana gelen her güzel şeyin arkasında benim dualarım var." },
  { category: "tatli", text: "Seni seviyorum. Bunu dün de söyledim, yarın da söyleyeceğim." },
  { category: "tatli", text: "Kalbin yorulursa bana yasla, ben taşırım." },
  { category: "tatli", text: "Gününe bir avuç güneş, bir tutam şans, bir de benden kocaman sevgi." },
  { category: "tatli", text: "Sen bir gülümsersin, benim bütün haftam düzelir." },
  { category: "tatli", text: "Bugün sana kocaman bir 'iyi ki' yolluyorum." },
  { category: "tatli", text: "Sarılmak için bir bahaneye ihtiyacım yok ama bugün de bir tane buldum: sen." },

  // Komik
  { category: "komik", text: "Seni seviyorum ama son dilim pizzayı yine de paylaşmam. Belki. Düşüneceğim." },
  { category: "komik", text: "Sana olan sevgim, telefonumdaki açık sekme sayısından bile fazla." },
  { category: "komik", text: "Bugün dünyayı kurtaramayabilirsin ama beni zaten kurtardın, yeter." },
  { category: "komik", text: "Kahve olmadan uyanamam, sen olmadan da gülümseyemem." },
  { category: "komik", text: "Seninle her şeye varım. Sabah 6'da koşu hariç." },
  { category: "komik", text: "Akıllı telefonum var ama en akıllıca işim seni seçmekti." },
  { category: "komik", text: "Bana kızdığında bile tatlısın. Bunu söylediğim için biraz daha kızacaksın, biliyorum." },
  { category: "komik", text: "Sen benim favori insanımsın. Kediler bile sıralamada ikinci." },
  { category: "komik", text: "Puzzle'da rekor kırmak güzel ama kalbimi çoktan tamamladın." },
  { category: "komik", text: "Bugün ne yesek sorusunun cevabını hâlâ bilmiyorum ama seninle yemek istediğimi biliyorum." },
  { category: "komik", text: "Seni o kadar çok seviyorum ki bazen battaniyeyi bile paylaşıyorum." },
  { category: "komik", text: "Hayat bir film olsaydı, ben senin yan karakterin olmaya bile razıydım. İyi ki başrolüz." },
  { category: "komik", text: "Wi-Fi gibisin: yanındayken her şey çalışıyor." },
  { category: "komik", text: "Benimle evlenir misin demiyorum, sadece bugün de bana katlanır mısın diye soruyorum." },
  { category: "komik", text: "Kalbim seni gördüğünde hâlâ hız sınırını aşıyor. Ceza yazmayın lütfen." },
  { category: "komik", text: "Horlasan bile seviyorum. Horlamıyorsun tabii. Tamam, biraz." },
  { category: "komik", text: "Bugünün hava durumu: %100 seni özleme ihtimali." },
  { category: "komik", text: "Seninle tartışmayı bile seviyorum, özellikle de ben haklıyken." },
  { category: "komik", text: "Plan yapmayı sevmem ama seninle bir ömür planladım bile." },
  { category: "komik", text: "Benim için mükemmel bir gün: sen, ben ve kimsenin bizi aramadığı bir akşam." },

  // Sabah
  { category: "sabah", text: "Günaydın güneşim. Bugün de dünyayı biraz daha güzelleştirmeye hazır mısın?" },
  { category: "sabah", text: "Yeni bir gün, yeni bir sayfa. Ben yine ilk satırına seni yazıyorum." },
  { category: "sabah", text: "Gözlerini açtığın bu güne bol şans, bol kahkaha ve bol sevgi diliyorum." },
  { category: "sabah", text: "Günaydın! Bugün güzel şeyler olacak, hissediyorum." },
  { category: "sabah", text: "Sabahın en güzel tarafı, seni düşünerek başlaması." },
  { category: "sabah", text: "Kalk bakalım uykucu, dünya senin gülüşünü bekliyor." },
  { category: "sabah", text: "Bugünün listesi: kahve, biraz iş, bolca sen." },
  { category: "sabah", text: "Güneş doğdu ama benim günüm senin mesajınla doğuyor." },
  { category: "sabah", text: "Günaydın! Bugün kendine nazik davran, gerisini birlikte hallederiz." },
  { category: "sabah", text: "Her sabah bir hediye, her gün seninle bir şans." },
  { category: "sabah", text: "Yataktan çıkmak zor biliyorum, ama bugün de harika olacaksın." },
  { category: "sabah", text: "Günaydın sevgilim. Bugün de seni seviyorum, hem de dünden fazla." },
  { category: "sabah", text: "Kahven şekerli olmasa da olur, günün tatlı olsun yeter." },
  { category: "sabah", text: "Bugün aynaya bakınca gülümse; ben her gün öyle yapıyorum, aklıma sen geldiğinde." },
  { category: "sabah", text: "Yeni güne merhaba de; içinde bir sürpriz olabilir. Belki de benden." },

  // Destek
  { category: "destek", text: "Zor bir gün olsa da geçecek. Ben buradayım, hep burada olacağım." },
  { category: "destek", text: "Kendine inan; ben sana zaten sonuna kadar inanıyorum." },
  { category: "destek", text: "Yorulduğunda dinlen, vazgeçme. Ben elini bırakmıyorum." },
  { category: "destek", text: "Her şey üstüne geliyorsa derin bir nefes al. Sonra beni ara." },
  { category: "destek", text: "Mükemmel olmak zorunda değilsin; benim için zaten fazlasıyla yeterlisin." },
  { category: "destek", text: "Bugün ne olursa olsun, akşam sana sarılacak biri var." },
  { category: "destek", text: "Başaramadığın şeyler değil, denemeye devam etmen önemli. Seninle gurur duyuyorum." },
  { category: "destek", text: "Fırtına ne kadar sert eserse essin, ben senin limanınım." },
  { category: "destek", text: "Küçük adımlar da adımdır. Bugün attığın her adımı alkışlıyorum." },
  { category: "destek", text: "Kalbin ağırsa bir kısmını bana ver, birlikte taşıyalım." },
  { category: "destek", text: "Sen sandığından çok daha güçlüsün. Bunu ben her gün görüyorum." },
  { category: "destek", text: "Bugün kendine yüklenme. Dinlenmek de ilerlemenin bir parçası." },
  { category: "destek", text: "Hata yapsan da, düşsen de, ağlasan da; ben yine senin tarafındayım." },
  { category: "destek", text: "Endişelendiğin şeylerin çoğu hiç olmayacak. Olanları da birlikte çözeriz." },
  { category: "destek", text: "Sana inanan birinin olduğunu unutma. O kişi şu an bunu yazıyor." },
  { category: "destek", text: "Bugün zor geçtiyse, yarın yeniden başlamak için bir şans daha var." },
  { category: "destek", text: "Gülümsemen kaybolursa sorun değil, ben seninkini de saklıyorum." },
  { category: "destek", text: "Ne kadar uzağa gidersen git, dönünce seni bekleyen bir kucak var." },
  { category: "destek", text: "Kendini yalnız hissettiğinde hatırla: sen benim en önemli insanımsın." },
  { category: "destek", text: "Bugünün yükünü bırak; yarına sadece umudu götür." },

  // Biz
  { category: "biz", text: "Biz, birlikte olunca her şeyin biraz daha kolay olduğu iki kişiyiz." },
  { category: "biz", text: "Seninle yaşadığımız her anı, kalbimin en güzel albümünde saklıyorum." },
  { category: "biz", text: "Birlikte gülüp birlikte susabildiğimiz için çok şanslıyız." },
  { category: "biz", text: "Seninle hayaller kurmak, hayallerimin en güzeli." },
  { category: "biz", text: "Biz bir takımız. Kazanırken de kaybederken de." },
  { category: "biz", text: "Aynı şeye gülüp birbirimize baktığımız o anlar için yaşıyorum." },
  { category: "biz", text: "Bizim hikâyemiz benim en sevdiğim kitap. Ve daha ilk bölümlerdeyiz." },
  { category: "biz", text: "Seninle kahve içmek bile benim için bir macera." },
  { category: "biz", text: "Biz iki puzzle parçası gibiyiz: ayrı ayrı güzel, birlikte tamam." },
  { category: "biz", text: "İlk tanıştığımız günü düşündükçe gülümsüyorum; ne kadar yol geldik." },
  { category: "biz", text: "Daha gezeceğimiz şehirler, izleyeceğimiz filmler, yiyeceğimiz tatlılar var." },
  { category: "biz", text: "Birlikte yaptığımız en sıradan şey bile benim için özel." },
  { category: "biz", text: "Bizim en güzel fotoğrafımız henüz çekilmedi; onu birlikte çekeceğiz." },
  { category: "biz", text: "Seninle büyümek, seninle değişmek, seninle yaşlanmak istiyorum." },
  { category: "biz", text: "Bizim için en iyi plan: hiç plan yapmadan birlikte olmak." },
  { category: "biz", text: "Anılarımız çoğaldıkça kalbim büyüyor sanki." },
  { category: "biz", text: "Dün güzeldi, bugün güzel, yarın daha da güzel olacak. Çünkü biz varız." },
  { category: "biz", text: "Her tartışmadan sonra birbirimize daha sıkı sarıldığımızı fark ettin mi?" },
  { category: "biz", text: "Seninle aynı gökyüzüne bakmak bile beni mutlu ediyor." },
  { category: "biz", text: "Sen ve ben: dünyanın en güzel cümlesi." },
  { category: "biz", text: "Birlikte gittiğimiz her yer, artık bizim yerimiz." },
  { category: "biz", text: "Biz yan yana olunca zaman yavaşlıyor, ben de bunu çok seviyorum." },
  { category: "biz", text: "Bu site gibi biz de her gün biraz daha büyüyoruz." },
  { category: "biz", text: "Aktivite listemizdeki her madde, seninle biriktireceğim yeni bir anı." },
  { category: "biz", text: "Kalbimizin aynı ritimde attığını hissettiğim anlar var; en çok onları seviyorum." },
];

const TIME_ZONE = "Europe/Istanbul";

/** Seeded PRNG so the shuffled order is the same on every server restart. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ORDER: number[] = (() => {
  const order = QUOTES.map((_, i) => i);
  const random = mulberry32(14_02_2024);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
})();

/** Whole days since 1970-01-01 in Istanbul time, so the quote flips at local midnight. */
function dayNumber(date: Date): number {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE })
    .format(date)
    .split("-")
    .map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** Same quote all day; every quote is shown once before any repeats. */
export function quoteOfTheDay(date = new Date()): Quote {
  return QUOTES[ORDER[dayNumber(date) % ORDER.length]];
}
