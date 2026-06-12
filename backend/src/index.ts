import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_asm_key';

// CORS Ayarı: Local (Senaryo 1) + LAN (Senaryo 2) desteği
// Senaryo 4 (VPS)'de nginx aynı domain'den serve ettiği için CORS gerekmez
const allowedOrigins = [
  /^http:\/\/localhost(:\d+)?$/,          // Local dev
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,      // Local IP
  /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/, // LAN (192.168.x.x)
  /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,  // LAN (10.x.x.x)
  /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?$/, // LAN (172.16-31.x.x)
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, Postman, same-origin)
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some(pattern => pattern.test(origin));
    if (isAllowed) return callback(null, true);
    return callback(new Error(`CORS: ${origin} adresine izin verilmiyor.`));
  },
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Senaryo 1 & 2: Production modda frontend'i backend'den serve et
// Frontend build: cd frontend && npm run build → frontend/dist/ klasörüne çıkar
// Backend bu klasörü statik olarak sunar, böylece tek port (3000) yeterli olur
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  // Not: SPA fallback aşağıda tüm API rotalarından SONRA ekleniyor
}

// --- MULTER SETUP ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// --- MIDDLEWARE ---
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Erişim reddedildi. Lütfen giriş yapın.' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Geçersiz veya süresi dolmuş oturum.' });
    req.user = user;
    next();
  });
};

const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz bulunmuyor.' });
    }
    next();
  };
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ASM Gider Takip API is running' });
});

// --- AUTH & SETUP ROUTES ---
app.get('/api/auth/status', async (req, res) => {
  try {
    const count = await prisma.user.count();
    res.json({ isSetupComplete: count > 0 });
  } catch (err) {
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Kurulum sihirbazı için ağ IP bilgisi
app.get('/api/auth/network-info', (req, res) => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  let lanIP = '';
  for (const name of Object.keys(interfaces)) {
    for (const iface of (interfaces[name] || [])) {
      if (iface.family === 'IPv4' && !iface.internal) {
        lanIP = iface.address;
        break;
      }
    }
    if (lanIP) break;
  }
  res.json({ localIP: 'localhost', lanIP });
});

// LAN erişimini etkinleştir: Windows Güvenlik Duvarı kuralı ekle
app.post('/api/admin/lan-enable', authenticateToken, async (req: any, res: any) => {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Yetkisiz.' });

  const { exec } = require('child_process');
  const os = require('os');

  // Mevcut LAN IP'sini bul
  const interfaces = os.networkInterfaces();
  let lanIP = '';
  for (const name of Object.keys(interfaces)) {
    for (const iface of (interfaces[name] || [])) {
      if (iface.family === 'IPv4' && !iface.internal) { lanIP = iface.address; break; }
    }
    if (lanIP) break;
  }

  // Güvenlik duvarı kuralı ekle
  const cmd = `netsh advfirewall firewall delete rule name="ASM Gider Takip" >nul 2>&1 & netsh advfirewall firewall add rule name="ASM Gider Takip" dir=in action=allow protocol=TCP localport=${process.env.PORT || 3000}`;

  exec(cmd, (error: any) => {
    if (error) {
      // Yönetici yetkisi yoksa hata döner
      return res.status(500).json({
        success: false,
        error: 'Güvenlik duvarı kuralı eklenemedi. Uygulamayı yönetici olarak çalıştırın veya lan-yapilandir.bat kullanın.',
        lanIP
      });
    }
    res.json({ success: true, lanIP, port: process.env.PORT || 3000, url: `http://${lanIP}:${process.env.PORT || 3000}` });
  });
});

// ============================================================
// VERİTABANI SENARYO YÖNETİMİ (Ayarlar Paneli)
// ============================================================

// Mevcut veritabanı yapılandırmasını döndürür
app.get('/api/admin/db-config', authenticateToken, (req: any, res: any) => {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Yetkisiz.' });

  const dbUrl = process.env.DATABASE_URL || '';
  const provider = (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://'))
    ? 'postgresql'
    : 'sqlite';

  // URL'deki şifreyi maskele
  let displayUrl = dbUrl;
  if (provider === 'postgresql') {
    try {
      const url = new URL(dbUrl);
      url.password = '***';
      displayUrl = url.toString();
    } catch {}
  }

  res.json({ provider, displayUrl });
});

// Yeni veritabanı bağlantısını test eder (bağlantı açılıp kapanır, veri değişmez)
app.post('/api/admin/db-config/test', authenticateToken, async (req: any, res: any) => {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Yetkisiz.' });

  const { targetUrl, direction } = req.body;
  if (!targetUrl) return res.status(400).json({ error: 'Bağlantı URL\'si gerekli.' });

  const { exec } = require('child_process');
  const fs = require('fs');
  const backendDir = path.join(__dirname, '..');
  const prismaDir = path.join(backendDir, 'prisma');

  // Test için geçici env değişkeni ile prisma validate çalıştır
  const schemaFile = direction === 'to-postgresql'
    ? path.join(prismaDir, 'schema.postgresql.prisma')
    : path.join(prismaDir, 'schema.sqlite.prisma');

  const env = {
    ...process.env,
    DATABASE_URL: targetUrl,
    DIRECT_URL: req.body.directUrl || targetUrl,
  };

  const cmd = `npx prisma db execute --stdin --schema="${schemaFile}"`;
  const testQuery = direction === 'to-postgresql' ? 'SELECT 1;' : 'SELECT 1;';

  exec(cmd, { cwd: backendDir, env, input: testQuery, timeout: 15000 }, (error: any, stdout: any, stderr: any) => {
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Bağlantı kurulamadı. URL\'yi kontrol edin.',
        detail: stderr?.substring(0, 300) || error.message
      });
    }
    res.json({ success: true, message: 'Bağlantı başarılı!' });
  });
});

// Tam geçiş: Veri dışa aktar → Şema güncelle → Veri içe aktar
// SSE (Server-Sent Events) ile ilerlemeyi gerçek zamanlı akıtır
app.post('/api/admin/db-migrate', authenticateToken, async (req: any, res: any) => {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Yetkisiz.' });

  const { targetUrl, directUrl, direction } = req.body;
  if (!targetUrl) return res.status(400).json({ error: 'Hedef URL gerekli.' });

  // SSE başlıkları
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (msg: string, type: 'log' | 'done' | 'error' = 'log') => {
    res.write(`data: ${JSON.stringify({ type, msg })}\n\n`);
  };

  const { exec } = require('child_process');
  const fs = require('fs');

  const backendDir = path.join(__dirname, '..');
  const prismaDir  = path.join(backendDir, 'prisma');
  const dataFile   = path.join(backendDir, 'migration-data.json');
  const insertScript = path.join(backendDir, 'migration-insert.js');

  const runCmd = (cmd: string, env?: any): Promise<string> =>
    new Promise((resolve, reject) => {
      exec(cmd, { cwd: backendDir, env: env || process.env, timeout: 120000 },
        (err: any, stdout: string, stderr: string) => {
          if (err) reject(new Error(stderr?.slice(0, 400) || err.message));
          else resolve(stdout);
        }
      );
    });

  function updateEnv(url: string, direct: string, provider: string) {
    const envPath = path.join(backendDir, '.env');
    let content = fs.readFileSync(envPath, 'utf8');
    const set = (key: string, val: string) => {
      const re = new RegExp(`^${key}=.*`, 'm');
      const line = `${key}="${val}"`;
      return re.test(content) ? content.replace(re, line) : content + `\n${line}`;
    };
    content = set('DATABASE_URL', url);
    content = set('DIRECT_URL', direct || '');
    content = set('DB_PROVIDER', provider);
    fs.writeFileSync(envPath, content, 'utf8');
  }

  try {
    // ADIM 1: Mevcut verileri oku
    send('📦 Mevcut veriler okunuyor...');
    const [users, categories, expenses, exemptions] = await Promise.all([
      prisma.user.findMany(),
      prisma.category.findMany(),
      prisma.expense.findMany(),
      prisma.expenseExemption.findMany(),
    ]);
    fs.writeFileSync(dataFile, JSON.stringify({ users, categories, expenses, exemptions }, null, 2), 'utf8');
    send(`✅ ${users.length} kullanıcı, ${categories.length} kategori, ${expenses.length} gider dışa aktarıldı`);

    // ADIM 2: Uygun Prisma şemasını kopyala
    send('📝 Veritabanı şeması seçiliyor...');
    const srcSchema = direction === 'to-postgresql'
      ? path.join(prismaDir, 'schema.postgresql.prisma')
      : path.join(prismaDir, 'schema.sqlite.prisma');
    fs.copyFileSync(srcSchema, path.join(prismaDir, 'schema.prisma'));
    send(`✅ Şema güncellendi (${direction === 'to-postgresql' ? 'PostgreSQL' : 'SQLite'})`);

    // ADIM 3: .env güncelle
    send('⚙️ Yapılandırma dosyası güncelleniyor...');
    const provider = direction === 'to-postgresql' ? 'postgresql' : 'sqlite';
    updateEnv(targetUrl, directUrl || '', provider);
    send('✅ .env dosyası güncellendi');

    // ADIM 4: Prisma istemcisi oluştur
    send('🔄 Prisma istemcisi yeniden oluşturuluyor...');
    const genEnv = { ...process.env, DATABASE_URL: targetUrl, DIRECT_URL: directUrl || targetUrl };
    await runCmd('npx prisma generate', genEnv);
    send('✅ Prisma istemcisi hazır');

    // ADIM 5: Yeni veritabanında tabloları oluştur
    send('🗄️ Yeni veritabanında tablolar oluşturuluyor...');
    await runCmd('npx prisma db push --skip-generate --accept-data-loss', genEnv);
    send('✅ Tablolar oluşturuldu');

    // ADIM 6: Verileri yeni veritabanına aktar
    send('📥 Veriler yeni veritabanına aktarılıyor...');
    await runCmd(`node "${insertScript}" "${dataFile}"`, genEnv);
    send('✅ Veriler aktarıldı');

    // ADIM 7: Geçici dosyayı sil
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

    send('', 'done');
    res.end();

  } catch (err: any) {
    // Hata durumunda şemayı geri al
    try {
      const prevSchema = direction === 'to-postgresql'
        ? path.join(prismaDir, 'schema.sqlite.prisma')
        : path.join(prismaDir, 'schema.postgresql.prisma');
      if (require('fs').existsSync(prevSchema)) {
        require('fs').copyFileSync(prevSchema, path.join(prismaDir, 'schema.prisma'));
      }
    } catch {}
    if (require('fs').existsSync(dataFile)) require('fs').unlinkSync(dataFile);
    send(`❌ HATA: ${err.message}`, 'error');
    res.end();
  }
});

// ============================================================

app.post('/api/auth/setup', async (req: any, res: any) => {
  const { name, email, password, title } = req.body;
  const count = await prisma.user.count();
  if (count > 0) return res.status(400).json({ error: 'Sistem zaten kurulu.' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: 'ADMIN', title: title || 'DOKTOR', isPartner: true }
    });
    
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, name: user.name, role: user.role, title: user.title } });
  } catch (error) {
    res.status(400).json({ error: 'Kurulum hatası.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Geçersiz email veya şifre.' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Geçersiz email veya şifre.' });

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Giriş işlemi sırasında hata oluştu.' });
  }
});


// --- USER ROUTES ---
app.get('/api/users', authenticateToken, async (req: any, res: any) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json(safeUsers);
  } catch (error) {
    res.status(500).json({ error: 'Kullanıcılar getirilemedi.' });
  }
});

app.post('/api/users', authenticateToken, requireRole(['ADMIN']), async (req: any, res: any) => {
  const { name, email, password, role, title, isPartner, startDate } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role, title, isPartner, startDate: startDate ? new Date(startDate) : undefined }
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: 'Kullanıcı eklenemedi.' });
  }
});

app.put('/api/users/:id', authenticateToken, requireRole(['ADMIN']), async (req: any, res: any) => {
  const { id } = req.params;
  const { role, title, isPartner, startDate } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role, title, isPartner, startDate: startDate ? new Date(startDate) : undefined }
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: 'Kullanıcı güncellenemedi.' });
  }
});

app.delete('/api/users/:id', authenticateToken, requireRole(['ADMIN']), async (req: any, res: any) => {
  try {
    await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Kullanıcı silinemedi.' });
  }
});

app.put('/api/users/:id/role', authenticateToken, requireRole(['ADMIN']), async (req: any, res: any) => {
  const { role } = req.body;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { role }
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: 'Kullanıcı rolü güncellenemedi.' });
  }
});


// --- CATEGORY ROUTES ---
app.get('/api/categories', authenticateToken, async (req: any, res: any) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Kategoriler getirilemedi.' });
  }
});

app.put('/api/categories/reorder', authenticateToken, requireRole(['ADMIN', 'SECRETARY']), async (req: any, res: any) => {
  const { categories } = req.body;
  try {
    const transactions = categories.map((cat: any) => 
      prisma.category.update({
        where: { id: cat.id },
        data: { order: cat.order, parentId: cat.parentId }
      })
    );
    await prisma.$transaction(transactions);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Sıralama güncellenemedi.' });
  }
});

app.post('/api/categories', authenticateToken, requireRole(['ADMIN', 'SECRETARY']), async (req: any, res: any) => {
  const { name, parentId } = req.body;
  try {
    const category = await prisma.category.create({ 
      data: { 
        name,
        parentId: parentId ? parseInt(parentId) : null
      } 
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: 'Kategori oluşturulamadı.' });
  }
});

app.put('/api/categories/:id', authenticateToken, requireRole(['ADMIN', 'SECRETARY']), async (req: any, res: any) => {
  const { name } = req.body;
  try {
    const category = await prisma.category.update({
      where: { id: parseInt(req.params.id) },
      data: { name }
    });
    res.json(category);
  } catch (error) {
    res.status(400).json({ error: 'Kategori güncellenemedi.' });
  }
});

app.delete('/api/categories/:id', authenticateToken, requireRole(['ADMIN', 'SECRETARY']), async (req: any, res: any) => {
  try {
    await prisma.category.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Kategori silinemedi.' });
  }
});


// --- EXPENSE & REPORTS ROUTES ---
app.get('/api/reports', authenticateToken, async (req: any, res: any) => {
  const month = req.query.month ? parseInt(req.query.month as string) : null;
  const year = req.query.year ? parseInt(req.query.year as string) : null;
  const startDateStr = req.query.startDate as string;
  const endDateStr = req.query.endDate as string;
  
  let startDate: Date;
  let endDate: Date;

  if (startDateStr && endDateStr) {
    startDate = new Date(startDateStr);
    endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);
  } else if (month && year) {
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0, 23, 59, 59);
  } else {
    return res.status(400).json({ error: 'Geçerli bir tarih aralığı veya Ay/Yıl gereklidir.' });
  }

  try {

    const users = await prisma.user.findMany({
      where: { isPartner: true }
    });

    let totalExpense = 0;
    
    const expenses = await prisma.expense.findMany({
      where: {
        date: { gte: startDate, lte: endDate }
      },
      include: { exemptions: true }
    });

    const userMap: any = {};
    users.forEach(u => {
      userMap[u.id] = { id: u.id, name: u.name, title: u.title, totalPaid: 0, totalShare: 0, balance: 0 };
    });

    expenses.forEach(exp => {
      totalExpense += exp.amount;
      const exemptIds = exp.exemptions.map(e => e.userId);
      
      let totalWeight = 0;
      const weights: any = {};
      
      users.forEach(u => {
        if (exemptIds.includes(u.id)) {
           weights[u.id] = 0;
           return;
        }
        
        let weight = 0;
        if (exp.periodStart && exp.periodEnd) {
          const start = exp.periodStart.getTime();
          const end = exp.periodEnd.getTime();
          const uStart = u.startDate ? u.startDate.getTime() : 0;
          
          const overlapStart = Math.max(start, uStart);
          const overlapEnd = end;
          if (overlapStart <= overlapEnd) {
            weight = overlapEnd - overlapStart;
          }
        } else {
          // Period yoksa: Masraf tarihinde ASM'de var mı?
          if (u.startDate && u.startDate.getTime() <= exp.date.getTime()) {
            weight = 1;
          }
        }
        weights[u.id] = weight;
        totalWeight += weight;
      });
      
      if (totalWeight > 0) {
        users.forEach(u => {
          const share = (weights[u.id] / totalWeight) * exp.amount;
          userMap[u.id].totalShare += share;
        });
      }
    });

    const sums = await prisma.expense.groupBy({
      by: ['userId'],
      _sum: { amount: true },
      where: {
        userId: { not: null },
        date: { gte: startDate, lte: endDate }
      }
    });

    sums.forEach(s => {
      if (userMap[s.userId!]) {
        userMap[s.userId!].totalPaid = s._sum.amount || 0;
      }
    });

    Object.values(userMap).forEach((u: any) => {
      u.balance = u.totalPaid - u.totalShare;
    });

    res.json({
      totalExpense,
      userBalances: Object.values(userMap)
    });
  } catch (error) {
    res.status(500).json({ error: 'Rapor oluşturulamadı.' });
  }
});

app.get('/api/expenses', authenticateToken, async (req: any, res: any) => {
  try {
    const { year, startDate, endDate } = req.query;
    const filter: any = {};
    
    if (startDate && endDate) {
      const s = new Date(startDate as string);
      const e = new Date(endDate as string);
      e.setHours(23, 59, 59, 999);
      filter.date = {
        gte: s,
        lte: e
      };
    } else if (year) {
      const y = parseInt(year);
      filter.date = {
        gte: new Date(y, 0, 1),
        lt: new Date(y + 1, 0, 1)
      };
    }
    const expenses = await prisma.expense.findMany({
      where: filter,
      include: { user: { select: { id: true, name: true } }, category: true },
      orderBy: { date: 'desc' }
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Masraflar getirilemedi.' });
  }
});

// Dosya yükleme özelliği geçici olarak devre dışı bırakıldı
// İleride Supabase Storage veya S3 ile yeniden aktive edilecek
app.post('/api/upload', authenticateToken, (req: any, res: any) => {
  res.status(503).json({ error: 'Dosya yükleme özelliği geçici olarak devre dışıdır.' });
});

app.post('/api/expenses', authenticateToken, async (req: any, res: any) => {
  const { amount, description, categoryId, date, userId, exemptUserIds, periodStart, periodEnd, receiptUrl, isRecurring, recurringInterval, recurringEndDate } = req.body;
  
  const targetUserId = userId === 'JOINT' ? null : parseInt(userId);
  
  if (req.user.role !== 'ADMIN') {
    if (targetUserId !== req.user.id) {
      return res.status(403).json({ error: 'Sadece kendi adınıza masraf girebilirsiniz.' });
    }
  }

  try {
    const expensesToCreate = [];
    const recurringGroupId = isRecurring ? Date.now().toString() + Math.random().toString(36).substring(7) : null;
    
    let currentDate = new Date(date);
    const endDate = isRecurring && recurringEndDate ? new Date(recurringEndDate) : currentDate;
    
    // Güvenlik: Maksimum 24 ay ileriye kayıt oluşturulabilsin (sonsuz döngüyü önlemek için)
    let loopCount = 0;
    const MAX_RECURRING = 24;

    while (currentDate <= endDate && loopCount < MAX_RECURRING) {
      expensesToCreate.push({
        amount: parseFloat(amount),
        description,
        categoryId: parseInt(categoryId),
        date: new Date(currentDate),
        userId: targetUserId,
        periodStart: periodStart ? new Date(periodStart) : null,
        periodEnd: periodEnd ? new Date(periodEnd) : null,
        receiptUrl,
        recurringGroupId
      });

      if (!isRecurring) break;
      
      if (recurringInterval === 'YEARLY') {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
      } else {
        // Varsayılan MONTHLY
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      loopCount++;
    }

    const createdExpenses = [];
    // Prisma SQLite'da bulk insert + relation (exemptions) desteklemediği için tek tek oluşturacağız
    for (const expData of expensesToCreate) {
      const expense = await prisma.expense.create({
        data: {
          ...expData,
          exemptions: exemptUserIds?.length > 0 ? {
            create: exemptUserIds.map((id: number) => ({ userId: parseInt(id as any) }))
          } : undefined
        }
      });
      createdExpenses.push(expense);
    }

    res.json(createdExpenses[0]);
  } catch (error) {
    res.status(400).json({ error: 'Masraf eklenemedi.' });
  }
});

app.delete('/api/expenses/:id', authenticateToken, async (req: any, res: any) => {
  const { deleteAllRecurring } = req.query;
  const id = parseInt(req.params.id);

  try {
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) return res.status(404).json({ error: 'Masraf bulunamadı.' });

    if (req.user.role !== 'ADMIN' && expense.userId !== req.user.id) {
      return res.status(403).json({ error: 'Bu masrafı silme yetkiniz yok.' });
    }

    if (deleteAllRecurring === 'true' && expense.recurringGroupId) {
      await prisma.expense.deleteMany({
        where: {
          recurringGroupId: expense.recurringGroupId,
          date: { gte: expense.date } // Sadece bu tarihten sonrakileri sil
        }
      });
    } else {
      await prisma.expense.delete({ where: { id } });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Masraf silinemedi.' });
  }
});

app.put('/api/expenses/:id', authenticateToken, async (req: any, res: any) => {
  const { updateAllRecurring } = req.query;
  const id = parseInt(req.params.id);
  const { amount, description, categoryId, periodStart, periodEnd } = req.body;

  try {
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) return res.status(404).json({ error: 'Masraf bulunamadı.' });

    if (req.user.role !== 'ADMIN' && expense.userId !== req.user.id) {
      return res.status(403).json({ error: 'Bu masrafı düzenleme yetkiniz yok.' });
    }

    if (updateAllRecurring === 'true' && expense.recurringGroupId) {
      await prisma.expense.updateMany({
        where: {
          recurringGroupId: expense.recurringGroupId,
          date: { gte: expense.date }
        },
        data: {
          amount: amount ? parseFloat(amount) : undefined,
          description,
          categoryId: categoryId ? parseInt(categoryId) : undefined,
          periodStart: periodStart ? new Date(periodStart) : null,
          periodEnd: periodEnd ? new Date(periodEnd) : null
        }
      });
    } else {
      await prisma.expense.update({
        where: { id },
        data: {
          amount: amount ? parseFloat(amount) : undefined,
          description,
          categoryId: categoryId ? parseInt(categoryId) : undefined,
          periodStart: periodStart ? new Date(periodStart) : null,
          periodEnd: periodEnd ? new Date(periodEnd) : null
        }
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Masraf güncellenemedi.' });
  }
});



// SPA Fallback: Production modda Vue Router için tüm bilinmeyen route'ları index.html'e yönlendir
// app.use ile yapıyoruz çünkü Express v5 wildcard syntax'ı değişti
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use((req: any, res: any, next: any) => {
    // API ve uploads yollarını geç
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(port, '0.0.0.0', () => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  let lanIP = '';
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        lanIP = iface.address;
        break;
      }
    }
    if (lanIP) break;
  }
  
  console.log('\n========================================');
  console.log('  ASM Gider Takip Sistemi Başladı!');
  console.log('========================================');
  console.log(`  Yerel Erişim:  http://localhost:${port}`);
  if (lanIP) {
    console.log(`  Ağ Erişimi:    http://${lanIP}:${port}`);
  }
  console.log('========================================\n');
});
