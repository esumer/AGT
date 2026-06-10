const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.user.updateMany({
    where: { role: 'SECRETARY' },
    data: { role: 'USER', title: 'TIBBİ SEKRETER', isPartner: false }
  });
  await prisma.user.updateMany({
    where: { role: 'DOCTOR' },
    data: { role: 'USER', title: 'DOKTOR', isPartner: true }
  });
  // ADMIN users already have role='ADMIN', we just ensure their title is 'DOKTOR' and isPartner=true
  await prisma.user.updateMany({
    where: { role: 'ADMIN' },
    data: { title: 'DOKTOR', isPartner: true }
  });
  console.log("Migration complete.");
}
run();
