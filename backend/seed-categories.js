const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

const defaultCategories = [
  "Personel Maaş",
  "Sigorta Primi",
  "Muhtasar",
  "Muhasebe Ücreti",
  "Doğalgaz",
  "Elektrik",
  "Su",
  "Sabit Telefon",
  "Mobil Telefon",
  "İnternet",
  "Tıbbi Atık",
  "Kira",
  "Çay - Şeker",
  "Temizlik Malzemesi",
  "Sarf Giderleri",
  "Tıbbi Malzeme",
  "Diğer Giderler"
];

async function seed() {
  console.log("Kategoriler kontrol ediliyor...");
  for (const catName of defaultCategories) {
    const exists = await prisma.category.findFirst({
      where: { name: catName }
    });
    if (!exists) {
      await prisma.category.create({
        data: { name: catName }
      });
      console.log(`Eklendi: ${catName}`);
    }
  }
  console.log("Kategori seed işlemi tamamlandı.");
  
  // Uploads klasörünü oluştur
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log("uploads klasörü oluşturuldu.");
  }
}

seed()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
