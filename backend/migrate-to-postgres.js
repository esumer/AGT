/**
 * SQLite → PostgreSQL Veri Taşıma Scripti
 * 
 * Kullanım:
 * 1. backend/.env dosyasına iki DATABASE_URL ekleyin:
 *    SQLITE_URL="file:./prisma/dev.db"
 *    DATABASE_URL="postgresql://..."  (Supabase veya diğer)
 * 
 * 2. Schema'yı PostgreSQL'e geçirin:
 *    npx prisma migrate dev --name init_postgresql
 * 
 * 3. Bu scripti çalıştırın:
 *    node migrate-to-postgres.js
 */

const Database = require('better-sqlite3');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const SQLITE_PATH = path.join(__dirname, 'prisma', 'dev.db');

if (!fs.existsSync(SQLITE_PATH)) {
  console.error('SQLite veritabanı bulunamadı:', SQLITE_PATH);
  process.exit(1);
}

const sqlite = new Database(SQLITE_PATH, { readonly: true });
const prisma = new PrismaClient();

async function migrate() {
  console.log('SQLite → PostgreSQL migrasyonu başlıyor...\n');

  try {
    // 1. Kategoriler
    console.log('[1/4] Kategoriler taşınıyor...');
    const categories = sqlite.prepare('SELECT * FROM Category ORDER BY id').all();
    console.log(`  ${categories.length} kategori bulundu.`);
    
    // Önce ana kategoriler
    const parentCats = categories.filter(c => !c.parentId);
    for (const cat of parentCats) {
      await prisma.category.upsert({
        where: { id: cat.id },
        update: { name: cat.name, order: cat.order || 0 },
        create: { id: cat.id, name: cat.name, parentId: null, order: cat.order || 0 }
      });
    }
    
    // Sonra alt kategoriler
    const childCats = categories.filter(c => c.parentId);
    for (const cat of childCats) {
      await prisma.category.upsert({
        where: { id: cat.id },
        update: { name: cat.name, order: cat.order || 0, parentId: cat.parentId },
        create: { id: cat.id, name: cat.name, parentId: cat.parentId, order: cat.order || 0 }
      });
    }
    console.log(`  ✓ ${categories.length} kategori taşındı.`);

    // 2. Kullanıcılar
    console.log('\n[2/4] Kullanıcılar taşınıyor...');
    const users = sqlite.prepare('SELECT * FROM User ORDER BY id').all();
    console.log(`  ${users.length} kullanıcı bulundu.`);
    
    for (const user of users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {
          name: user.name,
          email: user.email,
          password: user.password,
          title: user.title || 'DOKTOR',
          role: user.role || 'USER',
          isPartner: user.isPartner === 1 || user.isPartner === true,
          startDate: user.startDate ? new Date(user.startDate) : new Date(),
        },
        create: {
          id: user.id,
          name: user.name,
          email: user.email,
          password: user.password,
          title: user.title || 'DOKTOR',
          role: user.role || 'USER',
          isPartner: user.isPartner === 1 || user.isPartner === true,
          startDate: user.startDate ? new Date(user.startDate) : new Date(),
        }
      });
    }
    console.log(`  ✓ ${users.length} kullanıcı taşındı.`);

    // 3. Masraflar
    console.log('\n[3/4] Masraflar taşınıyor...');
    const expenses = sqlite.prepare('SELECT * FROM Expense ORDER BY id').all();
    console.log(`  ${expenses.length} masraf bulundu.`);
    
    for (const exp of expenses) {
      await prisma.expense.upsert({
        where: { id: exp.id },
        update: {
          amount: exp.amount,
          date: new Date(exp.date),
          periodStart: exp.periodStart ? new Date(exp.periodStart) : null,
          periodEnd: exp.periodEnd ? new Date(exp.periodEnd) : null,
          description: exp.description,
          receiptUrl: null, // Dosya yüklemeleri taşınmıyor
          recurringGroupId: exp.recurringGroupId,
          userId: exp.userId,
          categoryId: exp.categoryId,
        },
        create: {
          id: exp.id,
          amount: exp.amount,
          date: new Date(exp.date),
          periodStart: exp.periodStart ? new Date(exp.periodStart) : null,
          periodEnd: exp.periodEnd ? new Date(exp.periodEnd) : null,
          description: exp.description,
          receiptUrl: null,
          recurringGroupId: exp.recurringGroupId,
          userId: exp.userId,
          categoryId: exp.categoryId,
        }
      });
    }
    console.log(`  ✓ ${expenses.length} masraf taşındı.`);

    // 4. Muafiyetler
    console.log('\n[4/4] Muafiyetler taşınıyor...');
    const exemptions = sqlite.prepare('SELECT * FROM ExpenseExemption ORDER BY id').all();
    console.log(`  ${exemptions.length} muafiyet bulundu.`);
    
    for (const ex of exemptions) {
      await prisma.expenseExemption.upsert({
        where: { id: ex.id },
        update: { expenseId: ex.expenseId, userId: ex.userId },
        create: { id: ex.id, expenseId: ex.expenseId, userId: ex.userId }
      });
    }
    console.log(`  ✓ ${exemptions.length} muafiyet taşındı.`);

    console.log('\n========================================');
    console.log('  Migrasyon başarıyla tamamlandı!');
    console.log('========================================');
    console.log('\nKontrol için: npx prisma studio');

  } catch (error) {
    console.error('\n[HATA] Migrasyon sırasında hata:', error);
    throw error;
  } finally {
    sqlite.close();
    await prisma.$disconnect();
  }
}

migrate().catch(console.error);
