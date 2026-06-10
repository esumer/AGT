const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.user.updateMany({
    data: { startDate: new Date('2000-01-01T00:00:00.000Z') }
  });
  console.log("Migration complete: All users start dates set to 2000-01-01.");
}
run();
