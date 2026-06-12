# ASM Gider Takip — Dağıtım & Kurulum Kılavuzu

## Hızlı Başlangıç

**Gereksinim:** [Node.js 18+](https://nodejs.org/tr/download) yüklü olmalı.

---

## Senaryo 1 — Tek Bilgisayar (En Basit)

Tek bir bilgisayarda hem sunucu hem de arayüz çalışır. İnternet bağlantısı gerekmez.

### Kurulum (Tek Seferlik)

```
kur.bat  →  Çift tıkla, bekle, bitti.
```

### Her Gün Kullanım

```
baslat-production.bat  →  Çift tıkla
Tarayıcıda: http://localhost:3000
```

> **Not:** `baslat-production.bat` penceresini kapatmayın. Kapatınca program durur.

---

## Senaryo 2 — Ağdaki Diğer Bilgisayarlar da Bağlanacak (LAN)

Kliniğinizdeki tüm bilgisayarlar aynı programa bağlanır. Program **tek bir bilgisayarda** çalışır.

### A) İlk Kurulum

1. Sunucu olacak bilgisayarda `kur.bat`'ı çalıştır
2. Sağ tıkla → **Yönetici olarak çalıştır:** `lan-yapilandir.bat`
3. Sorulduğunda **"E"** yaz — frontend URL'i günceller ve yeniden derler
4. Sunucu bilgisayarına **statik IP** ata (aşağıya bak)

### B) Statik IP Atama (Windows)

```
Denetim Masası → Ağ ve Paylaşım Merkezi
  → Bağdaştırıcı Ayarlarını Değiştir
  → Ethernet (sağ tık) → Özellikler
  → İnternet Protokolü Sürüm 4 (TCP/IPv4) → Özellikler
  → Aşağıdaki IP adresini kullan:

     IP adresi    : 192.168.1.100   (router'ınıza göre değişir)
     Alt ağ maskesi: 255.255.255.0
     Varsayılan ağ geçidi: 192.168.1.1   (router IP'niz)
     DNS: 8.8.8.8
```

### C) Diğer Bilgisayarlardan Erişim

Sunucu IP'si `192.168.1.100` ise, diğer bilgisayarlarda tarayıcıya yaz:
```
http://192.168.1.100:3000
```

### D) Açılışta Otomatik Başlatma (NSSM ile)

1. [NSSM İndir](https://nssm.cc/download) → `win64/nssm.exe` dosyasını `tools/nssm.exe` olarak kopyala
2. Sağ tıkla → **Yönetici olarak çalıştır:** `nssm-servis-kur.bat`
3. Artık bilgisayar açıldığında program otomatik başlar, kimse login olmak zorunda kalmaz

**Servis yönetimi:**
```
sc query ASM-Gider-Takip    → Durum kontrol
sc stop ASM-Gider-Takip     → Durdur
sc start ASM-Gider-Takip    → Başlat
```

---

## Senaryo 3 — Supabase (Bulut Veritabanı)

Veriler internette saklanır. Farklı konumlardaki bilgisayarlar bağlanabilir.

### Gereksinimler
- [Supabase](https://supabase.com) hesabı (ücretsiz plan yeterli)

### A) Supabase Projesi Oluştur

1. [app.supabase.com](https://app.supabase.com) → Yeni Proje
2. `Settings → Database → Connection String → URI` kısmından:
   - **Transaction mode** URL'ini kopyala → `DATABASE_URL` 
   - **Session mode** URL'ini kopyala → `DIRECT_URL`

### B) backend/.env Güncelle

```env
DATABASE_URL="postgresql://postgres.[ref]:[pass]@...pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[pass]@db.[ref].supabase.co:5432/postgres"
```

### C) Prisma Schema Güncelle

`backend/prisma/schema.prisma` dosyasında:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### D) Mevcut Verileri Taşı (SQLite → PostgreSQL)

```bash
cd backend
node migrate-to-postgres.js
```

### E) Schema'yı Oluştur

```bash
cd backend
npx prisma db push
npx prisma generate
```

---

## Dosya Açıklamaları

| Dosya | Amaç |
|-------|------|
| `kur.bat` | İlk kurulum (bağımlılıklar + DB + build) |
| `baslat-production.bat` | Programı başlat (Senaryo 1) |
| `lan-yapilandir.bat` | LAN için Güvenlik Duvarı + IP ayarı |
| `nssm-servis-kur.bat` | Windows servisi olarak kur (oto-başlat) |
| `backend/.env` | Sunucu ayarları (JWT, DB bağlantısı, port) |
| `frontend/.env.production` | Arayüzün API adresini belirler |
| `backend/migrate-to-postgres.js` | SQLite → PostgreSQL veri taşıma |

---

## Sık Sorulan Sorular

**S: Programı kapattım, veriler kayboldu mu?**  
C: Hayır. Veriler `backend/prisma/dev.db` dosyasında. Silinmediği sürece güvendeler.

**S: Hangi port kullanılıyor?**  
C: Varsayılan port **3000**. `backend/.env` içinde `PORT=3000` ile değiştirilebilir.

**S: JWT_SECRET nedir?**  
C: Oturum şifrelemesi için kullanılan gizli anahtar. `backend/.env` içinde **mutlaka** benzersiz, güçlü bir değerle değiştirin.

**S: Kaç kişi aynı anda bağlanabilir?**  
C: SQLite ile 10-15 eşzamanlı kullanıcı sorunsuz çalışır. Daha fazlası için Supabase'e geçin.
