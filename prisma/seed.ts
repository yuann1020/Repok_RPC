import { PrismaClient, CourtType, CourtStatus, CourtCategory, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding courts...');

  const baseFacilities = [
    'Lighting',
    'Seating area',
    'Parking',
    'Shower/Restroom',
  ];

  // Temporary placeholder prices
  const standardPrice = 50.00;
  const championshipPrice = 80.00;

  const courtsData = [
    { name: 'Court 1', category: CourtCategory.STANDARD, pricePerHour: standardPrice },
    { name: 'Court 2', category: CourtCategory.STANDARD, pricePerHour: standardPrice },
    { name: 'Court 3', category: CourtCategory.CHAMPIONSHIP, pricePerHour: championshipPrice },
    { name: 'Court 4', category: CourtCategory.CHAMPIONSHIP, pricePerHour: championshipPrice },
    { name: 'Court 5', category: CourtCategory.STANDARD, pricePerHour: standardPrice },
    { name: 'Court 6', category: CourtCategory.STANDARD, pricePerHour: standardPrice },
  ];

  for (const court of courtsData) {
    const courtAttributes = {
      name: court.name,
      category: court.category,
      pricePerHour: court.pricePerHour,
      status: CourtStatus.ACTIVE,
      courtType: CourtType.INDOOR, // All courts INDOOR
      facilities: baseFacilities,
    };

    // We manually check and update because 'name' is not a @unique constraint in the schema.
    // If it were unique, we could use prisma.court.upsert({ where: { name: court.name } }) directly.
    const existingCourt = await prisma.court.findFirst({
      where: { name: court.name },
    });

    if (existingCourt) {
      await prisma.court.update({
        where: { id: existingCourt.id },
        data: courtAttributes,
      });
      console.log(`Updated ${court.name} (${court.category})`);
    } else {
      await prisma.court.create({
        data: courtAttributes,
      });
      console.log(`Created ${court.name} (${court.category})`);
    }
  }

  // --- Seed Admin User ---
  console.log('Seeding admin user...');
  const adminEmail = 'admin@example.com';
  const adminPassword = 'Admin123!';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: Role.ADMIN,
    },
    create: {
      email: adminEmail,
      fullName: 'System Admin',
      passwordHash,
      role: Role.ADMIN,
    },
  });
  console.log(`Admin user seeded: ${adminEmail} / ${adminPassword}`);

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
