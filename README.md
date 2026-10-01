# Bizim Sitemiz 💕

Sevgiline sürpriz, zamanla büyüyen kişisel bir site.

- **Giriş:** Auth0 (herkes kayıt olabilir, her hesap sadece kendi verisini görür)
- **Fotoğraflar:** hesaba özel yükleme + masonry galeri (Supabase Storage, özel bucket)
- **Oyunlar:** fotoğraflardan puzzle (3×3 / 4×4 / 5×5), skor ve rekor
- **Aktiviteler:** birlikte yapılacaklar listesi + "rastgele seç"
- **Hava durumu:** tarayıcı konumuna göre (Open-Meteo, anahtar gerekmez)
- **Günün sözü:** `lib/daily-quotes.ts` içindeki 135 sözden her gün biri (İstanbul saatiyle gece yarısı değişir)
- **Arkadaşlar:** kodla arkadaş ekleme; her arkadaşla ayrı ortak alan — ortak albüm, ortak liste, notlar, puzzle yarışması

Next.js 16 · Tailwind v4 · shadcn/ui · framer-motion · dnd-kit · 21st.dev bileşenleri

## Kurulum

### 1. Auth0

1. [manage.auth0.com](https://manage.auth0.com) → **Applications → Create Application → Regular Web Application**
2. **Settings** sekmesinde:
   - Allowed Callback URLs: `http://localhost:3000/auth/callback`
   - Allowed Logout URLs: `http://localhost:3000`
   - Allowed Web Origins: `http://localhost:3000`
3. Domain, Client ID ve Client Secret'ı not al.

### 2. Supabase

1. [supabase.com](https://supabase.com) → yeni proje
2. **SQL Editor** → sırayla `supabase/migrations/0001_init.sql`, `0002_friends.sql` ve `0003_notifications.sql`
   içeriğini yapıştırıp **Run** (tablolar, özel `photos` bucket'ı, arkadaşlık ve bildirim tabloları)
3. **Project Settings → API**: Project URL, `anon` key ve `service_role` key'i not al.

### 3. Ortam değişkenleri

```powershell
Copy-Item .env.local.example .env.local
```

`.env.local` dosyasını doldur. `AUTH0_SECRET` için:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Çalıştır

```powershell
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000)

## Açılış sayfası fotoğrafları

Ortak fotoğraflarınızı `public/images/ours/` klasörüne atın (jpg/png/webp). Alfabetik sırayla
ilk 7 tanesi açılış sayfasındaki yelpaze galeride görünür; klasör boşsa kalpli kartlar gösterilir.

> Not: Açılış sayfası giriş yapmadan da görünür, bu yüzden buraya koyduğunuz fotoğraflar
> siteyi açan herkese açıktır. Özel fotoğraflar için giriş yapıp **Fotoğraflar** sayfasını kullanın.

## Yeni oyun eklemek

1. `app/(app)/games/<oyun-adı>/page.tsx` oluştur
2. `lib/games.ts` içindeki `GAMES` listesine bir satır ekle — oyun menüsünde otomatik görünür

## Arkadaşlık sistemi

- Her kullanıcının girişte otomatik oluşan bir profili ve `K7Q2-M9XP` biçiminde bir arkadaş kodu var
  (`/friends` sayfasında; görünen ad oradan değiştirilebilir).
- `photos` ve `activities` tablolarında `friendship_id` boşsa içerik kişisel, doluysa o arkadaşlığın ortak alanına ait.
- Ortak içeriğe erişim her zaman `lib/friends.ts` içindeki `findFriendship` / `requireFriendship` kontrolünden geçer.
- Arkadaşlık bitirilince ortak fotoğraf ve aktiviteler ekleyen kişinin kişisel alanına döner, notlar silinir.

## Anlık bildirimler

- Menüdeki 🔔 okunmamış sayısını gösterir; tıklayınca açılır pencerede son 20 bildirim listelenir.
- Bildirim türleri: arkadaşlık isteği/kabulü, yeni not, ortak albüme fotoğraf, ortak listeye aktivite,
  aktivitenin tamamlanması, puzzle rekorunun kırılması (`lib/notifications.ts`).
- Anlık iletim Supabase Realtime **Broadcast** ile: sunucu, alıcının gizli kanalına (sunucu sırrıyla türetilen ad)
  veri içermeyen bir "ping" yollar; tarayıcı bildirimleri kendi oturumuyla sunucudan çeker ve açık sayfayı
  yenilemeden günceller. Bildirim gönderimi `after()` ile yanıttan sonra çalışır, işlemleri yavaşlatmaz.

## Mimari notlar

- Supabase'e **sadece sunucudan** (server actions) `service_role` ile erişilir; her sorgu
  Auth0 kullanıcı kimliğiyle (`session.user.sub`) filtrelenir. Tablolarda RLS açık ve hiç policy
  yok, yani tarayıcıdan doğrudan veritabanı erişimi kapalıdır.
- Fotoğraflar tarayıcıda küçültülüp (en fazla 1800px, WEBP) sunucunun ürettiği tek kullanımlık
  imzalı URL ile doğrudan Supabase Storage'a yüklenir; görüntüleme 1 saatlik imzalı URL'lerle yapılır.
- `proxy.ts` (Next 16'da `middleware.ts`'in yeni adı) Auth0 rotalarını (`/auth/*`) yönetir.
