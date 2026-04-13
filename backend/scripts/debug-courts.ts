import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
  const courts = await prisma.court.findMany();
  const availabilities = await prisma.courtAvailability.count();
  
  console.log('--- Database Debug ---');
  console.log('Total Courts:', courts.length);
  console.log('Total Availabilities:', availabilities);
  
  if (courts.length > 0) {
    console.log('Corts List:', JSON.stringify(courts.map(c => ({ id: c.id, name: c.name, status: c.status })), null, 2));
  } else {
    console.log('NO COURTS FOUND IN DATABASE');
  }
}

debug()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
