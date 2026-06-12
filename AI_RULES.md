# AI Asistan Kuralları — ASM Gider Takip Projesi

Bu dosya tüm AI araçları (Claude, Cursor, Cline vb.) için ortak kuralları içerir.

---

## 🌐 Dil Kuralları

- Kullanıcıyla olan tüm iletişimde **Türkçe** kullan.
- Kod açıklamaları (yorum satırları) **Türkçe** yazılmalıdır.
- Değişken, fonksiyon ve dosya isimleri İngilizce olabilir (standart yazılım pratiği).

---

## 📝 Git Commit Mesajı Kuralları

- Tüm commit mesajları **Türkçe** yazılmalıdır.
- Mesajlar **tek cümle** ve **öz** olmalıdır.
- Mesaj, yapılan ana değişikliği net şekilde özetlemelidir.
- **Örnek format:** `Gider kalemleri özeti tablosundaki kategoriler hiyerarşik olarak sıralandı.`
- Commit prefix kullanılacaksa Türkçe karşılıkları tercih edilir:
  - `feat:` → `özellik:`
  - `fix:` → `düzeltme:`
  - `refactor:` → `yeniden düzenleme:`
  - `docs:` → `belge:`
  - `chore:` → `bakım:`

---

## 🏗️ Proje Mimarisi

Bu proje **ASM Gider Takip** uygulamasıdır:
- **Backend:** Node.js / Express (`/backend`)
- **Frontend:** HTML/CSS/JS veya React (`/frontend`)
- Deployment: LAN tabanlı, `baslat.bat` ile başlatılır.

---

## 🤖 Kod Üretimi Kuralları

- Mevcut kodun stiline ve formatına uy.
- Gereksiz bağımlılık ekleme; mevcut paketleri tercih et.
- Her önemli fonksiyona kısa açıklama satırı ekle.
- Değişiklikleri küçük, test edilebilir adımlar hâlinde yap.
- Hassas bilgileri (şifre, API anahtarı vb.) asla koda gömmeyeceksin — `.env` kullan.

---

## ✅ Genel Prensipler

- Önce anla, sonra kod yaz.
- Emin olmadığın durumlarda sormayı tercih et.
- Büyük değişiklikler öncesinde kısa bir plan sun.
