const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAutoApprove() {
  try {
    const flag = await prisma.featureFlag.findUnique({
      where: { name: 'organizer-auto-approve' }
    });
    console.log('Auto-approve flag:', JSON.stringify(flag, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAutoApprove();
