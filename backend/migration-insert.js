/**
 * migration-insert.js
 * Bu script, prisma db push'tan SONRA çalışır.
 * JSON formatında export edilmiş verileri yeni veritabanına aktarır.
 * Çağrılma: node migration-insert.js <veri-dosyası>
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const dataFile = process.argv[2] || path.join(__dirname, 'migration-data.json');

if (!fs.existsSync(dataFile)) {
  console.error('HATA: Veri dosyası bulunamadı:', dataFile);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
const prisma = new PrismaClient();

// Kategorileri bağımlılık sırasına göre sırala (önce parent'lar)
function sortCategories(cats) {
  const result = [];
  const map = new Map(cats.map(c => [c.id, c]));
  const visited = new Set();

  function visit(cat) {
    if (visited.has(cat.id)) return;
    if (cat.parentId && map.has(cat.parentId)) {
      visit(map.get(cat.parentId));
    }
    visited.add(cat.id);
    result.push(cat);
  }

  for (const cat of cats) visit(cat);
  return result;
}

async function main() {
  const dbUrl = process.env.DATABASE_URL || '';
  const isPostgres = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://');

  console.log('Hedef veritabanı:', isPostgres ? 'PostgreSQL (Supabase)' : 'SQLite (Yerel)');
  console.log('---');

  // 1. Kategoriler (önce parent'lar)
  const sortedCats = sortCategories(data.categories || []);
  console.log(Kategoriler aktarılıyor:  adet);
  for (const cat of sortedCats) {
    const { expenses, children, parent, ...catData } = cat;
    await prisma.category.upsert({
      where: { id: catData.id },
      create: catData,
      update: catData,
    });
  }
  console.log('✓ Kategoriler tamam');

  // 2. Kullanıcılar
  console.log(Kullanıcılar aktarılıyor:  adet);
  for (const user of data.users || []) {
    const { expenses, exemptions, ...userData } = user;
    // Tarih alanlarını düzgün parse et
    if (userData.startDate) userData.startDate = new Date(userData.startDate);
    if (userData.createdAt) userData.createdAt = new Date(userData.createdAt);
    await prisma.user.upsert({
      where: { id: userData.id },
      create: userData,
      update: userData,
    });
  }
  console.log('✓ Kullanıcılar tamam');

  // 3. Giderler
  console.log(Giderler aktarılıyor:  adet);
  for (const expense of data.expenses || []) {
    const { exemptions, user, category, ...expenseData } = expense;
    if (expenseData.date) expenseData.date = new Date(expenseData.date);
    if (expenseData.periodStart) expenseData.periodStart = new Date(expenseData.periodStart);
    if (expenseData.periodEnd) expenseData.periodEnd = new Date(expenseData.periodEnd);
    if (expenseData.createdAt) expenseData.createdAt = new Date(expenseData.createdAt);
    await prisma.expense.upsert({
      where: { id: expenseData.id },
      create: expenseData,
      update: expenseData,
    });
  }
  console.log('✓ Giderler tamam');

  // 4. Muafiyetler
  console.log(Muafiyetler aktarılıyor:  adet);
  for (const ex of data.exemptions || []) {
    const { expense, user, ...exData } = ex;
    await prisma.expenseExemption.upsert({
      where: { id: exData.id },
      create: exData,
      update: exData,
    });
  }
  console.log('✓ Muafiyetler tamam');

  // 5. PostgreSQL otomatik artım sırasını sıfırla
  if (isPostgres) {
    console.log('PostgreSQL dizileri sıfırlanıyor...');
    await prisma.SELECT setval(pg_get_serial_sequence('"User"', 'id'), COALESCE(MAX(id), 1)) FROM "User";
    await prisma.SELECT setval(pg_get_serial_sequence('"Category"', 'id'), COALESCE(MAX(id), 1)) FROM "Category";
    await prisma.SELECT setval(pg_get_serial_sequence('"Expense"', 'id'), COALESCE(MAX(id), 1)) FROM "Expense";
    await prisma.SELECT setval(pg_get_serial_sequence('"ExpenseExemption"', 'id'), COALESCE(MAX(id), 1)) FROM "ExpenseExemption";
    console.log('✓ Diziler sıfırlandı');
  }

  console.log('---');
  console.log('TAMAMLANDI: Tüm veriler aktarıldı.');
}

main()
  .then(() => {
    prisma.();
    process.exit(0);
  })
  .catch((e) => {
    console.error('HATA:', e.message);
    prisma.();
    process.exit(1);
  });
